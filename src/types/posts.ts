// Posts-related TypeScript types

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export interface CreatePostRequest {
  userId: number;
  title: string;
  body: string;
}

export interface UpdatePostRequest {
  userId?: number;
  title?: string;
  body?: string;
}

export interface PostFormData {
  userId: string;
  title: string;
  body: string;
}