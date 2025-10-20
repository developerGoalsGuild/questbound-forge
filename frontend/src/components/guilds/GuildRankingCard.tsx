/**
 * GuildRankingCard Component
 *
 * A component for displaying guild rankings and leaderboard
 * with position badges, performance metrics, and trend indicators.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GuildAvatar } from './GuildAvatar';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Trophy,
  Crown,
  Medal,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  Activity,
  Award,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';

export interface GuildRankingData {
  guildId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  position: number;
  previousPosition?: number;
  totalScore: number;
  memberCount: number;
  goalCount: number;
  questCount: number;
  activityScore: number;
  growthRate: number;
  badges: string[];
  isPublic: boolean;
  createdAt: string;
  lastActivityAt: string;
}

interface GuildRankingCardProps {
  data: GuildRankingData;
  className?: string;
  showTrends?: boolean;
  showDetailedMetrics?: boolean;
  variant?: 'compact' | 'detailed' | 'leaderboard';
}

interface RankingBadgeProps {
  position: number;
  previousPosition?: number;
  className?: string;
}

const RankingBadge: React.FC<RankingBadgeProps> = ({
  position,
  previousPosition,
  className = '',
}) => {
  const getPositionIcon = (pos: number) => {
    switch (pos) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-bold">#{pos}</span>;
    }
  };

  const getPositionColor = (pos: number) => {
    switch (pos) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-800';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 text-amber-800';
      default:
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800';
    }
  };

  const getTrendIcon = () => {
    if (!previousPosition) return null;
    
    const change = previousPosition - position;
    if (change > 0) {
      return <ChevronUp className="h-3 w-3 text-green-500" />;
    } else if (change < 0) {
      return <ChevronDown className="h-3 w-3 text-red-500" />;
    } else {
      return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    if (!previousPosition) return null;
    
    const change = previousPosition - position;
    if (change > 0) {
      return `+${change}`;
    } else if (change < 0) {
      return `${change}`;
    } else {
      return '0';
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border',
      getPositionColor(position),
      className
    )}>
      <div className="flex items-center gap-2">
        {getPositionIcon(position)}
        <span className="font-semibold">#{position}</span>
      </div>
      
      {previousPosition && (
        <div className="flex items-center gap-1 text-xs">
          {getTrendIcon()}
          <span>{getTrendText()}</span>
        </div>
      )}
    </div>
  );
};

interface MetricItemProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricItem: React.FC<MetricItemProps> = ({
  icon: Icon,
  label,
  value,
  color = 'blue',
  trend,
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg border',
          colorClasses[color]
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1">
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
  );
};

export const GuildRankingCard: React.FC<GuildRankingCardProps> = ({
  data,
  className = '',
  showTrends = true,
  showDetailedMetrics = true,
  variant = 'detailed',
}) => {
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  if (variant === 'compact') {
    return (
      <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RankingBadge position={data.position} previousPosition={data.previousPosition} />
              <div>
                <h3 className="font-semibold text-gray-900">{data.name}</h3>
                <p className="text-sm text-gray-600">{guildTranslations?.rankings?.score || 'Score'}: {data.totalScore.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{data.activityScore}%</span>
              </div>
              <p className="text-xs text-gray-500">{data.memberCount} {guildTranslations?.analytics?.members || 'members'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'leaderboard') {
    return (
      <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <RankingBadge position={data.position} previousPosition={data.previousPosition} />
            
            <GuildAvatar 
              guildId={data.guildId}
              guildName={data.name}
              avatarUrl={data.avatarUrl}
              size="md"
              className="h-12 w-12"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{data.name}</h3>
                {(data.badges || []).map((badge, index) => (
                  <Badge key={`${badge}-${index}`} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-2">{data.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {data.memberCount || 0} {guildTranslations?.analytics?.members || 'members'}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {data.goalCount || 0} {guildTranslations?.analytics?.goals || 'goals'}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {(data.totalScore || 0).toLocaleString()} pts
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {(data.totalScore || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Score</div>
              {showTrends && (data.growthRate || 0) !== 0 && (
                <div className={cn(
                  'text-xs font-medium mt-1',
                  (data.growthRate || 0) > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {(data.growthRate || 0) > 0 ? '+' : ''}{data.growthRate || 0}%
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant (default)
  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RankingBadge position={data.position} previousPosition={data.previousPosition} />
            <div>
              <CardTitle className="text-xl">{data.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{data.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {data.totalScore.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Score</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Guild Info */}
        <div className="flex items-center gap-4">
          <GuildAvatar 
            guildId={data.guildId}
            guildName={data.name}
            avatarUrl={data.avatarUrl}
            size="lg"
            className="h-16 w-16"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {(data.badges || []).map((badge, index) => (
                <Badge key={`${badge}-${index}`} variant="secondary">
                  {badge}
                </Badge>
              ))}
              <Badge variant={data.isPublic ? 'default' : 'outline'}>
                {data.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <p>{guildTranslations?.details?.stats?.created || 'Created'} {formatDate(data.createdAt)}</p>
              <p>{guildTranslations?.analytics?.lastActivity || 'Last activity'} {formatRelativeTime(data.lastActivityAt)}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricItem
            icon={Users}
            label="Members"
            value={data.memberCount}
            color="blue"
            trend={showTrends ? { value: Math.abs(data.growthRate), isPositive: data.growthRate > 0 } : undefined}
          />
          <MetricItem
            icon={Target}
            label="Goals"
            value={data.goalCount}
            color="green"
          />
          <MetricItem
            icon={Trophy}
            label="Quests"
            value={data.questCount}
            color="yellow"
          />
          <MetricItem
            icon={Activity}
            label="Activity"
            value={`${data.activityScore}%`}
            color="purple"
          />
        </div>

        {/* Performance Score */}
        {showDetailedMetrics && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Performance Score</span>
              <span className="text-sm text-gray-600">{data.totalScore.toLocaleString()}</span>
            </div>
            <Progress 
              value={Math.min((data.totalScore / 10000) * 100, 100)} 
              className="h-2" 
            />
            <p className="text-xs text-gray-500">
              Based on member activity, goal completion, and quest progress
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuildRankingCard;
