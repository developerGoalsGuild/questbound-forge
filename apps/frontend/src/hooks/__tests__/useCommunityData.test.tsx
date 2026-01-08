/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCommunityData, useCommunityActivities, useForumData, useLeaderboard } from '../useCommunityData';
import * as communityData from '@/data/communityData';

// Mock the community data functions
vi.mock('@/data/communityData', () => ({
  getCommunityActivities: vi.fn(),
  getForumTopics: vi.fn(),
  getGuildLeaderboard: vi.fn(),
  getActivitiesByType: vi.fn(),
  getRecentAchievements: vi.fn(),
  getCommunityStats: vi.fn(),
  getTrendingTopics: vi.fn(),
  getTopContributors: vi.fn(),
  generateCommunityActivity: vi.fn()
}));

const mockCommunityData = vi.mocked(communityData);

describe('useCommunityData', () => {
  const mockActivities = [
    {
      id: '1',
      userName: 'Alice',
      activity: 'Completed React Course',
      type: 'achievement' as const,
      timeAgo: '2 hours ago',
      details: '100% completion'
    }
  ];

  const mockForumTopics = [
    {
      id: '1',
      title: 'Best practices for goal setting',
      author: 'Bob',
      replies: 15,
      lastActivity: '1 hour ago'
    }
  ];

  const mockLeaderboard = [
    {
      rank: 1,
      userName: 'Alice',
      points: 1250,
      level: 5
    }
  ];

  const mockStats = {
    totalMembers: 15420,
    activeToday: 1234,
    goalsCompleted: 5678,
    forumPosts: 8901,
    guildEvents: 123
  };

  const mockTrendingTopics = [
    {
      id: '1',
      title: 'Time management',
      popularity: 95
    }
  ];

  const mockTopContributors = [
    {
      userName: 'Alice',
      contributions: 25
    }
  ];

  const mockRecentAchievements = [
    {
      id: '1',
      userName: 'Bob',
      activity: 'Earned "Goal Crusher" badge',
      type: 'achievement' as const,
      timeAgo: '1 hour ago'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    const { getCommunityActivities, getForumTopics, getGuildLeaderboard, getCommunityStats, getTrendingTopics, getTopContributors, getRecentAchievements } = mockCommunityData;

    getCommunityActivities.mockReturnValue(mockActivities);
    getForumTopics.mockReturnValue(mockForumTopics);
    getGuildLeaderboard.mockReturnValue(mockLeaderboard);
    getCommunityStats.mockReturnValue(mockStats);
    getTrendingTopics.mockReturnValue(mockTrendingTopics);
    getTopContributors.mockReturnValue(mockTopContributors);
    getRecentAchievements.mockReturnValue(mockRecentAchievements);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('fetches data on mount', async () => {
    const { result } = renderHook(() => useCommunityData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.forumTopics).toEqual(mockForumTopics);
    expect(result.current.leaderboard).toEqual(mockLeaderboard);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.trendingTopics).toEqual(mockTrendingTopics);
    expect(result.current.topContributors).toEqual(mockTopContributors);
    expect(result.current.recentAchievements).toEqual(mockRecentAchievements);
  });

  test('passes limit parameter to data fetching functions', async () => {
    const { getCommunityActivities, getForumTopics, getGuildLeaderboard } = mockCommunityData;

    renderHook(() => useCommunityData(5));

    await waitFor(() => {
      expect(getCommunityActivities).toHaveBeenCalledWith(5);
      expect(getForumTopics).toHaveBeenCalledWith(5);
      expect(getGuildLeaderboard).toHaveBeenCalledWith(5);
    });
  });

  test('handles fetch error', async () => {
    const { getCommunityActivities } = mockCommunityData;
    getCommunityActivities.mockImplementation(() => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() => useCommunityData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.activities).toEqual([]);
  });

  test('refetch function reloads data', async () => {
    const { getCommunityActivities } = mockCommunityData;

    const { result } = renderHook(() => useCommunityData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refetch
    act(() => {
      result.current.refetch();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getCommunityActivities).toHaveBeenCalledTimes(2);
  });

  test('addActivity adds new activity optimistically', async () => {
    const { generateCommunityActivity } = mockCommunityData;

    const newActivity = {
      id: '2',
      userName: 'Charlie',
      activity: 'New activity',
      type: 'quest' as const,
      timeAgo: 'now',
      details: 'Test'
    };

    generateCommunityActivity.mockReturnValue(newActivity);

    const { result } = renderHook(() => useCommunityData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.addActivity('Charlie', 'New activity', 'quest', 'Test');
    });

    expect(result.current.activities[0]).toEqual(newActivity);
    expect(generateCommunityActivity).toHaveBeenCalledWith('Charlie', 'New activity', 'quest', 'Test');
  });

  test('addActivity reverts on error', async () => {
    const { generateCommunityActivity } = mockCommunityData;

    generateCommunityActivity.mockImplementation(() => {
      throw new Error('Add failed');
    });

    const { result } = renderHook(() => useCommunityData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalActivities = [...result.current.activities];

    act(() => {
      result.current.addActivity('Charlie', 'New activity', 'quest');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Add failed');
    });

    // Activities should be reverted (refetch called)
    expect(result.current.activities).toEqual(originalActivities);
  });
});

describe('useCommunityActivities', () => {
  const mockActivities = [
    {
      id: '1',
      userName: 'Alice',
      activity: 'Completed React Course',
      type: 'achievement' as const,
      timeAgo: '2 hours ago'
    },
    {
      id: '2',
      userName: 'Bob',
      activity: 'Started new goal',
      type: 'quest' as const,
      timeAgo: '1 hour ago'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const { getCommunityActivities, getActivitiesByType } = mockCommunityData;
    getCommunityActivities.mockReturnValue(mockActivities);
    getActivitiesByType.mockReturnValue(mockActivities.filter(a => a.type === 'achievement'));
  });

  test('fetches all activities by default', async () => {
    const { result } = renderHook(() => useCommunityActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual(mockActivities);
  });

  test('filters activities by type when specified', async () => {
    const { getActivitiesByType } = mockCommunityData;

    const { result } = renderHook(() => useCommunityActivities('achievement', 5));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getActivitiesByType).toHaveBeenCalledWith('achievement');
    expect(result.current.activities).toEqual([mockActivities[0]]); // Only achievement
  });

  test('respects limit parameter', async () => {
    const { getCommunityActivities } = mockCommunityData;

    renderHook(() => useCommunityActivities(undefined, 1));

    await waitFor(() => {
      expect(getCommunityActivities).toHaveBeenCalledWith(1);
    });
  });
});

describe('useForumData', () => {
  const mockTopics = [
    {
      id: '1',
      title: 'Forum topic',
      author: 'Alice',
      replies: 5
    }
  ];

  const mockTrendingTopics = [
    {
      id: '1',
      title: 'Trending topic',
      popularity: 90
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const { getForumTopics, getTrendingTopics } = mockCommunityData;
    getForumTopics.mockReturnValue(mockTopics);
    getTrendingTopics.mockReturnValue(mockTrendingTopics);
  });

  test('fetches forum topics and trending topics', async () => {
    const { result } = renderHook(() => useForumData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.topics).toEqual(mockTopics);
    expect(result.current.trendingTopics).toEqual(mockTrendingTopics);
  });

  test('passes limit to getForumTopics', async () => {
    const { getForumTopics } = mockCommunityData;

    renderHook(() => useForumData(10));

    await waitFor(() => {
      expect(getForumTopics).toHaveBeenCalledWith(10);
    });
  });
});

describe('useLeaderboard', () => {
  const mockLeaderboard = [
    {
      rank: 1,
      userName: 'Alice',
      points: 1250
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const { getGuildLeaderboard } = mockCommunityData;
    getGuildLeaderboard.mockReturnValue(mockLeaderboard);
  });

  test('fetches leaderboard data', async () => {
    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.leaderboard).toEqual(mockLeaderboard);
  });

  test('passes limit to getGuildLeaderboard', async () => {
    const { getGuildLeaderboard } = mockCommunityData;

    renderHook(() => useLeaderboard(5));

    await waitFor(() => {
      expect(getGuildLeaderboard).toHaveBeenCalledWith(5);
    });
  });
});
