import { useState, useEffect } from 'react';
import apiClient from '@/lib/axiosClients';
import type { UploadFile, UploadedFile, FileStatus, UploadResponse } from '@/types/attachment';

export const useUploadFile = (
  endpoint: string = '/attachments/upload',
  multiple: boolean = false,
  initialValue?: UploadedFile | UploadedFile[],
  options?: { isEditing?: boolean; collection?: string }
) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [finish, setFinish] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Initialize with provided files if any
  useEffect(() => {
    if (initialValue && options?.isEditing) {
      if (Array.isArray(initialValue)) {
        const initialFiles = initialValue.map((file) => ({
          path: file.path,
          name: file.name,
          hash: Math.random().toString(36).substring(7),
          status: 'uploaded' as FileStatus,
          progress: 100,
          id: file.id,
        }));
        setFiles(initialFiles);
        setUploadedFiles(initialValue);
      } else if (initialValue) {
        setFiles([
          {
            path: initialValue.path,
            name: initialValue.name,
            hash: Math.random().toString(36).substring(7),
            status: 'uploaded' as FileStatus,
            progress: 100,
            id: initialValue.id,
          },
        ]);
        setUploadedFiles([initialValue]);
      }
    }
  }, [initialValue, options?.isEditing]);

  const handleUploadFiles = async (selectedFiles: File[]) => {
    // If not multiple, replace existing files
    if (!multiple) {
      setFiles([]);
      setUploadedFiles([]);
    }

    // Create initial file objects
    const newFiles = selectedFiles.map((file) => ({
      file,
      path: URL.createObjectURL(file),
      name: file.name,
      hash: Math.random().toString(36).substring(7),
      status: 'init' as FileStatus,
      progress: 0,
    }));

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setFinish(false);

    // Upload each file
    for (const fileObj of newFiles) {
      try {
        await uploadFile(fileObj);
      } catch (error) {
        updateFileStatus(fileObj.hash, 'Upload failed', 0);
        console.error(`Failed to upload ${fileObj.name}:`, error);
      }
    }

    setFinish(true);
  };

  const uploadFile = async (fileObj: UploadFile) => {
    if (!fileObj.file) return;
    
    updateFileStatus(fileObj.hash, 'pending', 0);
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', fileObj.file);
    formData.append('collection', options?.collection || 'documents');
    
    try {
      const response = await apiClient.post<UploadResponse>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: never) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pe = progressEvent as any;
          if (pe.total) {
            const percentage = Math.round((pe.loaded * 100) / pe.total);
            updateFileStatus(fileObj.hash, 'pending', percentage);
          }
        },
      } as never);

      const attachment = response.data.data;
      const uploadedFile: UploadedFile = {
        id: attachment.id.toString(),
        path: attachment.path,
        name: attachment.originalName,
      };
      
      updateFileStatus(fileObj.hash, 'uploaded', 100);
      addUploadedFile(uploadedFile, fileObj.hash);
      
      return uploadedFile;
    } catch (error: unknown) {
      console.error(`Failed to upload ${fileObj.name}:`, error);
      updateFileStatus(fileObj.hash, 'Upload failed', 0);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const updateFileStatus = (hash: string, status: FileStatus, progress: number) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.hash === hash ? { ...file, status, progress } : file
      )
    );
  };

  const addUploadedFile = (response: UploadedFile, hash: string) => {
    setUploadedFiles((prev) => [...prev, response]);
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.hash === hash ? { ...file, id: response.id } : file
      )
    );
  };

  const deleteFile = async (hash: string, id?: string) => {
    // Remove from UI
    setFiles((prevFiles) => prevFiles.filter((file) => file.hash !== hash));
    
    // Remove from uploaded files and delete from server if it was already uploaded
    if (id) {
      setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
      
      try {
        await apiClient.delete(`/attachments/${id}`);
        console.log(`File ${id} deleted successfully`);
      } catch (error) {
        console.error(`Failed to delete file ${id}:`, error);
      }
    }
  };

  return {
    handleUploadFiles,
    files,
    uploadedFiles,
    deleteFile,
    finish,
    isUploading,
  };
};