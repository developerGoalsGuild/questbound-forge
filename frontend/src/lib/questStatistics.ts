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

  // Calculate streak statistics
  stats.currentDailyStreak = calculateDailyStreak(recentQuests);
  stats.currentWeeklyStreak = calculateWeeklyStreak(recentQuests);

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
 * Returns the number of consecutive days ending today where at least one quest was completed
 */
export const calculateDailyStreak = (quests: Quest[]): number => {
  if (!quests || quests.length === 0) {
    return 0;
  }

  // Get completed quests sorted by completion date (most recent first)
  const completedQuests = quests
    .filter(q => q.status === 'completed' && q.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (completedQuests.length === 0) {
    return 0;
  }

  // Group completed quests by date
  const completionDates = new Map<string, boolean>();
  completedQuests.forEach(quest => {
    const dateKey = new Date(quest.updatedAt).toDateString();
    completionDates.set(dateKey, true);
  });

  // Calculate streak from today backwards
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  // Check up to 365 days to avoid infinite loop
  for (let i = 0; i < 365; i++) {
    const dateKey = currentDate.toDateString();
    if (completionDates.has(dateKey)) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Break streak if no completion on this day
      break;
    }
  }

  return streak;
};

/**
 * Calculate weekly streak (consecutive weeks with completed quests)
 * Returns the number of consecutive weeks ending this week where at least one quest was completed
 */
export const calculateWeeklyStreak = (quests: Quest[]): number => {
  if (!quests || quests.length === 0) {
    return 0;
  }

  // Get completed quests sorted by completion date (most recent first)
  const completedQuests = quests
    .filter(q => q.status === 'completed' && q.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (completedQuests.length === 0) {
    return 0;
  }

  // Group completed quests by week (using ISO week number)
  const completionWeeks = new Map<string, boolean>();
  completedQuests.forEach(quest => {
    const date = new Date(quest.updatedAt);
    const weekKey = getWeekKey(date);
    completionWeeks.set(weekKey, true);
  });

  // Calculate streak from current week backwards
  const today = new Date();
  let streak = 0;
  let currentWeek = getWeekKey(today);

  // Check up to 52 weeks to avoid infinite loop
  for (let i = 0; i < 52; i++) {
    if (completionWeeks.has(currentWeek)) {
      streak++;
      // Move to previous week
      const [year, week] = currentWeek.split('-').map(Number);
      if (week === 1) {
        // Move to last week of previous year
        currentWeek = `${year - 1}-52`;
      } else {
        currentWeek = `${year}-${week - 1}`;
      }
    } else {
      // Break streak if no completion in this week
      break;
    }
  }

  return streak;
};

/**
 * Get ISO week key (YYYY-WW format) for a date
 */
const getWeekKey = (date: Date): string => {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-${week.toString().padStart(2, '0')}`;
};

/**
 * Get ISO week number for a date
 */
const getWeekNumber = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};
