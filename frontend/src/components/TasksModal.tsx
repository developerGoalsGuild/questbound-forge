import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { X, Pencil, Trash, Check, XCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueAt: number; // epoch seconds
  status: string;
  tags: string[];
}

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onUpdateTask: (task: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const STATUS_OPTIONS = ['active', 'paused', 'completed', 'archived'];

const TasksModal: React.FC<TasksModalProps> = ({ isOpen, onClose, tasks, onUpdateTask, onDeleteTask }) => {
  const { t } = useTranslation();

  // Pagination state
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<keyof Task>('dueAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Editing state: map taskId to editable task data or null if not editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Task>>({});

  // Error state for inline validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset pagination and sorting when tasks change
  useEffect(() => {
    setCurrentPage(1);
    setSortColumn('dueAt');
    setSortDirection('asc');
    setEditingTaskId(null);
    setEditData({});
    setErrors({});
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
    setEditData({ ...task, dueAt: new Date(task.dueAt * 1000).toISOString().slice(0, 10) }); // date string YYYY-MM-DD
    setErrors({});
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditData({});
    setErrors({});
  };

  // Validate edited data
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editData.title || !editData.title.trim()) {
      newErrors.title = t.goals.validation.taskTitleRequired || 'Task title is required';
    }
    if (!editData.dueAt) {
      newErrors.dueAt = t.goals.validation.taskDueAtRequired || 'Task due date is required';
    } else {
      // Validate date format and not invalid date
      const date = new Date(editData.dueAt);
      if (isNaN(date.getTime())) {
        newErrors.dueAt = t.goals.validation.taskDueAtInvalid || 'Invalid due date';
      }
    }
    if (!editData.status || !STATUS_OPTIONS.includes(editData.status)) {
      newErrors.status = t.goals.validation.taskStatusInvalid || 'Invalid status';
    }
    if (!editData.tags || !Array.isArray(editData.tags)) {
      newErrors.tags = t.goals.validation.taskTagsRequired || 'At least one tag is required';
    } else if (editData.tags.length === 0) {
      newErrors.tags = t.goals.validation.taskTagsRequired || 'At least one tag is required';
    } else if (editData.tags.some(tag => !/^[a-zA-Z0-9-_]+$/.test(tag))) {
      newErrors.tags = t.goals.validation.taskTagsInvalid || 'Tags can only contain letters, numbers, hyphens, and underscores';
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

  // Handle tags input (comma separated string)
  const onChangeTags = (value: string) => {
    const tagsArray = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    onChangeField('tags', tagsArray);
  };

  // Save edited task
  const onSave = async () => {
    if (!validate() || !editingTaskId) return;
    try {
      // Convert dueAt date string to epoch seconds
      const dueAtEpoch = Math.floor(new Date(editData.dueAt as string).getTime() / 1000);
      const updatedTask: Task = {
        id: editingTaskId,
        title: (editData.title as string).trim(),
        dueAt: dueAtEpoch,
        status: editData.status as string,
        tags: editData.tags as string[],
      };
      await onUpdateTask(updatedTask);
      setEditingTaskId(null);
      setEditData({});
      setErrors({});
    } catch (error) {
      // Could add toast or error handling here
    }
  };

  // Delete task handler with confirmation
  const onDelete = async (taskId: string) => {
    if (!window.confirm(t.goals.confirmDeleteTask || 'Are you sure you want to delete this task?')) return;
    try {
      await onDeleteTask(taskId);
      // If deleting last item on page and page > 1, go back a page
      if (paginatedTasks.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      // Could add toast or error handling here
    }
  };

  // Render sort icon
  const renderSortIcon = (column: keyof Task) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <span aria-label={t.common.ascending || 'Ascending'}>▲</span>
    ) : (
      <span aria-label={t.common.descending || 'Descending'}>▼</span>
    );
  };

  // Format date for display
  const formatDate = (epochSeconds: number) => {
    if (!epochSeconds) return '';
    return new Date(epochSeconds * 1000).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }} size="lg" aria-label={t.goals.modals.viewTask.title || 'Tasks'}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t.goals.modals.viewTask.title || 'My Tasks'}</DialogTitle>
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
                  {t.goals.list?.columns?.title || 'Title'}
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
                  {t.goals.list?.columns?.deadline || 'Deadline'}
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
                  {t.goals.list?.columns?.status || 'Status'}
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
                  {t.goals.list?.columns?.tags || 'Tags'}
                  {renderSortIcon('tags')}
                </button>
              </TableHead>
              <TableHead className="text-right">{t.goals.list?.columns?.actions || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                  {t.goals.list?.noTasks || 'No tasks available.'}
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
                          <Select
                            value={editData.status || ''}
                            onChange={e => onChangeField('status', e.target.value)}
                            aria-invalid={!!errors.status}
                            aria-describedby={errors.status ? `error-status-${task.id}` : undefined}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>
                                {t.goals.statusLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </option>
                            ))}
                          </Select>
                          {errors.status && (
                            <p id={`error-status-${task.id}`} className="text-xs text-red-600 mt-1">
                              {errors.status}
                            </p>
                          )}
                        </>
                      ) : (
                        t.goals.statusLabels?.[task.status] || task.status
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <>
                          <Input
                            type="text"
                            value={(editData.tags || []).join(', ')}
                            onChange={e => onChangeTags(e.target.value)}
                            aria-invalid={!!errors.tags}
                            aria-describedby={errors.tags ? `error-tags-${task.id}` : undefined}
                            placeholder={t.goals.placeholders?.taskTags || 'Comma separated tags'}
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
                            aria-label={t.common.cancel || 'Cancel'}
                            title={t.common.cancel || 'Cancel'}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={onSave}
                            aria-label={t.common.save || 'Save'}
                            title={t.common.save || 'Save'}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(task)}
                            aria-label={t.common.edit || 'Edit'}
                            title={t.common.edit || 'Edit'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(task.id)}
                            aria-label={t.common.delete || 'Delete'}
                            title={t.common.delete || 'Delete'}
                          >
                            <Trash className="h-4 w-4" />
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
          <div className="flex justify-center items-center gap-2 mt-4 select-none" role="navigation" aria-label={t.goals.paginationLabel || 'Pagination'}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label={t.goals.paginationFirst || 'First Page'}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label={t.goals.paginationPrevious || 'Previous Page'}
            >
              ‹
            </Button>
            <span aria-live="polite" aria-atomic="true" className="px-2">
              {t.goals.paginationPage || 'Page'} {currentPage} {t.goals.paginationOf || 'of'} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label={t.goals.paginationNext || 'Next Page'}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label={t.goals.paginationLast || 'Last Page'}
            >
              »
            </Button>
          </div>
        )}

        <DialogFooter className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t.common.close || 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TasksModal;
