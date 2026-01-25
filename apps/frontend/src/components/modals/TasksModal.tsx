// Version: 2.0 - Added Phase 5 enhancements: accessibility, loading states, error recovery
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { X, Pencil, Trash, Check, XCircle, Loader2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { updateTask } from '@/lib/apiTask';
import { 
  validateTaskTitle, 
  validateTaskDueDate, 
  validateTaskTag, 
  validateTaskStatus,
  validateTaskCompletionNote,
  taskCreateSchema,
  taskUpdateSchema,
  type TaskCreateInput,
  type TaskUpdateInput
} from '@/lib/validation/taskValidation';
import useFocusManagement from '@/hooks/useFocusManagement';
import SkeletonFormField from '@/components/ui/SkeletonFormField';
import NetworkErrorRecovery, { useNetworkStatus } from '@/components/ui/NetworkErrorRecovery';
import ARIALiveRegion, { useARIALiveAnnouncements, FormAnnouncements } from '@/components/ui/ARIALiveRegion';
import { logger } from '@/lib/logger';

interface Task {
  id: string;
  title: string;
  dueAt: number; // epoch seconds
  status: string;
  tags: string[];
  completionNote?: string;
}

interface EditTaskData {
  id?: string;
  title?: string;
  dueAt?: string; // date string for input field
  status?: string;
  tags?: string[];
  completionNote?: string;
}

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onUpdateTask: (task: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onTasksChange?: () => void; // Callback to refresh tasks after changes
  onCreateTask?: () => void; // Callback to create new task
  // Access control props
  canEdit?: boolean; // Whether user can edit tasks
  canDelete?: boolean; // Whether user can delete tasks
  canCreate?: boolean; // Whether user can create tasks
}

const STATUS_OPTIONS = ['active', 'paused', 'completed', 'archived'];
const TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

const TasksModal: React.FC<TasksModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  onTasksChange, 
  onCreateTask,
  canEdit = true,
  canDelete = true,
  canCreate = true
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Safe translation access
  const goalsTranslations = (t as any)?.goals;
  const commonTranslations = (t as any)?.common;

  // Debug logging
  logger.debug('TasksModal received tasks', { taskCount: tasks?.length });

  // Pagination state
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<keyof Task>('dueAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Editing state: map taskId to editable task data or null if not editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditTaskData>({});
  const [tagInput, setTagInput] = useState<string>('');

  // Error state for inline validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading states for async operations
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Enhanced state for Phase 5 features
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [editingRowRef, setEditingRowRef] = useState<HTMLTableRowElement | null>(null);

  // Reset validation state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setHasValidationErrors(false);
      setErrors({});
      setEditingTaskId(null);
    }
  }, [isOpen]);

  // Network status and error recovery
  const { isOnline, hasError, errorMessage, setError: setNetworkError, clearError } = useNetworkStatus();

  // ARIA live announcements
  const { announce, clearAll } = useARIALiveAnnouncements();

  // Focus management for editing rows
  const {
    containerRef,
    focusFirstError,
    focusFirst,
    handleKeyDown
  } = useFocusManagement({
    focusOnError: true,
    restoreFocus: true
  });

  // Reset pagination and sorting when tasks change
  useEffect(() => {
    setCurrentPage(1);
    setSortColumn('dueAt');
    setSortDirection('asc');
    setEditingTaskId(null);
    setEditData({});
    setTagInput('');
    setErrors({});
    setLoadingStates({});
    setIsLoading(false);
    setHasValidationErrors(false);
    setEditingRowRef(null);
    clearError();
    clearAll();
  }, [tasks, clearError, clearAll]); // Now safe to include stable dependencies

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      // Special handling for tags array (sort by joined string)
      if (sortColumn === 'tags') {
        aVal = a.tags.join(', ');
        bVal = b.tags.join(', ');
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [tasks, sortColumn, sortDirection]);

  // Paginate tasks
  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / ITEMS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTasks, currentPage]);

  // Handle sorting column click
  const onSort = (column: keyof Task) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Start editing a task
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    // Ensure the date string is derived in UTC to avoid off-by-one issues
    const d = new Date(task.dueAt * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const dateOnly = `${yyyy}-${mm}-${dd}`;
    setEditData({ ...task, dueAt: dateOnly, completionNote: task.completionNote || '' }); // date string YYYY-MM-DD
    setTagInput('');
    setErrors({});
    setHasValidationErrors(false);
    clearError();
    
    // Announce editing start
    announce(FormAnnouncements.fieldSaved('task editing'), 'polite');
    
    // Focus first field after a short delay to allow DOM update
    setTimeout(() => {
      const firstInput = document.querySelector(`input[data-task-id="${task.id}"]`) as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditData({});
    setTagInput('');
    setErrors({});
    setHasValidationErrors(false);
    clearError();
    
    // Announce editing cancellation
    announce(FormAnnouncements.fieldSaved('task editing cancelled'), 'polite');
  };

  // Validate edited data using Zod schemas
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Clear previous validation errors
    setHasValidationErrors(false);
    clearError();
    
    // Validate title
    if (editData.title !== undefined) {
      const titleValidation = validateTaskTitle(editData.title);
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.error || 'Invalid title';
      }
    }
    
    // Validate due date
    if (editData.dueAt !== undefined) {
      const dueDateValidation = validateTaskDueDate(editData.dueAt);
      if (!dueDateValidation.isValid) {
        newErrors.dueAt = dueDateValidation.error || 'Invalid due date';
      }
    }
    
    // Validate status
    if (editData.status !== undefined) {
      const statusValidation = validateTaskStatus(editData.status);
      if (!statusValidation.isValid) {
        newErrors.status = statusValidation.error || 'Invalid status';
      }
    }
    
    // Validate tags
    if (editData.tags !== undefined) {
      if (!Array.isArray(editData.tags) || editData.tags.length === 0) {
        newErrors.tags = goalsTranslations?.validation?.taskTagsRequired || 'At least one tag is required';
      } else {
        // Validate each tag
        for (let i = 0; i < editData.tags.length; i++) {
          const tagValidation = validateTaskTag(editData.tags[i]);
          if (!tagValidation.isValid) {
            newErrors.tags = tagValidation.error || 'Invalid tag format';
            break;
          }
        }
      }
    }

    // Validate completion note when completing task
    if (editData.status === 'completed') {
      const completionNoteValue = (editData.completionNote || '').trim();
      const completionValidation = validateTaskCompletionNote(completionNoteValue);
      if (!completionValidation.isValid) {
        newErrors.completionNote =
          goalsTranslations?.validation?.taskCompletionNoteRequired ||
          completionValidation.error ||
          'Completion note is required';
      }
    }
    
    setErrors(newErrors);
    
    // Set validation error state and announce errors
    if (Object.keys(newErrors).length > 0) {
      setHasValidationErrors(true);
      announce(FormAnnouncements.validationError('task editing'), 'assertive');
      
      // Focus first error field
      setTimeout(() => {
        const firstErrorField = document.querySelector(
          `[data-task-id="${editingTaskId}"] input[aria-invalid="true"], ` +
          `[data-task-id="${editingTaskId}"] select[aria-invalid="true"], ` +
          `[data-task-id="${editingTaskId}"] textarea[aria-invalid="true"]`
        ) as HTMLElement;
        if (firstErrorField) {
          firstErrorField.focus();
        }
      }, 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes in edit mode
  const onChangeField = (field: keyof Task, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      if (field === 'status' && value !== 'completed') {
        delete copy.completionNote;
      }
      return copy;
    });
    
    // Clear validation error state if field is being corrected
    if (errors[field]) {
      setHasValidationErrors(Object.keys(errors).length > 1);
    }
    
    // Announce field change
    announce(FormAnnouncements.fieldSaved(field as string), 'polite', 1000);
  };

  // Add tag from input
  const addTag = () => {
    const newTag = tagInput.trim();
    if (!newTag) return;
    
    // Validate tag using Zod schema
    const tagValidation = validateTaskTag(newTag);
    if (!tagValidation.isValid) {
      setErrors(prev => ({ ...prev, tags: tagValidation.error || 'Invalid tag format' }));
      announce(FormAnnouncements.validationError('tag'), 'assertive');
      return;
    }
    
    if ((editData.tags || []).includes(newTag)) {
      setErrors(prev => ({ ...prev, tags: goalsTranslations?.validation?.taskTagsDuplicate || 'Duplicate tags are not allowed' }));
      announce(FormAnnouncements.validationError('duplicate tag'), 'assertive');
      return;
    }
    
    const newTags = [...(editData.tags || []), newTag];
    onChangeField('tags', newTags);
    setTagInput('');
    setErrors(prev => {
      const { tags, ...rest } = prev;
      return rest;
    });
    
    // Announce successful tag addition
    announce(FormAnnouncements.fieldSaved('tag'), 'polite', 2000);
  };

  // Handle Enter key in tag input
  const onTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove tag by index
  const removeTag = (index: number) => {
    const newTags = (editData.tags || []).filter((_, i) => i !== index);
    onChangeField('tags', newTags);
    setErrors(prev => {
      const { tags, ...rest } = prev;
      return rest;
    });
  };

  // Save edited task
  const onSave = async () => {
    if (!validate() || !editingTaskId) return;
    
    setLoadingStates(prev => ({ ...prev, [`update-${editingTaskId}`]: true }));
    setIsLoading(true);
    
    // Announce loading state
    announce(FormAnnouncements.loading('Task update'), 'polite');
    
    try {
      // Convert date-only string to epoch seconds in UTC
      let dueAtEpoch: number | undefined = undefined;
      if (editData.dueAt !== undefined) {
        const input = String(editData.dueAt);
        const match = input.match(/^\d{4}-\d{2}-\d{2}$/);
        if (match) {
          const [y, m, d] = input.split('-').map(Number);
          dueAtEpoch = Math.floor(Date.UTC(y, m - 1, d, 0, 0, 0, 0) / 1000);
        } else {
          dueAtEpoch = Math.floor(new Date(input).getTime() / 1000);
        }
      }
      
      // Prepare update payload with only changed fields
      const updatePayload: Partial<{
        title: string;
        dueAt: number;
        status: string;
        tags: string[];
        completionNote: string;
      }> = {};

      if (editData.title !== undefined) updatePayload.title = (editData.title as string).trim();
      if (editData.dueAt !== undefined && typeof dueAtEpoch === 'number') updatePayload.dueAt = dueAtEpoch;
      if (editData.status !== undefined) updatePayload.status = editData.status as string;
      if (editData.tags !== undefined) updatePayload.tags = editData.tags as string[];
      if (editData.completionNote !== undefined) updatePayload.completionNote = (editData.completionNote as string).trim();

      // Call the API directly
      const updatedTask = await updateTask(editingTaskId, updatePayload);
      // Merge the updated fields with the original task for the callback
      const originalTask = tasks.find(t => t.id === editingTaskId);
      const mergedTask = {
        ...originalTask,
        ...updatePayload,
        id: editingTaskId,
      };
      await onUpdateTask(mergedTask);
      
      // Clear any network errors
      clearError();
      
      // Announce success
      announce(FormAnnouncements.formSubmitted(), 'polite');
      
      // Refresh tasks if callback provided
      if (onTasksChange) {
        onTasksChange();
      }
      
      setEditingTaskId(null);
      setEditData({});
      setErrors({});
      setHasValidationErrors(false);
      
      toast({
        title: goalsTranslations?.messages?.taskUpdated || "Task Updated",
        description: goalsTranslations?.messages?.taskUpdated || "Task has been successfully updated.",
        variant: "default",
      });
    } catch (error: any) {
      logger.error('Error updating task', { taskId: editingTaskId, error });
      
      // Set network error if it's a network issue
      if (!navigator.onLine || error.name === 'NetworkError' || error.message.includes('fetch')) {
        setNetworkError('Network error occurred. Please check your connection and try again.');
        announce(FormAnnouncements.networkError(), 'assertive');
      }
      
      // Parse API error response for field-specific errors
      let errorMessage = error?.message || 'Failed to update task';
      let fieldErrors: { [key: string]: string } = {};
      
      try {
        // Try to parse error response if it's a string
        if (typeof error?.message === 'string') {
          const parsedError = JSON.parse(error.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
          if (parsedError.field_errors) {
            fieldErrors = parsedError.field_errors;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        logger.warn('Could not parse update task error response', { parseError });
      }
      
      // Set field-specific errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        logger.debug(`Setting field error for ${field}`, { message });
        setErrors(prev => ({ ...prev, [field]: message }));
      });
      
      // Announce form error
      announce(FormAnnouncements.formError(errorMessage), 'assertive');
      
      // If no specific field errors, show toast
      if (Object.keys(fieldErrors).length === 0) {
        toast({
          title: goalsTranslations?.messages?.taskUpdateFailed || "Update Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [`update-${editingTaskId}`]: false }));
      setIsLoading(false);
    }
  };

  // Handle network error retry
  const handleRetry = async () => {
    if (editingTaskId && !loadingStates[`update-${editingTaskId}`]) {
      // Retry the last task update
      await onSave();
    }
  };

  // Handle network status check
  const handleCheckStatus = async () => {
    try {
      // Simple network check
      const response = await fetch('/api/health', { method: 'HEAD' });
      if (response.ok) {
        clearError();
        announce(FormAnnouncements.networkRestored(), 'polite');
      }
    } catch (error) {
      setNetworkError('Network connection still unavailable');
    }
  };

  // Delete task handler with confirmation
  const onDelete = async (taskId: string) => {
    if (!window.confirm(goalsTranslations?.confirmDeleteTask || 'Are you sure you want to delete this task?')) return;
    
    setLoadingStates(prev => ({ ...prev, [`delete-${taskId}`]: true }));
    
    try {
      // Call the parent component's delete handler (which handles the API call)
      await onDeleteTask(taskId);
      
      // Refresh tasks if callback provided
      if (onTasksChange) {
        onTasksChange();
      }
      
      // If deleting last item on page and page > 1, go back a page
      if (paginatedTasks.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      toast({
        title: goalsTranslations?.messages?.taskDeleted || "Task Deleted",
        description: goalsTranslations?.messages?.taskDeleted || "Task has been successfully deleted.",
        variant: "default",
      });
    } catch (error: any) {
      logger.error('Error deleting task', { taskId, error });
      
      // Parse API error response
      let errorMessage = error?.message || 'Failed to delete task';
      
      try {
        // Try to parse error response if it's a string
        if (typeof error?.message === 'string') {
          const parsedError = JSON.parse(error.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        logger.warn('Could not parse delete task error response', { parseError });
      }
      
      toast({
        title: goalsTranslations?.messages?.taskDeleteFailed || "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete-${taskId}`]: false }));
    }
  };

  // Render sort icon
  const renderSortIcon = (column: keyof Task) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <span aria-label={commonTranslations?.ascending || 'Ascending'}>▲</span>
    ) : (
      <span aria-label={commonTranslations?.descending || 'Descending'}>▼</span>
    );
  };

  // Format date for display (UTC to avoid day shifts)
  const formatDate = (epochSeconds: number) => {
    if (!epochSeconds) return '';
    return new Date(epochSeconds * 1000).toLocaleDateString(undefined, { timeZone: 'UTC' });
  };

  // Show loading skeleton if initial loading
  if (isLoading && !Object.values(loadingStates).some(Boolean)) {
    return (
      <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }} aria-label={goalsTranslations?.modals?.viewTask?.title || 'Tasks'}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{goalsTranslations?.modals?.viewTask?.title || 'My Tasks'}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <SkeletonFormField type="input" showLabel={true} />
            <SkeletonFormField type="input" showLabel={true} />
            <SkeletonFormField type="input" showLabel={true} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={open => { if (!open) onClose(); }} 
      aria-label={goalsTranslations?.modals?.viewTask?.title || 'Tasks'}
    >
      <DialogContent 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="max-w-5xl max-h-[80vh] overflow-auto"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Tasks management"
      >
        {/* ARIA Live Region for announcements */}
        <ARIALiveRegion 
          message="" 
          priority="polite" 
          className="sr-only"
        />
        
        {/* Network Error Recovery */}
        <NetworkErrorRecovery
          isOnline={isOnline}
          hasError={hasError}
          errorMessage={errorMessage}
          onRetry={handleRetry}
          onCheckStatus={handleCheckStatus}
          showAutoRetry={true}
          autoRetryDelay={5}
          maxAutoRetries={3}
          variant="inline"
        />
        
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{goalsTranslations?.modals?.viewTask?.title || 'My Tasks'}</DialogTitle>
            {onCreateTask && canCreate && (
              <Button onClick={onCreateTask} size="sm" disabled={isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                {goalsTranslations?.modals?.viewTask?.createTask || 'Create Task'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-semibold"
                  onClick={() => onSort('title')}
                  aria-sort={sortColumn === 'title' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {goalsTranslations?.list?.columns?.title || 'Title'}
                  {renderSortIcon('title')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-semibold"
                  onClick={() => onSort('dueAt')}
                  aria-sort={sortColumn === 'dueAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {goalsTranslations?.list?.columns?.deadline || 'Deadline'}
                  {renderSortIcon('dueAt')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-semibold"
                  onClick={() => onSort('status')}
                  aria-sort={sortColumn === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {goalsTranslations?.list?.columns?.status || 'Status'}
                  {renderSortIcon('status')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 font-semibold"
                  onClick={() => onSort('tags')}
                  aria-sort={sortColumn === 'tags' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {goalsTranslations?.list?.columns?.tags || 'Tags'}
                  {renderSortIcon('tags')}
                </button>
              </TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="text-right">{goalsTranslations?.list?.columns?.actions || 'Actions'}</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(canEdit || canDelete) ? 5 : 4} className="text-center text-muted-foreground py-4">
                  {goalsTranslations?.list?.noTasks || 'No tasks available.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map(task => {
                const isEditing = editingTaskId === task.id;
                return (
                  <TableRow 
                    key={task.id} 
                    data-task-id={task.id}
                    ref={isEditing ? setEditingRowRef : null}
                    className={isEditing ? 'bg-blue-50' : ''}
                    role="row"
                    aria-label={isEditing ? 'Editing task' : 'Task row'}
                  >
                    <TableCell>
                      {isEditing ? (
                        <>
                          <Input
                            type="text"
                            value={editData.title || ''}
                            onChange={e => onChangeField('title', e.target.value)}
                            aria-invalid={!!errors.title}
                            aria-describedby={errors.title ? `error-title-${task.id}` : undefined}
                            data-task-id={task.id}
                            disabled={loadingStates[`update-${task.id}`]}
                            className={loadingStates[`update-${task.id}`] ? 'opacity-50' : ''}
                            autoComplete="off"
                          />
                          {errors.title && (
                            <p id={`error-title-${task.id}`} className="text-xs text-red-600 mt-1" role="alert">
                              {errors.title}
                            </p>
                          )}
                        </>
                      ) : (
                        task.title
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <>
                          <Input
                            type="date"
                            value={editData.dueAt || ''}
                            onChange={e => onChangeField('dueAt', e.target.value)}
                            aria-invalid={!!errors.dueAt}
                            aria-describedby={errors.dueAt ? `error-dueAt-${task.id}` : undefined}
                            data-task-id={task.id}
                            disabled={loadingStates[`update-${task.id}`]}
                            className={loadingStates[`update-${task.id}`] ? 'opacity-50' : ''}
                          />
                          {errors.dueAt && (
                            <p id={`error-dueAt-${task.id}`} className="text-xs text-red-600 mt-1" role="alert">
                              {errors.dueAt}
                            </p>
                          )}
                        </>
                      ) : (
                        formatDate(task.dueAt)
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <>
                          <select
                            data-testid="select"
                            value={editData.status || ''}
                            onChange={e => onChangeField('status', e.target.value)}
                            className={`w-full rounded border p-2 ${errors.status ? 'border-red-500' : 'border-gray-300'} ${loadingStates[`update-${task.id}`] ? 'opacity-50' : ''}`}
                            aria-invalid={!!errors.status}
                            aria-describedby={errors.status ? `error-status-${task.id}` : undefined}
                            data-task-id={task.id}
                            disabled={loadingStates[`update-${task.id}`]}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>
                                {goalsTranslations?.statusLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </option>
                            ))}
                          </select>
                          {errors.status && (
                            <p id={`error-status-${task.id}`} className="text-xs text-red-600 mt-1" role="alert">
                              {errors.status}
                            </p>
                          )}
                        </>
                      ) : (
                        goalsTranslations?.statusLabels?.[task.status] || task.status
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <>
                          {editData.status === 'completed' && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {goalsTranslations?.tasks?.fields?.completionNote || 'Completion Note'}
                              </p>
                              <Textarea
                                value={editData.completionNote || ''}
                                onChange={e => onChangeField('completionNote', e.target.value)}
                                aria-invalid={!!errors.completionNote}
                                aria-describedby={errors.completionNote ? `error-completionNote-${task.id}` : undefined}
                                placeholder={goalsTranslations?.placeholders?.taskCompletionNote || 'Describe what you did...'}
                                data-task-id={task.id}
                                disabled={loadingStates[`update-${task.id}`]}
                                className={`${errors.completionNote ? 'border-red-500' : 'border-gray-300'} min-h-[80px]`}
                              />
                              {errors.completionNote && (
                                <p id={`error-completionNote-${task.id}`} className="text-xs text-red-600 mt-1" role="alert">
                                  {errors.completionNote}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(editData.tags || []).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium"
                              >
                                {tag}
                                <button
                                  type="button"
                                  aria-label={`Remove tag ${tag}`}
                                  onClick={() => removeTag(idx)}
                                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <X className="h-3 w-3" aria-hidden="true" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <Input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={onTagInputKeyDown}
                            aria-invalid={!!errors.tags}
                            aria-describedby={errors.tags ? `error-tags-${task.id}` : undefined}
                            placeholder={goalsTranslations?.placeholders?.taskTags || 'Add tag and press Enter'}
                            data-task-id={task.id}
                            disabled={loadingStates[`update-${task.id}`]}
                            className={loadingStates[`update-${task.id}`] ? 'opacity-50' : ''}
                            autoComplete="off"
                          />
                          {errors.tags && (
                            <p id={`error-tags-${task.id}`} className="text-xs text-red-600 mt-1" role="alert">
                              {errors.tags}
                            </p>
                          )}
                        </>
                      ) : (
                        task.tags.join(', ')
                      )}
                    </TableCell>

                    {(canEdit || canDelete) && (
                      <TableCell className="text-right space-x-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={loadingStates[`update-${task.id}`] || isLoading}
                              aria-label={commonTranslations?.cancel || 'Cancel editing'}
                              title={commonTranslations?.cancel || 'Cancel editing'}
                              className="min-w-[80px]"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={onSave}
                              disabled={loadingStates[`update-${task.id}`] || isLoading || hasValidationErrors}
                              aria-label={commonTranslations?.save || 'Save changes'}
                              title={commonTranslations?.save || 'Save changes'}
                              className="min-w-[80px]"
                              aria-describedby={hasValidationErrors ? "form-validation-errors" : undefined}
                            >
                              {loadingStates[`update-${task.id}`] ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  {goalsTranslations?.actions?.savingTask || commonTranslations?.saving || 'Saving...'}
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  {goalsTranslations?.actions?.saveTask || commonTranslations?.save || 'Save'}
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(task)}
                                disabled={loadingStates[`delete-${task.id}`] || isLoading}
                                aria-label={commonTranslations?.edit || 'Edit task'}
                                title={commonTranslations?.edit || 'Edit task'}
                                className="min-w-[60px]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete(task.id)}
                                disabled={loadingStates[`delete-${task.id}`] || isLoading}
                                aria-label={commonTranslations?.delete || 'Delete task'}
                                title={commonTranslations?.delete || 'Delete task'}
                                className="min-w-[60px]"
                              >
                                {loadingStates[`delete-${task.id}`] ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    {goalsTranslations?.actions?.deletingTask || commonTranslations?.deleting || 'Deleting...'}
                                  </>
                                ) : (
                                  <Trash className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Form validation summary for editing */}
        {editingTaskId && hasValidationErrors && (
          <div 
            id="form-validation-errors" 
            role="alert" 
            aria-live="polite"
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md"
          >
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  {goalsTranslations?.validation?.formErrorsTitle || 'Please fix the following errors:'}
                </h4>
                <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>
                      {goalsTranslations?.fields?.[field] || field}: {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 select-none" role="navigation" aria-label={goalsTranslations?.paginationLabel || 'Pagination'}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label={goalsTranslations?.paginationFirst || 'First Page'}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label={goalsTranslations?.paginationPrevious || 'Previous Page'}
            >
              ‹
            </Button>
            <span aria-live="polite" aria-atomic="true" className="px-2">
              {goalsTranslations?.paginationPage || 'Page'} {currentPage} {goalsTranslations?.paginationOf || 'of'} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label={goalsTranslations?.paginationNext || 'Next Page'}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label={goalsTranslations?.paginationLast || 'Last Page'}
            >
              »
            </Button>
          </div>
        )}

        <DialogFooter className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {commonTranslations?.close || 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TasksModal;
