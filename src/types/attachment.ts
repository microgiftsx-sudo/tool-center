// Attachment API types

export interface Attachment {
  id: number;
  originalName: string;
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
  altText?: string;
  metadata?: {
    userId: number;
    category: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  status: string;
  message: string;
  errors: null | string;
  data: Attachment;
}

export interface UploadedFile {
  id: string;
  path: string;
  name: string;
}

// File upload types
export type FileStatus = 'init' | 'pending' | 'uploaded' | 'Upload failed' | 'set';

export interface UploadFile {
  file?: File;
  path: string;
  name: string;
  hash: string;
  status: FileStatus;
  progress: number;
  id?: string;
}