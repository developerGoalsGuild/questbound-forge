import { useState, useEffect, useCallback, useRef } from 'react';
import { getActiveGoalsCountForUser } from '@/lib/apiGoal';
import { getUserIdFromToken } from '@/lib/utils';
import { ActiveGoalsState, HeaderError } from '@/models/header';
import { logger } from '@/lib/logger';

interface UseActiveGoalsCountOptions {
  pollInterval?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

interface UseActiveGoalsCountReturn extends ActiveGoalsState {
  retry: () => void;
  clearError: () => void;
}

const DEFAULT_OPTIONS: Required<UseActiveGoalsCountOptions> = {
  pollInterval: 120000, // 120 seconds (2 minutes) - increased from 30s to reduce API calls by 75%
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
};

export const useActiveGoalsCount = (
  options: UseActiveGoalsCountOptions = {}
): UseActiveGoalsCountReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<ActiveGoalsState>({
    count: null,
    isLoading: true,
    hasError: false,
    lastUpdated: null,
    retryCount: 0,
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Fetch goals count
  const fetchGoalsCount = useCallback(async (isRetry = false): Promise<void> => {
    if (!isMountedRef.current) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        count: null,
      }));
      return;
    }

    // Don't show loading state for retries to avoid UI flicker
    if (!isRetry) {
      setState(prev => ({ ...prev, isLoading: true, hasError: false }));
    }

    try {
      const count = await getActiveGoalsCountForUser(userId);
      
      if (!isMountedRef.current) return;

      setState(prev => ({
        ...prev,
        count,
        isLoading: false,
        hasError: false,
        lastUpdated: new Date(),
        retryCount: 0,
      }));
    } catch (error) {
      logger.error('Failed to fetch active goals count', {
          operation: 'useActiveGoalsCount',
          error,
          retryCount: state.retryCount,
      });
      
      if (!isMountedRef.current) return;

      const headerError: HeaderError = {
        type: 'api',
        message: error instanceof Error ? error.message : 'Failed to fetch goals count',
        retryable: true,
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        retryCount: prev.retryCount + 1,
      }));

      // Auto-retry if under max retries
      if (state.retryCount < opts.maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchGoalsCount(true);
          }
        }, opts.retryDelay);
      }
    }
  }, [opts.maxRetries, opts.retryDelay, state.retryCount]);

  // Manual retry function
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setState(prev => ({ ...prev, retryCount: 0 }));
    fetchGoalsCount(false);
  }, [fetchGoalsCount]);

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, hasError: false, retryCount: 0 }));
  }, []);

  // Setup polling
  const setupPolling = useCallback(() => {
    cleanup();
    
    if (opts.pollInterval > 0) {
      pollIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchGoalsCount(true);
        }
      }, opts.pollInterval);
    }
  }, [opts.pollInterval, fetchGoalsCount, cleanup]);

  // Initial fetch and setup
  useEffect(() => {
    isMountedRef.current = true;
    fetchGoalsCount(false);
    setupPolling();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [fetchGoalsCount, setupPolling, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    retry,
    clearError,
  };
};

export default useActiveGoalsCount;
