/**
 * GuildAnalyticsCard Component
 *
 * A comprehensive analytics card component for displaying guild metrics
 * including member statistics, activity trends, and performance indicators.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Users,
  Target,
  Trophy,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Crown,
  Medal,
  Star,
  Zap,
  User,
} from 'lucide-react';

export interface GuildAnalyticsData {
  // Basic metrics
  totalMembers: number;
  activeMembers: number;
  totalGoals: number;
  completedGoals: number;
  totalQuests: number;
  completedQuests: number;
  
  // Activity metrics
  weeklyActivity: number;
  monthlyActivity: number;
  averageGoalCompletion: number;
  averageQuestCompletion: number;
  
  // Growth metrics
  memberGrowthRate: number;
  goalGrowthRate: number;
  questGrowthRate: number;
  
  // Performance metrics
  topPerformers: number;
  newMembersThisWeek: number;
  goalsCreatedThisWeek: number;
  questsCompletedThisWeek: number;
  
  // Time-based data
  createdAt: string;
  lastActivityAt: string;
  
  // Member leaderboard data
  memberLeaderboard: {
    userId: string;
    username: string;
    avatarUrl?: string;
    role: 'owner' | 'member';
    goalsCompleted: number;
    questsCompleted: number;
    activityScore: number;
    totalXp: number;
    joinedAt: string;
    lastSeenAt?: string;
  }[];
}

interface GuildAnalyticsCardProps {
  data: GuildAnalyticsData;
  className?: string;
  showTrends?: boolean;
  showDetailedMetrics?: boolean;
  showLeaderboard?: boolean;
  leaderboardLimit?: number;
  variant?: 'compact' | 'detailed' | 'dashboard';
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  description?: string;
  className?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className = '',
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'p-2 rounded-lg border',
              colorClasses[color]
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {trend && (
            <div className="flex items-center space-x-1">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

interface MemberLeaderboardProps {
  members: GuildAnalyticsData['memberLeaderboard'];
  limit?: number;
  className?: string;
}

const MemberLeaderboard: React.FC<MemberLeaderboardProps> = ({
  members,
  limit = 5,
  className = '',
}) => {
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return guildTranslations?.analytics?.today || 'Today';
    if (diffInDays === 1) return guildTranslations?.analytics?.yesterday || 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}${guildTranslations?.analytics?.daysAgo || 'd ago'}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}${guildTranslations?.analytics?.weeksAgo || 'w ago'}`;
    return `${Math.floor(diffInDays / 30)}${guildTranslations?.analytics?.monthsAgo || 'mo ago'}`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500">#{index + 1}</span>;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 2:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const topMembers = members.slice(0, limit);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {guildTranslations?.analytics?.memberLeaderboard || 'Member Leaderboard'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topMembers.map((member, index) => (
            <div
              key={member.userId}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm',
                getRankColor(index)
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(index)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatarUrl} alt={member.username} />
                  <AvatarFallback>
                    {member.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{member.username}</span>
                    {member.role === 'owner' && <Crown className="h-3 w-3 text-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {member.goalsCompleted} {guildTranslations?.analytics?.goals || 'goals'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {member.questsCompleted} {guildTranslations?.analytics?.quests || 'quests'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {member.totalXp} {guildTranslations?.analytics?.xp || 'XP'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="h-3 w-3 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {member.activityScore}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {member.lastSeenAt ? formatRelativeTime(member.lastSeenAt) : (guildTranslations?.analytics?.never || 'Never')}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {members.length > limit && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {guildTranslations?.analytics?.showingTop || 'Showing top'} {limit} {guildTranslations?.analytics?.of || 'of'} {members.length} {guildTranslations?.analytics?.members || 'members'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const GuildAnalyticsCard: React.FC<GuildAnalyticsCardProps> = ({
  data,
  className = '',
  showTrends = true,
  showDetailedMetrics = true,
  showLeaderboard = true,
  leaderboardLimit = 5,
  variant = 'dashboard',
}) => {
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  
  // Safe data access with fallbacks
  const safeData = {
    totalMembers: data?.totalMembers || 0,
    activeMembers: data?.activeMembers || 0,
    totalGoals: data?.totalGoals || 0,
    completedGoals: data?.completedGoals || 0,
    totalQuests: data?.totalQuests || 0,
    completedQuests: data?.completedQuests || 0,
    weeklyActivity: data?.weeklyActivity || 0,
    monthlyActivity: data?.monthlyActivity || 0,
    averageGoalCompletion: data?.averageGoalCompletion || 0,
    averageQuestCompletion: data?.averageQuestCompletion || 0,
    memberGrowthRate: data?.memberGrowthRate || 0,
    goalGrowthRate: data?.goalGrowthRate || 0,
    questGrowthRate: data?.questGrowthRate || 0,
    topPerformers: data?.topPerformers || 0,
    newMembersThisWeek: data?.newMembersThisWeek || 0,
    goalsCreatedThisWeek: data?.goalsCreatedThisWeek || 0,
    questsCompletedThisWeek: data?.questsCompletedThisWeek || 0,
    createdAt: data?.createdAt || new Date().toISOString(),
    lastActivityAt: data?.lastActivityAt || new Date().toISOString(),
    memberLeaderboard: data?.memberLeaderboard || [],
  };
  
  // Calculate derived metrics with safety checks
  const memberActivityRate = (safeData.totalMembers > 0) 
    ? Math.round((safeData.activeMembers / safeData.totalMembers) * 100) 
    : 0;
  
  const goalCompletionRate = (safeData.totalGoals > 0) 
    ? Math.round((safeData.completedGoals / safeData.totalGoals) * 100) 
    : 0;
  
  const questCompletionRate = (safeData.totalQuests > 0) 
    ? Math.round((safeData.completedQuests / safeData.totalQuests) * 100) 
    : 0;

  // Format dates with safety checks
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return guildTranslations?.analytics?.today || 'Today';
      if (diffInDays === 1) return guildTranslations?.analytics?.yesterday || 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} ${guildTranslations?.analytics?.daysAgo || 'days ago'}`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${guildTranslations?.analytics?.weeksAgo || 'weeks ago'}`;
      return `${Math.floor(diffInDays / 30)} ${guildTranslations?.analytics?.monthsAgo || 'months ago'}`;
    } catch (error) {
      console.warn('Error formatting relative time:', dateString, error);
      return 'Invalid Date';
    }
  };

  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {guildTranslations?.analytics?.title || 'Guild Analytics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title={guildTranslations?.analytics?.members || 'Members'}
              value={safeData.totalMembers}
              icon={Users}
              trend={showTrends ? {
                value: safeData.memberGrowthRate,
                isPositive: safeData.memberGrowthRate >= 0,
                period: 'month'
              } : undefined}
              color="blue"
            />
            <MetricCard
              title={guildTranslations?.analytics?.goals || 'Goals'}
              value={safeData.totalGoals}
              icon={Target}
              trend={showTrends ? {
                value: safeData.goalGrowthRate,
                isPositive: safeData.goalGrowthRate >= 0,
                period: 'month'
              } : undefined}
              color="green"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Guild Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Members"
              value={safeData.totalMembers}
              icon={Users}
              trend={showTrends ? {
                value: safeData.memberGrowthRate,
                isPositive: safeData.memberGrowthRate >= 0,
                period: 'month'
              } : undefined}
              description={`${safeData.activeMembers} active`}
              color="blue"
            />
            <MetricCard
              title="Total Goals"
              value={safeData.totalGoals}
              icon={Target}
              trend={showTrends ? {
                value: safeData.goalGrowthRate,
                isPositive: safeData.goalGrowthRate >= 0,
                period: 'month'
              } : undefined}
              description={`${safeData.completedGoals} completed`}
              color="green"
            />
            <MetricCard
              title="Total Quests"
              value={safeData.totalQuests}
              icon={Trophy}
              trend={showTrends ? {
                value: safeData.questGrowthRate,
                isPositive: safeData.questGrowthRate >= 0,
                period: 'month'
              } : undefined}
              description={`${safeData.completedQuests} completed`}
              color="yellow"
            />
            <MetricCard
              title="Activity Score"
              value={`${safeData.weeklyActivity}%`}
              icon={Activity}
              description="This week"
              color="purple"
            />
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Member Activity</span>
                <span className="text-sm text-gray-600">{memberActivityRate}%</span>
              </div>
              <Progress value={memberActivityRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Goal Completion</span>
                <span className="text-sm text-gray-600">{goalCompletionRate}%</span>
              </div>
              <Progress value={goalCompletionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Quest Completion</span>
                <span className="text-sm text-gray-600">{questCompletionRate}%</span>
              </div>
              <Progress value={questCompletionRate} className="h-2" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">New members this week</span>
                <Badge variant="secondary">{safeData.newMembersThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Goals created this week</span>
                <Badge variant="secondary">{safeData.goalsCreatedThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Quests completed this week</span>
                <Badge variant="secondary">{safeData.questsCompletedThisWeek}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dashboard variant (default)
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Guild Analytics Dashboard
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(safeData.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Last activity {formatRelativeTime(safeData.lastActivityAt)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Members"
            value={safeData.totalMembers}
            icon={Users}
            trend={showTrends ? {
              value: safeData.memberGrowthRate,
              isPositive: safeData.memberGrowthRate >= 0,
              period: 'month'
            } : undefined}
            description={`${safeData.activeMembers} active (${memberActivityRate}%)`}
            color="blue"
          />
          <MetricCard
            title="Goals"
            value={safeData.totalGoals}
            icon={Target}
            trend={showTrends ? {
              value: safeData.goalGrowthRate,
              isPositive: safeData.goalGrowthRate >= 0,
              period: 'month'
            } : undefined}
            description={`${safeData.completedGoals} completed (${goalCompletionRate}%)`}
            color="green"
          />
          <MetricCard
            title="Quests"
            value={safeData.totalQuests}
            icon={Trophy}
            trend={showTrends ? {
              value: safeData.questGrowthRate,
              isPositive: safeData.questGrowthRate >= 0,
              period: 'month'
            } : undefined}
            description={`${safeData.completedQuests} completed (${questCompletionRate}%)`}
            color="yellow"
          />
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Weekly Activity"
            value={`${safeData.weeklyActivity}%`}
            icon={Activity}
            description="Member engagement this week"
            color="purple"
          />
          <MetricCard
            title="Top Performers"
            value={safeData.topPerformers}
            icon={Award}
            description="Members with highest activity"
            color="red"
          />
        </div>

        {/* Progress Indicators */}
        {showDetailedMetrics && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Performance Metrics</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Member Activity Rate</span>
                  <span className="text-sm text-gray-600">{memberActivityRate}%</span>
                </div>
                <Progress value={memberActivityRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Goal Completion Rate</span>
                  <span className="text-sm text-gray-600">{goalCompletionRate}%</span>
                </div>
                <Progress value={goalCompletionRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Quest Completion Rate</span>
                  <span className="text-sm text-gray-600">{questCompletionRate}%</span>
                </div>
                <Progress value={questCompletionRate} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">This Week's Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{safeData.newMembersThisWeek}</div>
              <div className="text-xs text-gray-600">New Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{safeData.goalsCreatedThisWeek}</div>
              <div className="text-xs text-gray-600">Goals Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{safeData.questsCompletedThisWeek}</div>
              <div className="text-xs text-gray-600">Quests Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{safeData.weeklyActivity}%</div>
              <div className="text-xs text-gray-600">Activity Score</div>
            </div>
          </div>
        </div>

        {/* Member Leaderboard */}
        {showLeaderboard && safeData.memberLeaderboard && safeData.memberLeaderboard.length > 0 && (
          <div className="mt-6">
            <MemberLeaderboard
              members={safeData.memberLeaderboard}
              limit={leaderboardLimit}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuildAnalyticsCard;
