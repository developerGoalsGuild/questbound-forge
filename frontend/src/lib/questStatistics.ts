import type { Quest } from '@/models/quest';

export interface QuestStatistics {
  totalQuests: number;
  draftQuests: number;
  activeQuests: number;
  completedQuests: number;
  cancelledQuests: number;
  failedQuests: number;
  totalXpEarned: number;
  successRate: number;
  currentDailyStreak: number;
  currentWeeklyStreak: number;
  averageCompletionTime: number; // in days
  mostProductiveCategory: string;
  recentActivityCount: number; // last 7 days
}

export interface QuestStatisticsTrend {
  period: 'daily' | 'weekly' | 'monthly';
  questsCompleted: number;
  xpEarned: number;
  successRateChange: number;
}

/**
 * Calculate comprehensive quest statistics for the last 30 days
 */
export const calculateQuestStatistics = (quests: Quest[]): QuestStatistics => {
  // Filter quests to only include last 30 days for most metrics
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentQuests = quests.filter(q => q.createdAt >= thirtyDaysAgo);

  // Filter for last 7 days for recent activity
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const veryRecentQuests = quests.filter(q => q.createdAt >= sevenDaysAgo);

  const stats: QuestStatistics = {
    totalQuests: recentQuests.length,
    draftQuests: recentQuests.filter(q => q.status === 'draft').length,
    activeQuests: recentQuests.filter(q => q.status === 'active').length,
    completedQuests: recentQuests.filter(q => q.status === 'completed').length,
    cancelledQuests: recentQuests.filter(q => q.status === 'cancelled').length,
    failedQuests: recentQuests.filter(q => q.status === 'failed').length,
    totalXpEarned: 0,
    successRate: 0,
    currentDailyStreak: 0,
    currentWeeklyStreak: 0,
    averageCompletionTime: 0,
    mostProductiveCategory: '',
    recentActivityCount: veryRecentQuests.length,
  };

  // Calculate XP earned (completed quests only from last month)
  stats.totalXpEarned = recentQuests
    .filter(q => q.status === 'completed')
    .reduce((sum, q) => sum + (q.rewardXp || 0), 0);

  // Calculate success rate for last month
  const totalFinished = stats.completedQuests + stats.failedQuests + stats.cancelledQuests;
  stats.successRate = totalFinished > 0 ? (stats.completedQuests / totalFinished) * 100 : 0;

  // Calculate average completion time for completed quests
  const completedQuestsWithTimes = recentQuests.filter(q =>
    q.status === 'completed' && q.startedAt && q.createdAt
  );

  if (completedQuestsWithTimes.length > 0) {
    const totalCompletionTime = completedQuestsWithTimes.reduce((sum, q) => {
      const completionTime = (q.updatedAt || Date.now()) - q.startedAt!;
      return sum + (completionTime / (1000 * 60 * 60 * 24)); // Convert to days
    }, 0);
    stats.averageCompletionTime = totalCompletionTime / completedQuestsWithTimes.length;
  }

  // Find most productive category
  const categoryStats = recentQuests.reduce((acc, q) => {
    if (q.status === 'completed') {
      acc[q.category] = (acc[q.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mostProductiveCategory = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)[0];

  stats.mostProductiveCategory = mostProductiveCategory ? mostProductiveCategory[0] : 'None';

  // TODO: Implement streak calculations for last month
  // stats.currentDailyStreak = calculateDailyStreak(recentQuests);
  // stats.currentWeeklyStreak = calculateWeeklyStreak(recentQuests);

  return stats;
};

/**
 * Calculate trend data for quest statistics
 */
export const calculateQuestTrends = (
  currentStats: QuestStatistics,
  previousStats: QuestStatistics
): QuestStatisticsTrend => {
  const completedChange = currentStats.completedQuests - (previousStats.completedQuests || 0);
  const xpChange = currentStats.totalXpEarned - (previousStats.totalXpEarned || 0);
  const successRateChange = currentStats.successRate - (previousStats.successRate || 0);

  return {
    period: 'weekly',
    questsCompleted: completedChange,
    xpEarned: xpChange,
    successRateChange,
  };
};

/**
 * Get statistics formatted for display
 */
export const formatQuestStatistics = (stats: QuestStatistics) => {
  return {
    totalQuests: {
      value: stats.totalQuests,
      label: 'Total Quests',
      description: 'Created in the last 30 days',
    },
    activeQuests: {
      value: stats.activeQuests,
      label: 'Active Quests',
      description: 'Currently in progress',
    },
    completedQuests: {
      value: stats.completedQuests,
      label: 'Completed',
      description: `${stats.successRate.toFixed(1)}% success rate`,
    },
    totalXpEarned: {
      value: stats.totalXpEarned,
      label: 'XP Earned',
      description: 'From completed quests',
    },
    averageCompletionTime: {
      value: `${stats.averageCompletionTime.toFixed(1)} days`,
      label: 'Avg. Completion Time',
      description: 'For completed quests',
    },
    recentActivity: {
      value: stats.recentActivityCount,
      label: 'Recent Activity',
      description: 'In the last 7 days',
    },
  };
};

/**
 * Calculate daily streak (consecutive days with completed quests)
 * TODO: Implement when we have proper date tracking
 */
export const calculateDailyStreak = (quests: Quest[]): number => {
  // Placeholder implementation
  return 0;
};

/**
 * Calculate weekly streak (consecutive weeks with completed quests)
 * TODO: Implement when we have proper date tracking
 */
export const calculateWeeklyStreak = (quests: Quest[]): number => {
  // Placeholder implementation
  return 0;
};
