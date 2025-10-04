# Task 2.1 - Frontend Quest TypeScript Models Implementation Plan

## Brief Description
This task implements the TypeScript models and interfaces for the Quest feature in the frontend, creating type-safe data structures that mirror the backend Pydantic models. The models will include comprehensive validation using Zod schemas and follow existing frontend patterns for type definitions, enums, and helper functions.

## Current State Analysis
- **Backend Models**: Fully implemented Pydantic models in `backend/services/quest-service/app/models/quest.py` with comprehensive validation, XSS protection, and business logic constraints
- **Frontend Patterns**: Existing models in `frontend/src/models/` follow TypeScript interface patterns with enums, validation schemas, and helper functions
- **Validation**: Project uses Zod for runtime validation alongside TypeScript interfaces
- **Internationalization**: Models need to support i18n integration for future localization

## Implementation Strategy

### Phase 1: Core TypeScript Models (Day 1)
**Files to Create/Modify:**
- `frontend/src/models/quest.ts` (NEW FILE)

**Tasks:**
1. **Quest Enums and Types** - Define TypeScript enums and literal types that mirror backend models:
   ```typescript
   export type QuestStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'failed';
   export type QuestDifficulty = 'easy' | 'medium' | 'hard';
   export type QuestKind = 'linked' | 'quantitative';
   export type QuestCountScope = 'any' | 'linked';
   export type QuestPrivacy = 'public' | 'followers' | 'private';
   ```

2. **Quest Category Definitions** - Create predefined categories matching backend:
   ```typescript
   export interface QuestCategory {
     id: string;
     name: string;
     description?: string;
   }

   export const QUEST_CATEGORIES: QuestCategory[] = [
     { id: 'Health', name: 'Health', description: 'Health and wellness quests' },
     { id: 'Work', name: 'Work', description: 'Professional and career quests' },
     // ... additional categories matching backend
   ];
   ```

3. **Core Quest Interfaces** - Create interfaces mirroring backend models:
   ```typescript
   export interface Quest {
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
     kind: QuestKind;
     linkedGoalIds?: string[];
     linkedTaskIds?: string[];
     dependsOnQuestIds?: string[];
     targetCount?: number;
     countScope?: QuestCountScope;
     startAt?: number;
     periodSeconds?: number;
     auditTrail?: object[];
   }
   ```

4. **Form Data Interfaces** - Create input/output interfaces for API operations:
   ```typescript
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
   ```

### Phase 2: Zod Validation Schemas (Day 1)
**Files to Create/Modify:**
- `frontend/src/models/quest.ts` (extend with validation)

**Tasks:**
1. **Validation Constants** - Define validation constants matching backend:
   ```typescript
   const MAX_TITLE_LENGTH = 100;
   const MIN_TITLE_LENGTH = 3;
   const MAX_DESCRIPTION_LENGTH = 500;
   const MAX_TAGS_COUNT = 10;
   const MAX_TAG_LENGTH = 20;
   const MAX_REWARD_XP = 1000;
   const MIN_REWARD_XP = 0;
   const DEFAULT_REWARD_XP = 50;
   ```

2. **Zod Schemas** - Create Zod schemas for runtime validation:
   ```typescript
   import { z } from 'zod';

   export const QuestStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled', 'failed']);
   export const QuestDifficultySchema = z.enum(['easy', 'medium', 'hard']);
   export const QuestKindSchema = z.enum(['linked', 'quantitative']);
   export const QuestCountScopeSchema = z.enum(['any', 'linked']);
   export const QuestPrivacySchema = z.enum(['public', 'followers', 'private']);

   export const QuestCreateInputSchema = z.object({
     title: z.string().min(MIN_TITLE_LENGTH).max(MAX_TITLE_LENGTH),
     category: z.enum(QUEST_CATEGORIES.map(c => c.id) as [string, ...string[]]),
     // ... additional field validations
   });

   export const QuestUpdateInputSchema = QuestCreateInputSchema.partial();
   ```

3. **Type Inference** - Use Zod schemas for TypeScript type inference:
   ```typescript
   export type QuestCreateInput = z.infer<typeof QuestCreateInputSchema>;
   export type QuestUpdateInput = z.infer<typeof QuestUpdateInputSchema>;
   ```

### Phase 3: Helper Functions and Utilities (Day 2)
**Files to Create/Modify:**
- `frontend/src/models/quest.ts` (extend with helpers)

