// helpers.ts
import { ApiParams } from './types';

export const buildURL = (endpoint: string): string => {
    return endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
};

export const buildBaseURL = (endpoint: string, resourceId?: string | number | null): string => {
    if (resourceId) {
        const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
        const singleResourceEndpoint = `${cleanEndpoint}/${resourceId}`;
        return buildURL(singleResourceEndpoint);
    }
    return buildURL(endpoint);
};

export const buildFetchURL = (
    endpoint: string, 
    params: ApiParams, 
    limitItems?: number | null, 
    resourceId?: string | number | null
): string | null => {
    const baseURL = buildBaseURL(endpoint, resourceId);
    
    if (resourceId) {
        const url = new URL(baseURL, window.location.origin);
        return url.href.includes("/undefined/") ? null : `${url.pathname}${url.search}`;
    }
    
    const url = new URL(baseURL, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== "" && value != null) {
            url.searchParams.append(key, String(value));
        }
    });
    
    if (limitItems) url.searchParams.append("limit", String(limitItems));
    
    return url.href.includes("/undefined/") ? null : `${url.pathname}${url.search}`;
};

export const handleApiError = (error: unknown): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (error as any)?.response?.data?.message || "Request failed";
};

export const createOptimisticItem = <T>(data: T): T & { __optimistic: boolean } => {
    return { ...data, id: Date.now(), __optimistic: true } as T & { __optimistic: boolean };
};