/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserData, useUserStats, useUserGoals, useUserAchievements } from '../useUserData';
import * as userData from '@/data/userData';

// Mock the user data functions
vi.mock('@/data/userData', () => ({
  getUserDashboardData: vi.fn(),
  createUserGoal: vi.fn(),
  updateGoalProgress: vi.fn(),
  calculateOverallProgress: vi.fn(),
  getGoalsByCategory: vi.fn(),
  getUpcomingDeadlines: vi.fn()
}));

const mockUserData = vi.mocked(userData);

describe('useUserData', () => {
  const mockGoal = {
    id: '1',
    title: 'Complete React Course',
    progress: 75,
    category: 'Learning',
    dueDate: '2024-12-31'
  };

  const mockDashboardData = {
    stats: {
      activeQuests: 5,
      achievements: 12,
      guildPoints: 250,
      successRate: 85
    },
    goals: [mockGoal],
    achievements: [
      {
        name: 'First Quest',
        icon: () => <div>Icon1</div>,
        earned: true
      }
    ],
    nextAchievement: {
      description: 'Complete 10 quests',
      progress: 70,
      current: 7,
      target: 10
    }
  };

  const mockNewGoal = {
    id: '2',
    title: 'New Goal',
    progress: 0,
    category: 'Project',
    dueDate: '2024-11-15'
  };

  const mockGoalsByCategory = {
    Learning: [mockGoal],
    Project: [mockNewGoal]
  };

  const mockUpcomingDeadlines = [mockGoal];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    const { getUserDashboardData, createUserGoal, updateGoalProgress, calculateOverallProgress, getGoalsByCategory, getUpcomingDeadlines } = mockUserData;

    getUserDashboardData.mockReturnValue(mockDashboardData);
    createUserGoal.mockReturnValue(mockNewGoal);
    updateGoalProgress.mockImplementation((goal, progress) => ({ ...goal, progress }));
    calculateOverallProgress.mockReturnValue(75);
    getGoalsByCategory.mockReturnValue(mockGoalsByCategory);
    getUpcomingDeadlines.mockReturnValue(mockUpcomingDeadlines);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('fetches data on mount', async () => {
    const { result } = renderHook(() => useUserData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.overallProgress).toBe(75);
    expect(result.current.goalsByCategory).toEqual(mockGoalsByCategory);
    expect(result.current.upcomingDeadlines).toEqual(mockUpcomingDeadlines);
  });

  test('handles fetch error', async () => {
    const { getUserDashboardData } = mockUserData;
    getUserDashboardData.mockImplementation(() => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  test('refetch function reloads data', async () => {
    const { getUserDashboardData } = mockUserData;

    const { result } = renderHook(() => useUserData());

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

    expect(getUserDashboardData).toHaveBeenCalledTimes(2);
  });

  test('addGoal adds new goal to data', async () => {
    const { createUserGoal } = mockUserData;

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.addGoal({ title: 'New Goal', category: 'Project' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(createUserGoal).toHaveBeenCalledWith({ title: 'New Goal', category: 'Project' });
    expect(result.current.data?.goals).toContain(mockNewGoal);
  });

  test('addGoal handles error', async () => {
    const { createUserGoal } = mockUserData;
    createUserGoal.mockImplementation(() => {
      throw new Error('Create failed');
    });

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.addGoal({ title: 'New Goal' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Create failed');
  });

  test('updateGoal updates goal progress', async () => {
    const { updateGoalProgress } = mockUserData;

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateGoal('1', 90);
    });

    expect(updateGoalProgress).toHaveBeenCalledWith(mockGoal, 90);
    expect(result.current.data?.goals[0].progress).toBe(90);
  });

  test('updateGoal handles error', async () => {
    const { updateGoalProgress } = mockUserData;
    updateGoalProgress.mockImplementation(() => {
      throw new Error('Update failed');
    });

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateGoal('1', 90);
    });

    await waitFor(() => {
      // Should still work since error is caught
      expect(result.current.data?.goals[0].id).toBe('1');
    });
  });

  test('deleteGoal removes goal from data', async () => {
    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.goals).toHaveLength(1);

    act(() => {
      result.current.deleteGoal('1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.goals).toHaveLength(0);
  });

  test('deleteGoal handles error', async () => {
    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Force error by trying to delete non-existent goal
    act(() => {
      result.current.deleteGoal('999');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still have the original goal
    expect(result.current.data?.goals).toHaveLength(1);
  });

  test('calculates overall progress correctly', async () => {
    const { calculateOverallProgress } = mockUserData;

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(calculateOverallProgress).toHaveBeenCalledWith(mockDashboardData.goals);
    expect(result.current.overallProgress).toBe(75);
  });

  test('groups goals by category', async () => {
    const { getGoalsByCategory } = mockUserData;

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getGoalsByCategory).toHaveBeenCalledWith(mockDashboardData.goals);
    expect(result.current.goalsByCategory).toEqual(mockGoalsByCategory);
  });

  test('gets upcoming deadlines', async () => {
    const { getUpcomingDeadlines } = mockUserData;

    const { result } = renderHook(() => useUserData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getUpcomingDeadlines).toHaveBeenCalledWith(mockDashboardData.goals);
    expect(result.current.upcomingDeadlines).toEqual(mockUpcomingDeadlines);
  });
});

describe('useUserStats', () => {
  const mockStats = {
    activeQuests: 5,
    achievements: 12,
    guildPoints: 250,
    successRate: 85
  };

  const mockDashboardData = {
    stats: mockStats,
    goals: []
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getUserDashboardData } = mockUserData;
    getUserDashboardData.mockReturnValue(mockDashboardData);
  });

  test('returns stats and loading state', async () => {
    const { result } = renderHook(() => useUserStats());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
  });
});

describe('useUserGoals', () => {
  const mockGoals = [
    {
      id: '1',
      title: 'Complete React Course',
      progress: 75,
      category: 'Learning',
      dueDate: '2024-12-31'
    }
  ];

  const mockDashboardData = {
    goals: mockGoals
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getUserDashboardData, calculateOverallProgress, getGoalsByCategory, getUpcomingDeadlines } = mockUserData;

    getUserDashboardData.mockReturnValue(mockDashboardData);
    calculateOverallProgress.mockReturnValue(75);
    getGoalsByCategory.mockReturnValue({ Learning: mockGoals });
    getUpcomingDeadlines.mockReturnValue(mockGoals);
  });

  test('returns goals data and computed values', async () => {
    const { result } = renderHook(() => useUserGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.goals).toEqual(mockGoals);
    expect(result.current.overallProgress).toBe(75);
    expect(result.current.goalsByCategory).toEqual({ Learning: mockGoals });
    expect(result.current.upcomingDeadlines).toEqual(mockGoals);
  });

  test('includes goal management functions', async () => {
    const { result } = renderHook(() => useUserGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.addGoal).toBe('function');
    expect(typeof result.current.updateGoal).toBe('function');
    expect(typeof result.current.deleteGoal).toBe('function');
  });
});

describe('useUserAchievements', () => {
  const mockAchievements = [
    {
      name: 'First Quest',
      icon: () => <div>Icon1</div>,
      earned: true
    }
  ];

  const mockNextAchievement = {
    description: 'Complete 10 quests',
    progress: 70,
    current: 7,
    target: 10
  };

  const mockDashboardData = {
    achievements: mockAchievements,
    nextAchievement: mockNextAchievement
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getUserDashboardData } = mockUserData;
    getUserDashboardData.mockReturnValue(mockDashboardData);
  });

  test('returns achievements data', async () => {
    const { result } = renderHook(() => useUserAchievements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.achievements).toEqual(mockAchievements);
    expect(result.current.nextAchievement).toEqual(mockNextAchievement);
  });
});
