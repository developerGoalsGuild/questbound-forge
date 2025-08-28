import { CommunityActivity, CommunityActivitySchema } from './types';

// Extended community data that can be shared across dashboards
const mockCommunityActivities: CommunityActivity[] = [
  CommunityActivitySchema.parse({
    id: 'community-1',
    userName: 'Alex Thompson',
    userInitial: 'A',
    activity: 'completed "Master JavaScript Fundamentals"',
    timeAgo: '2 hours ago',
    details: 'Earned "Code Warrior" badge • 15 guild points',
    type: 'achievement',
  }),
  CommunityActivitySchema.parse({
    id: 'community-2',
    userName: 'Maria Garcia',
    userInitial: 'M',
    activity: 'shared workout tips in "Fitness Guild"',
    timeAgo: '4 hours ago',
    details: '12 guild members liked this • 3 new followers',
    type: 'community',
  }),
  CommunityActivitySchema.parse({
    id: 'community-3',
    userName: 'David Chen',
    userInitial: 'D',
    activity: 'reached 1000 guild points milestone',
    timeAgo: '6 hours ago',
    details: 'Unlocked "Guild Champion" title',
    type: 'milestone',
  }),
  CommunityActivitySchema.parse({
    id: 'community-4',
    userName: 'Sarah Johnson',
    userInitial: 'S',
    activity: 'started "30-Day Reading Challenge"',
    timeAgo: '8 hours ago',
    details: '24 adventurers joined the challenge',
    type: 'community',
  }),
  CommunityActivitySchema.parse({
    id: 'community-5',
    userName: 'Michael Brown',
    userInitial: 'M',
    activity: 'completed "Learn Python" quest',
    timeAgo: '12 hours ago',
    details: 'First programming quest completed • Earned bonus XP',
    type: 'achievement',
  }),
  CommunityActivitySchema.parse({
    id: 'community-6',
    userName: 'Emily Rodriguez',
    userInitial: 'E',
    activity: 'organized "Study Group Meetup"',
    timeAgo: '1 day ago',
    details: '8 members attending this weekend',
    type: 'community',
  }),
];

const mockForumTopics = [
  {
    id: 'topic-1',
    title: 'Best Strategies for Learning New Programming Languages',
    author: 'Alex Thompson',
    replies: 23,
    lastActivity: '2 hours ago',
    category: 'Learning',
  },
  {
    id: 'topic-2',
    title: 'Fitness Accountability Partners Wanted',
    author: 'Maria Garcia',
    replies: 15,
    lastActivity: '4 hours ago',
    category: 'Fitness',
  },
  {
    id: 'topic-3',
    title: 'Career Change at 30: Share Your Experience',
    author: 'Sarah Johnson',
    replies: 31,
    lastActivity: '6 hours ago',
    category: 'Career',
  },
];

const mockGuildLeaderboard = [
  { rank: 1, name: 'David Chen', points: 1247, badge: 'Guild Champion' },
  { rank: 2, name: 'Emily Rodriguez', points: 1156, badge: 'Quest Master' },
  { rank: 3, name: 'Alex Thompson', points: 1089, badge: 'Code Warrior' },
  { rank: 4, name: 'Maria Garcia', points: 967, badge: 'Fitness Leader' },
  { rank: 5, name: 'Michael Brown', points: 894, badge: 'Study Guide' },
];

// Data access functions
export const getCommunityActivities = (limit?: number): CommunityActivity[] => {
  return limit ? mockCommunityActivities.slice(0, limit) : mockCommunityActivities;
};

export const getForumTopics = (limit?: number) => {
  return limit ? mockForumTopics.slice(0, limit) : mockForumTopics;
};

export const getGuildLeaderboard = (limit?: number) => {
  return limit ? mockGuildLeaderboard.slice(0, limit) : mockGuildLeaderboard;
};

export const getActivitiesByType = (type: CommunityActivity['type']): CommunityActivity[] => {
  return mockCommunityActivities.filter(activity => activity.type === type);
};

export const getActivitiesByUser = (userName: string): CommunityActivity[] => {
  return mockCommunityActivities.filter(activity => 
    activity.userName.toLowerCase().includes(userName.toLowerCase())
  );
};

export const getRecentAchievements = (hours: number = 24): CommunityActivity[] => {
  // Simple mock implementation - in real app would filter by actual timestamp
  return getActivitiesByType('achievement').slice(0, 5);
};

// Utility functions
export const generateCommunityActivity = (
  userName: string,
  activity: string,
  type: CommunityActivity['type'],
  details?: string
): CommunityActivity => {
  return CommunityActivitySchema.parse({
    id: `activity-${Date.now()}`,
    userName,
    userInitial: userName.charAt(0).toUpperCase(),
    activity,
    timeAgo: 'Just now',
    details: details || '',
    type,
  });
};

export const getCommunityStats = () => {
  return {
    totalMembers: 2847,
    activeToday: 156,
    goalsCompleted: 1249,
    forumPosts: 523,
    guildEvents: 12,
  };
};

export const getTrendingTopics = () => {
  return mockForumTopics
    .sort((a, b) => b.replies - a.replies)
    .slice(0, 3);
};

export const getTopContributors = (period: 'week' | 'month' | 'all' = 'week') => {
  // Mock implementation - in real app would filter by time period
  return mockGuildLeaderboard.slice(0, 5);
};
