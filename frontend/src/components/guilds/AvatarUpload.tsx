import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  guildId?: string;
  currentAvatarUrl?: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError: (error: string) => void;
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState(prev => ({ ...prev, error: validationError }));
      onUploadError(validationError);
      return;
    }

    // Clear previous error
    setUploadState(prev => ({ ...prev, error: null }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadState(prev => ({ 
        ...prev, 
        preview: e.target?.result as string 
      }));
    };
    reader.readAsDataURL(file);
  }, [validateFile, onUploadError]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const simulateUpload = useCallback(async (file: File): Promise<string> => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      setUploadState(prev => ({ ...prev, progress }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock avatar URL
    const timestamp = Date.now();
    const mockAvatarUrl = `https://via.placeholder.com/256x256/6366f1/ffffff?text=Guild+${guildId || 'Avatar'}+${timestamp}`;
    
    return mockAvatarUrl;
  }, [guildId]);

  const handleUpload = useCallback(async (file: File) => {
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true, 
      progress: 0,
      error: null 
    }));

    try {
      const avatarUrl = await simulateUpload(file);
      
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
  }, [simulateUpload, onUploadSuccess, onUploadError]);

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

  const handleRemoveAvatar = useCallback(() => {
    setUploadState(prev => ({ 
      ...prev, 
      preview: null, 
      error: null 
    }));
    onUploadSuccess('');
    toast.success('Avatar removed successfully!');
  }, [onUploadSuccess]);

  const handleClick = useCallback(() => {
    if (!disabled && !uploadState.isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploadState.isUploading]);

  const displayImage = uploadState.preview || currentAvatarUrl;
  const hasImage = Boolean(displayImage);

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
                  onClick={handleRemovePreview}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleClick}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={disabled}
              >
                <Upload className="w-4 h-4 mr-1" />
                {hasImage ? 'Change Avatar' : 'Upload Avatar'}
              </Button>
            )}

            {hasImage && !uploadState.preview && (
              <Button
                onClick={handleRemoveAvatar}
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={disabled}
              >
                <X className="w-4 h-4 mr-1" />
                Remove Avatar
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

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
          aria-label="Upload avatar file"
          id="avatar-upload-input"
        />
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center">
        <p>Supported formats: JPEG, PNG, WebP</p>
        <p>Maximum size: 5MB</p>
        <p>Recommended: 256x256 pixels</p>
      </div>
    </div>
  );
};