**Tasks:**
1. **Validation Helper Functions** - Create helper functions for validation:
   ```typescript
   export const validateQuestTitle = (title: string): string | null => {
     if (!title || !title.trim()) return 'Title is required';
     if (title.length < MIN_TITLE_LENGTH) return `Title must be at least ${MIN_TITLE_LENGTH} characters`;
     if (title.length > MAX_TITLE_LENGTH) return `Title must be no more than ${MAX_TITLE_LENGTH} characters`;
     return null;
   };

   export const validateQuestCategory = (category: string): string | null => {
     if (!category) return 'Category is required';
     if (!QUEST_CATEGORIES.find(c => c.id === category)) return 'Invalid category';
     return null;
   };
   ```

2. **Formatting Helper Functions** - Create display formatting functions:
   ```typescript
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

   export const getQuestDifficultyColor = (difficulty: QuestDifficulty): string => {
     const colorMap: Record<QuestDifficulty, string> = {
       easy: 'text-green-600 bg-green-50',
       medium: 'text-yellow-600 bg-yellow-50',
       hard: 'text-red-600 bg-red-50'
     };
     return colorMap[difficulty] || 'text-gray-600 bg-gray-50';
   };

   export const formatQuestDeadline = (deadline?: number): string => {
     if (!deadline) return 'No deadline';
     return new Date(deadline).toLocaleDateString();
   };
   ```

3. **Category Helper Functions** - Create category utility functions:
   ```typescript
   export const getCategoryById = (id: string): QuestCategory | undefined => {
     return QUEST_CATEGORIES.find(category => category.id === id);
   };

   export const getCategoryName = (id: string): string => {
     const category = getCategoryById(id);
     return category?.name || id;
   };
   ```

4. **Quest Progress Calculation** - Add progress calculation helpers:
   ```typescript
   export const calculateQuestProgress = (quest: Quest): number => {
     // Implementation for progress calculation based on quest type
     if (quest.kind === 'quantitative') {
       // Calculate progress for quantitative quests
       return Math.min(100, (currentCount / quest.targetCount!) * 100);
     } else if (quest.kind === 'linked') {
       // Calculate progress for linked quests based on linked items
       return calculateLinkedQuestProgress(quest);
     }
     return 0;
   };
   ```

### Phase 4: Validation Error Interfaces (Day 2)
**Files to Create/Modify:**
- `frontend/src/models/quest.ts` (extend with validation errors)

**Tasks:**
1. **Validation Error Interfaces** - Create interfaces for form validation errors:
   ```typescript
   export interface QuestValidationErrors {
     title?: string;
     description?: string;
     category?: string;
     difficulty?: string;
     rewardXp?: string;
     tags?: string;
     deadline?: string;
     linkedGoalIds?: string;
     linkedTaskIds?: string;
     targetCount?: string;
     countScope?: string;
     startAt?: string;
     periodSeconds?: string;
   }

   export interface QuestFormValidation {
     isValid: boolean;
     errors: QuestValidationErrors;
   }
   ```

