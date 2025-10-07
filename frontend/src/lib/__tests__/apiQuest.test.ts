/**
 * API Quest Tests
 * 
 * Unit tests for the API quest functions with 90%+ coverage.
 * Tests include GraphQL queries, error handling, and data transformation.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadQuests, loadQuest } from '../apiQuest';
import { graphqlRaw } from '../api';
import { logger } from '../logger';

// Mock the dependencies
vi.mock('../api');
vi.mock('../logger');

const mockGraphqlRaw = vi.mocked(graphqlRaw);
const mockLogger = vi.mocked(logger);

// Mock quest data
const mockQuest = {
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

describe('API Quest Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadQuests', () => {
    it('should load quests successfully without goalId', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests();

      expect(result).toEqual([mockQuest]);
      expect(mockGraphqlRaw).toHaveBeenCalledWith(
        expect.stringContaining('query MyQuests'),
        {}
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Loading quests',
        expect.objectContaining({ operation: 'loadQuests' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quests loaded successfully',
        expect.objectContaining({ count: 1 })
      );
    });

    it('should load quests successfully with goalId', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests('goal-123');

      expect(result).toEqual([mockQuest]);
      expect(mockGraphqlRaw).toHaveBeenCalledWith(
        expect.stringContaining('query MyQuests'),
        { goalId: 'goal-123' }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Loading quests',
        expect.objectContaining({ goalId: 'goal-123' })
      );
    });

    it('should handle empty quest list', async () => {
      const mockData = { myQuests: [] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests();

      expect(result).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quests loaded successfully',
        expect.objectContaining({ count: 0 })
      );
    });

    it('should handle null quest data', async () => {
      const mockData = { myQuests: null };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests();

      expect(result).toEqual([]);
    });

    it('should handle undefined quest data', async () => {
      const mockData = {};
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests();

      expect(result).toEqual([]);
    });

    it('should handle GraphQL errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuests()).rejects.toThrow('GraphQL error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quests',
        expect.objectContaining({
          operation: 'loadQuests',
          error: error,
        })
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuests()).rejects.toThrow('Network error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quests',
        expect.objectContaining({
          operation: 'loadQuests',
          error: error,
        })
      );
    });

    it('should log performance metrics', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await loadQuests();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quests loaded successfully',
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('loadQuest', () => {
    it('should load single quest successfully', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuest('quest-1');

      expect(result).toEqual(mockQuest);
      expect(mockGraphqlRaw).toHaveBeenCalledWith(
        expect.stringContaining('query MyQuests'),
        {}
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Loading quest',
        expect.objectContaining({ questId: 'quest-1' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quest loaded successfully',
        expect.objectContaining({ questId: 'quest-1' })
      );
    });

    it('should throw error when quest is not found', async () => {
      const mockData = { myQuests: [] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await expect(loadQuest('quest-999')).rejects.toThrow(
        'Quest with ID quest-999 not found'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quest',
        expect.objectContaining({
          questId: 'quest-999',
          error: expect.any(Error),
        })
      );
    });

    it('should find correct quest from multiple quests', async () => {
      const quest2 = { ...mockQuest, id: 'quest-2', title: 'Quest 2' };
      const quest3 = { ...mockQuest, id: 'quest-3', title: 'Quest 3' };
      const mockData = { myQuests: [mockQuest, quest2, quest3] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuest('quest-2');

      expect(result).toEqual(quest2);
    });

    it('should handle GraphQL errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuest('quest-1')).rejects.toThrow('GraphQL error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quest',
        expect.objectContaining({
          questId: 'quest-1',
          error: error,
        })
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuest('quest-1')).rejects.toThrow('Network error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quest',
        expect.objectContaining({
          questId: 'quest-1',
          error: error,
        })
      );
    });

    it('should handle errors without message', async () => {
      const error = new Error();
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuest('quest-1')).rejects.toThrow('Failed to load quest');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quest',
        expect.objectContaining({
          questId: 'quest-1',
          error: error,
        })
      );
    });

    it('should log performance metrics', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await loadQuest('quest-1');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quest loaded successfully',
        expect.objectContaining({
          questId: 'quest-1',
          duration: expect.any(Number),
        })
      );
    });

    it('should handle null quest data', async () => {
      const mockData = { myQuests: null };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await expect(loadQuest('quest-1')).rejects.toThrow(
        'Quest with ID quest-1 not found'
      );
    });

    it('should handle undefined quest data', async () => {
      const mockData = {};
      mockGraphqlRaw.mockResolvedValue(mockData);

      await expect(loadQuest('quest-1')).rejects.toThrow(
        'Quest with ID quest-1 not found'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle different error types in loadQuests', async () => {
      const error = new Error('Custom error');
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuests()).rejects.toThrow('Custom error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quests',
        expect.objectContaining({
          operation: 'loadQuests',
          error: error,
        })
      );
    });

    it('should handle different error types in loadQuest', async () => {
      const error = new Error('Custom error');
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuest('quest-1')).rejects.toThrow('Custom error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quest',
        expect.objectContaining({
          questId: 'quest-1',
          error: error,
        })
      );
    });

    it('should handle non-Error objects in loadQuests', async () => {
      const error = 'String error';
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuests()).rejects.toThrow('String error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quests',
        expect.objectContaining({
          operation: 'loadQuests',
          error: error,
        })
      );
    });

    it('should handle non-Error objects in loadQuest', async () => {
      const error = 'String error';
      mockGraphqlRaw.mockRejectedValue(error);

      await expect(loadQuest('quest-1')).rejects.toThrow('String error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load quest',
        expect.objectContaining({
          questId: 'quest-1',
          error: error,
        })
      );
    });
  });

  describe('Logging', () => {
    it('should log operation start for loadQuests', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await loadQuests();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Loading quests',
        expect.objectContaining({
          operation: 'loadQuests',
        })
      );
    });

    it('should log operation start for loadQuest', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await loadQuest('quest-1');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Loading quest',
        expect.objectContaining({
          operation: 'loadQuest',
          questId: 'quest-1',
        })
      );
    });

    it('should log success with correct parameters for loadQuests', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await loadQuests('goal-123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quests loaded successfully',
        expect.objectContaining({
          operation: 'loadQuests',
          goalId: 'goal-123',
          count: 1,
          duration: expect.any(Number),
        })
      );
    });

    it('should log success with correct parameters for loadQuest', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      await loadQuest('quest-1');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quest loaded successfully',
        expect.objectContaining({
          operation: 'loadQuest',
          questId: 'quest-1',
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('Data Transformation', () => {
    it('should return quest data as-is from GraphQL response', async () => {
      const mockData = { myQuests: [mockQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests();

      expect(result).toEqual([mockQuest]);
      expect(result[0]).toHaveProperty('id', 'quest-1');
      expect(result[0]).toHaveProperty('title', 'Test Quest');
      expect(result[0]).toHaveProperty('difficulty', 'medium');
    });

    it('should handle quest with all optional fields', async () => {
      const questWithAllFields = {
        ...mockQuest,
        description: 'Full description',
        tags: ['tag1', 'tag2', 'tag3'],
        linkedGoalIds: ['goal1', 'goal2'],
        linkedTaskIds: ['task1', 'task2'],
        dependsOnQuestIds: ['quest1', 'quest2'],
        targetCount: 10,
        countScope: 'completed_goals',
        periodDays: 14,
      };
      const mockData = { myQuests: [questWithAllFields] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests();

      expect(result).toEqual([questWithAllFields]);
    });

    it('should handle quest with minimal fields', async () => {
      const minimalQuest = {
        id: 'quest-minimal',
        userId: 'user-1',
        title: 'Minimal Quest',
        difficulty: 'easy',
        rewardXp: 50,
        status: 'draft',
        category: 'Personal',
        privacy: 'private',
        kind: 'linked',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const mockData = { myQuests: [minimalQuest] };
      mockGraphqlRaw.mockResolvedValue(mockData);

      const result = await loadQuests();

      expect(result).toEqual([minimalQuest]);
    });
  });
});