// types.ts

import { ApiParams, ApiResponse, LoadingState, SingleApiResponse } from "@/types/common";

export type { ApiParams, ApiResponse, LoadingState, SingleApiResponse };

export interface UseApiDataOptions {
    enableFetch?: boolean;
    pagination?: boolean;
    limitItems?: number | null;
    initialParams?: Record<string, unknown>;
    resourceId?: string | number | null;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
    refetchInterval?: number;
    retryCount?: number;
    retryDelay?: number;
    enableOptimisticUpdates?: boolean;
    infiniteScroll?: boolean;
}

export interface BaseRequestOptions {
    customEndpoint?: string | null;
    optimistic?: boolean;
    retry?: boolean;
}

export interface MutationOptions<T = unknown> extends BaseRequestOptions {
    data?: T;
    onSuccess?: (result: unknown, sentData?: T) => void;
    onError?: (error: unknown, sentData?: T) => void;
}

export interface UseApiDataReturn<T = object> {
    data: ApiResponse<T> | SingleApiResponse<T> | null;
    params: ApiParams;
    loading: boolean;
    fetchError: string | null;
    hasFetchError: boolean;
    get: (customEndpoint?: string | null) => Promise<unknown>;
    post: <K = unknown>(options?: MutationOptions<K>) => Promise<unknown>;
    put: <K = unknown>(options?: MutationOptions<K>) => Promise<unknown>;
    patch: <K = unknown>(options?: MutationOptions<K>) => Promise<unknown>;
    delete: <K = unknown>(options?: MutationOptions<K>) => Promise<unknown>;
    retry: () => void;
    cancel: () => void;
    loadMore: () => Promise<void>;
    updateParams: (newParams: Record<string, unknown>, refetch?: boolean) => void;
    updatePage: (page: number) => void;
    clearFetchError: () => void;
    reset: () => void;
    refetch: (customEndpoint?: string | null) => Promise<unknown>;
}