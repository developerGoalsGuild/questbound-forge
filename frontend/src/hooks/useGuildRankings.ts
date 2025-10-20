/**
 * useGuildRankings Hook
 *
 * A custom hook for managing guild ranking data with caching,
 * real-time updates, and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { GuildRankingData } from '@/components/guilds/GuildRankingCard';
import { guildAPI } from '@/lib/api/guild';

interface UseGuildRankingsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
}

interface UseGuildRankingsReturn {
  rankings: GuildRankingData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// Mock data generator for guild rankings
const generateMockGuildRankings = (limit?: number): GuildRankingData[] => {
  const guildNames = [
    'Dragon Slayers', 'Code Warriors', 'Fitness Masters', 'Art Enthusiasts',
    'Music Makers', 'Book Lovers', 'Travel Explorers', 'Food Critics',
    'Tech Innovators', 'Nature Guardians', 'Sports Champions', 'Creative Minds',
    'Learning Squad', 'Adventure Seekers', 'Wellness Warriors', 'Gaming Legends',
    'Photography Pros', 'Cooking Masters', 'Language Learners', 'Science Geeks'
  ];

  const descriptions = [
    'A community of dedicated goal achievers',
    'Building the future together',
    'Health and fitness enthusiasts',
    'Creative minds united',
    'Music lovers and creators',
    'Knowledge seekers and sharers',
    'Exploring the world one goal at a time',
    'Culinary adventures await',
    'Innovation through collaboration',
    'Protecting our planet',
    'Champions in every field',
    'Where creativity meets purpose',
    'Never stop learning',
    'Adventure is out there',
    'Wellness and mindfulness',
    'Gaming and beyond',
    'Capturing life\'s moments',
    'Culinary excellence',
    'Breaking language barriers',
    'Scientific discovery'
  ];

  const badges = [
    'Active', 'Growing', 'Elite', 'Community', 'Innovative', 'Dedicated',
    'Friendly', 'Supportive', 'Ambitious', 'Creative', 'Organized', 'Inspiring'
  ];

  const generateGuild = (index: number): GuildRankingData => {
    const position = index + 1;
    const previousPosition = Math.random() > 0.3 ? 
      position + Math.floor(Math.random() * 5) - 2 : undefined;
    
    const memberCount = Math.floor(Math.random() * 200) + 10;
    const goalCount = Math.floor(Math.random() * 50) + 5;
    const questCount = Math.floor(Math.random() * 30) + 3;
    const activityScore = Math.floor(Math.random() * 40) + 60; // 60-100%
    const growthRate = Math.floor(Math.random() * 40) - 10; // -10% to +30%
    
    // Calculate total score based on various factors
    const totalScore = Math.floor(
      (memberCount * 10) + 
      (goalCount * 50) + 
      (questCount * 100) + 
      (activityScore * 20) + 
      Math.random() * 1000
    );

    const createdDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const lastActivity = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

    return {
      guildId: `guild-${index + 1}`,
      name: guildNames[index] || `Guild ${index + 1}`,
      description: descriptions[index] || 'A great guild',
      avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${guildNames[index] || index}`,
      position,
      previousPosition,
      totalScore,
      memberCount,
      goalCount,
      questCount,
      activityScore,
      growthRate,
      badges: badges.slice(0, Math.floor(Math.random() * 3) + 1),
      isPublic: Math.random() > 0.2, // 80% public
      createdAt: createdDate.toISOString(),
      lastActivityAt: lastActivity.toISOString(),
    };
  };

  const totalGuilds = limit || guildNames.length;
  const rankings = Array.from({ length: totalGuilds }, (_, index) => generateGuild(index));
  
  // Sort by total score to ensure proper ranking
  return rankings.sort((a, b) => b.totalScore - a.totalScore).map((guild, index) => ({
    ...guild,
    position: index + 1,
  }));
};

export const useGuildRankings = ({
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
  limit,
}: UseGuildRankingsOptions = {}): UseGuildRankingsReturn => {
  const [rankings, setRankings] = useState<GuildRankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the real API
      console.log('Fetching guild rankings from API...');
      const response = await guildAPI.getGuildRankings(limit);
      console.log('Guild rankings API response:', response);
      
      const rankingsData = response.rankings || response || [];
      
      setRankings(rankingsData);
      setLastUpdated(new Date());
      console.log('Guild rankings loaded successfully:', rankingsData.length, 'items');
    } catch (err) {
      console.error('Failed to fetch guild rankings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guild rankings';
      setError(errorMessage);
      setRankings([]); // Set empty array instead of mock data
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(async () => {
    await fetchRankings();
  }, [fetchRankings]);

  // Initial fetch
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRankings();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRankings]);

  return {
    rankings,
    loading,
    error,
    refresh,
    lastUpdated,
  };
};

