/**
 * TasksListInline Component
 * 
 * Inline task display and editing component for goals.
 * Replaces modal-based task management with inline card-based layout.
 * Mobile-friendly with responsive grid layout.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Calendar,
  Tag as TagIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { type TaskResponse } from '@/lib/apiTask';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateTaskTitle, validateTaskDueDate, validateTaskStatus, validateTaskTag } from '@/lib/validation/taskValidation';

interface TasksListInlineProps {
  tasks: TaskResponse[];
  goalId: string;
  goalDeadline?: string | null;
  onUpdateTask: (task: TaskResponse) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateTask: (task: {
    title: string;
    dueAt: string;
    tags: string[];
    status: string;
  }) => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

const STATUS_OPTIONS = ['active', 'paused', 'completed', 'archived'];
const TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

const TasksListInline: React.FC<TasksListInlineProps> = ({
  tasks,
  goalId,
  goalDeadline,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  canEdit = true,
  canDelete = true,
  canCreate = true
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const goalsTranslations = (t as any)?.goals;
  const commonTranslations = (t as any)?.common;

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TaskResponse>>({});
  const [tagInput, setTagInput] = useState<string>('');

  // Creating state
  const [isCreating, setIsCreating] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    dueAt: '',
    tags: [] as string[],
    status: 'active'
  });
  const [createTagInput, setCreateTagInput] = useState('');

  // Error and loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatDate = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'No date';
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateForInput = (timestamp: number | null | undefined): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp * 1000);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const toEpochSeconds = (dateString: string): number => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000);
  };

  // Start editing a task
  const startEditing = (task: TaskResponse) => {
    if (!canEdit) return;
    setEditingTaskId(task.id);
    setEditData({
      title: task.title,
      dueAt: task.dueAt,
      status: task.status,
      tags: [...task.tags]
    });
    setTagInput('');
    setErrors({});
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditData({});
    setTagInput('');
    setErrors({});
  };

  // Save edited task
  const saveTask = async (taskId: string) => {
    const newErrors: Record<string, string> = {};

    if (!editData.title || !editData.title.trim()) {
      newErrors.title = goalsTranslations?.validation?.taskTitleRequired || 'Title is required';
    } else {
      const titleValidation = validateTaskTitle(editData.title);
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.error || 'Invalid title';
      }
    }

    if (editData.dueAt !== undefined && editData.dueAt !== null) {
      // Convert epoch seconds to date string for validation
      const dateString = formatDateForInput(editData.dueAt);
      if (dateString) {
        const dueDateValidation = validateTaskDueDate(dateString);
        if (!dueDateValidation.isValid) {
          newErrors.dueAt = dueDateValidation.error || 'Invalid due date';
        }
      }
    }

    if (editData.status && !validateTaskStatus(editData.status).isValid) {
      newErrors.status = 'Invalid status';
    }

    if (editData.tags && editData.tags.length === 0) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsRequired || 'At least one tag is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`update-${taskId}`]: true }));
    setErrors({});

    try {
      await onUpdateTask({
        id: taskId,
        goalId,
        title: editData.title!,
        dueAt: editData.dueAt!,
        status: editData.status || 'active',
        tags: editData.tags || [],
        createdAt: 0,
        updatedAt: 0
      });
      cancelEditing();
    } catch (error: any) {
      logger.error('Error updating task', { taskId, error });
      toast({
        title: commonTranslations?.error || 'Error',
        description: error?.message || 'Failed to update task',
        variant: 'destructive'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`update-${taskId}`]: false }));
    }
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    setLoadingStates(prev => ({ ...prev, [`delete-${taskId}`]: true }));
    try {
      await onDeleteTask(taskId);
      setDeleteConfirmId(null);
    } catch (error: any) {
      logger.error('Error deleting task', { taskId, error });
      toast({
        title: commonTranslations?.error || 'Error',
        description: error?.message || 'Failed to delete task',
        variant: 'destructive'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete-${taskId}`]: false }));
    }
  };

  // Create new task
  const handleCreate = async () => {
    const newErrors: Record<string, string> = {};

    if (!createData.title || !createData.title.trim()) {
      newErrors.title = goalsTranslations?.validation?.taskTitleRequired || 'Title is required';
    }

    if (!createData.dueAt) {
      newErrors.dueAt = goalsTranslations?.validation?.taskDueDateRequired || 'Due date is required';
    }

    if (createData.tags.length === 0) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsRequired || 'At least one tag is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoadingStates(prev => ({ ...prev, create: true }));
    setErrors({});

    try {
      await onCreateTask({
        title: createData.title,
        dueAt: createData.dueAt,
        tags: createData.tags,
        status: createData.status
      });
      setIsCreating(false);
      setCreateData({ title: '', dueAt: '', tags: [], status: 'active' });
      setCreateTagInput('');
    } catch (error: any) {
      logger.error('Error creating task', { error });
      toast({
        title: commonTranslations?.error || 'Error',
        description: error?.message || 'Failed to create task',
        variant: 'destructive'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }));
    }
  };

  // Add tag to edit data
  const addTagToEdit = () => {
    const newTag = tagInput.trim();
    if (!newTag || !TAG_REGEX.test(newTag)) return;
    if (editData.tags?.includes(newTag)) return;
    setEditData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag]
    }));
    setTagInput('');
  };

  // Remove tag from edit data
  const removeTagFromEdit = (index: number) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  };

  // Add tag to create data
  const addTagToCreate = () => {
    const newTag = createTagInput.trim();
    if (!newTag || !TAG_REGEX.test(newTag)) return;
    if (createData.tags.includes(newTag)) return;
    setCreateData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag]
    }));
    setCreateTagInput('');
  };

  // Remove tag from create data
  const removeTagFromCreate = (index: number) => {
    setCreateData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {goalsTranslations?.tasks?.title || 'Tasks'}
        </h3>
        {canCreate && !isCreating && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreating(true);
              setCreateData({
                title: '',
                dueAt: goalDeadline || '',
                tags: [],
                status: 'active'
              });
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {goalsTranslations?.tasks?.addTask || 'Add Task'}
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {isCreating && canCreate && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">
              {goalsTranslations?.tasks?.createTask || 'Create New Task'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">
                {goalsTranslations?.tasks?.fields?.title || 'Title'} *
              </Label>
              <Input
                id="create-title"
                value={createData.title}
                onChange={(e) => setCreateData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={goalsTranslations?.placeholders?.taskTitle || 'Task title...'}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-dueAt">
                  {goalsTranslations?.tasks?.fields?.dueDate || 'Due Date'} *
                </Label>
                <Input
                  id="create-dueAt"
                  type="date"
                  value={createData.dueAt}
                  onChange={(e) => setCreateData(prev => ({ ...prev, dueAt: e.target.value }))}
                  className={errors.dueAt ? 'border-destructive' : ''}
                />
                {errors.dueAt && (
                  <p className="text-xs text-destructive">{errors.dueAt}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-status">
                  {goalsTranslations?.tasks?.fields?.status || 'Status'} *
                </Label>
                <Select
                  value={createData.status}
                  onValueChange={(value) => setCreateData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="create-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {goalsTranslations?.statusLabels?.[opt] || opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-tags">
                {goalsTranslations?.tasks?.fields?.tags || 'Tags'} *
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {createData.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTagFromCreate(idx)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="create-tags"
                  value={createTagInput}
                  onChange={(e) => setCreateTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTagToCreate();
                    }
                  }}
                  placeholder={goalsTranslations?.placeholders?.taskTags || 'Add tag and press Enter'}
                  className={errors.tags ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTagToCreate}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.tags && (
                <p className="text-xs text-destructive">{errors.tags}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setCreateData({ title: '', dueAt: '', tags: [], status: 'active' });
                  setErrors({});
                }}
                disabled={loadingStates.create}
              >
                {commonTranslations?.cancel || 'Cancel'}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loadingStates.create}
              >
                {loadingStates.create ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {commonTranslations?.saving || 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {goalsTranslations?.tasks?.create || 'Create Task'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const isEditing = editingTaskId === task.id;
          const isLoading = loadingStates[`update-${task.id}`] || loadingStates[`delete-${task.id}`];

          return (
            <Card
              key={task.id}
              className={isEditing ? 'border-primary bg-primary/5' : ''}
            >
              <CardContent className="p-4 space-y-3">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-title-${task.id}`}>Title *</Label>
                      <Input
                        id={`edit-title-${task.id}`}
                        value={editData.title || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        className={errors.title ? 'border-destructive' : ''}
                        disabled={isLoading}
                      />
                      {errors.title && (
                        <p className="text-xs text-destructive">{errors.title}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-dueAt-${task.id}`}>Due Date</Label>
                        <Input
                          id={`edit-dueAt-${task.id}`}
                          type="date"
                          value={formatDateForInput(editData.dueAt)}
                          onChange={(e) => setEditData(prev => ({ ...prev, dueAt: toEpochSeconds(e.target.value) }))}
                          className={errors.dueAt ? 'border-destructive' : ''}
                          disabled={isLoading}
                        />
                        {errors.dueAt && (
                          <p className="text-xs text-destructive">{errors.dueAt}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-status-${task.id}`}>Status</Label>
                        <Select
                          value={editData.status || 'active'}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                          disabled={isLoading}
                        >
                          <SelectTrigger id={`edit-status-${task.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>
                                {goalsTranslations?.statusLabels?.[opt] || opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(editData.tags || []).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTagFromEdit(idx)}
                              className="ml-1 hover:text-destructive"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              addTagToEdit();
                            }
                          }}
                          placeholder="Add tag..."
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTagToEdit}
                          disabled={isLoading}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.tags && (
                        <p className="text-xs text-destructive">{errors.tags}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveTask(task.id)}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {loadingStates[`update-${task.id}`] ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm sm:text-base flex-1">{task.title}</h4>
                      {(canEdit || canDelete) && !isLoading && (
                        <div className="flex gap-1 ml-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(task)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(task.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(task.dueAt)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {goalsTranslations?.statusLabels?.[task.status] || task.status}
                        </Badge>
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {deleteConfirmId === task.id && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>Delete this task?</span>
                          <div className="flex gap-2 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(task.id)}
                              disabled={isLoading}
                            >
                              {loadingStates[`delete-${task.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tasks.length === 0 && !isCreating && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>{goalsTranslations?.tasks?.noTasks || 'No tasks yet. Create your first task to get started!'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TasksListInline;

