# Task 2.1 - Frontend Quest TypeScript Models - Detailed Implementation Plan

## Overview
This document provides the detailed implementation plan for Task 2.1: Frontend Quest TypeScript Models. This task creates the foundational TypeScript interfaces, types, and validation schemas for the Quest feature in the frontend application.

## Implementation Context
Based on comprehensive analysis and clarifications:

✅ **Zod Validation**: Already installed, use existing version and patterns
✅ **Categories**: Use exact categories from backend `QUEST_CATEGORIES` list
✅ **Validation Errors**: Follow exact `GoalValidationErrors` pattern with nested objects
✅ **Helper Functions**: Follow project patterns (camelCase naming)
✅ **File Naming**: `quest.ts` (camelCase, following existing `goal.ts` pattern)
✅ **React Guidelines**: Follow project's React Frontend Development Guidelines

## File Structure
```
frontend/src/models/quest.ts (NEW FILE)
```

## Phase 1: Core Type Definitions and Enums

### 1.1 Import Statements
```typescript
import { z } from 'zod';
```

### 1.2 Literal Types (Enums)
```typescript
// Quest status options - must match backend exactly
export type QuestStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'failed';

// Quest difficulty options - must match backend exactly
export type QuestDifficulty = 'easy' | 'medium' | 'hard';

// Quest kind options - must match backend exactly
export type QuestKind = 'linked' | 'quantitative';

// Quest count scope options - must match backend exactly
export type QuestCountScope = 'any' | 'linked';

// Quest privacy options - must match backend exactly
export type QuestPrivacy = 'public' | 'followers' | 'private';
```

### 1.3 Quest Categories
```typescript
// Quest category interface - no descriptions, will use i18n
export interface QuestCategory {
  id: string;
  name: string;
}

// Exact categories from backend QUEST_CATEGORIES list
export const QUEST_CATEGORIES: QuestCategory[] = [
  { id: 'Health', name: 'Health' },
  { id: 'Work', name: 'Work' },
  { id: 'Personal', name: 'Personal' },
  { id: 'Learning', name: 'Learning' },
  { id: 'Fitness', name: 'Fitness' },
  { id: 'Creative', name: 'Creative' },
  { id: 'Financial', name: 'Financial' },
  { id: 'Social', name: 'Social' },
  { id: 'Spiritual', name: 'Spiritual' },
  { id: 'Hobby', name: 'Hobby' },
  { id: 'Travel', name: 'Travel' },
  { id: 'Other', name: 'Other' }
];
```

### 1.4 Validation Constants
```typescript
// Validation constants - UPPER_SNAKE_CASE per React Guidelines
export const MAX_TITLE_LENGTH = 100;
export const MIN_TITLE_LENGTH = 3;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_TAGS_COUNT = 10;
export const MAX_TAG_LENGTH = 20;
export const MAX_REWARD_XP = 1000;
export const MIN_REWARD_XP = 0;
export const DEFAULT_REWARD_XP = 50;
```

## Phase 2: Core Data Interfaces

### 2.1 Main Quest Interface
```typescript
// Main Quest interface - mirrors backend QuestResponse exactly
export interface Quest {
  // Core fields
  id: string;
  userId: string;
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  rewardXp: number;
  status: QuestStatus;
  category: string;
  tags: string[];
  privacy: QuestPrivacy;
  deadline?: number;
  createdAt: number;
  updatedAt: number;
  version: number;

  // Quest type and configuration
  kind: QuestKind;

  // Linked Quest fields
  linkedGoalIds?: string[];
  linkedTaskIds?: string[];
  dependsOnQuestIds?: string[];

  // Quantitative Quest fields
  targetCount?: number;
  countScope?: QuestCountScope;
  startAt?: number;
  periodSeconds?: number;

  // Audit trail
  auditTrail?: object[];
}
```

