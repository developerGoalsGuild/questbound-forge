/**
 * Image resizing utilities for avatar uploads
 * 
 * This module provides functions to resize and compress images
 * to ensure they don't exceed the 500KB limit for avatar uploads.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeKB?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<ResizeOptions> = {
  maxWidth: 512,
  maxHeight: 512,
  maxSizeKB: 500,
  quality: 0.8,
  format: 'image/jpeg'
};

/**
 * Resize and compress an image file to meet size requirements
 * 
 * @param file - The original image file
 * @param options - Resize options
 * @returns Promise<File> - The resized image file
 */
export async function resizeImageFile(
  file: File, 
  options: ResizeOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth,
          opts.maxHeight
        );
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and resize the image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to blob with compression
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }
            
            // Check if we need further compression
            const sizeKB = blob.size / 1024;
            if (sizeKB <= opts.maxSizeKB) {
              // Size is acceptable, create file
              const resizedFile = new File([blob], file.name, {
                type: opts.format,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              // Need further compression, try with lower quality
              const compressedBlob = await compressImageBlob(blob, opts);
              const compressedFile = new File([compressedBlob], file.name, {
                type: opts.format,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            }
          },
          opts.format,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Scale down if image is too large
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = Math.min(maxWidth, width);
      height = width / aspectRatio;
      
      // If height is still too large, scale down further
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      height = Math.min(maxHeight, height);
      width = height * aspectRatio;
      
      // If width is still too large, scale down further
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress an image blob by reducing quality until it meets size requirements
 */
async function compressImageBlob(
  blob: Blob,
  options: Required<ResizeOptions>
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Try different quality levels
      const qualityLevels = [0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
      
      const tryCompress = (qualityIndex: number) => {
        if (qualityIndex >= qualityLevels.length) {
          // If we've tried all quality levels and still too large,
          // return the smallest we could make
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            options.format,
            qualityLevels[qualityLevels.length - 1]
          );
          return;
        }
        
        const quality = qualityLevels[qualityIndex];
        canvas.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const sizeKB = compressedBlob.size / 1024;
            if (sizeKB <= options.maxSizeKB) {
              resolve(compressedBlob);
            } else {
              tryCompress(qualityIndex + 1);
            }
          },
          options.format,
          quality
        );
      };
      
      tryCompress(0);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Validate if a file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Get file size in KB
 */
export function getFileSizeKB(file: File): number {
  return file.size / 1024;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
