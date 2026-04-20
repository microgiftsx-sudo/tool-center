// Common API types

export interface ApiParams {
  page?: number | null;
  limit?: number | null;
  search?: string;
  [key: string]: unknown;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data: {
    items: T[];
    pagination: Pagination;
  };
  errors?: unknown[];
}

export interface SingleApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data: T;
  errors?: unknown[];
}

export interface LoadingState {
  post: boolean;
  put: boolean;
  patch: boolean;
  delete: boolean;
}