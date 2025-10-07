import { getApiBase } from '@/lib/utils';
import { getAccessToken } from '@/lib/utils';
import { UserProfile } from '@/models/header';
import { logger } from './logger';

const API_BASE = getApiBase();

/**
 * API service functions for header-related data
 */

/**
 * Get user profile data for header display
 */
export async function getUserProfileForHeader(): Promise<UserProfile | null> {
  const operation = 'getUserProfileForHeader';
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch profile';
      logger.error('API Error fetching user profile', {
        operation,
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url: `${API_BASE}/profile`,
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const data = await response.json();
    
    // Transform the response to match our UserProfile interface
    return {
      id: data.id || data.user_id || '',
      email: data.email || '',
      fullName: data.fullName || data.full_name || '',
      nickname: data.nickname || '',
      role: data.role || 'user',
      tier: data.tier || 'free',
      language: data.language || 'en',
      country: data.country || '',
      bio: data.bio || '',
      tags: data.tags || [],
      createdAt: data.createdAt || data.created_at || 0,
      updatedAt: data.updatedAt || data.updated_at || 0,
    };
  } catch (error) {
    logger.error('Failed to get user profile for header', { 
        operation,
        error 
    });
    return null;
  }
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(userProfile: UserProfile | null): string {
  if (!userProfile) return '?';
  
  const { fullName, nickname, email } = userProfile;
  
  // Try to get initials from fullName first
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  
  // Fallback to nickname
  if (nickname && nickname.trim()) {
    return nickname.trim()[0].toUpperCase();
  }
  
  // Fallback to email
  if (email && email.trim()) {
    return email.trim()[0].toUpperCase();
  }
  
  return '?';
}

/**
 * Get user display name for header
 */
export function getUserDisplayName(userProfile: UserProfile | null): string {
  if (!userProfile) return 'User';
  
  const { fullName, nickname, email } = userProfile;
  
  // Prefer fullName, then nickname, then email
  if (fullName && fullName.trim()) {
    return fullName.trim();
  }
  
  if (nickname && nickname.trim()) {
    return nickname.trim();
  }
  
  if (email && email.trim()) {
    return email.trim();
  }
  
  return 'User';
}

/**
 * Check if user has premium features
 */
export function hasPremiumFeatures(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  return userProfile.tier === 'premium' || userProfile.tier === 'patron';
}

/**
 * Get user's preferred language for header translations
 */
export function getUserLanguage(userProfile: UserProfile | null): string {
  if (!userProfile) return 'en';
  return userProfile.language || 'en';
}
