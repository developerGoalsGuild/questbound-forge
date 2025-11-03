/**
 * useGoalCreateForm Hook
 * 
 * Custom hook for managing goal creation form state, validation, and submission.
 * Extracts complex form logic from the main GoalCreationForm component.
 * Implements a step-by-step wizard flow similar to quest creation.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { createGoal } from '@/lib/apiGoal';
import { nlpQuestionOrder, type NLPQuestionKey } from '@/pages/goals/questions';
import type { GoalCreateInput } from '@/lib/validation/goalValidation';
import { goalCreateSchema } from '@/lib/validation/goalValidation';

export interface GoalCreateFormData {
  title: string;
  description: string;
  deadline: string;
  category: string;
  tags: string[];
  nlpAnswers: {
    positive: string;
    specific: string;
    evidence: string;
    resources: string;
    obstacles: string;
    ecology: string;
    timeline: string;
    firstStep: string;
  };
}

export interface GoalCreateFormErrors {
  [key: string]: string;
}

export interface UseGoalCreateFormProps {
  initialData?: Partial<GoalCreateFormData>;
  onSuccess?: (goalId: string) => void;
  onCancel?: () => void;
}

export const useGoalCreateForm = ({
  initialData,
  onSuccess,
  onCancel
}: UseGoalCreateFormProps = {}) => {
  const { t } = useTranslation();
  const goalCreationTranslations = (t as any)?.goalCreation;
  const nlpTranslations = goalCreationTranslations?.nlp ?? {};
  const questions = nlpTranslations.questions ?? {};

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<GoalCreateFormData>({
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
      firstStep: '',
    },
    ...initialData
  });
  
  const [errors, setErrors] = useState<GoalCreateFormErrors>({});

  // Define steps: BasicInfo + 8 NLP questions + Review = 10 steps
  const shortTitles = goalCreationTranslations?.steps?.shortTitles || {};
  const steps = [
    { 
      id: 'basic', 
      title: goalCreationTranslations?.sections?.basicInfo || 'Basic Information',
      shortTitle: shortTitles.basic || 'Basic',
      type: 'basic'
    },
    ...nlpQuestionOrder.map((key, index) => {
      const fullQuestion = questions[key] || key;
      // Use localized short title from translations
      const shortTitle = shortTitles[key as keyof typeof shortTitles] || key.charAt(0).toUpperCase() + key.slice(1);
      return {
        id: `nlp-${key}`,
        title: fullQuestion,
        shortTitle,
        type: 'nlp' as const,
        questionKey: key as NLPQuestionKey,
        questionIndex: index
      };
    }),
    { 
      id: 'review', 
      title: goalCreationTranslations?.steps?.review || 'Review',
      shortTitle: shortTitles.review || 'Review',
      type: 'review'
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleFieldChange = useCallback((field: string, value: any) => {
    if (field.startsWith('nlpAnswers.')) {
      const nlpField = field.replace('nlpAnswers.', '') as NLPQuestionKey;
      setFormData(prev => ({
        ...prev,
        nlpAnswers: {
          ...prev.nlpAnswers,
          [nlpField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: GoalCreateFormErrors = {};
    const stepInfo = steps[step];

    if (stepInfo.type === 'basic') {
      // Basic info validation
      if (!formData.title?.trim()) {
        newErrors.title = goalCreationTranslations?.validation?.titleRequired || 'Title is required';
      } else if (formData.title.trim().length < 3) {
        newErrors.title = goalCreationTranslations?.validation?.titleMinLength || 'Title must be at least 3 characters';
      } else if (formData.title.trim().length > 100) {
        newErrors.title = goalCreationTranslations?.validation?.titleMaxLength || 'Title must be no more than 100 characters';
      }

      if (!formData.deadline?.trim()) {
        newErrors.deadline = goalCreationTranslations?.validation?.deadlineRequired || 'Deadline is required';
      } else {
        const deadlineDate = new Date(formData.deadline + 'T00:00:00Z');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(deadlineDate.getTime())) {
          newErrors.deadline = goalCreationTranslations?.validation?.deadlineInvalid || 'Invalid date format';
        } else if (deadlineDate < today) {
          newErrors.deadline = goalCreationTranslations?.validation?.deadlinePast || 'Deadline must be today or in the future';
        }
      }
    } else if (stepInfo.type === 'nlp' && stepInfo.questionKey) {
      // NLP question validation
      const answer = formData.nlpAnswers[stepInfo.questionKey];
      if (!answer || !answer.trim()) {
        newErrors[`nlpAnswers.${stepInfo.questionKey}`] = 
          goalCreationTranslations?.validation?.nlpAnswerRequired || 'Please provide an answer';
      } else if (answer.trim().length < 10) {
        newErrors[`nlpAnswers.${stepInfo.questionKey}`] = 
          goalCreationTranslations?.validation?.nlpAnswerMinLength || 'Answer must be at least 10 characters';
      } else if (answer.trim().length > 500) {
        newErrors[`nlpAnswers.${stepInfo.questionKey}`] = 
          goalCreationTranslations?.validation?.nlpAnswerMaxLength || 'Answer must be no more than 500 characters';
      }
    }
    // Review step doesn't need validation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, steps, goalCreationTranslations]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      setError(null);
    }
  }, [currentStep, validateStep, steps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // The deadline will be normalized in createGoal function
      // It accepts various formats (YYYY-MM-DD, locale formats, etc.) and converts to YYYY-MM-DD

      // Validate with Zod schema
      const goalData: GoalCreateInput = {
        title: formData.title,
        description: formData.description || '',
        deadline: formData.deadline, // Will be normalized in createGoal function
        category: formData.category || '',
        tags: formData.tags || [],
        nlpAnswers: formData.nlpAnswers
      };

      // Validate with Zod
      goalCreateSchema.parse(goalData);

      // Create goal - pass the deadline as string (will be normalized in createGoal)
      const goalResponse = await createGoal(goalData);

      onSuccess?.(goalResponse.id);
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      
      // Handle validation errors
      if (err.errors) {
        const validationErrors: GoalCreateFormErrors = {};
        err.errors.forEach((error: any) => {
          const fieldPath = error.path?.join('.') || error.path;
          validationErrors[fieldPath] = error.message;
        });
        setErrors(validationErrors);
        setError('Please fix the validation errors');
      } else {
        setError(err?.message || 'Failed to create goal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, currentStep, validateStep, onSuccess]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = !isLastStep;
  const canGoPrevious = !isFirstStep;

  const currentStepInfo = steps[currentStep];

  return {
    // State
    currentStep,
    formData,
    errors,
    steps,
    progress,
    loading,
    error,
    currentStepInfo,
    
    // Actions
    handleFieldChange,
    handleNext,
    handlePrevious,
    handleSubmit,
    
    // Computed
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious
  };
};