### 2.2 Form Data Interfaces
```typescript
// Form data interface for quest creation/editing
export interface QuestFormData {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  rewardXp: number;
  tags: string[];
  deadline?: number;
  privacy: QuestPrivacy;
  kind: QuestKind;
  linkedGoalIds: string[];
  linkedTaskIds: string[];
  dependsOnQuestIds: string[];
  targetCount?: number;
  countScope?: QuestCountScope;
  startAt?: number;
  periodSeconds?: number;
}
```

### 2.3 API Input Interfaces
```typescript
// Input interface for quest creation - matches backend QuestCreatePayload
export interface QuestCreateInput {
  title: string;
  category: string;
  difficulty?: QuestDifficulty;
  description?: string;
  rewardXp?: number;
  tags?: string[];
  deadline?: number;
  privacy?: QuestPrivacy;
  kind?: QuestKind;
  linkedGoalIds?: string[];
  linkedTaskIds?: string[];
  dependsOnQuestIds?: string[];
  targetCount?: number;
  countScope?: QuestCountScope;
  startAt?: number;
  periodSeconds?: number;
}

// Input interface for quest updates - matches backend QuestUpdatePayload
export interface QuestUpdateInput {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: QuestDifficulty;
  rewardXp?: number;
  tags?: string[];
  deadline?: number;
  privacy?: QuestPrivacy;
  linkedGoalIds?: string[];
  linkedTaskIds?: string[];
  dependsOnQuestIds?: string[];
  targetCount?: number;
  countScope?: QuestCountScope;
  startAt?: number;
  periodSeconds?: number;
}

// Input interface for quest cancellation - matches backend QuestCancelPayload
export interface QuestCancelInput {
  reason?: string;
}
```

## Phase 3: Validation Schemas (Zod)

### 3.1 Basic Type Schemas
```typescript
// Basic Zod schemas for types
export const QuestStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled', 'failed']);
export const QuestDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const QuestKindSchema = z.enum(['linked', 'quantitative']);
export const QuestCountScopeSchema = z.enum(['any', 'linked']);
export const QuestPrivacySchema = z.enum(['public', 'followers', 'private']);
```

### 3.2 Complex Validation Schemas

#### Title Validation Schema
```typescript
export const QuestTitleSchema = z
  .string()
  .min(MIN_TITLE_LENGTH, `Title must be at least ${MIN_TITLE_LENGTH} characters`)
  .max(MAX_TITLE_LENGTH, `Title must be no more than ${MAX_TITLE_LENGTH} characters`)
  .refine((val) => val.trim().length > 0, 'Title cannot be empty')
  .transform((val) => val.trim());
```

#### Description Validation Schema
```typescript
export const QuestDescriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH, `Description must be no more than ${MAX_DESCRIPTION_LENGTH} characters`)
  .optional()
  .transform((val) => val?.trim() || undefined);
```

#### Category Validation Schema
```typescript
export const QuestCategorySchema = z
  .enum(QUEST_CATEGORIES.map(c => c.id) as [string, ...string[]])
  .refine((val) => QUEST_CATEGORIES.some(c => c.id === val), 'Invalid category');
```

#### Tags Validation Schema
```typescript
export const QuestTagsSchema = z
  .array(z.string().max(MAX_TAG_LENGTH, `Each tag must be no more than ${MAX_TAG_LENGTH} characters`))
  .max(MAX_TAGS_COUNT, `Maximum ${MAX_TAGS_COUNT} tags allowed`)
  .default([])
  .refine(
    (tags) => tags.every(tag => tag.trim().length > 0),
    'Tags cannot be empty'
  )
  .transform((tags) => tags.map(tag => tag.trim()));
```

#### Reward XP Validation Schema
```typescript
export const QuestRewardXpSchema = z
  .number()
  .int('Reward XP must be a whole number')
  .min(MIN_REWARD_XP, `Reward XP must be at least ${MIN_REWARD_XP}`)
  .max(MAX_REWARD_XP, `Reward XP must be no more than ${MAX_REWARD_XP}`)
  .default(DEFAULT_REWARD_XP);
```

