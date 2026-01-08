/**
 * Performance optimization utilities for goal management components
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { debounce } from 'lodash-es';
import { logger } from '@/lib/logger';

/**
 * Debounced search hook for goal filtering
 * Prevents excessive API calls during typing
 */
export function useDebouncedSearch(
  searchTerm: string,
  onSearch: (term: string) => void,
  delay: number = 300
) {
  const debouncedSearch = useMemo(
    () => debounce(onSearch, delay),
    [onSearch, delay]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  return debouncedSearch;
}

/**
 * Memoized goal sorting hook
 * Only recalculates when goals or sort criteria change
 */
export function useMemoizedGoalSorting<T extends { id: string; title: string; deadline?: string; createdAt: number }>(
  goals: T[],
  sortBy: string
) {
  return useMemo(() => {
    if (!goals.length) return [];

    const sortedGoals = [...goals];
    
    switch (sortBy) {
      case 'deadline-asc':
        return sortedGoals.sort((a, b) => {
          const deadlineA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
          const deadlineB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
          return deadlineA.getTime() - deadlineB.getTime();
        });
      
      case 'deadline-desc':
        return sortedGoals.sort((a, b) => {
          const deadlineA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
          const deadlineB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
          return deadlineB.getTime() - deadlineA.getTime();
        });
      
      case 'title-asc':
        return sortedGoals.sort((a, b) => a.title.localeCompare(b.title));
      
      case 'title-desc':
        return sortedGoals.sort((a, b) => b.title.localeCompare(a.title));
      
      case 'created-asc':
        return sortedGoals.sort((a, b) => a.createdAt - b.createdAt);
      
      case 'created-desc':
        return sortedGoals.sort((a, b) => b.createdAt - a.createdAt);
      
      default:
        return sortedGoals;
    }
  }, [goals, sortBy]);
}

/**
 * Memoized goal filtering hook
 * Only recalculates when goals or filter criteria change
 */
export function useMemoizedGoalFiltering<T extends { 
  id: string; 
  title: string; 
  description?: string; 
  status: string; 
}>(
  goals: T[],
  searchTerm: string,
  statusFilter: string
) {
  return useMemo(() => {
    if (!goals.length) return [];

    return goals.filter(goal => {
      // Search filter
      const matchesSearch = !searchTerm || 
        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = !statusFilter || statusFilter === 'all' || goal.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [goals, searchTerm, statusFilter]);
}

/**
 * Virtual scrolling hook for large goal lists
 * Only renders visible items to improve performance
 */
export function useVirtualScrolling<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex: visibleRange.startIndex
  };
}

/**
 * Lazy loading hook for goal data
 * Loads data only when needed
 */
export function useLazyGoalLoading(
  loadFunction: () => Promise<any[]>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (loaded) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loadFunction();
      setData(result);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadFunction, loaded]);

  useEffect(() => {
    loadData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    loaded,
    reload: loadData
  };
}

/**
 * Optimized form validation hook
 * Debounces validation to prevent excessive re-renders
 */
export function useOptimizedFormValidation<T>(
  data: T,
  validationSchema: any,
  debounceDelay: number = 300
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValidation = useMemo(
    () => debounce(async (formData: T) => {
      setIsValidating(true);
      try {
        await validationSchema.parseAsync(formData);
        setErrors({});
      } catch (err: any) {
        const newErrors: Record<string, string> = {};
        if (err.errors) {
          err.errors.forEach((error: any) => {
            newErrors[error.path[0]] = error.message;
          });
        }
        setErrors(newErrors);
      } finally {
        setIsValidating(false);
      }
    }, debounceDelay),
    [validationSchema, debounceDelay]
  );

  useEffect(() => {
    debouncedValidation(data);
  }, [data, debouncedValidation]);

  return {
    errors,
    isValidating,
    isValid: Object.keys(errors).length === 0
  };
}

/**
 * Memory optimization hook for large datasets
 * Implements pagination and cleanup
 */
export function useMemoryOptimizedData<T>(
  allData: T[],
  pageSize: number = 20
) {
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleData, setVisibleData] = useState<T[]>([]);

  const totalPages = Math.ceil(allData.length / pageSize);

  useEffect(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    setVisibleData(allData.slice(startIndex, endIndex));
  }, [allData, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  return {
    visibleData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages - 1,
    hasPrev: currentPage > 0
  };
}

/**
 * Performance monitoring hook
 * Tracks component performance metrics
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
        
        // Warn about slow renders
        if (renderTime > 100) {
          logger.warn(`${componentName} slow render detected`, { renderTime: `${renderTime.toFixed(2)}ms` });
        }
      }
    };
  });

  return {
    renderCount: renderCount.current
  };
}

/**
 * Bundle size optimization utilities
 */
export const bundleOptimizations = {
  // Lazy load heavy components
  lazyLoadGoalCreationForm: () => import('@/components/forms/GoalCreationForm'),
  lazyLoadGoalsList: () => import('@/pages/goals/GoalsList'),
  lazyLoadTasksModal: () => import('@/components/modals/TasksModal'),

  // Dynamic imports for heavy libraries
  lazyLoadChartLibrary: () => import('chart.js'),
  lazyLoadDateLibrary: () => import('date-fns'),
  lazyLoadValidationLibrary: () => import('zod')
};

/**
 * Image optimization utilities
 */
export const imageOptimizations = {
  // Generate optimized image URLs
  getOptimizedImageUrl: (url: string, width: number, height: number) => {
    // This would integrate with your image optimization service
    return `${url}?w=${width}&h=${height}&q=80&f=webp`;
  },

  // Lazy load images
  useLazyImage: (src: string, placeholder: string) => {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }, [src]);

    return { imageSrc, isLoaded };
  }
};

/**
 * Network optimization utilities
 */
export const networkOptimizations = {
  // Request deduplication
  requestCache: new Map<string, Promise<any>>(),

  deduplicateRequest: <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
    if (networkOptimizations.requestCache.has(key)) {
      return networkOptimizations.requestCache.get(key)!;
    }

    const promise = requestFn().finally(() => {
      networkOptimizations.requestCache.delete(key);
    });

    networkOptimizations.requestCache.set(key, promise);
    return promise;
  },

  // Request batching
  batchRequests: <T>(requests: (() => Promise<T>)[], batchSize: number = 5) => {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    return Promise.all(
      batches.map(batch => Promise.all(batch.map(request => request())))
    ).then(results => results.flat());
  }
};
