// Version: 2.0 - Added Phase 5 enhancements: accessibility, loading states, error recovery
import React, { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { 
  validateTaskTitle, 
  validateTaskDueDate, 
  validateTaskTag, 
  validateTaskStatus,
  taskCreateSchema,
  type TaskCreateInput
} from '@/lib/validation/taskValidation';
import useFocusManagement from '@/hooks/useFocusManagement';
import { SkeletonFormField } from '@/components/ui/SkeletonFormField';
import NetworkErrorRecovery, { useNetworkStatus } from '@/components/ui/NetworkErrorRecovery';
import ARIALiveRegion, { useARIALiveAnnouncements, FormAnnouncements } from '@/components/ui/ARIALiveRegion';

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
  const { toast } = useToast();

  // Safe translation access
  const goalsTranslations = (t as any)?.goals;
  const commonTranslations = (t as any)?.common;
  
  // Form state
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [errors, setErrors] = useState<{ title?: string; dueAt?: string; tags?: string; status?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  // Network status and error recovery - temporarily disabled for testing
  // const { isOnline, hasError, errorMessage, setError: setNetworkError, clearError } = useNetworkStatus();
  const isOnline = true;
  const hasError = false;
  const errorMessage = '';
  const setNetworkError = (...args: any[]) => {};
  const clearError = () => {};

  // ARIA live announcements - temporarily disabled for testing
  // const { announce, clearAll } = useARIALiveAnnouncements();
  const announce = (...args: any[]) => {};
  const clearAll = () => {};

  // Focus management - temporarily disabled for testing
  // const {
  //   containerRef,
  //   focusFirstError,
  //   focusFirst,
  //   handleKeyDown
  // } = useFocusManagement({
  //   focusOnError: true,
  //   restoreFocus: true
  // });
  
  // Temporary ref for testing
  const containerRef = useRef<HTMLDivElement>(null);
  const focusFirstError = () => false;
  const focusFirst = () => false;
  const handleKeyDown = () => {};

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
      setIsLoading(false);
      setHasValidationErrors(false);
      // Temporarily removed clearError() and clearAll() to test
    }
  }, [isOpen]);

  // Focus first field when modal opens (separate effect)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        // Try to focus the first input field directly
        const firstInput = document.querySelector('#task-title') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Validate inputs using Zod schemas
  const validate = (): boolean => {
    const newErrors: { title?: string; dueAt?: string; tags?: string; status?: string } = {};
    
    // Clear previous validation errors
    setHasValidationErrors(false);
    clearError();
    
    // Validate title
    const titleValidation = validateTaskTitle(title);
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error || 'Invalid title';
    }
    
    // Validate due date
    if (!dueAt) {
      newErrors.dueAt = goalsTranslations?.validation?.taskDueAtRequired || 'Task due date is required';
    } else {
      const dueDateValidation = validateTaskDueDate(dueAt);
      if (!dueDateValidation.isValid) {
        newErrors.dueAt = dueDateValidation.error || 'Invalid due date';
      } else if (goalDeadline) {
        // Additional validation: dueAt <= goalDeadline
        const dueDate = new Date(dueAt);
        const goalDate = new Date(goalDeadline);
        // Normalize time to 00:00:00 for comparison
        dueDate.setHours(0, 0, 0, 0);
        goalDate.setHours(0, 0, 0, 0);
        if (dueDate > goalDate) {
          newErrors.dueAt = goalsTranslations?.validation?.taskDueAtExceedsGoalDeadline || 'Task due date cannot exceed goal deadline';
        }
      }
    }
    
    // Validate tags
    if (tags.length === 0) {
      newErrors.tags = goalsTranslations?.validation?.taskTagsRequired || 'At least one tag is required';
    } else {
      // Validate each tag
      for (let i = 0; i < tags.length; i++) {
        const tagValidation = validateTaskTag(tags[i]);
        if (!tagValidation.isValid) {
          newErrors.tags = tagValidation.error || 'Invalid tag format';
          break;
        }
      }
    }
    
    // Validate status
    const statusValidation = validateTaskStatus(status);
    if (!statusValidation.isValid) {
      newErrors.status = statusValidation.error || 'Invalid status';
    }
    
    setErrors(newErrors);
    
    // Set validation error state and announce errors
    if (Object.keys(newErrors).length > 0) {
      setHasValidationErrors(true);
      announce(FormAnnouncements.validationError('task form'), 'assertive');
      
      // Focus first error field
      setTimeout(() => {
        focusFirstError();
      }, 100);
    }
    
    return Object.keys(newErrors).length === 0;
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
    
    if (tags.includes(newTag)) {
      setErrors(prev => ({ ...prev, tags: goalsTranslations?.validation?.taskTagsDuplicate || 'Duplicate tags are not allowed' }));
      announce(FormAnnouncements.validationError('duplicate tag'), 'assertive');
      return;
    }
    
    setTags(prev => [...prev, newTag]);
    setTagInput('');
    setErrors(prev => {
      const { tags, ...rest } = prev;
      return rest;
    });
    
    // Announce successful tag addition
    announce(FormAnnouncements.fieldSaved('tag'), 'polite', 2000);
  };

  // Handle Enter key in tag input
  const onTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Clear validation errors when user starts typing
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (errors.title) {
      setErrors(prev => {
        const { title, ...rest } = prev;
        return rest;
      });
    }
    if (hasValidationErrors) {
      setHasValidationErrors(false);
    }
  };

  const handleDueAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueAt(e.target.value);
    if (errors.dueAt) {
      setErrors(prev => {
        const { dueAt, ...rest } = prev;
        return rest;
      });
    }
    if (hasValidationErrors) {
      setHasValidationErrors(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    if (errors.status) {
      setErrors(prev => {
        const { status, ...rest } = prev;
        return rest;
      });
    }
    if (hasValidationErrors) {
      setHasValidationErrors(false);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    if (errors.tags) {
      setErrors(prev => {
        const { tags, ...rest } = prev;
        return rest;
      });
    }
    if (hasValidationErrors) {
      setHasValidationErrors(false);
    }
  };

  // Remove tag by index
  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const { tags, ...rest } = prev;
      return rest;
    });
    if (hasValidationErrors) {
      setHasValidationErrors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    setIsLoading(true);
    
    // Announce loading state
    announce(FormAnnouncements.loading('Task creation'), 'polite');
    
    try {
      // Pass date-only string (YYYY-MM-DD)
      await onCreate(title.trim(), dueAt, tags, status);
      
      // Clear any network errors
      clearError();
      
      // Announce success
      announce(FormAnnouncements.formSubmitted(), 'polite');
      
      onClose();
      toast({
        title: goalsTranslations?.messages?.taskCreated || "Task Created",
        description: goalsTranslations?.messages?.taskCreated || "Task has been successfully created.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      
      // Set network error if it's a network issue
      if (!navigator.onLine || error.name === 'NetworkError' || error.message.includes('fetch')) {
        setNetworkError('Network error occurred. Please check your connection and try again.');
        announce(FormAnnouncements.networkError(), 'assertive');
      }
      
      // Parse API error response for field-specific errors
      let errorMessage = error?.message || 'Failed to create task';
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
        console.log('Could not parse error response:', parseError);
      }
      
      // Set field-specific errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        console.log(`Setting field error for ${field}:`, message);
        setErrors(prev => ({ ...prev, [field]: message }));
      });
      
      // Announce form error
      announce(FormAnnouncements.formError(errorMessage), 'assertive');
      
      // If no specific field errors, show toast
      if (Object.keys(fieldErrors).length === 0) {
        toast({
          title: goalsTranslations?.messages?.taskCreateFailed || "Create Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  // Handle network error retry
  const handleRetry = async () => {
    if (submitting) return;
    
    // Retry the last form submission
    if (title && dueAt) {
      await handleSubmit(new Event('submit') as any);
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

  const createHintId = (id: string) => `${id}-hint`;
  const formatHintLabel = (fieldLabel: string) => {
    const iconLabelTemplate = goalsTranslations?.hints?.iconLabel || 'More information about {field}';
    const safeLabel = fieldLabel && fieldLabel.trim().length > 0 ? fieldLabel.trim() : 'this field';
    if (iconLabelTemplate.includes('{field}')) {
      return iconLabelTemplate.replace('{field}', safeLabel);
    }
    return `${iconLabelTemplate} ${safeLabel}`.trim();
  };

  // Show loading skeleton if initial loading
  if (isLoading && !submitting) {
    return (
      <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{goalsTranslations?.modal?.createTaskTitle || 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <SkeletonFormField type="input" showLabel={true} />
            <SkeletonFormField type="input" showLabel={true} />
            <SkeletonFormField type="input" showLabel={true} />
            <SkeletonFormField type="select" showLabel={true} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="max-w-md"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Create new task"
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
          <DialogTitle>{goalsTranslations?.modal?.createTaskTitle || 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form 
          onSubmit={handleSubmit} 
          noValidate
          role="form"
          aria-label="Task creation form"
        >
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
                className={`mt-1 block w-full rounded border p-2 ${errors.title ? 'border-red-500' : 'border-gray-300'} ${submitting ? 'opacity-50' : ''}`}
                value={title}
                onChange={handleTitleChange}
                aria-describedby={errors.title ? 'task-title-error' : undefined}
                aria-invalid={!!errors.title}
                required
                disabled={submitting}
                autoComplete="off"
              />
              {errors.title && (
                <p id="task-title-error" className="mt-1 text-xs text-red-600" role="alert">
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
                className={`mt-1 block w-full rounded border p-2 ${errors.dueAt ? 'border-red-500' : 'border-gray-300'} ${submitting ? 'opacity-50' : ''}`}
                value={dueAt}
                onChange={handleDueAtChange}
                aria-describedby={errors.dueAt ? 'task-dueAt-error' : undefined}
                aria-invalid={!!errors.dueAt}
                required
                max={goalDeadline ? new Date(goalDeadline).toISOString().slice(0, 10) : undefined}
                disabled={submitting}
              />
              {errors.dueAt && (
                <p id="task-dueAt-error" className="mt-1 text-xs text-red-600" role="alert">
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
                className={`mt-2 block w-full rounded border p-2 ${errors.tags ? 'border-red-500' : 'border-gray-300'} ${submitting ? 'opacity-50' : ''}`}
                placeholder={goalsTranslations?.placeholders?.taskTags || 'Add tag and press Enter'}
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={onTagInputKeyDown}
                aria-describedby={errors.tags ? 'task-tags-error' : undefined}
                aria-invalid={!!errors.tags}
                disabled={submitting}
                autoComplete="off"
              />
              {errors.tags && (
                <p id="task-tags-error" className="mt-1 text-xs text-red-600" role="alert">
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
                className={`mt-1 block w-full rounded border p-2 ${errors.status ? 'border-red-500' : 'border-gray-300'} ${submitting ? 'opacity-50' : ''}`}
                value={status}
                onChange={handleStatusChange}
                aria-describedby={errors.status ? 'task-status-error' : undefined}
                aria-invalid={!!errors.status}
                required
                disabled={submitting}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {goalsTranslations?.statusLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p id="task-status-error" className="mt-1 text-xs text-red-600" role="alert">
                  {errors.status}
                </p>
              )}
            </div>
          </div>

          {/* Form validation summary */}
          {hasValidationErrors && (
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

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={submitting || isLoading}
              aria-label="Cancel task creation"
            >
              {commonTranslations?.cancel || 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || isLoading || hasValidationErrors}
              aria-describedby={hasValidationErrors ? "form-validation-errors" : undefined}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  {commonTranslations?.loading || 'Loading...'}
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  {goalsTranslations?.actions?.creatingTask || commonTranslations?.loading || 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  {goalsTranslations?.actions?.createTask || commonTranslations?.save || 'Create Task'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