#### Deadline Validation Schema
```typescript
export const QuestDeadlineSchema = z
  .number()
  .int('Deadline must be a valid timestamp')
  .optional()
  .refine((val) => {
    if (val === undefined) return true;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return val > now + oneHour;
  }, 'Deadline must be at least 1 hour in the future');
```

### 3.3 Complete Input Schemas

#### Quest Create Input Schema
```typescript
export const QuestCreateInputSchema = z.object({
  title: QuestTitleSchema,
  category: QuestCategorySchema,
  difficulty: QuestDifficultySchema.default('medium'),
  description: QuestDescriptionSchema,
  rewardXp: QuestRewardXpSchema,
  tags: QuestTagsSchema,
  deadline: QuestDeadlineSchema,
  privacy: QuestPrivacySchema.default('private'),
  kind: QuestKindSchema.default('linked'),

  // Linked Quest fields
  linkedGoalIds: z.array(z.string().uuid('Invalid goal ID')).optional(),
  linkedTaskIds: z.array(z.string().uuid('Invalid task ID')).optional(),
  dependsOnQuestIds: z.array(z.string().uuid('Invalid quest ID')).optional(),

  // Quantitative Quest fields
  targetCount: z.number().int().positive('Target count must be greater than 0').optional(),
  countScope: QuestCountScopeSchema.optional(),
  startAt: z.number().int().positive('Start time must be in the future').optional(),
  periodSeconds: z.number().int().positive('Period must be greater than 0 seconds').optional(),
}).refine((data) => {
  // Quantitative quest validation
  if (data.kind === 'quantitative') {
    return data.targetCount !== undefined &&
           data.countScope !== undefined &&
           data.startAt !== undefined &&
           data.periodSeconds !== undefined;
  }
  return true;
}, {
  message: 'Quantitative quests require targetCount, countScope, startAt, and periodSeconds',
  path: ['kind']
}).refine((data) => {
  // Linked quest validation - allow creation without linked items
  if (data.kind === 'linked') {
    return true; // Validation happens when quest is started
  }
  return true;
}, {
  message: 'Linked quests must have at least one goal or task when started',
  path: ['linkedGoalIds']
});
```

#### Quest Update Input Schema
```typescript
export const QuestUpdateInputSchema = QuestCreateInputSchema.partial().extend({
  // Only title validation for updates (other fields optional)
  title: QuestTitleSchema.optional(),
});
```

#### Quest Cancel Input Schema
```typescript
export const QuestCancelInputSchema = z.object({
  reason: z.string()
    .max(200, 'Reason must be no more than 200 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
});
```

### 3.4 Type Inference from Schemas
```typescript
// Export types inferred from schemas for use in components
export type QuestCreateInput = z.infer<typeof QuestCreateInputSchema>;
export type QuestUpdateInput = z.infer<typeof QuestUpdateInputSchema>;
export type QuestCancelInput = z.infer<typeof QuestCancelInputSchema>;
```

## Phase 4: Validation Error Interfaces

### 4.1 Field-Level Validation Errors
```typescript
// Field-level validation errors - follows GoalValidationErrors pattern exactly
export interface QuestValidationErrors {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  rewardXp?: string;
  tags?: string;
  deadline?: string;

  // Complex field errors with nested objects
  linkedGoalIds?: {
    invalidIds?: string[];
    permissionDenied?: string[];
    notFound?: string[];
  };
  linkedTaskIds?: {
    invalidIds?: string[];
    notFound?: string[];
  };
  dependsOnQuestIds?: {
    invalidIds?: string[];
    notFound?: string[];
    circularDependency?: string;
  };

  // Quantitative quest field errors
  targetCount?: string;
  countScope?: string;
  startAt?: string;
  periodSeconds?: string;

  // General form errors
  form?: string;
  network?: string;
}
```

