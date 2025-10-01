// Version: 4.0 - Added Phase 5 enhancements: accessibility, loading states, error recovery
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createGoal } from '@/lib/apiGoal';
import { goalCreateSchema, type GoalCreateInput } from '@/lib/validation/goalValidation';
import { useDebouncedValidation, registerFieldSchema } from '@/hooks/useDebouncedValidation';
import { 
  titleSchema, 
  deadlineSchema, 
  descriptionSchema, 
  categorySchema, 
  nlpAnswerSchema 
} from '@/lib/validation/goalValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Sparkles, Lightbulb, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import NLPQuestionsSection from './NLPQuestionsSection';
import GoalCategorySelector from './GoalCategorySelector';
import FieldTooltip from '@/components/ui/FieldTooltip';
import useFocusManagement from '@/hooks/useFocusManagement';
import { SkeletonFormSection, SkeletonNLPQuestions, SkeletonFormActions } from '@/components/ui/SkeletonFormField';
import NetworkErrorRecovery, { useNetworkStatus } from '@/components/ui/NetworkErrorRecovery';
import ARIALiveRegion, { useARIALiveAnnouncements, FormAnnouncements } from '@/components/ui/ARIALiveRegion';

interface GoalCreationFormProps {
  className?: string;
  onSuccess?: (goalId: string) => void;
  onCancel?: () => void;
}

