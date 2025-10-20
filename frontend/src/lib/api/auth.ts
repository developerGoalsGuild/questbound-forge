/**
 * Authentication utilities for API calls.
 */

import { getStoredAuth } from '@/lib/utils';
export const getAuthHeaders = () => {
  const auth = getStoredAuth();
  const token = auth?.id_token || auth?.access_token;
  
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || ''
  };
};

export const getCurrentUser = () => {
  // Get user from stored auth token
  const auth = getStoredAuth();
  if (!auth) return null;
  
  // Decode token to get user info
  const token = auth.id_token || auth.access_token;
  if (!token) return null;
  
  try {
    const [, payload] = token.split('.');
    const claims = JSON.parse(atob(payload));
    return {
      id: claims.sub || claims.user_id || 'unknown',
      username: claims.username || claims.email || 'user',
      email: claims.email || 'unknown@example.com'
    };
  } catch {
    return null;
  }
};

