/**
 * GuildAvatar Component
 * 
 * A component that fetches guild avatars with proper authentication
 * and displays them with fallback initials.
 */

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAccessToken, getApiBase } from '@/lib/utils';

interface GuildAvatarProps {
  guildId: string;
  guildName: string;
  avatarUrl?: string | null; // Optional pre-fetched avatar URL
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10', 
  lg: 'h-16 w-16',
  xl: 'h-32 w-32'
};

const fallbackSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg', 
  xl: 'text-2xl'
};

export const GuildAvatar: React.FC<GuildAvatarProps> = ({
  guildId,
  guildName,
  avatarUrl: propAvatarUrl,
  className = '',
  size = 'md',
  showFallback = true
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(propAvatarUrl !== undefined ? propAvatarUrl : null);
  const [isLoading, setIsLoading] = useState(propAvatarUrl === undefined);
  const [hasError, setHasError] = useState(false);

  console.log('GuildAvatar component rendered:', { guildId, guildName, size });

  useEffect(() => {
    console.log('GuildAvatar useEffect triggered:', { guildId, guildName, propAvatarUrl });
    
    // If we have a propAvatarUrl (even if null), use it directly - don't make API calls
    if (propAvatarUrl !== undefined) {
      console.log('✅ GuildAvatar: Using provided avatar URL (or null):', propAvatarUrl);
      setAvatarUrl(propAvatarUrl);
      setIsLoading(false);
      setHasError(false);
      return;
    }
    
    // Only make API call if no avatarUrl prop is provided at all
    console.log('⚠️ GuildAvatar: No avatarUrl prop provided, making API call for guild:', guildId);
    const fetchAvatar = async () => {
      if (!guildId) {
        console.log('No guildId provided, skipping avatar fetch');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        const token = getAccessToken();
        if (!token) {
          console.warn('No access token available for avatar fetch');
          setIsLoading(false);
          return;
        }

        const apiBase = getApiBase();
        const avatarEndpoint = `${apiBase}/guilds/${guildId}/avatar`;
        
        console.log('Fetching guild avatar:', {
          guildId,
          endpoint: avatarEndpoint,
          hasToken: !!token
        });

        const response = await fetch(avatarEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
          },
        });

        console.log('Avatar fetch response:', { status: response.status, ok: response.ok });
        
        if (response.ok) {
          // Check if response is JSON (signed URL) or binary (image data)
          const contentType = response.headers.get('content-type');
          console.log('Response content type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            // Handle JSON response with signed URL
            const data = await response.json();
            console.log('Received signed URL response:', data);
            
            if (data.avatar_url) {
              console.log('Using signed S3 URL:', data.avatar_url);
              setAvatarUrl(data.avatar_url);
            } else if (data.has_avatar === false) {
              // Guild has no avatar - this is normal, not an error
              console.log('Guild has no avatar (normal case)');
              setAvatarUrl(null);
            } else {
              console.error('No avatar_url in response:', data);
              setHasError(true);
            }
          } else {
            // Handle binary response (fallback for direct image streaming)
            const blob = await response.blob();
            console.log('Avatar blob created:', { blobSize: blob.size, blobType: blob.type });
            
            // Convert blob to base64 data URL
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              console.log('Base64 data URL created:', { dataUrl: dataUrl.substring(0, 100) + '...' });
              setAvatarUrl(dataUrl);
            };
            reader.onerror = (e) => {
              console.error('Failed to convert blob to base64:', e);
              setHasError(true);
            };
            reader.readAsDataURL(blob);
          }
        } else if (response.status === 404) {
          // This could be guild not found or no avatar - check response content
          try {
            const errorData = await response.json();
            if (errorData.detail === "Guild has no avatar") {
              console.log('Guild has no avatar (404)');
              setAvatarUrl(null);
            } else {
              console.error('Guild not found or other 404 error:', errorData);
              setHasError(true);
            }
          } catch {
            // If we can't parse the error, assume it's no avatar
            console.log('Guild has no avatar (404 - unparseable)');
            setAvatarUrl(null);
          }
        } else {
          console.error('Failed to fetch avatar:', response.status, response.statusText);
          setHasError(true);
        }
      } catch (error) {
        console.error('Error fetching guild avatar:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();

    // No cleanup needed for base64 data URLs
    return () => {};
  }, [guildId, propAvatarUrl]);

  const getGuildInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClass = sizeClasses[size];
  const fallbackSizeClass = fallbackSizeClasses[size];

  const shouldShowImage = !isLoading && avatarUrl && !hasError;
  const shouldShowFallback = showFallback && (isLoading || !avatarUrl || hasError);

  console.log('GuildAvatar render state:', { 
    isLoading, 
    avatarUrl: !!avatarUrl, 
    hasError, 
    showFallback,
    shouldShowImage,
    shouldShowFallback,
    guildName 
  });

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      {shouldShowImage && (
        <>
          {console.log('Rendering AvatarImage with src:', avatarUrl)}
          <AvatarImage 
            src={avatarUrl} 
            alt={guildName}
            onLoad={(e) => {
              console.log('AvatarImage onLoad triggered:', { avatarUrl, event: e });
            }}
            onError={(e) => {
              console.error('AvatarImage onError triggered:', { avatarUrl, event: e });
              setHasError(true);
            }}
          />
        </>
      )}
      {shouldShowFallback && (
        <>
          {console.log('Rendering AvatarFallback')}
          <AvatarFallback 
            className={`bg-blue-100 text-blue-700 font-semibold ${fallbackSizeClass}`}
          >
            {isLoading ? '...' : getGuildInitials(guildName)}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
};
