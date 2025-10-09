/**
 * Goal Quests Hook for GoalsGuild Application
 *
 * This hook provides quest management specifically for goals, wrapping the main
 * useQuests hook with goal-specific filtering and functionality.
 *
 * Exports:
 * - useGoalQuests(goalId, options) - Load and manage quests for a specific goal
 *
 * Features:
 * - Automatic goalId filtering
 * - Goal-specific quest operations
 * - Integration with goal context
 * - All standard quest hook features (loading states, error handling, etc.)
 */

import { useMemo } from 'react';
import { useQuests } from './useQuest';
import type { Quest, QuestCreateInput, QuestUpdateInput } from '@/models/quest';
import type { QuestHookOptions } from './useQuest';

interface UseGoalQuestsOptions extends QuestHookOptions {
  goalId: string;
  autoLoad?: boolean;
}

interface UseGoalQuestsReturn {
  // Data
  quests: Quest[];
  goalQuests: Quest[];
  questCount: number;

  // States
  loading: boolean;
  error: string | null;
  loadingStates: Record<string, boolean>;
  validationErrors: Record<string, any>;
  hasValidationErrors: boolean;
  selectedQuest: Quest | null;

  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
  setLoadingState: (key: string, loading: boolean) => void;

  // Quest Operations
  createQuest: (input: QuestCreateInput) => Promise<Quest>;
  startQuest: (questId: string) => Promise<void>;
  editQuest: (questId: string, updates: QuestUpdateInput) => Promise<void>;
  cancelQuest: (questId: string, reason?: string) => Promise<void>;
  failQuest: (questId: string, reason?: string) => Promise<void>;
  deleteQuest: (questId: string) => Promise<void>;

  // Selection
  selectQuest: (quest: Quest | null) => void;

  // Validation
  validateField: (field: string, value: any) => Promise<void>;
  clearFieldValidation: (field: string) => void;
  isFormValid: boolean;
}

/**
 * Hook for managing quests associated with a specific goal
 *
 * @param goalId - The ID of the goal to load quests for
 * @param options - Additional hook options
 * @returns Quest management interface for the goal
 */
export const useGoalQuests = (
  goalId: string,
  options: Omit<UseGoalQuestsOptions, 'goalId'> = {}
): UseGoalQuestsReturn => {
  const {
    autoLoad = true,
    ...questOptions
  } = options;

  // Use the main quests hook WITHOUT goalId filtering (backend doesn't support it)
  const questHook = useQuests({
    autoLoad,
    ...questOptions,
  });

  // Filter quests client-side to ensure only those for this goal
  const goalQuests = useMemo(() => {
    return questHook.quests.filter(quest => quest.linkedGoalIds?.includes(goalId));
  }, [questHook.quests, goalId]);

  const questCount = goalQuests.length;

  return {
    // Data
    quests: questHook.quests,
    goalQuests,
    questCount,

    // States
    loading: questHook.loading,
    error: questHook.error,
    loadingStates: questHook.loadingStates,
    validationErrors: questHook.validationErrors,
    hasValidationErrors: questHook.hasValidationErrors,
    selectedQuest: questHook.selectedQuest,

    // Actions
    refresh: questHook.refresh,
    clearError: questHook.clearError,
    setLoadingState: questHook.setLoadingState,

    // Quest Operations
    createQuest: questHook.createQuest,
    startQuest: questHook.startQuest,
    editQuest: questHook.editQuest,
    cancelQuest: questHook.cancelQuest,
    failQuest: questHook.failQuest,
    deleteQuest: questHook.deleteQuest,

    // Selection
    selectQuest: questHook.selectQuest,

    // Validation
    validateField: questHook.validateField,
    clearFieldValidation: questHook.clearFieldValidation,
    isFormValid: questHook.isFormValid,
  };
};
