/**
 * Memory-optimized test for useQuest hooks
 * This test focuses on basic functionality without complex scenarios
 * to avoid memory issues during development
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useQuests } from '../useQuest';
import * as apiQuest from '@/lib/apiQuest';
import type { Quest } from '@/models/quest';

// Mock the apiQuest module
vi.mock('@/lib/apiQuest');

// Mock logger (avoid referencing top-level vars inside factory due to hoisting)
vi.mock('@/lib/logger', () => {
  return {
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
  };
});

// Simple mock data
const mockQuest: Quest = {
  id: 'quest-1',
  userId: 'user-1',
  title: 'Test Quest',
  description: 'Test Description',
  status: 'draft',
  difficulty: 'medium',
  category: 'Health',
  rewardXp: 100,
  tags: ['test'],
  privacy: 'private',
  kind: 'linked',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('useQuests Memory-Optimized Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiQuest.loadQuests).mockResolvedValue([mockQuest]);
    vi.mocked(apiQuest.createQuest).mockResolvedValue({ ...mockQuest, id: 'new-quest' });
  });

  it('should load quests successfully', async () => {
    const { result } = renderHook(() => useQuests({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.quests).toEqual([mockQuest]);
    expect(result.current.hasQuests).toBe(true);
  });

  it('should handle load error', async () => {
    const errorMessage = 'Failed to load quests';
    vi.mocked(apiQuest.loadQuests).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useQuests({ autoLoad: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.quests).toEqual([]);
  });

  it('should create a quest successfully', async () => {
    const { result } = renderHook(() => useQuests({ autoLoad: false }));

    const questData = { title: 'New Quest', category: 'Health', difficulty: 'easy', rewardXp: 50 };

    await act(async () => {
      await result.current.create(questData);
    });

    await waitFor(() => {
      expect(apiQuest.createQuest).toHaveBeenCalled();
      expect(result.current.quests.some(q => q.id === 'new-quest')).toBe(true);
    });
  });

  it('should handle create error and rollback optimistic update', async () => {
    const errorMessage = 'Failed to create';
    vi.mocked(apiQuest.createQuest).mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useQuests({ autoLoad: false }));

    const questData = { title: 'New Quest', category: 'Health', difficulty: 'easy', rewardXp: 50 };

    await act(async () => {
      await expect(result.current.create(questData)).rejects.toThrow(errorMessage);
    });
    
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.quests.some(q => q.id.startsWith('temp-'))).toBe(false);
  });
  
  it('should start a quest', async () => {
    vi.mocked(apiQuest.startQuest).mockResolvedValue({ ...mockQuest, status: 'active' });
    const { result } = renderHook(() => useQuests({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.start('quest-1');
    });

    expect(result.current.quests.find(q => q.id === 'quest-1')?.status).toBe('active');
  });

  it('should edit a quest', async () => {
    const updatedQuest = { ...mockQuest, title: 'Updated Title' };
    vi.mocked(apiQuest.editQuest).mockResolvedValue(updatedQuest);
    const { result } = renderHook(() => useQuests({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.edit('quest-1', { title: 'Updated Title' });
    });
    
    expect(result.current.quests.find(q => q.id === 'quest-1')?.title).toBe('Updated Title');
  });

  it('should delete a quest', async () => {
    vi.mocked(apiQuest.deleteQuest).mockResolvedValue(undefined);
    const { result } = renderHook(() => useQuests({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteQuest('quest-1');
    });

    expect(result.current.quests).toHaveLength(0);
  });

  it('should clear the main error state', async () => {
    const errorMessage = 'An error';
    vi.mocked(apiQuest.loadQuests).mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useQuests({ autoLoad: true }));
    
    await waitFor(() => expect(result.current.error).toBe(errorMessage));

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
