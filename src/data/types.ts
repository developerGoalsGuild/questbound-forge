import { z } from 'zod';
import { LucideIcon } from 'lucide-react';

// Base schemas
export const BaseItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// User data schemas
export const GoalSchema = BaseItemSchema.extend({
  title: z.string(),
  progress: z.number().min(0).max(100),
  category: z.string(),
  dueDate: z.string(),
  description: z.string().optional(),
});

export const AchievementSchema = z.object({
  name: z.string(),
  icon: z.any(), // LucideIcon type
  earned: z.boolean(),
  description: z.string().optional(),
  requirement: z.string().optional(),
});

export const UserStatsSchema = z.object({
  activeQuests: z.number(),
  achievements: z.number(),
  guildPoints: z.number(),
  successRate: z.number(),
});

export const CommunityActivitySchema = z.object({
  id: z.string(),
  userName: z.string(),
  userInitial: z.string(),
  activity: z.string(),
  timeAgo: z.string(),
  details: z.string().optional(),
  type: z.enum(['achievement', 'community', 'milestone']),
});

// Partner data schemas
export const ServiceSchema = BaseItemSchema.extend({
  name: z.string(),
  active: z.boolean(),
  engagement: z.number().min(0).max(100),
  revenue: z.number().min(0),
  description: z.string().optional(),
});

export const PartnerMetricsSchema = z.object({
  totalUsers: z.number(),
  activeEngagements: z.number(),
  monthlyRevenue: z.number(),
  satisfaction: z.number().min(0).max(5),
});

export const PartnerActivitySchema = z.object({
  id: z.string(),
  activity: z.string(),
  details: z.string(),
  timeAgo: z.string(),
  type: z.enum(['enrollment', 'completion', 'milestone']),
});

// Patron data schemas
export const ContributionSchema = z.object({
  id: z.string(),
  month: z.string(),
  amount: z.number().min(0),
  impact: z.number().min(0),
  status: z.enum(['processed', 'pending', 'failed']).default('processed'),
});

export const PatronBenefitSchema = z.object({
  name: z.string(),
  unlocked: z.boolean(),
  requirement: z.string().optional(),
  description: z.string().optional(),
});

export const PatronImpactSchema = z.object({
  totalSupported: z.number(),
  goalsAchieved: z.number(),
  communityGrowth: z.number(),
  totalContributed: z.number(),
});

export const ImpactStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  achievement: z.string(),
  impact: z.string(),
});

// Derived types
export type Goal = z.infer<typeof GoalSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type CommunityActivity = z.infer<typeof CommunityActivitySchema>;

export type Service = z.infer<typeof ServiceSchema>;
export type PartnerMetrics = z.infer<typeof PartnerMetricsSchema>;
export type PartnerActivity = z.infer<typeof PartnerActivitySchema>;

export type Contribution = z.infer<typeof ContributionSchema>;
export type PatronBenefit = z.infer<typeof PatronBenefitSchema>;
export type PatronImpact = z.infer<typeof PatronImpactSchema>;
export type ImpactStory = z.infer<typeof ImpactStorySchema>;

// Dashboard data aggregates
export type UserDashboardData = {
  stats: UserStats;
  goals: Goal[];
  achievements: Achievement[];
  communityActivities: CommunityActivity[];
  nextAchievement: {
    name: string;
    description: string;
    progress: number;
    current: number;
    target: number;
  };
};

export type PartnerDashboardData = {
  metrics: PartnerMetrics;
  services: Service[];
  activities: PartnerActivity[];
  engagementTrends: {
    thisMonth: number;
    lastMonth: number;
  };
  topServices: Array<{ name: string; engagement: number }>;
};

export type PatronDashboardData = {
  impact: PatronImpact;
  contributions: Contribution[];
  benefits: PatronBenefit[];
  impactStories: ImpactStory[];
  communityStats: {
    goalSuccessRate: number;
    livesImpacted: number;
    thankYouMessages: number;
  };
};
