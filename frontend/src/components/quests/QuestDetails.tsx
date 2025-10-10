import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Quest,
  getQuestStatusKey,
  getQuestStatusColorClass,
  getQuestDifficultyKey,
  getQuestDifficultyColorClass,
  formatRewardXp,
  getCategoryName,
} from '@/models/quest';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuests, useQuestProgress } from '@/hooks/useQuest';
import { loadGoals, type GoalResponse } from '@/lib/apiGoal';
import { loadTasks, getMockTasks, type TaskResponse } from '@/lib/apiTask';
import {
  ShieldCheck,
  Star,
  Tag,
  Edit,
  Play,
  Trash2,
  XCircle,
  Ban,
  Calendar,
  Clock,
  Target,
  Users,
  Lock,
  Globe,
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle,
  Circle,
  Info,
} from 'lucide-react';

interface QuestDetailsProps {
  questId: string;
  onEdit?: (id: string) => void;
  onStart?: (id: string) => void;
  onCancel?: (id: string) => void;
  onFail?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBack?: () => void;
  className?: string;
}

const QuestDetails: React.FC<QuestDetailsProps> = ({
  questId,
  onEdit,
  onStart,
  onCancel,
  onFail,
  onDelete,
  onBack,
  className = '',
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;
  
  const {
    quests,
    loading,
    error,
    loadQuests,
    start,
    cancel,
    fail,
    deleteQuest,
    loadingStates,
  } = useQuests();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  
  // ARIA Live Region for announcements
  const [liveMessage, setLiveMessage] = useState('');
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  // Focus management
  const containerRef = useRef<HTMLDivElement>(null);

  // Quest progress hook
  const {
    progress,
    progressPercentage,
    isCalculating,
    isCompleted,
    isInProgress,
    isNotStarted,
    progressData,
    completedCount,
    totalCount,
    remainingCount,
    status: progressStatus,
    error: progressError,
  } = useQuestProgress(quest || ({} as Quest), { enableRealTime: false });

  // Find the specific quest
  useEffect(() => {
    if (quests && quests.length > 0) {
      const foundQuest = quests.find(q => q.id === questId);
      setQuest(foundQuest || null);
    }
  }, [quests, questId]);

  // Load quests if not already loaded
  useEffect(() => {
    if (!quests && !loading) {
      loadQuests();
    }
  }, [quests, loading]);

  // Load goals and tasks when quest is found
  useEffect(() => {
    if (quest) {
      const loadLinkedData = async () => {
        try {
          // Load goals
          if (quest.linkedGoalIds && quest.linkedGoalIds.length > 0) {
            try {
              const goalsData = await loadGoals();
              const linkedGoals = (goalsData || []).filter(goal => 
                quest.linkedGoalIds?.includes(goal.id)
              );
              setGoals(linkedGoals);
            } catch (error) {
              console.warn('Failed to load goals for quest:', error);
              // Continue without goals - quest progress will still work
            }
          }

          // Load tasks - handle GraphQL errors gracefully
          if (quest.linkedTaskIds && quest.linkedTaskIds.length > 0) {
            const allTasks: TaskResponse[] = [];
            for (const goalId of quest.linkedGoalIds || []) {
              try {
                const tasksData = await loadTasks(goalId);
                if (tasksData && tasksData.length > 0) {
                  const linkedTasks = tasksData.filter(task => 
                    quest.linkedTaskIds?.includes(task.id)
                  );
                  allTasks.push(...linkedTasks);
                } else {
                  // If no tasks returned, use mock data for development
                  console.info(`No tasks found for goal ${goalId}, using mock data`);
                  const mockTasks = getMockTasks(goalId);
                  const linkedMockTasks = mockTasks.filter(task => 
                    quest.linkedTaskIds?.includes(task.id)
                  );
                  allTasks.push(...linkedMockTasks);
                }
              } catch (error) {
                console.warn(`Failed to load tasks for goal ${goalId}, using mock data:`, error);
                // Use mock data as fallback
                const mockTasks = getMockTasks(goalId);
                const linkedMockTasks = mockTasks.filter(task => 
                  quest.linkedTaskIds?.includes(task.id)
                );
                allTasks.push(...linkedMockTasks);
              }
            }
            setTasks(allTasks);
          }
        } catch (error) {
          console.error('Failed to load linked goals and tasks:', error);
        }
      };
      loadLinkedData();
    }
  }, [quest]);

  const validateQuestCanStart = (quest: Quest | null): { canStart: boolean; errorMessage?: string } => {
    // Check if quest exists
    if (!quest) {
      return { canStart: false, errorMessage: 'Quest not found. Please refresh the page and try again.' };
    }
    
    // Check if quest is in draft status
    if (quest.status !== 'draft') {
      const statusDisplay = quest.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return { canStart: false, errorMessage: `Cannot start quest. Quest is currently ${statusDisplay}. Only draft quests can be started.` };
    }
    
    // Check required fields for all quests
    if (!quest.title || quest.title.trim().length === 0) {
      return { canStart: false, errorMessage: 'Quest title is required. Please add a title to your quest before starting it.' };
    }
    
    if (!quest.category || quest.category.trim().length === 0) {
      return { canStart: false, errorMessage: 'Quest category is required. Please select a category for your quest before starting it.' };
    }
    
    if (!quest.difficulty || !['easy', 'medium', 'hard'].includes(quest.difficulty)) {
      return { canStart: false, errorMessage: 'Quest difficulty is required. Please select a difficulty level (Easy, Medium, or Hard) before starting your quest.' };
    }
    
    if (!quest.kind || !['linked', 'quantitative'].includes(quest.kind)) {
      return { canStart: false, errorMessage: 'Quest type is required. Please select whether this is a Linked or Quantitative quest before starting it.' };
    }
    
    // Validate quantitative quest requirements
    if (quest.kind === 'quantitative') {
      if (!quest.targetCount || quest.targetCount <= 0) {
        return { canStart: false, errorMessage: 'Quantitative quest requires a target count. Please set how many items you want to complete before starting your quest.' };
      }
      
      if (!quest.countScope || !['completed_tasks', 'completed_goals', 'any'].includes(quest.countScope)) {
        return { canStart: false, errorMessage: 'Quantitative quest requires a count scope. Please select what to count (completed tasks or goals) before starting your quest.' };
      }
      
      if (!quest.periodDays || quest.periodDays <= 0) {
        return { canStart: false, errorMessage: 'Quantitative quest requires a time period. Please set how many days you want to complete this quest in before starting it.' };
      }
    }
    
    // Validate linked quest requirements
    if (quest.kind === 'linked') {
      if (!quest.linkedGoalIds || quest.linkedGoalIds.length === 0) {
        return { canStart: false, errorMessage: 'Linked quest requires at least one goal. Please select the goals you want to work on before starting your quest.' };
      }
      
      if (!quest.linkedTaskIds || quest.linkedTaskIds.length === 0) {
        return { canStart: false, errorMessage: 'Linked quest requires at least one task. Please select the tasks you want to work on before starting your quest.' };
      }
    }
    
    return { canStart: true };
  };

  const handleStart = async () => {
    if (!quest) return;
    
    const validation = validateQuestCanStart(quest);
    
    if (!validation.canStart) {
      console.error('Quest validation failed:', validation.errorMessage);
      setLiveMessage(`Cannot start quest: ${validation.errorMessage}`);
      alert(`Cannot start quest: ${validation.errorMessage}`);
      return;
    }
    
    try {
      setLiveMessage('Starting quest...');
      await start(quest.id);
      onStart?.(quest.id);
      setLiveMessage('Quest started successfully');
      
      // Refresh the quest data to show updated status
      if (loadQuests) {
        await loadQuests();
      }
    } catch (err) {
      console.error('Failed to start quest:', err);
      setLiveMessage('Failed to start quest. Please try again.');
      alert('Failed to start quest. Please try again.');
    }
  };

  const handleCancel = async () => {
    if (quest && onCancel) {
      try {
        setLiveMessage('Cancelling quest...');
        await cancel(quest.id);
        onCancel(quest.id);
        setLiveMessage('Quest cancelled successfully');
      } catch (err) {
        console.error('Failed to cancel quest:', err);
        setLiveMessage('Failed to cancel quest. Please try again.');
      }
    }
  };

  const handleFail = async () => {
    if (quest && onFail) {
      try {
        setLiveMessage('Marking quest as failed...');
        await fail(quest.id);
        onFail(quest.id);
        setLiveMessage('Quest marked as failed');
      } catch (err) {
        console.error('Failed to fail quest:', err);
        setLiveMessage('Failed to mark quest as failed. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    if (quest && onDelete) {
      try {
        setLiveMessage('Deleting quest...');
        await deleteQuest(quest.id);
        onDelete(quest.id);
        setLiveMessage('Quest deleted successfully');
      } catch (err) {
        console.error('Failed to delete quest:', err);
        setLiveMessage('Failed to delete quest. Please try again.');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'followers':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return questTranslations?.privacy?.public || 'Public';
      case 'followers':
        return questTranslations?.privacy?.followers || 'Followers';
      case 'private':
        return questTranslations?.privacy?.private || 'Private';
      default:
        return privacy;
    }
  };

  // Progress helper functions
  const getProgressIcon = () => {
    if (isCalculating) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (isCompleted) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isInProgress) return <Clock className="h-4 w-4 text-blue-600" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getProgressStatusText = () => {
    if (isCalculating) return questTranslations?.progress?.calculating || 'Calculating...';
    if (isCompleted) return questTranslations?.progress?.completed || 'Completed';
    if (isInProgress) return questTranslations?.progress?.inProgress || 'In Progress';
    return questTranslations?.progress?.notStarted || 'Not Started';
  };

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {questTranslations?.messages?.loadError || 'Failed to load quest details'}
          </AlertDescription>
        </Alert>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            {questTranslations?.actions?.back || 'Go Back'}
          </Button>
        )}
      </div>
    );
  }

  // Quest not found
  if (!quest) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {questTranslations?.messages?.notFound || 'Quest not found'}
          </AlertDescription>
        </Alert>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            {questTranslations?.actions?.back || 'Go Back'}
          </Button>
        )}
      </div>
    );
  }

  const isStarting = loadingStates[`start-${quest.id}`] || false;
  const isCanceling = loadingStates[`cancel-${quest.id}`] || false;
  const isFailing = loadingStates[`fail-${quest.id}`] || false;
  const isDeleting = loadingStates[`delete-${quest.id}`] || false;

  return (
    <div className={`space-y-6 ${className}`} ref={containerRef}>
      {/* ARIA Live Region for announcements */}
      <div 
        ref={liveRegionRef}
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {liveMessage}
      </div>
      
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold" id="quest-title">{quest.title}</h1>
            <div className="flex items-center gap-2" role="group" aria-label="Quest status and difficulty">
              <Badge 
                variant="secondary" 
                className={getQuestStatusColorClass(quest.status)}
                aria-label={`Quest status: ${questTranslations?.status?.[quest.status] || quest.status}`}
              >
                {questTranslations?.status?.[quest.status] || quest.status}
              </Badge>
              <Badge 
                variant="outline" 
                className={getQuestDifficultyColorClass(quest.difficulty)}
                aria-label={`Quest difficulty: ${questTranslations?.difficulty?.[quest.difficulty] || quest.difficulty}`}
              >
                {questTranslations?.difficulty?.[quest.difficulty] || quest.difficulty}
              </Badge>
            </div>
          </div>
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              aria-label="Go back to quest list"
            >
              {questTranslations?.actions?.back || 'Go Back'}
            </Button>
          )}
        </div>

        {quest.description && (
          <p className="text-muted-foreground text-lg" aria-describedby="quest-title">
            {quest.description}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {questTranslations?.progress?.title || 'Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getProgressIcon()}
                  <span className="text-sm font-medium">
                    {questTranslations?.progress?.status || 'Status'}: {getProgressStatusText()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" aria-live="polite">
                    {progressPercentage}%
                  </span>
                  {isCalculating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
              </div>

              {/* Progress Bar */}
              <Progress 
                value={progress} 
                className="h-3"
                aria-label={`Quest progress: ${progressPercentage}% complete`}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />

              {/* Progress Details */}
              <div className="space-y-2">
                {quest.kind === 'quantitative' && (
                  <div className="flex justify-between items-center text-sm" role="status" aria-live="polite">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {questTranslations?.progress?.quantitativeProgress || 'Quantitative Progress'}:
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" aria-label="Information about quantitative progress calculation" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {questTranslations?.tooltips?.progressQuantitative || 'Progress for quantitative quests is calculated based on completed tasks or goals within the specified period.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-medium" aria-label={`Completed items: ${completedCount} out of ${totalCount}`}>
                      {completedCount} / {totalCount} {questTranslations?.progress?.completedItems || 'items'}
                    </span>
                  </div>
                )}

                {quest.kind === 'linked' && (
                  <div className="flex justify-between items-center text-sm" role="status" aria-live="polite">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {questTranslations?.progress?.linkedProgress || 'Linked Progress'}:
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" aria-label="Information about linked progress calculation" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {questTranslations?.tooltips?.progressLinked || 'Progress for linked quests is calculated based on completed linked goals and tasks.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-medium" aria-label={`Completed items: ${completedCount} out of ${totalCount}`}>
                      {completedCount} / {totalCount} {questTranslations?.progress?.completedItems || 'items'}
                    </span>
                  </div>
                )}

                {/* Remaining items */}
                {remainingCount > 0 && (
                  <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
                    {remainingCount} {questTranslations?.progress?.remaining || 'remaining'}
                  </div>
                )}

                {/* Error display */}
                {progressError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200" role="alert" aria-live="assertive">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      <span>{progressError}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quantitative Quest Information */}
          {quest.kind === 'quantitative' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {questTranslations?.sections?.quantitativeInfo || 'Quantitative Quest Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {quest.targetCount && (
                    <div className="flex justify-between">
                      <span className="font-medium">{questTranslations?.fields?.targetCount || 'Target Count'}:</span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {quest.targetCount}
                      </span>
                    </div>
                  )}
                  {quest.countScope && (
                    <div className="flex justify-between">
                      <span className="font-medium">{questTranslations?.fields?.countScope || 'Count Scope'}:</span>
                      <span>
                        {questTranslations?.countScope?.[quest.countScope] || quest.countScope}
                      </span>
                    </div>
                  )}
                  {quest.periodDays && (
                    <div className="flex justify-between">
                      <span className="font-medium">{questTranslations?.fields?.period || 'Period'}:</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quest.periodDays} {questTranslations?.fields?.days || 'days'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {quest.tags && quest.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {questTranslations?.fields?.tags || 'Tags'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quest.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Items */}
          {(quest.linkedGoalIds?.length > 0 || quest.linkedTaskIds?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  {questTranslations?.sections?.linkedItems || 'Linked Items'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quest.linkedGoalIds && quest.linkedGoalIds.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      {questTranslations?.fields?.linkedGoals || 'Linked Goals'}
                    </h4>
                    <div className="space-y-1">
                      {quest.linkedGoalIds.map((goalId) => {
                        const goal = goals.find(g => g.id === goalId);
                        return (
                          <div key={goalId} className="text-sm text-muted-foreground">
                            {goal ? goal.title : goalId}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {quest.linkedTaskIds && quest.linkedTaskIds.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      {questTranslations?.fields?.linkedTasks || 'Linked Tasks'}
                    </h4>
                    <div className="space-y-1">
                      {quest.linkedTaskIds.map((taskId) => {
                        const task = tasks.find(t => t.id === taskId);
                        return (
                          <div key={taskId} className="text-sm text-muted-foreground">
                            {task ? task.title : taskId}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {questTranslations?.sections?.details || 'Quest Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{questTranslations?.fields?.category || 'Category'}:</span>
                  <span>{getCategoryName(quest.category)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{questTranslations?.fields?.rewardXp || 'Reward XP'}:</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {formatRewardXp(quest.rewardXp)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{questTranslations?.fields?.privacy || 'Privacy'}:</span>
                  <span className="flex items-center gap-1">
                    {getPrivacyIcon(quest.privacy)}
                    {getPrivacyLabel(quest.privacy)}
                  </span>
                </div>
                {quest.deadline && (
                  <div className="flex justify-between">
                    <span className="font-medium">{questTranslations?.fields?.deadline || 'Deadline'}:</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(quest.deadline)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">{questTranslations?.fields?.createdAt || 'Created'}:</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(quest.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{questTranslations?.fields?.updatedAt || 'Updated'}:</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(quest.updatedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{questTranslations?.fields?.startedAt || 'Started'}:</span>
                  <span className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    {quest.startedAt ? (
                      formatDateTime(quest.startedAt)
                    ) : (
                      <span className="text-muted-foreground italic">
                        {questTranslations?.messages?.notStarted || 'Not Started'}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{questTranslations?.actions?.title || 'Actions'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quest.status === 'draft' && (
                <>
                  {onEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={() => onEdit(quest.id)}
                          aria-label="Edit quest details"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {questTranslations?.actions?.edit || 'Edit'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit quest details and settings</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {onStart && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          className="w-full justify-start" 
                          onClick={handleStart}
                          disabled={isStarting}
                          aria-label={isStarting ? "Starting quest..." : "Start quest"}
                        >
                          {isStarting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          {questTranslations?.actions?.start || 'Start'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Begin working on this quest</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="w-full justify-start" 
                          onClick={handleDelete}
                          disabled={isDeleting}
                          aria-label={isDeleting ? "Deleting quest..." : "Delete quest"}
                        >
                          {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          {questTranslations?.actions?.delete || 'Delete'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Permanently delete this quest</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}
              
              {quest.status === 'active' && (
                <>
                  {onCancel && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={handleCancel}
                          disabled={isCanceling}
                          aria-label={isCanceling ? "Cancelling quest..." : "Cancel quest"}
                        >
                          {isCanceling ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          {questTranslations?.actions?.cancel || 'Cancel'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Stop working on this quest</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {onFail && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="w-full justify-start" 
                          onClick={handleFail}
                          disabled={isFailing}
                          aria-label={isFailing ? "Marking quest as failed..." : "Mark quest as failed"}
                        >
                          {isFailing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-spin" />
                          ) : (
                            <Ban className="mr-2 h-4 w-4" />
                          )}
                          {questTranslations?.actions?.fail || 'Mark as Failed'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark this quest as failed</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}

              {(quest.status === 'completed' || quest.status === 'cancelled' || quest.status === 'failed') && (
                <div 
                  className="text-sm text-muted-foreground text-center"
                  role="status"
                  aria-live="polite"
                >
                  {questTranslations?.messages?.questCompleted || 'This quest has been completed.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuestDetails;
