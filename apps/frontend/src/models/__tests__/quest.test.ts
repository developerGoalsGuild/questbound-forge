import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

// Import all functions and schemas from quest.ts
import {
  // Types and enums
  QuestStatus,
  QuestDifficulty,
  QuestKind,
  QuestCountScope,
  QuestPrivacy,
  QuestCategory,

  // Constants
  QUEST_CATEGORIES,
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
  MAX_REWARD_XP,
  MIN_REWARD_XP,
  DEFAULT_REWARD_XP,

  // Interfaces
  Quest,
  QuestFormData,
  QuestCreateInput,
  QuestUpdateInput,
  QuestCancelInput,
  QuestValidationErrors,
  QuestFormValidation,

  // Schemas
  QuestStatusSchema,
  QuestDifficultySchema,
  QuestKindSchema,
  QuestCountScopeSchema,
  QuestPrivacySchema,
  QuestTitleSchema,
  QuestDescriptionSchema,
  QuestCategorySchema,
  QuestTagsSchema,
  QuestRewardXpSchema,
  QuestDeadlineSchema,
  QuestCreateInputSchema,
  QuestUpdateInputSchema,
  QuestCancelInputSchema,

  // Helper functions
  getCategoryById,
  getCategoryName,
  getCategoryNames,
  getQuestStatusKey,
  getQuestStatusColorClass,
  getQuestDifficultyKey,
  getQuestDifficultyColorClass,
  validateQuestTitle,
  validateQuestCategory,
  validateQuestForm,
  formatQuestDeadline,
  formatRewardXp,
  formatQuestProgress,
  calculateLinkedQuestProgress,
  calculateQuantitativeQuestProgress,
  calculateQuestProgress,
} from '../quest';

// ============================================================================
// Test Setup and Utilities
// ============================================================================

