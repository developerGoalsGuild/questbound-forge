// Version: 4.0 - Modernized layout with inline tasks (no modals)
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getGoal, updateGoal } from '@/lib/apiGoal';
import { loadTasks as loadTasksApi, createTask as createTaskApi, updateTask, deleteTask } from '@/lib/apiTask';
import { type TaskResponse } from '@/lib/apiTask';
import { goalCreateSchema, type GoalCreateInput } from '@/lib/validation/goalValidation';
import { useDebouncedValidation, registerFieldSchema } from '@/hooks/useDebouncedValidation';
import { 
  titleSchema, 
  deadlineSchema, 
  descriptionSchema, 
  categorySchema, 
  tagsSchema,
  nlpAnswerSchema 
} from '@/lib/validation/goalValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import NLPQuestionsSection from './NLPQuestionsSection';
import GoalCategorySelector from './GoalCategorySelector';
import TagsInput from './TagsInput';
import FieldTooltip from '@/components/ui/FieldTooltip';
import TasksListInline from '@/components/goals/TasksListInline';
import { logger } from '@/lib/logger';

interface GoalEditFormProps {
  goalId: string;
  onSuccess?: (goalId: string) => void;
  onCancel?: () => void;
  className?: string;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({
  goalId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [goalDeadline, setGoalDeadline] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);

  // Get translations
  const goalEditTranslations = (t as any)?.goalEdit;
  const goalCreationTranslations = (t as any)?.goalCreation;
  const goalsTranslations = (t as any)?.goals;
  const commonTranslations = (t as any)?.common;

  // Register field schemas for debounced validation
  useEffect(() => {
    registerFieldSchema('title', titleSchema);
    registerFieldSchema('deadline', deadlineSchema);
    registerFieldSchema('description', descriptionSchema);
    registerFieldSchema('category', categorySchema);
    registerFieldSchema('tags', tagsSchema);
    registerFieldSchema('positive', nlpAnswerSchema);
    registerFieldSchema('specific', nlpAnswerSchema);
    registerFieldSchema('evidence', nlpAnswerSchema);
    registerFieldSchema('resources', nlpAnswerSchema);
    registerFieldSchema('obstacles', nlpAnswerSchema);
    registerFieldSchema('ecology', nlpAnswerSchema);
    registerFieldSchema('timeline', nlpAnswerSchema);
    registerFieldSchema('firstStep', nlpAnswerSchema);
  }, []);

  // Initialize debounced validation
  const {
    debouncedValidateField,
    clearFieldValidation,
    isFieldValidating,
    getFieldError,
    isFieldValid,
    isFormValid,
    getValidationSummary
  } = useDebouncedValidation({
    debounceMs: 500,
    validateOnMount: false,
    enableServerValidation: false,
  });

  // Form setup with React Hook Form (no automatic validation)
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
    trigger,
    setError
  } = useForm<GoalCreateInput>({
    mode: 'onSubmit', // Only validate on submit to prevent initial validation errors
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      category: '',
      tags: [],
      nlpAnswers: {
        positive: '',
        specific: '',
        evidence: '',
        resources: '',
        obstacles: '',
        ecology: '',
        timeline: '',
        firstStep: ''
      }
    }
  });

  // Watch form values for real-time updates
  const watchedValues = watch();
  const nlpAnswers = watchedValues.nlpAnswers || {
    positive: '',
    specific: '',
    evidence: '',
    resources: '',
    obstacles: '',
    ecology: '',
    timeline: '',
    firstStep: ''
  };

  // Handle field changes with debounced validation
  const handleFieldChange = (fieldName: string, value: any) => {
    // Clear any existing validation for this field
    clearFieldValidation(fieldName);
    
    // Trigger debounced validation
    debouncedValidateField(fieldName, value);
  };

  // Handle NLP answers change with validation
  const handleNLPAnswersChange = (answers: typeof nlpAnswers) => {
    setValue('nlpAnswers', answers, { shouldValidate: false });
    
    // Validate each NLP answer individually
    Object.entries(answers).forEach(([key, value]) => {
      if (value && value.trim().length > 0) {
        handleFieldChange(key, value);
      }
    });
  };

  // Handle category change with validation
  const handleCategoryChange = (category: string) => {
    setValue('category', category, { shouldValidate: false });
    handleFieldChange('category', category);
  };

  // Handle tags change with validation
  const handleTagsChange = (tags: string[]) => {
    setValue('tags', tags, { shouldValidate: false });
    
    // Clear any existing validation for tags
    clearFieldValidation('tags');
    
    // Trigger debounced validation for tags array
    debouncedValidateField('tags', tags);
  };


  // Load goal data for editing
  useEffect(() => {
    const loadGoalData = async () => {
      try {
        setIsLoading(true);
        const goalData = await getGoal(goalId);
        
        // Pre-fill form with goal data
        setValue('title', goalData.title || '', { shouldValidate: false });
        setValue('description', goalData.description || '', { shouldValidate: false });
        
        // Format deadline for date input
        if (goalData.deadline) {
          const deadlineDate = new Date(goalData.deadline + 'T00:00:00Z');
          const formattedDeadline = deadlineDate.toISOString().split('T')[0];
          setValue('deadline', formattedDeadline, { shouldValidate: false });
          setGoalDeadline(formattedDeadline);
        }
        
        // Set category
        if (goalData.category) {
          setValue('category', goalData.category, { shouldValidate: false });
        }
        
        // Set tags
        if (goalData.tags && Array.isArray(goalData.tags)) {
          setValue('tags', goalData.tags, { shouldValidate: false });
        }
        
        // Convert answers array to object
        const answersObj: any = {
          positive: '',
          specific: '',
          evidence: '',
          resources: '',
          obstacles: '',
          ecology: '',
          timeline: '',
          firstStep: ''
        };
        if (goalData.answers && Array.isArray(goalData.answers)) {
          goalData.answers.forEach((answer: any) => {
            if (answer.key && answer.answer) {
              answersObj[answer.key] = answer.answer;
            }
          });
        }
        setValue('nlpAnswers', answersObj, { shouldValidate: false });
        
      } catch (error: any) {
        logger.error('Error loading goal data for editing', { goalId, error });
        
        // Parse API error response
        let errorMessage = error?.message || 'Failed to load goal data';
        
        try {
          if (typeof error?.message === 'string') {
            const parsedError = JSON.parse(error.message);
            if (parsedError.message) {
              errorMessage = parsedError.message;
            }
          }
        } catch (parseError) {
          logger.warn('Could not parse goal loading error response', { parseError });
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        
        if (onCancel) {
          onCancel();
        } else {
          navigate('/goals');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (goalId) {
      loadGoalData();
      loadGoalTasks();
    }
  }, [goalId, setValue, toast, navigate, onCancel]);

  // Load tasks for the goal
  const loadGoalTasks = async () => {
    try {
      const tasksData = await loadTasksApi(goalId);
      setTasks(Array.isArray(tasksData) ? tasksData : tasksData ? [tasksData] : []);
    } catch (error: any) {
      logger.error('Error loading tasks', { goalId, error });
      setTasks([]);
    }
  };

  // Task handlers
  const handleCreateTask = async (taskData: {
    title: string;
    dueAt: string;
    tags: string[];
    status: string;
  }) => {
    try {
      const dueAtEpoch = toEpochSeconds(taskData.dueAt);
      await createTaskApi({
        goalId,
        title: taskData.title,
        dueAt: dueAtEpoch,
        tags: taskData.tags,
        status: taskData.status
      });
      await loadGoalTasks();
      toast({
        title: 'Success',
        description: 'Task created successfully',
        variant: 'default'
      });
    } catch (error: any) {
      logger.error('Error creating task', { goalId, error });
      throw error;
    }
  };

  const handleUpdateTask = async (task: TaskResponse) => {
    try {
      await updateTask(task.id, {
        title: task.title,
        dueAt: task.dueAt,
        tags: task.tags,
        status: task.status,
        goalId: task.goalId
      });
      await loadGoalTasks();
      toast({
        title: 'Success',
        description: 'Task updated successfully',
        variant: 'default'
      });
    } catch (error: any) {
      logger.error('Error updating task', { taskId: task.id, error });
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await loadGoalTasks();
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
        variant: 'default'
      });
    } catch (error: any) {
      logger.error('Error deleting task', { taskId, error });
      throw error;
    }
  };

  const toEpochSeconds = (input: string): number => {
    const dateOnlyMatch = input.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateOnlyMatch) {
      const [year, month, day] = input.split('-').map(n => Number(n));
      const ms = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
      return Math.floor(ms / 1000);
    }
    return Math.floor(new Date(input).getTime() / 1000);
  };

  // Handle form submission
  const onSubmit = async (data: GoalCreateInput) => {
    logger.debug('Goal edit form submitted', { goalId, data });
    
    // Manual validation using Zod
    try {
      const validatedData = goalCreateSchema.parse(data);
      logger.debug('Goal edit validation passed', { validatedData });
    } catch (error: any) {
      logger.warn('Goal edit validation failed', { error });
      
      // Handle validation errors
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const fieldPath = err.path.join('.');
          if (fieldPath.startsWith('nlpAnswers.')) {
            const nlpField = fieldPath.replace('nlpAnswers.', '');
            setError(`nlpAnswers.${nlpField}` as any, { 
              type: 'validation', 
              message: err.message 
            });
          } else {
            setError(fieldPath as any, { 
              type: 'validation', 
              message: err.message 
            });
          }
        });
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert deadline to epoch seconds for API compatibility
      let deadlineNum: number | undefined = undefined;
      if (data.deadline) {
        const dateOnlyMatch = data.deadline.match(/^\d{4}-\d{2}-\d{2}$/);
        if (dateOnlyMatch) {
          const [year, month, day] = data.deadline.split('-').map(n => Number(n));
          const ms = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
          deadlineNum = Math.floor(ms / 1000);
        } else {
          deadlineNum = Math.floor(new Date(data.deadline).getTime() / 1000);
        }
      }

      // Update existing goal
      const updateData = {
        title: data.title,
        description: data.description,
        deadline: deadlineNum,
        category: data.category,
        tags: data.tags,
        nlpAnswers: data.nlpAnswers,
      };
      
      await updateGoal(goalId, updateData);
      
      toast({
        title: 'Success',
        description: 'Goal updated successfully',
        variant: 'default'
      });
      
      if (onSuccess) {
        onSuccess(goalId);
      } else {
        navigate('/goals');
      }
    } catch (error: any) {
      logger.error('Error updating goal', { goalId, error });
      
      // Parse API error response for field-specific errors
      let errorMessage = error?.message || 'Failed to update goal';
      let fieldErrors: { [key: string]: string } = {};
      
      logger.debug('Raw goal update error', { rawError: error });
      logger.debug('Goal update error message', { errorMessage });
      
      try {
        if (typeof error?.message === 'string') {
          const parsedError = JSON.parse(error.message);
          logger.debug('Parsed goal update error', { parsedError });
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
          if (parsedError.field_errors) {
            fieldErrors = parsedError.field_errors;
          }
        }
      } catch (parseError) {
        logger.warn('Could not parse goal update error response', { parseError });
      }
      
      // Set field-specific errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        logger.debug(`Setting field error for ${field}`, { message });
        if (field === 'deadline') {
          setError('deadline', { type: 'server', message });
        } else if (field === 'title') {
          setError('title', { type: 'server', message });
        } else if (field === 'description') {
          setError('description', { type: 'server', message });
        } else if (field === 'category') {
          setError('category', { type: 'server', message });
        } else if (field === 'tags') {
          setError('tags', { type: 'server', message });
        } else if (field.startsWith('nlpAnswers.')) {
          const nlpField = field.replace('nlpAnswers.', '');
          setError(`nlpAnswers.${nlpField}` as any, { type: 'server', message });
        }
      });
      
      // Special handling for deadline errors
      if (Object.keys(fieldErrors).length === 0 && errorMessage.includes('Deadline')) {
        logger.debug('Setting deadline error from general message', { errorMessage });
        setError('deadline', { type: 'server', message: errorMessage });
      }
      
      // Show general error toast if no field-specific errors
      if (Object.keys(fieldErrors).length === 0 && !errorMessage.includes('Deadline')) {
        toast({
          title: goalCreationTranslations?.messages?.error || 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    reset();
    // Clear all validation states
    clearFieldValidation('title');
    clearFieldValidation('deadline');
    clearFieldValidation('description');
    clearFieldValidation('category');
    clearFieldValidation('tags');
    clearFieldValidation('positive');
    clearFieldValidation('specific');
    clearFieldValidation('evidence');
    clearFieldValidation('resources');
    clearFieldValidation('obstacles');
    clearFieldValidation('ecology');
    clearFieldValidation('timeline');
    clearFieldValidation('firstStep');
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/goals');
    }
  };


  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading goal data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{commonTranslations?.back || 'Back'}</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {goalEditTranslations?.title || 'Edit Goal'}
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {goalEditTranslations?.subtitle || 'Update your goal details and planning'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="goal-edit-form">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {goalCreationTranslations?.sections?.basicInfo || 'Basic Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="goal-title" className="text-sm font-medium">
                  {goalEditTranslations?.form?.title?.label || goalCreationTranslations?.fields?.title || 'Title'}
                </Label>
                <FieldTooltip
                  targetId="goal-title"
                  fieldLabel={goalCreationTranslations?.fields?.title || 'Title'}
                  hint={goalCreationTranslations?.hints?.title}
                  iconLabelTemplate={goalCreationTranslations?.hints?.iconLabel}
                />
              </div>
              <div className="relative">
                <Input
                  id="goal-title"
                  {...register('title', {
                    onChange: (e) => handleFieldChange('title', e.target.value)
                  })}
                  placeholder={goalCreationTranslations?.placeholders?.title || 'Enter your goal title'}
                  className={`pr-10 ${errors.title || getFieldError('title') ? 'border-destructive' : isFieldValid('title') ? 'border-green-500' : ''}`}
                  aria-invalid={!!(errors.title || getFieldError('title'))}
                />
                {/* Validation status icon */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isFieldValidating('title') ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isFieldValid('title') ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : getFieldError('title') ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
              {(errors.title || getFieldError('title')) && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.title?.message || getFieldError('title')}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="goal-description" className="text-sm font-medium">
                  {goalEditTranslations?.form?.description?.label || goalCreationTranslations?.fields?.description || 'Description'}
                </Label>
                <FieldTooltip
                  targetId="goal-description"
                  fieldLabel={goalCreationTranslations?.fields?.description || 'Description'}
                  hint={goalCreationTranslations?.hints?.description}
                  iconLabelTemplate={goalCreationTranslations?.hints?.iconLabel}
                />
              </div>
              <Textarea
                id="goal-description"
                {...register('description')}
                placeholder={goalCreationTranslations?.placeholders?.description || 'Describe your goal in detail'}
                className={errors.description ? 'border-destructive' : ''}
                aria-invalid={!!errors.description}
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Deadline Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="goal-deadline" className="text-sm font-medium">
                  {goalEditTranslations?.form?.deadline?.label || goalCreationTranslations?.fields?.deadline || 'Deadline'}
                </Label>
                <FieldTooltip
                  targetId="goal-deadline"
                  fieldLabel={goalCreationTranslations?.fields?.deadline || 'Deadline'}
                  hint={goalCreationTranslations?.hints?.deadline}
                  iconLabelTemplate={goalCreationTranslations?.hints?.iconLabel}
                />
              </div>
              <Input
                id="goal-deadline"
                type="date"
                {...register('deadline')}
                className={errors.deadline ? 'border-destructive' : ''}
                aria-invalid={!!errors.deadline}
              />
              {errors.deadline && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.deadline.message}
                </p>
              )}
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="goal-category" className="text-sm font-medium">
                  {goalEditTranslations?.form?.category?.label || goalCreationTranslations?.fields?.category || 'Category'}
                </Label>
                <FieldTooltip
                  targetId="goal-category"
                  fieldLabel={goalCreationTranslations?.fields?.category || 'Category'}
                  hint={goalCreationTranslations?.hints?.category}
                  iconLabelTemplate={goalCreationTranslations?.hints?.iconLabel}
                />
              </div>
              <GoalCategorySelector
                value={watchedValues.category || ''}
                onValueChange={handleCategoryChange}
                error={errors.category?.message || getFieldError('category')}
                placeholder={goalCreationTranslations?.placeholders?.category || 'Select a category'}
                isFieldValidating={isFieldValidating('category')}
                isFieldValid={isFieldValid('category')}
              />
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <TagsInput
                value={watchedValues.tags || []}
                onChange={handleTagsChange}
                error={errors.tags?.message || getFieldError('tags')}
                placeholder={goalCreationTranslations?.placeholders?.tags || 'Add tags and press Enter'}
                isFieldValidating={isFieldValidating('tags')}
                isFieldValid={isFieldValid('tags')}
                maxTags={10}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Goal Contract Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {goalCreationTranslations?.sections?.nlpQuestions || 'Goal Contract'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NLPQuestionsSection
              answers={nlpAnswers}
              onAnswersChange={handleNLPAnswersChange}
              errors={{
                ...errors.nlpAnswers,
                positive: getFieldError('positive'),
                specific: getFieldError('specific'),
                evidence: getFieldError('evidence'),
                resources: getFieldError('resources'),
                obstacles: getFieldError('obstacles'),
                ecology: getFieldError('ecology'),
                timeline: getFieldError('timeline'),
                firstStep: getFieldError('firstStep'),
              }}
              isFieldValidating={isFieldValidating}
              isFieldValid={isFieldValid}
            />
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {goalsTranslations?.tasks?.title || 'Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TasksListInline
              tasks={tasks}
              goalId={goalId}
              goalDeadline={goalDeadline}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCreateTask={handleCreateTask}
              canEdit={true}
              canDelete={true}
              canCreate={true}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
            className="order-2 sm:order-1"
          >
            {commonTranslations?.reset || 'Reset'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="order-3 sm:order-2"
          >
            {commonTranslations?.cancel || 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="order-1 sm:order-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {commonTranslations?.loading || 'Updating...'}
              </>
            ) : (
              goalEditTranslations?.actions?.save || goalCreationTranslations?.actions?.updateGoal || 'Update Goal'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GoalEditForm;
