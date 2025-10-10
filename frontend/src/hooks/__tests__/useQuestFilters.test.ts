/**
 * Tests for useQuestFilters hook
 *
 * Tests cover:
 * - localStorage persistence and retrieval
 * - Filter state management
 * - Accessibility announcements
 * - Validation and error handling
 * - Edge cases and performance
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQuestFilters } from '../useQuestFilters';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the useDebouncedValidation hook
vi.mock('../useDebouncedValidation', () => ({
  useDebouncedValidation: vi.fn(() => ({
    debouncedValidateField: vi.fn(),
    clearFieldValidation: vi.fn(),
    validationErrors: {},
    hasValidationErrors: false,
    isFormValid: true,
  })),
}));

describe('useQuestFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnAnnounce = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('loads filters from localStorage on mount', () => {
      const storedFilters = {
        status: 'completed',
        difficulty: 'hard',
        category: 'Work',
        search: 'test quest',
      };
      localStorageMock.setItem('quest-filters-default', JSON.stringify(storedFilters));

      const { result } = renderHook(() =>
        useQuestFilters({
          storageKey: 'default',
        })
      );

      expect(result.current.filters).toEqual(storedFilters);
    });

    it('uses default filters when no localStorage data exists', () => {
      const { result } = renderHook(() => useQuestFilters());

      expect(result.current.filters).toEqual({
        status: 'all',
        difficulty: 'all',
        category: 'all',
        search: '',
      });
    });

    it('merges stored filters with default overrides', () => {
      const storedFilters = { status: 'completed', difficulty: 'hard' };
      localStorageMock.setItem('quest-filters-custom', JSON.stringify(storedFilters));

      const { result } = renderHook(() =>
        useQuestFilters({
          storageKey: 'custom',
          defaultFilters: { category: 'Personal', search: 'default search' },
        })
      );

      expect(result.current.filters).toEqual({
        status: 'completed',
        difficulty: 'hard',
        category: 'Personal', // Override from defaults
        search: 'default search', // Override from defaults
      });
    });

    it('handles invalid localStorage data gracefully', () => {
      localStorageMock.setItem('quest-filters-invalid', 'invalid json');

      const { result } = renderHook(() =>
        useQuestFilters({
          storageKey: 'invalid',
        })
      );

      // Should fall back to defaults
      expect(result.current.filters).toEqual({
        status: 'all',
        difficulty: 'all',
        category: 'all',
        search: '',
      });
    });
  });

  describe('Filter State Management', () => {
    it('updates status filter correctly', () => {
      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.setStatus('completed');
      });

      expect(result.current.filters.status).toBe('completed');
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        status: 'completed',
        difficulty: 'all',
        category: 'all',
        search: '',
      });
    });

    it('updates difficulty filter correctly', () => {
      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.setDifficulty('hard');
      });

      expect(result.current.filters.difficulty).toBe('hard');
    });

    it('updates category filter correctly', () => {
      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.setCategory('Work');
      });

      expect(result.current.filters.category).toBe('Work');
    });

    it('updates search filter correctly', () => {
      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.setSearch('test quest');
      });

      expect(result.current.filters.search).toBe('test quest');
    });

    it('updates multiple filters at once', () => {
      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.updateFilters({
          status: 'active',
          difficulty: 'medium',
          search: 'updated search',
        });
      });

      expect(result.current.filters).toEqual({
        status: 'active',
        difficulty: 'medium',
        category: 'all',
        search: 'updated search',
      });
    });

    it('clears all filters correctly', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          defaultFilters: { status: 'active', category: 'Work' },
        })
      );

      // Set some filters first
      act(() => {
        result.current.setStatus('completed');
        result.current.setDifficulty('hard');
        result.current.setSearch('test');
      });

      // Clear filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        status: 'active', // Should be default
        difficulty: 'all',
        category: 'Work', // Should be default
        search: '',
      });
    });

    it('resets to defaults correctly', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          defaultFilters: { status: 'active', category: 'Work' },
        })
      );

      // Change filters
      act(() => {
        result.current.setStatus('completed');
        result.current.setCategory('Personal');
      });

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.filters).toEqual({
        status: 'active',
        difficulty: 'all',
        category: 'Work',
        search: '',
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('saves filters to localStorage when they change', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          storageKey: 'test',
        })
      );

      act(() => {
        result.current.setStatus('completed');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quest-filters-test',
        JSON.stringify({
          status: 'completed',
          difficulty: 'all',
          category: 'all',
          search: '',
        })
      );
    });

    it('uses different storage keys for different instances', () => {
      const { result: result1 } = renderHook(() =>
        useQuestFilters({
          storageKey: 'key1',
        })
      );

      const { result: result2 } = renderHook(() =>
        useQuestFilters({
          storageKey: 'key2',
        })
      );

      act(() => {
        result1.current.setStatus('completed');
      });

      act(() => {
        result2.current.setDifficulty('hard');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quest-filters-key1',
        JSON.stringify({
          status: 'completed',
          difficulty: 'all',
          category: 'all',
          search: '',
        })
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quest-filters-key2',
        JSON.stringify({
          status: 'all',
          difficulty: 'hard',
          category: 'all',
          search: '',
        })
      );
    });

    it('handles localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useQuestFilters());

      // Should not crash when trying to save
      expect(() => {
        act(() => {
          result.current.setStatus('completed');
        });
      }).not.toThrow();
    });
  });

  describe('Accessibility and Announcements', () => {
    it('calls onAnnounce when filters change', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          onAnnounce: mockOnAnnounce,
        })
      );

      act(() => {
        result.current.setStatus('completed');
      });

      expect(mockOnAnnounce).toHaveBeenCalledWith('Status filter set to completed', 'polite');
    });

    it('calls onAnnounce with different priorities', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          onAnnounce: mockOnAnnounce,
        })
      );

      act(() => {
        result.current.clearFilters();
      });

      expect(mockOnAnnounce).toHaveBeenCalledWith('All filters cleared', 'polite');
    });

    it('does not call onAnnounce when callback is not provided', () => {
      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.setStatus('completed');
      });

      expect(mockOnAnnounce).not.toHaveBeenCalled();
    });
  });

  describe('Computed Values', () => {
    it('correctly identifies active filters', () => {
      const { result } = renderHook(() => useQuestFilters());

      expect(result.current.hasActiveFilters).toBe(false);

      act(() => {
        result.current.setStatus('completed');
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.setStatus('all');
        result.current.setSearch('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('counts active filters correctly', () => {
      const { result } = renderHook(() => useQuestFilters());

      expect(result.current.getActiveFilterCount()).toBe(0);

      act(() => {
        result.current.setStatus('completed');
        result.current.setDifficulty('hard');
        result.current.setSearch('test');
      });

      expect(result.current.getActiveFilterCount()).toBe(3);
    });
  });

  describe('Performance and Re-rendering', () => {
    it('memoizes filter state correctly', () => {
      const { result, rerender } = renderHook(() => useQuestFilters());

      const initialFilters = result.current.filters;

      rerender();

      expect(result.current.filters).toBe(initialFilters);
    });

    it('only saves to localStorage when filters actually change', () => {
      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.setStatus('completed');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.setStatus('completed'); // Same value
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty storage key', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          storageKey: '',
        })
      );

      act(() => {
        result.current.setStatus('completed');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quest-filters-',
        expect.any(String)
      );
    });

    it('handles undefined storage key', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          storageKey: undefined,
        })
      );

      act(() => {
        result.current.setStatus('completed');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quest-filters-default',
        expect.any(String)
      );
    });

    it('handles malformed stored data with missing keys', () => {
      localStorageMock.setItem('quest-filters-malformed', JSON.stringify({ status: 'completed' }));

      const { result } = renderHook(() =>
        useQuestFilters({
          storageKey: 'malformed',
        })
      );

      expect(result.current.filters).toEqual({
        status: 'completed',
        difficulty: 'all',
        category: 'all',
        search: '',
      });
    });
  });

  describe('Integration with Callbacks', () => {
    it('calls onFiltersChange with updated filters', () => {
      const { result } = renderHook(() =>
        useQuestFilters({
          onFiltersChange: mockOnFiltersChange,
        })
      );

      act(() => {
        result.current.setStatus('completed');
        result.current.setDifficulty('hard');
      });

      expect(mockOnFiltersChange).toHaveBeenCalledTimes(2);
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
        status: 'completed',
        difficulty: 'hard',
        category: 'all',
        search: '',
      });
    });

    it('debounces search input validation', () => {
      const mockValidate = vi.fn();
      const mockUseDebouncedValidation = vi.mocked(require('../useDebouncedValidation').useDebouncedValidation);

      mockUseDebouncedValidation.mockReturnValue({
        debouncedValidateField: mockValidate,
        clearFieldValidation: vi.fn(),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      const { result } = renderHook(() => useQuestFilters());

      act(() => {
        result.current.setSearch('test search');
      });

      expect(mockValidate).toHaveBeenCalledWith('search', 'test search');
    });
  });
});


