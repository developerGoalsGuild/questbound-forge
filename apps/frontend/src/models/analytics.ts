export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface CategoryPerformance {
  category: string;
  totalQuests: number;
  completedQuests: number;
  successRate: number;
  averageCompletionTime: number;
  xpEarned: number;
}

export interface HourlyProductivity {
  hour: number;
  questsCompleted: number;
  xpEarned: number;
  averageCompletionTime: number;
}

export interface QuestAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  totalQuests: number;
  completedQuests: number;
  successRate: number;
  averageCompletionTime: number;
  bestStreak: number;
  currentStreak: number;
  xpEarned: number;
  trends: {
    completionRate: TrendDataPoint[];
    xpEarned: TrendDataPoint[];
    questsCreated: TrendDataPoint[];
  };
  categoryPerformance: CategoryPerformance[];
  productivityByHour: HourlyProductivity[];
  calculatedAt: number;
  ttl: number;
}

export interface AnalyticsInsights {
  overallPerformance: string;
  streakInfo?: string;
  mostProductiveCategory?: {
    category: string;
    successRate: number;
  };
  mostProductiveHour?: {
    hour: number;
    questsCompleted: number;
  };
  trend?: 'improving' | 'declining' | 'stable';
  consistencyScore?: number;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';
