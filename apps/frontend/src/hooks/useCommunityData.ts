import { useState, useEffect, useCallback } from 'react';
import { 
  getCommunityActivities, 
  getForumTopics, 
  getGuildLeaderboard,
  getActivitiesByType,
  getRecentAchievements,
  getCommunityStats,
  getTrendingTopics,
  getTopContributors,
  generateCommunityActivity
} from '@/data/communityData';
import { CommunityActivity } from '@/data/types';

interface UseCommunityDataReturn {
  activities: CommunityActivity[];
  forumTopics: ReturnType<typeof getForumTopics>;
  leaderboard: ReturnType<typeof getGuildLeaderboard>;
  stats: ReturnType<typeof getCommunityStats>;
  trendingTopics: ReturnType<typeof getTrendingTopics>;
  topContributors: ReturnType<typeof getTopContributors>;
  recentAchievements: CommunityActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addActivity: (userName: string, activity: string, type: CommunityActivity['type'], details?: string) => Promise<void>;
}

export const useCommunityData = (limit?: number): UseCommunityDataReturn => {
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [forumTopics, setForumTopics] = useState<ReturnType<typeof getForumTopics>>([]);
  const [leaderboard, setLeaderboard] = useState<ReturnType<typeof getGuildLeaderboard>>([]);
  const [stats, setStats] = useState<ReturnType<typeof getCommunityStats>>({
    totalMembers: 0,
    activeToday: 0,
    goalsCompleted: 0,
    forumPosts: 0,
    guildEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const activitiesData = getCommunityActivities(limit);
      const topicsData = getForumTopics(limit);
      const leaderboardData = getGuildLeaderboard(limit);
      const statsData = getCommunityStats();
      
      setActivities(activitiesData);
      setForumTopics(topicsData);
      setLeaderboard(leaderboardData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch community data');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const addActivity = useCallback(async (
    userName: string,
    activity: string,
    type: CommunityActivity['type'],
    details?: string
  ) => {
    try {
      const newActivity = generateCommunityActivity(userName, activity, type, details);

      // Optimistically update the UI
      setActivities(prevActivities => [newActivity, ...prevActivities]);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add activity';
      setError(errorMessage);
      // Revert on error - fetchData clears error, so we need to re-set it
      await fetchData();
      setError(errorMessage);
    }
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Derived data
  const trendingTopics = getTrendingTopics();
  const topContributors = getTopContributors();
  const recentAchievements = getRecentAchievements();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activities,
    forumTopics,
    leaderboard,
    stats,
    trendingTopics,
    topContributors,
    recentAchievements,
    loading,
    error,
    refetch,
    addActivity,
  };
};

// Specialized hooks for specific community data
export const useCommunityActivities = (type?: CommunityActivity['type'], limit?: number) => {
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let data = getCommunityActivities(limit);
      if (type) {
        data = getActivitiesByType(type).slice(0, limit);
      }
      
      setActivities(data);
      setLoading(false);
    };

    fetchActivities();
  }, [type, limit]);

  return { activities, loading };
};

export const useForumData = (limit?: number) => {
  const [topics, setTopics] = useState<ReturnType<typeof getForumTopics>>([]);
  const [trendingTopics, setTrendingTopics] = useState<ReturnType<typeof getTrendingTopics>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForumData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setTopics(getForumTopics(limit));
      setTrendingTopics(getTrendingTopics());
      setLoading(false);
    };

    fetchForumData();
  }, [limit]);

  return { topics, trendingTopics, loading };
};

export const useLeaderboard = (limit?: number) => {
  const [leaderboard, setLeaderboard] = useState<ReturnType<typeof getGuildLeaderboard>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setLeaderboard(getGuildLeaderboard(limit));
      setLoading(false);
    };

    fetchLeaderboard();
  }, [limit]);

  return { leaderboard, loading };
};
