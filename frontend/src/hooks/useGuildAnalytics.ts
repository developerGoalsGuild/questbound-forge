/**
 * Guild Analytics Hook
 *
 * Provides guild analytics data and management functionality.
 * Currently uses mock data but can be easily connected to real APIs.
 */

import { useState, useEffect, useCallback } from 'react';
import { GuildAnalyticsData } from '@/components/guilds/GuildAnalyticsCard';
import { guildAPI } from '@/lib/api/guild';

interface UseGuildAnalyticsOptions {
  guildId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseGuildAnalyticsReturn {
  data: GuildAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// Mock leaderboard data generator
const generateMockLeaderboard = () => {
  const usernames = [
    'AlexJohnson', 'SarahChen', 'MikeRodriguez', 'EmmaWilson', 'DavidKim',
    'LisaBrown', 'ChrisTaylor', 'AnnaGarcia', 'TomAnderson', 'MariaLopez',
    'JohnSmith', 'JenniferLee', 'RobertDavis', 'MichelleWhite', 'KevinMartinez'
  ];
  
  const roles: ('owner' | 'member')[] = ['owner', 'member', 'member', 'member', 'member'];
  
  return usernames.slice(0, Math.floor(Math.random() * 8) + 5).map((username, index) => {
    const joinedDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const lastSeenDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    return {
      userId: `user-${index + 1}`,
      username,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      role: index === 0 ? 'owner' : 'member',
      goalsCompleted: Math.floor(Math.random() * 15) + 1,
      questsCompleted: Math.floor(Math.random() * 25) + 1,
      activityScore: Math.floor(Math.random() * 40) + 60, // 60-100%
      totalXp: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 XP
      joinedAt: joinedDate.toISOString(),
      lastSeenAt: lastSeenDate.toISOString(),
    };
  }).sort((a, b) => {
    // Sort by activity score, then by total XP, then by goals completed
    if (b.activityScore !== a.activityScore) {
      return b.activityScore - a.activityScore;
    }
    if (b.totalXp !== a.totalXp) {
      return b.totalXp - a.totalXp;
    }
    return b.goalsCompleted - a.goalsCompleted;
  });
};

// Mock data generator for testing
const generateMockAnalyticsData = (guildId: string): GuildAnalyticsData => {
  const baseDate = new Date();
  const createdDate = new Date(baseDate.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date within last 90 days
  const lastActivity = new Date(baseDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random date within last 7 days

  const totalMembers = Math.floor(Math.random() * 50) + 10;
  const totalGoals = Math.floor(Math.random() * 20) + 5;
  const totalQuests = Math.floor(Math.random() * 30) + 8;

  return {
    // Basic metrics
    totalMembers,
    activeMembers: Math.floor(Math.random() * Math.min(30, totalMembers)) + 5,
    totalGoals,
    completedGoals: Math.floor(Math.random() * totalGoals) + 1,
    totalQuests,
    completedQuests: Math.floor(Math.random() * totalQuests) + 1,
    
    // Activity metrics
    weeklyActivity: Math.floor(Math.random() * 40) + 60, // 60-100%
    monthlyActivity: Math.floor(Math.random() * 30) + 50, // 50-80%
    averageGoalCompletion: Math.floor(Math.random() * 30) + 70, // 70-100%
    averageQuestCompletion: Math.floor(Math.random() * 25) + 75, // 75-100%
    
    // Growth metrics (can be negative)
    memberGrowthRate: Math.floor(Math.random() * 40) - 10, // -10% to +30%
    goalGrowthRate: Math.floor(Math.random() * 50) - 5, // -5% to +45%
    questGrowthRate: Math.floor(Math.random() * 60) - 15, // -15% to +45%
    
    // Performance metrics
    topPerformers: Math.floor(Math.random() * 8) + 2, // 2-10 top performers
    newMembersThisWeek: Math.floor(Math.random() * 5) + 1, // 1-6 new members
    goalsCreatedThisWeek: Math.floor(Math.random() * 4) + 1, // 1-5 new goals
    questsCompletedThisWeek: Math.floor(Math.random() * 8) + 2, // 2-10 completed quests
    
    // Time-based data
    createdAt: createdDate.toISOString(),
    lastActivityAt: lastActivity.toISOString(),
    
    // Member leaderboard data
    memberLeaderboard: generateMockLeaderboard(),
  };
};

export const useGuildAnalytics = ({
  guildId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: UseGuildAnalyticsOptions): UseGuildAnalyticsReturn => {
  const [data, setData] = useState<GuildAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!guildId || guildId === 'undefined' || guildId.trim() === '') {
      console.warn('useGuildAnalytics: Invalid guild ID provided:', guildId);
      setError('Invalid guild ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the real API
      console.log('Fetching guild analytics from API for guild:', guildId);
      const analyticsData = await guildAPI.getGuildAnalytics(guildId);
      console.log('Guild analytics API response:', analyticsData);
      
      // Validate the data structure
      if (!analyticsData) {
        throw new Error('No analytics data received from API');
      }
      
      // Check for required fields
      const requiredFields = ['totalMembers', 'activeMembers', 'totalGoals', 'completedGoals', 'totalQuests', 'completedQuests'];
      const missingFields = requiredFields.filter(field => analyticsData[field] === undefined);
      if (missingFields.length > 0) {
        console.warn('Missing required analytics fields:', missingFields);
      }
      
      setData(analyticsData);
      setLastUpdated(new Date());
      console.log('Guild analytics loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guild analytics';
      setError(errorMessage);
      console.error('Guild analytics error:', err);
      setData(null); // Set null instead of mock data
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refresh: fetchAnalytics,
    lastUpdated,
  };
};

export default useGuildAnalytics;
