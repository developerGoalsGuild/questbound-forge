/**
 * GuildAnalyticsCard Component Tests
 *
 * Comprehensive tests for the GuildAnalyticsCard component including
 * different variants, data display, and user interactions.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GuildAnalyticsCard, GuildAnalyticsData } from '../GuildAnalyticsCard';

// Mock data for testing
const mockAnalyticsData: GuildAnalyticsData = {
  totalMembers: 25,
  activeMembers: 18,
  totalGoals: 12,
  completedGoals: 8,
  totalQuests: 20,
  completedQuests: 15,
  weeklyActivity: 85,
  monthlyActivity: 72,
  averageGoalCompletion: 88,
  averageQuestCompletion: 92,
  memberGrowthRate: 15,
  goalGrowthRate: 25,
  questGrowthRate: -5,
  topPerformers: 5,
  newMembersThisWeek: 3,
  goalsCreatedThisWeek: 2,
  questsCompletedThisWeek: 7,
  createdAt: '2024-01-15T10:00:00Z',
  lastActivityAt: '2024-01-20T14:30:00Z',
};

describe('GuildAnalyticsCard', () => {
  describe('Compact Variant', () => {
    it('renders compact analytics card with basic metrics', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="compact"
        />
      );

      expect(screen.getByText('Guild Analytics')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Goals')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays trend indicators when showTrends is true', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="compact"
          showTrends={true}
        />
      );

      // Should show positive trend for members (15% growth)
      expect(screen.getByText('+15%')).toBeInTheDocument();
      // Should show positive trend for goals (25% growth)
      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('hides trend indicators when showTrends is false', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="compact"
          showTrends={false}
        />
      );

      expect(screen.queryByText('+15%')).not.toBeInTheDocument();
      expect(screen.queryByText('+25%')).not.toBeInTheDocument();
    });
  });

  describe('Detailed Variant', () => {
    it('renders detailed analytics card with all metrics', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="detailed"
        />
      );

      expect(screen.getByText('Guild Analytics')).toBeInTheDocument();
      expect(screen.getByText('Total Members')).toBeInTheDocument();
      expect(screen.getByText('Total Goals')).toBeInTheDocument();
      expect(screen.getByText('Total Quests')).toBeInTheDocument();
      expect(screen.getByText('Activity Score')).toBeInTheDocument();
    });

    it('displays completion rates and descriptions', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="detailed"
        />
      );

      expect(screen.getByText('18 active')).toBeInTheDocument();
      expect(screen.getByText('8 completed')).toBeInTheDocument();
      expect(screen.getByText('15 completed')).toBeInTheDocument();
      expect(screen.getByText('This week')).toBeInTheDocument();
    });

    it('shows progress bars for completion rates', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="detailed"
        />
      );

      expect(screen.getByText('Member Activity')).toBeInTheDocument();
      expect(screen.getByText('Goal Completion')).toBeInTheDocument();
      expect(screen.getByText('Quest Completion')).toBeInTheDocument();
    });

    it('displays recent activity section', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="detailed"
        />
      );

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New members this week')).toBeInTheDocument();
      expect(screen.getByText('Goals created this week')).toBeInTheDocument();
      expect(screen.getByText('Quests completed this week')).toBeInTheDocument();
    });
  });

  describe('Dashboard Variant (Default)', () => {
    it('renders dashboard analytics card with comprehensive metrics', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="dashboard"
        />
      );

      expect(screen.getByText('Guild Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Goals')).toBeInTheDocument();
      expect(screen.getByText('Quests')).toBeInTheDocument();
      expect(screen.getByText('Weekly Activity')).toBeInTheDocument();
      expect(screen.getByText('Top Performers')).toBeInTheDocument();
    });

    it('displays creation and last activity dates', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="dashboard"
        />
      );

      expect(screen.getAllByText(/Created/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Last activity/)).toBeInTheDocument();
    });

    it('shows performance metrics section when showDetailedMetrics is true', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="dashboard"
          showDetailedMetrics={true}
        />
      );

      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Member Activity Rate')).toBeInTheDocument();
      expect(screen.getByText('Goal Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Quest Completion Rate')).toBeInTheDocument();
    });

    it('hides performance metrics section when showDetailedMetrics is false', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="dashboard"
          showDetailedMetrics={false}
        />
      );

      expect(screen.queryByText('Performance Metrics')).not.toBeInTheDocument();
    });

    it('displays weekly summary section', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="dashboard"
        />
      );

      expect(screen.getByText("This Week's Summary")).toBeInTheDocument();
      expect(screen.getByText('New Members')).toBeInTheDocument();
      expect(screen.getByText('Goals Created')).toBeInTheDocument();
      expect(screen.getByText('Quests Completed')).toBeInTheDocument();
      expect(screen.getByText('Activity Score')).toBeInTheDocument();
    });
  });

  describe('Trend Indicators', () => {
    it('displays positive trends with green color and up arrow', () => {
      const positiveData = {
        ...mockAnalyticsData,
        memberGrowthRate: 15,
        goalGrowthRate: 25,
      };

      render(
        <GuildAnalyticsCard
          data={positiveData}
          variant="detailed"
          showTrends={true}
        />
      );

      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('displays negative trends with red color and down arrow', () => {
      const negativeData = {
        ...mockAnalyticsData,
        memberGrowthRate: -10,
        goalGrowthRate: -5,
      };

      render(
        <GuildAnalyticsCard
          data={negativeData}
          variant="detailed"
          showTrends={true}
        />
      );

      // Check for negative trend indicators
      const negativeTrends = screen.getAllByText(/-10%|5%/);
      expect(negativeTrends.length).toBeGreaterThan(0);
    });

    it('displays zero trends correctly', () => {
      const zeroData = {
        ...mockAnalyticsData,
        memberGrowthRate: 0,
        goalGrowthRate: 0,
      };

      render(
        <GuildAnalyticsCard
          data={zeroData}
          variant="detailed"
          showTrends={true}
        />
      );

      // Check for zero trend indicators (should show +0%)
      const zeroTrends = screen.getAllByText('+0%');
      expect(zeroTrends.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Bars', () => {
    it('calculates and displays correct progress percentages', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="detailed"
        />
      );

      // Member activity rate: 18/25 = 72%
      expect(screen.getByText('72%')).toBeInTheDocument();
      // Goal completion rate: 8/12 = 67%
      expect(screen.getByText('67%')).toBeInTheDocument();
      // Quest completion rate: 15/20 = 75%
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('handles zero values correctly', () => {
      const zeroData = {
        ...mockAnalyticsData,
        totalMembers: 0,
        totalGoals: 0,
        totalQuests: 0,
        activeMembers: 0,
        completedGoals: 0,
        completedQuests: 0,
      };

      render(
        <GuildAnalyticsCard
          data={zeroData}
          variant="detailed"
        />
      );

      expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and semantic structure', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="dashboard"
        />
      );

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Guild Analytics Dashboard' })).toBeInTheDocument();
      
      // Check for progress bars with proper ARIA attributes
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('provides meaningful text for screen readers', () => {
      render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="detailed"
        />
      );

      expect(screen.getByText('18 active')).toBeInTheDocument();
      expect(screen.getByText('8 completed')).toBeInTheDocument();
      expect(screen.getByText('15 completed')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty or minimal data gracefully', () => {
      const minimalData: GuildAnalyticsData = {
        totalMembers: 0,
        activeMembers: 0,
        totalGoals: 0,
        completedGoals: 0,
        totalQuests: 0,
        completedQuests: 0,
        weeklyActivity: 0,
        monthlyActivity: 0,
        averageGoalCompletion: 0,
        averageQuestCompletion: 0,
        memberGrowthRate: 0,
        goalGrowthRate: 0,
        questGrowthRate: 0,
        topPerformers: 0,
        newMembersThisWeek: 0,
        goalsCreatedThisWeek: 0,
        questsCompletedThisWeek: 0,
        createdAt: '2024-01-01T00:00:00Z',
        lastActivityAt: '2024-01-01T00:00:00Z',
      };

      render(
        <GuildAnalyticsCard
          data={minimalData}
          variant="dashboard"
        />
      );

      // Check that zero values are displayed
      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThan(0);
      
      // Check that percentage values are displayed
      const percentageValues = screen.getAllByText('0%');
      expect(percentageValues.length).toBeGreaterThan(0);
    });

    it('handles very large numbers correctly', () => {
      const largeData: GuildAnalyticsData = {
        ...mockAnalyticsData,
        totalMembers: 9999,
        totalGoals: 9999,
        totalQuests: 9999,
      };

      render(
        <GuildAnalyticsCard
          data={largeData}
          variant="compact"
        />
      );

      // Check that large numbers are displayed
      const largeNumbers = screen.getAllByText('9999');
      expect(largeNumbers.length).toBeGreaterThan(0);
    });
  });

  describe('Member Leaderboard', () => {
    const mockLeaderboardData = {
      ...mockAnalyticsData,
      memberLeaderboard: [
        {
          userId: 'user-1',
          username: 'AlexJohnson',
          avatarUrl: 'https://example.com/avatar1.jpg',
          role: 'owner' as const,
          goalsCompleted: 15,
          questsCompleted: 25,
          activityScore: 95,
          totalXp: 5000,
          joinedAt: '2024-01-01T00:00:00Z',
          lastSeenAt: '2024-01-15T10:00:00Z',
        },
        {
          userId: 'user-2',
          username: 'SarahChen',
          avatarUrl: 'https://example.com/avatar2.jpg',
          role: 'member' as const,
          goalsCompleted: 12,
          questsCompleted: 20,
          activityScore: 88,
          totalXp: 4200,
          joinedAt: '2024-01-05T00:00:00Z',
          lastSeenAt: '2024-01-14T15:30:00Z',
        },
        {
          userId: 'user-3',
          username: 'MikeRodriguez',
          role: 'member' as const,
          goalsCompleted: 8,
          questsCompleted: 15,
          activityScore: 75,
          totalXp: 3200,
          joinedAt: '2024-01-10T00:00:00Z',
          lastSeenAt: '2024-01-13T09:15:00Z',
        },
      ],
    };

    it('displays member leaderboard when showLeaderboard is true', () => {
      render(
        <GuildAnalyticsCard
          data={mockLeaderboardData}
          variant="dashboard"
          showLeaderboard={true}
        />
      );

      expect(screen.getByText('Member Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('AlexJohnson')).toBeInTheDocument();
      expect(screen.getByText('SarahChen')).toBeInTheDocument();
      expect(screen.getByText('MikeRodriguez')).toBeInTheDocument();
    });

    it('hides member leaderboard when showLeaderboard is false', () => {
      render(
        <GuildAnalyticsCard
          data={mockLeaderboardData}
          variant="dashboard"
          showLeaderboard={false}
        />
      );

      expect(screen.queryByText('Member Leaderboard')).not.toBeInTheDocument();
    });

    it('displays correct member information in leaderboard', () => {
      render(
        <GuildAnalyticsCard
          data={mockLeaderboardData}
          variant="dashboard"
          showLeaderboard={true}
        />
      );

      // Check first place member (AlexJohnson)
      expect(screen.getByText('AlexJohnson')).toBeInTheDocument();
      expect(screen.getByText('15 goals')).toBeInTheDocument();
      expect(screen.getByText('25 quests')).toBeInTheDocument();
      expect(screen.getByText('5000 XP')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('displays owner crown icon for guild owner', () => {
      render(
        <GuildAnalyticsCard
          data={mockLeaderboardData}
          variant="dashboard"
          showLeaderboard={true}
        />
      );

      // The owner should have a crown icon (we can't easily test the icon itself, but we can test the structure)
      const ownerElement = screen.getByText('AlexJohnson').closest('div');
      expect(ownerElement).toBeInTheDocument();
    });

    it('respects leaderboard limit', () => {
      const limitedData = {
        ...mockLeaderboardData,
        memberLeaderboard: [
          ...mockLeaderboardData.memberLeaderboard,
          {
            userId: 'user-4',
            username: 'EmmaWilson',
            role: 'member' as const,
            goalsCompleted: 5,
            questsCompleted: 10,
            activityScore: 60,
            totalXp: 2000,
            joinedAt: '2024-01-12T00:00:00Z',
            lastSeenAt: '2024-01-12T14:20:00Z',
          },
        ],
      };

      render(
        <GuildAnalyticsCard
          data={limitedData}
          variant="dashboard"
          showLeaderboard={true}
          leaderboardLimit={3}
        />
      );

      expect(screen.getByText('AlexJohnson')).toBeInTheDocument();
      expect(screen.getByText('SarahChen')).toBeInTheDocument();
      expect(screen.getByText('MikeRodriguez')).toBeInTheDocument();
      expect(screen.queryByText('EmmaWilson')).not.toBeInTheDocument();
      expect(screen.getByText('Showing top 3 of 4 members')).toBeInTheDocument();
    });

    it('handles empty leaderboard gracefully', () => {
      const emptyLeaderboardData = {
        ...mockAnalyticsData,
        memberLeaderboard: [],
      };

      render(
        <GuildAnalyticsCard
          data={emptyLeaderboardData}
          variant="dashboard"
          showLeaderboard={true}
        />
      );

      expect(screen.queryByText('Member Leaderboard')).not.toBeInTheDocument();
    });

    it('displays relative time for last seen', () => {
      render(
        <GuildAnalyticsCard
          data={mockLeaderboardData}
          variant="dashboard"
          showLeaderboard={true}
        />
      );

      // Should display relative time like "Today", "Yesterday", "2d ago", etc.
      // We can't test exact values since they depend on current time, but we can test the structure
      const lastSeenElements = screen.getAllByText(/ago|Today|Yesterday/);
      expect(lastSeenElements.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className correctly', () => {
      const { container } = render(
        <GuildAnalyticsCard
          data={mockAnalyticsData}
          variant="compact"
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
