/**
 * QuestEditForm Component
 * 
 * Form for editing existing quests with pre-populated data,
 * comprehensive validation, accessibility features, and internationalization support.
 * 
 * Features:
 * - Pre-populated form with existing quest data
 * - Multi-step wizard (Basic Info → Advanced Options → Review)
 * - Real-time validation with debounced feedback
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Internationalization (i18n) support
 * - Error handling and recovery
 * - Optimistic updates with rollback
 * - Form state persistence
 * 
 * Steps:
 * 1. Basic Information (title, description, category, difficulty)
 * 2. Advanced Options (privacy, kind, linked items, quantitative settings)
 * 3. Review and Submit
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuest, useQuestEdit } from '@/hooks/useQuest';
import { loadGoals, type GoalResponse } from '@/lib/apiGoal';
import { loadTasks, type TaskResponse } from '@/lib/apiTask';
import { 
  QuestCreateInputSchema, 
  QUEST_CATEGORIES,
  type QuestCreateInput,
  type Quest,
  type QuestDifficulty,
  type QuestPrivacy,
  type QuestKind,
  type QuestCountScope
} from '@/models/quest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuestCategorySelector from '@/components/forms/QuestCategorySelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Loader2,
  Info,
  AlertCircle,
  Target,
  Calendar,
  Hash,
  ShieldCheck,
  X
} from 'lucide-react';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface QuestEditFormProps {
  questId: string;
  onSuccess?: (quest: Quest) => void;
  onCancel?: () => void;
  className?: string;
}

interface QuestEditFormData {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  privacy: QuestPrivacy;
  kind: QuestKind;
  tags: string[];
  deadline?: number;
  targetCount?: number;
  countScope?: QuestCountScope;
  periodDays?: number;
  linkedGoalIds: string[];
  linkedTaskIds: string[];
  dependsOnQuestIds: string[];
}

interface StepProps {
  formData: QuestEditFormData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  quest?: Quest; // Add quest data for ReviewStep
  goals?: GoalResponse[];
  tasks?: TaskResponse[];
  onGoalsChange?: (goals: GoalResponse[]) => void;
  onTasksChange?: (tasks: TaskResponse[]) => void;
}

// ============================================================================
// Constants
// ============================================================================

const QUEST_DIFFICULTY_OPTIONS: QuestDifficulty[] = ['easy', 'medium', 'hard'];
const QUEST_PRIVACY_OPTIONS: QuestPrivacy[] = ['public', 'followers', 'private'];
const QUEST_KIND_OPTIONS: QuestKind[] = ['linked', 'quantitative'];
const QUEST_COUNT_SCOPE_OPTIONS: QuestCountScope[] = ['completed_tasks', 'completed_goals'];

const PERIOD_OPTIONS = [
  { value: 1, label: 'Daily' },
  { value: 7, label: 'Weekly' },
  { value: 30, label: 'Monthly' },
  { value: 90, label: 'Quarterly' },
  { value: 365, label: 'Yearly' }
];

// ============================================================================
// Step Components
// ============================================================================

const BasicInfoStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  onFieldChange, 
  onNext 
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="title" className="text-sm font-medium">
              {questTranslations?.fields?.title || 'Title'} *
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.title || 'Enter a clear, descriptive title for your quest.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (onNext) {
                  onNext();
                }
              }
            }}
            placeholder={questTranslations?.placeholders?.title || 'Enter quest title...'}
            className={errors.title ? 'border-red-500' : ''}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'error-title' : undefined}
            autoFocus
          />
          {errors.title && (
            <p id="error-title" className="text-xs text-red-600" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {questTranslations?.fields?.description || 'Description'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.description || 'Provide a detailed description of your quest.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                if (onNext) {
                  onNext();
                }
              }
            }}
            placeholder={questTranslations?.placeholders?.description || 'Enter quest description...'}
            rows={3}
            className={errors.description ? 'border-red-500' : ''}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'error-description' : undefined}
          />
          {errors.description && (
            <p id="error-description" className="text-xs text-red-600" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <QuestCategorySelector
              value={formData.category}
              onValueChange={(value) => onFieldChange('category', value)}
              error={errors.category}
              placeholder={questTranslations?.placeholders?.category || 'Select category...'}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                {questTranslations?.fields?.difficulty || 'Difficulty'} *
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {questTranslations?.tooltips?.difficulty || 'Select the difficulty level for your quest.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.difficulty} onValueChange={(value) => onFieldChange('difficulty', value)}>
              <SelectTrigger className={errors.difficulty ? 'border-red-500' : ''}>
                <SelectValue placeholder={questTranslations?.placeholders?.difficulty || 'Select difficulty...'} />
              </SelectTrigger>
              <SelectContent>
                {QUEST_DIFFICULTY_OPTIONS.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {questTranslations?.difficulty?.[difficulty] || difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.difficulty && (
              <p className="text-xs text-red-600" role="alert">
                {errors.difficulty}
              </p>
            )}
          </div>
        </div>
      </div>

      {onNext && (
        <div className="flex justify-end">
          <Button onClick={onNext} type="button">
            {questTranslations?.actions?.next || 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const AdvancedOptionsStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  onFieldChange, 
  onNext, 
  onPrevious,
  goals = [],
  tasks = [],
  onGoalsChange,
  onTasksChange
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  // Initialize selectedGoalIds with existing linked goals
  useEffect(() => {
    if (formData.linkedGoalIds && formData.linkedGoalIds.length > 0) {
      setSelectedGoalIds(formData.linkedGoalIds);
    }
  }, [formData.linkedGoalIds]);

  // Load tasks when goals are selected
  useEffect(() => {
    if (selectedGoalIds.length > 0) {
      const fetchTasks = async () => {
        try {
          const allTasks: TaskResponse[] = [];
          for (const goalId of selectedGoalIds) {
            const tasksData = await loadTasks(goalId);
            const activeTasks = (tasksData || []).filter(task => task.status === 'active');
            allTasks.push(...activeTasks);
          }
          onTasksChange?.(allTasks);
        } catch (error) {
          console.error('Failed to load tasks:', error);
        }
      };
      fetchTasks();
    } else {
      onTasksChange?.([]);
    }
  }, [selectedGoalIds, onTasksChange]);



  const handleGoalSelection = useCallback((goalId: string, checked: boolean) => {
    const currentLinkedGoals = formData.linkedGoalIds || [];
    let newLinkedGoals: string[];
    
    if (checked) {
      // Add goal to linked goals if not already present
      if (!currentLinkedGoals.includes(goalId)) {
        newLinkedGoals = [...currentLinkedGoals, goalId];
        onFieldChange('linkedGoalIds', newLinkedGoals);
        setSelectedGoalIds(newLinkedGoals);
      }
    } else {
      // Remove goal from linked goals
      newLinkedGoals = currentLinkedGoals.filter(id => id !== goalId);
      onFieldChange('linkedGoalIds', newLinkedGoals);
      setSelectedGoalIds(newLinkedGoals);
      
      // Remove tasks from this goal
      const tasksToRemove = tasks.filter(task => task.goalId === goalId).map(task => task.id);
      const currentLinkedTasks = formData.linkedTaskIds || [];
      const newLinkedTasks = currentLinkedTasks.filter(taskId => !tasksToRemove.includes(taskId));
      onFieldChange('linkedTaskIds', newLinkedTasks);
    }
  }, [formData.linkedGoalIds, formData.linkedTaskIds, onFieldChange, tasks]);

  const handleTaskSelection = useCallback((taskId: string, checked: boolean) => {
    const currentLinkedTasks = formData.linkedTaskIds || [];
    if (checked) {
      // Add task to linked tasks
      if (!currentLinkedTasks.includes(taskId)) {
        onFieldChange('linkedTaskIds', [...currentLinkedTasks, taskId]);
      }
    } else {
      // Remove task from linked tasks
      onFieldChange('linkedTaskIds', currentLinkedTasks.filter(id => id !== taskId));
    }
  }, [formData.linkedTaskIds, onFieldChange]);

  const handleSelectAllTasks = useCallback(() => {
    const allTaskIds = tasks.map(task => task.id);
    onFieldChange('linkedTaskIds', allTaskIds);
  }, [tasks, onFieldChange]);

  const handleRemoveLinkedGoal = useCallback((goalId: string) => {
    const currentLinkedGoals = formData.linkedGoalIds || [];
    const newLinkedGoals = currentLinkedGoals.filter(id => id !== goalId);
    onFieldChange('linkedGoalIds', newLinkedGoals);
    setSelectedGoalIds(newLinkedGoals);
    
    // Remove tasks from this goal
    const tasksToRemove = tasks.filter(task => task.goalId === goalId).map(task => task.id);
    const currentLinkedTasks = formData.linkedTaskIds || [];
    const newLinkedTasks = currentLinkedTasks.filter(taskId => !tasksToRemove.includes(taskId));
    onFieldChange('linkedTaskIds', newLinkedTasks);
  }, [formData.linkedGoalIds, formData.linkedTaskIds, onFieldChange, tasks]);

  const handleRemoveLinkedTask = useCallback((taskId: string) => {
    const currentLinkedTasks = formData.linkedTaskIds || [];
    onFieldChange('linkedTaskIds', currentLinkedTasks.filter(id => id !== taskId));
  }, [formData.linkedTaskIds, onFieldChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="privacy" className="text-sm font-medium">
                {questTranslations?.fields?.privacy || 'Privacy'} *
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {questTranslations?.tooltips?.privacy || 'Set the privacy level for your quest.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.privacy} onValueChange={(value) => onFieldChange('privacy', value)}>
              <SelectTrigger className={errors.privacy ? 'border-red-500' : ''}>
                <SelectValue placeholder={questTranslations?.placeholders?.privacy || 'Select privacy...'} />
              </SelectTrigger>
              <SelectContent>
                {QUEST_PRIVACY_OPTIONS.map((privacy) => (
                  <SelectItem key={privacy} value={privacy}>
                    {questTranslations?.privacy?.[privacy] || privacy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.privacy && (
              <p className="text-xs text-red-600" role="alert">
                {errors.privacy}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="kind" className="text-sm font-medium">
                {questTranslations?.fields?.kind || 'Quest Type'} *
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {questTranslations?.tooltips?.kind || 'Choose the quest type.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.kind} onValueChange={(value) => onFieldChange('kind', value)}>
              <SelectTrigger className={errors.kind ? 'border-red-500' : ''}>
                <SelectValue placeholder={questTranslations?.placeholders?.kind || 'Select quest type...'} />
              </SelectTrigger>
              <SelectContent>
                {QUEST_KIND_OPTIONS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {questTranslations?.kind?.[kind] || kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.kind && (
              <p className="text-xs text-red-600" role="alert">
                {errors.kind}
              </p>
            )}
          </div>
        </div>

        {/* Linked Items for Linked Quests */}
        {formData.kind === 'linked' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <h4 className="font-medium">{questTranslations?.sections?.linkedItems || 'Linked Items'}</h4>
            </div>
            
            {/* Goals Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  {questTranslations?.fields?.linkedGoals || 'Link Goals'}
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {questTranslations?.tooltips?.linkedGoals || 'Select active goals to link to this quest. Quest progress will be based on completion of these goals.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {goals.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No active goals available to link.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {goals.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`goal-${goal.id}`}
                          checked={formData.linkedGoalIds?.includes(goal.id) || false}
                          onChange={(e) => handleGoalSelection(goal.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`goal-${goal.id}`} className="text-sm">
                          {goal.title}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show linked goals */}
                  {formData.linkedGoalIds && formData.linkedGoalIds.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Linked Goals:</div>
                      <div className="text-xs text-gray-500">
                        Debug: formData.linkedGoalIds = {JSON.stringify(formData.linkedGoalIds)}, goals.length = {goals.length}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.linkedGoalIds.map((goalId) => {
                          const goal = goals.find(g => g.id === goalId);
                          console.log(`Looking for goal ${goalId}, found:`, goal);
                          return goal ? (
                            <Badge key={goalId} variant="secondary" className="flex items-center gap-1">
                              {goal.title}
                              <button
                                type="button"
                                onClick={() => handleRemoveLinkedGoal(goalId)}
                                className="ml-1 hover:text-red-500"
                                aria-label={`Remove ${goal.title} goal`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : (
                            <Badge key={goalId} variant="outline" className="flex items-center gap-1">
                              Goal {goalId} (not found)
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tasks Selection */}
            {(selectedGoalIds.length > 0 || (formData.linkedTaskIds && formData.linkedTaskIds.length > 0)) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    {questTranslations?.fields?.linkedTasks || 'Link Tasks'}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {questTranslations?.tooltips?.linkedTasks || 'Select specific tasks to link to this quest. Quest progress will be based on completion of these tasks.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {tasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No active tasks available for the selected goal.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Select tasks from selected goals:
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`task-${task.id}`}
                            checked={formData.linkedTaskIds?.includes(task.id) || false}
                            onChange={(e) => handleTaskSelection(task.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`task-${task.id}`} className="text-sm">
                            {task.title}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Show linked tasks */}
                    {formData.linkedTaskIds && formData.linkedTaskIds.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Linked Tasks:</div>
                        <div className="text-xs text-gray-500">
                          Debug: formData.linkedTaskIds = {JSON.stringify(formData.linkedTaskIds)}, tasks.length = {tasks.length}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.linkedTaskIds.map((taskId) => {
                            const task = tasks.find(t => t.id === taskId);
                            console.log(`Looking for task ${taskId}, found:`, task);
                            return task ? (
                              <Badge key={taskId} variant="secondary" className="flex items-center gap-1">
                                {task.title}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLinkedTask(taskId)}
                                  className="ml-1 hover:text-red-500"
                                  aria-label={`Remove ${task.title} task`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : (
                              <Badge key={taskId} variant="outline" className="flex items-center gap-1">
                                Task {taskId} (not found)
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="deadline" className="text-sm font-medium">
              {questTranslations?.fields?.deadline || 'Deadline'} *
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.deadline || 'Set a deadline for your quest.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline ? new Date(formData.deadline).toISOString().slice(0, 10) : ''}
            onChange={(e) => onFieldChange('deadline', e.target.value ? new Date(e.target.value).getTime() : undefined)}
            className={errors.deadline ? 'border-red-500' : ''}
            aria-invalid={!!errors.deadline}
            aria-describedby={errors.deadline ? 'error-deadline' : undefined}
          />
          {errors.deadline && (
            <p id="error-deadline" className="text-xs text-red-600" role="alert">
              {errors.deadline}
            </p>
          )}
        </div>

        {formData.kind === 'quantitative' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm">{questTranslations?.sections?.quantitativeSettings || 'Quantitative Settings'}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="targetCount" className="text-sm font-medium">
                    {questTranslations?.fields?.targetCount || 'Target Count'} *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {questTranslations?.tooltips?.targetCount || 'How many completed tasks or goals do you want to achieve?'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="targetCount"
                  type="number"
                  min="1"
                  value={formData.targetCount || ''}
                  onChange={(e) => onFieldChange('targetCount', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder={questTranslations?.placeholders?.targetCount || 'Enter target count...'}
                  className={errors.targetCount ? 'border-red-500' : ''}
                  aria-invalid={!!errors.targetCount}
                  aria-describedby={errors.targetCount ? 'error-targetCount' : undefined}
                />
                {errors.targetCount && (
                  <p id="error-targetCount" className="text-xs text-red-600" role="alert">
                    {errors.targetCount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="countScope" className="text-sm font-medium">
                    {questTranslations?.fields?.countScope || 'Count Scope'} *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {questTranslations?.tooltips?.countScope || 'Choose what to count for this quest.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.countScope || ''} onValueChange={(value) => onFieldChange('countScope', value)}>
                  <SelectTrigger className={errors.countScope ? 'border-red-500' : ''}>
                    <SelectValue placeholder={questTranslations?.placeholders?.countScope || 'Select count scope...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {QUEST_COUNT_SCOPE_OPTIONS.map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        {questTranslations?.countScope?.[scope] || scope}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.countScope && (
                  <p className="text-xs text-red-600" role="alert">
                    {errors.countScope}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="periodDays" className="text-sm font-medium">
                  {questTranslations?.fields?.period || 'Period'} *
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {questTranslations?.tooltips?.period || 'How often should this quest be checked for progress?'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={formData.periodDays?.toString() || ''} onValueChange={(value) => onFieldChange('periodDays', parseInt(value))}>
                <SelectTrigger className={errors.periodDays ? 'border-red-500' : ''}>
                  <SelectValue placeholder={questTranslations?.placeholders?.period || 'Select period...'} />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.periodDays && (
                <p className="text-xs text-red-600" role="alert">
                  {errors.periodDays}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious} type="button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {questTranslations?.actions?.previous || 'Previous'}
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} type="button">
            {questTranslations?.actions?.next || 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const ReviewStep: React.FC<StepProps> = ({ 
  formData, 
  onPrevious, 
  isSubmitting,
  onSubmit,
  quest,
  goals = [],
  tasks = []
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;

  // Calculate reward XP based on current difficulty selection
  const calculateRewardXp = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 50;
      case 'medium': return 100;
      case 'hard': return 200;
      case 'very_hard': return 400;
      case 'legendary': return 800;
      default: return 100;
    }
  };

  const displayRewardXp = calculateRewardXp(formData.difficulty);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{questTranslations?.steps?.review || 'Review & Submit'}</h3>
        <p className="text-sm text-muted-foreground">
          {questTranslations?.steps?.reviewDescription || 'Review your quest details before updating.'}
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {formData.title}
            </CardTitle>
            <CardDescription>
              {formData.description || questTranslations?.placeholders?.noDescription || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{questTranslations?.fields?.category || 'Category'}:</span>
                <span className="ml-2">{questTranslations?.category?.[formData.category] || formData.category}</span>
              </div>
              <div>
                <span className="font-medium">{questTranslations?.fields?.difficulty || 'Difficulty'}:</span>
                <span className="ml-2">{questTranslations?.difficulty?.[formData.difficulty] || formData.difficulty}</span>
              </div>
              <div>
                <span className="font-medium">{questTranslations?.fields?.rewardXp || 'Reward XP'}:</span>
                <span className="ml-2 font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  {displayRewardXp} XP
                </span>
              </div>
              <div>
                <span className="font-medium">{questTranslations?.fields?.privacy || 'Privacy'}:</span>
                <span className="ml-2">{questTranslations?.privacy?.[formData.privacy] || formData.privacy}</span>
              </div>
            </div>

            {formData.tags && formData.tags.length > 0 && (
              <div>
                <span className="font-medium text-sm">{questTranslations?.fields?.tags || 'Tags'}:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{questTranslations?.fields?.deadline || 'Deadline'}:</span>
                <span>{new Date(formData.deadline).toLocaleDateString()}</span>
              </div>
            )}

            {formData.kind === 'quantitative' && formData.targetCount && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4" />
                <span className="font-medium">{questTranslations?.fields?.targetCount || 'Target Count'}:</span>
                <span>{formData.targetCount}</span>
              </div>
            )}

            {formData.kind === 'linked' && formData.linkedGoalIds && formData.linkedGoalIds.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-medium">{questTranslations?.sections?.linkedItems || 'Linked Items'}:</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">{questTranslations?.fields?.linkedGoals || 'Selected Goals'}:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.linkedGoalIds.map((goalId) => {
                        const goal = goals.find(g => g.id === goalId);
                        return (
                          <Badge key={goalId} variant="secondary">
                            {goal ? goal.title : `Goal ${goalId}`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  {formData.linkedTaskIds && formData.linkedTaskIds.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">{questTranslations?.fields?.linkedTasks || 'Selected Tasks'}:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.linkedTaskIds.map((taskId) => {
                          const task = tasks.find(t => t.id === taskId);
                          return (
                            <Badge key={taskId} variant="secondary">
                              {task ? task.title : `Task ${taskId}`}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious} type="button" disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {questTranslations?.actions?.previous || 'Previous'}
          </Button>
        )}
        {onSubmit && (
          <Button onClick={onSubmit} type="button" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {questTranslations?.actions?.updating || 'Updating Quest...'}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {questTranslations?.actions?.updateQuest || 'Update Quest'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const QuestEditForm: React.FC<QuestEditFormProps> = ({
  questId,
  onSuccess,
  onCancel,
  className
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;
  const { quest, loading: questLoading, error: questError } = useQuest(questId);
  const { edit, loading: editLoading, error: editError } = useQuestEdit();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestEditFormData>({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    privacy: 'public',
    kind: 'linked',
    tags: [],
    linkedGoalIds: [],
    linkedTaskIds: [],
    dependsOnQuestIds: [],
    countScope: 'completed_tasks',
    periodDays: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  
  // ARIA Live Region for announcements
  const [liveMessage, setLiveMessage] = useState('');
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  // Focus management
  const containerRef = useRef<HTMLDivElement>(null);

  // Load quest data when quest is loaded
  useEffect(() => {
    if (quest) {
      setFormData({
        title: quest.title,
        description: quest.description || '',
        category: quest.category,
        difficulty: quest.difficulty,
        privacy: quest.privacy,
        kind: quest.kind,
        tags: quest.tags || [],
        deadline: quest.deadline,
        targetCount: quest.targetCount,
        countScope: quest.countScope || 'completed_tasks',
        periodDays: quest.periodDays || 1,
        linkedGoalIds: quest.linkedGoalIds || [],
        linkedTaskIds: quest.linkedTaskIds || [],
        dependsOnQuestIds: quest.dependsOnQuestIds || [],
      });
    }
  }, [quest]);

  // Load all goals and linked tasks when quest is loaded
  useEffect(() => {
    if (quest) {
      const loadQuestData = async () => {
        try {
          // Load all goals (not just linked ones) for the selection interface
          const goalsData = await loadGoals();
          console.log('Loaded all goals for quest edit:', goalsData);
          const activeGoals = (goalsData || []).filter(goal => goal.status === 'active');
          setGoals(activeGoals);

          // Load tasks for linked goals only
          if (quest.linkedGoalIds && quest.linkedGoalIds.length > 0) {
            const allTasks: TaskResponse[] = [];
            for (const goalId of quest.linkedGoalIds) {
              const tasksData = await loadTasks(goalId);
              console.log(`Loaded tasks for goal ${goalId}:`, tasksData);
              const activeTasks = (tasksData || []).filter(task => task.status === 'active');
              allTasks.push(...activeTasks);
            }
            console.log('All loaded tasks:', allTasks);
            setTasks(allTasks);
          }
        } catch (error) {
          console.error('Failed to load quest data:', error);
        }
      };
      loadQuestData();
    }
  }, [quest]);

  const steps = [
    { id: 'basic', title: questTranslations?.steps?.basicInfo || 'Basic Info', component: BasicInfoStep },
    { id: 'advanced', title: questTranslations?.steps?.advancedOptions || 'Advanced', component: AdvancedOptionsStep },
    { id: 'review', title: questTranslations?.steps?.review || 'Review', component: ReviewStep }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      
      // Announce error clearing to screen readers
      setLiveMessage(`${questTranslations?.fields?.[field] || field} error cleared`);
    }
  }, [errors, questTranslations]);

  const handleGoalsChange = useCallback((newGoals: GoalResponse[]) => {
    setGoals(newGoals);
  }, []);

  const handleTasksChange = useCallback((newTasks: TaskResponse[]) => {
    setTasks(newTasks);
  }, []);

  const handleNext = useCallback(() => {
    // Clear previous errors
    setErrors({});
    
    if (currentStep === 0) {
      // Basic info step validation
      const newErrors: Record<string, string> = {};
      
      if (!formData.title.trim()) {
        newErrors.title = questTranslations?.validation?.titleRequired || 'Title is required';
      }
      if (!formData.category) {
        newErrors.category = questTranslations?.validation?.categoryRequired || 'Category is required';
      }
      if (!formData.difficulty) {
        newErrors.difficulty = questTranslations?.validation?.difficultyRequired || 'Difficulty is required';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // Announce validation errors to screen readers
        setLiveMessage(`Validation errors found. Please check the form.`);
        return; // Don't proceed if there are validation errors
      }
    } else if (currentStep === 1) {
      // Advanced options step validation
      const newErrors: Record<string, string> = {};
      
      // Validate privacy
      if (!formData.privacy) {
        newErrors.privacy = questTranslations?.validation?.privacyRequired || 'Privacy is required';
      }
      
      // Validate kind
      if (!formData.kind) {
        newErrors.kind = questTranslations?.validation?.kindRequired || 'Quest type is required';
      }
      
      // Validate deadline (required field)
      if (!formData.deadline) {
        newErrors.deadline = questTranslations?.validation?.deadlineRequired || 'Deadline is required';
      } else {
        // Check if deadline is in the past (more than 1 hour ago to account for timezone issues)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (formData.deadline < oneHourAgo) {
          newErrors.deadline = questTranslations?.validation?.deadlineFuture || 'Deadline must be in the future';
        }
      }
      
      // Validate quantitative quest fields
      if (formData.kind === 'quantitative') {
        if (!formData.targetCount || formData.targetCount <= 0) {
          newErrors.targetCount = questTranslations?.validation?.targetCountRequired || 'Target count is required for quantitative quests';
        }
        if (!formData.countScope) {
          newErrors.countScope = questTranslations?.validation?.countScopeRequired || 'Count scope is required for quantitative quests';
        }
        if (!formData.periodDays || formData.periodDays <= 0) {
          newErrors.periodDays = questTranslations?.validation?.periodRequired || 'Period is required for quantitative quests';
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // Announce validation errors to screen readers
        setLiveMessage(`Validation errors found. Please check the form.`);
        return; // Don't proceed if there are validation errors
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Announce step change to screen readers
      const stepName = steps[currentStep + 1]?.title || `Step ${currentStep + 2}`;
      setLiveMessage(`Navigated to ${stepName}`);
    }
  }, [currentStep, formData, questTranslations, steps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // Announce step change to screen readers
      const stepName = steps[currentStep - 1]?.title || `Step ${currentStep}`;
      setLiveMessage(`Navigated to ${stepName}`);
    }
  }, [currentStep, steps]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Calculate reward XP based on difficulty
      const calculateRewardXp = (difficulty: string) => {
        switch (difficulty) {
          case 'easy': return 50;
          case 'medium': return 100;
          case 'hard': return 200;
          case 'very_hard': return 400;
          case 'legendary': return 800;
          default: return 100;
        }
      };

      // Build quest data, only including fields that have values
      const questData: QuestUpdateInput = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        privacy: formData.privacy,
        kind: formData.kind,
        tags: formData.tags,
        deadline: formData.deadline,
        rewardXp: calculateRewardXp(formData.difficulty), // Add calculated reward XP
      };

      // Add quantitative quest fields if applicable
      if (formData.kind === 'quantitative') {
        questData.targetCount = formData.targetCount;
        questData.countScope = formData.countScope;
        questData.periodDays = formData.periodDays;
      }

      // Only include linked arrays if they have values
      if (formData.linkedGoalIds && formData.linkedGoalIds.length > 0) {
        questData.linkedGoalIds = formData.linkedGoalIds;
      }
      if (formData.linkedTaskIds && formData.linkedTaskIds.length > 0) {
        questData.linkedTaskIds = formData.linkedTaskIds;
      }
      if (formData.dependsOnQuestIds && formData.dependsOnQuestIds.length > 0) {
        questData.dependsOnQuestIds = formData.dependsOnQuestIds;
      }

      const result = await edit(questId, questData);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Failed to update quest:', err);
    }
  }, [formData, questId, edit, onSuccess]);

  // Handle conditional rendering after all hooks have been called
  if (questLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">
            {questTranslations?.loading?.loadingQuest || 'Loading quest...'}
          </span>
        </div>
      </div>
    );
  }

  // Show error state if quest failed to load
  if (questError) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {questError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error state if quest is not found
  if (!quest) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quest Not Found</AlertTitle>
          <AlertDescription>
            {questTranslations?.messages?.notFound || 'The requested quest could not be found.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className} ref={containerRef}>
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
      
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{questTranslations?.steps?.step || 'Step'} {currentStep + 1} {questTranslations?.steps?.of || 'of'} {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            aria-label={`Quest edit progress: ${Math.round(progress)}% complete`}
          />
        </div>

        {/* Error Display */}
        {editError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {editError}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Step */}
        <CurrentStepComponent
          formData={formData}
          errors={errors}
          onFieldChange={handleFieldChange}
          onNext={currentStep < steps.length - 1 ? handleNext : undefined}
          onPrevious={currentStep > 0 ? handlePrevious : undefined}
          onSubmit={currentStep === steps.length - 1 ? handleSubmit : undefined}
          isSubmitting={editLoading}
          quest={quest}
          goals={goals}
          tasks={tasks}
          onGoalsChange={handleGoalsChange}
          onTasksChange={handleTasksChange}
        />
      </div>
    </div>
  );
};

export default QuestEditForm;