const GoalCreationForm: React.FC<GoalCreationFormProps> = ({
  className = '',
  onSuccess,
  onCancel
}) => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  // Get translations
  const goalCreationTranslations = (t as any)?.goalCreation;
  const goalsTranslations = (t as any)?.goals;
  const commonTranslations = (t as any)?.common;

  // Network status and error recovery
  const { isOnline, hasError, errorMessage, setError: setNetworkError, clearError } = useNetworkStatus();

  // ARIA live announcements
  const { announce, clearAll } = useARIALiveAnnouncements();

  // Focus management
  const {
    containerRef,
    focusFirstError,
    focusFirst,
    handleKeyDown
  } = useFocusManagement({
    focusOnError: true,
    restoreFocus: true
  });

  // Register field schemas for debounced validation
  useEffect(() => {
    registerFieldSchema('title', titleSchema);
    registerFieldSchema('deadline', deadlineSchema);
    registerFieldSchema('description', descriptionSchema);
    registerFieldSchema('category', categorySchema);
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
    
    // Announce field change to screen readers
    if (value && value.trim().length > 0) {
      announce(FormAnnouncements.fieldSaved(fieldName), 'polite', 2000);
    }
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

  // Handle form submission
  const onSubmit = async (data: GoalCreateInput) => {
    console.log('Form submitted with data:', data);
    
    // Clear previous validation errors
    setHasValidationErrors(false);
    clearError();
    
    // Manual validation using Zod
    try {
      const validatedData = goalCreateSchema.parse(data);
      console.log('Validation passed:', validatedData);
    } catch (error: any) {
      console.log('Validation failed:', error);
      
      // Set validation error state
      setHasValidationErrors(true);
      
      // Handle validation errors
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const fieldPath = err.path.join('.');
          if (fieldPath.startsWith('nlpAnswers.')) {
            const nlpField = fieldPath.replace('nlpAnswers.', '');
            setError(`nlpAnswers.${nlpField}` as any, { 
              message: err.message 
            });
          } else {
            setError(fieldPath as any, { 
              message: err.message 
            });
          }
        });
        
        // Announce validation errors
        announce(FormAnnouncements.validationError('form'), 'assertive');
        
        // Focus first error field
        setTimeout(() => {
          focusFirstError();
        }, 100);
      }
      return;
    }
    
    try {
      setIsSubmitting(true);
      setIsLoading(true);
      
      // Announce loading state
      announce(FormAnnouncements.loading('Goal creation'), 'polite');
      
      console.log('Calling createGoal API...');
      const goalResponse = await createGoal(data);
      console.log('Goal created successfully:', goalResponse);
      
      // Clear any network errors
      clearError();
      
      // Announce success
      announce(FormAnnouncements.formSubmitted(), 'polite');
      
      toast({
        title: goalCreationTranslations?.messages?.success || 'Success',
        description: goalCreationTranslations?.messages?.goalCreated || 'Goal created successfully',
        variant: 'default'
      });

      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(goalResponse.id);
      } else {
        navigate('/goals');
      }
    } catch (error: any) {
      console.error('Error creating goal:', error);
      
      // Set network error if it's a network issue
      if (!navigator.onLine || error.name === 'NetworkError' || error.message.includes('fetch')) {
        setNetworkError('Network error occurred. Please check your connection and try again.');
        announce(FormAnnouncements.networkError(), 'assertive');
      }
      
      // Parse API error response
      let errorMessage = error?.message || 'Failed to create goal';
      let fieldErrors: { [key: string]: string } = {};
      
      console.log('Raw error:', error);
      console.log('Error message:', errorMessage);
      
      try {
        // Try to parse error response if it's a string
        if (typeof error?.message === 'string') {
          const parsedError = JSON.parse(error.message);
          console.log('Parsed error:', parsedError);
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
        if (field === 'deadline') {
          setError('deadline', { message });
        } else if (field === 'title') {
          setError('title', { message });
        } else if (field === 'description') {
          setError('description', { message });
        } else if (field === 'category') {
          setError('category', { message });
        } else if (field.startsWith('nlpAnswers.')) {
          const nlpField = field.replace('nlpAnswers.', '');
          setError(`nlpAnswers.${nlpField}` as any, { message });
        }
      });
      
      // If no specific field errors, check if it's a deadline error
      if (Object.keys(fieldErrors).length === 0 && errorMessage.includes('Deadline')) {
        console.log('Setting deadline error:', errorMessage);
        setError('deadline', { message: errorMessage });
      }
      
      // Announce form error
      announce(FormAnnouncements.formError(errorMessage), 'assertive');
      
      // Show toast for general errors or if no field-specific errors
      if (Object.keys(fieldErrors).length === 0 && !errorMessage.includes('Deadline')) {
        toast({
          title: goalCreationTranslations?.messages?.error || 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    reset();
    setImageUrl(null);
    setSuggestions([]);
    setHasValidationErrors(false);
    clearError();
    clearAll();
    
    // Clear all validation states
    clearFieldValidation('title');
    clearFieldValidation('deadline');
    clearFieldValidation('description');
    clearFieldValidation('category');
    clearFieldValidation('positive');
    clearFieldValidation('specific');
    clearFieldValidation('evidence');
    clearFieldValidation('resources');
    clearFieldValidation('obstacles');
    clearFieldValidation('ecology');
    clearFieldValidation('timeline');
    clearFieldValidation('firstStep');
    
    // Focus first field after reset
    setTimeout(() => {
      focusFirst();
    }, 100);
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/goals');
    }
  };

  // Handle network error retry
  const handleRetry = async () => {
    if (isSubmitting) return;
    
    // Retry the last form submission
    const formData = watchedValues;
    if (formData.title && formData.deadline) {
      await onSubmit(formData as GoalCreateInput);
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

  // AI Features
  const handleGenerateImage = async () => {
    try {
      setImageUrl(null);
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(base.replace(/\/$/, '') + '/ai/inspiration-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          text: `${watchedValues.title} ${watchedValues.description}`.trim(), 
          lang: language 
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.detail || 'AI image failed');
      setImageUrl(body.imageUrl || null);
    } catch (e: any) {
      toast({
        title: goalCreationTranslations?.messages?.aiImageFailed || 'AI image generation failed',
        description: String(e?.message || e),
        variant: 'destructive'
      });
    }
  };

  const handleSuggestImprovements = async () => {
    try {
      setSuggestions([]);
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(base.replace(/\/$/, '') + '/ai/suggest-improvements', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          text: `${watchedValues.title}\n${watchedValues.description}`.trim(), 
          lang: language 
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.detail || 'AI suggestions failed');
      setSuggestions(Array.isArray(body.suggestions) ? body.suggestions : []);
    } catch (e: any) {
      toast({
        title: goalCreationTranslations?.messages?.aiSuggestFailed || 'AI suggestions failed',
        description: String(e?.message || e),
        variant: 'destructive'
      });
    }
  };


  // Show loading skeleton if initial loading
  if (isLoading && !isSubmitting) {
    return (
      <div className={`max-w-4xl mx-auto p-4 space-y-6 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        <SkeletonFormSection fields={4} showTitle={true} />
        <SkeletonNLPQuestions questions={8} />
        <SkeletonFormActions buttons={3} />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`max-w-4xl mx-auto p-4 space-y-6 ${className}`}
      onKeyDown={handleKeyDown}
      role="main"
      aria-label="Goal creation form"
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
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            aria-label="Go back to goals list"
          >
            <ArrowLeft className="w-4 h-4" />
            {goalCreationTranslations?.actions?.backToGoals || 'Back to Goals'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {goalCreationTranslations?.title || 'Create New Goal'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {goalCreationTranslations?.subtitle || 'Set up a new goal with detailed planning'}
            </p>
          </div>
        </div>
      </div>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6" 
        data-testid="goal-creation-form"
        role="form"
        aria-label="Goal creation form"
        noValidate
      >
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {goalCreationTranslations?.sections?.basicInfo || 'Basic Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="goal-title" className="text-sm font-medium">
                  {goalCreationTranslations?.fields?.title || 'Title'}
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
                  {goalCreationTranslations?.fields?.description || 'Description'}
                </Label>
                <FieldTooltip
                  targetId="goal-description"
                  fieldLabel={goalCreationTranslations?.fields?.description || 'Description'}
                  hint={goalCreationTranslations?.hints?.description}
                  iconLabelTemplate={goalCreationTranslations?.hints?.iconLabel}
                />
              </div>
              <div className="relative">
                <Textarea
                  id="goal-description"
                  {...register('description', {
                    onChange: (e) => handleFieldChange('description', e.target.value)
                  })}
                  placeholder={goalCreationTranslations?.placeholders?.description || 'Describe your goal in detail'}
                  rows={4}
                  className={`pr-10 ${errors.description || getFieldError('description') ? 'border-destructive' : isFieldValid('description') ? 'border-green-500' : ''}`}
                  aria-invalid={!!(errors.description || getFieldError('description'))}
                />
                {/* Validation status icon */}
                <div className="absolute right-3 top-3">
                  {isFieldValidating('description') ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isFieldValid('description') ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : getFieldError('description') ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
              {(errors.description || getFieldError('description')) && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.description?.message || getFieldError('description')}
                </p>
              )}
            </div>

            {/* Deadline Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="goal-deadline" className="text-sm font-medium">
                  {goalCreationTranslations?.fields?.deadline || 'Deadline'}
                </Label>
                <FieldTooltip
                  targetId="goal-deadline"
                  fieldLabel={goalCreationTranslations?.fields?.deadline || 'Deadline'}
                  hint={goalCreationTranslations?.hints?.deadline}
                  iconLabelTemplate={goalCreationTranslations?.hints?.iconLabel}
                />
              </div>
              <div className="relative">
                <Input
                  id="goal-deadline"
                  type="date"
                  {...register('deadline', {
                    onChange: (e) => handleFieldChange('deadline', e.target.value)
                  })}
                  className={`pr-10 ${errors.deadline || getFieldError('deadline') ? 'border-destructive' : isFieldValid('deadline') ? 'border-green-500' : ''}`}
                  aria-invalid={!!(errors.deadline || getFieldError('deadline'))}
                />
                {/* Validation status icon */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isFieldValidating('deadline') ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isFieldValid('deadline') ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : getFieldError('deadline') ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
              {(errors.deadline || getFieldError('deadline')) && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.deadline?.message || getFieldError('deadline')}
                </p>
              )}
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <GoalCategorySelector
                value={watchedValues.category || ''}
                onValueChange={handleCategoryChange}
                error={errors.category?.message || getFieldError('category')}
                placeholder={goalCreationTranslations?.placeholders?.category || 'Select a category'}
                isFieldValidating={isFieldValidating('category')}
                isFieldValid={isFieldValid('category')}
              />
            </div>
          </CardContent>
        </Card>

        {/* NLP Questions Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {goalCreationTranslations?.sections?.nlpQuestions || 'Well-formed Outcome (NLP)'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {goalCreationTranslations?.sections?.nlpSubtitle || 'Answer these questions to clarify and strengthen your goal.'}
            </p>
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

        {/* AI Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {goalCreationTranslations?.sections?.aiFeatures || 'AI-Powered Features'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {goalCreationTranslations?.sections?.aiSubtitle || 'Get inspiration and suggestions for your goal.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateImage}
                disabled={!watchedValues.title || isSubmitting}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {goalCreationTranslations?.actions?.generateImage || 'Generate Image'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSuggestImprovements}
                disabled={!watchedValues.title || isSubmitting}
                className="flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                {goalCreationTranslations?.actions?.suggestImprovements || 'Suggest Improvements'}
              </Button>
            </div>

            {/* AI Results */}
            {imageUrl && (
              <div className="space-y-2">
                <h4 className="font-medium">
                  {goalCreationTranslations?.aiResults?.imageTitle || 'Inspirational Image'}
                </h4>
                <img 
                  alt="Goal inspiration" 
                  src={imageUrl} 
                  className="rounded border max-h-64 object-cover w-full"
                />
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">
                  {goalCreationTranslations?.aiResults?.suggestionsTitle || 'AI Suggestions'}
                </h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  {suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting || isLoading}
                aria-label="Reset form to initial state"
              >
                {goalCreationTranslations?.actions?.reset || 'Reset'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isLoading}
                aria-label="Cancel goal creation and return to goals list"
              >
                {goalCreationTranslations?.actions?.cancel || 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || hasValidationErrors}
                className="flex items-center gap-2"
                aria-describedby={hasValidationErrors ? "form-validation-errors" : undefined}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {goalCreationTranslations?.actions?.creating || 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {goalCreationTranslations?.actions?.createGoal || 'Create Goal'}
                  </>
                )}
              </Button>
            </div>
            
            {/* Form validation summary */}
            {hasValidationErrors && (
              <div 
                id="form-validation-errors"
                className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm text-destructive font-medium">
                  Please fix the validation errors above before submitting the form.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default GoalCreationForm;