### 4.2 Form Validation State
```typescript
// Form validation state interface
export interface QuestFormValidation {
  isValid: boolean;
  errors: QuestValidationErrors;
  touched: Record<keyof QuestFormData, boolean>;
}
```

## Phase 5: Helper Functions

### 5.1 Category Helper Functions
```typescript
// Get category by ID - follows getCategoryById pattern from goal.ts
export const getCategoryById = (id: string): QuestCategory | undefined => {
  return QUEST_CATEGORIES.find(category => category.id === id);
};

// Get category name by ID
export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || id;
};

// Get all category names for dropdowns
export const getCategoryNames = (): string[] => {
  return QUEST_CATEGORIES.map(category => category.name);
};
```

### 5.2 Status Helper Functions
```typescript
// Format quest status for display - follows formatGoalStatus pattern
export const formatQuestStatus = (status: QuestStatus): string => {
  const statusMap: Record<QuestStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    failed: 'Failed'
  };
  return statusMap[status] || status;
};

// Get status color class for UI - follows getStatusColorClass pattern
export const getQuestStatusColorClass = (status: QuestStatus): string => {
  const colorMap: Record<QuestStatus, string> = {
    draft: 'text-gray-600 bg-gray-50',
    active: 'text-green-600 bg-green-50',
    completed: 'text-blue-600 bg-blue-50',
    cancelled: 'text-red-600 bg-red-50',
    failed: 'text-red-600 bg-red-50'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};
```

### 5.3 Difficulty Helper Functions
```typescript
// Format quest difficulty for display
export const formatQuestDifficulty = (difficulty: QuestDifficulty): string => {
  const difficultyMap: Record<QuestDifficulty, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  };
  return difficultyMap[difficulty] || difficulty;
};

// Get difficulty color class for UI
export const getQuestDifficultyColorClass = (difficulty: QuestDifficulty): string => {
  const colorMap: Record<QuestDifficulty, string> = {
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    hard: 'text-red-600 bg-red-50'
  };
  return colorMap[difficulty] || 'text-gray-600 bg-gray-50';
};
```

### 5.4 Validation Helper Functions
```typescript
// Validate quest title - follows validation patterns
export const validateQuestTitle = (title: string): string | null => {
  try {
    QuestTitleSchema.parse(title);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid title';
    }
    return 'Invalid title';
  }
};

// Validate quest category
export const validateQuestCategory = (category: string): string | null => {
  try {
    QuestCategorySchema.parse(category);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid category';
    }
    return 'Invalid category';
  }
};

// Validate entire quest form
export const validateQuestForm = (data: QuestFormData): QuestFormValidation => {
  const errors: QuestValidationErrors = {};
  let isValid = true;

  // Validate each field
  const titleError = validateQuestTitle(data.title);
  if (titleError) {
    errors.title = titleError;
    isValid = false;
  }

  const categoryError = validateQuestCategory(data.category);
  if (categoryError) {
    errors.category = categoryError;
    isValid = false;
  }

  // Add more field validations as needed...

  return {
    isValid,
    errors,
    touched: {} as Record<keyof QuestFormData, boolean> // Will be populated by form
  };
};
```

### 5.5 Formatting Helper Functions
```typescript
// Format quest deadline for display
export const formatQuestDeadline = (deadline?: number): string => {
  if (!deadline) return 'No deadline';

  try {
    return new Date(deadline).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

// Format reward XP for display
export const formatRewardXp = (xp: number): string => {
  return `${xp} XP`;
};

// Format quest progress percentage
export const formatQuestProgress = (progress: number): string => {
  return `${Math.round(progress)}%`;
};
```

