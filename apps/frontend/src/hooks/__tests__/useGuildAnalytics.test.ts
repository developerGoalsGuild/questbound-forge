/**
 * useGuildAnalytics Hook Tests
 *
 * Tests for the useGuildAnalytics hook including data fetching,
 * loading states, error handling, and auto-refresh functionality.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useGuildAnalytics } from '../useGuildAnalytics';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('useGuildAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return loading state initially', () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild-1' })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should fetch and return analytics data', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild-1' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.totalMembers).toBeGreaterThan(0);
      expect(result.current.data?.totalGoals).toBeGreaterThan(0);
      expect(result.current.data?.totalQuests).toBeGreaterThan(0);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle different guild IDs', async () => {
      const { result: result1 } = renderHook(() =>
        useGuildAnalytics({ guildId: 'guild-1' })
      );

      const { result: result2 } = renderHook(() =>
        useGuildAnalytics({ guildId: 'guild-2' })
      );

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
        expect(result2.current.loading).toBe(false);
      });

      // Different guild IDs should generate different data
      expect(result1.current.data).toBeDefined();
      expect(result2.current.data).toBeDefined();
      // Note: Due to randomness in mock data generation, we can't guarantee different values
      // but we can ensure both have valid data structures
      expect(result1.current.data?.createdAt).toBeDefined();
      expect(result2.current.data?.createdAt).toBeDefined();
    });
  });

  describe('Data Structure', () => {
    it('should return data with all required fields', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const data = result.current.data;
      expect(data).toBeDefined();

      // Basic metrics
      expect(typeof data?.totalMembers).toBe('number');
      expect(typeof data?.activeMembers).toBe('number');
      expect(typeof data?.totalGoals).toBe('number');
      expect(typeof data?.completedGoals).toBe('number');
      expect(typeof data?.totalQuests).toBe('number');
      expect(typeof data?.completedQuests).toBe('number');

      // Activity metrics
      expect(typeof data?.weeklyActivity).toBe('number');
      expect(typeof data?.monthlyActivity).toBe('number');
      expect(typeof data?.averageGoalCompletion).toBe('number');
      expect(typeof data?.averageQuestCompletion).toBe('number');

      // Growth metrics
      expect(typeof data?.memberGrowthRate).toBe('number');
      expect(typeof data?.goalGrowthRate).toBe('number');
      expect(typeof data?.questGrowthRate).toBe('number');

      // Performance metrics
      expect(typeof data?.topPerformers).toBe('number');
      expect(typeof data?.newMembersThisWeek).toBe('number');
      expect(typeof data?.goalsCreatedThisWeek).toBe('number');
      expect(typeof data?.questsCompletedThisWeek).toBe('number');

      // Time-based data
      expect(typeof data?.createdAt).toBe('string');
      expect(typeof data?.lastActivityAt).toBe('string');
    });

    it('should return valid date strings', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const data = result.current.data;
      expect(data).toBeDefined();

      // Check that date strings are valid
      expect(() => new Date(data?.createdAt!)).not.toThrow();
      expect(() => new Date(data?.lastActivityAt!)).not.toThrow();

      // Check that dates are in the past
      const createdAt = new Date(data?.createdAt!);
      const lastActivity = new Date(data?.lastActivityAt!);
      const now = new Date();

      expect(createdAt.getTime()).toBeLessThan(now.getTime());
      expect(lastActivity.getTime()).toBeLessThan(now.getTime());
    });

    it('should return reasonable value ranges', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const data = result.current.data;
      expect(data).toBeDefined();

      // Check reasonable ranges for metrics
      expect(data?.totalMembers).toBeGreaterThanOrEqual(10);
      expect(data?.totalMembers).toBeLessThanOrEqual(60);
      expect(data?.activeMembers).toBeLessThanOrEqual(data?.totalMembers!);
      expect(data?.completedGoals).toBeLessThanOrEqual(data?.totalGoals!);
      expect(data?.completedQuests).toBeLessThanOrEqual(data?.totalQuests!);

      // Activity percentages should be 0-100
      expect(data?.weeklyActivity).toBeGreaterThanOrEqual(60);
      expect(data?.weeklyActivity).toBeLessThanOrEqual(100);
      expect(data?.monthlyActivity).toBeGreaterThanOrEqual(50);
      expect(data?.monthlyActivity).toBeLessThanOrEqual(80);

      // Completion rates should be 70-100
      expect(data?.averageGoalCompletion).toBeGreaterThanOrEqual(70);
      expect(data?.averageGoalCompletion).toBeLessThanOrEqual(100);
      expect(data?.averageQuestCompletion).toBeGreaterThanOrEqual(75);
      expect(data?.averageQuestCompletion).toBeLessThanOrEqual(100);
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide a refresh function', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.refresh).toBe('function');
    });

    it('should refresh data when refresh is called', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialData = result.current.data;
      const initialLastUpdated = result.current.lastUpdated;

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.lastUpdated).not.toEqual(initialLastUpdated);
      // Note: Due to randomness, we can't guarantee different data values
      // but we can ensure the refresh was called and lastUpdated changed
    });

    it('should handle refresh errors gracefully', async () => {
      // Mock console.error to avoid noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // The mock implementation should handle errors gracefully
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should not auto-refresh by default', () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: 'test-guild' })
      );

      expect(result.current.loading).toBe(true);

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(35000); // 35 seconds
      });

      // Should still be in initial loading state
      expect(result.current.loading).toBe(true);
    });

    it('should auto-refresh when enabled', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({
          guildId: 'test-guild',
          autoRefresh: true,
          refreshInterval: 1000, // 1 second for testing
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLastUpdated = result.current.lastUpdated;

      // Fast-forward time to trigger auto-refresh
      act(() => {
        vi.advanceTimersByTime(1100); // 1.1 seconds
      });

      await waitFor(() => {
        expect(result.current.lastUpdated).not.toEqual(initialLastUpdated);
      });
    });

    it('should use custom refresh interval', async () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({
          guildId: 'test-guild',
          autoRefresh: true,
          refreshInterval: 5000, // 5 seconds
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLastUpdated = result.current.lastUpdated;

      // Fast-forward less than refresh interval
      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds
      });

      // Should not have refreshed yet
      expect(result.current.lastUpdated).toEqual(initialLastUpdated);

      // Fast-forward past refresh interval
      act(() => {
        vi.advanceTimersByTime(3000); // Total 6 seconds
      });

      await waitFor(() => {
        expect(result.current.lastUpdated).not.toEqual(initialLastUpdated);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty guildId gracefully', () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: '' })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle undefined guildId gracefully', () => {
      const { result } = renderHook(() =>
        useGuildAnalytics({ guildId: undefined as any })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', async () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useGuildAnalytics({ guildId: 'test-guild' });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have rendered a reasonable number of times
      expect(renderCount).toBeLessThan(10);
    });

    it('should handle rapid guildId changes', async () => {
      const { result, rerender } = renderHook(
        ({ guildId }) => useGuildAnalytics({ guildId }),
        { initialProps: { guildId: 'guild-1' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change guildId rapidly
      rerender({ guildId: 'guild-2' });
      rerender({ guildId: 'guild-3' });
      rerender({ guildId: 'guild-4' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.error).toBeNull();
    });
  });
});
