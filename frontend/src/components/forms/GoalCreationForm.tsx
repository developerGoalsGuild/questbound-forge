// Version: 5.0 - Rewritten as step-by-step wizard (one NLP question at a time)
import React, { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useGoalCreateForm } from '@/hooks/useGoalCreateForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import BasicInfoStep from '@/components/goals/steps/BasicInfoStep';
import NLPQuestionStep from '@/components/goals/steps/NLPQuestionStep';
import ReviewStep from '@/components/goals/steps/ReviewStep';
import useFocusManagement from '@/hooks/useFocusManagement';
import NetworkErrorRecovery, { useNetworkStatus } from '@/components/ui/NetworkErrorRecovery';
import ARIALiveRegion, { useARIALiveAnnouncements, FormAnnouncements } from '@/components/ui/ARIALiveRegion';
import { logger } from '@/lib/logger';

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const goalCreationTranslations = (t as any)?.goalCreation;

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

  const {
    currentStep,
    formData,
    errors,
    steps,
    progress,
    loading,
    error,
    currentStepInfo,
    handleFieldChange,
    handleNext,
    handlePrevious,
    handleSubmit,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious
  } = useGoalCreateForm({
    onSuccess: async (goalId: string) => {
      clearError();
      announce(FormAnnouncements.formSubmitted(), 'polite');
      
      toast({
        title: goalCreationTranslations?.messages?.success || 'Success',
        description: goalCreationTranslations?.messages?.goalCreated || 'Goal created successfully',
        variant: 'default'
      });

      if (onSuccess) {
        onSuccess(goalId);
      } else {
        navigate('/goals');
      }
    },
    onCancel
  });

  // Handle network error retry
  const handleRetry = async () => {
    if (loading) return;
    if (isLastStep) {
      await handleSubmit();
    } else {
      handleNext();
    }
  };

  // Handle network status check
  const handleCheckStatus = async () => {
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      if (response.ok) {
        clearError();
        announce(FormAnnouncements.networkRestored(), 'polite');
      }
    } catch (error) {
      setNetworkError('Network connection still unavailable');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/goals');
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    const commonProps = {
      formData,
      onFieldChange: handleFieldChange,
      errors,
      onNext: canGoNext ? handleNext : undefined
    };

    if (currentStepInfo.type === 'basic') {
      return <BasicInfoStep {...commonProps} />;
    } else if (currentStepInfo.type === 'nlp' && currentStepInfo.questionKey) {
      return (
        <NLPQuestionStep
          {...commonProps}
          questionKey={currentStepInfo.questionKey}
        />
      );
    } else if (currentStepInfo.type === 'review') {
      return <ReviewStep formData={formData} errors={errors} />;
    }

    return null;
  };

  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-6 ${className}`}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Go back to goals list"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              {goalCreationTranslations?.actions?.backToGoals || 'Back to Goals'}
            </span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {goalCreationTranslations?.title || 'Create New Goal'}
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {goalCreationTranslations?.subtitle || 'Set up a new goal with detailed planning'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            {goalCreationTranslations?.progress?.step || 'Step'} {currentStep + 1} {goalCreationTranslations?.progress?.of || 'of'} {steps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators - Show only previous, current, and next step */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
        {steps
          .map((step, index) => ({ step, index }))
          .filter(({ index }) => {
            // Show previous step, current step, and next step only
            return index === currentStep - 1 || index === currentStep || index === currentStep + 1;
          })
          .map(({ step, index }) => (
            <div
              key={step.id}
              className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStep
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                index === currentStep
                  ? 'bg-primary-foreground text-primary'
                  : index < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted-foreground text-muted'
              }`}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span className="hidden sm:inline">{step.shortTitle || step.title}</span>
            </div>
          ))}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Step Content */}
      <div className="min-h-[300px] sm:min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
        <div className="flex gap-2">
          {canGoPrevious && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              {goalCreationTranslations?.actions?.previous || 'Previous'}
            </Button>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              {goalCreationTranslations?.actions?.cancel || 'Cancel'}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {canGoNext ? (
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              {goalCreationTranslations?.actions?.next || 'Next'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {goalCreationTranslations?.actions?.creating || 'Creating...'}
                </>
              ) : (
                goalCreationTranslations?.actions?.createGoal || 'Create Goal'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground text-center">
        {goalCreationTranslations?.help?.requiredFields || 'Fields marked with * are required'}
      </div>
    </div>
  );
};

export default GoalCreationForm;
