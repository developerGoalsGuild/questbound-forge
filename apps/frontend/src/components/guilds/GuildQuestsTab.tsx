/**
 * GuildQuestsTab Component
 *
 * Displays and manages guild quests (quantitative and percentual only).
 * Owners and moderators can create/edit/delete/activate/finish quests.
 * Members can view quests (read-only).
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Users,
  Loader2,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  Eye,
  User,
  Play,
  Flag,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { guildAPI, GuildQuest, GuildQuestCreateInput } from '@/lib/api/guild';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CreateGuildQuestForm } from './CreateGuildQuestForm';
import { EditGuildQuestForm } from './EditGuildQuestForm';
import { GuildQuestViewDialog } from './GuildQuestViewDialog';
import { getGuildTranslations } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildQuestsTabProps {
  guildId: string;
  currentUserId?: string;
  canManage: boolean; // Owner or moderator
  className?: string;
  language?: string; // Optional prop to force language
}

export const GuildQuestsTab: React.FC<GuildQuestsTabProps> = ({
  guildId,
  currentUserId,
  canManage,
  className,
  language: propLanguage,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [viewingQuestId, setViewingQuestId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { language: contextLanguage, isLanguageLoading } = useTranslation();
  // Use prop language if provided (most reliable), otherwise use context, with safe fallback
  // If language is still loading, use prop or default to 'en'
  const language = propLanguage || (isLanguageLoading ? 'en' : contextLanguage) || 'en';
  // Ensure we're using a valid language code
  const validLanguage = (language === 'en' || language === 'es' || language === 'fr') ? language : 'en';
  const translations = getGuildTranslations(validLanguage);
  const t = translations.quests;

  // Fetch all guild quests (no status filter) with pagination
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['guild-quests', guildId],
    queryFn: async () => {
      // Fetch all quests using pagination
      const allQuests: GuildQuest[] = [];
      let offset = 0;
      const limit = 100; // Maximum allowed by API
      let hasMore = true;

      while (hasMore) {
        const response = await guildAPI.listGuildQuests(guildId, undefined, limit, offset);
        allQuests.push(...response.quests);
        
        // If we got less than the limit, we've reached the end
        hasMore = response.quests.length === limit;
        offset += limit;
      }

      // Return in the same format as the API response
      return {
        quests: allQuests,
        total: allQuests.length,
        limit: limit,
        offset: 0
      };
    },
    enabled: !!guildId,
  });

  // Filter quests client-side by status
  const filteredQuests = useMemo(() => {
    if (!data?.quests) return [];
    
    if (statusFilter === 'all') {
      return data.quests;
    }
    
    return data.quests.filter(quest => quest.status === statusFilter);
  }, [data?.quests, statusFilter]);

  // Delete quest mutation
  const deleteMutation = useMutation({
    mutationFn: ({ questId, action }: { questId: string; action: 'delete' | 'archive' }) =>
      guildAPI.deleteGuildQuest(guildId, questId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild-quests', guildId] });
      toast.success(t.messages.deleteSuccess);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete quest');
    },
  });

  // Activate quest mutation
  const activateMutation = useMutation({
    mutationFn: (questId: string) => guildAPI.activateGuildQuest(guildId, questId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild-quests', guildId] });
      toast.success(t.messages.activateSuccess || 'Quest activated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate quest');
    },
  });

  // Finish quest mutation
  const finishMutation = useMutation({
    mutationFn: (questId: string) => guildAPI.finishGuildQuest(guildId, questId),
    onSuccess: () => {
      // Invalidate both quest-specific queries and guild queries that include quests
      queryClient.invalidateQueries({ queryKey: ['guild-quests', guildId] });
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success(t.messages.finishSuccess || 'Quest finished successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to finish quest');
    },
  });

  const [finishConfirmOpen, setFinishConfirmOpen] = useState<string | null>(null);
  const [questToFinish, setQuestToFinish] = useState<GuildQuest | null>(null);

  const handleActivate = (quest: GuildQuest) => {
    if (quest.status !== 'draft') {
      toast.error('Only draft quests can be activated');
      return;
    }
    activateMutation.mutate(quest.questId);
  };

  const handleFinish = (quest: GuildQuest) => {
    if (quest.status !== 'active') {
      toast.error('Only active quests can be finished');
      return;
    }
    setQuestToFinish(quest);
    setFinishConfirmOpen(quest.questId);
  };

  const confirmFinish = () => {
    if (questToFinish) {
      finishMutation.mutate(questToFinish.questId);
      setFinishConfirmOpen(null);
      setQuestToFinish(null);
    }
  };

  const cancelFinish = () => {
    setFinishConfirmOpen(null);
    setQuestToFinish(null);
  };

  // Helper to check if goals are reached
  const areGoalsReached = (quest: GuildQuest): boolean => {
    if (quest.kind === 'quantitative') {
      return (quest.currentCount || 0) >= (quest.targetCount || 0);
    } else if (quest.kind === 'percentual') {
      if (quest.percentualType === 'member_completion') {
        const membersCompleted = quest.membersCompletedCount || 0;
        const memberTotal = quest.memberTotal || 1;
        const completionPercentage = (membersCompleted / memberTotal) * 100;
        return completionPercentage >= (quest.targetPercentage || 0);
      } else if (quest.percentualType === 'goal_task_completion') {
        // For goal_task_completion, if any member completed, consider goals reached
        return (quest.completedByCount || 0) > 0;
      }
    }
    return false;
  };

  const handleDelete = (quest: GuildQuest, action: 'delete' | 'archive' = 'delete') => {
    if (action === 'delete' && quest.status !== 'draft') {
      toast.error(t.messages.onlyDraftDelete);
      return;
    }
    if (action === 'archive' && quest.status !== 'active') {
      toast.error(t.messages.onlyActiveArchive);
      return;
    }
    deleteMutation.mutate({ questId: quest.questId, action });
  };

  const renderQuestCard = (quest: GuildQuest) => {
    const isCompleted = !!quest.userCompletion;

    return (
      <Card 
        key={quest.questId} 
        className={cn(
          'transition-all hover:shadow-md', 
          isCompleted && 'opacity-75',
          !canManage && 'cursor-pointer'
        )}
        onClick={() => {
          if (!canManage) {
            setViewingQuestId(quest.questId);
          }
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className={cn('h-5 w-5', quest.difficulty === 'easy' ? 'text-green-500' : quest.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500')} />
                {quest.title}
                {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardTitle>
              {quest.description && (
                <p className="text-sm text-gray-600 mt-1">{quest.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                quest.status === 'active' ? 'default' :
                quest.status === 'draft' ? 'secondary' :
                quest.status === 'completed' ? 'default' :
                quest.status === 'failed' ? 'destructive' :
                quest.status === 'archived' ? 'outline' : 'destructive'
              } className={cn(
                quest.status === 'completed' && 'bg-green-500 hover:bg-green-600 text-white',
                quest.status === 'failed' && 'bg-red-500 hover:bg-red-600 text-white'
              )}>
                {quest.status === 'completed' ? 'Completed' : 
                 quest.status === 'failed' ? 'Failed' : 
                 quest.status === 'active' ? 'Active' :
                 quest.status === 'draft' ? 'Draft' :
                 quest.status === 'archived' ? 'Archived' : quest.status}
              </Badge>
              <div className="flex gap-1">
                {!canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingQuestId(quest.questId);
                    }}
                    className="h-8 w-8 p-0"
                    title="View quest details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {canManage && (
                  <>
                    {quest.status === 'draft' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuestId(quest.questId);
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit quest"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivate(quest);
                          }}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          disabled={activateMutation.isPending}
                          title="Activate quest"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {quest.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFinish(quest);
                        }}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        disabled={finishMutation.isPending}
                        title="Finish quest"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(quest, quest.status === 'active' ? 'archive' : 'delete');
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                      title={quest.status === 'active' ? 'Archive quest' : 'Delete quest'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quest Type Specific Info */}
          {quest.kind === 'quantitative' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
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
                className="h-2"
              />
              {quest.periodDays && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Period: {quest.periodDays} days
                </div>
              )}
            </div>
          )}

          {quest.kind === 'percentual' && (
            <div className="space-y-2">
              {quest.percentualType === 'goal_task_completion' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t.progress.completionPercentage}</span>
                    <span className="font-semibold">
                      {quest.userProgress?.progress?.percentage?.toFixed(1) || 0}% / {quest.targetPercentage || 0}%
                    </span>
                  </div>
                  <Progress
                    value={quest.userProgress?.progress?.percentage || 0}
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500">
                    Complete {quest.targetPercentage}% of linked {quest.percentualCountScope === 'goals' ? t.form.percentual.percentualCountScopeGoals.toLowerCase() :
                     quest.percentualCountScope === 'tasks' ? t.form.percentual.percentualCountScopeTasks.toLowerCase() : t.form.percentual.percentualCountScopeBoth.toLowerCase()}
                  </div>
                </div>
              )}
              {quest.percentualType === 'member_completion' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t.progress.membersCompleted}</span>
                    <span className="font-semibold">
                      {quest.membersCompletedCount || 0} / {quest.memberTotal || 0}
                    </span>
                  </div>
                  <Progress
                    value={quest.memberTotal ? ((quest.membersCompletedCount || 0) / quest.memberTotal) * 100 : 0}
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500">
                    {quest.targetPercentage}% of members must complete
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quest Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
              <div className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              {quest.rewardXp} {translations.analytics.xp}
            </div>
            <Badge variant="outline" className="text-xs">
              {quest.category}
            </Badge>
            {quest.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(quest.deadline), { addSuffix: true })}
              </div>
            )}
            {quest.createdByNickname && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {quest.createdByNickname}
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Users className="h-3 w-3" />
              {quest.completedByCount} {t.metadata.completedBy}
            </div>
          </div>

        </CardContent>
      </Card>
    );
  };

  // Finish confirmation dialog
  const renderFinishConfirmation = () => {
    if (!questToFinish || !finishConfirmOpen) return null;

    const goalsReached = areGoalsReached(questToFinish);
    const willComplete = goalsReached;
    const willFail = !goalsReached;

    return (
      <Dialog open={!!finishConfirmOpen} onOpenChange={() => setFinishConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Quest</DialogTitle>
            <DialogDescription>
              {willFail && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-800">Warning: Goals Not Reached</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This quest will be marked as <strong>Failed</strong>. No points will be awarded and it will not count toward guild ranking.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {willComplete && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Goals Reached</p>
                      <p className="text-sm text-green-700 mt-1">
                        This quest will be marked as <strong>Completed</strong>. Points will be awarded and it will count toward guild ranking.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="mt-4 text-sm text-gray-600">
                Are you sure you want to finish this quest? This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={cancelFinish}>
              Cancel
            </Button>
            <Button 
              variant={willFail ? 'destructive' : 'default'}
              onClick={confirmFinish}
              disabled={finishMutation.isPending}
            >
              {finishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Finishing...
                </>
              ) : (
                'Finish Quest'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">{t.loading}</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <p className="font-semibold text-lg">{t.error}</p>
              <p className="text-sm text-gray-600 mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all quests for counting (before filtering)
  const allQuests = data?.quests || [];
  const activeQuests = allQuests.filter(q => q.status === 'active');
  const draftQuests = allQuests.filter(q => q.status === 'draft');
  const archivedQuests = allQuests.filter(q => q.status === 'archived');
  
  // Use filtered quests for display
  const quests = filteredQuests;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
          <h3 className="text-2xl font-bold">{t.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {allQuests.length} {t.status.all.toLowerCase()} • {activeQuests.length} {t.status.active.toLowerCase()} • {draftQuests.length} {t.status.draft.toLowerCase()}
          </p>
        </div>
        {canManage && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t.create}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.createTitle}</DialogTitle>
                <DialogDescription>
                  {t.createDescription}
                </DialogDescription>
              </DialogHeader>
              <CreateGuildQuestForm
                guildId={guildId}
                onSuccess={() => {
                  setShowCreateDialog(false);
                  queryClient.invalidateQueries({ queryKey: ['guild-quests', guildId] });
                }}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* View Quest Dialog (for members) */}
      {viewingQuestId && (
        <GuildQuestViewDialog
          guildId={guildId}
          questId={viewingQuestId}
          open={!!viewingQuestId}
          onOpenChange={(open) => !open && setViewingQuestId(null)}
        />
      )}

      {/* Edit Quest Dialog */}
      {editingQuestId && (
        <Dialog open={!!editingQuestId} onOpenChange={(open) => !open && setEditingQuestId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.actions.edit}</DialogTitle>
              <DialogDescription>
                {t.messages.onlyDraftEdit}
              </DialogDescription>
            </DialogHeader>
            <EditGuildQuestForm
              guildId={guildId}
              questId={editingQuestId}
              onSuccess={() => {
                setEditingQuestId(null);
                queryClient.invalidateQueries({ queryKey: ['guild-quests', guildId] });
                queryClient.invalidateQueries({ queryKey: ['guild-quest', guildId, editingQuestId] });
              }}
              onCancel={() => setEditingQuestId(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Finish Quest Confirmation Dialog */}
      {renderFinishConfirmation()}

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">{t.status.all} ({quests.length})</TabsTrigger>
          <TabsTrigger value="active">{t.status.active} ({activeQuests.length})</TabsTrigger>
          <TabsTrigger value="draft">{t.status.draft} ({draftQuests.length})</TabsTrigger>
          <TabsTrigger value="archived">{t.status.archived} ({archivedQuests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {quests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-16 w-16 text-gray-300 mb-4" />
                <h4 className="font-semibold text-lg mb-2">{t.noQuests}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  {canManage ? t.noQuestsDescription : t.noQuestsDescriptionMember}
                </p>
                {canManage && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.create}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quests.map(renderQuestCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

