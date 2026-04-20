// Image URL utilities for consistent image handling across the app

/**
 * Converts a backend file path to a proper URL for Next.js Image component
 * @param path - The file path from the API (e.g., "uploads\\articles\\image.png")
 * @param baseUrl - Optional base URL, defaults to API base URL
 * @returns Properly formatted URL for images
 */
export const getImageUrl = (path: string, baseUrl?: string): string => {
  if (!path) return '';
  
  const apiBaseUrl = baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  
  // Convert Windows-style backslashes to forward slashes
  const normalizedPath = path.replace(/\\/g, '/');
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
  
  return `${apiBaseUrl}/${cleanPath}`;
};

/**
 * Get image alt text with fallback
 * @param altText - Primary alt text
 * @param fallback - Fallback text if altText is empty
 * @returns Safe alt text for images
 */
export const getImageAlt = (altText?: string, fallback: string = 'صورة'): string => {
  return altText && altText.trim() ? altText : fallback;
};

/**
 * Check if a path is a valid image URL
 * @param path - The path to check
 * @returns boolean indicating if it's a valid image path
 */
export const isValidImagePath = (path?: string): boolean => {
  if (!path) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerPath = path.toLowerCase();
  
  return imageExtensions.some(ext => lowerPath.endsWith(ext));
};