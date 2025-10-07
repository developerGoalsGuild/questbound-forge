/**
 * QuestCreateForm Component
 * 
 * Multi-step wizard form for creating new quests with comprehensive validation,
 * accessibility features, and internationalization support.
 * 
 * Refactored to use separate step components and custom hook for better maintainability.
 */

import React, { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestCreateForm } from '@/hooks/useQuestCreateForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import BasicInfoStep from './steps/BasicInfoStep';
import AdvancedOptionsStep from './steps/AdvancedOptionsStep';
import ReviewStep from './steps/ReviewStep';
import { AlertCircle, Loader2 } from 'lucide-react';

interface QuestCreateFormProps {
  onSuccess?: (quest: any) => void;
  onCancel?: () => void;
  initialData?: Partial<any>;
  goalId?: string;
  className?: string;
}

export const QuestCreateForm: React.FC<QuestCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  goalId,
  className = ''
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;
  
  const {
    currentStep,
    formData,
    errors,
    goals,
    tasks,
    steps,
    progress,
    loading,
    error,
    handleFieldChange,
    handleGoalsChange,
    handleTasksChange,
    handleNext,
    handlePrevious,
    handleSubmit,
    loadGoalsAndTasks,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious
  } = useQuestCreateForm({
    initialData,
    goalId,
    onSuccess,
    onCancel
  });

  // Load goals and tasks on component mount
  useEffect(() => {
    loadGoalsAndTasks();
  }, [loadGoalsAndTasks]);

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      onFieldChange: handleFieldChange,
      onGoalsChange: handleGoalsChange,
      onTasksChange: handleTasksChange,
      goals,
      tasks,
      errors
    };

    switch (currentStep) {
      case 0:
        return <BasicInfoStep {...stepProps} onNext={handleNext} />;
      case 1:
        return <AdvancedOptionsStep {...stepProps} />;
      case 2:
        return <ReviewStep {...stepProps} />;
      default:
        return <BasicInfoStep {...stepProps} onNext={handleNext} />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {questTranslations?.title || 'Create New Quest'}
        </h2>
        <p className="text-muted-foreground">
          {questTranslations?.description || 'Create a new quest to track your progress and achieve your goals.'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            {questTranslations?.progress?.step || 'Step'} {currentStep + 1} {questTranslations?.progress?.of || 'of'} {steps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center space-x-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : index < currentStep
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              index === currentStep
                ? 'bg-primary-foreground text-primary'
                : index < currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted-foreground text-muted'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className="hidden sm:inline">{step.title}</span>
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
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <div className="flex space-x-2">
          {canGoPrevious && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={loading}
            >
              {questTranslations?.actions?.previous || 'Previous'}
            </Button>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              {questTranslations?.actions?.cancel || 'Cancel'}
            </Button>
          )}
        </div>

        <div className="flex space-x-2">
          {canGoNext ? (
            <Button
              onClick={handleNext}
              disabled={loading}
            >
              {questTranslations?.actions?.next || 'Next'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {questTranslations?.actions?.creating || 'Creating...'}
                </>
              ) : (
                questTranslations?.actions?.createQuest || 'Create Quest'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground text-center">
        {questTranslations?.help?.requiredFields || 'Fields marked with * are required'}
      </div>
    </div>
  );
};

export default QuestCreateForm;