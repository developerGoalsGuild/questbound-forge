/**
 * useQuest Hook Tests
 * 
 * Unit tests for the useQuest hook with 90%+ coverage.
 * Tests include quest loading, error handling, and API integration.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useQuest } from '../useQuest';
import * as apiQuest from '@/lib/apiQuest';
import * as mockApiQuest from '@/lib/apiQuestMock';
import type { Quest } from '@/models/quest';

// Mock the API modules
vi.mock('@/lib/apiQuest');
vi.mock('@/lib/apiQuestMock');

const mockApiQuestModule = vi.mocked(apiQuest);
const mockMockApiQuestModule = vi.mocked(mockApiQuest);

// Mock quest data
const mockQuest: Quest = {
  id: 'quest-1',
  userId: 'user-1',
  title: 'Test Quest',
  description: 'Test quest description',
  difficulty: 'medium',
  rewardXp: 100,
  status: 'draft',
  category: 'Work',
  tags: ['test', 'example'],
  privacy: 'public',
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
  createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  kind: 'quantitative',
  linkedGoalIds: ['goal-1'],
  linkedTaskIds: ['task-1'],
  dependsOnQuestIds: [],
  targetCount: 5,
  countScope: 'completed_tasks',
  periodDays: 7,
};

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useQuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch for backend availability check
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Quest Loading', () => {
    it('should load quest successfully with real API', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
    });

    it('should load quest successfully with mock API when backend is unavailable', async () => {
      mockMockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockMockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
    });

    it('should handle quest not found error', async () => {
      const error = new Error('Quest with ID quest-1 not found');
      mockApiQuestModule.loadQuest.mockRejectedValue(error);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Quest with ID quest-1 not found');
      });
    });

    it('should handle network error', async () => {
      const error = new Error('Network error');
      mockApiQuestModule.loadQuest.mockRejectedValue(error);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should not load quest when questId is empty', async () => {
      const { result } = renderHook(() => useQuest(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.quest).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApiQuestModule.loadQuest).not.toHaveBeenCalled();
    });
  });

  describe('Auto Load Behavior', () => {
    it('should auto load quest by default', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
      });

      expect(mockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
    });

    it('should not auto load quest when autoLoad is false', async () => {
      const { result } = renderHook(() => useQuest('quest-1', { autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.quest).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockApiQuestModule.loadQuest).not.toHaveBeenCalled();
    });

    it('should load quest when loadQuest is called manually', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1', { autoLoad: false }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadQuest();
      });

      expect(result.current.quest).toEqual(mockQuest);
      expect(mockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      mockApiQuestModule.loadQuest.mockImplementation(() => new Promise(() => {}));
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.quest).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should clear loading state after successful load', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quest).toEqual(mockQuest);
    });

    it('should clear loading state after error', async () => {
      const error = new Error('Load failed');
      mockApiQuestModule.loadQuest.mockRejectedValue(error);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Load failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockApiQuestModule.loadQuest.mockRejectedValue(error);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('API Error');
        expect(result.current.quest).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle errors without message', async () => {
      const error = new Error();
      mockApiQuestModule.loadQuest.mockRejectedValue(error);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load quest');
      });
    });

    it('should clear error when loading new quest', async () => {
      const error = new Error('First error');
      mockApiQuestModule.loadQuest
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result, rerender } = renderHook(
        ({ questId }) => useQuest(questId),
        {
          wrapper: createWrapper(),
          initialProps: { questId: 'quest-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Change quest ID to trigger new load
      rerender({ questId: 'quest-2' });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.quest).toEqual(mockQuest);
      });
    });
  });

  describe('Refetch Functionality', () => {
    it('should provide refetch function', () => {
      const { result } = renderHook(() => useQuest('quest-1', { autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should reload quest when refetch is called', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1', { autoLoad: false }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
      expect(result.current.quest).toEqual(mockQuest);
    });

    it('should handle refetch errors', async () => {
      const error = new Error('Refetch error');
      mockApiQuestModule.loadQuest.mockRejectedValue(error);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1', { autoLoad: false }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe('Refetch error');
    });
  });

  describe('API Selection', () => {
    it('should use real API when backend is available', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
      });

      expect(mockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
      expect(mockMockApiQuestModule.loadQuest).not.toHaveBeenCalled();
    });

    it('should use mock API when backend is unavailable', async () => {
      mockMockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
      });

      expect(mockMockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
      expect(mockApiQuestModule.loadQuest).not.toHaveBeenCalled();
    });

    it('should handle backend health check errors', async () => {
      mockMockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockRejectedValue(new Error('Health check failed'));

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
      });

      expect(mockMockApiQuestModule.loadQuest).toHaveBeenCalledWith('quest-1');
    });
  });

  describe('Quest ID Changes', () => {
    it('should reload quest when questId changes', async () => {
      const quest2 = { ...mockQuest, id: 'quest-2', title: 'Quest 2' };
      mockApiQuestModule.loadQuest
        .mockResolvedValueOnce(mockQuest)
        .mockResolvedValueOnce(quest2);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result, rerender } = renderHook(
        ({ questId }) => useQuest(questId),
        {
          wrapper: createWrapper(),
          initialProps: { questId: 'quest-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
      });

      // Change quest ID
      rerender({ questId: 'quest-2' });

      await waitFor(() => {
        expect(result.current.quest).toEqual(quest2);
      });

      expect(mockApiQuestModule.loadQuest).toHaveBeenCalledTimes(2);
      expect(mockApiQuestModule.loadQuest).toHaveBeenNthCalledWith(1, 'quest-1');
      expect(mockApiQuestModule.loadQuest).toHaveBeenNthCalledWith(2, 'quest-2');
    });

    it('should not load when questId becomes empty', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result, rerender } = renderHook(
        ({ questId }) => useQuest(questId),
        {
          wrapper: createWrapper(),
          initialProps: { questId: 'quest-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
      });

      // Change to empty quest ID
      rerender({ questId: '' });

      expect(result.current.quest).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Return Values', () => {
    it('should return correct initial values', () => {
      const { result } = renderHook(() => useQuest('quest-1', { autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.quest).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadQuest).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should return quest data after successful load', async () => {
      mockApiQuestModule.loadQuest.mockResolvedValue(mockQuest);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const { result } = renderHook(() => useQuest('quest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quest).toEqual(mockQuest);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.loadQuest).toBe('function');
        expect(typeof result.current.refetch).toBe('function');
      });
    });
  });
});