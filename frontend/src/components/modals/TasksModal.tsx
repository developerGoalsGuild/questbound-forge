import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X, Pencil, Trash, Check, XCircle, Loader2 } from 'lucide-react';
import { updateTask } from '@/lib/apiTask';

interface Task {
  id: string;
  title: string;
  dueAt: number; // epoch seconds
  status: string;
  tags: string[];
}

interface EditTaskData {
  id?: string;
  title?: string;
  dueAt?: string; // date string for input field
  status?: string;
  tags?: string[];
}

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onUpdateTask: (task: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onTasksChange?: () => void; // Callback to refresh tasks after changes
}

const STATUS_OPTIONS = ['active', 'paused', 'completed', 'archived'];
const TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

const TasksModal: React.FC<TasksModalProps> = ({ isOpen, onClose, tasks, onUpdateTask, onDeleteTask, onTasksChange }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Safe translation access
  const goalsTranslations = (t as any)?.goals;
  const commonTranslations = (t as any)?.common;

  // Debug logging
  console.log('TasksModal received tasks:', tasks);
  console.log('TasksModal tasks length:', tasks?.length);

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
  }, [tasks]);

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
    setEditData({ ...task, dueAt: dateOnly }); // date string YYYY-MM-DD
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

  // Validate edited data
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editData.title || !editData.title.trim()) {
      newErrors.title = goalsTranslations?.validation?.taskTitleRequired || 'Task title is required';
    }
    if (!editData.dueAt) {
      newErrors.dueAt = goalsTranslations?.validation?.taskDueAtRequired || 'Task due date is required';
    } else {
      // Validate date format and not invalid date
      const date = new Date(editData.dueAt);
      if (isNaN(date.getTime())) {
        newErrors.dueAt = goalsTranslations?.validation?.taskDueAtInvalid || 'Invalid due date';
      }
    }
    if (!editData.status || !STATUS_OPTIONS.includes(editData.status)) {
      newErrors.status = goalsTranslations?.validation?.taskStatusInvalid || 'Invalid status';
    }
    if (!editData.tags || !Array.isArray(editData.tags)) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsRequired || 'At least one tag is required';
    } else if (editData.tags.length === 0) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsRequired || 'At least one tag is required';
    } else if (editData.tags.some(tag => !TAG_REGEX.test(tag))) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsInvalid || 'Tags can only contain letters, numbers, hyphens, and underscores';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes in edit mode
  const onChangeField = (field: keyof Task, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // Add tag from input
  const addTag = () => {
    const newTag = tagInput.trim();
    if (!newTag) return;
    if (!TAG_REGEX.test(newTag)) {
      setErrors(prev => ({ ...prev, tags: goalsTranslations?.validation?.taskTagsInvalid || 'Tags can only contain letters, numbers, hyphens, and underscores' }));
      return;
    }
    if ((editData.tags || []).includes(newTag)) {
      setErrors(prev => ({ ...prev, tags: goalsTranslations?.validation?.taskTagsDuplicate || 'Duplicate tags are not allowed' }));
      return;
    }
    const newTags = [...(editData.tags || []), newTag];
    onChangeField('tags', newTags);
    setTagInput('');
    setErrors(prev => {
      const { tags, ...rest } = prev;
      return rest;
    });
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
      }> = {};

      if (editData.title !== undefined) updatePayload.title = (editData.title as string).trim();
      if (editData.dueAt !== undefined && typeof dueAtEpoch === 'number') updatePayload.dueAt = dueAtEpoch;
      if (editData.status !== undefined) updatePayload.status = editData.status as string;
      if (editData.tags !== undefined) updatePayload.tags = editData.tags as string[];

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
      
      // Refresh tasks if callback provided
      if (onTasksChange) {
        onTasksChange();
      }
      
      setEditingTaskId(null);
      setEditData({});
      setErrors({});
      
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`update-${editingTaskId}`]: false }));
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
        title: "Task Deleted",
        description: "Task has been successfully deleted.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete task. Please try again.",
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

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }} aria-label={goalsTranslations?.modals?.viewTask?.title || 'Tasks'}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{goalsTranslations?.modals?.viewTask?.title || 'My Tasks'}</DialogTitle>
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
              <TableHead className="text-right">{goalsTranslations?.list?.columns?.actions || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                  {goalsTranslations?.list?.noTasks || 'No tasks available.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map(task => {
                const isEditing = editingTaskId === task.id;
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      {isEditing ? (
                        <>
                          <Input
                            type="text"
                            value={editData.title || ''}
                            onChange={e => onChangeField('title', e.target.value)}
                            aria-invalid={!!errors.title}
                            aria-describedby={errors.title ? `error-title-${task.id}` : undefined}
                          />
                          {errors.title && (
                            <p id={`error-title-${task.id}`} className="text-xs text-red-600 mt-1">
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
                          />
                          {errors.dueAt && (
                            <p id={`error-dueAt-${task.id}`} className="text-xs text-red-600 mt-1">
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
                            className={`w-full rounded border p-2 ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                            aria-invalid={!!errors.status}
                            aria-describedby={errors.status ? `error-status-${task.id}` : undefined}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>
                                {goalsTranslations?.statusLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </option>
                            ))}
                          </select>
                          {errors.status && (
                            <p id={`error-status-${task.id}`} className="text-xs text-red-600 mt-1">
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
                          />
                          {errors.tags && (
                            <p id={`error-tags-${task.id}`} className="text-xs text-red-600 mt-1">
                              {errors.tags}
                            </p>
                          )}
                        </>
                      ) : (
                        task.tags.join(', ')
                      )}
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={loadingStates[`update-${task.id}`]}
                            aria-label={commonTranslations?.cancel || 'Cancel'}
                            title={commonTranslations?.cancel || 'Cancel'}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={onSave}
                            disabled={loadingStates[`update-${task.id}`]}
                            aria-label={commonTranslations?.save || 'Save'}
                            title={commonTranslations?.save || 'Save'}
                          >
                            {loadingStates[`update-${task.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(task)}
                            disabled={loadingStates[`delete-${task.id}`]}
                            aria-label={commonTranslations?.edit || 'Edit'}
                            title={commonTranslations?.edit || 'Edit'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(task.id)}
                            disabled={loadingStates[`delete-${task.id}`]}
                            aria-label={commonTranslations?.delete || 'Delete'}
                            title={commonTranslations?.delete || 'Delete'}
                          >
                            {loadingStates[`delete-${task.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

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
