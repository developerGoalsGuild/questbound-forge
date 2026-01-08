/**
 * EditGuildQuestForm Component
 *
 * Form for editing existing guild quests (draft quests only).
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { guildAPI, GuildQuest, GuildQuestCreateInput } from '@/lib/api/guild';
import { toast } from 'sonner';
import { getGuildTranslations } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';

interface EditGuildQuestFormProps {
  guildId: string;
  questId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const QUEST_CATEGORIES = [
  'Health', 'Work', 'Personal', 'Learning', 'Fitness', 'Creative',
  'Financial', 'Social', 'Spiritual', 'Hobby', 'Travel', 'Other'
];

export const EditGuildQuestForm: React.FC<EditGuildQuestFormProps> = ({
  guildId,
  questId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<GuildQuestCreateInput>>({});
  const [tagInput, setTagInput] = useState('');
  const { language } = useTranslation();
  const translations = getGuildTranslations(language);
  const t = translations.quests;

  // Fetch quest data
  const { data: quest, isLoading: isLoadingQuest } = useQuery({
    queryKey: ['guild-quest', guildId, questId],
    queryFn: () => guildAPI.getGuildQuest(guildId, questId),
    enabled: !!questId && !!guildId,
  });

  // Populate form when quest loads
  useEffect(() => {
    if (quest) {
      // Check if quest can be edited (only draft quests can be edited)
      if (quest.status !== 'draft') {
        toast.error(`Cannot edit quest with status '${quest.status}'. Only draft quests can be edited.`);
        onCancel?.();
        return;
      }
      
      setFormData({
        title: quest.title,
        description: quest.description || '',
        category: quest.category,
        difficulty: quest.difficulty,
        // Note: rewardXp is now auto-calculated by backend (not editable)
        kind: quest.kind,
        tags: quest.tags || [],
        deadline: quest.deadline,
        // Quantitative fields
        targetCount: quest.targetCount,
        countScope: quest.countScope,
        targetQuestId: quest.targetQuestId,
        periodDays: quest.periodDays,
        // Percentual fields
        percentualType: quest.percentualType,
        targetPercentage: quest.targetPercentage,
        linkedGoalIds: quest.linkedGoalIds,
        linkedTaskIds: quest.linkedTaskIds,
        percentualCountScope: quest.percentualCountScope,
      });
    }
  }, [quest]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<GuildQuestCreateInput>) => 
      guildAPI.updateGuildQuest(guildId, questId, data),
    onSuccess: () => {
      toast.success(t.messages.updateSuccess);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || t.error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || formData.title.length < 3) {
      toast.error(t.form.validation.titleRequired);
      return;
    }

    if (!formData.category) {
      toast.error(t.form.validation.categoryRequired);
      return;
    }

    if (formData.kind === 'quantitative') {
      if (!formData.targetCount || formData.targetCount < 1) {
        toast.error(t.form.validation.targetCountRequired);
        return;
      }
      if (!formData.countScope) {
        toast.error(t.form.validation.countScopeRequired);
        return;
      }
      if (formData.countScope === 'guild_quest' && !formData.targetQuestId) {
        toast.error(t.form.validation.targetQuestIdRequired);
        return;
      }
    }

    if (formData.kind === 'percentual') {
      if (!formData.percentualType) {
        toast.error(t.form.validation.percentualTypeRequired);
        return;
      }
      if (formData.targetPercentage === undefined || formData.targetPercentage < 0 || formData.targetPercentage > 100) {
        toast.error(t.form.validation.targetPercentageRequired);
        return;
      }
      if (formData.percentualType === 'goal_task_completion') {
        if (!formData.linkedGoalIds?.length && !formData.linkedTaskIds?.length) {
          toast.error(t.form.validation.linkedGoalTaskRequired);
          return;
        }
        if (!formData.percentualCountScope) {
          toast.error(t.form.validation.percentualCountScopeRequired);
          return;
        }
      }
    }

    updateMutation.mutate(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags && formData.tags.length < 10) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag),
    });
  };

  if (isLoadingQuest) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600">{t.loading}</span>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t.error}</p>
      </div>
    );
  }

  if (quest.status !== 'draft') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t.messages.onlyDraftEdit}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">{t.form.title} *</Label>
          <Input
            id="title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t.form.titlePlaceholder}
            required
            minLength={3}
            maxLength={100}
          />
        </div>

        <div>
          <Label htmlFor="description">{t.form.description}</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t.form.descriptionPlaceholder}
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">{t.form.category} *</Label>
            <Select
              value={formData.category || ''}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.form.category} />
              </SelectTrigger>
              <SelectContent>
                {QUEST_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="difficulty">{t.form.difficulty}</Label>
            <Select
              value={formData.difficulty || 'medium'}
              onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                setFormData({ ...formData, difficulty: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t.difficulty.easy}</SelectItem>
                <SelectItem value="medium">{t.difficulty.medium}</SelectItem>
                <SelectItem value="hard">{t.difficulty.hard}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Note: rewardXp is now auto-calculated by backend based on scope, period, and difficulty */}
        {/* Removed rewardXp input field */}
        
        <div className="grid grid-cols-2 gap-4">

          <div>
            <Label htmlFor="kind">{t.form.questType} *</Label>
            <Select
              value={formData.kind || 'quantitative'}
              onValueChange={(value: 'quantitative' | 'percentual') =>
                setFormData({ ...formData, kind: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantitative">{t.types.quantitative}</SelectItem>
                <SelectItem value="percentual">{t.types.percentual}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quantitative Fields */}
      {formData.kind === 'quantitative' && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold">{t.form.quantitative.title}</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetCount">{t.form.quantitative.targetCount} *</Label>
              <Input
                id="targetCount"
                type="number"
                value={formData.targetCount || ''}
                onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) || undefined })}
                min={1}
                placeholder={t.form.quantitative.targetCountPlaceholder}
              />
            </div>

            <div>
              <Label htmlFor="countScope">{t.form.quantitative.countScope} *</Label>
              <Select
                value={formData.countScope || ''}
                onValueChange={(value: 'goals' | 'tasks' | 'guild_quest') =>
                  setFormData({ ...formData, countScope: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.form.quantitative.countScope} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goals">{t.form.quantitative.countScopeGoals}</SelectItem>
                  <SelectItem value="tasks">{t.form.quantitative.countScopeTasks}</SelectItem>
                  <SelectItem value="guild_quest">{t.form.quantitative.countScopeGuildQuest}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.countScope === 'guild_quest' && (
            <div>
              <Label htmlFor="targetQuestId">{t.form.quantitative.targetQuestId} *</Label>
              <Input
                id="targetQuestId"
                value={formData.targetQuestId || ''}
                onChange={(e) => setFormData({ ...formData, targetQuestId: e.target.value })}
                placeholder={t.form.quantitative.targetQuestIdPlaceholder}
              />
            </div>
          )}

          <div>
            <Label htmlFor="periodDays">{t.form.quantitative.periodDays}</Label>
            <Input
              id="periodDays"
              type="number"
              value={formData.periodDays || ''}
              onChange={(e) => setFormData({ ...formData, periodDays: parseInt(e.target.value) || undefined })}
              min={1}
              placeholder={t.form.quantitative.periodDaysPlaceholder}
            />
          </div>
        </div>
      )}

      {/* Percentual Fields */}
      {formData.kind === 'percentual' && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold">{t.form.percentual.title}</h4>

          <div>
            <Label htmlFor="percentualType">{t.form.percentual.percentualType} *</Label>
            <Select
              value={formData.percentualType || ''}
              onValueChange={(value: 'goal_task_completion' | 'member_completion') =>
                setFormData({ ...formData, percentualType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t.form.percentual.percentualType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goal_task_completion">{t.form.percentual.goalTaskCompletion}</SelectItem>
                <SelectItem value="member_completion">{t.form.percentual.memberCompletion}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="targetPercentage">{t.form.percentual.targetPercentage} *</Label>
            <Input
              id="targetPercentage"
              type="number"
              value={formData.targetPercentage || ''}
              onChange={(e) => setFormData({ ...formData, targetPercentage: parseFloat(e.target.value) || undefined })}
              min={0}
              max={100}
              step={0.1}
              placeholder={t.form.percentual.targetPercentagePlaceholder}
            />
          </div>

          {formData.percentualType === 'goal_task_completion' && (
            <>
              <div>
                <Label htmlFor="linkedGoalIds">{t.form.percentual.linkedGoalIds}</Label>
                <Input
                  id="linkedGoalIds"
                  value={formData.linkedGoalIds?.join(',') || ''}
                  onChange={(e) => {
                    const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                    setFormData({ ...formData, linkedGoalIds: ids.length > 0 ? ids : undefined });
                  }}
                  placeholder={t.form.percentual.linkedGoalIdsPlaceholder}
                />
              </div>

              <div>
                <Label htmlFor="linkedTaskIds">{t.form.percentual.linkedTaskIds}</Label>
                <Input
                  id="linkedTaskIds"
                  value={formData.linkedTaskIds?.join(',') || ''}
                  onChange={(e) => {
                    const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                    setFormData({ ...formData, linkedTaskIds: ids.length > 0 ? ids : undefined });
                  }}
                  placeholder={t.form.percentual.linkedTaskIdsPlaceholder}
                />
              </div>

              <div>
                <Label htmlFor="percentualCountScope">{t.form.percentual.percentualCountScope} *</Label>
                <Select
                  value={formData.percentualCountScope || ''}
                  onValueChange={(value: 'goals' | 'tasks' | 'both') =>
                    setFormData({ ...formData, percentualCountScope: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.form.percentual.percentualCountScope} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goals">{t.form.percentual.percentualCountScopeGoals}</SelectItem>
                    <SelectItem value="tasks">{t.form.percentual.percentualCountScopeTasks}</SelectItem>
                    <SelectItem value="both">{t.form.percentual.percentualCountScopeBoth}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tags */}
      <div>
        <Label>{t.form.tags} ({t.form.tagsHelp})</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={t.form.tagsPlaceholder}
            disabled={formData.tags && formData.tags.length >= 10}
          />
          <Button type="button" onClick={addTag} variant="outline" disabled={!tagInput.trim() || (formData.tags && formData.tags.length >= 10)}>
            {translations.create.form.tags.addTag}
          </Button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {translations.create.actions.cancel}
          </Button>
        )}
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.actions.creating}
            </>
          ) : (
            t.actions.edit
          )}
        </Button>
      </div>
    </form>
  );
};

