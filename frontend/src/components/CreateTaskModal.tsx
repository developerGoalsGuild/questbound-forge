import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, dueAt: string) => Promise<void>;
  goalDeadline: string | null; // ISO string or null
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreate, goalDeadline }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [errors, setErrors] = useState<{ title?: string; dueAt?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDueAt('');
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: { title?: string; dueAt?: string } = {};
    if (!title.trim()) {
      newErrors.title = t.goals.validation.taskTitleRequired || 'Task title is required';
    }
    if (!dueAt) {
      newErrors.dueAt = t.goals.validation.taskDueAtRequired || 'Task due date is required';
    } else if (goalDeadline) {
      // Validate dueAt <= goalDeadline
      const dueDate = new Date(dueAt);
      const goalDate = new Date(goalDeadline);
      if (dueDate > goalDate) {
        newErrors.dueAt = t.goals.validation.taskDueAtExceedsGoalDeadline || 'Task due date cannot exceed goal deadline';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onCreate(title.trim(), dueAt);
      onClose();
    } catch (error) {
      // Could add toast or error handling here if needed
    } finally {
      setSubmitting(false);
    }
  };

  const createHintId = (id: string) => `${id}-hint`;
  const formatHintLabel = (fieldLabel: string) => {
    const iconLabelTemplate = t.goals.hints?.iconLabel || 'More information about {field}';
    const safeLabel = fieldLabel && fieldLabel.trim().length > 0 ? fieldLabel.trim() : 'this field';
    if (iconLabelTemplate.includes('{field}')) {
      return iconLabelTemplate.replace('{field}', safeLabel);
    }
    return `${iconLabelTemplate} ${safeLabel}`.trim();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.goals.modal?.createTaskTitle || 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                {t.goals.fields?.taskTitle || 'Task Title'}
                {t.goals.hints?.taskTitle && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label={formatHintLabel(t.goals.fields?.taskTitle || 'Task Title')}
                          aria-describedby={createHintId('task-title')}
                        >
                          <Info className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent id={createHintId('task-title')} role="tooltip" side="top" align="start" aria-labelledby={createHintId('task-title')}>
                        <p className="max-w-xs text-xs leading-relaxed">{t.goals.hints.taskTitle}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </label>
              <input
                id="task-title"
                type="text"
                className={`mt-1 block w-full rounded border p-2 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                value={title}
                onChange={e => setTitle(e.target.value)}
                aria-describedby={errors.title ? 'task-title-error' : undefined}
                aria-invalid={!!errors.title}
                required
              />
              {errors.title && (
                <p id="task-title-error" className="mt-1 text-xs text-red-600">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="task-dueAt" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                {t.goals.fields?.taskDueAt || 'Task Due Date'}
                {t.goals.hints?.taskDueAt && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label={formatHintLabel(t.goals.fields?.taskDueAt || 'Task Due Date')}
                          aria-describedby={createHintId('task-dueAt')}
                        >
                          <Info className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent id={createHintId('task-dueAt')} role="tooltip" side="top" align="start" aria-labelledby={createHintId('task-dueAt')}>
                        <p className="max-w-xs text-xs leading-relaxed">{t.goals.hints.taskDueAt}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </label>
              <input
                id="task-dueAt"
                type="datetime-local"
                className={`mt-1 block w-full rounded border p-2 ${errors.dueAt ? 'border-red-500' : 'border-gray-300'}`}
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                aria-describedby={errors.dueAt ? 'task-dueAt-error' : undefined}
                aria-invalid={!!errors.dueAt}
                required
                max={goalDeadline ? new Date(goalDeadline).toISOString().slice(0, 16) : undefined}
              />
              {errors.dueAt && (
                <p id="task-dueAt-error" className="mt-1 text-xs text-red-600">
                  {errors.dueAt}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t.common.cancel || 'Cancel'}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t.common.loading || 'Loading...' : t.goals.actions.createTask || 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
