import React, { useEffect, useState, KeyboardEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, dueAt: string, tags: string[], status: string) => Promise<void>;
  goalDeadline: string | null; // ISO string or null
}

const STATUS_OPTIONS = ['active', 'paused', 'completed', 'archived'];

const TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreate, goalDeadline }) => {
  const { t } = useTranslation();

  // Safe translation access
  const goalsTranslations = (t as any)?.goals;
  const commonTranslations = (t as any)?.common;
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [errors, setErrors] = useState<{ title?: string; dueAt?: string; tags?: string; status?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDueAt('');
      setTags([]);
      setTagInput('');
      setStatus(STATUS_OPTIONS[0]);
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen]);

  // Validate inputs
  const validate = (): boolean => {
    const newErrors: { title?: string; dueAt?: string; tags?: string; status?: string } = {};
    if (!title.trim()) {
      newErrors.title = goalsTranslations?.validation?.taskTitleRequired || 'Task title is required';
    }
    if (!dueAt) {
      newErrors.dueAt = goalsTranslations?.validation?.taskDueAtRequired || 'Task due date is required';
    } else if (goalDeadline) {
      // Validate dueAt <= goalDeadline
      const dueDate = new Date(dueAt);
      const goalDate = new Date(goalDeadline);
      // Normalize time to 00:00:00 for comparison
      dueDate.setHours(0, 0, 0, 0);
      goalDate.setHours(0, 0, 0, 0);
      if (dueDate > goalDate) {
        newErrors.dueAt = goalsTranslations?.validation?.taskDueAtExceedsGoalDeadline || 'Task due date cannot exceed goal deadline';
      }
    }
    if (tags.length === 0) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsRequired || 'At least one tag is required';
    }
    if (tags.some(tag => !TAG_REGEX.test(tag))) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsInvalid || 'Tags can only contain letters, numbers, hyphens, and underscores';
    }
    if (!STATUS_OPTIONS.includes(status)) {
      newErrors.status = goalsTranslations?.validation?.taskStatusInvalid || 'Invalid status selected';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add tag from input
  const addTag = () => {
    const newTag = tagInput.trim();
    if (!newTag) return;
    if (!TAG_REGEX.test(newTag)) {
      setErrors(prev => ({ ...prev, tags: goalsTranslations?.validation?.taskTagsInvalid || 'Tags can only contain letters, numbers, hyphens, and underscores' }));
      return;
    }
    if (tags.includes(newTag)) {
      setErrors(prev => ({ ...prev, tags: goalsTranslations?.validation?.taskTagsDuplicate || 'Duplicate tags are not allowed' }));
      return;
    }
    setTags(prev => [...prev, newTag]);
    setTagInput('');
    setErrors(prev => {
      const { tags, ...rest } = prev;
      return rest;
    });
  };

  // Handle Enter key in tag input
  const onTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove tag by index
  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const { tags, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Pass date-only string (YYYY-MM-DD)
      await onCreate(title.trim(), dueAt, tags, status);
      onClose();
    } catch (error) {
      // Could add toast or error handling here if needed
    } finally {
      setSubmitting(false);
    }
  };

  const createHintId = (id: string) => `${id}-hint`;
  const formatHintLabel = (fieldLabel: string) => {
    const iconLabelTemplate = goalsTranslations?.hints?.iconLabel || 'More information about {field}';
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
          <DialogTitle>{goalsTranslations?.modal?.createTaskTitle || 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                {goalsTranslations?.fields?.taskTitle || 'Task Title'}
                {goalsTranslations?.hints?.taskTitle && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label={formatHintLabel(goalsTranslations?.fields?.taskTitle || 'Task Title')}
                          aria-describedby={createHintId('task-title')}
                        >
                          <Info className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent id={createHintId('task-title')} role="tooltip" side="top" align="start" aria-labelledby={createHintId('task-title')}>
                        <p className="max-w-xs text-xs leading-relaxed">{goalsTranslations?.hints?.taskTitle}</p>
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

            {/* Task Due Date (date only) */}
            <div>
              <label htmlFor="task-dueAt" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                {goalsTranslations?.fields?.taskDueAt || 'Task Due Date'}
                {goalsTranslations?.hints?.taskDueAt && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label={formatHintLabel(goalsTranslations?.fields?.taskDueAt || 'Task Due Date')}
                          aria-describedby={createHintId('task-dueAt')}
                        >
                          <Info className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent id={createHintId('task-dueAt')} role="tooltip" side="top" align="start" aria-labelledby={createHintId('task-dueAt')}>
                        <p className="max-w-xs text-xs leading-relaxed">{goalsTranslations?.hints?.taskDueAt}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </label>
              <input
                id="task-dueAt"
                type="date"
                className={`mt-1 block w-full rounded border p-2 ${errors.dueAt ? 'border-red-500' : 'border-gray-300'}`}
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                aria-describedby={errors.dueAt ? 'task-dueAt-error' : undefined}
                aria-invalid={!!errors.dueAt}
                required
                max={goalDeadline ? new Date(goalDeadline).toISOString().slice(0, 10) : undefined}
              />
              {errors.dueAt && (
                <p id="task-dueAt-error" className="mt-1 text-xs text-red-600">
                  {errors.dueAt}
                </p>
              )}
            </div>

            {/* Tags input */}
            <div>
              <label htmlFor="task-tags" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                {goalsTranslations?.fields?.taskTags || 'Tags'}
                {goalsTranslations?.hints?.taskTags && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label={formatHintLabel(goalsTranslations?.fields?.taskTags || 'Tags')}
                          aria-describedby={createHintId('task-tags')}
                        >
                          <Info className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent id={createHintId('task-tags')} role="tooltip" side="top" align="start" aria-labelledby={createHintId('task-tags')}>
                        <p className="max-w-xs text-xs leading-relaxed">{goalsTranslations?.hints?.taskTags}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
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
              <input
                id="task-tags"
                type="text"
                className={`mt-2 block w-full rounded border p-2 ${errors.tags ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={goalsTranslations?.placeholders?.taskTags || 'Add tag and press Enter'}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={onTagInputKeyDown}
                aria-describedby={errors.tags ? 'task-tags-error' : undefined}
                aria-invalid={!!errors.tags}
              />
              {errors.tags && (
                <p id="task-tags-error" className="mt-1 text-xs text-red-600">
                  {errors.tags}
                </p>
              )}
            </div>

            {/* Status dropdown */}
            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                {goalsTranslations?.fields?.taskStatus || 'Status'}
                {goalsTranslations?.hints?.taskStatus && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label={formatHintLabel(goalsTranslations?.fields?.taskStatus || 'Status')}
                          aria-describedby={createHintId('task-status')}
                        >
                          <Info className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent id={createHintId('task-status')} role="tooltip" side="top" align="start" aria-labelledby={createHintId('task-status')}>
                        <p className="max-w-xs text-xs leading-relaxed">{goalsTranslations?.hints?.taskStatus}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </label>
              <select
                id="task-status"
                className={`mt-1 block w-full rounded border p-2 ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                value={status}
                onChange={e => setStatus(e.target.value)}
                aria-describedby={errors.status ? 'task-status-error' : undefined}
                aria-invalid={!!errors.status}
                required
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {goalsTranslations?.statusLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p id="task-status-error" className="mt-1 text-xs text-red-600">
                  {errors.status}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {commonTranslations?.cancel || 'Cancel'}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? commonTranslations?.loading || 'Loading...' : goalsTranslations?.actions?.createTask || 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
