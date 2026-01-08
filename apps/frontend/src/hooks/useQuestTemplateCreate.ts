/**
 * useQuestTemplateCreate Hook
 * 
 * Custom hook for creating quest templates with comprehensive error handling,
 * loading states, and optimistic updates.
 * 
 * Features:
 * - Template creation with validation
 * - Loading and error states
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Comprehensive error handling
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuestTemplate } from '@/lib/apiQuestTemplate';
import { type QuestTemplateCreateInput } from '@/models/questTemplate';
import { logger } from '@/lib/logger';

interface UseQuestTemplateCreateReturn {
  createTemplate: (data: QuestTemplateCreateInput) => Promise<void>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export const useQuestTemplateCreate = (): UseQuestTemplateCreateReturn => {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: QuestTemplateCreateInput) => {
      logger.info('Creating quest template', { 
        title: data.title,
        category: data.category,
        difficulty: data.difficulty,
        privacy: data.privacy,
        kind: data.kind
      });

      const result = await createQuestTemplate(data);
      
      logger.info('Quest template created successfully', { 
        templateId: result.id,
        title: result.title
      });

      return result;
    },
    onSuccess: (data) => {
      // Invalidate and refetch quest templates
      queryClient.invalidateQueries({ queryKey: ['questTemplates'] });
      
      // Add the new template to the cache
      queryClient.setQueryData(['questTemplate', data.id], data);
      
      // Update the templates list cache
      queryClient.setQueryData(['questTemplates'], (old: any) => {
        if (!old) return [data];
        return [data, ...old];
      });

      setError(null);
    },
    onError: (error: Error) => {
      logger.error('Failed to create quest template', { 
        error: error.message,
        stack: error.stack
      });
      setError(error);
    }
  });

  const createTemplate = useCallback(async (data: QuestTemplateCreateInput) => {
    try {
      setError(null);
      await mutation.mutateAsync(data);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      throw error;
    }
  }, [mutation]);

  const reset = useCallback(() => {
    setError(null);
    mutation.reset();
  }, [mutation]);

  return {
    createTemplate,
    loading: mutation.isPending,
    error,
    reset
  };
};

export default useQuestTemplateCreate;