2. **Form State Interfaces** - Create interfaces for form state management:
   ```typescript
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

### Phase 5: Compatibility and Integration (Day 3)
**Files to Create/Modify:**
- `frontend/src/models/quest.ts` (final integration)
- `frontend/src/models/index.ts` (if exists) or ensure proper exports

**Tasks:**
1. **Export Structure** - Ensure proper exports for the models:
   ```typescript
   export {
     // Types and enums
     QuestStatus, QuestDifficulty, QuestKind, QuestCountScope, QuestPrivacy,
     // Interfaces
     Quest, QuestCategory, QuestCreateInput, QuestUpdateInput,
     QuestValidationErrors, QuestFormData,
     // Validation schemas
     QuestStatusSchema, QuestDifficultySchema, QuestCreateInputSchema,
     // Helper functions
     validateQuestTitle, formatQuestStatus, getCategoryById,
     calculateQuestProgress, getQuestDifficultyColor,
     // Constants
     QUEST_CATEGORIES, MAX_TITLE_LENGTH, MIN_TITLE_LENGTH
   };
   ```

2. **Integration with Existing Models** - Ensure compatibility with existing patterns:
   - Follow the same enum pattern as `GoalStatus` in `goal.ts`
   - Use the same interface structure as existing models
   - Ensure naming consistency with existing models
   - Follow the same export patterns

3. **Type Safety Verification** - Verify all types are properly defined and exported

## Algorithm for Quest Progress Calculation

### Linked Quest Progress Algorithm:
1. **Input**: Quest object with `linkedGoalIds` and `linkedTaskIds`
2. **Fetch Status**: Query the status of all linked goals and tasks
3. **Count Completed**: Count how many linked items are completed
4. **Calculate Percentage**: `(completedCount / totalLinkedCount) * 100`
5. **Handle Dependencies**: If `dependsOnQuestIds` exist, ensure dependent quests are completed first
6. **Return Progress**: Return calculated percentage (0-100)

### Quantitative Quest Progress Algorithm:
1. **Input**: Quest object with `targetCount`, `countScope`, `startAt`, `periodSeconds`
2. **Determine Scope**: Based on `countScope` ('any' or 'linked')
3. **Count Activities**: Count relevant activities within time period
4. **Calculate Progress**: `(currentCount / targetCount) * 100`
5. **Time Validation**: Only count activities within `[startAt, startAt + periodSeconds]`
6. **Return Progress**: Return calculated percentage (0-100)

## Testing Strategy

### Unit Tests for Models:
1. **Type Validation**: Ensure TypeScript interfaces work correctly
2. **Zod Schema Validation**: Test all validation schemas with valid and invalid data
3. **Helper Functions**: Test all helper functions with edge cases
4. **Enum Validation**: Test enum types and helper functions
5. **Progress Calculation**: Test progress algorithms with various quest configurations

### Integration Tests:
1. **Import/Export**: Ensure models can be imported correctly
2. **Type Compatibility**: Verify compatibility with existing frontend patterns
3. **Validation Integration**: Test validation works with form components

## Success Criteria

### Must-Have Requirements:
1. **Complete Type Safety**: All quest-related data structures are properly typed
2. **Backend Compatibility**: Frontend models mirror backend Pydantic models exactly
3. **Zod Validation**: Runtime validation schemas match backend validation rules
4. **Helper Functions**: All necessary helper functions for formatting and validation
5. **No Breaking Changes**: Existing frontend code continues to work unchanged
6. **Export Structure**: Proper exports for use by other frontend components

### Should-Have Requirements:
1. **Performance**: Models are lightweight and don't impact bundle size significantly
2. **Extensibility**: Models can be easily extended for future quest features
3. **Documentation**: Inline documentation for complex interfaces and functions
4. **Error Messages**: Helpful error messages for validation failures

### Acceptance Tests:
1. **TypeScript Compilation**: All TypeScript errors resolved
2. **Import/Export**: Models can be imported and used correctly
3. **Validation**: Zod schemas validate data correctly
4. **Helper Functions**: All helper functions return expected results
5. **Existing Code**: No existing frontend functionality is broken

## Risk Mitigation

### Potential Issues and Solutions:
1. **Type Conflicts**: If new types conflict with existing ones, use namespaces or rename
2. **Bundle Size**: If models significantly increase bundle size, consider code splitting
3. **Validation Performance**: If Zod validation impacts performance, consider lazy validation
4. **Import Cycles**: Ensure no circular dependencies between model files

### Backward Compatibility:
1. **No Existing Interface Changes**: Don't modify existing model interfaces
2. **Additive Only**: Only add new interfaces and types, don't remove existing ones
3. **Optional Fields**: Make new fields optional where possible to avoid breaking changes

## Implementation Files

### Files to Create:
- `frontend/src/models/quest.ts` - Main quest models file

### Files to Modify:
- None (additive implementation only)

## Estimated Timeline
- **Phase 1 (Core Models)**: 4 hours
- **Phase 2 (Zod Validation)**: 3 hours
- **Phase 3 (Helper Functions)**: 4 hours
- **Phase 4 (Validation Errors)**: 2 hours
- **Phase 5 (Integration)**: 2 hours
- **Total**: 15 hours

## Dependencies
- Backend quest models must be finalized and stable
- Existing frontend model patterns must be understood
- Zod validation library must be available in the project

## Next Steps
After completing Task 2.1, the foundation will be ready for:
- Task 2.2: API Service Layer implementation
- Task 2.3: Custom Hooks implementation
- Task 3.1: Localization setup
- Task 4.1: UI Component development
