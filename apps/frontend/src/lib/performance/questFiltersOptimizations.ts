/**
 * Performance optimization utilities for quest filtering operations
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type { QuestFilters } from '@/hooks/useQuestFilters';
import type { Quest } from '@/models/quest';

/**
 * Simple debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Performance monitoring hook for filter operations
 * Tracks filtering performance and warns about slow operations
 */
export function useFilterPerformanceMonitoring(operationName: string = 'quest-filters') {
  const operationStartTime = useRef<number>(0);
  const operationCount = useRef<number>(0);

  const startOperation = useCallback(() => {
    operationStartTime.current = performance.now();
  }, []);

  const endOperation = useCallback((metadata?: Record<string, any>) => {
    const operationTime = performance.now() - operationStartTime.current;
    operationCount.current += 1;

    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${operationName} operation #${operationCount.current}: ${operationTime.toFixed(2)}ms`, metadata);

      // Warn about slow operations (>50ms for filters)
      if (operationTime > 50) {
        logger.warn(`${operationName} slow operation detected`, {
          operationTime: `${operationTime.toFixed(2)}ms`,
          ...metadata
        });
      }
    }

    return operationTime;
  }, [operationName]);

  const measureOperation = useCallback(<T>(
    operation: () => T,
    metadata?: Record<string, any>
  ): T => {
    startOperation();
    try {
      const result = operation();
      endOperation(metadata);
      return result;
    } catch (error) {
      endOperation({ error: true, ...metadata });
      throw error;
    }
  }, [startOperation, endOperation]);

  return {
    startOperation,
    endOperation,
    measureOperation,
    operationCount: operationCount.current
  };
}

/**
 * Optimized filtering hook with performance monitoring
 * Memoizes filtering operations and tracks performance
 */
export function useOptimizedQuestFiltering(
  quests: Quest[],
  filters: QuestFilters
) {
  const { measureOperation } = useFilterPerformanceMonitoring('quest-filtering');

  return useMemo(() => {
    return measureOperation(() => {
      if (!quests || !Array.isArray(quests)) {
        return [];
      }

      // Early return for no active filters
      const hasActiveFilters = filters.status !== 'all' ||
                             filters.difficulty !== 'all' ||
                             filters.category !== 'all' ||
                             (filters.search && filters.search.trim() !== '');

      if (!hasActiveFilters) {
        return quests;
      }

      const filteredQuests = quests.filter((quest: Quest) => {
        // Status filter
        if (filters.status !== 'all' && quest.status !== filters.status) {
          return false;
        }

        // Difficulty filter
        if (filters.difficulty !== 'all' && quest.difficulty !== filters.difficulty) {
          return false;
        }

        // Category filter
        if (filters.category !== 'all' && quest.category !== filters.category) {
          return false;
        }

        // Search filter (case-insensitive)
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.toLowerCase().trim();
          const searchableFields = [
            quest.title,
            quest.description,
            quest.category,
            quest.tags?.join(' '),
          ].filter(Boolean);

          const matchesSearch = searchableFields.some(field =>
            field!.toLowerCase().includes(searchTerm)
          );

          if (!matchesSearch) {
            return false;
          }
        }

        return true;
      });

      return filteredQuests;
    }, {
      totalQuests: quests?.length || 0,
      filteredCount: undefined, // Will be set after filtering
      activeFilters: getActiveFilterCount(filters)
    });
  }, [quests, filters, measureOperation]);
}

/**
 * Optimized sorting hook with performance monitoring
 */
