/**
 * Tests for questFilters utility functions
 *
 * Tests cover:
 * - filterQuests function with various filter combinations
 * - sortQuests function with different sort criteria
 * - getUniqueCategories function
 * - getFilterStats function
 * - validateFilters function
 * - Edge cases and performance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterQuests,
  sortQuests,
  filterAndSortQuests,
  getUniqueCategories,
  getFilterStats,
  validateFilters,
  createDefaultFilters,
  hasActiveFilters,
  getActiveFilterCount,
} from '../questFilters';
import type { Quest } from '@/models/quest';

describe('Quest Filters Utilities', () => {
  let mockQuests: Quest[];

  beforeEach(() => {
    mockQuests = [
      {
        id: '1',
        userId: 'user1',
        title: 'Complete Project Alpha',
        description: 'Finish the alpha version of the project',
        status: 'completed',
        difficulty: 'hard',
        category: 'Work',
        rewardXp: 200,
        createdAt: Date.now() - 100000,
        updatedAt: Date.now() - 50000,
        tags: ['project', 'urgent'],
        privacy: 'public',
        kind: 'linked',
        linkedGoalIds: ['goal1'],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
        targetCount: 1,
        countScope: 'any',
        periodDays: 7,
        deadline: Date.now() + 86400000,
        startedAt: Date.now() - 80000,
        completedAt: Date.now() - 50000,
        failedAt: undefined,
        cancelledAt: undefined,
      },
      {
        id: '2',
        userId: 'user1',
        title: 'Learn React Testing',
        description: 'Master testing React components',
        status: 'active',
        difficulty: 'medium',
        category: 'Learning',
        rewardXp: 100,
        createdAt: Date.now() - 200000,
        updatedAt: Date.now() - 100000,
        tags: ['react', 'testing'],
        privacy: 'private',
        kind: 'personal',
        linkedGoalIds: [],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
        targetCount: 5,
        countScope: 'linked',
        periodDays: 30,
        deadline: Date.now() + 86400000 * 7,
        startedAt: Date.now() - 150000,
        completedAt: undefined,
        failedAt: undefined,
        cancelledAt: undefined,
      },
      {
        id: '3',
        userId: 'user1',
        title: 'Morning Workout Routine',
        description: 'Establish a consistent workout routine',
        status: 'draft',
        difficulty: 'easy',
        category: 'Health',
        rewardXp: 50,
        createdAt: Date.now() - 300000,
        updatedAt: Date.now() - 200000,
        tags: ['fitness', 'routine'],
        privacy: 'followers',
        kind: 'habit',
        linkedGoalIds: ['goal2'],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
        targetCount: 30,
        countScope: 'any',
        periodDays: 30,
        deadline: undefined,
        startedAt: undefined,
        completedAt: undefined,
        failedAt: undefined,
        cancelledAt: undefined,
      },
      {
        id: '4',
        userId: 'user1',
        title: 'Write Blog Post',
        description: 'Create a technical blog post about TypeScript',
        status: 'cancelled',
        difficulty: 'medium',
        category: 'Work',
        rewardXp: 75,
        createdAt: Date.now() - 400000,
        updatedAt: Date.now() - 250000,
        tags: ['writing', 'typescript'],
        privacy: 'public',
        kind: 'linked',
        linkedGoalIds: ['goal1'],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
        targetCount: 1,
        countScope: 'any',
        periodDays: 14,
        deadline: Date.now() + 86400000 * 3,
        startedAt: Date.now() - 350000,
        completedAt: undefined,
        failedAt: undefined,
        cancelledAt: Date.now() - 250000,
      },
      {
        id: '5',
        userId: 'user1',
        title: 'Failed Photography Project',
        description: 'Attempt to complete a photography series',
        status: 'failed',
        difficulty: 'hard',
        category: 'Creative',
        rewardXp: 150,
        createdAt: Date.now() - 500000,
        updatedAt: Date.now() - 300000,
        tags: ['photography', 'creative'],
        privacy: 'public',
        kind: 'personal',
        linkedGoalIds: [],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
        targetCount: 10,
        countScope: 'any',
        periodDays: 60,
        deadline: Date.now() - 86400000,
        startedAt: Date.now() - 450000,
        completedAt: undefined,
        failedAt: Date.now() - 300000,
        cancelledAt: undefined,
      },
    ];
  });

  describe('filterQuests', () => {
    it('returns all quests when no filters are applied', () => {
      const filters = createDefaultFilters();
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(5);
      expect(result).toEqual(mockQuests);
    });

    it('filters by status correctly', () => {
      const filters = createDefaultFilters({ status: 'completed' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('filters by difficulty correctly', () => {
      const filters = createDefaultFilters({ difficulty: 'medium' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(2);
      expect(result.map(q => q.id)).toEqual(['2', '4']);
    });

    it('filters by category correctly', () => {
      const filters = createDefaultFilters({ category: 'Work' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(2);
      expect(result.map(q => q.id)).toEqual(['1', '4']);
    });

    it('filters by search term in title', () => {
      const filters = createDefaultFilters({ search: 'project' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(2);
      expect(result.map(q => q.id)).toEqual(['1', '5']);
    });

    it('filters by search term in description', () => {
      const filters = createDefaultFilters({ search: 'typescript' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('filters by search term in tags', () => {
      const filters = createDefaultFilters({ search: 'react' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('combines multiple filters correctly', () => {
      const filters = createDefaultFilters({
        status: 'active',
        difficulty: 'medium',
        search: 'learn',
      });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('handles case-insensitive search', () => {
      const filters = createDefaultFilters({ search: 'COMPLETE' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('handles empty search string', () => {
      const filters = createDefaultFilters({ search: '' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(5);
    });

    it('handles whitespace-only search string', () => {
      const filters = createDefaultFilters({ search: '   ' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(5);
    });

    it('returns empty array when no quests match', () => {
      const filters = createDefaultFilters({ status: 'nonexistent' });
      const result = filterQuests(mockQuests, filters);

      expect(result).toHaveLength(0);
    });

    it('handles null/undefined quests array', () => {
      const filters = createDefaultFilters();
      expect(filterQuests(null as any, filters)).toEqual([]);
      expect(filterQuests(undefined as any, filters)).toEqual([]);
    });

    it('handles empty quests array', () => {
      const filters = createDefaultFilters();
      const result = filterQuests([], filters);

      expect(result).toEqual([]);
    });
  });

  describe('sortQuests', () => {
    it('sorts by title ascending by default', () => {
      const result = sortQuests(mockQuests, 'title', 'asc');

      expect(result[0].title).toBe('Complete Project Alpha');
      expect(result[1].title).toBe('Failed Photography Project');
      expect(result[2].title).toBe('Learn React Testing');
      expect(result[3].title).toBe('Morning Workout Routine');
      expect(result[4].title).toBe('Write Blog Post');
    });

    it('sorts by title descending', () => {
      const result = sortQuests(mockQuests, 'title', 'desc');

      expect(result[0].title).toBe('Write Blog Post');
      expect(result[1].title).toBe('Morning Workout Routine');
      expect(result[2].title).toBe('Learn React Testing');
      expect(result[3].title).toBe('Failed Photography Project');
      expect(result[4].title).toBe('Complete Project Alpha');
    });

    it('sorts by createdAt descending by default', () => {
      const result = sortQuests(mockQuests, 'createdAt', 'desc');

      expect(result[0].id).toBe('5'); // Most recent createdAt
      expect(result[4].id).toBe('1'); // Oldest createdAt
    });

    it('sorts by difficulty weight', () => {
      const result = sortQuests(mockQuests, 'difficulty', 'asc');

      // Easy (weight 1), Medium (weight 2), Medium (weight 2), Hard (weight 3), Hard (weight 3)
      expect(result.map(q => q.difficulty)).toEqual(['easy', 'medium', 'medium', 'hard', 'hard']);
    });

    it('sorts by rewardXp ascending', () => {
      const result = sortQuests(mockQuests, 'rewardXp', 'asc');

      expect(result.map(q => q.rewardXp)).toEqual([50, 75, 100, 150, 200]);
    });

    it('sorts by status priority', () => {
      const result = sortQuests(mockQuests, 'status', 'asc');

      // Draft (1), Active (2), Completed (3), Cancelled (4), Failed (5)
      expect(result.map(q => q.status)).toEqual(['draft', 'active', 'completed', 'cancelled', 'failed']);
    });

    it('handles null/undefined quests array', () => {
      expect(sortQuests(null as any)).toEqual([]);
      expect(sortQuests(undefined as any)).toEqual([]);
    });

    it('handles empty quests array', () => {
      const result = sortQuests([], 'title', 'asc');
      expect(result).toEqual([]);
    });

    it('handles invalid sortBy values', () => {
      const result = sortQuests(mockQuests, 'invalid' as any, 'asc');
      // Should not crash and return original order
      expect(result).toHaveLength(5);
    });
  });

  describe('filterAndSortQuests', () => {
    it('filters and sorts quests correctly', () => {
      const filters = createDefaultFilters({ category: 'Work' });
      const result = filterAndSortQuests(mockQuests, filters, 'rewardXp', 'desc');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1'); // 200 XP
      expect(result[1].id).toBe('4'); // 75 XP
    });

    it('handles empty results from filtering', () => {
      const filters = createDefaultFilters({ status: 'nonexistent' });
      const result = filterAndSortQuests(mockQuests, filters, 'title', 'asc');

      expect(result).toEqual([]);
    });
  });

  describe('getUniqueCategories', () => {
    it('extracts unique categories correctly', () => {
      const result = getUniqueCategories(mockQuests);

      expect(result).toEqual(['Work', 'Learning', 'Health', 'Creative']);
    });

    it('handles quests with duplicate categories', () => {
      const questsWithDuplicates = [
        ...mockQuests,
        { ...mockQuests[0], category: 'Work' }, // Duplicate
      ];

      const result = getUniqueCategories(questsWithDuplicates);
      expect(result).toEqual(['Work', 'Learning', 'Health', 'Creative']);
    });

    it('handles quests without categories', () => {
      const questsWithoutCategories = mockQuests.map(q => ({ ...q, category: undefined }));
      const result = getUniqueCategories(questsWithoutCategories);

      expect(result).toEqual([]);
    });

    it('handles null/undefined quests array', () => {
      expect(getUniqueCategories(null as any)).toEqual([]);
      expect(getUniqueCategories(undefined as any)).toEqual([]);
    });

    it('sorts categories alphabetically', () => {
      const unsortedQuests = [
        { category: 'Zulu' },
        { category: 'Alpha' },
        { category: 'Bravo' },
      ] as Quest[];

      const result = getUniqueCategories(unsortedQuests);
      expect(result).toEqual(['Alpha', 'Bravo', 'Zulu']);
    });
  });

  describe('getFilterStats', () => {
    it('calculates filter statistics correctly', () => {
      const filters = createDefaultFilters({ status: 'completed', search: 'project' });
      const stats = getFilterStats(mockQuests, filters);

      expect(stats.total).toBe(5);
      expect(stats.filtered).toBe(1); // Only quest 1 matches both filters
      expect(stats.activeFilters).toEqual(['Status: completed', 'Search: "project"']);
    });

    it('handles no active filters', () => {
      const filters = createDefaultFilters();
      const stats = getFilterStats(mockQuests, filters);

      expect(stats.total).toBe(5);
      expect(stats.filtered).toBe(5);
      expect(stats.activeFilters).toEqual([]);
    });

    it('handles empty quests array', () => {
      const filters = createDefaultFilters();
      const stats = getFilterStats([], filters);

      expect(stats.total).toBe(0);
      expect(stats.filtered).toBe(0);
      expect(stats.activeFilters).toEqual([]);
    });
  });

  describe('validateFilters', () => {
    it('validates correct filter object', () => {
      const filters = createDefaultFilters();
      expect(validateFilters(filters)).toBe(true);
    });

    it('rejects null/undefined filters', () => {
      expect(validateFilters(null)).toBe(false);
      expect(validateFilters(undefined)).toBe(false);
    });

    it('rejects non-object filters', () => {
      expect(validateFilters('string')).toBe(false);
      expect(validateFilters(123)).toBe(false);
      expect(validateFilters([])).toBe(false);
    });

    it('rejects filters missing required keys', () => {
      const invalidFilters = { status: 'all', difficulty: 'all' };
      expect(validateFilters(invalidFilters)).toBe(false);
    });

    it('rejects filters with wrong key types', () => {
      const invalidFilters = {
        status: 123,
        difficulty: 'all',
        category: 'all',
        search: 'test',
      };
      expect(validateFilters(invalidFilters)).toBe(false);
    });
  });

  describe('createDefaultFilters', () => {
    it('creates default filters', () => {
      const result = createDefaultFilters();

      expect(result).toEqual({
        status: 'all',
        difficulty: 'all',
        category: 'all',
        search: '',
      });
    });

    it('merges overrides with defaults', () => {
      const result = createDefaultFilters({
        status: 'completed',
        search: 'test',
      });

      expect(result).toEqual({
        status: 'completed',
        difficulty: 'all',
        category: 'all',
        search: 'test',
      });
    });
  });

  describe('hasActiveFilters', () => {
    it('detects active filters correctly', () => {
      expect(hasActiveFilters(createDefaultFilters())).toBe(false);
      expect(hasActiveFilters(createDefaultFilters({ status: 'completed' }))).toBe(true);
      expect(hasActiveFilters(createDefaultFilters({ search: 'test' }))).toBe(true);
      expect(hasActiveFilters(createDefaultFilters({ search: '' }))).toBe(false);
      expect(hasActiveFilters(createDefaultFilters({ search: '   ' }))).toBe(false);
    });
  });

  describe('getActiveFilterCount', () => {
    it('counts active filters correctly', () => {
      expect(getActiveFilterCount(createDefaultFilters())).toBe(0);
      expect(getActiveFilterCount(createDefaultFilters({ status: 'completed' }))).toBe(1);
      expect(getActiveFilterCount(createDefaultFilters({
        status: 'completed',
        difficulty: 'hard',
        search: 'test',
      }))).toBe(3);
    });
  });
});


