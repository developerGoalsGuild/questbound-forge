/**
 * API Quest Mock Tests
 * 
 * Unit tests for the mock API quest functions with 90%+ coverage.
 * Tests include mock data handling, filtering, and error scenarios.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadQuests, loadQuest, createQuest, editQuest, startQuest, cancelQuest, failQuest, deleteQuest } from '../apiQuestMock';
import { logger } from '../logger';
import type { Quest, QuestCreateInput, QuestUpdateInput } from '@/models/quest';

// Mock the logger
vi.mock('../logger');

const mockLogger = vi.mocked(logger);

// Mock quest data
const mockQuests: Quest[] = [
  {
    id: 'quest-1',
    userId: 'user-1',
    title: 'Morning Exercise Routine',
    description: 'Complete a 30-minute morning exercise routine every day for a week.',
    difficulty: 'medium',
    rewardXp: 150,
    status: 'active',
    category: 'Health',
    tags: ['fitness', 'morning', 'routine'],
    privacy: 'public',
    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    kind: 'quantitative',
    linkedGoalIds: ['goal-1'],
    linkedTaskIds: ['task-1'],
    dependsOnQuestIds: [],
    targetCount: 7,
    countScope: 'completed_tasks',
    periodDays: 7,
  },
  {
    id: 'quest-2',
    userId: 'user-1',
    title: 'Read 5 Books',
    description: 'Read 5 books this month.',
    difficulty: 'easy',
    rewardXp: 100,
    status: 'draft',
    category: 'Education',
    tags: ['reading', 'books', 'learning'],
    privacy: 'private',
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    kind: 'linked',
    linkedGoalIds: ['goal-2'],
    linkedTaskIds: [],
    dependsOnQuestIds: [],
  },
  {
    id: 'quest-3',
    userId: 'user-2',
    title: 'Learn Spanish',
    description: 'Complete Spanish language course.',
    difficulty: 'hard',
    rewardXp: 300,
    status: 'completed',
    category: 'Education',
    tags: ['language', 'spanish', 'course'],
    privacy: 'followers',
    deadline: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    kind: 'quantitative',
    linkedGoalIds: ['goal-3'],
    linkedTaskIds: ['task-3'],
    dependsOnQuestIds: [],
    targetCount: 30,
    countScope: 'completed_goals',
    periodDays: 30,
  },
];

describe('API Quest Mock Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadQuests', () => {
    it('should load all quests when no goalId is provided', async () => {
      const result = await loadQuests();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id', 'quest-1');
      expect(result[1]).toHaveProperty('id', 'quest-2');
      expect(result[2]).toHaveProperty('id', 'quest-3');
      expect(mockLogger.info).toHaveBeenCalledWith('Loading quests', { goalId: undefined });
    });

    it('should filter quests by goalId', async () => {
      const result = await loadQuests('goal-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'quest-1');
      expect(result[0].linkedGoalIds).toContain('goal-1');
      expect(mockLogger.info).toHaveBeenCalledWith('Loading quests', { goalId: 'goal-1' });
    });

    it('should return empty array when no quests match goalId', async () => {
      const result = await loadQuests('goal-999');

      expect(result).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Loading quests', { goalId: 'goal-999' });
    });

    it('should return a copy of the quests array', async () => {
      const result = await loadQuests();

      expect(result).not.toBe(mockQuests);
      expect(result).toEqual(mockQuests);
    });

    it('should handle multiple quests with same goalId', async () => {
      // Add another quest with goal-1
      const additionalQuest = {
        ...mockQuests[0],
        id: 'quest-4',
        title: 'Another Quest for Goal 1',
      };
      mockQuests.push(additionalQuest);

      const result = await loadQuests('goal-1');

      expect(result).toHaveLength(2);
      expect(result.every(quest => quest.linkedGoalIds.includes('goal-1'))).toBe(true);

      // Clean up
      mockQuests.pop();
    });
  });

  describe('loadQuest', () => {
    it('should load single quest by ID', async () => {
      const result = await loadQuest('quest-1');

      expect(result).toEqual(mockQuests[0]);
      expect(mockLogger.info).toHaveBeenCalledWith('Loading quest', { questId: 'quest-1' });
    });

    it('should return a copy of the quest', async () => {
      const result = await loadQuest('quest-1');

      expect(result).not.toBe(mockQuests[0]);
      expect(result).toEqual(mockQuests[0]);
    });

    it('should throw error when quest is not found', async () => {
      await expect(loadQuest('quest-999')).rejects.toThrow('Quest with ID quest-999 not found');
      expect(mockLogger.info).toHaveBeenCalledWith('Loading quest', { questId: 'quest-999' });
    });

    it('should handle empty quest ID', async () => {
      await expect(loadQuest('')).rejects.toThrow('Quest with ID  not found');
    });

    it('should handle null quest ID', async () => {
      await expect(loadQuest(null as any)).rejects.toThrow('Quest with ID null not found');
    });
  });

  describe('createQuest', () => {
    it('should create a new quest successfully', async () => {
      const newQuestInput: QuestCreateInput = {
        title: 'New Quest',
        description: 'A new quest description',
        difficulty: 'medium',
        rewardXp: 100,
        privacy: 'public',
        kind: 'linked',
        category: 'Work',
        tags: ['new', 'test'],
        deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
        linkedGoalIds: ['goal-1'],
        linkedTaskIds: ['task-1'],
        dependsOnQuestIds: [],
      };

      const result = await createQuest(newQuestInput);

      expect(result).toMatchObject({
        title: 'New Quest',
        description: 'A new quest description',
        difficulty: 'medium',
        rewardXp: 100,
        privacy: 'public',
        kind: 'linked',
        category: 'Work',
        tags: ['new', 'test'],
        linkedGoalIds: ['goal-1'],
        linkedTaskIds: ['task-1'],
        dependsOnQuestIds: [],
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('status', 'draft');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(mockLogger.info).toHaveBeenCalledWith('Creating quest', { input: newQuestInput });
    });

    it('should create quantitative quest with correct fields', async () => {
      const quantitativeQuestInput: QuestCreateInput = {
        title: 'Quantitative Quest',
        description: 'A quantitative quest',
        difficulty: 'hard',
        rewardXp: 200,
        privacy: 'private',
        kind: 'quantitative',
        category: 'Personal',
        tags: ['quantitative'],
        deadline: Date.now() + 14 * 24 * 60 * 60 * 1000,
        targetCount: 10,
        countScope: 'completed_tasks',
        periodDays: 14,
        linkedGoalIds: [],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
      };

      const result = await createQuest(quantitativeQuestInput);

      expect(result).toMatchObject({
        kind: 'quantitative',
        targetCount: 10,
        countScope: 'completed_tasks',
        periodDays: 14,
      });
    });

    it('should generate unique IDs for new quests', async () => {
      const input: QuestCreateInput = {
        title: 'Quest 1',
        difficulty: 'easy',
        rewardXp: 50,
        privacy: 'public',
        kind: 'linked',
        category: 'Work',
        linkedGoalIds: [],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
      };

      const result1 = await createQuest(input);
      const result2 = await createQuest(input);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should set default values for optional fields', async () => {
      const minimalInput: QuestCreateInput = {
        title: 'Minimal Quest',
        difficulty: 'easy',
        rewardXp: 50,
        privacy: 'public',
        kind: 'linked',
        category: 'Work',
        linkedGoalIds: [],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
      };

      const result = await createQuest(minimalInput);

      expect(result).toHaveProperty('description', '');
      expect(result).toHaveProperty('tags', []);
      expect(result).toHaveProperty('status', 'draft');
    });
  });

  describe('editQuest', () => {
    it('should edit existing quest successfully', async () => {
      const updateInput: QuestUpdateInput = {
        title: 'Updated Quest Title',
        description: 'Updated description',
        difficulty: 'hard',
        rewardXp: 200,
        privacy: 'private',
        tags: ['updated', 'modified'],
      };

      const result = await editQuest('quest-1', updateInput);

      expect(result).toMatchObject({
        id: 'quest-1',
        title: 'Updated Quest Title',
        description: 'Updated description',
        difficulty: 'hard',
        rewardXp: 200,
        privacy: 'private',
        tags: ['updated', 'modified'],
      });
      expect(result.updatedAt).toBeGreaterThan(mockQuests[0].updatedAt);
      expect(mockLogger.info).toHaveBeenCalledWith('Editing quest', { questId: 'quest-1', input: updateInput });
    });

    it('should throw error when editing non-existent quest', async () => {
      const updateInput: QuestUpdateInput = {
        title: 'Updated Title',
      };

      await expect(editQuest('quest-999', updateInput)).rejects.toThrow('Quest with ID quest-999 not found');
    });

    it('should preserve unchanged fields', async () => {
      const updateInput: QuestUpdateInput = {
        title: 'Only Title Changed',
      };

      const result = await editQuest('quest-1', updateInput);

      expect(result.title).toBe('Only Title Changed');
      expect(result.description).toBe(mockQuests[0].description);
      expect(result.difficulty).toBe(mockQuests[0].difficulty);
      expect(result.category).toBe(mockQuests[0].category);
    });

    it('should update quantitative quest fields', async () => {
      const updateInput: QuestUpdateInput = {
        targetCount: 15,
        countScope: 'completed_goals',
        periodDays: 21,
      };

      const result = await editQuest('quest-1', updateInput);

      expect(result).toMatchObject({
        targetCount: 15,
        countScope: 'completed_goals',
        periodDays: 21,
      });
    });
  });

  describe('startQuest', () => {
    it('should start quest successfully', async () => {
      const result = await startQuest('quest-2'); // quest-2 is in draft status

      expect(result).toMatchObject({
        id: 'quest-2',
        status: 'active',
      });
      expect(result.updatedAt).toBeGreaterThan(mockQuests[1].updatedAt);
      expect(mockLogger.info).toHaveBeenCalledWith('Starting quest', { questId: 'quest-2' });
    });

    it('should throw error when starting non-existent quest', async () => {
      await expect(startQuest('quest-999')).rejects.toThrow('Quest with ID quest-999 not found');
    });

    it('should throw error when starting already active quest', async () => {
      await expect(startQuest('quest-1')).rejects.toThrow('Quest is already active');
    });

    it('should throw error when starting completed quest', async () => {
      await expect(startQuest('quest-3')).rejects.toThrow('Quest cannot be started in its current state');
    });
  });

  describe('cancelQuest', () => {
    it('should cancel active quest successfully', async () => {
      const result = await cancelQuest('quest-1', { reason: 'No longer needed' });

      expect(result).toMatchObject({
        id: 'quest-1',
        status: 'cancelled',
      });
      expect(result.updatedAt).toBeGreaterThan(mockQuests[0].updatedAt);
      expect(mockLogger.info).toHaveBeenCalledWith('Canceling quest', { questId: 'quest-1', input: { reason: 'No longer needed' } });
    });

    it('should throw error when canceling non-existent quest', async () => {
      await expect(cancelQuest('quest-999', { reason: 'Test' })).rejects.toThrow('Quest with ID quest-999 not found');
    });

    it('should throw error when canceling non-active quest', async () => {
      await expect(cancelQuest('quest-2', { reason: 'Test' })).rejects.toThrow('Only active quests can be cancelled');
    });
  });

  describe('failQuest', () => {
    it('should fail active quest successfully', async () => {
      const result = await failQuest('quest-1', { reason: 'Could not complete' });

      expect(result).toMatchObject({
        id: 'quest-1',
        status: 'failed',
      });
      expect(result.updatedAt).toBeGreaterThan(mockQuests[0].updatedAt);
      expect(mockLogger.info).toHaveBeenCalledWith('Failing quest', { questId: 'quest-1', input: { reason: 'Could not complete' } });
    });

    it('should throw error when failing non-existent quest', async () => {
      await expect(failQuest('quest-999', { reason: 'Test' })).rejects.toThrow('Quest with ID quest-999 not found');
    });

    it('should throw error when failing non-active quest', async () => {
      await expect(failQuest('quest-2', { reason: 'Test' })).rejects.toThrow('Only active quests can be marked as failed');
    });
  });

  describe('deleteQuest', () => {
    it('should delete quest successfully', async () => {
      const result = await deleteQuest('quest-2'); // quest-2 is in draft status

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting quest', { questId: 'quest-2' });
    });

    it('should throw error when deleting non-existent quest', async () => {
      await expect(deleteQuest('quest-999')).rejects.toThrow('Quest with ID quest-999 not found');
    });

    it('should throw error when deleting active quest', async () => {
      await expect(deleteQuest('quest-1')).rejects.toThrow('Only draft quests can be deleted');
    });

    it('should throw error when deleting completed quest', async () => {
      await expect(deleteQuest('quest-3')).rejects.toThrow('Only draft quests can be deleted');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully in createQuest', async () => {
      const invalidInput = {} as QuestCreateInput;

      await expect(createQuest(invalidInput)).rejects.toThrow();
    });

    it('should handle invalid input gracefully in editQuest', async () => {
      const invalidInput = {} as QuestUpdateInput;

      await expect(editQuest('quest-1', invalidInput)).rejects.toThrow();
    });

    it('should handle null questId in all functions', async () => {
      await expect(loadQuest(null as any)).rejects.toThrow();
      await expect(editQuest(null as any, {})).rejects.toThrow();
      await expect(startQuest(null as any)).rejects.toThrow();
      await expect(cancelQuest(null as any, {})).rejects.toThrow();
      await expect(failQuest(null as any, {})).rejects.toThrow();
      await expect(deleteQuest(null as any)).rejects.toThrow();
    });
  });

  describe('Logging', () => {
    it('should log all operations with correct parameters', async () => {
      await loadQuests();
      expect(mockLogger.info).toHaveBeenCalledWith('Loading quests', { goalId: undefined });

      await loadQuest('quest-1');
      expect(mockLogger.info).toHaveBeenCalledWith('Loading quest', { questId: 'quest-1' });

      const input: QuestCreateInput = {
        title: 'Test',
        difficulty: 'easy',
        rewardXp: 50,
        privacy: 'public',
        kind: 'linked',
        category: 'Work',
        linkedGoalIds: [],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
      };
      await createQuest(input);
      expect(mockLogger.info).toHaveBeenCalledWith('Creating quest', { input });

      await editQuest('quest-1', { title: 'Updated' });
      expect(mockLogger.info).toHaveBeenCalledWith('Editing quest', { questId: 'quest-1', input: { title: 'Updated' } });

      await startQuest('quest-2');
      expect(mockLogger.info).toHaveBeenCalledWith('Starting quest', { questId: 'quest-2' });

      await cancelQuest('quest-1', { reason: 'Test' });
      expect(mockLogger.info).toHaveBeenCalledWith('Canceling quest', { questId: 'quest-1', input: { reason: 'Test' } });

      await failQuest('quest-1', { reason: 'Test' });
      expect(mockLogger.info).toHaveBeenCalledWith('Failing quest', { questId: 'quest-1', input: { reason: 'Test' } });

      await deleteQuest('quest-2');
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting quest', { questId: 'quest-2' });
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      const originalQuest = await loadQuest('quest-1');
      
      const updatedQuest = await editQuest('quest-1', { title: 'New Title' });
      expect(updatedQuest.id).toBe(originalQuest.id);
      expect(updatedQuest.title).toBe('New Title');
      expect(updatedQuest.updatedAt).toBeGreaterThan(originalQuest.updatedAt);

      const startedQuest = await startQuest('quest-1');
      expect(startedQuest.status).toBe('active');
      expect(startedQuest.updatedAt).toBeGreaterThan(updatedQuest.updatedAt);
    });

    it('should preserve quest relationships', async () => {
      const quest = await loadQuest('quest-1');
      
      expect(quest.linkedGoalIds).toContain('goal-1');
      expect(quest.linkedTaskIds).toContain('task-1');
      expect(quest.dependsOnQuestIds).toEqual([]);
    });
  });
});