export function useOptimizedQuestSorting(
  quests: Quest[],
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const { measureOperation } = useFilterPerformanceMonitoring('quest-sorting');

  return useMemo(() => {
    return measureOperation(() => {
      if (!quests || !Array.isArray(quests)) {
        return [];
      }

      const sorted = [...quests].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;

          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;

          case 'updatedAt':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;

          case 'difficulty':
            const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
            comparison = (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) -
                        (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
            break;

          case 'rewardXp':
            comparison = (a.rewardXp || 0) - (b.rewardXp || 0);
            break;

          case 'status':
            const statusOrder = { draft: 1, active: 2, completed: 3, cancelled: 4, failed: 5 };
            comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) -
                        (statusOrder[b.status as keyof typeof statusOrder] || 0);
            break;

          default:
            comparison = 0;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      return sorted;
    }, {
      questCount: quests?.length || 0,
      sortBy,
      sortOrder
    });
  }, [quests, sortBy, sortOrder, measureOperation]);
}

/**
 * Debounced search hook for quest filtering with performance tracking
 */
export function useDebouncedQuestSearch(
  searchTerm: string,
  onSearch: (term: string) => void,
  delay: number = 300
) {
  const { measureOperation } = useFilterPerformanceMonitoring('quest-search');

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      measureOperation(() => {
        onSearch(term);
      }, { searchTermLength: term.length });
    }, delay),
    [onSearch, delay, measureOperation]
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
 * Memory usage monitoring for large quest datasets
 */
export function useQuestMemoryMonitoring(quests: Quest[]) {
  const { measureOperation } = useFilterPerformanceMonitoring('quest-memory');

  useEffect(() => {
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        measureOperation(() => {
          // Memory monitoring logic
        }, {
          questCount: quests?.length || 0,
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };

    // Monitor memory every 30 seconds
    const interval = setInterval(monitorMemory, 30000);

    return () => clearInterval(interval);
  }, [quests, measureOperation]);

  const getMemoryStats = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        questCount: quests?.length || 0
      };
    }
    return null;
  }, [quests]);

  return { getMemoryStats };
}

/**
 * Utility function to get active filter count
 */
function getActiveFilterCount(filters: QuestFilters): number {
  let count = 0;
  if (filters.status !== 'all') count++;
  if (filters.difficulty !== 'all') count++;
  if (filters.category !== 'all') count++;
  if (filters.search && filters.search.trim() !== '') count++;
  return count;
}

/**
 * Bundle size optimization utilities for quest components
 */
export const questBundleOptimizations = {
  // Lazy load heavy quest components
  lazyLoadQuestDashboard: () => import('@/pages/quests/QuestDashboard'),
  lazyLoadQuestFilters: () => import('@/components/quests/QuestFilters'),
  lazyLoadQuestStatisticsCard: () => import('@/components/quests/QuestStatisticsCard'),

  // Dynamic imports for heavy filtering libraries
  // lazyLoadFilteringLibrary: () => import('lodash-es'), // Removed - lodash-es not available
};

/**
 * Cache optimization for expensive quest operations
 */
export const questCacheOptimizations = {
  // Cache key generation
  generateFilterCacheKey: (quests: Quest[], filters: QuestFilters): string => {
    return `quest-filter-${quests?.length || 0}-${JSON.stringify(filters)}`;
  },

  // Cache for filtered results
  filterCache: new Map<string, { result: Quest[], timestamp: number }>(),
  cacheExpiryMs: 5 * 60 * 1000, // 5 minutes

  getCachedFilterResult: (cacheKey: string): Quest[] | null => {
    const cached = questCacheOptimizations.filterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < questCacheOptimizations.cacheExpiryMs) {
      return cached.result;
    }
    if (cached) {
      questCacheOptimizations.filterCache.delete(cacheKey);
    }
    return null;
  },

  setCachedFilterResult: (cacheKey: string, result: Quest[]): void => {
    questCacheOptimizations.filterCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  },

  clearExpiredCache: (): void => {
    const now = Date.now();
    for (const [key, cached] of questCacheOptimizations.filterCache.entries()) {
      if ((now - cached.timestamp) > questCacheOptimizations.cacheExpiryMs) {
        questCacheOptimizations.filterCache.delete(key);
      }
    }
  }
};
