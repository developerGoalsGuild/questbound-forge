/**
 * useQuestTemplateCreate Hook Tests
 * 
 * Comprehensive unit tests for the useQuestTemplateCreate hook,
 * covering template creation, error handling, and cache management.
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useQuestTemplateCreate } from '../useQuestTemplateCreate';
import { createQuestTemplate } from '@/lib/apiQuestTemplate';
import { QuestTemplate } from '@/models/questTemplate';

// Mock the API function
vi.mock('@/lib/apiQuestTemplate', () => ({
  createQuestTemplate: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockCreateQuestTemplate = vi.mocked(createQuestTemplate);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useQuestTemplateCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.createTemplate).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Template Creation', () => {
    it('creates template successfully', async () => {
      const mockTemplate = {
        id: 'template-1',
        userId: 'user-1',
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: ['test'],
        rewardXp: 100,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
        createdAt: 1672531200000, // 2023-01-01T00:00:00Z as timestamp
        updatedAt: 1672531200000, // 2023-01-01T00:00:00Z as timestamp
      };

      mockCreateQuestTemplate.mockResolvedValue(mockTemplate);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: ['test'],
        rewardXp: 100,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        await result.current.createTemplate(templateData);
      });

      expect(mockCreateQuestTemplate).toHaveBeenCalledWith(templateData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles creation errors', async () => {
      const error = new Error('Creation failed');
      mockCreateQuestTemplate.mockRejectedValue(error);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        try {
          await result.current.createTemplate(templateData);
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
        expect(result.current.loading).toBe(false);
      });
    });

    it('shows loading state during creation', async () => {
      let resolvePromise: (value: QuestTemplate) => void;
      const promise = new Promise<QuestTemplate>((resolve) => {
        resolvePromise = resolve;
      });
      mockCreateQuestTemplate.mockReturnValue(promise);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      // Start the creation process
      const createPromise = result.current.createTemplate(templateData);

      // Check loading state immediately after starting
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          id: 'template-1',
          userId: 'user-1',
          title: 'Test Template',
          description: 'Test Description',
          category: 'Fitness',
          difficulty: 'medium',
          privacy: 'public',
          kind: 'linked',
          tags: [],
          rewardXp: 0,
          targetCount: 1,
          countScope: 'completed_tasks',
          createdAt: 1672531200000,
          updatedAt: 1672531200000,
        });
      });

      // Wait for the promise to resolve
      await createPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Cache Management', () => {
    it('invalidates quest templates cache on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const wrapper = ({ children }: { children: React.ReactNode }) => 
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const mockTemplate = {
        id: 'template-1',
        userId: 'user-1',
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
        createdAt: 1672531200000,
        updatedAt: 1672531200000,
      };

      mockCreateQuestTemplate.mockResolvedValue(mockTemplate);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        await result.current.createTemplate(templateData);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['questTemplates'] });
      expect(setQueryDataSpy).toHaveBeenCalledWith(['questTemplate', 'template-1'], mockTemplate);
    });

    it('updates templates list cache on success', async () => {
      const queryClient = createTestQueryClient();
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Set initial cache data
      queryClient.setQueryData(['questTemplates'], [
        { id: 'template-0', title: 'Existing Template' }
      ]);

      const wrapper = ({ children }: { children: React.ReactNode }) => 
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const mockTemplate = {
        id: 'template-1',
        userId: 'user-1',
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
        createdAt: 1672531200000,
        updatedAt: 1672531200000,
      };

      mockCreateQuestTemplate.mockResolvedValue(mockTemplate);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        await result.current.createTemplate(templateData);
      });

      // Check that setQueryData was called with the correct function that updates the cache
      expect(setQueryDataSpy).toHaveBeenCalledWith(['questTemplates'], expect.any(Function));
    });
  });

  describe('Reset Function', () => {
    it('resets error state', async () => {
      const error = new Error('Creation failed');
      mockCreateQuestTemplate.mockRejectedValue(error);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        try {
          await result.current.createTemplate(templateData);
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      mockCreateQuestTemplate.mockRejectedValue(networkError);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        try {
          await result.current.createTemplate(templateData);
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(networkError);
      });
    });

    it('handles validation errors', async () => {
      const validationError = new Error('Validation failed: Title is required');
      mockCreateQuestTemplate.mockRejectedValue(validationError);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData = {
        title: '',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        try {
          await result.current.createTemplate(templateData);
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(validationError);
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('handles multiple concurrent creation attempts', async () => {
      const mockTemplate1 = {
        id: 'template-1',
        userId: 'user-1',
        title: 'Template 1',
        description: 'Description 1',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
        createdAt: 1672531200000,
        updatedAt: 1672531200000,
      };

      const mockTemplate2 = {
        id: 'template-2',
        userId: 'user-1',
        title: 'Template 2',
        description: 'Description 2',
        category: 'Health',
        difficulty: 'hard' as const,
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        tags: [],
        rewardXp: 200,
        targetCount: 14,
        countScope: 'completed_tasks' as const,
        createdAt: 1672531200000,
        updatedAt: 1672531200000,
      };

      mockCreateQuestTemplate
        .mockResolvedValueOnce(mockTemplate1)
        .mockResolvedValueOnce(mockTemplate2);

      const { result } = renderHook(() => useQuestTemplateCreate(), { wrapper });

      const templateData1 = {
        title: 'Template 1',
        description: 'Description 1',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        targetCount: 1,
        countScope: 'completed_tasks' as const,
      };

      const templateData2 = {
        title: 'Template 2',
        description: 'Description 2',
        category: 'Health',
        difficulty: 'hard' as const,
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        tags: [],
        rewardXp: 200,
        targetCount: 14,
        countScope: 'completed_tasks' as const,
      };

      await act(async () => {
        await Promise.all([
          result.current.createTemplate(templateData1),
          result.current.createTemplate(templateData2),
        ]);
      });

      expect(mockCreateQuestTemplate).toHaveBeenCalledTimes(2);
      expect(mockCreateQuestTemplate).toHaveBeenCalledWith(templateData1);
      expect(mockCreateQuestTemplate).toHaveBeenCalledWith(templateData2);
    });
  });
});
