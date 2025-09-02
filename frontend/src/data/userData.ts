import { Target, Users, Trophy, TrendingUp, Star } from 'lucide-react';
import { 
  Goal, 
  Achievement, 
  UserStats, 
  CommunityActivity, 
  UserDashboardData,
  GoalSchema,
  AchievementSchema,
  UserStatsSchema,
  CommunityActivitySchema
} from './types';

// Mock user data
const mockUserStats: UserStats = UserStatsSchema.parse({
  activeQuests: 12,
  achievements: 8,
  guildPoints: 156,
  successRate: 89,
});

const mockUserGoals: Goal[] = [
  GoalSchema.parse({
    id: 1,
    title: 'Complete React Course',
    progress: 75,
    category: 'Learning',
    dueDate: '2024-12-15',
    description: 'Master React fundamentals and advanced patterns',
  }),
  GoalSchema.parse({
    id: 2,
    title: 'Run 5K Marathon',
    progress: 45,
    category: 'Fitness',
    dueDate: '2024-11-30',
    description: 'Build endurance and complete first 5K run',
  }),
  GoalSchema.parse({
    id: 3,
    title: 'Read 12 Books',
    progress: 60,
    category: 'Personal',
    dueDate: '2024-12-31',
    description: 'Expand knowledge through diverse reading list',
  }),
];

const mockUserAchievements: Achievement[] = [
  AchievementSchema.parse({
    name: 'First Quest',
    icon: Star,
    earned: true,
    description: 'Completed your first goal',
  }),
  AchievementSchema.parse({
    name: 'Team Player',
    icon: Users,
    earned: true,
    description: 'Participated in community activities',
  }),
  AchievementSchema.parse({
    name: 'Goal Crusher',
    icon: Target,
    earned: false,
    description: 'Complete 10 goals in a month',
    requirement: 'Complete 10 goals',
  }),
];

const mockCommunityActivities: CommunityActivity[] = [
  CommunityActivitySchema.parse({
    id: 'activity-1',
    userName: 'Alex',
    userInitial: 'A',
    activity: 'Alex completed "Master JavaScript"',
    timeAgo: '2 hours ago',
    details: 'Earned "Code Warrior" badge',
    type: 'achievement',
  }),
  CommunityActivitySchema.parse({
    id: 'activity-2',
    userName: 'Maria',
    userInitial: 'M',
    activity: 'Maria shared tips in "Fitness Guild"',
    timeAgo: '4 hours ago',
    details: '12 guild members liked this',
    type: 'community',
  }),
];

const mockNextAchievement = {
  name: 'Quest Master',
  description: 'Complete 3 more quests to unlock "Quest Master"',
  progress: 66,
  current: 2,
  target: 3,
};

// Data factory functions
export const createUserGoal = (data: Partial<Goal>): Goal => {
  return GoalSchema.parse({
    id: Date.now().toString(),
    title: 'New Goal',
    progress: 0,
    category: 'General',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ...data,
  });
};

export const updateGoalProgress = (goal: Goal, newProgress: number): Goal => {
  return GoalSchema.parse({
    ...goal,
    progress: Math.max(0, Math.min(100, newProgress)),
  });
};

// Data access functions
export const getUserStats = (): UserStats => {
  return mockUserStats;
};

export const getUserGoals = (): Goal[] => {
  return mockUserGoals;
};

export const getUserAchievements = (): Achievement[] => {
  return mockUserAchievements;
};

export const getCommunityActivities = (): CommunityActivity[] => {
  return mockCommunityActivities;
};

export const getNextAchievement = () => {
  return mockNextAchievement;
};

export const getUserDashboardData = (): UserDashboardData => {
  return {
    stats: getUserStats(),
    goals: getUserGoals(),
    achievements: getUserAchievements(),
    communityActivities: getCommunityActivities(),
    nextAchievement: getNextAchievement(),
  };
};

// Utility functions
export const calculateOverallProgress = (goals: Goal[]): number => {
  if (goals.length === 0) return 0;
  const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
  return Math.round(totalProgress / goals.length);
};

export const getGoalsByCategory = (goals: Goal[]): Record<string, Goal[]> => {
  return goals.reduce((acc, goal) => {
    if (!acc[goal.category]) {
      acc[goal.category] = [];
    }
    acc[goal.category].push(goal);
    return acc;
  }, {} as Record<string, Goal[]>);
};

export const getUpcomingDeadlines = (goals: Goal[], days: number = 7): Goal[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  
  return goals.filter(goal => {
    const dueDate = new Date(goal.dueDate);
    return dueDate <= cutoffDate && goal.progress < 100;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};
