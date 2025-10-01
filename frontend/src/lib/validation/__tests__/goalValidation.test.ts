import { describe, test, expect } from 'vitest';
import {
  goalCreateSchema,
  goalUpdateSchema,
  titleSchema,
  deadlineSchema,
  nlpAnswerSchema,
  categorySchema
} from '../goalValidation';

describe('goalValidation', () => {
  describe('titleSchema', () => {
    test('validates required title', () => {
      const result = titleSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    test('validates title minimum length', () => {
      const result = titleSchema.safeParse('ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    test('validates title maximum length', () => {
      const longTitle = 'a'.repeat(101);
      const result = titleSchema.safeParse(longTitle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 100 characters');
      }
    });

    test('accepts valid title', () => {
      const result = titleSchema.safeParse('Learn TypeScript');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Learn TypeScript');
      }
    });

    test('trims whitespace', () => {
      const result = titleSchema.safeParse('  Learn TypeScript  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Learn TypeScript');
      }
    });
  });

  describe('deadlineSchema', () => {
    test('validates required deadline', () => {
      const result = deadlineSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    test('validates date format', () => {
      const result = deadlineSchema.safeParse('2024/12/31');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('YYYY-MM-DD format');
      }
    });

    test('validates future date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      const result = deadlineSchema.safeParse(pastDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be in the future');
      }
    });

    test('accepts valid future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const result = deadlineSchema.safeParse(futureDate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(futureDate);
      }
    });

    test('validates invalid date', () => {
      const result = deadlineSchema.safeParse('2024-02-30');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid calendar date');
      }
    });
  });

  describe('nlpAnswerSchema', () => {
    test('validates required answer', () => {
      const result = nlpAnswerSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    test('validates minimum length', () => {
      const result = nlpAnswerSchema.safeParse('short');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 10 characters');
      }
    });

    test('validates maximum length', () => {
      const longAnswer = 'a'.repeat(501);
      const result = nlpAnswerSchema.safeParse(longAnswer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 500 characters');
      }
    });

    test('accepts valid answer', () => {
      const result = nlpAnswerSchema.safeParse('I will learn TypeScript programming language');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('I will learn TypeScript programming language');
      }
    });

    test('trims whitespace', () => {
      const result = nlpAnswerSchema.safeParse('  I will learn TypeScript  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('I will learn TypeScript');
      }
    });
  });

  describe('categorySchema', () => {
    test('accepts valid predefined categories', () => {
      const validCategories = ['Learning', 'Health', 'Career', 'Personal', 'Financial', 'Creative', 'Social', 'Other'];
      
      validCategories.forEach(category => {
        const result = categorySchema.safeParse(category);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(category);
        }
      });
    });

    test('accepts custom category', () => {
      const result = categorySchema.safeParse('Custom Category');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Custom Category');
      }
    });

    test('accepts empty category', () => {
      const result = categorySchema.safeParse('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    test('validates category length', () => {
      const longCategory = 'a'.repeat(51);
      const result = categorySchema.safeParse(longCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 50 characters');
      }
    });

    test('trims whitespace', () => {
      const result = categorySchema.safeParse('  Learning  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Learning');
      }
    });
  });

  describe('goalCreateSchema', () => {
    test('validates complete valid goal data', () => {
      const validGoal = {
        title: 'Learn TypeScript',
        description: 'Master TypeScript programming language',
        deadline: '2024-12-31',
        category: 'Learning',
        nlpAnswers: {
          positive: 'I will learn TypeScript programming language',
          specific: 'Complete 3 comprehensive TypeScript courses',
          evidence: 'I will have built 5 TypeScript projects',
          resources: 'Online courses, books, and practice projects',
          obstacles: 'Time management and complex type system concepts',
          ecology: 'This will help advance my career as a developer',
          timeline: '3 months starting January 2024',
          firstStep: 'Enroll in the first TypeScript course'
        }
      };

      const result = goalCreateSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Learn TypeScript');
        expect(result.data.deadline).toBe('2024-12-31');
      }
    });

    test('validates required fields', () => {
      const incompleteGoal = {
        title: '',
        deadline: '',
        nlpAnswers: {}
      };

      const result = goalCreateSchema.safeParse(incompleteGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('Goal title is required');
        expect(errors).toContain('Deadline is required');
      }
    });

    test('validates NLP answers', () => {
      const goalWithInvalidNLP = {
        title: 'Learn TypeScript',
        deadline: '2024-12-31',
        nlpAnswers: {
          positive: 'short', // Too short
          specific: 'Complete courses',
          evidence: 'I will have projects',
          resources: 'Online courses',
          obstacles: 'Time management',
          ecology: 'Career advancement',
          timeline: '3 months',
          firstStep: 'Enroll'
        }
      };

      const result = goalCreateSchema.safeParse(goalWithInvalidNLP);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors.some(error => error.includes('at least 10 characters'))).toBe(true);
      }
    });

    test('accepts optional fields', () => {
      const minimalGoal = {
        title: 'Learn TypeScript',
        deadline: '2024-12-31',
        nlpAnswers: {
          positive: 'I will learn TypeScript programming language',
          specific: 'Complete 3 comprehensive TypeScript courses',
          evidence: 'I will have built 5 TypeScript projects',
          resources: 'Online courses, books, and practice projects',
          obstacles: 'Time management and complex type system concepts',
          ecology: 'This will help advance my career as a developer',
          timeline: '3 months starting January 2024',
          firstStep: 'Enroll in the first TypeScript course'
        }
      };

      const result = goalCreateSchema.safeParse(minimalGoal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
        expect(result.data.category).toBe('');
      }
    });
  });

  describe('goalUpdateSchema', () => {
    test('validates partial update data', () => {
      const partialUpdate = {
        title: 'Updated Goal Title',
        status: 'completed'
      };

      const result = goalUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Goal Title');
        expect(result.data.status).toBe('completed');
      }
    });

    test('validates title when provided', () => {
      const updateWithInvalidTitle = {
        title: 'ab' // Too short
      };

      const result = goalUpdateSchema.safeParse(updateWithInvalidTitle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    test('validates deadline when provided', () => {
      const updateWithInvalidDeadline = {
        deadline: '2023-01-01' // Past date
      };

      const result = goalUpdateSchema.safeParse(updateWithInvalidDeadline);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be in the future');
      }
    });

    test('validates status when provided', () => {
      const updateWithInvalidStatus = {
        status: 'invalid-status'
      };

      const result = goalUpdateSchema.safeParse(updateWithInvalidStatus);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid status');
      }
    });

    test('accepts valid status values', () => {
      const validStatuses = ['active', 'paused', 'completed', 'archived'];
      
      validStatuses.forEach(status => {
        const result = goalUpdateSchema.safeParse({ status });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    test('validates NLP answers when provided', () => {
      const updateWithInvalidNLP = {
        nlpAnswers: {
          positive: 'short' // Too short
        }
      };

      const result = goalUpdateSchema.safeParse(updateWithInvalidNLP);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 10 characters');
      }
    });

    test('accepts empty update object', () => {
      const result = goalUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });
  });

  describe('Edge Cases', () => {
    test('handles null and undefined values', () => {
      const result = goalCreateSchema.safeParse({
        title: null,
        deadline: undefined,
        nlpAnswers: null
      });

      expect(result.success).toBe(false);
    });

    test('handles non-string values', () => {
      const result = goalCreateSchema.safeParse({
        title: 123,
        deadline: true,
        nlpAnswers: 'not an object'
      });

      expect(result.success).toBe(false);
    });

    test('handles extra fields gracefully', () => {
      const goalWithExtraFields = {
        title: 'Learn TypeScript',
        deadline: '2024-12-31',
        nlpAnswers: {
          positive: 'I will learn TypeScript programming language',
          specific: 'Complete 3 comprehensive TypeScript courses',
          evidence: 'I will have built 5 TypeScript projects',
          resources: 'Online courses, books, and practice projects',
          obstacles: 'Time management and complex type system concepts',
          ecology: 'This will help advance my career as a developer',
          timeline: '3 months starting January 2024',
          firstStep: 'Enroll in the first TypeScript course'
        },
        extraField: 'should be ignored',
        anotherExtra: 123
      };

      const result = goalCreateSchema.safeParse(goalWithExtraFields);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
        expect(result.data).not.toHaveProperty('anotherExtra');
      }
    });
  });

  describe('Internationalization', () => {
    test('uses translation keys for error messages', () => {
      const result = titleSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        // Error messages should use translation keys
        expect(result.error.issues[0].message).toContain('goalCreation.validation.titleRequired');
      }
    });

    test('uses translation keys for deadline errors', () => {
      const result = deadlineSchema.safeParse('invalid-date');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('goalCreation.validation.deadlineFormat');
      }
    });

    test('uses translation keys for NLP answer errors', () => {
      const result = nlpAnswerSchema.safeParse('short');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('goalCreation.validation.nlpAnswerMinLength');
      }
    });
  });
});
