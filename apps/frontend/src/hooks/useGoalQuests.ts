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

import { useMemo, useState, useCallback, useEffect } from 'react';
import { loadQuests } from '@/lib/apiQuest';
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
    onAnnounce,
    ...questOptions
  } = options;

  // State management
  const [goalQuests, setGoalQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, any>>({});
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // Load quests for this specific goal
  const loadGoalQuests = useCallback(async () => {
    if (!goalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the new endpoint with goalId
      const questsData = await loadQuests(goalId);
      setGoalQuests(questsData);
      onAnnounce?.('Goal quests loaded successfully', 'polite');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load goal quests';
      setError(errorMessage);
      onAnnounce?.(errorMessage, 'assertive');
    } finally {
      setLoading(false);
    }
  }, [goalId, onAnnounce]);

  // Auto-load quests when component mounts or goalId changes
  useEffect(() => {
    if (autoLoad && goalId) {
      loadGoalQuests();
    }
  }, [autoLoad, goalId, loadGoalQuests]);

  const questCount = goalQuests.length;

  // Placeholder functions for quest operations (these would need to be implemented)
  const createQuest = useCallback(async (input: QuestCreateInput): Promise<Quest> => {
    // TODO: Implement quest creation
    throw new Error('Quest creation not implemented yet');
  }, []);

  const startQuest = useCallback(async (questId: string): Promise<void> => {
    // TODO: Implement quest start
    throw new Error('Quest start not implemented yet');
  }, []);

  const editQuest = useCallback(async (questId: string, updates: QuestUpdateInput): Promise<void> => {
    // TODO: Implement quest edit
    throw new Error('Quest edit not implemented yet');
  }, []);

  const cancelQuest = useCallback(async (questId: string, reason?: string): Promise<void> => {
    // TODO: Implement quest cancel
    throw new Error('Quest cancel not implemented yet');
  }, []);

  const failQuest = useCallback(async (questId: string, reason?: string): Promise<void> => {
    // TODO: Implement quest fail
    throw new Error('Quest fail not implemented yet');
  }, []);

  const deleteQuest = useCallback(async (questId: string): Promise<void> => {
    // TODO: Implement quest delete
    throw new Error('Quest delete not implemented yet');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setLoadingState = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const selectQuest = useCallback((quest: Quest | null) => {
    setSelectedQuest(quest);
  }, []);

  const validateField = useCallback(async (field: string, value: any): Promise<void> => {
    // TODO: Implement field validation
  }, []);

  const clearFieldValidation = useCallback((field: string) => {
    setValidationErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const isFormValid = !hasValidationErrors;

  return {
    // Data
    quests: goalQuests, // For compatibility
    goalQuests,
    questCount,

    // States
    loading,
    error,
    loadingStates,
    validationErrors,
    hasValidationErrors,
    selectedQuest,

    // Actions
    refresh: loadGoalQuests,
    clearError,
    setLoadingState,

    // Quest Operations
    createQuest,
    startQuest,
    editQuest,
    cancelQuest,
    failQuest,
    deleteQuest,

    // Selection
    selectQuest,

    // Validation
    validateField,
    clearFieldValidation,
    isFormValid,
  };
};