### 5.6 Progress Calculation Functions
```typescript
// Calculate quest progress for linked quests
export const calculateLinkedQuestProgress = (quest: Quest): number => {
  if (quest.kind !== 'linked') return 0;

  const totalItems = (quest.linkedGoalIds?.length || 0) + (quest.linkedTaskIds?.length || 0);
  if (totalItems === 0) return 0;

  // This would need actual completion status from goals/tasks
  // For now, return 0 - will be implemented when integrating with actual data
  return 0;
};

// Calculate quest progress for quantitative quests
export const calculateQuantitativeQuestProgress = (quest: Quest): number => {
  if (quest.kind !== 'quantitative' || !quest.targetCount) return 0;

  // This would need actual count data
  // For now, return 0 - will be implemented when integrating with actual data
  return 0;
};

// Main progress calculation function
export const calculateQuestProgress = (quest: Quest): number => {
  switch (quest.kind) {
    case 'linked':
      return calculateLinkedQuestProgress(quest);
    case 'quantitative':
      return calculateQuantitativeQuestProgress(quest);
    default:
      return 0;
  }
};
```

## Phase 6: Export Structure

### 6.1 Complete Export Statement
```typescript
// Export all types and interfaces
export type {
  QuestStatus,
  QuestDifficulty,
  QuestKind,
  QuestCountScope,
  QuestPrivacy,
  Quest,
  QuestCategory,
  QuestFormData,
  QuestCreateInput,
  QuestUpdateInput,
  QuestCancelInput,
  QuestValidationErrors,
  QuestFormValidation
};

// Export schemas
export {
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
  QuestCancelInputSchema
};

// Export constants
export {
  QUEST_CATEGORIES,
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
  MAX_REWARD_XP,
  MIN_REWARD_XP,
  DEFAULT_REWARD_XP
};

// Export helper functions
export {
  getCategoryById,
  getCategoryName,
  getCategoryNames,
  formatQuestStatus,
  getQuestStatusColorClass,
  formatQuestDifficulty,
  getQuestDifficultyColorClass,
  validateQuestTitle,
  validateQuestCategory,
  validateQuestForm,
  formatQuestDeadline,
  formatRewardXp,
  formatQuestProgress,
  calculateLinkedQuestProgress,
  calculateQuantitativeQuestProgress,
  calculateQuestProgress
};
```

## Phase 7: Integration Notes

### 7.1 Backend Compatibility
- All types match backend Pydantic models exactly
- Validation rules mirror backend constraints
- Category list matches `QUEST_CATEGORIES` from backend

### 7.2 Frontend Pattern Compliance
- Follows exact structure of `GoalValidationErrors`
- Uses camelCase for functions (formatQuestStatus, getCategoryById)
- Uses UPPER_SNAKE_CASE for constants (MAX_TITLE_LENGTH)
- File naming follows project pattern (quest.ts)

### 7.3 React Guidelines Compliance
- Function components exclusively (when needed for validation)
- TypeScript interfaces for all data structures
- Proper error handling and validation patterns

## Implementation Steps

1. **Create file**: `frontend/src/models/quest.ts`
2. **Implement Phase 1**: Core types and enums
3. **Implement Phase 2**: Data interfaces
4. **Implement Phase 3**: Zod validation schemas
5. **Implement Phase 4**: Validation error interfaces
6. **Implement Phase 5**: Helper functions
7. **Implement Phase 6**: Export structure
8. **Verify integration**: Ensure no TypeScript errors, proper imports

## Testing Strategy

### Unit Tests
- Test all Zod schemas with valid and invalid data
- Test all helper functions with edge cases
- Test type inference and exports
- Test validation functions

### Integration Tests
- Import and use types in test files
- Verify compatibility with existing patterns
- Test helper function outputs

## Success Criteria

✅ **Complete Type Safety**: All quest data structures properly typed
✅ **Backend Compatibility**: Frontend models mirror backend exactly
✅ **Validation**: Zod schemas match backend validation rules
✅ **Helper Functions**: All necessary utilities for formatting and validation
✅ **No Breaking Changes**: Existing frontend code continues to work
✅ **Export Structure**: Proper exports for use by other components
✅ **React Guidelines**: Follows project's React development standards

This implementation provides a complete, type-safe foundation for the Quest feature that integrates seamlessly with the existing frontend architecture.
