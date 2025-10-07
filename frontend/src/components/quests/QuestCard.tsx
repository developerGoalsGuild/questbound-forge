import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Quest,
  getQuestStatusKey,
  getQuestStatusColorClass,
  getQuestDifficultyKey,
  getQuestDifficultyColorClass,
  formatRewardXp,
  calculateQuestProgress,
} from '@/models/quest';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ShieldCheck,
  Star,
  Tag,
  Edit,
  Play,
  Trash2,
  XCircle,
  Ban,
  Eye,
  Info,
  Loader2,
} from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  onViewDetails: (id: string) => void;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onFail: (id: string) => void;
  onDelete: (id: string) => void;
  loadingStates?: Record<string, boolean>;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onViewDetails,
  onStart,
  onEdit,
  onCancel,
  onFail,
  onDelete,
  loadingStates = {},
}) => {
  const { t } = useTranslation();
  
  // Check if quest can be started with comprehensive validation
  const canStartQuest = () => {
    // Only draft quests can be started
    if (quest.status !== 'draft') {
      return false;
    }
    
    // Check required fields for all quests
    if (!quest.title || quest.title.trim().length === 0) {
      return false;
    }
    
    if (!quest.category || quest.category.trim().length === 0) {
      return false;
    }
    
    if (!quest.difficulty || !['easy', 'medium', 'hard'].includes(quest.difficulty)) {
      return false;
    }
    
    if (!quest.kind || !['linked', 'quantitative'].includes(quest.kind)) {
      return false;
    }
    
    // Validate quantitative quest requirements
    if (quest.kind === 'quantitative') {
      if (!quest.targetCount || quest.targetCount <= 0) {
        return false;
      }
      
      if (!quest.countScope || !['completed_tasks', 'completed_goals', 'any'].includes(quest.countScope)) {
        return false;
      }
      
      if (!quest.periodDays || quest.periodDays <= 0) {
        return false;
      }
    }
    
    // Validate linked quest requirements
    if (quest.kind === 'linked') {
      if (!quest.linkedGoalIds || quest.linkedGoalIds.length === 0) {
        return false;
      }
      
      if (!quest.linkedTaskIds || quest.linkedTaskIds.length === 0) {
        return false;
      }
    }
    
    return true;
  };
  
  const isStartDisabled = !canStartQuest();
  const hasInvalidCountScope = quest.kind === 'quantitative' && (quest.countScope === null || quest.countScope === undefined);
  const progress = calculateQuestProgress(quest);
  
  // Loading states
  const isStarting = loadingStates[`start-${quest.id}`] || false;
  const isCanceling = loadingStates[`cancel-${quest.id}`] || false;
  const isFailing = loadingStates[`fail-${quest.id}`] || false;
  const isDeleting = loadingStates[`delete-${quest.id}`] || false;

  const renderActionButtons = () => {
    switch (quest.status) {
      case 'draft':
        return (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => onEdit(quest.id)}>
                  <Edit className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">{t.quest.actions.edit}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t.quest?.tooltips?.editButton || 'Edit this quest to modify its details, settings, or requirements.'}
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  className="flex-shrink-0" 
                  onClick={() => onStart(quest.id)}
                  disabled={isStartDisabled || isStarting}
                >
                  {isStarting ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-1 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isStarting ? t.quest.actions.starting || 'Starting...' : t.quest.actions.start}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {isStartDisabled 
                    ? (quest.kind === 'quantitative' && (quest.countScope === null || quest.countScope === undefined)
                        ? (t.quest?.tooltips?.startDisabledQuantitative || 'Cannot start quantitative quest without count scope. Please edit the quest first.')
                        : (t.quest?.tooltips?.startDisabled || 'This quest cannot be started in its current state.'))
                    : (t.quest?.tooltips?.startButton || 'Start this quest to begin tracking your progress and earning rewards.')
                  }
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-shrink-0" 
                  onClick={() => onDelete(quest.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isDeleting ? t.quest.actions.deleting || 'Deleting...' : t.quest.actions.delete}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t.quest?.tooltips?.deleteButton || 'Permanently delete this quest. This action cannot be undone.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        );
      case 'active':
        return (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => onViewDetails(quest.id)}>
                  <Eye className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t.quest?.tooltips?.viewButton || 'View detailed information about this active quest and its progress.'}
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-shrink-0" 
                  onClick={() => onCancel(quest.id)}
                  disabled={isCanceling}
                >
                  {isCanceling ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="mr-1 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isCanceling ? t.quest.actions.canceling || 'Canceling...' : t.quest.actions.cancel}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t.quest?.tooltips?.cancelButton || 'Cancel this quest. You won\'t receive rewards and progress will be lost.'}
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-shrink-0" 
                  onClick={() => onFail(quest.id)}
                  disabled={isFailing}
                >
                  {isFailing ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-1 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isFailing ? t.quest.actions.failing || 'Failing...' : t.quest.actions.fail}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t.quest?.tooltips?.failButton || 'Mark this quest as failed. This will end the quest without rewards.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        );
      case 'completed':
      case 'cancelled':
      case 'failed':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => onViewDetails(quest.id)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {t.quest?.tooltips?.viewCompletedButton || 'View details and results of this completed quest.'}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="flex flex-col justify-between h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
            <button
              onClick={() => onViewDetails(quest.id)}
              className="text-left text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
              aria-label={`View details for quest: ${quest.title}`}
            >
              {quest.title}
            </button>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          {quest.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{quest.description}</p>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getQuestDifficultyColorClass(quest.difficulty)}>
                <ShieldCheck className="mr-1 h-3 w-3" />
                {t.quest.difficulty[quest.difficulty]}
              </Badge>
              <Badge variant="secondary">
                <Star className="mr-1 h-3 w-3" />
                {formatRewardXp(quest.rewardXp)}
              </Badge>
            </div>
            <div className="flex items-center">
              <Tag className="mr-1 h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{quest.category}</span>
            </div>
          </div>
          {quest.kind === 'quantitative' && (
            <div>
              {/* Status above progress bar */}
              <div className="mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.quest?.progress?.status || 'Status:'}
                  </span>
                  <Badge className={getQuestStatusColorClass(quest.status)}>
                    {t.quest.status[quest.status]}
                  </Badge>
                </div>
                {hasInvalidCountScope && (
                  <Badge variant="destructive" className="text-xs">
                    {t.quest?.validation?.invalidConfiguration || 'Invalid Configuration'}
                  </Badge>
                )}
              </div>
              <div className="mb-1 flex justify-between items-baseline">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.quest.progress.inProgress}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {t.quest?.tooltips?.progressQuantitative || 'Progress for quantitative quests is calculated based on completed tasks or goals within the specified period.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-bold">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          {quest.kind === 'linked' && (
            <div>
              {/* Status above progress bar */}
              <div className="mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.quest?.progress?.status || 'Status:'}
                  </span>
                  <Badge className={getQuestStatusColorClass(quest.status)}>
                    {t.quest.status[quest.status]}
                  </Badge>
                </div>
              </div>
              <div className="mb-1 flex justify-between items-baseline">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.quest.progress.inProgress}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {t.quest?.tooltips?.progressLinked || 'Progress for linked quests is calculated based on completion of linked goals and tasks.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-bold">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex flex-wrap gap-2 justify-end w-full">
          {renderActionButtons()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuestCard;
