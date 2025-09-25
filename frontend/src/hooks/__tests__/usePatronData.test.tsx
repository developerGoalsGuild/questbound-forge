/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePatronData, usePatronImpact, usePatronContributions, usePatronBenefits, usePatronImpactStories } from '../usePatronData';
import * as patronData from '@/data/patronData';

// Mock the patron data functions
vi.mock('@/data/patronData', () => ({
  getPatronDashboardData: vi.fn(),
  createContribution: vi.fn(),
  processContribution: vi.fn(),
  getTotalContributions: vi.fn(),
  getTotalImpact: vi.fn(),
  calculatePatronTier: vi.fn(),
  getNextTierRequirement: vi.fn(),
  generateImpactReport: vi.fn()
}));

const mockPatronData = vi.mocked(patronData);

describe('usePatronData', () => {
  const mockContribution = {
    id: '1',
    month: 'December 2024',
    amount: 50,
    impact: 3,
    status: 'processed' as const
  };

  const mockDashboardData = {
    impact: {
      totalSupported: 127,
      goalsAchieved: 89,
      communityGrowth: 23,
      totalContributed: 2500
    },
    contributions: [mockContribution],
    benefits: [
      {
        name: 'Priority Support',
        unlocked: true,
        requirement: null
      }
    ],
    impactStories: [
      {
        id: '1',
        title: 'Maria\'s Career Transformation',
        description: 'Thanks to your support...',
        impact: 'Direct contribution'
      }
    ],
    communityStats: {
      goalSuccessRate: 87,
      livesImpacted: 156,
      thankYouMessages: 23
    }
  };

  const mockNewContribution = {
    id: '2',
    month: 'January 2025',
    amount: 75,
    impact: 4,
    status: 'pending' as const
  };

  const mockImpactReport = {
    totalAmount: 2500,
    totalImpact: 127,
    averageImpactPerDollar: '0.05',
    currentTier: 'Guild Benefactor',
    nextTier: { tier: 'Legendary Patron', required: 5000 },
    monthlyTrend: 15
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    const { getPatronDashboardData, createContribution, processContribution, calculatePatronTier, getNextTierRequirement, generateImpactReport } = mockPatronData;

    getPatronDashboardData.mockReturnValue(mockDashboardData);
    createContribution.mockReturnValue(mockNewContribution);
    processContribution.mockImplementation((contribution) => ({ ...contribution, status: 'processed' }));
    calculatePatronTier.mockReturnValue('Guild Benefactor');
    getNextTierRequirement.mockReturnValue({ tier: 'Legendary Patron', required: 5000 });
    generateImpactReport.mockReturnValue(mockImpactReport);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('fetches data on mount', async () => {
    const { result } = renderHook(() => usePatronData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.impactReport).toEqual(mockImpactReport);
    expect(result.current.patronTier).toBe('Guild Benefactor');
  });

  test('handles fetch error', async () => {
    const { getPatronDashboardData } = mockPatronData;
    getPatronDashboardData.mockImplementation(() => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  test('refetch function reloads data', async () => {
    const { getPatronDashboardData } = mockPatronData;

    const { result } = renderHook(() => usePatronData());

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

    expect(getPatronDashboardData).toHaveBeenCalledTimes(2);
  });

  test('addContribution adds new contribution and updates impact', async () => {
    const { createContribution } = mockPatronData;

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalTotal = result.current.data?.impact.totalContributed;

    act(() => {
      result.current.addContribution({ month: 'January 2025', amount: 75 });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(createContribution).toHaveBeenCalledWith({ month: 'January 2025', amount: 75 });
    expect(result.current.data?.contributions[0]).toEqual(mockNewContribution);
    expect(result.current.data?.impact.totalContributed).toBe((originalTotal || 0) + 75);
  });

  test('addContribution handles error', async () => {
    const { createContribution } = mockPatronData;
    createContribution.mockImplementation(() => {
      throw new Error('Create failed');
    });

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.addContribution({ amount: 50 });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Create failed');
  });

  test('processContributionById updates contribution status', async () => {
    const { processContribution } = mockPatronData;

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.processContributionById('1');
    });

    expect(processContribution).toHaveBeenCalledWith(mockContribution);
    expect(result.current.data?.contributions[0].status).toBe('processed');
  });

  test('processContributionById handles error', async () => {
    const { processContribution } = mockPatronData;
    processContribution.mockImplementation(() => {
      throw new Error('Process failed');
    });

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.processContributionById('1');
    });

    await waitFor(() => {
      // Should still work since error is caught
      expect(result.current.data?.contributions[0].id).toBe('1');
    });
  });

  test('calculates patron tier correctly', async () => {
    const { calculatePatronTier } = mockPatronData;

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(calculatePatronTier).toHaveBeenCalledWith(mockDashboardData.impact.totalContributed);
    expect(result.current.patronTier).toBe('Guild Benefactor');
  });

  test('gets next tier requirement', async () => {
    const { getNextTierRequirement } = mockPatronData;

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getNextTierRequirement).toHaveBeenCalledWith(mockDashboardData.impact.totalContributed);
    expect(result.current.nextTier).toEqual({ tier: 'Legendary Patron', required: 5000 });
  });

  test('generates impact report', async () => {
    const { generateImpactReport } = mockPatronData;

    const { result } = renderHook(() => usePatronData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(generateImpactReport).toHaveBeenCalledWith(mockDashboardData.contributions);
    expect(result.current.impactReport).toEqual(mockImpactReport);
  });
});

describe('usePatronImpact', () => {
  const mockDashboardData = {
    impact: {
      totalSupported: 127,
      goalsAchieved: 89,
      communityGrowth: 23,
      totalContributed: 2500
    },
    contributions: []
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getPatronDashboardData } = mockPatronData;
    getPatronDashboardData.mockReturnValue(mockDashboardData);
  });

  test('returns impact data and loading state', async () => {
    const { result } = renderHook(() => usePatronImpact());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.impact).toEqual(mockDashboardData.impact);
  });
});

