import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logger } from './logger';

export interface LogoutOptions {
  showToast?: boolean;
  redirectTo?: string;
  clearAllData?: boolean;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

/**
 * Logout utility function that handles token cleanup and user session termination
 */
export async function logout(options: LogoutOptions = {}): Promise<LogoutResult> {
  const {
    showToast = true,
    redirectTo = '/login/Login',
    clearAllData = true,
  } = options;

  try {
    // Clear authentication data from localStorage
    if (clearAllData) {
      localStorage.removeItem('auth');
    }

    // Dispatch auth change event for auth watcher
    window.dispatchEvent(new CustomEvent('auth:change'));

    // Clear any cached data if needed
    if (clearAllData) {
      // Clear any other user-specific data
      const keysToRemove = [
        'user_preferences',
        'cached_goals',
        'cached_profile',
        'last_activity',
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          logger.warn(`Failed to remove ${key} from localStorage during logout`, { error });
        }
      });
    }

    // Show success toast if requested
    if (showToast) {
      // Note: This will be handled by the component using the hook
      logger.info('Logout successful');
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Logout failed', { error });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
}

/**
 * Hook for logout functionality with navigation and toast support
 */
export function useLogout() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const performLogout = useCallback(async (options: LogoutOptions = {}) => {
    const result = await logout(options);

    if (result.success) {
      // Show success toast
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account.',
        duration: 3000,
      });

      // Navigate to login page
      navigate(options.redirectTo || '/login/Login', { 
        replace: true,
        state: { from: window.location.pathname }
      });
    } else {
      // Show error toast
      toast({
        title: 'Logout failed',
        description: result.error || 'An error occurred during logout.',
        variant: 'destructive',
        duration: 5000,
      });
    }

    return result;
  }, [navigate, toast]);

  return { performLogout };
}

export default logout;
