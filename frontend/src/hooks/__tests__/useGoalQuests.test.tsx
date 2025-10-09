import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGoalQuests } from '../useGoalQuests';
import type { Quest } from '@/models/quest';

// Mock the useQuests hook
const mockUseQuests = vi.fn();

// Mock the useQuest module
vi.mock('../useQuest', () => ({
  useQuests: (...args: any[]) => mockUseQuests(...args),
}));

describe('useGoalQuests', () => {
  const mockGoalId = 'goal-123';
const mockQuests: Quest[] = [
  {
    id: 'quest-1',
    userId: 'user-1',
    linkedGoalIds: [mockGoalId],
    title: 'Quest for Goal',
    status: 'active',
    difficulty: 'medium',
    rewardXp: 100,
    category: 'Health',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'quest-2',
    userId: 'user-1',
    linkedGoalIds: ['different-goal'],
    title: 'Quest for Different Goal',
    status: 'completed',
    difficulty: 'easy',
    rewardXp: 50,
    category: 'Fitness',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'quest-3',
    userId: 'user-1',
    linkedGoalIds: [mockGoalId],
    title: 'Another Quest for Goal',
    status: 'draft',
    difficulty: 'hard',
    rewardXp: 200,
    category: 'Career',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

  const mockUseQuestsReturn = {
    quests: mockQuests,
    loading: false,
    error: null,
    loadingStates: {},
    validationErrors: {},
    hasValidationErrors: false,
    selectedQuest: null,
    refresh: vi.fn(),
    clearError: vi.fn(),
    setLoadingState: vi.fn(),
    createQuest: vi.fn(),
    startQuest: vi.fn(),
    editQuest: vi.fn(),
    cancelQuest: vi.fn(),
    failQuest: vi.fn(),
    deleteQuest: vi.fn(),
    selectQuest: vi.fn(),
    validateField: vi.fn(),
    clearFieldValidation: vi.fn(),
    isFormValid: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuests.mockReturnValue(mockUseQuestsReturn);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('calls useQuests without goalId (client-side filtering)', () => {
      renderHook(() => useGoalQuests(mockGoalId));

      expect(mockUseQuests).toHaveBeenCalledWith({
        autoLoad: true,
      });
    });

    it('passes through additional options to useQuests', () => {
      const options = {
        autoLoad: false,
        onAnnounce: vi.fn(),
        enableOptimisticUpdates: false,
      };

      renderHook(() => useGoalQuests(mockGoalId, options));

      expect(mockUseQuests).toHaveBeenCalledWith({
        ...options,
      });
    });
  });

  describe('Data Filtering', () => {
    it('filters quests by goalId', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      expect(result.current.goalQuests).toHaveLength(2);
      expect(result.current.goalQuests[0].id).toBe('quest-1');
      expect(result.current.goalQuests[1].id).toBe('quest-3');
      expect(result.current.goalQuests.every(quest => quest.linkedGoalIds?.includes(mockGoalId))).toBe(true);
    });

    it('returns correct quest count', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      expect(result.current.questCount).toBe(2);
    });

    it('returns all quests (unfiltered)', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      expect(result.current.quests).toEqual(mockQuests);
      expect(result.current.quests).toHaveLength(3);
    });

    it('updates filtered quests when underlying quests change', () => {
      const newQuests = [
        ...mockQuests,
        {
          id: 'quest-4',
          userId: 'user-1',
          linkedGoalIds: [mockGoalId],
          title: 'New Quest',
          status: 'active' as const,
          difficulty: 'easy' as const,
          rewardXp: 25,
          category: 'Learning',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockUseQuests.mockReturnValue({
        ...mockUseQuestsReturn,
        quests: newQuests,
      });

      const { result, rerender } = renderHook(() => useGoalQuests(mockGoalId));
      rerender();

      expect(result.current.goalQuests).toHaveLength(3);
      expect(result.current.questCount).toBe(3);
    });
  });

  describe('State Passthrough', () => {
    it('passes through all state from useQuests', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      expect(result.current.loading).toBe(mockUseQuestsReturn.loading);
      expect(result.current.error).toBe(mockUseQuestsReturn.error);
      expect(result.current.loadingStates).toBe(mockUseQuestsReturn.loadingStates);
      expect(result.current.validationErrors).toBe(mockUseQuestsReturn.validationErrors);
      expect(result.current.hasValidationErrors).toBe(mockUseQuestsReturn.hasValidationErrors);
      expect(result.current.selectedQuest).toBe(mockUseQuestsReturn.selectedQuest);
      expect(result.current.isFormValid).toBe(mockUseQuestsReturn.isFormValid);
    });
  });

  describe('Action Passthrough', () => {
    it('passes through all actions from useQuests', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      expect(result.current.refresh).toBe(mockUseQuestsReturn.refresh);
      expect(result.current.clearError).toBe(mockUseQuestsReturn.clearError);
      expect(result.current.setLoadingState).toBe(mockUseQuestsReturn.setLoadingState);
      expect(result.current.createQuest).toBe(mockUseQuestsReturn.createQuest);
      expect(result.current.startQuest).toBe(mockUseQuestsReturn.startQuest);
      expect(result.current.editQuest).toBe(mockUseQuestsReturn.editQuest);
      expect(result.current.cancelQuest).toBe(mockUseQuestsReturn.cancelQuest);
      expect(result.current.failQuest).toBe(mockUseQuestsReturn.failQuest);
      expect(result.current.deleteQuest).toBe(mockUseQuestsReturn.deleteQuest);
      expect(result.current.selectQuest).toBe(mockUseQuestsReturn.selectQuest);
      expect(result.current.validateField).toBe(mockUseQuestsReturn.validateField);
      expect(result.current.clearFieldValidation).toBe(mockUseQuestsReturn.clearFieldValidation);
    });
  });

  describe('Performance and Re-rendering', () => {
    it('memoizes goalQuests correctly', () => {
      const { result, rerender } = renderHook(() => useGoalQuests(mockGoalId));

      const firstRender = result.current.goalQuests;
      rerender();
      const secondRender = result.current.goalQuests;

      expect(firstRender).toBe(secondRender); // Same reference
    });

    it('re-filters when goalId changes', () => {
      const { result, rerender } = renderHook(
        ({ goalId }) => useGoalQuests(goalId),
        { initialProps: { goalId: mockGoalId } }
      );

      expect(result.current.goalQuests).toHaveLength(2);

      rerender({ goalId: 'different-goal' });

      expect(result.current.goalQuests).toHaveLength(1);
      expect(result.current.goalQuests[0].id).toBe('quest-2');
    });

    it('re-filters when quests array changes', () => {
      const { result, rerender } = renderHook(() => useGoalQuests(mockGoalId));

      expect(result.current.goalQuests).toHaveLength(2);

      const updatedQuests = mockQuests.filter(quest => quest.id !== 'quest-1');
      mockUseQuests.mockReturnValue({
        ...mockUseQuestsReturn,
        quests: updatedQuests,
      });

      rerender();

      expect(result.current.goalQuests).toHaveLength(1);
      expect(result.current.goalQuests[0].id).toBe('quest-3');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty quests array', () => {
      mockUseQuests.mockReturnValue({
        ...mockUseQuestsReturn,
        quests: [],
      });

      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      expect(result.current.goalQuests).toEqual([]);
      expect(result.current.questCount).toBe(0);
    });

    it('handles goal with no associated quests', () => {
      const differentGoalId = 'goal-without-quests';

      const { result } = renderHook(() => useGoalQuests(differentGoalId));

      expect(result.current.goalQuests).toEqual([]);
      expect(result.current.questCount).toBe(0);
    });

    it('handles undefined goalId gracefully', () => {
      // This shouldn't happen in practice, but test defensive behavior
      const { result } = renderHook(() => useGoalQuests(''));

      expect(result.current.goalQuests).toEqual([]);
      expect(result.current.questCount).toBe(0);
    });
  });

  describe('Integration with useQuests', () => {
    it('maintains all useQuests functionality', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      // Test that all expected properties exist
      expect(result.current).toHaveProperty('quests');
      expect(result.current).toHaveProperty('goalQuests');
      expect(result.current).toHaveProperty('questCount');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refresh');
      expect(result.current).toHaveProperty('createQuest');
      expect(result.current).toHaveProperty('startQuest');
      expect(result.current).toHaveProperty('editQuest');
      expect(result.current).toHaveProperty('cancelQuest');
      expect(result.current).toHaveProperty('failQuest');
      expect(result.current).toHaveProperty('deleteQuest');
    });

    it('does not modify original quests array', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      // Original quests should remain unchanged
      expect(result.current.quests).toEqual(mockQuests);
      expect(result.current.quests).toHaveLength(3);

      // Filtered quests should be separate
      expect(result.current.goalQuests).toHaveLength(2);
      expect(result.current.goalQuests).not.toBe(result.current.quests);
    });
  });

  describe('Type Safety', () => {
    it('returns correctly typed data', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      // Type assertions to ensure TypeScript compatibility
      const quests: Quest[] = result.current.quests;
      const goalQuests: Quest[] = result.current.goalQuests;
      const questCount: number = result.current.questCount;

      expect(Array.isArray(quests)).toBe(true);
      expect(Array.isArray(goalQuests)).toBe(true);
      expect(typeof questCount).toBe('number');
    });

    it('provides correctly typed functions', () => {
      const { result } = renderHook(() => useGoalQuests(mockGoalId));

      // Type assertions for functions
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.createQuest).toBe('function');
      expect(typeof result.current.startQuest).toBe('function');
      expect(typeof result.current.editQuest).toBe('function');
      expect(typeof result.current.cancelQuest).toBe('function');
      expect(typeof result.current.failQuest).toBe('function');
      expect(typeof result.current.deleteQuest).toBe('function');
    });
  });
});
