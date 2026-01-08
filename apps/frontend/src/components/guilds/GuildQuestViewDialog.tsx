/**
 * GuildQuestViewDialog Component
 *
 * Read-only view of guild quest details for members.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  CheckCircle,
  Clock,
  Target,
  Users,
  Award,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { guildAPI, GuildQuest } from '@/lib/api/guild';
import { getGuildTranslations } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface GuildQuestViewDialogProps {
  guildId: string;
  questId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GuildQuestViewDialog: React.FC<GuildQuestViewDialogProps> = ({
  guildId,
  questId,
  open,
  onOpenChange,
}) => {
  const { language } = useTranslation();
  const translations = getGuildTranslations(language);
  const t = translations.quests;

  // Fetch quest data
  const { data: quest, isLoading, error } = useQuery({
    queryKey: ['guild-quest', guildId, questId],
    queryFn: () => guildAPI.getGuildQuest(guildId, questId),
    enabled: open && !!questId && !!guildId,
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">{t.loading}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !quest) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center gap-4 text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <p className="font-semibold text-lg">{t.error}</p>
              <p className="text-sm text-gray-600 mt-1">
                {error instanceof Error ? error.message : 'Failed to load quest details'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isCompleted = !!quest.userCompletion;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Trophy className={cn(
              'h-6 w-6',
              quest.difficulty === 'easy' ? 'text-green-500' :
              quest.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
            )} />
            <DialogTitle className="text-2xl">{quest.title}</DialogTitle>
            {isCompleted && <CheckCircle className="h-6 w-6 text-green-500" />}
          </div>
          <DialogDescription className="pt-2">
            <Badge variant={
              quest.status === 'active' ? 'default' :
              quest.status === 'draft' ? 'secondary' :
              quest.status === 'archived' ? 'outline' : 'destructive'
            }>
              {quest.status}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          {quest.description && (
            <div>
              <h4 className="font-semibold mb-2">{t.form.description}</h4>
              <p className="text-sm text-gray-600">{quest.description}</p>
            </div>
          )}

          <Separator />

          {/* Quest Type Specific Info */}
          {quest.kind === 'quantitative' && (
            <div className="space-y-4">
              <h4 className="font-semibold">{t.form.quantitative.title}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {quest.countScope === 'goals' ? t.progress.goalsCompleted :
                     quest.countScope === 'tasks' ? t.progress.tasksCompleted :
                     t.progress.guildQuestsCompleted}
                  </span>
                  <span className="font-semibold">
                    {quest.currentCount || 0} / {quest.targetCount || 0}
                  </span>
                </div>
                <Progress
                  value={quest.targetCount ? ((quest.currentCount || 0) / quest.targetCount) * 100 : 0}
                  className="h-3"
                />
                {quest.countScope === 'guild_quest' && quest.targetQuestId && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{t.form.quantitative.targetQuestId}:</span> {quest.targetQuestId}
                  </div>
                )}
                {quest.periodDays && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{t.form.quantitative.periodDays}: {quest.periodDays} {translations.create.form.tags.count}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {quest.kind === 'percentual' && (
            <div className="space-y-4">
              <h4 className="font-semibold">{t.form.percentual.title}</h4>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t.form.percentual.percentualType}:</span>{' '}
                  {quest.percentualType === 'goal_task_completion' 
                    ? t.form.percentual.goalTaskCompletion 
                    : t.form.percentual.memberCompletion}
                </div>
                
                {quest.percentualType === 'goal_task_completion' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t.progress.completionPercentage}</span>
                      <span className="font-semibold">
                        {quest.userProgress?.progress?.percentage?.toFixed(1) || 0}% / {quest.targetPercentage || 0}%
                      </span>
                    </div>
                    <Progress
                      value={quest.userProgress?.progress?.percentage || 0}
                      className="h-3"
                    />
                    <div className="text-sm text-gray-600">
                      {quest.linkedGoalIds && quest.linkedGoalIds.length > 0 && (
                        <div>
                          <span className="font-medium">{t.form.percentual.linkedGoalIds}:</span>{' '}
                          {quest.linkedGoalIds.join(', ')}
                        </div>
                      )}
                      {quest.linkedTaskIds && quest.linkedTaskIds.length > 0 && (
                        <div>
                          <span className="font-medium">{t.form.percentual.linkedTaskIds}:</span>{' '}
                          {quest.linkedTaskIds.join(', ')}
                        </div>
                      )}
                      {quest.percentualCountScope && (
                        <div>
                          <span className="font-medium">{t.form.percentual.percentualCountScope}:</span>{' '}
                          {quest.percentualCountScope === 'goals' ? t.form.percentual.percentualCountScopeGoals :
                           quest.percentualCountScope === 'tasks' ? t.form.percentual.percentualCountScopeTasks :
                           t.form.percentual.percentualCountScopeBoth}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {quest.percentualType === 'member_completion' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t.progress.membersCompleted}</span>
                      <span className="font-semibold">
                        {quest.membersCompletedCount || 0} / {quest.memberTotal || 0}
                      </span>
                    </div>
                    <Progress
                      value={quest.memberTotal ? ((quest.membersCompletedCount || 0) / quest.memberTotal) * 100 : 0}
                      className="h-3"
                    />
                    <div className="text-sm text-gray-600">
                      {quest.targetPercentage}% of members must complete
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Quest Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{t.form.rewardXp}:</span>
                <span className="font-semibold">{quest.rewardXp} {translations.analytics.xp}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{t.form.difficulty}:</span>
                <span className="font-semibold">{t.difficulty[quest.difficulty]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{quest.category}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              {quest.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{t.metadata.deadline}:</span>
                  <span className="font-semibold">
                    {formatDistanceToNow(new Date(quest.deadline), { addSuffix: true })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{t.metadata.completedBy}:</span>
                <span className="font-semibold">{quest.completedByCount}</span>
              </div>
              {quest.createdByNickname && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Created by:</span>
                  <span className="font-semibold">{quest.createdByNickname}</span>
                </div>
              )}
              {quest.tags && quest.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {quest.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isCompleted && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">{t.actions.completed}</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

