/**
 * useQuestCreateForm Hook
 * 
 * Custom hook for managing quest creation form state, validation, and submission.
 * Extracts complex form logic from the main QuestCreateForm component.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestCreate } from '@/hooks/useQuest';
import { loadGoals, type GoalResponse } from '@/lib/apiGoal';
import { loadTasks, type TaskResponse } from '@/lib/apiTask';
import { 
  type QuestCreateInput,
  type QuestDifficulty,
  type QuestPrivacy,
  type QuestKind,
  type QuestCountScope,
  type Quest
} from '@/models/quest';

export interface QuestCreateFormData {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  // Note: rewardXp is now auto-calculated by backend (not part of form data)
  privacy: QuestPrivacy;
  kind: QuestKind;
  tags: string[];
  deadline?: number;
  linkedGoalIds: string[];
  linkedTaskIds: string[];
  dependsOnQuestIds: string[];
  targetCount?: number;
  countScope?: QuestCountScope;
  periodDays?: number;
}

export interface QuestCreateFormErrors {
  [key: string]: string;
}

export interface UseQuestCreateFormProps {
  initialData?: Partial<QuestCreateFormData>;
  goalId?: string;
  onSuccess?: (quest: Quest) => void;
  onCancel?: () => void;
}

export const useQuestCreateForm = ({
  initialData,
  goalId,
  onSuccess,
  onCancel
}: UseQuestCreateFormProps = {}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;
  const { create, loading, error } = useQuestCreate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestCreateFormData>({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    privacy: 'public',
    kind: 'linked',
    tags: [],
    linkedGoalIds: [],
    linkedTaskIds: [],
    dependsOnQuestIds: [],
    countScope: 'completed_tasks',
    periodDays: 1,
    // Note: rewardXp is now auto-calculated by backend
    ...initialData
  });
  
  const [errors, setErrors] = useState<QuestCreateFormErrors>({});
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);

  const steps = [
    { id: 'basic', title: questTranslations?.steps?.basicInfo || 'Basic Info', component: 'BasicInfoStep' },
    { id: 'advanced', title: questTranslations?.steps?.advancedOptions || 'Advanced', component: 'AdvancedOptionsStep' },
    { id: 'review', title: questTranslations?.steps?.review || 'Review', component: 'ReviewStep' }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleFieldChange = useCallback((field: string, value: string | number | string[] | QuestDifficulty | QuestPrivacy | QuestKind | QuestCountScope) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Note: rewardXp is now auto-calculated by backend based on scope, period, and difficulty
      // No need to calculate it here
      
      return newData;
    });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const loadTasksForGoals = useCallback(async (goalIds: string[]) => {
    try {
      if (goalIds.length === 0) {
        setTasks([]);
        return;
      }
      
      // Load tasks for all selected goals
      const tasksPromises = goalIds.map(goalId => loadTasks(goalId));
      const tasksResults = await Promise.all(tasksPromises);
      
      // Flatten and deduplicate tasks
      const allTasks = tasksResults
        .flat()
        .filter((task, index, self) => 
          task && self.findIndex(t => t?.id === task.id) === index
        );
      
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load tasks for goals:', err);
      setTasks([]);
    }
  }, []);

  const handleGoalsChange = useCallback((goalIds: string[]) => {
    setFormData(prev => ({ ...prev, linkedGoalIds: goalIds }));
    
    // Load tasks for the selected goals
    loadTasksForGoals(goalIds);
  }, [loadTasksForGoals]);

  const handleTasksChange = useCallback((taskIds: string[]) => {
    setFormData(prev => ({ ...prev, linkedTaskIds: taskIds }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: QuestCreateFormErrors = {};

    if (step === 0) {
      // Basic info validation
      if (!formData.title?.trim()) {
        newErrors.title = questTranslations?.validation?.titleRequired || 'Title is required';
      }
      if (!formData.category?.trim()) {
        newErrors.category = questTranslations?.validation?.categoryRequired || 'Category is required';
      }
      if (!formData.difficulty) {
        newErrors.difficulty = questTranslations?.validation?.difficultyRequired || 'Difficulty is required';
      }
      // Reward XP is calculated automatically, no validation needed
    } else if (step === 1) {
      // Advanced options validation
      if (!formData.privacy) {
        newErrors.privacy = questTranslations?.validation?.privacyRequired || 'Privacy is required';
      }
      if (!formData.kind) {
        newErrors.kind = questTranslations?.validation?.kindRequired || 'Quest type is required';
      }
      
      // Quantitative quest validation
      if (formData.kind === 'quantitative') {
        if (!formData.targetCount || formData.targetCount <= 0) {
          newErrors.targetCount = questTranslations?.validation?.targetCountRequired || 'Target count is required';
        }
        if (!formData.periodDays || formData.periodDays <= 0) {
          newErrors.periodDays = questTranslations?.validation?.periodRequired || 'Period is required';
        }
      }
      
      // Linked quest validation
      if (formData.kind === 'linked') {
        if (!formData.linkedGoalIds?.length) {
          newErrors.linkedGoalIds = questTranslations?.validation?.linkedGoalsRequired || 'At least one goal is required for linked quests';
        }
        if (!formData.linkedTaskIds?.length) {
          newErrors.linkedTaskIds = questTranslations?.validation?.linkedTasksRequired || 'At least one task is required for linked quests';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, questTranslations]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [currentStep, validateStep, steps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      const questData: QuestCreateInput = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        // rewardXp is auto-calculated by backend
        privacy: formData.privacy,
        kind: formData.kind,
        // Only include arrays if they have content to avoid API errors
        tags: formData.tags?.length ? formData.tags : undefined,
        deadline: formData.deadline,
        linkedGoalIds: formData.linkedGoalIds?.length ? formData.linkedGoalIds : undefined,
        linkedTaskIds: formData.linkedTaskIds?.length ? formData.linkedTaskIds : undefined,
        dependsOnQuestIds: formData.dependsOnQuestIds?.length ? formData.dependsOnQuestIds : undefined,
        targetCount: formData.targetCount,
        countScope: formData.countScope,
        periodDays: formData.periodDays
      };

      const quest = await create(questData);
      onSuccess?.(quest);
    } catch (err) {
      console.error('Failed to create quest:', err);
    }
  }, [formData, currentStep, validateStep, create, onSuccess]);

  const loadGoalsAndTasks = useCallback(async () => {
    try {
      const goalsData = await loadGoals();
      setGoals(goalsData || []);
      // Don't load tasks initially - they will be loaded when goals are selected
      setTasks([]);
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  }, []);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = !isLastStep;
  const canGoPrevious = !isFirstStep;

  return {
    // State
    currentStep,
    formData,
    errors,
    goals,
    tasks,
    steps,
    progress,
    loading,
    error,
    
    // Actions
    handleFieldChange,
    handleGoalsChange,
    handleTasksChange,
    handleNext,
    handlePrevious,
    handleSubmit,
    loadGoalsAndTasks,
    loadTasksForGoals,
    
    // Computed
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious
  };
};
