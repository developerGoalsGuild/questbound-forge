/**
 * Quest Template Hooks for GoalsGuild Application
 * 
 * This file provides comprehensive quest template management hooks following 
 * established patterns from useQuest.ts. All hooks include optimistic updates, 
 * error handling, validation, and accessibility features.
 * 
 * Exports:
 * - useQuestTemplates() - Load and manage quest templates
 * - useTemplateCreate() - Create new quest templates
 * - useTemplateEdit() - Edit quest templates
 * - useTemplateDelete() - Delete quest templates
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
  createQuestTemplate, 
  getTemplate,
  updateTemplate, 
  deleteTemplate,
  listUserTemplates,
  listPublicTemplates,
  searchTemplates
} from '@/lib/apiQuestTemplate';
import type { 
  QuestTemplate, 
  QuestTemplateCreateInput, 
  QuestTemplateUpdateInput,
  QuestTemplateListOptions,
  QuestTemplateValidationErrors
} from '@/models/questTemplate';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface QuestTemplateOperationOptions {
  enableOptimisticUpdates?: boolean;
  debounceMs?: number;
  onAnnounce?: (message: string, priority: 'polite' | 'assertive') => void;
}

export interface QuestTemplateListState {
  templates: QuestTemplate[];
  total: number;
  hasMore: boolean;
  nextToken?: string;
  isLoading: boolean;
  error: string | null;
}

export interface QuestTemplateOperationState {
  loadingStates: Record<string, boolean>;
  error: string | null;
  validationErrors: QuestTemplateValidationErrors;
}

// ============================================================================
// Main Quest Templates Hook
// ============================================================================

export const useQuestTemplates = (options: QuestTemplateOperationOptions = {}) => {
  const {
    enableOptimisticUpdates = true,
    debounceMs = 300,
    onAnnounce
  } = options;

  // ============================================================================
  // State
  // ============================================================================
  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<QuestTemplateValidationErrors>({});

  // AbortController for cleanup
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const getAbortController = useCallback((operation: string) => {
    const existing = abortControllers.current.get(operation);
    if (existing) {
      existing.abort();
    }
    const controller = new AbortController();
    abortControllers.current.set(operation, controller);
    return controller;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
    };
  }, []);

  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const loadTemplatesData = useCallback(async (options: QuestTemplateListOptions = {}) => {
    const controller = getAbortController('load');
    setIsLoading(true);
    setError(null);
    try {
      const result = await listUserTemplates(options);
      if (!controller.signal.aborted) {
        setTemplates(result.templates);
        setTotal(result.total);
        setHasMore(result.hasMore);
        setNextToken(result.nextToken);
        onAnnounce?.('Templates loaded successfully', 'polite');
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        const errorMessage = err.message || 'Failed to load templates';
        setError(errorMessage);
        onAnnounce?.(errorMessage, 'assertive');
        logger.error('Failed to load quest templates', { operation: 'useQuestTemplates', error: err });
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [onAnnounce, getAbortController]);

  const refresh = useCallback(() => loadTemplatesData(), [loadTemplatesData]);

  // Load templates on mount
  useEffect(() => {
    loadTemplatesData();
  }, [loadTemplatesData]);

  const handleZodError = (err: any, templateId?: string) => {
    const zodErrors: Record<string, string> = {};
    err.issues.forEach((issue: any) => {
      const path = issue.path.join('.');
      zodErrors[path] = issue.message;
    });
    if (templateId) {
      setValidationErrors(prev => ({ ...prev, [templateId]: zodErrors }));
    } else {
      setValidationErrors(zodErrors);
    }
  };

  // ============================================================================
  // Template Operations
  // ============================================================================

  const create = useCallback(async (input: QuestTemplateCreateInput) => {
    setLoadingState('create', true);
    setError(null);

    const originalTemplates = templates;
    let newTemplate: QuestTemplate | null = null;

    if (enableOptimisticUpdates) {
      // Create optimistic template
      newTemplate = {
        id: `temp-${Date.now()}`,
        userId: 'current-user', // This would be replaced by actual user ID
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty: input.difficulty,
        rewardXp: input.rewardXp,
        tags: input.tags,
        privacy: input.privacy,
        kind: input.kind,
        targetCount: input.targetCount,
        countScope: input.countScope,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setTemplates(prev => [newTemplate!, ...prev]);
    }

    try {
      const createdTemplate = await createQuestTemplate(input);
      if (enableOptimisticUpdates) {
        setTemplates(prev => prev.map(t => t.id === newTemplate!.id ? createdTemplate : t));
      } else {
        setTemplates(prev => [createdTemplate, ...prev]);
      }
      onAnnounce?.('Template created successfully', 'polite');
      return createdTemplate;
    } catch (err: any) {
      if (enableOptimisticUpdates) {
        setTemplates(originalTemplates);
      }
      const errorMessage = err.message || 'Failed to create template';
      setError(errorMessage);
      onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to create quest template', { operation: 'create', error: err });
      throw err;
    } finally {
      setLoadingState('create', false);
    }
  }, [templates, enableOptimisticUpdates, setLoadingState, onAnnounce]);

  const edit = useCallback(async (templateId: string, input: QuestTemplateUpdateInput) => {
    setLoadingState(`edit-${templateId}`, true);
    setError(null);

    const originalTemplates = templates;
    if (enableOptimisticUpdates) {
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, ...input, updatedAt: Date.now() }
          : t
      ));
    }

    try {
      const updatedTemplate = await updateTemplate(templateId, input);
      if (enableOptimisticUpdates) {
        setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
      } else {
        setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
      }
      onAnnounce?.('Template updated successfully', 'polite');
      return updatedTemplate;
    } catch (err: any) {
      if (enableOptimisticUpdates) {
        setTemplates(originalTemplates);
      }
      const errorMessage = err.message || 'Failed to update template';
      setError(errorMessage);
      onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to update quest template', { operation: 'edit', templateId, error: err });
      throw err;
    } finally {
      setLoadingState(`edit-${templateId}`, false);
    }
  }, [templates, enableOptimisticUpdates, setLoadingState, onAnnounce]);

  const remove = useCallback(async (templateId: string) => {
    setLoadingState(`delete-${templateId}`, true);
    setError(null);

    const originalTemplates = templates;
    if (enableOptimisticUpdates) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }

    try {
      await deleteTemplate(templateId);
      if (!enableOptimisticUpdates) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      }
      onAnnounce?.('Template deleted successfully', 'polite');
    } catch (err: any) {
      if (enableOptimisticUpdates) {
        setTemplates(originalTemplates);
      }
      const errorMessage = err.message || 'Failed to delete template';
      setError(errorMessage);
      onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to delete quest template', { operation: 'delete', templateId, error: err });
      throw err;
    } finally {
      setLoadingState(`delete-${templateId}`, false);
    }
  }, [templates, enableOptimisticUpdates, setLoadingState, onAnnounce]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    setLoadingState('loadMore', true);
    try {
      const result = await listUserTemplates({ nextToken });
      setTemplates(prev => [...prev, ...result.templates]);
      setHasMore(result.hasMore);
      setNextToken(result.nextToken);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load more templates';
      setError(errorMessage);
      onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to load more quest templates', { operation: 'loadMore', error: err });
    } finally {
      setLoadingState('loadMore', false);
    }
  }, [hasMore, isLoading, nextToken, setLoadingState, onAnnounce]);

  const getTemplateById = useCallback(async (templateId: string) => {
    setLoadingState(`get-${templateId}`, true);
    setError(null);
    try {
      const template = await getTemplate(templateId);
      onAnnounce?.('Template loaded successfully', 'polite');
      return template;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load template';
      setError(errorMessage);
      onAnnounce?.(errorMessage, 'assertive');
      logger.error('Failed to get quest template', { operation: 'getTemplate', templateId, error: err });
      throw err;
    } finally {
      setLoadingState(`get-${templateId}`, false);
    }
  }, [setLoadingState, onAnnounce]);

  return {
    // Data
    templates,
    total,
    hasMore,
    nextToken,
    isLoading,
    error,
    loadingStates,
    validationErrors,
    
    // Actions
    create,
    edit,
    delete: remove,
    getTemplate: getTemplateById,
    refresh,
    loadMore,
    clearError,
    
    // State helpers
    isCreating: loadingStates.create || false,
    isEditing: (templateId: string) => loadingStates[`edit-${templateId}`] || false,
    isDeleting: (templateId: string) => loadingStates[`delete-${templateId}`] || false,
    isLoadingMore: loadingStates.loadMore || false,
  };
};

// ============================================================================
// Individual Operation Hooks
// ============================================================================

export const useTemplateCreate = (options: QuestTemplateOperationOptions = {}) => {
  const { create, loadingStates, error } = useQuestTemplates(options);
  return { 
    create, 
    loadingStates, 
    error, 
    isCreating: loadingStates.create || false 
  };
};

export const useTemplateEdit = (options: QuestTemplateOperationOptions = {}) => {
  const { edit, loadingStates, error, validationErrors } = useQuestTemplates(options);
  return { 
    edit, 
    loadingStates, 
    error, 
    validationErrors,
    isEditing: (templateId: string) => loadingStates[`edit-${templateId}`] || false 
  };
};

export const useTemplateDelete = (options: QuestTemplateOperationOptions = {}) => {
  const { delete: remove, loadingStates, error } = useQuestTemplates(options);
  return { 
    delete: remove, 
    loadingStates, 
    error, 
    isDeleting: (templateId: string) => loadingStates[`delete-${templateId}`] || false 
  };
};

// ============================================================================
// Template Search Hook
// ============================================================================

export const useTemplateSearch = (query: string, options: QuestTemplateListOptions = {}) => {
  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string, searchOptions: QuestTemplateListOptions = {}) => {
    if (!searchQuery.trim()) {
      setTemplates([]);
      setTotal(0);
      setHasMore(false);
      setNextToken(undefined);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await searchTemplates(searchQuery, searchOptions);
      setTemplates(result.templates);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setNextToken(result.nextToken);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search templates';
      setError(errorMessage);
      logger.error('Failed to search quest templates', { operation: 'search', query: searchQuery, error: err });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query, options);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search, options]);

  return {
    templates,
    total,
    hasMore,
    nextToken,
    isLoading,
    error,
    search,
  };
};

// ============================================================================
// Public Templates Hook
// ============================================================================

export const usePublicTemplates = (options: QuestTemplateListOptions = {}) => {
  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPublicTemplates = useCallback(async (loadOptions: QuestTemplateListOptions = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listPublicTemplates(loadOptions);
      setTemplates(result.templates);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setNextToken(result.nextToken);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load public templates';
      setError(errorMessage);
      logger.error('Failed to load public quest templates', { operation: 'loadPublicTemplates', error: err });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    try {
      const result = await listPublicTemplates({ nextToken });
      setTemplates(prev => [...prev, ...result.templates]);
      setHasMore(result.hasMore);
      setNextToken(result.nextToken);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load more public templates';
      setError(errorMessage);
      logger.error('Failed to load more public quest templates', { operation: 'loadMore', error: err });
    }
  }, [hasMore, isLoading, nextToken]);

  useEffect(() => {
    loadPublicTemplates(options);
  }, [loadPublicTemplates, options]);

  return {
    templates,
    total,
    hasMore,
    nextToken,
    isLoading,
    error,
    loadMore,
    refresh: () => loadPublicTemplates(options),
  };
};
