import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  calculateLinkedQuestProgress,
  calculateQuantitativeQuestProgress,
  calculateQuestProgress,
  calculateDetailedQuestProgress,
  formatProgressPercentage,
  formatRemainingCount,
  formatEstimatedCompletion,
  getProgressStatusColorClass,
  getProgressStatusIcon,
  validateQuestProgress,
  type QuestProgress,
  type LinkedQuestProgress,
  type QuantitativeQuestProgress
} from '../questProgress';
import type { Quest } from '@/models/quest';

// Mock Date to ensure consistent testing
const mockDate = new Date('2024-01-15T10:00:00Z');

beforeAll(() => {
  vi.setSystemTime(mockDate);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('Quest Progress Calculation', () => {
  describe('calculateLinkedQuestProgress', () => {
    it('should calculate progress for a completed linked quest', async () => {
      const quest: Quest = {
        id: '1',
        userId: 'user1',
        title: 'Test Quest',
        description: 'Test Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'completed' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'linked' as const,
        linkedGoalIds: ['goal1', 'goal2'],
        linkedTaskIds: ['task1', 'task2', 'task3'],
        createdAt: mockDate.getTime() - 86400000, // 1 day ago
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateLinkedQuestProgress(quest);

      expect(progress.kind).toBe('linked');
      expect(progress.percentage).toBe(100);
      expect(progress.status).toBe('completed');
      expect(progress.completedCount).toBe(3); // Only 3 tasks count for progress
      expect(progress.totalCount).toBe(3); // Only 3 tasks count for progress
      expect(progress.remainingCount).toBe(0);
      expect(progress.linkedGoalsProgress.completed).toBe(2); // Goals still tracked for display
      expect(progress.linkedGoalsProgress.total).toBe(2);
      expect(progress.linkedTasksProgress.completed).toBe(3);
      expect(progress.linkedTasksProgress.total).toBe(3);
    });

    it('should calculate progress for an active linked quest with simulated progress', async () => {
      const quest: Quest = {
        id: '2',
        userId: 'user1',
        title: 'Active Quest',
        description: 'Active Description',
        difficulty: 'medium' as const,
        rewardXp: 200,
        status: 'active' as const,
        category: 'Work',
        tags: [],
        privacy: 'private' as const,
        kind: 'linked' as const,
        linkedGoalIds: ['goal1', 'goal2', 'goal3'],
        linkedTaskIds: ['task1', 'task2'],
        createdAt: mockDate.getTime() - 172800000, // 2 days ago
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateLinkedQuestProgress(quest);


      expect(progress.kind).toBe('linked');
      // With 2 days age and 20% progress per day, we should have 40% progress
      // Since 40% > 0, status should be 'in_progress'
      // Only counting tasks for progress (2 tasks total)
      expect(progress.status).toBe('in_progress');
      expect(progress.completedCount).toBeGreaterThan(0);
      expect(progress.completedCount).toBeLessThan(2); // Only 2 tasks
      expect(progress.totalCount).toBe(2); // Only 2 tasks
      expect(progress.remainingCount).toBe(2 - progress.completedCount);
    });

    it('should handle linked quest with no linked items', async () => {
      const quest: Quest = {
        id: '3',
        userId: 'user1',
        title: 'Empty Quest',
        description: 'Empty Description',
        difficulty: 'easy' as const,
        rewardXp: 50,
        status: 'draft' as const,
        category: 'Personal',
        tags: [],
        privacy: 'private' as const,
        kind: 'linked' as const,
        linkedGoalIds: [],
        linkedTaskIds: [],
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateLinkedQuestProgress(quest);

      expect(progress.kind).toBe('linked');
      expect(progress.percentage).toBe(0);
      expect(progress.status).toBe('not_started');
      expect(progress.completedCount).toBe(0);
      expect(progress.totalCount).toBe(0);
      expect(progress.remainingCount).toBe(0);
    });

    it('should throw error for non-linked quest', async () => {
      const quest: Quest = {
        id: '4',
        userId: 'user1',
        title: 'Quantitative Quest',
        description: 'Quantitative Description',
        difficulty: 'hard' as const,
        rewardXp: 300,
        status: 'draft' as const,
        category: 'Learning',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 10,
        countScope: 'completed_tasks',
        periodDays: 7,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      await expect(calculateLinkedQuestProgress(quest)).rejects.toThrow('Quest must be of type "linked"');
    });
  });

  describe('calculateQuantitativeQuestProgress', () => {
    it('should calculate progress for a completed quantitative quest', async () => {
      const quest: Quest = {
        id: '5',
        userId: 'user1',
        title: 'Completed Quantitative Quest',
        description: 'Completed Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'completed' as const,
        category: 'Fitness',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 10,
        countScope: 'completed_tasks',
        periodDays: 7,
        createdAt: mockDate.getTime() - 86400000,
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateQuantitativeQuestProgress(quest);

      expect(progress.kind).toBe('quantitative');
      expect(progress.percentage).toEqual(100);
      expect(progress.status).toBe('completed');
      expect(progress.completedCount).toEqual(10);
      expect(progress.totalCount).toEqual(10);
      expect(progress.remainingCount).toBe(0);
      expect(progress.targetCount).toBe(10);
      expect(progress.currentCount).toBe(10);
      expect(progress.countScope).toBe('completed_tasks');
      expect(progress.periodDays).toBe(7);
    });

    it('should calculate progress for an active quantitative quest with simulated progress', async () => {
      const quest: Quest = {
        id: '6',
        userId: 'user1',
        title: 'Active Quantitative Quest',
        description: 'Active Description',
        difficulty: 'medium' as const,
        rewardXp: 200,
        status: 'active' as const,
        category: 'Work',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 20,
        countScope: 'completed_goals',
        periodDays: 14,
        createdAt: mockDate.getTime() - 432000000, // 5 days ago
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateQuantitativeQuestProgress(quest);

      expect(progress.kind).toBe('quantitative');
      expect(progress.status).toBe('in_progress');
      expect(progress.completedCount).toBeGreaterThan(0);
      expect(progress.completedCount).toBeLessThan(20);
      expect(progress.totalCount).toBe(20);
      expect(progress.remainingCount).toBe(20 - progress.completedCount);
      expect(progress.targetCount).toBe(20);
      expect(progress.countScope).toBe('completed_goals');
      expect(progress.periodDays).toBe(14);
    });

    it('should handle quantitative quest with no progress', async () => {
      const quest: Quest = {
        id: '7',
        userId: 'user1',
        title: 'New Quantitative Quest',
        description: 'New Description',
        difficulty: 'easy' as const,
        rewardXp: 50,
        status: 'draft' as const,
        category: 'Personal',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 5,
        countScope: 'completed_tasks',
        periodDays: 3,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateQuantitativeQuestProgress(quest);

      expect(progress.kind).toBe('quantitative');
      expect(progress.percentage).toBe(0);
      expect(progress.status).toBe('not_started');
      expect(progress.completedCount).toBe(0);
      expect(progress.totalCount).toBe(5);
      expect(progress.remainingCount).toBe(5);
    });

    it('should throw error for non-quantitative quest', async () => {
      const quest: Quest = {
        id: '8',
        userId: 'user1',
        title: 'Linked Quest',
        description: 'Linked Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'draft' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'linked' as const,
        linkedGoalIds: ['goal1'],
        linkedTaskIds: ['task1'],
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      await expect(calculateQuantitativeQuestProgress(quest)).rejects.toThrow('Quest must be of type "quantitative"');
    });

    it('should throw error for invalid target count', async () => {
      const quest: Quest = {
        id: '9',
        userId: 'user1',
        title: 'Invalid Quest',
        description: 'Invalid Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'draft' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 0,
        countScope: 'completed_tasks',
        periodDays: 7,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      await expect(calculateQuantitativeQuestProgress(quest)).rejects.toThrow('Quantitative quest must have a valid target count');
    });

    it('should throw error for missing count scope', async () => {
      const quest: Quest = {
        id: '10',
        userId: 'user1',
        title: 'Invalid Quest',
        description: 'Invalid Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'draft' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 10,
        countScope: undefined,
        periodDays: 7,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      await expect(calculateQuantitativeQuestProgress(quest)).rejects.toThrow('Quantitative quest must have a count scope');
    });

    it('should throw error for invalid period', async () => {
      const quest: Quest = {
        id: '11',
        userId: 'user1',
        title: 'Invalid Quest',
        description: 'Invalid Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'draft' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 10,
        countScope: 'completed_tasks',
        periodDays: 0,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      await expect(calculateQuantitativeQuestProgress(quest)).rejects.toThrow('Quantitative quest must have a valid period');
    });
  });

  describe('calculateQuestProgress', () => {
    it('should calculate progress for linked quest', async () => {
      const quest: Quest = {
        id: '12',
        userId: 'user1',
        title: 'Linked Quest',
        description: 'Linked Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'completed' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'linked' as const,
        linkedGoalIds: ['goal1'],
        linkedTaskIds: ['task1'],
        createdAt: mockDate.getTime() - 86400000,
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateQuestProgress(quest);

      expect(progress.percentage).toBe(100);
      expect(progress.status).toBe('completed');
      expect(progress.completedCount).toBe(1); // Only 1 task counts for progress
      expect(progress.totalCount).toBe(1); // Only 1 task counts for progress
    });

    it('should calculate progress for quantitative quest', async () => {
      const quest: Quest = {
        id: '13',
        userId: 'user1',
        title: 'Quantitative Quest',
        description: 'Quantitative Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'completed' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 5,
        countScope: 'completed_tasks',
        periodDays: 7,
        createdAt: mockDate.getTime() - 86400000,
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateQuestProgress(quest);

      expect(progress.percentage).toBe(100);
      expect(progress.status).toBe('completed');
      expect(progress.completedCount).toBe(5);
      expect(progress.totalCount).toBe(5);
    });

    it('should handle unsupported quest kind gracefully', async () => {
      const quest = {
        id: '14',
        userId: 'user1',
        title: 'Unknown Quest',
        description: 'Unknown Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'draft' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'unknown' as any,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateQuestProgress(quest);

      expect(progress.percentage).toBe(0);
      expect(progress.status).toBe('not_started');
      expect(progress.error).toBe('Unsupported quest kind: unknown');
    });

    it('should handle calculation errors gracefully', async () => {
      // Create a quest that will cause an error by having invalid data
      const quest = {
        id: '15',
        userId: 'user1',
        title: 'Error Quest',
        description: 'Error Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'draft' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'unknown' as any, // This should trigger an error
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateQuestProgress(quest);

      expect(progress.percentage).toBe(0);
      expect(progress.status).toBe('not_started');
      // The error should be defined in the returned progress object
      expect(progress.error).toBeDefined();
    });
  });

  describe('calculateDetailedQuestProgress', () => {
    it('should return detailed progress for linked quest', async () => {
      const quest: Quest = {
        id: '16',
        userId: 'user1',
        title: 'Linked Quest',
        description: 'Linked Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'completed' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'linked' as const,
        linkedGoalIds: ['goal1', 'goal2'],
        linkedTaskIds: ['task1'],
        createdAt: mockDate.getTime() - 86400000,
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateDetailedQuestProgress(quest);

      expect(progress.kind).toBe('linked');
      expect('linkedGoalsProgress' in progress).toBe(true);
      expect('linkedTasksProgress' in progress).toBe(true);
    });

    it('should return detailed progress for quantitative quest', async () => {
      const quest: Quest = {
        id: '17',
        userId: 'user1',
        title: 'Quantitative Quest',
        description: 'Quantitative Description',
        difficulty: 'easy' as const,
        rewardXp: 100,
        status: 'completed' as const,
        category: 'Health',
        tags: [],
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        targetCount: 10,
        countScope: 'completed_tasks',
        periodDays: 7,
        createdAt: mockDate.getTime() - 86400000,
        updatedAt: mockDate.getTime()
      };

      const progress = await calculateDetailedQuestProgress(quest);

      expect(progress.kind).toBe('quantitative');
      expect('targetCount' in progress).toBe(true);
      expect('currentCount' in progress).toBe(true);
      expect('countScope' in progress).toBe(true);
      expect('periodDays' in progress).toBe(true);
      expect('progressRate' in progress).toBe(true);
    });
  });

  describe('Formatting Functions', () => {
    describe('formatProgressPercentage', () => {
      it('should format percentage correctly', () => {
        expect(formatProgressPercentage(0)).toBe('0%');
        expect(formatProgressPercentage(50.5)).toBe('51%');
        expect(formatProgressPercentage(100)).toBe('100%');
        expect(formatProgressPercentage(99.9)).toBe('100%');
      });
    });

    describe('formatRemainingCount', () => {
      it('should format remaining count correctly', () => {
        expect(formatRemainingCount(0)).toBe('Complete');
        expect(formatRemainingCount(1)).toBe('1 remaining');
        expect(formatRemainingCount(5)).toBe('5 remaining');
        expect(formatRemainingCount(100)).toBe('100 remaining');
      });
    });

    describe('formatEstimatedCompletion', () => {
      it('should format estimated completion correctly', () => {
        const now = new Date('2024-01-15T10:00:00Z');
        vi.setSystemTime(now);

        expect(formatEstimatedCompletion(new Date('2024-01-16T10:00:00Z'))).toBe('Tomorrow');
        expect(formatEstimatedCompletion(new Date('2024-01-20T10:00:00Z'))).toBe('In 5 days');
        expect(formatEstimatedCompletion(new Date('2024-01-10T10:00:00Z'))).toBe('Overdue');
      });
    });

    describe('getProgressStatusColorClass', () => {
      it('should return correct color classes', () => {
        expect(getProgressStatusColorClass('completed')).toBe('text-green-600 bg-green-50');
        expect(getProgressStatusColorClass('in_progress')).toBe('text-blue-600 bg-blue-50');
        expect(getProgressStatusColorClass('not_started')).toBe('text-gray-600 bg-gray-50');
      });
    });

    describe('getProgressStatusIcon', () => {
      it('should return correct icons', () => {
        expect(getProgressStatusIcon('completed')).toBe('✓');
        expect(getProgressStatusIcon('in_progress')).toBe('⏳');
        expect(getProgressStatusIcon('not_started')).toBe('○');
      });
    });
  });

  describe('validateQuestProgress', () => {
    it('should validate correct progress data', () => {
      const progress: QuestProgress = {
        percentage: 50,
        status: 'in_progress',
        completedCount: 5,
        totalCount: 10,
        remainingCount: 5,
        lastUpdated: new Date(),
        isCalculating: false
      };

      expect(validateQuestProgress(progress)).toBe(true);
    });

    it('should reject invalid percentage', () => {
      const progress: QuestProgress = {
        percentage: 150,
        status: 'in_progress',
        completedCount: 5,
        totalCount: 10,
        remainingCount: 5,
        lastUpdated: new Date(),
        isCalculating: false
      };

      expect(validateQuestProgress(progress)).toBe(false);
    });

    it('should reject invalid status', () => {
      const progress = {
        percentage: 50,
        status: 'not_started',
        completedCount: 5,
        totalCount: 10,
        remainingCount: 5,
        lastUpdated: new Date(),
        isCalculating: false
      } as QuestProgress;

      expect(validateQuestProgress(progress)).toBe(false);
    });

    it('should reject negative counts', () => {
      const progress: QuestProgress = {
        percentage: 50,
        status: 'in_progress',
        completedCount: -1,
        totalCount: 10,
        remainingCount: 5,
        lastUpdated: new Date(),
        isCalculating: false
      };

      expect(validateQuestProgress(progress)).toBe(false);
    });

    it('should reject invalid lastUpdated', () => {
      const progress = {
        percentage: 50,
        status: 'in_progress',
        completedCount: 5,
        totalCount: 10,
        remainingCount: 5,
        lastUpdated: new Date('invalid'),
        isCalculating: false
      } as QuestProgress;

      expect(validateQuestProgress(progress)).toBe(false);
    });
  });
});
