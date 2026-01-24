/**
 * AdvancedOptionsStep Component
 * 
 * Second step of the quest creation wizard - handles advanced quest settings
 * including privacy, quest type, tags, deadline, and type-specific configurations.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  QUEST_PRIVACY_OPTIONS,
  QUEST_KIND_OPTIONS,
  QUEST_COUNT_SCOPE_OPTIONS,
  type QuestPrivacy,
  type QuestKind,
  type QuestCountScope,
  type QuestCreateFormData
} from '@/models/quest';
import { type GoalResponse } from '@/lib/apiGoal';
import { type TaskResponse } from '@/lib/apiTask';

type FieldValue = string | number | string[] | QuestPrivacy | QuestKind | QuestCountScope;
import { 
  Info, 
  X, 
  Plus, 
  Calendar,
  Target,
  Clock,
  Tag,
  ShieldCheck,
  Check
} from 'lucide-react';

interface AdvancedOptionsStepProps {
  formData: QuestCreateFormData;
  onFieldChange: (field: string, value: FieldValue) => void;
  onGoalsChange: (goalIds: string[]) => void;
  onTasksChange: (taskIds: string[]) => void;
  goals?: GoalResponse[];
  tasks?: TaskResponse[];
  errors: Record<string, string>;
}

const AdvancedOptionsStep: React.FC<AdvancedOptionsStepProps> = ({
  formData,
  onFieldChange,
  onGoalsChange,
  onTasksChange,
  goals = [],
  tasks = [],
  errors
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;
  
  const [newTag, setNewTag] = useState('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      const updatedTags = [...(formData.tags || []), newTag.trim()];
      onFieldChange('tags', updatedTags);
      setNewTag('');
    }
  }, [newTag, formData.tags, onFieldChange]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const updatedTags = formData.tags?.filter(tag => tag !== tagToRemove) || [];
    onFieldChange('tags', updatedTags);
  }, [formData.tags, onFieldChange]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  // Initialize selectedGoalIds with existing linked goals
  useEffect(() => {
    if (formData.linkedGoalIds && formData.linkedGoalIds.length > 0) {
      setSelectedGoalIds(formData.linkedGoalIds);
    }
  }, [formData.linkedGoalIds]);

  const handleGoalSelection = useCallback((goalId: string, checked: boolean) => {
    const currentLinkedGoals = formData.linkedGoalIds || [];
    let newLinkedGoals: string[];
    
    if (checked) {
      // Add goal to linked goals if not already present
      if (!currentLinkedGoals.includes(goalId)) {
        newLinkedGoals = [...currentLinkedGoals, goalId];
        onFieldChange('linkedGoalIds', newLinkedGoals);
        onGoalsChange(newLinkedGoals); // This will trigger loadTasksForGoals
        setSelectedGoalIds(newLinkedGoals);
      }
    } else {
      // Remove goal from linked goals
      newLinkedGoals = currentLinkedGoals.filter(id => id !== goalId);
      onFieldChange('linkedGoalIds', newLinkedGoals);
      onGoalsChange(newLinkedGoals); // This will trigger loadTasksForGoals
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
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {questTranslations?.steps?.advancedOptions || 'Advanced Options'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {questTranslations?.steps?.advancedOptionsDescription || 'Configure additional quest settings.'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Privacy and Quest Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Privacy */}
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
                    {questTranslations?.tooltips?.privacy || 'Choose who can see this quest. Public quests are visible to everyone, followers only to your followers, and private only to you.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.privacy || ''}
              onValueChange={(value) => onFieldChange('privacy', value as QuestPrivacy)}
            >
              <SelectTrigger 
                id="privacy"
                className={errors.privacy ? 'border-red-500' : ''}
                aria-label="Select privacy level"
              >
                <SelectValue placeholder={questTranslations?.placeholders?.privacy || 'Select privacy...'} />
              </SelectTrigger>
              <SelectContent>
                {QUEST_PRIVACY_OPTIONS.map((privacy) => (
                  <SelectItem key={privacy.value} value={privacy.value}>
                    {privacy.label}
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

          {/* Quest Type */}
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
                    {questTranslations?.tooltips?.kind || 'Choose the quest type. Linked quests are tied to specific goals and tasks, while quantitative quests track completion counts.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.kind || ''}
              onValueChange={(value) => {
                const newKind = value as QuestKind;
                onFieldChange('kind', newKind);
                
                // Clear linked quest data when switching to quantitative
                if (newKind === 'quantitative') {
                  onFieldChange('linkedGoalIds', []);
                  onFieldChange('linkedTaskIds', []);
                }
              }}
            >
              <SelectTrigger 
                id="kind"
                className={errors.kind ? 'border-red-500' : ''}
                aria-label="Select quest type"
              >
                <SelectValue placeholder={questTranslations?.placeholders?.kind || 'Select quest type...'} />
              </SelectTrigger>
              <SelectContent>
                {QUEST_KIND_OPTIONS.map((kind) => (
                  <SelectItem key={kind.value} value={kind.value}>
                    {kind.label}
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

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              {questTranslations?.fields?.tags || 'Tags'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.tags || 'Add tags to help categorize and find your quest. Tags make it easier to organize and search through your quests.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={questTranslations?.placeholders?.tags || 'Add a tag...'}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags?.includes(newTag.trim())}
                aria-label="Add tag"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="deadline" className="text-sm font-medium">
              {questTranslations?.fields?.deadline || 'Deadline'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.deadline || 'Set an optional deadline for your quest. This helps create urgency and track progress.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline ? new Date(formData.deadline).toISOString().slice(0, 16) : ''}
              onChange={(e) => onFieldChange('deadline', e.target.value ? new Date(e.target.value).getTime() : undefined)}
              className={errors.deadline ? 'border-red-500' : ''}
              aria-invalid={!!errors.deadline}
              aria-describedby={errors.deadline ? 'deadline-error' : undefined}
            />
          </div>
          {errors.deadline && (
            <p id="deadline-error" className="text-xs text-red-600" role="alert">
              {errors.deadline}
            </p>
          )}
        </div>

        {/* Quantitative Quest Settings */}
        {formData.kind === 'quantitative' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {questTranslations?.sections?.quantitative || 'Quantitative Settings'}
              </CardTitle>
              <CardDescription>
                {questTranslations?.sections?.quantitativeDescription || 'Configure settings for your quantitative quest.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Count */}
                <div className="space-y-2">
                  <Label htmlFor="targetCount" className="text-sm font-medium">
                    {questTranslations?.fields?.targetCount || 'Target Count'} *
                  </Label>
                  <Input
                    id="targetCount"
                    type="number"
                    min="1"
                    value={formData.targetCount || ''}
                    onChange={(e) => onFieldChange('targetCount', parseInt(e.target.value) || 0)}
                    placeholder={questTranslations?.placeholders?.targetCount || 'Enter target count...'}
                    className={errors.targetCount ? 'border-red-500' : ''}
                    aria-invalid={!!errors.targetCount}
                    aria-describedby={errors.targetCount ? 'targetCount-error' : undefined}
                  />
                  {errors.targetCount && (
                    <p id="targetCount-error" className="text-xs text-red-600" role="alert">
                      {errors.targetCount}
                    </p>
                  )}
                </div>

                {/* Count Scope */}
                <div className="space-y-2">
                  <Label htmlFor="countScope" className="text-sm font-medium">
                    {questTranslations?.fields?.countScope || 'Count Scope'}
                  </Label>
                  <Select
                    value={formData.countScope || ''}
                    onValueChange={(value) => onFieldChange('countScope', value as QuestCountScope)}
                  >
                    <SelectTrigger 
                      id="countScope"
                      className={errors.countScope ? 'border-red-500' : ''}
                      aria-label="Select count scope"
                    >
                      <SelectValue placeholder={questTranslations?.placeholders?.countScope || 'Select count scope...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {QUEST_COUNT_SCOPE_OPTIONS.map((scope) => (
                        <SelectItem key={scope.value} value={scope.value}>
                          {scope.label}
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

              {/* Period Days */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="periodDays" className="text-sm font-medium">
                    {questTranslations?.fields?.period || 'Quest Period'} *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {questTranslations?.tooltips?.period || 'Set how many days you have to complete this quest.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="periodDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.periodDays || ''}
                    onChange={(e) => onFieldChange('periodDays', parseInt(e.target.value) || 1)}
                    placeholder={questTranslations?.placeholders?.periodDays || 'Enter number of days...'}
                    className={errors.periodDays ? 'border-red-500' : ''}
                    aria-invalid={!!errors.periodDays}
                    aria-describedby={errors.periodDays ? 'periodDays-error' : undefined}
                  />
                  <span className="text-sm text-muted-foreground">
                    {questTranslations?.fields?.days || 'days'}
                  </span>
                </div>
                {errors.periodDays && (
                  <p id="periodDays-error" className="text-xs text-red-600" role="alert">
                    {errors.periodDays}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Linked Goals and Tasks - Only show for linked quests */}
        {formData.kind === 'linked' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                {questTranslations?.fields?.linkedItems || 'Linked Goals & Tasks'}
              </CardTitle>
              <CardDescription>
                {questTranslations?.fields?.linkedItemsDescription || 'Select the goals and tasks that this quest will track.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Goals Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    {questTranslations?.fields?.goals || 'Goals'} *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {questTranslations?.tooltips?.goals || 'Select the goals that this quest will track. You can choose multiple goals.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {goals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {questTranslations?.messages?.noGoals || 'No goals available. Create some goals first.'}
                    </p>
                  ) : (
                    goals.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={formData.linkedGoalIds?.includes(goal.id) || false}
                          onCheckedChange={(checked) => handleGoalSelection(goal.id, checked as boolean)}
                        />
                        <Label htmlFor={`goal-${goal.id}`} className="text-sm cursor-pointer">
                          {goal.title}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {errors.linkedGoalIds && (
                  <p className="text-xs text-red-600" role="alert">
                    {errors.linkedGoalIds}
                  </p>
                )}
                
                {/* Show linked goals */}
                {formData.linkedGoalIds && formData.linkedGoalIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{questTranslations?.messages?.selectedGoals || 'Selected Goals:'}</div>
                    <div className="flex flex-wrap gap-2">
                      {formData.linkedGoalIds.map((goalId) => {
                        const goal = goals.find(g => g.id === goalId);
                        return goal ? (
                          <Badge key={goalId} variant="secondary" className="flex items-center gap-1">
                            {goal.title}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveLinkedGoal(goalId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks Selection */}
              {(selectedGoalIds.length > 0 || (formData.linkedTaskIds && formData.linkedTaskIds.length > 0)) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {questTranslations?.fields?.tasks || 'Tasks'} *
                    </Label>
                    {tasks.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllTasks}
                        className="text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {questTranslations?.actions?.selectAll || 'Select All'}
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {questTranslations?.messages?.noTasks || 'No tasks available for selected goals.'}
                      </p>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={formData.linkedTaskIds?.includes(task.id) || false}
                            onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                          />
                          <Label htmlFor={`task-${task.id}`} className="text-sm cursor-pointer">
                            {task.title}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  {errors.linkedTaskIds && (
                    <p className="text-xs text-red-600" role="alert">
                      {errors.linkedTaskIds}
                    </p>
                  )}
                  
                  {/* Show linked tasks */}
                  {formData.linkedTaskIds && formData.linkedTaskIds.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{questTranslations?.messages?.selectedTasks || 'Selected Tasks:'}</div>
                      <div className="flex flex-wrap gap-2">
                        {formData.linkedTaskIds.map((taskId) => {
                          const task = tasks.find(t => t.id === taskId);
                          return task ? (
                            <Badge key={taskId} variant="secondary" className="flex items-center gap-1">
                              {task.title}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveLinkedTask(taskId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvancedOptionsStep;
