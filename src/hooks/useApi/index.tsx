'use client'
import { useState, useCallback, useEffect, useRef } from "react";
import apiClient from "@/lib/axiosClients";
import { 
    UseApiDataOptions,
    UseApiDataReturn,
    MutationOptions
} from './types';
import { ApiParams, ApiResponse, LoadingState, SingleApiResponse } from "@/types/common";

import {
    buildBaseURL,
    buildFetchURL,
    handleApiError,
    createOptimisticItem
} from './utils';

export const useApiData = <T extends object = object>(
    endpoint: string, 
    options: UseApiDataOptions = {}
): UseApiDataReturn<T> => {
    const {
        enableFetch = false,
        pagination = false,
        limitItems = null,
        initialParams = {},
        resourceId = null,
        refetchOnWindowFocus = false,
        refetchOnReconnect = false,
        refetchInterval,
        retryCount = 1,
        retryDelay = 1000,
        enableOptimisticUpdates = false,
        infiniteScroll = false
    } = options;
    
    // State
    const [data, setData] = useState<ApiResponse<T> | SingleApiResponse<T> | null>(null);
    const [params, setParams] = useState<ApiParams>({
        page: pagination ? 1 : null,
        search: "",
        ...initialParams,
    });
    const [mutationLoading, setMutationLoading] = useState<LoadingState>({ post: false, put: false, patch: false, delete: false });
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [retryAttempts, setRetryAttempts] = useState<number>(0);
    const [optimisticItems, setOptimisticItems] = useState<T[]>([]);
    
    // Refs
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef<number>(0);
    const isMountedRef = useRef(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastRequestUrlRef = useRef<string>("");

    // Cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortControllerRef.current?.abort();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, []);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    // GET method
    const get = useCallback(async (customEndpoint?: string | null): Promise<unknown> => {
        const url = customEndpoint ? buildBaseURL(customEndpoint) : buildFetchURL(endpoint, params, limitItems, resourceId);
        
        if (!url) {
            setFetchError("Invalid URL");
            return null;
        }

        // Prevent duplicate requests
        if (url === lastRequestUrlRef.current && loading) {
            return null;
        }

        cancel();
        abortControllerRef.current = new AbortController();
        const currentRequestId = ++requestIdRef.current;
        lastRequestUrlRef.current = url;
        
        setLoading(true);
        setFetchError(null);

        try {
            const dataRes = await apiClient.get(url, { 
                signal: abortControllerRef.current.signal 
            } as never);

            if (currentRequestId === requestIdRef.current && isMountedRef.current) {
                const apiResponse = dataRes.data as ApiResponse<T> | SingleApiResponse<T>;

                if (infiniteScroll && params.page && params.page > 1 && 'items' in apiResponse.data) {
                    const listResponse = apiResponse as ApiResponse<T>;
                    const currentData = data as ApiResponse<T>;
                    
                    if (currentData && 'items' in currentData.data) {
                        setData({
                            ...listResponse,
                            data: {
                                ...listResponse.data,
                                items: [...currentData.data.items, ...listResponse.data.items]
                            }
                        });
                    } else {
                        setData(listResponse);
                    }
                } else {
                    setData(apiResponse);
                }
                
                setRetryAttempts(0);
            }
            
            return dataRes.data;

        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            if (err.name === 'AbortError' || !isMountedRef.current) return null;

            // Only retry for specific network errors, not client errors (4xx)
            const shouldRetry = retryAttempts < retryCount && 
                               err.response?.status !== 404 && 
                               err.response?.status !== 400 &&
                               err.response?.status !== 422 &&
                               (!err.response || err.response.status >= 500);
                               
            if (shouldRetry) {
                setRetryAttempts(prev => prev + 1);
                setTimeout(() => {
                    if (isMountedRef.current) get(customEndpoint);
                }, retryDelay * Math.pow(2, retryAttempts));
                return null;
            }
            
            setFetchError(handleApiError(error));
            throw error;
        } finally { 
            if (isMountedRef.current) setLoading(false);
        }
    }, [endpoint, params, limitItems, resourceId, data, retryAttempts, retryCount, retryDelay, infiniteScroll, cancel]);

    const retry = useCallback(() => get(), [get]);

    // POST method
    const post = useCallback(async <K = unknown>(options: MutationOptions<K> = {}): Promise<unknown> => {
        const { data: postData, customEndpoint, onSuccess, onError, optimistic = enableOptimisticUpdates } = options;
        const url = buildBaseURL(customEndpoint || endpoint);

        setMutationLoading(prev => ({ ...prev, post: true }));

        if (optimistic && postData && data && 'items' in data.data) {
            const optimisticItem = createOptimisticItem(postData);
            setOptimisticItems([optimisticItem as unknown as T]);
            const currentData = data as ApiResponse<T>;
            setData({
                ...currentData,
                data: {
                    ...currentData.data,
                    items: [optimisticItem as unknown as T, ...currentData.data.items]
                }
            });
        }

        try {
            const response = await apiClient.post(url, postData);
            const apiResponse = response.data;

            if (optimistic && optimisticItems.length > 0) {
                setOptimisticItems([]);
                get();
            }

            onSuccess?.(apiResponse, postData);
            return apiResponse;

        } catch (error: unknown) {
            if (optimistic && optimisticItems.length > 0) {
                setOptimisticItems([]);
                get();
            }

            onError?.(error as never, postData);
            throw error;
        } finally {
            if (isMountedRef.current) setMutationLoading(prev => ({ ...prev, post: false }));
        }
    }, [endpoint, enableOptimisticUpdates, data, optimisticItems, get]);

    // PUT method
    const put = useCallback(async <K = unknown>(options: MutationOptions<K> = {}): Promise<unknown> => {
        const { data: putData, customEndpoint, onSuccess, onError, optimistic = enableOptimisticUpdates } = options;
        const url = buildBaseURL(customEndpoint || endpoint, resourceId);

        setMutationLoading(prev => ({ ...prev, put: true }));

        try {
            const response = await apiClient.put(url, putData);
            const apiResponse = response.data;

            if (optimistic) get();
            onSuccess?.(apiResponse, putData);
            return apiResponse;

        } catch (error: unknown) {
            onError?.(error as never, putData);
            throw error;
        } finally {
            if (isMountedRef.current) setMutationLoading(prev => ({ ...prev, put: false }));
        }
    }, [endpoint, resourceId, enableOptimisticUpdates, get]);

    // PATCH method
    const patch = useCallback(async <K = unknown>(options: MutationOptions<K> = {}): Promise<unknown> => {
        const { data: patchData, customEndpoint, onSuccess, onError, optimistic = enableOptimisticUpdates } = options;
        const url = buildBaseURL(customEndpoint || endpoint, resourceId);

        setMutationLoading(prev => ({ ...prev, patch: true }));

        try {
            const response = await apiClient.patch(url, patchData);
            const apiResponse = response.data;

            if (optimistic) get();
            onSuccess?.(apiResponse, patchData);
            return apiResponse;

        } catch (error: unknown) {
            onError?.(error as never, patchData);
            throw error;
        } finally {
            if (isMountedRef.current) setMutationLoading(prev => ({ ...prev, patch: false }));
        }
    }, [endpoint, resourceId, enableOptimisticUpdates, get]);

    // DELETE method
    const del = useCallback(async <K = unknown>(options: MutationOptions<K> = {}): Promise<unknown> => {
        const { data: deleteData, customEndpoint, onSuccess, onError, optimistic = enableOptimisticUpdates } = options;
        const url = buildBaseURL(customEndpoint || endpoint, resourceId);

        setMutationLoading(prev => ({ ...prev, delete: true }));

        if (optimistic && resourceId && data && 'items' in data.data) {
            const currentData = data as ApiResponse<T>;
            setData({
                ...currentData,
                data: {
                    ...currentData.data,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    items: currentData.data.items.filter((item) => (item as any).id !== resourceId)
                }
            });
        }

        try {
            const config = deleteData ? { data: deleteData } : {};
            const response = await apiClient.delete(url, config as never);
            const apiResponse = response.data;

            if (optimistic) get();
            onSuccess?.(apiResponse, deleteData);
            return apiResponse;

        } catch (error: unknown) {
            if (optimistic) get();
            onError?.(error as never, deleteData);
            throw error;
        } finally {
            if (isMountedRef.current) setMutationLoading(prev => ({ ...prev, delete: false }));
        }
    }, [endpoint, resourceId, enableOptimisticUpdates, data, get]);

    const loadMore = useCallback(async (): Promise<void> => {
        if (pagination && params.page && !loading) {
            const nextPage = (params.page || 1) + 1;
            setParams(prev => ({ ...prev, page: nextPage }));
        }
    }, [pagination, params.page, loading]);

    const updateParams = useCallback((newParams: Record<string, unknown>, refetch: boolean = true): void => {
        if (!loading) {
            setParams(prev => ({ ...prev, ...newParams }));
        }
    }, [loading]);

    const updatePage = useCallback((page: number): void => {
        if (pagination && !loading) {
            setParams(prev => ({ ...prev, page }));
        }
    }, [pagination, loading]);


    const clearFetchError = useCallback(() => setFetchError(null), []);

    const reset = useCallback((): void => {
        setData(null);
        setOptimisticItems([]);
        setRetryAttempts(0);
        setFetchError(null);
        cancel();
    }, [cancel]);


    // Auto-fetch effect with debouncing for search
    useEffect(() => {
        if (!enableFetch) return;

        // Clear existing debounce timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Reset retry attempts when params change
        setRetryAttempts(0);
        
        // If there's a search parameter, debounce the request
        const shouldDebounce = params.search && params.search.length > 0;
        
        if (shouldDebounce) {
            debounceTimeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    get();
                }
            }, 300); // 300ms debounce delay
        } else {
            // No debounce for non-search requests
            get();
        }

        // Cleanup function
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [enableFetch, params, resourceId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Window focus refetch
    useEffect(() => {
        if (!refetchOnWindowFocus) return;
        const handleFocus = () => {
            if (enableFetch && document.visibilityState === 'visible') get();
        };
        document.addEventListener('visibilitychange', handleFocus);
        return () => document.removeEventListener('visibilitychange', handleFocus);
    }, [refetchOnWindowFocus, enableFetch, get]);

    // Network reconnect refetch
    useEffect(() => {
        if (!refetchOnReconnect) return;
        const handleOnline = () => {
            if (enableFetch) get();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [refetchOnReconnect, enableFetch, get]);

    // Interval refetch
    useEffect(() => {
        if (!refetchInterval || !enableFetch) return;
        intervalRef.current = setInterval(() => get(), refetchInterval);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [refetchInterval, enableFetch, get]);

    return {
        data,
        params,
        loading,
        fetchError,
        hasFetchError: !!fetchError,
        get,
        post,
        put,
        patch,
        delete: del,
        retry,
        cancel,
        loadMore,
        updateParams,
        updatePage,
        clearFetchError,
        reset,
        refetch: get,
    };
};