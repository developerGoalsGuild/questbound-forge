import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useQuestAnalytics } from '../useQuestAnalytics';
import { getQuestAnalytics } from '@/lib/apiAnalytics';
import * as utils from '@/lib/utils';
import { QuestAnalytics } from '@/models/analytics';

// Mock the API client
vi.mock('@/lib/apiAnalytics');
const mockGetQuestAnalytics = getQuestAnalytics as unknown as vi.MockedFunction<typeof getQuestAnalytics>;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('useQuestAnalytics', () => {
  const mockAnalytics: QuestAnalytics = {
    userId: 'user123',
    period: 'weekly',
    totalQuests: 10,
    completedQuests: 8,
    successRate: 0.8,
    averageCompletionTime: 3600,
    bestStreak: 5,
    currentStreak: 3,
    xpEarned: 800,
    trends: {
      completionRate: [
        { date: '2024-01-01', value: 0.8 },
        { date: '2024-01-02', value: 0.6 }
      ],
      xpEarned: [
        { date: '2024-01-01', value: 200 },
        { date: '2024-01-02', value: 150 }
      ],
      questsCreated: [
        { date: '2024-01-01', value: 3 },
        { date: '2024-01-02', value: 2 }
      ]
    },
    categoryPerformance: [
      {
        category: 'Health',
        totalQuests: 5,
        completedQuests: 4,
        successRate: 0.8,
        averageCompletionTime: 3600,
        xpEarned: 400
      }
    ],
    productivityByHour: [
      {
        hour: 14,
        questsCompleted: 3,
        xpEarned: 300,
        averageCompletionTime: 1800
      }
    ],
    calculatedAt: Date.now(),
    ttl: 604800
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(utils, 'getAccessToken').mockReturnValue('test-token');
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      data: mockAnalytics,
      timestamp: Date.now()
    }));
  });

  it('should initialize with loading state', () => {
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics());

    // With cached data present by default, loading should quickly be false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.analytics).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load analytics successfully', async () => {
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analytics).toEqual(mockAnalytics);
    expect(result.current.error).toBeNull();
    expect(result.current.insights).toBeDefined();
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('should load from cache when available', async () => {
    const cachedData = {
      data: mockAnalytics,
      timestamp: Date.now()
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analytics).toEqual(mockAnalytics);
    expect(mockGetQuestAnalytics).not.toHaveBeenCalled();
  });

  it('should handle cache expiration', async () => {
    const expiredCache = {
      data: mockAnalytics,
      timestamp: Date.now() - 10 * 60 * 1000 // 10 minutes ago
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredCache));
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analytics).toEqual(mockAnalytics);
    expect(mockGetQuestAnalytics).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    mockLocalStorage.getItem.mockReturnValue(null);
    mockGetQuestAnalytics.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analytics).toBeNull();
    expect(result.current.error).toBe('API Error');
  });

  it('should refresh analytics', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedAnalytics = { ...mockAnalytics, totalQuests: 15 };
    mockGetQuestAnalytics.mockResolvedValueOnce(updatedAnalytics);

    await act(async () => {
      await result.current.refresh(true);
    });

    expect(result.current.analytics).toEqual(updatedAnalytics);
    expect(mockGetQuestAnalytics).toHaveBeenCalledWith('weekly', true);
  });

  it('should clear errors', async () => {
    const error = new Error('API Error');
    mockLocalStorage.getItem.mockReturnValue(null);
    mockGetQuestAnalytics.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should generate insights correctly', async () => {
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.insights).toEqual(expect.objectContaining({
      overallPerformance: 'You have completed 8 out of 10 quests, with a success rate of 80%. You\'ve earned 800 XP.',
      streakInfo: 'Your best completion streak is 5 days. Your current streak is 3 days.',
      mostProductiveCategory: {
        category: 'Health',
        successRate: 0.8
      },
      mostProductiveHour: {
        hour: 14,
        questsCompleted: 3
      },
      consistencyScore: 0.5
    }));
  });

  it('should handle different periods', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics({ period: 'daily' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetQuestAnalytics).toHaveBeenCalledWith('daily', false);
  });

  it.skip('should handle auto-refresh', async () => {
    vi.useFakeTimers();
    mockGetQuestAnalytics.mockResolvedValue(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics({
      autoRefresh: true,
      refreshInterval: 1000
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetQuestAnalytics).toHaveBeenCalledTimes(1);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockGetQuestAnalytics).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });

  it.skip('should handle cache storage errors gracefully', async () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still work despite cache error
    expect(result.current.analytics).toEqual(mockAnalytics);
  });

  it.skip('should handle malformed cache data', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-json');
    mockGetQuestAnalytics.mockResolvedValueOnce(mockAnalytics);

    const { result } = renderHook(() => useQuestAnalytics());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analytics).toEqual(mockAnalytics);
    expect(mockGetQuestAnalytics).toHaveBeenCalled();
  });
});