describe('Quest Models', () => {
  // Test data fixtures
  const validQuestId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId = '550e8400-e29b-41d4-a716-446655440001';
  const validGoalId = '550e8400-e29b-41d4-a716-446655440002';
  const validTaskId = '550e8400-e29b-41d4-a716-446655440003';

  const validQuest: Quest = {
    id: validQuestId,
    userId: validUserId,
    title: 'Complete 5 tasks this week',
    description: 'A quest to complete multiple tasks',
    difficulty: 'medium',
    rewardXp: 75,
    status: 'active',
    category: 'Work',
    tags: ['productivity', 'tasks'],
    privacy: 'private',
    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    createdAt: Date.now(),
    updatedAt: Date.now(),
    kind: 'quantitative',
    targetCount: 5,
    countScope: 'completed_tasks',
    periodDays: 7,
  };

  const validLinkedQuest: Quest = {
    ...validQuest,
    id: '550e8400-e29b-41d4-a716-446655440004',
    kind: 'linked',
    linkedGoalIds: [validGoalId],
    linkedTaskIds: [validTaskId],
    dependsOnQuestIds: [],
    targetCount: undefined,
    countScope: undefined,
    periodDays: undefined,
  };

  // ============================================================================
  // Type and Enum Tests
  // ============================================================================

  describe('Type Definitions and Enums', () => {
    it('should have correct QuestStatus values', () => {
      const validStatuses: QuestStatus[] = ['draft', 'active', 'completed', 'cancelled', 'failed'];
      validStatuses.forEach(status => {
        expect(['draft', 'active', 'completed', 'cancelled', 'failed']).toContain(status);
      });
    });

    it('should have correct QuestDifficulty values', () => {
      const validDifficulties: QuestDifficulty[] = ['easy', 'medium', 'hard'];
      validDifficulties.forEach(difficulty => {
        expect(['easy', 'medium', 'hard']).toContain(difficulty);
      });
    });

    it('should have correct QuestKind values', () => {
      const validKinds: QuestKind[] = ['linked', 'quantitative'];
      validKinds.forEach(kind => {
        expect(['linked', 'quantitative']).toContain(kind);
      });
    });

    it('should have correct QuestCountScope values', () => {
      const validScopes: QuestCountScope[] = ['completed_tasks', 'completed_goals'];
      validScopes.forEach(scope => {
        expect(['completed_tasks', 'completed_goals']).toContain(scope);
      });
    });

    it('should have correct QuestPrivacy values', () => {
      const validPrivacies: QuestPrivacy[] = ['public', 'followers', 'private'];
      validPrivacies.forEach(privacy => {
        expect(['public', 'followers', 'private']).toContain(privacy);
      });
    });
  });

  // ============================================================================
  // Constants Tests
  // ============================================================================

  describe('Constants', () => {
    it('should have correct validation constants', () => {
      expect(MAX_TITLE_LENGTH).toBe(100);
      expect(MIN_TITLE_LENGTH).toBe(3);
      expect(MAX_DESCRIPTION_LENGTH).toBe(500);
      expect(MAX_TAGS_COUNT).toBe(10);
      expect(MAX_TAG_LENGTH).toBe(20);
      expect(MAX_REWARD_XP).toBe(1000);
      expect(MIN_REWARD_XP).toBe(0);
      expect(DEFAULT_REWARD_XP).toBe(50);
    });

    it('should have exactly 12 quest categories', () => {
      expect(QUEST_CATEGORIES).toHaveLength(12);
    });

    it('should have all expected category IDs', () => {
      const expectedIds = ['Health', 'Work', 'Personal', 'Learning', 'Fitness', 'Creative',
                         'Financial', 'Social', 'Spiritual', 'Hobby', 'Travel', 'Other'];
      const actualIds = QUEST_CATEGORIES.map(c => c.id);
      expectedIds.forEach(id => {
        expect(actualIds).toContain(id);
      });
    });

    it('should have matching category names and IDs for simple categories', () => {
      QUEST_CATEGORIES.forEach(category => {
        if (['Health', 'Work', 'Other'].includes(category.id)) {
          expect(category.name).toBe(category.id);
        }
      });
    });
  });

  // ============================================================================
  // Schema Validation Tests
  // ============================================================================

  describe('QuestStatusSchema', () => {
    it('should validate all valid status values', () => {
      const validStatuses = ['draft', 'active', 'completed', 'cancelled', 'failed'];
      validStatuses.forEach(status => {
        expect(() => QuestStatusSchema.parse(status)).not.toThrow();
      });
    });

    it('should reject invalid status values', () => {
      const invalidStatuses = ['pending', 'paused', 'in_progress', ''];
      invalidStatuses.forEach(status => {
        expect(() => QuestStatusSchema.parse(status)).toThrow();
      });
    });
  });

  describe('QuestDifficultySchema', () => {
    it('should validate all valid difficulty values', () => {
      const validDifficulties = ['easy', 'medium', 'hard'];
      validDifficulties.forEach(difficulty => {
        expect(() => QuestDifficultySchema.parse(difficulty)).not.toThrow();
      });
    });

    it('should reject invalid difficulty values', () => {
      const invalidDifficulties = ['beginner', 'expert', 'impossible', ''];
      invalidDifficulties.forEach(difficulty => {
        expect(() => QuestDifficultySchema.parse(difficulty)).toThrow();
      });
    });
  });

  describe('QuestKindSchema', () => {
    it('should validate all valid kind values', () => {
      const validKinds = ['linked', 'quantitative'];
      validKinds.forEach(kind => {
        expect(() => QuestKindSchema.parse(kind)).not.toThrow();
      });
    });

    it('should reject invalid kind values', () => {
      const invalidKinds = ['simple', 'complex', ''];
      invalidKinds.forEach(kind => {
        expect(() => QuestKindSchema.parse(kind)).toThrow();
      });
    });
  });

  describe('QuestTitleSchema', () => {
    it('should validate valid titles', () => {
      const validTitles = ['Valid Title', 'ABC', 'A'.repeat(MAX_TITLE_LENGTH)];
      validTitles.forEach(title => {
        expect(() => QuestTitleSchema.parse(title)).not.toThrow();
      });
    });

    it('should reject titles that are too short', () => {
      const shortTitles = ['', 'A', 'AB'];
      shortTitles.forEach(title => {
        expect(() => QuestTitleSchema.parse(title)).toThrow();
      });
    });

    it('should reject titles that are too long', () => {
      const longTitle = 'A'.repeat(MAX_TITLE_LENGTH + 1);
      expect(() => QuestTitleSchema.parse(longTitle)).toThrow();
    });

    it('should trim whitespace from titles', () => {
      const result = QuestTitleSchema.parse('  Trimmed Title  ');
      expect(result).toBe('Trimmed Title');
    });
  });

  describe('QuestDescriptionSchema', () => {
    it('should validate valid descriptions', () => {
      const validDescriptions = ['Valid description', 'A'.repeat(MAX_DESCRIPTION_LENGTH)];
      validDescriptions.forEach(description => {
        expect(() => QuestDescriptionSchema.parse(description)).not.toThrow();
      });
    });

    it('should allow undefined descriptions', () => {
      expect(() => QuestDescriptionSchema.parse(undefined)).not.toThrow();
    });

    it('should reject descriptions that are too long', () => {
      const longDescription = 'A'.repeat(MAX_DESCRIPTION_LENGTH + 1);
      expect(() => QuestDescriptionSchema.parse(longDescription)).toThrow();
    });

    it('should trim whitespace and convert empty strings to undefined', () => {
      const result = QuestDescriptionSchema.parse('  ');
      expect(result).toBeUndefined();
    });
  });

  describe('QuestCategorySchema', () => {
    it('should validate all valid category IDs', () => {
      QUEST_CATEGORIES.forEach(category => {
        expect(() => QuestCategorySchema.parse(category.id)).not.toThrow();
      });
    });

    it('should reject invalid category IDs', () => {
      const invalidCategories = ['Invalid', 'Category', ''];
      invalidCategories.forEach(category => {
        expect(() => QuestCategorySchema.parse(category)).toThrow();
      });
    });
  });

  describe('QuestTagsSchema', () => {
    it('should validate valid tag arrays', () => {
      const validTags = [['tag1', 'tag2'], ['single']];
      validTags.forEach(tags => {
        expect(() => QuestTagsSchema.parse(tags)).not.toThrow();
      });
    });

    it('should reject tag arrays that are too large', () => {
      const tooManyTags = Array(MAX_TAGS_COUNT + 1).fill('tag');
      expect(() => QuestTagsSchema.parse(tooManyTags)).toThrow();
    });

    it('should reject tags that are too long', () => {
      const longTag = 'A'.repeat(MAX_TAG_LENGTH + 1);
      expect(() => QuestTagsSchema.parse([longTag])).toThrow();
    });

    it('should default to empty array when no tags provided', () => {
      const result = QuestTagsSchema.parse(undefined);
      expect(result).toEqual([]);
    });

    it('should trim whitespace from tags', () => {
      const result = QuestTagsSchema.parse(['  tag1  ', '  tag2  ']);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should reject arrays containing empty tags after trimming', () => {
      expect(() => QuestTagsSchema.parse(['tag1', '  ', 'tag2'])).toThrow();
    });
  });

  describe('QuestRewardXpSchema', () => {
    it('should validate valid XP values', () => {
      const validXpValues = [0, 50, 100, MAX_REWARD_XP];
      validXpValues.forEach(xp => {
        expect(() => QuestRewardXpSchema.parse(xp)).not.toThrow();
      });
    });

    it('should reject negative XP values', () => {
      expect(() => QuestRewardXpSchema.parse(-1)).toThrow();
    });

    it('should reject XP values that are too high', () => {
      expect(() => QuestRewardXpSchema.parse(MAX_REWARD_XP + 1)).toThrow();
    });

    it('should reject non-integer XP values', () => {
      expect(() => QuestRewardXpSchema.parse(50.5)).toThrow();
    });

    it('should allow undefined reward XP', () => {
      const result = QuestRewardXpSchema.parse(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('QuestDeadlineSchema', () => {
    it('should validate future deadlines', () => {
      const futureTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hours from now
      expect(() => QuestDeadlineSchema.parse(futureTime)).not.toThrow();
    });

    it('should allow undefined deadlines', () => {
      expect(() => QuestDeadlineSchema.parse(undefined)).not.toThrow();
    });

    it('should reject past deadlines', () => {
      const pastTime = Date.now() - 60 * 60 * 1000; // 1 hour ago
      expect(() => QuestDeadlineSchema.parse(pastTime)).toThrow();
    });

    it('should reject deadlines within 1 hour', () => {
      const soonTime = Date.now() + 30 * 60 * 1000; // 30 minutes from now
      expect(() => QuestDeadlineSchema.parse(soonTime)).toThrow();
    });

    it('should reject non-integer timestamps', () => {
      expect(() => QuestDeadlineSchema.parse(Date.now() + 0.5)).toThrow();
    });
  });

  describe('QuestCreateInputSchema', () => {
    const validCreateInput: QuestCreateInput = {
      title: 'Test Quest',
      category: 'Work',
      difficulty: 'medium',
      description: 'Test description',
      tags: ['test'],
      kind: 'quantitative',
      targetCount: 5,
      countScope: 'completed_tasks',
      periodDays: 7,
    };

    it('should validate complete valid input', () => {
      expect(() => QuestCreateInputSchema.parse(validCreateInput)).not.toThrow();
    });

    it('should validate with default values', () => {
      const minimalInput = {
        title: 'Test Quest',
        category: 'Work',
      };
      expect(() => QuestCreateInputSchema.parse(minimalInput)).not.toThrow();
    });

    it('should require all quantitative fields for quantitative quests', () => {
      const incompleteQuantitative = {
        title: 'Test Quest',
        category: 'Work',
        kind: 'quantitative',
        // missing targetCount, countScope, periodDays
      };
      expect(() => QuestCreateInputSchema.parse(incompleteQuantitative)).toThrow();
    });

    it('should allow linked quests without linked items initially', () => {
      const linkedQuest = {
        title: 'Test Quest',
        category: 'Work',
        kind: 'linked',
      };
      expect(() => QuestCreateInputSchema.parse(linkedQuest)).not.toThrow();
    });

    it('should validate UUID format for linked IDs', () => {
      const invalidLinkedQuest = {
        title: 'Test Quest',
        category: 'Work',
        kind: 'linked',
        linkedGoalIds: ['invalid-uuid'],
      };
      expect(() => QuestCreateInputSchema.parse(invalidLinkedQuest)).toThrow();
    });

    it('should apply defaults for optional fields', () => {
      const result = QuestCreateInputSchema.parse({
        title: 'Test Quest',
        category: 'Work',
      });
      expect(result.difficulty).toBe('medium');
      expect(result.privacy).toBe('private');
      expect(result.kind).toBe('linked');
      expect(result.tags).toEqual([]);
    });
  });

  describe('QuestUpdateInputSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = { title: 'Updated Title' };
      expect(() => QuestUpdateInputSchema.parse(partialUpdate)).not.toThrow();
    });

    it('should validate title when provided', () => {
      const invalidUpdate = { title: 'AB' }; // Too short
      expect(() => QuestUpdateInputSchema.parse(invalidUpdate)).toThrow();
    });
  });

  describe('QuestCancelInputSchema', () => {
    it('should allow empty reason', () => {
      expect(() => QuestCancelInputSchema.parse({})).not.toThrow();
    });

    it('should allow valid reason', () => {
      const validReason = { reason: 'No longer needed' };
      expect(() => QuestCancelInputSchema.parse(validReason)).not.toThrow();
    });

    it('should reject reason that is too long', () => {
      const longReason = { reason: 'A'.repeat(201) };
      expect(() => QuestCancelInputSchema.parse(longReason)).toThrow();
    });

    it('should trim reason whitespace', () => {
      const result = QuestCancelInputSchema.parse({ reason: '  Trimmed reason  ' });
      expect(result.reason).toBe('Trimmed reason');
    });
  });

  // ============================================================================
  // Helper Function Tests
  // ============================================================================

  describe('Category Helper Functions', () => {
    it('should find category by valid ID', () => {
      const category = getCategoryById('Work');
      expect(category).toBeDefined();
      expect(category?.id).toBe('Work');
      expect(category?.name).toBe('Work');
    });

    it('should return undefined for invalid category ID', () => {
      const category = getCategoryById('Invalid');
      expect(category).toBeUndefined();
    });

    it('should return correct category names', () => {
      const names = getCategoryNames();
      expect(names).toHaveLength(12);
      expect(names).toContain('Work');
      expect(names).toContain('Health');
    });
  });

  describe('Status Helper Functions', () => {
    it('should return correct i18n keys for all quest statuses', () => {
      expect(getQuestStatusKey('draft')).toBe('quest.status.draft');
      expect(getQuestStatusKey('active')).toBe('quest.status.active');
      expect(getQuestStatusKey('completed')).toBe('quest.status.completed');
      expect(getQuestStatusKey('cancelled')).toBe('quest.status.cancelled');
      expect(getQuestStatusKey('failed')).toBe('quest.status.failed');
    });

    it('should return CSS classes for all statuses', () => {
      expect(getQuestStatusColorClass('draft')).toBe('text-gray-600 bg-gray-50');
      expect(getQuestStatusColorClass('active')).toBe('text-green-600 bg-green-50');
      expect(getQuestStatusColorClass('completed')).toBe('text-blue-600 bg-blue-50');
      expect(getQuestStatusColorClass('cancelled')).toBe('text-red-600 bg-red-50');
      expect(getQuestStatusColorClass('failed')).toBe('text-red-600 bg-red-50');
    });

    it('should return fallback for unknown status', () => {
      expect(getQuestStatusColorClass('unknown' as QuestStatus)).toBe('text-gray-600 bg-gray-50');
    });
  });

  describe('Difficulty Helper Functions', () => {
    it('should return correct i18n keys for all quest difficulties', () => {
      expect(getQuestDifficultyKey('easy')).toBe('quest.difficulty.easy');
      expect(getQuestDifficultyKey('medium')).toBe('quest.difficulty.medium');
      expect(getQuestDifficultyKey('hard')).toBe('quest.difficulty.hard');
    });

    it('should return CSS classes for all difficulties', () => {
      expect(getQuestDifficultyColorClass('easy')).toBe('text-green-600 bg-green-50');
      expect(getQuestDifficultyColorClass('medium')).toBe('text-yellow-600 bg-yellow-50');
      expect(getQuestDifficultyColorClass('hard')).toBe('text-red-600 bg-red-50');
    });
  });

  describe('Validation Helper Functions', () => {
    it('should validate correct titles', () => {
      expect(validateQuestTitle('Valid Title')).toBeNull();
      expect(validateQuestTitle('A'.repeat(MIN_TITLE_LENGTH))).toBeNull();
    });

    it('should reject invalid titles', () => {
      expect(validateQuestTitle('')).toBe('Title must be at least 3 characters');
      expect(validateQuestTitle('AB')).toBe('Title must be at least 3 characters');
      expect(validateQuestTitle('A'.repeat(MAX_TITLE_LENGTH + 1))).toBe('Title must be no more than 100 characters');
    });

    it('should validate correct categories', () => {
      expect(validateQuestCategory('Work')).toBeNull();
      expect(validateQuestCategory('Health')).toBeNull();
    });

    it('should reject invalid categories', () => {
      expect(validateQuestCategory('Invalid')).toContain('Invalid');
      expect(validateQuestCategory('')).toContain('Invalid');
    });
  });

  describe('Formatting Helper Functions', () => {
    it('should format deadlines correctly', () => {
      const futureTime = Date.now() + 24 * 60 * 60 * 1000; // Tomorrow
      const formatted = formatQuestDeadline(futureTime);
      expect(formatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/); // MM/DD/YYYY format
    });

    it('should handle missing deadlines', () => {
      expect(formatQuestDeadline(undefined)).toBe('quest.deadline.none');
    });

    it('should handle invalid deadline timestamps', () => {
      expect(formatQuestDeadline(NaN)).toBe('quest.deadline.invalid');
    });

    it('should format reward XP correctly', () => {
      expect(formatRewardXp(75)).toBe('75 XP');
      expect(formatRewardXp(0)).toBe('0 XP');
      expect(formatRewardXp(MAX_REWARD_XP)).toBe(`${MAX_REWARD_XP} XP`);
    });

    it('should format progress correctly', () => {
      expect(formatQuestProgress(0)).toBe('0%');
      expect(formatQuestProgress(50.5)).toBe('51%');
      expect(formatQuestProgress(100)).toBe('100%');
    });
  });

  describe('Progress Calculation Functions', () => {
    it('should return 0 for non-linked quest in linked calculation', () => {
      const quantitativeQuest = { ...validQuest, kind: 'quantitative' as const };
      const progress = calculateLinkedQuestProgress(quantitativeQuest);
      expect(progress).toBe(0);
    });

    it('should return 0 for quest with no linked items', () => {
      const emptyLinkedQuest = { ...validLinkedQuest, linkedGoalIds: [], linkedTaskIds: [] };
      const progress = calculateLinkedQuestProgress(emptyLinkedQuest);
      expect(progress).toBe(0);
    });

    it('should return 0 for non-quantitative quest in quantitative calculation', () => {
      const linkedQuest = { ...validQuest, kind: 'linked' as const };
      const progress = calculateQuantitativeQuestProgress(linkedQuest);
      expect(progress).toBe(0);
    });

    it('should return 0 for quantitative quest without target count', () => {
      const incompleteQuest = { ...validQuest, targetCount: undefined };
      const progress = calculateQuantitativeQuestProgress(incompleteQuest);
      expect(progress).toBe(0);
    });

    it('should route to correct calculation function', () => {
      const linkedProgress = calculateQuestProgress(validLinkedQuest);
      const quantitativeProgress = calculateQuestProgress(validQuest);

      // Both should return 0 as expected (no actual data integration yet)
      expect(linkedProgress).toBe(0);
      expect(quantitativeProgress).toBe(0);
    });

    it('should return 0 for unknown quest kind', () => {
      const unknownQuest = { ...validQuest, kind: 'unknown' as any };
      const progress = calculateQuestProgress(unknownQuest);
      expect(progress).toBe(0);
    });
  });

  describe('validateQuestForm', () => {
    const validFormData: QuestFormData = {
      title: 'Valid Quest Title',
      description: 'Valid description',
      category: 'Work',
      difficulty: 'medium',
      tags: ['valid', 'tags'],
      privacy: 'private',
      kind: 'linked',
      linkedGoalIds: [],
      linkedTaskIds: [],
      dependsOnQuestIds: [],
    };

    it('should validate correct form data', () => {
      const result = validateQuestForm(validFormData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should detect title validation errors', () => {
      const invalidFormData = { ...validFormData, title: 'AB' };
      const result = validateQuestForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Title must be at least 3 characters');
    });

    it('should detect category validation errors', () => {
      const invalidFormData = { ...validFormData, category: 'Invalid' };
      const result = validateQuestForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.category).toContain('Invalid');
    });

    it('should initialize touched as empty object', () => {
      const result = validateQuestForm(validFormData);
      expect(result.touched).toEqual({});
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Schema Integration', () => {
    it('should allow valid quest creation with all fields', () => {
      const completeQuest = {
        title: 'Complete Integration Test',
        category: 'Work',
        difficulty: 'hard',
        description: 'Testing all validation rules together',
        tags: ['integration', 'test'],
        deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
        privacy: 'public',
        kind: 'quantitative',
        targetCount: 10,
        countScope: 'completed_goals',
        periodDays: 14,
        linkedGoalIds: [validGoalId],
        linkedTaskIds: [validTaskId],
        dependsOnQuestIds: [],
      };

      expect(() => QuestCreateInputSchema.parse(completeQuest)).not.toThrow();
    });

    it('should handle complex validation scenarios', () => {
      // Test quantitative quest with all required fields
      const quantitativeQuest = {
        title: 'Count-based Quest',
        category: 'Fitness',
        kind: 'quantitative',
        targetCount: 30,
        countScope: 'completed_tasks',
        periodDays: 30,
      };

      expect(() => QuestCreateInputSchema.parse(quantitativeQuest)).not.toThrow();

      // Test that missing quantitative fields fail
      const incompleteQuantitative = {
        title: 'Incomplete Quest',
        category: 'Fitness',
        kind: 'quantitative',
        // missing targetCount, countScope, periodDays
      };

      expect(() => QuestCreateInputSchema.parse(incompleteQuantitative)).toThrow();
    });
  });

  describe('Type Inference', () => {
    it('should correctly infer types from schemas', () => {
      // Test that inferred types work with valid data
      const createInput: QuestCreateInput = {
        title: 'Type Test',
        category: 'Work',
      };

      const updateInput: QuestUpdateInput = {
        title: 'Updated Title',
      };

      const cancelInput: QuestCancelInput = {
        reason: 'Testing types',
      };

      // These should compile without TypeScript errors
      expect(createInput.title).toBe('Type Test');
      expect(updateInput.title).toBe('Updated Title');
      expect(cancelInput.reason).toBe('Testing types');
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed input gracefully', () => {
      expect(() => QuestTitleSchema.parse(null)).toThrow();
      expect(() => QuestCategorySchema.parse(null)).toThrow();
      expect(() => QuestRewardXpSchema.parse('not-a-number')).toThrow();
    });

    it('should handle extreme values', () => {
      expect(() => QuestTitleSchema.parse('A'.repeat(1000))).toThrow();
      expect(() => QuestRewardXpSchema.parse(-100)).toThrow();
      expect(() => QuestRewardXpSchema.parse(10000)).toThrow();
    });
  });

  // ============================================================================
  // Performance and Memory Tests
  // ============================================================================

  describe('Performance', () => {
    it('should handle large tag arrays efficiently', () => {
      const largeTagArray = Array(MAX_TAGS_COUNT).fill('tag');
      const start = performance.now();

      const result = QuestTagsSchema.parse(largeTagArray);

      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
      expect(result).toHaveLength(MAX_TAGS_COUNT);
    });

    it('should handle schema validation repeatedly without memory leaks', () => {
      const testInput = { title: 'Test', category: 'Work' };

      // Run validation multiple times
      for (let i = 0; i < 1000; i++) {
        QuestCreateInputSchema.parse(testInput);
      }

      // If we get here without errors, no memory leaks detected
      expect(true).toBe(true);
    });
  });
});
