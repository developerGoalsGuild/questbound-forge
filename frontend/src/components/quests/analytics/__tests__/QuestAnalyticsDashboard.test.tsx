import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QuestAnalyticsDashboard } from '../QuestAnalyticsDashboard';
import { useQuestAnalytics } from '@/hooks/useQuestAnalytics';
import { QuestAnalytics } from '@/models/analytics';

// Mock the hook
vi.mock('@/hooks/useQuestAnalytics');
const mockUseQuestAnalytics = vi.mocked(useQuestAnalytics);

// Mock the chart components
vi.mock('../TrendChart', () => {
  return {
    default: function MockTrendChart({ data, period }: any) {
      return <div data-testid="trend-chart">Trend Chart - {period}</div>;
    }
  };
});

vi.mock('../CategoryPerformanceChart', () => {
  return {
    default: function MockCategoryPerformanceChart({ data }: any) {
      return <div data-testid="category-chart">Category Chart</div>;
    }
  };
});

vi.mock('../ProductivityHeatmap', () => {
  return {
    default: function MockProductivityHeatmap({ data }: any) {
      return <div data-testid="productivity-heatmap">Productivity Heatmap</div>;
    }
  };
});

vi.mock('../InsightCards', () => {
  return {
    default: function MockInsightCards({ insights }: any) {
      return <div data-testid="insight-cards">Insight Cards</div>;
    }
  };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

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

const mockInsights = {
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
  trend: 'stable' as const,
  consistencyScore: 0.5
};

describe('QuestAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseQuestAnalytics.mockReturnValue({
      analytics: null,
      insights: null,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
      clearError: vi.fn(),
      lastUpdated: null
    });

    render(<QuestAnalyticsDashboard />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseQuestAnalytics.mockReturnValue({
      analytics: null,
      insights: null,
      isLoading: false,
      error: 'API Error',
      refresh: vi.fn(),
      clearError: vi.fn(),
      lastUpdated: null
    });

    render(<QuestAnalyticsDashboard />);

    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should render analytics data', () => {
    mockUseQuestAnalytics.mockReturnValue({
      analytics: mockAnalytics,
      insights: mockInsights,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      clearError: vi.fn(),
      lastUpdated: new Date('2024-01-01T12:00:00Z')
    });

    render(<QuestAnalyticsDashboard />);

    expect(screen.getByText('analytics.title')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // totalQuests
    expect(screen.getByText('80%')).toBeInTheDocument(); // successRate
    expect(screen.getByText('5 days')).toBeInTheDocument(); // bestStreak
    expect(screen.getByText('800')).toBeInTheDocument(); // xpEarned
  });

  it('should render no data state', () => {
    mockUseQuestAnalytics.mockReturnValue({
      analytics: null,
      insights: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      clearError: vi.fn(),
      lastUpdated: null
    });

    render(<QuestAnalyticsDashboard />);

    expect(screen.getByText('analytics.noData')).toBeInTheDocument();
  });

  it('should handle period change', async () => {
    const mockRefresh = vi.fn();
    mockUseQuestAnalytics.mockReturnValue({
      analytics: mockAnalytics,
      insights: mockInsights,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
      clearError: vi.fn(),
      lastUpdated: new Date('2024-01-01T12:00:00Z')
    });

    render(<QuestAnalyticsDashboard />);

    const periodSelect = screen.getByRole('combobox');
    fireEvent.click(periodSelect);

    const dailyOption = screen.getByText('analytics.periods.daily');
    fireEvent.click(dailyOption);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle refresh button click', async () => {
    const mockRefresh = vi.fn();
    mockUseQuestAnalytics.mockReturnValue({
      analytics: mockAnalytics,
      insights: mockInsights,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
      clearError: vi.fn(),
      lastUpdated: new Date('2024-01-01T12:00:00Z')
    });

    render(<QuestAnalyticsDashboard />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledWith(true);
    });
  });

  it('should render chart components', () => {
    mockUseQuestAnalytics.mockReturnValue({
      analytics: mockAnalytics,
      insights: mockInsights,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      clearError: vi.fn(),
      lastUpdated: new Date('2024-01-01T12:00:00Z')
    });

    render(<QuestAnalyticsDashboard />);

    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('category-chart')).toBeInTheDocument();
    expect(screen.getByTestId('productivity-heatmap')).toBeInTheDocument();
    expect(screen.getByTestId('insight-cards')).toBeInTheDocument();
  });

  it('should show last updated time', () => {
    const lastUpdated = new Date('2024-01-01T12:00:00Z');
    mockUseQuestAnalytics.mockReturnValue({
      analytics: mockAnalytics,
      insights: mockInsights,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      clearError: vi.fn(),
      lastUpdated
    });

    render(<QuestAnalyticsDashboard />);

    expect(screen.getByText('analytics.lastUpdated')).toBeInTheDocument();
    expect(screen.getByText('12:00:00 PM')).toBeInTheDocument();
  });

  it('should handle retry button in error state', async () => {
    const mockRefresh = vi.fn();
    mockUseQuestAnalytics.mockReturnValue({
      analytics: null,
      insights: null,
      isLoading: false,
      error: 'API Error',
      refresh: mockRefresh,
      clearError: vi.fn(),
      lastUpdated: null
    });

    render(<QuestAnalyticsDashboard />);

    const retryButton = screen.getByText('analytics.actions.retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledWith(true);
    });
  });

  it('should apply custom className', () => {
    mockUseQuestAnalytics.mockReturnValue({
      analytics: mockAnalytics,
      insights: mockInsights,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      clearError: vi.fn(),
      lastUpdated: new Date('2024-01-01T12:00:00Z')
    });

    const { container } = render(<QuestAnalyticsDashboard className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
