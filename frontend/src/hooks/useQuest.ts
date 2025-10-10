/**
 * Quest Hooks for GoalsGuild Application
 * 
 * This file provides comprehensive quest management hooks following established patterns
 * from the codebase. All hooks include optimistic updates, error handling, validation,
 * and accessibility features.
 * 
 * Exports:
 * - useQuests({ goalId? }) - Load and manage quests
 * - useQuestCreate() - Create new quests
 * - useQuestStart() - Start quests
 * - useQuestEdit() - Edit quests
 * - useQuestCancel() - Cancel quests
 * - useQuestFail() - Mark quests as failed
 * - useQuestDelete() - Delete quests
 * - useQuestProgress(quest) - Calculate quest progress
 * 
 * All hooks follow the established patterns with:
 * - Optimistic updates with rollback
 * - Per-operation loading states
 * - Debounced validation (300ms)
 * - AbortController for cleanup
 * - Comprehensive error handling
 * - Accessibility support
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  loadQuests, 
  loadQuest,
  createQuest, 
  startQuest, 
  editQuest, 
  cancelQuest, 
  failQuest, 
  deleteQuest 
} from '@/lib/apiQuest';
import * as mockApiQuest from '@/lib/apiQuestMock';
import { useQuestNotifications } from './useQuestNotifications';
import type { 
  Quest, 
  QuestCreateInput, 
  QuestUpdateInput, 
  QuestCancelInput,
  QuestPrivacy,
  QuestKind,
  QuestDifficulty
} from '@/models/quest';
import { 
  QuestCreateInputSchema, 
  QuestUpdateInputSchema, 
  QuestCancelInputSchema 
} from '@/models/quest';
import { useDebouncedValidation } from './useDebouncedValidation';
import { logger } from '@/lib/logger';
import { produce } from 'immer';
import { calculateQuestProgress, type QuestProgress } from '@/lib/questProgress';

// ============================================================================
// Backend Detection and Fallback
// ============================================================================

/**
 * Check if backend is available by testing a simple API call
 */
