import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { resizeImageFile, isValidImageFile, getFileSizeKB, formatFileSize } from '@/lib/utils/imageResize';

interface AvatarUploadProps {
  guildId?: string;
  currentAvatarUrl?: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError: (error: string) => void;
  onFileSelect?: (file: File) => void; // New prop for file selection
  onAvatarRemoved?: () => void; // New prop for avatar removal
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  preview: string | null;
  error: string | null;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  guildId,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  onFileSelect,
  onAvatarRemoved,
  disabled = false,
  size = 'lg',
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    preview: null,
    error: null,
  });

  const validateFile = useCallback((file: File): string | null => {
    // File type validation
    if (!isValidImageFile(file)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    // File size validation (10MB max for original file - will be resized)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  }, []);

  const uploadToS3 = useCallback(async (file: File): Promise<string> => {
    if (!guildId) {
      // During guild creation, we can't upload to S3 yet
      // Return a data URL for preview purposes
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      // Import the upload function
      const { uploadGuildAvatar } = await import('@/lib/api/guild');
      
      // Upload to S3 via backend
      const response = await uploadGuildAvatar(guildId, file);
      
      return response.avatar_url;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw error;
    }
  }, [guildId]);

  const handleUpload = useCallback(async (file: File) => {
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true, 
      progress: 0,
      error: null 
    }));

    try {
      // Show progress during upload
      setUploadState(prev => ({ ...prev, progress: 25 }));
      
      const avatarUrl = await uploadToS3(file);
      
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 100,
        preview: null 
      }));

      onUploadSuccess(avatarUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0,
        error: errorMessage 
      }));
      onUploadError(errorMessage);
      toast.error(`Upload failed: ${errorMessage}`);
    }
  }, [uploadToS3, onUploadSuccess, onUploadError]);

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState(prev => ({ ...prev, error: validationError }));
      onUploadError(validationError);
      return;
    }

    // Clear previous error
    setUploadState(prev => ({ ...prev, error: null }));

    try {
      // Show resizing progress
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: true, 
        progress: 10,
        error: null 
      }));

      // Resize the image to meet 500KB requirement
      const originalSizeKB = getFileSizeKB(file);
      console.log(`Original file size: ${formatFileSize(file.size)}`);
      
      const resizedFile = await resizeImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        maxSizeKB: 500,
        quality: 0.8,
        format: 'image/jpeg'
      });

      const resizedSizeKB = getFileSizeKB(resizedFile);
      console.log(`Resized file size: ${formatFileSize(resizedFile.size)}`);

      // If no guildId, just create preview and call onFileSelect
      if (!guildId) {
        console.log('No guildId, creating preview and calling onFileSelect');
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setUploadState(prev => ({ 
            ...prev, 
            preview: dataUrl,
            isUploading: false,
            progress: 0
          }));
          onUploadSuccess(dataUrl); // Call success with data URL
          console.log('Calling onFileSelect with resized file:', resizedFile.name, resizedFile.size, resizedFile.type);
          onFileSelect?.(resizedFile); // Also call file select callback with resized file
        };
        reader.readAsDataURL(resizedFile);
        return;
      }

      // If guildId exists, proceed with upload using resized file
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0
      }));
      handleUpload(resizedFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      console.error('Image processing error:', error);
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0,
        error: errorMessage 
      }));
      onUploadError(errorMessage);
      toast.error(`Image processing failed: ${errorMessage}`);
    }
  }, [validateFile, onUploadError, onUploadSuccess, onFileSelect, guildId, handleUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file?.name, file?.type, file?.size);
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemovePreview = useCallback(() => {
    setUploadState(prev => ({ 
      ...prev, 
      preview: null, 
      error: null 
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveAvatar = useCallback(async () => {
    if (!guildId) {
      // During guild creation, just clear the preview
      setUploadState(prev => ({ 
        ...prev, 
        preview: null, 
        error: null 
      }));
      onUploadSuccess('');
      toast.success('Avatar removed successfully!');
      return;
    }

    try {
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: true,
        error: null 
      }));

      // Import and call the delete function
      const { deleteGuildAvatar } = await import('@/lib/api/guild');
      await deleteGuildAvatar(guildId);

      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false,
        preview: null 
      }));

      onUploadSuccess('');
      onAvatarRemoved?.();
      toast.success('Avatar removed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove avatar';
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false,
        error: errorMessage 
      }));
      onUploadError(errorMessage);
      toast.error(`Failed to remove avatar: ${errorMessage}`);
    }
  }, [guildId, onUploadSuccess, onUploadError, onAvatarRemoved]);

  const handleClick = useCallback(() => {
    // This function is no longer needed since we're using label approach
    // The label will automatically trigger the file input
    console.log('Label-based file picker should open automatically');
  }, []);

  const displayImage = uploadState.preview || currentAvatarUrl;
  const hasImage = Boolean(displayImage && displayImage.trim() !== '');

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Avatar Display */}
      <div className="relative">
        <Card className={cn(
          'overflow-hidden cursor-pointer transition-all duration-200',
          sizeClasses[size],
          disabled && 'opacity-50 cursor-not-allowed',
          uploadState.isUploading && 'opacity-75',
          !hasImage && 'border-2 border-dashed border-gray-300 hover:border-gray-400'
        )}>
          <CardContent className="p-0 h-full w-full flex items-center justify-center">
            {hasImage ? (
              <img
                src={displayImage}
                alt="Guild avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Camera className={cn('mb-1', iconSizes[size])} />
                <span className="text-xs">Upload</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Overlay */}
        {uploadState.isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <Upload className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              <div className="text-xs">Uploading...</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {uploadState.isUploading && (
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <Progress value={uploadState.progress} className="h-1" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2 w-full">
        {!uploadState.isUploading && (
          <>
            {uploadState.preview ? (
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => {
                    const file = fileInputRef.current?.files?.[0];
                    if (file) {
                      handleUpload(file);
                    }
                  }}
                  size="sm"
                  className="flex-1"
                  disabled={disabled}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirm Upload
                </Button>
                <Button
                  type="button"
                  onClick={handleRemovePreview}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={disabled}
                  aria-label="Upload avatar file"
                  id="avatar-upload-input"
                  style={{ 
                    position: 'absolute', 
                    left: '-9999px', 
                    opacity: 0,
                    pointerEvents: 'none'
                  }}
                />
                <label 
                  htmlFor="avatar-upload-input" 
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {hasImage ? 'Change Avatar' : 'Choose Image'}
                </label>
              </div>
            )}

            {hasImage && !uploadState.preview && (
              <Button
                type="button"
                onClick={handleRemoveAvatar}
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={disabled || uploadState.isUploading}
              >
                {uploadState.isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-1 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Remove Avatar
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* Error Display */}
        {uploadState.error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{uploadState.error}</span>
          </div>
        )}

      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center">
        <p>Supported formats: JPEG, PNG, WebP</p>
        <p>Maximum size: 10MB (will be resized to 500KB)</p>
        <p>Recommended: 512x512 pixels</p>
        <p>Images will be automatically compressed</p>
      </div>
    </div>
  );
};
