import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateQuestStatistics,
  calculateQuestTrends,
  formatQuestStatistics,
  calculateDailyStreak,
  calculateWeeklyStreak,
} from '../questStatistics';
import type { Quest } from '@/models/quest';

describe('Quest Statistics', () => {
  let mockQuests: Quest[];

  beforeEach(() => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const thirtyOneDaysAgo = now - (31 * 24 * 60 * 60 * 1000);

    mockQuests = [
      // Recent quests (last 30 days)
      {
        id: '1',
        userId: 'user1',
        title: 'Quest 1',
        status: 'completed',
        difficulty: 'easy',
        rewardXp: 50,
        category: 'Health',
        createdAt: oneWeekAgo,
        updatedAt: oneWeekAgo + 1000,
        startedAt: oneWeekAgo,
        kind: 'linked',
        linkedGoalIds: ['goal1'],
        linkedTaskIds: ['task1'],
      },
      {
        id: '2',
        userId: 'user1',
        title: 'Quest 2',
        status: 'active',
        difficulty: 'medium',
        rewardXp: 100,
        category: 'Work',
        createdAt: oneDayAgo,
        updatedAt: oneDayAgo,
        startedAt: oneDayAgo,
        kind: 'linked',
        linkedGoalIds: ['goal2'],
        linkedTaskIds: ['task2'],
      },
      {
        id: '3',
        userId: 'user1',
        title: 'Quest 3',
        status: 'draft',
        difficulty: 'hard',
        rewardXp: 200,
        category: 'Health',
        createdAt: oneDayAgo,
        updatedAt: oneDayAgo,
        kind: 'linked',
        linkedGoalIds: ['goal3'],
        linkedTaskIds: ['task3'],
      },
      {
        id: '4',
        userId: 'user1',
        title: 'Quest 4',
        status: 'failed',
        difficulty: 'easy',
        rewardXp: 50,
        category: 'Learning',
        createdAt: oneWeekAgo,
        updatedAt: oneWeekAgo + 2000,
        startedAt: oneWeekAgo,
        kind: 'linked',
        linkedGoalIds: ['goal4'],
        linkedTaskIds: ['task4'],
      },
      // Old quest (outside 30 days)
      {
        id: '5',
        userId: 'user1',
        title: 'Quest 5',
        status: 'completed',
        difficulty: 'medium',
        rewardXp: 100,
        category: 'Health',
        createdAt: thirtyOneDaysAgo,
        updatedAt: thirtyOneDaysAgo + 1000,
        startedAt: thirtyOneDaysAgo,
        kind: 'linked',
        linkedGoalIds: ['goal5'],
        linkedTaskIds: ['task5'],
      },
    ];
  });

  describe('calculateQuestStatistics', () => {
    it('calculates basic statistics correctly', () => {
      const stats = calculateQuestStatistics(mockQuests);

      expect(stats.totalQuests).toBe(4); // Excludes the old quest
      expect(stats.draftQuests).toBe(1);
      expect(stats.activeQuests).toBe(1);
      expect(stats.completedQuests).toBe(1);
      expect(stats.failedQuests).toBe(1);
      expect(stats.cancelledQuests).toBe(0);
    });

    it('calculates XP earned correctly', () => {
      const stats = calculateQuestStatistics(mockQuests);

      expect(stats.totalXpEarned).toBe(50); // Only completed quest within 30 days
    });

    it('calculates success rate correctly', () => {
      const stats = calculateQuestStatistics(mockQuests);

      // 1 completed out of 2 finished quests (completed + failed) = 50%
      expect(stats.successRate).toBe(50);
    });

    it('calculates recent activity correctly', () => {
      const stats = calculateQuestStatistics(mockQuests);

      expect(stats.recentActivityCount).toBe(4); // 4 quests in last 7 days
    });

    it('identifies most productive category', () => {
      const stats = calculateQuestStatistics(mockQuests);

      expect(stats.mostProductiveCategory).toBe('Health'); // 1 completed quest
    });

    it('calculates average completion time', () => {
      const stats = calculateQuestStatistics(mockQuests);

      // Quest 1: 1 second completion time = ~0.00001157 days
      expect(stats.averageCompletionTime).toBeGreaterThan(0);
      expect(stats.averageCompletionTime).toBeLessThan(1);
    });

    it('handles empty quest array', () => {
      const stats = calculateQuestStatistics([]);

      expect(stats.totalQuests).toBe(0);
      expect(stats.draftQuests).toBe(0);
      expect(stats.activeQuests).toBe(0);
      expect(stats.completedQuests).toBe(0);
      expect(stats.failedQuests).toBe(0);
      expect(stats.cancelledQuests).toBe(0);
      expect(stats.totalXpEarned).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.recentActivityCount).toBe(0);
      expect(stats.mostProductiveCategory).toBe('None');
      expect(stats.averageCompletionTime).toBe(0);
    });

    it('handles quests with no reward XP', () => {
      const questsWithoutXp = mockQuests.map(q => ({ ...q, rewardXp: undefined }));
      const stats = calculateQuestStatistics(questsWithoutXp);

      expect(stats.totalXpEarned).toBe(0);
    });

    it('handles quests with no startedAt date', () => {
      const questsWithoutStartedAt = mockQuests.map(q => ({ ...q, startedAt: undefined }));
      const stats = calculateQuestStatistics(questsWithoutStartedAt);

      expect(stats.averageCompletionTime).toBe(0);
    });
  });

  describe('calculateQuestTrends', () => {
    it('calculates trend differences correctly', () => {
      const currentStats = {
        totalQuests: 10,
        draftQuests: 2,
        activeQuests: 3,
        completedQuests: 4,
        cancelledQuests: 1,
        failedQuests: 0,
        totalXpEarned: 500,
        successRate: 80,
        currentDailyStreak: 5,
        currentWeeklyStreak: 2,
        averageCompletionTime: 3.5,
        mostProductiveCategory: 'Work',
        recentActivityCount: 8,
      };

      const previousStats = {
        ...currentStats,
        completedQuests: 2,
        totalXpEarned: 300,
        successRate: 75,
      };

      const trends = calculateQuestTrends(currentStats, previousStats);

      expect(trends.questsCompleted).toBe(2);
      expect(trends.xpEarned).toBe(200);
      expect(trends.successRateChange).toBe(5);
    });

    it('handles missing previous stats', () => {
      const currentStats = {
        totalQuests: 5,
        draftQuests: 1,
        activeQuests: 2,
        completedQuests: 2,
        cancelledQuests: 0,
        failedQuests: 0,
        totalXpEarned: 200,
        successRate: 100,
        currentDailyStreak: 3,
        currentWeeklyStreak: 1,
        averageCompletionTime: 2.0,
        mostProductiveCategory: 'Health',
        recentActivityCount: 4,
      };

      const trends = calculateQuestTrends(currentStats, {} as any);

      expect(trends.questsCompleted).toBe(2);
      expect(trends.xpEarned).toBe(200);
      expect(trends.successRateChange).toBe(100);
    });
  });

  describe('formatQuestStatistics', () => {
    it('formats statistics for display', () => {
      const stats = {
        totalQuests: 10,
        draftQuests: 2,
        activeQuests: 3,
        completedQuests: 5,
        cancelledQuests: 1,
        failedQuests: 1,
        totalXpEarned: 750,
        successRate: 71.4,
        currentDailyStreak: 3,
        currentWeeklyStreak: 1,
        averageCompletionTime: 4.2,
        mostProductiveCategory: 'Health',
        recentActivityCount: 7,
      };

      const formatted = formatQuestStatistics(stats);

      expect(formatted.totalQuests.value).toBe(10);
      expect(formatted.totalQuests.label).toBe('Total Quests');
      expect(formatted.totalQuests.description).toBe('Created in the last 30 days');

      expect(formatted.activeQuests.value).toBe(3);
      expect(formatted.activeQuests.description).toBe('Currently in progress');

      expect(formatted.completedQuests.value).toBe(5);
      expect(formatted.completedQuests.description).toBe('71.4% success rate');

      expect(formatted.totalXpEarned.value).toBe(750);
      expect(formatted.totalXpEarned.description).toBe('From completed quests');

      expect(formatted.averageCompletionTime.value).toBe('4.2 days');
      expect(formatted.averageCompletionTime.description).toBe('For completed quests');

      expect(formatted.recentActivity.value).toBe(7);
      expect(formatted.recentActivity.description).toBe('In the last 7 days');
    });

    it('handles zero success rate', () => {
      const stats = {
        totalQuests: 5,
        draftQuests: 2,
        activeQuests: 3,
        completedQuests: 0,
        cancelledQuests: 0,
        failedQuests: 0,
        totalXpEarned: 0,
        successRate: 0,
        currentDailyStreak: 0,
        currentWeeklyStreak: 0,
        averageCompletionTime: 0,
        mostProductiveCategory: 'None',
        recentActivityCount: 2,
      };

      const formatted = formatQuestStatistics(stats);

      expect(formatted.completedQuests.description).toBe('0.0% success rate');
    });
  });

  describe('Streak Calculations', () => {
    it('calculateDailyStreak returns 0 (placeholder)', () => {
      const streak = calculateDailyStreak(mockQuests);
      expect(streak).toBe(0);
    });

    it('calculateWeeklyStreak returns 0 (placeholder)', () => {
      const streak = calculateWeeklyStreak(mockQuests);
      expect(streak).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles quests with missing properties', () => {
      const incompleteQuests: Quest[] = [
        {
          id: '1',
          userId: 'user1',
          title: 'Incomplete Quest',
          status: 'completed',
          difficulty: 'easy',
          category: 'Other',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          kind: 'linked',
        },
      ];

      const stats = calculateQuestStatistics(incompleteQuests);

      expect(stats.totalQuests).toBe(1);
      expect(stats.completedQuests).toBe(1);
      expect(stats.totalXpEarned).toBe(0); // No rewardXp
      expect(stats.averageCompletionTime).toBe(0); // No startedAt
    });

    it('handles very old quests correctly', () => {
      const veryOldQuest: Quest = {
        id: 'old',
        userId: 'user1',
        title: 'Very Old Quest',
        status: 'completed',
        difficulty: 'hard',
        rewardXp: 500,
        category: 'Ancient',
        createdAt: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year ago
        updatedAt: Date.now() - (364 * 24 * 60 * 60 * 1000),
        startedAt: Date.now() - (365 * 24 * 60 * 60 * 1000),
        kind: 'linked',
        linkedGoalIds: [],
        linkedTaskIds: [],
      };

      const stats = calculateQuestStatistics([veryOldQuest]);

      expect(stats.totalQuests).toBe(0); // Should be filtered out
      expect(stats.totalXpEarned).toBe(0);
    });

    it('handles mixed completion times correctly', () => {
      const now = Date.now();
      const questsWithDifferentTimes: Quest[] = [
        {
          id: 'fast',
          userId: 'user1',
          title: 'Fast Quest',
          status: 'completed',
          difficulty: 'easy',
          rewardXp: 50,
          category: 'Quick',
          createdAt: now - (10 * 24 * 60 * 60 * 1000),
          updatedAt: now - (9 * 24 * 60 * 60 * 1000),
          startedAt: now - (10 * 24 * 60 * 60 * 1000),
          kind: 'linked',
          linkedGoalIds: [],
          linkedTaskIds: [],
        },
        {
          id: 'slow',
          userId: 'user1',
          title: 'Slow Quest',
          status: 'completed',
          difficulty: 'hard',
          rewardXp: 200,
          category: 'Thorough',
          createdAt: now - (20 * 24 * 60 * 60 * 1000),
          updatedAt: now - (15 * 24 * 60 * 60 * 1000),
          startedAt: now - (20 * 24 * 60 * 60 * 1000),
          kind: 'linked',
          linkedGoalIds: [],
          linkedTaskIds: [],
        },
      ];

      const stats = calculateQuestStatistics(questsWithDifferentTimes);

      // Average of 1 day and 5 days = 3 days
      expect(stats.averageCompletionTime).toBeCloseTo(3, 0);
    });
  });
});
