import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuestAnalytics, AnalyticsPeriod, AnalyticsInsights } from '@/models/analytics';
import { getQuestAnalytics, refreshQuestAnalytics } from '@/lib/apiAnalytics';

interface UseQuestAnalyticsOptions {
  period?: AnalyticsPeriod;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean; // whether to load data immediately
}

interface UseQuestAnalyticsReturn {
  analytics: QuestAnalytics | null;
  insights: AnalyticsInsights | null;
  isLoading: boolean;
  error: string | null;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  clearError: () => void;
  lastUpdated: Date | null;
}

const CACHE_KEY_PREFIX = 'quest_analytics_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useQuestAnalytics = (options: UseQuestAnalyticsOptions = {}): UseQuestAnalyticsReturn => {
  const {
    period = 'weekly',
    autoRefresh = false,
    refreshInterval = 300000, // 300 seconds (5 minutes) - increased from 30s to reduce API calls by 90%
    enabled = true
  } = options;

  const [analytics, setAnalytics] = useState<QuestAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheKey = useMemo(() => `${CACHE_KEY_PREFIX}${period}`, [period]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getCachedAnalytics = useCallback((): QuestAnalytics | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to parse cached analytics:', error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }, [cacheKey]);

  const setCachedAnalytics = useCallback((data: QuestAnalytics) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache analytics:', error);
    }
  }, [cacheKey]);

  const generateInsights = useCallback((analytics: QuestAnalytics): AnalyticsInsights => {
    const insights: AnalyticsInsights = {
      overallPerformance: `You have completed ${analytics.completedQuests} out of ${analytics.totalQuests} quests, with a success rate of ${(analytics.successRate * 100).toFixed(0)}%. You've earned ${analytics.xpEarned} XP.`
    };

    if (analytics.bestStreak > 0) {
      insights.streakInfo = `Your best completion streak is ${analytics.bestStreak} days. Your current streak is ${analytics.currentStreak} days.`;
    }

    if (analytics.categoryPerformance.length > 0) {
      const mostProductive = analytics.categoryPerformance.reduce((best, current) => 
        current.successRate > best.successRate ? current : best
      );
      insights.mostProductiveCategory = {
        category: mostProductive.category,
        successRate: mostProductive.successRate
      };
    }

    if (analytics.productivityByHour.length > 0) {
      const activeHours = analytics.productivityByHour.filter(h => h.questsCompleted > 0);
      if (activeHours.length > 0) {
        const bestHour = activeHours.reduce((best, current) => 
          current.questsCompleted > best.questsCompleted ? current : best
        );
        insights.mostProductiveHour = {
          hour: bestHour.hour,
          questsCompleted: bestHour.questsCompleted
        };
      }
    }

    // Trend analysis
    if (analytics.trends.completionRate.length >= 7) {
      const recent = analytics.trends.completionRate.slice(-7);
      const older = analytics.trends.completionRate.slice(0, -7);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, point) => sum + point.value, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.1) {
          insights.trend = 'improving';
        } else if (recentAvg < olderAvg * 0.9) {
          insights.trend = 'declining';
        } else {
          insights.trend = 'stable';
        }
      }
    }

    // Consistency score
    if (analytics.totalQuests > 0) {
      insights.consistencyScore = Math.min(analytics.bestStreak / analytics.totalQuests, 1.0);
    }

    return insights;
  }, []);

  const refresh = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = getCachedAnalytics();
        if (cached) {
          setAnalytics(cached);
          setLastUpdated(new Date());
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);
      const data = await getQuestAnalytics(period, forceRefresh);
      
      setAnalytics(data);
      setCachedAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      console.error('Analytics refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, getCachedAnalytics, setCachedAnalytics]);

  // Initial load
  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !analytics) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh, analytics]);

  const insights = useMemo(() => {
    if (!analytics) return null;
    return generateInsights(analytics);
  }, [analytics, generateInsights]);

  return {
    analytics,
    insights,
    isLoading,
    error,
    refresh,
    clearError,
    lastUpdated
  };
};