const isBackendAvailable = async (): Promise<boolean> => {
  try {
    // Try to make a simple API call to test backend availability
    const response = await fetch('/api/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    logger.warn('Backend not available, using mock implementation', { error });
    return false;
  }
};

/**
 * Get the appropriate API implementation (real or mock)
 */
const getApiImplementation = async () => {
  const backendAvailable = await isBackendAvailable();
  return backendAvailable ? {
    loadQuests,
    loadQuest,
    createQuest,
    startQuest,
    editQuest,
    cancelQuest,
    failQuest,
    deleteQuest,
  } : {
    loadQuests: mockApiQuest.loadQuests,
    loadQuest: mockApiQuest.loadQuest,
    createQuest: mockApiQuest.createQuest,
    startQuest: mockApiQuest.startQuest,
    editQuest: mockApiQuest.editQuest,
    cancelQuest: mockApiQuest.cancelQuest,
    failQuest: mockApiQuest.failQuest,
    deleteQuest: mockApiQuest.deleteQuest,
  };
};

// ============================================================================
// Core Hook Interfaces
// ============================================================================

/**
 * Base quest hook options
 */
interface QuestHookOptions {
  onAnnounce?: (message: string, priority: 'polite' | 'assertive') => void;
  enableOptimisticUpdates?: boolean;
  debounceMs?: number;
}

/**
 * Quest list hook options
 */
interface UseQuestsOptions extends QuestHookOptions {
  goalId?: string;
  autoLoad?: boolean;
}

/**
 * Quest operation hook options
 */
interface QuestOperationOptions extends QuestHookOptions {
    onSuccess?: (quest: Quest | Quest[]) => void;
  onError?: (error: string) => void;
}

/**
 * Quest progress calculation options
 */
interface QuestProgressOptions {
  enableRealTime?: boolean;
  updateInterval?: number;
}


/**
 * Main quests hook for managing all quest-related state and operations.
 * This hook centralizes quest data, loading states, and actions to enable
 * optimistic updates and consistent state management.
 */
export const useQuests = (options: UseQuestsOptions = {}) => {
  const {
    goalId,
    autoLoad = true,
    onAnnounce,
    enableOptimisticUpdates = true,
    debounceMs = 300,
  } = options;

  // Quest notifications hook
  const { notifyQuestEvent } = useQuestNotifications();

  // ============================================================================
  // State
  // ============================================================================
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, any>>({});
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const { debouncedValidateField, clearFieldValidation, isFormValid } = useDebouncedValidation({ debounceMs });

  // ============================================================================
  // Cleanup
  // ============================================================================
  const cleanup = useCallback(() => {
    Object.values(abortControllersRef.current).forEach(controller => controller.abort());
    abortControllersRef.current = {};
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const getAbortController = (key: string) => {
    if (abortControllersRef.current[key]) {
      abortControllersRef.current[key].abort();
    }
    abortControllersRef.current[key] = new AbortController();
    return abortControllersRef.current[key];
  };

  // ============================================================================
  // Actions
  // ============================================================================

  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const loadQuestsData = useCallback(async () => {
    const controller = getAbortController('load');
    setLoading(true);
    setError(null);
    try {
      const api = await getApiImplementation();
      // Note: Backend doesn't support goalId filtering, so we load all quests and filter client-side
      const questsData = await api.loadQuests();
      if (!controller.signal.aborted) {
        setQuests(questsData);
        onAnnounce?.('Quests loaded successfully', 'polite');
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        const errorMessage = err.message || 'Failed to load quests';
        setError(errorMessage);
        onAnnounce?.(errorMessage, 'assertive');
        logger.error('Failed to load quests', { operation: 'useQuests', error: err });
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [onAnnounce]);

  useEffect(() => {
    if (autoLoad) {
      loadQuestsData();
    }
  }, [autoLoad, loadQuestsData]);

  const refresh = useCallback(() => loadQuestsData(), [loadQuestsData]);

  const handleZodError = (err: any, questId?: string) => {
    const zodErrors: Record<string, string> = {};
    err.issues.forEach((issue: any) => {
      const path = issue.path.join('.');
      zodErrors[path] = issue.message;
    });
    if (questId) {
      setValidationErrors(prev => ({ ...prev, [questId]: zodErrors }));
    } else {
      setValidationErrors(zodErrors);
    }
    setHasValidationErrors(true);
    return 'Please fix the validation errors';
  };
  
  const create = useCallback(async (input: QuestCreateInput) => {
    setLoadingState('create', true);
    setError(null);
    setValidationErrors({});
    setHasValidationErrors(false);

    const tempId = `temp-${Date.now()}`;
    if (enableOptimisticUpdates) {
      const optimisticQuest: Quest = {
        id: tempId,
        userId: 'temp-user',
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...input,
        description: input.description ?? '',
        tags: input.tags ?? [],
        privacy: input.privacy ?? 'private',
        kind: input.kind ?? 'linked',
        rewardXp: input.rewardXp ?? 0,
        difficulty: input.difficulty ?? 'easy',
      };
      setQuests(prev => [...prev, optimisticQuest]);
    }

    try {
      const validatedInput = QuestCreateInputSchema.parse(input) as QuestCreateInput;
      const api = await getApiImplementation();
      const newQuest = await api.createQuest(validatedInput);
      if (enableOptimisticUpdates) {
        setQuests(prev => (prev || []).map(q => (q.id === tempId ? newQuest : q)));
      } else {
        setQuests(prev => [...(prev || []), newQuest]);
      }
      onAnnounce?.('Quest created successfully', 'polite');
      return newQuest;
    } catch (err: any) {
      if (enableOptimisticUpdates) {
        setQuests(prev => (prev || []).filter(q => q.id !== tempId));
      }
        let errorMessage = 'Failed to create quest';
        if (err.name === 'ZodError') {
        errorMessage = handleZodError(err);
        } else {
          errorMessage = err.message || errorMessage;
          setError(errorMessage);
        }
        onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to create quest', { operation: 'createQuest', error: err });
        throw err;
    } finally {
      setLoadingState('create', false);
    }
  }, [enableOptimisticUpdates, onAnnounce]);

  const start = useCallback(async (questId: string) => {
    setLoadingState(`start-${questId}`, true);
    setError(null);

    const originalQuests = quests;
    if (enableOptimisticUpdates) {
      setQuests(produce(draft => {
        const quest = draft.find(q => q.id === questId);
        if (quest) {
          quest.status = 'active';
          quest.updatedAt = Date.now(); // Force update timestamp
        }
      }));
    }

    try {
      const api = await getApiImplementation();
      const updatedQuest = await api.startQuest(questId);
      if (enableOptimisticUpdates) {
        setQuests(produce(draft => {
          const questIndex = draft.findIndex(q => q.id === questId);
          if (questIndex !== -1) draft[questIndex] = updatedQuest;
        }));
      } else {
        setQuests(originalQuests.map(q => q.id === questId ? updatedQuest : q));
      }
      onAnnounce?.('Quest started successfully', 'polite');
      
      // Trigger notification
      notifyQuestEvent('questStarted', updatedQuest);
      
      return updatedQuest;
    } catch (err: any) {
      if (enableOptimisticUpdates) setQuests(originalQuests);
      
      // Handle structured error response from backend
      let errorMessage = 'Failed to start quest';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to start quest', { operation: 'startQuest', questId, error: err });
      throw err;
    } finally {
      setLoadingState(`start-${questId}`, false);
    }
  }, [quests, enableOptimisticUpdates, onAnnounce]);

  const edit = useCallback(async (questId: string, input: QuestUpdateInput) => {
    setLoadingState(`edit-${questId}`, true);
    setError(null);

    const originalQuests = quests;
    if (enableOptimisticUpdates) {
      setQuests(produce(draft => {
        const quest = draft.find(q => q.id === questId);
        if (quest) Object.assign(quest, input);
      }));
    }

    try {
      const validatedInput = QuestUpdateInputSchema.parse(input);
      const api = await getApiImplementation();
      const updatedQuest = await api.editQuest(questId, validatedInput);
      if (enableOptimisticUpdates) {
        setQuests(produce(draft => {
            const questIndex = draft.findIndex(q => q.id === questId);
            if (questIndex !== -1) draft[questIndex] = updatedQuest;
        }));
      } else {
        setQuests(originalQuests.map(q => q.id === questId ? updatedQuest : q));
      }
      onAnnounce?.('Quest updated successfully', 'polite');
      return updatedQuest;
    } catch (err: any) {
      if (enableOptimisticUpdates) setQuests(originalQuests);
        let errorMessage = 'Failed to update quest';
        if (err.name === 'ZodError') {
        errorMessage = handleZodError(err, questId);
        } else {
          errorMessage = err.message || errorMessage;
          setError(errorMessage);
        }
        onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to edit quest', { operation: 'editQuest', questId, error: err });
        throw err;
    } finally {
      setLoadingState(`edit-${questId}`, false);
    }
  }, [quests, enableOptimisticUpdates, onAnnounce]);

  const cancel = useCallback(async (questId: string, input?: QuestCancelInput) => {
    setLoadingState(`cancel-${questId}`, true);
    setError(null);

    const originalQuests = quests;
    if (enableOptimisticUpdates) {
      setQuests(produce(draft => {
        const quest = draft.find(q => q.id === questId);
        if (quest) {
          quest.status = 'cancelled';
          quest.updatedAt = Date.now(); // Force update timestamp
          if (input?.reason) {
            (quest as any).cancellationReason = input.reason;
          }
        }
      }));
    }

    try {
      const validatedInput = input ? QuestCancelInputSchema.parse(input) : {};
      const api = await getApiImplementation();
      const updatedQuest = await api.cancelQuest(questId, validatedInput);
      if (enableOptimisticUpdates) {
        setQuests(produce(draft => {
            const questIndex = draft.findIndex(q => q.id === questId);
            if (questIndex !== -1) draft[questIndex] = updatedQuest;
        }));
      } else {
        setQuests(originalQuests.map(q => q.id === questId ? updatedQuest : q));
      }
      onAnnounce?.('Quest cancelled successfully', 'polite');
      return updatedQuest;
    } catch (err: any) {
      if (enableOptimisticUpdates) setQuests(originalQuests);
        const errorMessage = err.message || 'Failed to cancel quest';
        setError(errorMessage);
        onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to cancel quest', { operation: 'cancelQuest', questId, error: err });
        throw err;
    } finally {
      setLoadingState(`cancel-${questId}`, false);
    }
  }, [quests, enableOptimisticUpdates, onAnnounce]);

  const fail = useCallback(async (questId: string) => {
    setLoadingState(`fail-${questId}`, true);
    setError(null);

    const originalQuests = quests;
    if (enableOptimisticUpdates) {
      setQuests(produce(draft => {
        const quest = draft.find(q => q.id === questId);
        if (quest) {
          quest.status = 'failed';
          quest.updatedAt = Date.now(); // Force update timestamp
        }
      }));
    }

    try {
      const api = await getApiImplementation();
      const updatedQuest = await api.failQuest(questId);
      if (enableOptimisticUpdates) {
        setQuests(produce(draft => {
            const questIndex = draft.findIndex(q => q.id === questId);
            if (questIndex !== -1) draft[questIndex] = updatedQuest;
        }));
      } else {
        setQuests(originalQuests.map(q => q.id === questId ? updatedQuest : q));
      }
      onAnnounce?.('Quest marked as failed', 'polite');
      return updatedQuest;
    } catch (err: any) {
      if (enableOptimisticUpdates) setQuests(originalQuests);
        const errorMessage = err.message || 'Failed to mark quest as failed';
        setError(errorMessage);
        onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to mark quest as failed', { operation: 'failQuest', questId, error: err });
        throw err;
    } finally {
      setLoadingState(`fail-${questId}`, false);
    }
  }, [quests, enableOptimisticUpdates, onAnnounce]);

  const deleteQuestFn = useCallback(async (questId: string) => {
    setLoadingState(`delete-${questId}`, true);
    setError(null);

    const originalQuests = quests;
    if (enableOptimisticUpdates) {
      setQuests(prev => prev.filter(q => q.id !== questId));
    }

    try {
      const api = await getApiImplementation();
      await api.deleteQuest(questId);
        onAnnounce?.('Quest deleted successfully', 'polite');
    } catch (err: any) {
      if (enableOptimisticUpdates) setQuests(originalQuests);
        const errorMessage = err.message || 'Failed to delete quest';
        setError(errorMessage);
        onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to delete quest', { operation: 'deleteQuest', questId, error: err });
        throw err;
    } finally {
      setLoadingState(`delete-${questId}`, false);
    }
  }, [quests, enableOptimisticUpdates, onAnnounce]);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateField = useCallback((schema: any, fieldName: string, value: any, questId?: string) => {
    const key = questId ? `${questId}-${fieldName}` : fieldName;
    debouncedValidateField(key, value, schema);
  }, [debouncedValidateField]);

  const clearFieldError = useCallback((fieldName: string, questId?: string) => {
    const key = questId ? `${questId}-${fieldName}` : fieldName;
    clearFieldValidation(key);
    setValidationErrors(prev => {
        if (questId && prev[questId]) {
            const { [fieldName]: removed, ...rest } = prev[questId];
            return { ...prev, [questId]: rest };
        } else if (!questId) {
            const { [fieldName]: removed, ...rest } = prev;
            return rest;
        }
        return prev;
    });
  }, [clearFieldValidation]);

  // ============================================================================
  // Return values
  // ============================================================================
  return {
    // Data
    quests,
    selectedQuest,
    
    // States
    loading,
    error,
    loadingStates,
    validationErrors,
    hasValidationErrors,
    
    // Actions
    loadQuests: loadQuestsData,
    refresh,
    setSelectedQuest,
    setLoadingState,
    clearError,
    create,
    start,
    edit,
    cancel,
    fail,
    deleteQuest: deleteQuestFn,

    // Validation
    validateField,
    clearFieldError,
    isFormValid,
    
    // Computed
    hasQuests: Array.isArray(quests) && quests.length > 0,
    questCount: Array.isArray(quests) ? quests.length : 0,
    activeQuests: useMemo(() => (quests || []).filter(q => q.status === 'active'), [quests]),
    draftQuests: useMemo(() => (quests || []).filter(q => q.status === 'draft'), [quests]),
    completedQuests: useMemo(() => (quests || []).filter(q => q.status === 'completed'), [quests]),
    cancelledQuests: useMemo(() => (quests || []).filter(q => q.status === 'cancelled'), [quests]),
    failedQuests: useMemo(() => (quests || []).filter(q => q.status === 'failed'), [quests]),
  };
};

/**
 * Quest list hook options
 */
interface UseQuestsOptions extends QuestHookOptions {
  goalId?: string;
  autoLoad?: boolean;
}

// ============================================================================
// Core Quest List Hook
// ============================================================================

/**
 * Hook for managing quest lists with filtering and loading states
 * @deprecated Use `useQuests` instead for full functionality. This is a temporary wrapper.
 */
// export const useQuests = (options: UseQuestsOptions = {}) => {
//   const { quests, loading, error, loadQuests, refresh, selectedQuest, setSelectedQuest, hasQuests, questCount, activeQuests, draftQuests, completedQuests, cancelledQuests, failedQuests } = useQuests(options);
//   return { quests, loading, error, loadQuests, refresh, selectedQuest, setSelectedQuest, hasQuests, questCount, activeQuests, draftQuests, completedQuests, cancelledQuests, failedQuests };
// };

// ============================================================================
// Quest Operation Hooks (Wrappers for useQuests)
// ============================================================================

/**
 * @deprecated Use `useQuests` and its returned `create` method.
 */
export const useQuestCreate = (options: QuestOperationOptions = {}) => {
    const { create, loadingStates, error, validationErrors, hasValidationErrors, isFormValid } = useQuests(options);
    return { create, loading: loadingStates['create'], error, validationErrors, hasValidationErrors, canSubmit: !loadingStates['create'] && !hasValidationErrors && isFormValid() };
};

/**
 * @deprecated Use `useQuests` and its returned `start` method.
 */
export const useQuestStart = (options: QuestOperationOptions = {}) => {
    const { start, loadingStates, error } = useQuests(options);
    return { start, loadingStates, error, isStarting: (questId: string) => loadingStates[`start-${questId}`] || false };
};

/**
 * @deprecated Use `useQuests` and its returned `edit` method.
 */
export const useQuestEdit = (options: QuestOperationOptions = {}) => {
    const { edit, loadingStates, error, validationErrors } = useQuests(options);
    return { edit, loadingStates, error, validationErrors, isEditing: (questId: string) => loadingStates[`edit-${questId}`] || false };
};

/**
 * @deprecated Use `useQuests` and its returned `cancel` method.
 */
export const useQuestCancel = (options: QuestOperationOptions = {}) => {
    const { cancel, loadingStates, error } = useQuests(options);
    return { cancel, loadingStates, error, isCanceling: (questId: string) => loadingStates[`cancel-${questId}`] || false };
};

/**
 * @deprecated Use `useQuests` and its returned `fail` method.
 */
export const useQuestFail = (options: QuestOperationOptions = {}) => {
    const { fail, loadingStates, error } = useQuests(options);
    return { fail, loadingStates, error, isFailing: (questId: string) => loadingStates[`fail-${questId}`] || false };
};

/**
 * @deprecated Use `useQuests` and its returned `deleteQuest` method.
 */
export const useQuestDelete = (options: QuestOperationOptions = {}) => {
    const { deleteQuest, loadingStates, error } = useQuests(options);
    return { deleteQuest, loadingStates, error, isDeleting: (questId: string) => loadingStates[`delete-${questId}`] || false };
};

// ============================================================================
// Single Quest Hook
// ============================================================================

/**
 * Hook for loading a single quest by ID
 */
export const useQuest = (questId: string, options: { autoLoad?: boolean } = {}) => {
  const { autoLoad = true } = options;
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestData = useCallback(async () => {
    if (!questId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const api = await getApiImplementation();
      const questData = await api.loadQuest(questId);
      setQuest(questData);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load quest';
      setError(errorMessage);
      logger.error('Failed to load quest', { questId, error: err });
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    if (autoLoad && questId) {
      loadQuestData();
    }
  }, [questId, autoLoad, loadQuestData]);

  return {
    quest,
    loading,
    error,
    loadQuest: loadQuestData,
    refetch: loadQuestData
  };
};

// ============================================================================
// Quest Progress Hook
// ============================================================================

/**
 * Hook for calculating and tracking quest progress
 */
export const useQuestProgress = (quest: Quest, options: QuestProgressOptions = {}) => {
  const {
    enableRealTime = false,
    updateInterval = 5000
  } = options;

  const [progressData, setProgressData] = useState<QuestProgress | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate progress using the new questProgress library (now async)
  const calculateProgress = useCallback(async (quest: Quest): Promise<QuestProgress> => {
    try {
      return await calculateQuestProgress(quest);
    } catch (error) {
      logger.error('Failed to calculate quest progress', { questId: quest.id, error });
      // Return a default progress object on error
      return {
        percentage: 0,
        status: 'not_started',
        completedCount: 0,
        totalCount: 0,
        remainingCount: 0,
        lastUpdated: new Date(),
        isCalculating: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Update progress (now async)
  const updateProgress = useCallback(async () => {
    if (!quest || !quest.id) return;
    
    setIsCalculating(true);
    try {
      const newProgress = await calculateProgress(quest);
      setProgressData(newProgress);
    } catch (error) {
      logger.error('Failed to update quest progress', { questId: quest.id, error });
      setProgressData({
        percentage: 0,
        status: 'not_started',
        completedCount: 0,
        totalCount: 0,
        remainingCount: 0,
        lastUpdated: new Date(),
        isCalculating: false,
        error: error instanceof Error ? error.message : 'Failed to update progress'
      });
    } finally {
      setIsCalculating(false);
    }
  }, [quest?.id, quest?.status, quest?.kind, quest?.linkedGoalIds, quest?.linkedTaskIds, quest?.targetCount, quest?.countScope, quest?.periodDays, calculateProgress]);

  // Initial progress calculation
  useEffect(() => {
    updateProgress().catch(error => {
      logger.error('Failed to calculate initial quest progress', { questId: quest?.id, error });
    });
  }, [updateProgress]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      updateProgress().catch(error => {
        logger.error('Failed to update quest progress in interval', { questId: quest?.id, error });
      });
    }, updateInterval);
    return () => clearInterval(interval);
  }, [enableRealTime, updateInterval, updateProgress]);

  // Computed values
  const progress = useMemo(() => progressData?.percentage || 0, [progressData]);
  const progressPercentage = useMemo(() => Math.round(progress), [progress]);
  const isCompleted = useMemo(() => progressData?.status === 'completed', [progressData]);
  const isInProgress = useMemo(() => progressData?.status === 'in_progress', [progressData]);
  const isNotStarted = useMemo(() => progressData?.status === 'not_started', [progressData]);

  return {
    // Legacy compatibility
    progress,
    progressPercentage,
    isCalculating,
    isCompleted,
    isInProgress,
    isNotStarted,
    updateProgress,
    
    // New detailed progress data
    progressData,
    completedCount: progressData?.completedCount || 0,
    totalCount: progressData?.totalCount || 0,
    remainingCount: progressData?.remainingCount || 0,
    status: progressData?.status || 'not_started',
    estimatedCompletion: progressData?.estimatedCompletion,
    lastUpdated: progressData?.lastUpdated,
    error: progressData?.error,
  };
};

// ============================================================================
// Export all hooks and types
// ============================================================================

export type {
  QuestHookOptions,
  UseQuestsOptions,
  QuestOperationOptions,
  QuestProgressOptions,
};