describe('usePatronContributions', () => {
  const mockContributions = [
    {
      id: '1',
      month: 'December 2024',
      amount: 50,
      impact: 3,
      status: 'processed' as const
    }
  ];

  const mockDashboardData = {
    contributions: mockContributions
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getPatronDashboardData, getTotalContributions, getTotalImpact } = mockPatronData;

    getPatronDashboardData.mockReturnValue(mockDashboardData);
    getTotalContributions.mockReturnValue(50);
    getTotalImpact.mockReturnValue(3);
  });

  test('returns contributions data and computed values', async () => {
    const { result } = renderHook(() => usePatronContributions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.contributions).toEqual(mockContributions);
    expect(result.current.totalContributions).toBe(50);
    expect(result.current.totalImpact).toBe(3);
  });

  test('includes contribution management functions', async () => {
    const { result } = renderHook(() => usePatronContributions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.addContribution).toBe('function');
    expect(typeof result.current.processContribution).toBe('function');
  });
});

describe('usePatronBenefits', () => {
  const mockBenefits = [
    {
      name: 'Priority Support',
      unlocked: true,
      requirement: null
    },
    {
      name: 'Monthly Virtual Meetups',
      unlocked: false,
      requirement: '$100+ monthly contribution'
    }
  ];

  const mockDashboardData = {
    impact: {
      totalSupported: 127,
      goalsAchieved: 89,
      communityGrowth: 23,
      totalContributed: 2500
    },
    contributions: [],
    benefits: mockBenefits,
    impactStories: [],
    communityStats: {
      goalSuccessRate: 87,
      livesImpacted: 156,
      thankYouMessages: 23
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getPatronDashboardData, calculatePatronTier, getNextTierRequirement } = mockPatronData;

    getPatronDashboardData.mockReturnValue(mockDashboardData);
    calculatePatronTier.mockReturnValue('Guild Benefactor');
    getNextTierRequirement.mockReturnValue({ tier: 'Legendary Patron', required: 5000 });
  });

  test('returns benefits data with categorized benefits', async () => {
    const { result } = renderHook(() => usePatronBenefits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.benefits).toEqual(mockBenefits);
    expect(result.current.unlockedBenefits).toEqual([mockBenefits[0]]);
    expect(result.current.lockedBenefits).toEqual([mockBenefits[1]]);
    expect(result.current.patronTier).toBe('Guild Benefactor');
    expect(result.current.nextTier).toEqual({ tier: 'Legendary Patron', required: 5000 });
  });
});

describe('usePatronImpactStories', () => {
  const mockImpactStories = [
    {
      id: '1',
      title: 'Maria\'s Career Transformation',
      description: 'Thanks to your support...',
      impact: 'Direct contribution'
    }
  ];

  const mockCommunityStats = {
    goalSuccessRate: 87,
    livesImpacted: 156,
    thankYouMessages: 23
  };

  const mockDashboardData = {
    impactStories: mockImpactStories,
    communityStats: mockCommunityStats
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getPatronDashboardData } = mockPatronData;
    getPatronDashboardData.mockReturnValue(mockDashboardData);
  });

  test('returns impact stories and community stats', async () => {
    const { result } = renderHook(() => usePatronImpactStories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stories).toEqual(mockImpactStories);
    expect(result.current.communityStats).toEqual(mockCommunityStats);
  });
});
