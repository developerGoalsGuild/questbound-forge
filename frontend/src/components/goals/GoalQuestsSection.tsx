import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useGoalQuests } from '@/hooks/useGoalQuests';
import { QuestStatisticsCard } from '@/components/quests/QuestStatisticsCard';
import { calculateQuestStatistics, formatQuestStatistics } from '@/lib/questStatistics';
import {
  Plus,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import type { Quest } from '@/models/quest';

interface GoalQuestsSectionProps {
  goalId: string;
  goalTitle?: string;
  className?: string;
}

interface QuestCardProps {
  quest: Quest;
  onViewDetails: (questId: string) => void;
  isLoading?: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onViewDetails, isLoading }) => {
  const { t } = useTranslation();

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => onViewDetails(quest.id)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm line-clamp-2">{quest.title}</h4>
              {quest.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {quest.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              {getStatusIcon(quest.status)}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${getStatusColor(quest.status)}`}>
                {questTranslations?.status?.[quest.status] || quest.status}
              </Badge>
              <Badge variant="secondary" className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                {questTranslations?.difficulty?.[quest.difficulty] || quest.difficulty}
              </Badge>
            </div>

            {quest.rewardXp && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Trophy className="w-3 h-3" />
                {quest.rewardXp} XP
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const GoalQuestsSection: React.FC<GoalQuestsSectionProps> = ({
  goalId,
  goalTitle,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;
  const goalTranslations = (t as any)?.goal;

  // Memoize the onAnnounce function to prevent infinite re-renders
  const onAnnounce = useCallback((message: string, priority: string) => {
    // Could integrate with screen reader announcements here
    console.log('Quest announcement:', message, priority);
  }, []);

  // Load quests for this goal
  const {
    goalQuests,
    questCount,
    loading,
    error,
    refresh,
    createQuest,
  } = useGoalQuests(goalId, {
    onAnnounce,
  });

  // Calculate quest statistics for this goal
  const goalQuestStatistics = React.useMemo(() => {
    if (!goalQuests || goalQuests.length === 0) return null;
    return calculateQuestStatistics(goalQuests);
  }, [goalQuests]);

  const formattedQuestStats = React.useMemo(() => {
    if (!goalQuestStatistics) return null;
    return formatQuestStatistics(goalQuestStatistics);
  }, [goalQuestStatistics]);

  const handleCreateQuest = useCallback(() => {
    // Navigate to quest creation with goalId pre-populated
    navigate(`/quests/create?goalId=${goalId}`);
  }, [navigate, goalId]);

  const handleViewQuestDetails = useCallback((questId: string) => {
    navigate(`/quests/details/${questId}`);
  }, [navigate]);

  const handleViewAllQuests = useCallback(() => {
    navigate('/quests/dashboard');
  }, [navigate]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {questTranslations?.goalIntegration?.title || 'Goal Quests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            {/* Loading skeleton for statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-6 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Loading skeleton for quests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <QuestCard key={index} quest={{} as Quest} onViewDetails={() => {}} isLoading />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {questTranslations?.goalIntegration?.title || 'Goal Quests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {questTranslations?.goalIntegration?.error || 'Failed to load goal quests'}
            </p>
            <Button variant="outline" onClick={refresh} size="sm">
              {commonTranslations?.actions?.retry || 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {questTranslations?.goalIntegration?.title || 'Goal Quests'}
            {questCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {questCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleViewAllQuests}>
              {questTranslations?.goalIntegration?.viewAll || 'View All'}
            </Button>
            <Button size="sm" onClick={handleCreateQuest}>
              <Plus className="w-4 h-4 mr-2" />
              {questTranslations?.goalIntegration?.createQuest || 'Create Quest'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Quest Statistics */}
          {formattedQuestStats && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {questTranslations?.goalIntegration?.statistics || 'Quest Progress'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuestStatisticsCard
                  title={formattedQuestStats.totalQuests.label}
                  value={formattedQuestStats.totalQuests.value}
                  icon={Target}
                />
                <QuestStatisticsCard
                  title={formattedQuestStats.completedQuests.label}
                  value={formattedQuestStats.completedQuests.value}
                  icon={CheckCircle}
                />
                <QuestStatisticsCard
                  title={formattedQuestStats.activeQuests.label}
                  value={formattedQuestStats.activeQuests.value}
                  icon={Clock}
                />
                <QuestStatisticsCard
                  title={formattedQuestStats.totalXpEarned.label}
                  value={formattedQuestStats.totalXpEarned.value}
                  icon={Trophy}
                />
              </div>
            </div>
          )}

          {/* Quest List */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {questCount > 0
                ? (questTranslations?.goalIntegration?.questsList || 'Associated Quests')
                : (questTranslations?.goalIntegration?.noQuests || 'No quests yet')
              }
            </h3>

            {questCount > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalQuests.slice(0, 6).map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onViewDetails={handleViewQuestDetails}
                  />
                ))}
                {questCount > 6 && (
                  <Card className="col-span-full">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        {questTranslations?.goalIntegration?.moreQuests ||
                         `And ${questCount - 6} more quests...`}
                      </p>
                      <Button variant="outline" size="sm" onClick={handleViewAllQuests}>
                        {questTranslations?.goalIntegration?.viewAll || 'View All Quests'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">
                    {questTranslations?.goalIntegration?.emptyState?.title || 'No quests for this goal'}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {questTranslations?.goalIntegration?.emptyState?.description ||
                     'Create quests to break down this goal into actionable steps.'}
                  </p>
                  <Button onClick={handleCreateQuest}>
                    <Plus className="w-4 h-4 mr-2" />
                    {questTranslations?.goalIntegration?.createFirstQuest || 'Create Your First Quest'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
