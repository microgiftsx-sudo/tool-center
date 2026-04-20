'use client'
import { useState, useCallback, useEffect, useRef } from "react";
import apiClient, { apiAuth }from "@/lib/axiosClients";
import type { 
  LoginCredentials, 
  RegisterUserData, 
  ChangePasswordData,
  LoginResponse,
  RegisterResponse,
  ChangePasswordResponse,
  UsersListResponse,
  AuthApiResponse 
} from "@/store/auth/authTypes";

interface LoadingState {
  login: boolean;
  register: boolean;
  resetPassword: boolean;
  changePassword: boolean;
  getAllUsers: boolean;
}

interface MutationOptions<T> {
  data?: T;
  customEndpoint?: string;
  onSuccess?: (response: unknown, data?: T) => void;
  onError?: (error: unknown, data?: T) => void;
}

export const useAuth = () => {
  const [loading, setLoading] = useState<LoadingState>({ 
    login: false, 
    register: false, 
    resetPassword: false, 
    changePassword: false,
    getAllUsers: false
  });
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const retryCount = 3;
  const retryDelay = 1000;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleApiError = (error: unknown): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (error as any)?.response?.data?.message || (error as any)?.message || "Request failed";
  };

  const login = useCallback(async (options: MutationOptions<LoginCredentials> = {}, retryAttempts = 0): Promise<AuthApiResponse<LoginResponse> | null> => {
    const { data: credentials, customEndpoint, onSuccess, onError } = options;
    const url = customEndpoint || '/auth/login';

    cancel();
    abortControllerRef.current = new AbortController();
    const currentRequestId = ++requestIdRef.current;

    setLoading(prev => ({ ...prev, login: true }));
    setError(null);

    try {
      const response = await apiAuth.post(url, credentials);

      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        onSuccess?.(response.data, credentials);
        return response.data as AuthApiResponse<LoginResponse>;
      }
      return null;

    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.name === 'AbortError' || !isMountedRef.current) return null;

      // Only retry GET-like operations and only for server errors (5xx) or network issues
      // Don't retry for client errors (401, 400, etc.) 
      const shouldRetry = retryAttempts < retryCount && 
                         error.response?.status !== 401 && 
                         error.response?.status !== 400 &&
                         error.response?.status !== 422 &&
                         (!error.response || error.response.status >= 500);
                         
      if (shouldRetry) {
        setTimeout(() => {
          if (isMountedRef.current) login(options, retryAttempts + 1);
        }, retryDelay * Math.pow(2, retryAttempts));
        return null;
      }

      const errorMessage = handleApiError(error);
      setError(errorMessage);
      onError?.(error, credentials);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, login: false }));
      }
    }
  }, [cancel]);

  const register = useCallback(async (options: MutationOptions<RegisterUserData> = {}): Promise<AuthApiResponse<RegisterResponse> | null> => {
    const { data: userData, customEndpoint, onSuccess, onError } = options;
    const url = customEndpoint || '/auth/register';

    cancel();
    abortControllerRef.current = new AbortController();
    const currentRequestId = ++requestIdRef.current;

    setLoading(prev => ({ ...prev, register: true }));
    setError(null);

    try {
      const response = await apiClient.post(url, userData);

      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        onSuccess?.(response.data, userData);
        return response.data as AuthApiResponse<RegisterResponse>;
      }
      return null;

    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.name === 'AbortError' || !isMountedRef.current) return null;

      // POST operations should NOT retry - could cause duplicate data
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      onError?.(error, userData);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, register: false }));
      }
    }
  }, [cancel]);

  const resetPassword = useCallback(async (options: MutationOptions<{ email: string }> = {}): Promise<void> => {
    const { data: emailData, customEndpoint, onSuccess, onError } = options;
    const url = customEndpoint || '/auth/reset-password';

    cancel();
    abortControllerRef.current = new AbortController();
    const currentRequestId = ++requestIdRef.current;

    setLoading(prev => ({ ...prev, resetPassword: true }));
    setError(null);

    try {
      const response = await apiAuth.post(url, emailData);

      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        onSuccess?.(response.data, emailData);
      }

    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.name === 'AbortError' || !isMountedRef.current) return;

      // POST operations should NOT retry - could cause duplicate emails/actions
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      onError?.(error, emailData);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, resetPassword: false }));
      }
    }
  }, [cancel]);

  const changePassword = useCallback(async (options: MutationOptions<ChangePasswordData> = {}): Promise<AuthApiResponse<ChangePasswordResponse> | null> => {
    const { data: passwordData, customEndpoint, onSuccess, onError } = options;
    const url = customEndpoint || '/auth/change-password';

    cancel();
    abortControllerRef.current = new AbortController();
    const currentRequestId = ++requestIdRef.current;

    setLoading(prev => ({ ...prev, changePassword: true }));
    setError(null);

    try {
      const response = await apiClient.put(url, passwordData);

      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        onSuccess?.(response.data, passwordData);
        return response.data as AuthApiResponse<ChangePasswordResponse>;
      }
      return null;

    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.name === 'AbortError' || !isMountedRef.current) return null;

      // PUT operations should NOT retry - could cause security issues or multiple password changes
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      onError?.(error, passwordData);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, changePassword: false }));
      }
    }
  }, [cancel]);

  const getAllUsers = useCallback(async (options: MutationOptions<void> = {}, retryAttempts = 0): Promise<AuthApiResponse<UsersListResponse> | null> => {
    const { customEndpoint, onSuccess, onError } = options;
    const url = customEndpoint || '/auth/users';

    cancel();
    abortControllerRef.current = new AbortController();
    const currentRequestId = ++requestIdRef.current;

    setLoading(prev => ({ ...prev, getAllUsers: true }));
    setError(null);

    try {
      const response = await apiClient.get(url);

      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        onSuccess?.(response.data);
        return response.data as AuthApiResponse<UsersListResponse>;
      }
      return null;

    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.name === 'AbortError' || !isMountedRef.current) return null;

      // Only retry for server errors (5xx) or network issues, not client errors (4xx)
      const shouldRetry = retryAttempts < retryCount && 
                         error.response?.status !== 401 && 
                         error.response?.status !== 400 &&
                         error.response?.status !== 404 &&
                         error.response?.status !== 422 &&
                         (!error.response || error.response.status >= 500);
                         
      if (shouldRetry) {
        setTimeout(() => {
          if (isMountedRef.current) getAllUsers(options, retryAttempts + 1);
        }, retryDelay * Math.pow(2, retryAttempts));
        return null;
      }

      const errorMessage = handleApiError(error);
      setError(errorMessage);
      onError?.(error);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, getAllUsers: false }));
      }
    }
  }, [cancel]);

  const retry = useCallback(() => {
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    login,
    register,
    resetPassword,
    changePassword,
    getAllUsers,
    loading,
    isLoading: Object.values(loading).some(Boolean),
    error,
    hasError: !!error,
    retry,
    cancel,
    clearError
  };
};