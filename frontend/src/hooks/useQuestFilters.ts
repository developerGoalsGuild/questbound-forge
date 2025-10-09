/**
 * Quest Filters Hook for GoalsGuild Application
 *
 * This hook provides comprehensive quest filtering state management with
 * localStorage persistence, validation, and accessibility features.
 *
 * Exports:
 * - useQuestFilters(options) - Hook for managing quest filter state
 *
 * Features:
 * - localStorage persistence for filter preferences
 * - Debounced search input
 * - Filter validation and reset functionality
 * - Accessibility support with ARIA announcements
 * - Type-safe filter operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebouncedValidation } from './useDebouncedValidation';

export interface QuestFilters {
  status: string;
  difficulty: string;
  category: string;
  search: string;
}

export interface QuestFiltersOptions {
  /** Key for localStorage persistence */
  storageKey?: string;
  /** Default filter values */
  defaultFilters?: Partial<QuestFilters>;
  /** Debounce delay for search input (ms) */
  debounceMs?: number;
  /** Callback when filters change */
  onFiltersChange?: (filters: QuestFilters) => void;
  /** Callback for accessibility announcements */
  onAnnounce?: (message: string, priority?: 'polite' | 'assertive') => void;
}

export interface UseQuestFiltersReturn {
  // Filter state
  filters: QuestFilters;
  hasActiveFilters: boolean;

  // Filter actions
  setStatus: (status: string) => void;
  setDifficulty: (difficulty: string) => void;
  setCategory: (category: string) => void;
  setSearch: (search: string) => void;
  updateFilters: (updates: Partial<QuestFilters>) => void;
  clearFilters: () => void;
  resetToDefaults: () => void;

  // Validation
  validationErrors: Record<string, string>;
  hasValidationErrors: boolean;
  isFormValid: boolean;

  // Utility
  getActiveFilterCount: () => number;
}

/** Default filter values */
const DEFAULT_FILTERS: QuestFilters = {
  status: 'all',
  difficulty: 'all',
  category: 'all',
  search: '',
};

/** localStorage key prefix */
const STORAGE_PREFIX = 'quest-filters-';

/**
 * Hook for managing quest filter state with localStorage persistence
 *
 * @param options - Configuration options for the hook
 * @returns Filter state and actions
 */
export const useQuestFilters = (
  options: QuestFiltersOptions = {}
): UseQuestFiltersReturn => {
  const {
    storageKey = 'default',
    defaultFilters = {},
    debounceMs = 300,
    onFiltersChange,
    onAnnounce,
  } = options;

  const storageKeyFull = STORAGE_PREFIX + storageKey;

  // Load filters from localStorage or use defaults
  const loadFiltersFromStorage = useCallback((): QuestFilters => {
    try {
      const stored = localStorage.getItem(storageKeyFull);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and merge with defaults
        return {
          ...DEFAULT_FILTERS,
          ...defaultFilters,
          ...parsed,
        };
      }
    } catch (error) {
      console.warn('Failed to load quest filters from localStorage:', error);
    }
    return { ...DEFAULT_FILTERS, ...defaultFilters };
  }, [storageKeyFull, defaultFilters]);

  // Save filters to localStorage
  const saveFiltersToStorage = useCallback((filters: QuestFilters) => {
    try {
      localStorage.setItem(storageKeyFull, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save quest filters to localStorage:', error);
    }
  }, [storageKeyFull]);

  // Initialize filters
  const [filters, setFilters] = useState<QuestFilters>(loadFiltersFromStorage);

  // Debounced validation for search input
  const { debouncedValidateField, clearFieldValidation, validationErrors, hasValidationErrors, isFormValid } =
    useDebouncedValidation({ debounceMs });

  // Save to localStorage whenever filters change
  useEffect(() => {
    saveFiltersToStorage(filters);
    onFiltersChange?.(filters);
  }, [filters, saveFiltersToStorage, onFiltersChange]);

  // Filter actions
  const setStatus = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status }));
    onAnnounce?.(`Status filter set to ${status}`, 'polite');
  }, [onAnnounce]);

  const setDifficulty = useCallback((difficulty: string) => {
    setFilters(prev => ({ ...prev, difficulty }));
    onAnnounce?.(`Difficulty filter set to ${difficulty}`, 'polite');
  }, [onAnnounce]);

  const setCategory = useCallback((category: string) => {
    setFilters(prev => ({ ...prev, category }));
    onAnnounce?.(`Category filter set to ${category}`, 'polite');
  }, [onAnnounce]);

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    // Clear any previous validation errors for search
    clearFieldValidation('search');
    onAnnounce?.(`Search filter updated`, 'polite');
  }, [clearFieldValidation, onAnnounce]);

  const updateFilters = useCallback((updates: Partial<QuestFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    onAnnounce?.('Multiple filters updated', 'polite');
  }, [onAnnounce]);

  const clearFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...defaultFilters });
    clearFieldValidation();
    onAnnounce?.('All filters cleared', 'polite');
  }, [defaultFilters, clearFieldValidation, onAnnounce]);

  const resetToDefaults = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...defaultFilters });
    clearFieldValidation();
    onAnnounce?.('Filters reset to defaults', 'polite');
  }, [defaultFilters, clearFieldValidation, onAnnounce]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.difficulty !== 'all' ||
      filters.category !== 'all' ||
      filters.search.trim() !== ''
    );
  }, [filters]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.difficulty !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.search.trim() !== '') count++;
    return count;
  }, [filters]);

  return {
    // State
    filters,
    hasActiveFilters,

    // Actions
    setStatus,
    setDifficulty,
    setCategory,
    setSearch,
    updateFilters,
    clearFilters,
    resetToDefaults,

    // Validation
    validationErrors,
    hasValidationErrors,
    isFormValid,

    // Utility
    getActiveFilterCount,
  };
};
