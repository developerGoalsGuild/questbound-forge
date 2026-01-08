import { z } from 'zod';

// ============================================================================
// Phase 1: Core Type Definitions and Enums
// ============================================================================

/**
 * Quest status options - must match backend exactly
 */
type QuestStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'failed';

/**
 * Quest difficulty options - must match backend exactly
 */
type QuestDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Quest kind options - must match backend exactly
 */
type QuestKind = 'linked' | 'quantitative';

/**
 * Quest count scope options - must match backend exactly
 */
type QuestCountScope = 'completed_tasks' | 'completed_goals';

/**
 * Quest privacy options - must match backend exactly
 */
type QuestPrivacy = 'public' | 'followers' | 'private';

/**
 * Quest category interface with descriptions
 */
interface QuestCategory {
  id: string;
  name: string;
  description?: string;
}

/**
 * Quest categories with descriptions for better UX
 */
const QUEST_CATEGORIES: QuestCategory[] = [
  { id: 'Health', name: 'Health', description: 'Physical and mental health related quests' },
  { id: 'Work', name: 'Work', description: 'Professional and career development quests' },
  { id: 'Personal', name: 'Personal', description: 'Personal growth and self-improvement quests' },
  { id: 'Learning', name: 'Learning', description: 'Education and skill development quests' },
  { id: 'Fitness', name: 'Fitness', description: 'Physical fitness and exercise quests' },
  { id: 'Creative', name: 'Creative', description: 'Artistic and creative expression quests' },
  { id: 'Financial', name: 'Financial', description: 'Money management and financial goals' },
  { id: 'Social', name: 'Social', description: 'Social connections and relationships' },
  { id: 'Spiritual', name: 'Spiritual', description: 'Spiritual growth and mindfulness quests' },
  { id: 'Hobby', name: 'Hobby', description: 'Recreational and hobby-related quests' },
  { id: 'Travel', name: 'Travel', description: 'Travel and adventure quests' },
  { id: 'Other', name: 'Other', description: 'Other types of quests' }
];

/**
 * Quest difficulties with labels for UI display
 */
const QUEST_DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
] as const;

/**
 * Quest privacy options with labels for UI display
 */
const QUEST_PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'followers', label: 'Followers' },
  { value: 'private', label: 'Private' }
] as const;

/**
 * Quest kind options with labels for UI display
 */
const QUEST_KIND_OPTIONS = [
  { value: 'linked', label: 'Linked Quest' },
  { value: 'quantitative', label: 'Quantitative Quest' }
] as const;

/**
 * Quest count scope options with labels for UI display
 */
const QUEST_COUNT_SCOPE_OPTIONS = [
  { value: 'completed_tasks', label: 'Completed Tasks' },
  { value: 'completed_goals', label: 'Completed Goals' }
] as const;

/**
 * Validation constants - UPPER_SNAKE_CASE per React Guidelines
 */
const MAX_TITLE_LENGTH = 100;
const MIN_TITLE_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_TAGS_COUNT = 10;
const MAX_TAG_LENGTH = 20;
const MAX_REWARD_XP = 1000;
const MIN_REWARD_XP = 0;
const DEFAULT_REWARD_XP = 50;

// ============================================================================
// Phase 2: Core Data Interfaces
// ============================================================================

/**
 * Main Quest interface - mirrors backend QuestResponse exactly
 */
interface Quest {
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
  deadline?: number; // Unix timestamp for deadline
  createdAt: number;
  updatedAt: number;

  // Quest type and configuration
  kind: QuestKind;

  // Linked Quest fields
  linkedGoalIds?: string[];
  linkedTaskIds?: string[];
  dependsOnQuestIds?: string[];

  // Quantitative Quest fields
  targetCount?: number;
  countScope?: QuestCountScope;
  periodDays?: number;

  // Quest timing
  startedAt?: number; // Unix timestamp when quest was started
  startDate?: Date; // Date when quest was started (for progress calculations)
  deadlineDate?: Date; // Date when quest expires (for progress calculations)

  // Audit trail
  auditTrail?: object[];
}

/**
 * Form data interface for quest creation/editing
 * Note: rewardXp is auto-calculated by backend and not included in form data
 */
interface QuestFormData {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  tags: string[];
  deadline?: number;
  privacy: QuestPrivacy;
  kind: QuestKind;
  linkedGoalIds: string[];
  linkedTaskIds: string[];
  dependsOnQuestIds: string[];
  targetCount?: number;
  countScope?: QuestCountScope;
  periodDays?: number;
}

/**
 * Input interface for quest creation - matches backend QuestCreatePayload
 * Note: rewardXp is auto-calculated by backend and not included in input
 */
interface QuestCreateInput {
  title: string;
  category: string;
  difficulty?: QuestDifficulty;
  description?: string;
  tags?: string[];
  deadline?: number;
  privacy?: QuestPrivacy;
  kind?: QuestKind;
  linkedGoalIds?: string[] | null;
  linkedTaskIds?: string[] | null;
  dependsOnQuestIds?: string[] | null;
  targetCount?: number;
  countScope?: QuestCountScope;
  periodDays?: number;
}

/**
 * Input interface for quest updates - matches backend QuestUpdatePayload
 */
interface QuestUpdateInput {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: QuestDifficulty;
  rewardXp?: number;
  tags?: string[];
  deadline?: number;
  privacy?: QuestPrivacy;
  linkedGoalIds?: string[] | null;
  linkedTaskIds?: string[] | null;
  dependsOnQuestIds?: string[] | null;
  targetCount?: number;
  countScope?: QuestCountScope;
  periodDays?: number;
}

/**
 * Input interface for quest cancellation - matches backend QuestCancelPayload
 */
interface QuestCancelInput {
  reason?: string;
}

// ============================================================================
// Phase 3: Validation Schemas (Zod)
// ============================================================================

/**
 * Basic Zod schemas for types
 */
const QuestStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled', 'failed']);
const QuestDifficultySchema = z.enum(['easy', 'medium', 'hard']);
const QuestKindSchema = z.enum(['linked', 'quantitative']);
const QuestCountScopeSchema = z.enum(['completed_tasks', 'completed_goals']);
const QuestPrivacySchema = z.enum(['public', 'followers', 'private']);

/**
 * Title validation schema with comprehensive validation rules
 */
const QuestTitleSchema = z
  .string()
  .min(MIN_TITLE_LENGTH, `Title must be at least ${MIN_TITLE_LENGTH} characters`)
  .max(MAX_TITLE_LENGTH, `Title must be no more than ${MAX_TITLE_LENGTH} characters`)
  .refine((val) => val.trim().length > 0, 'Title cannot be empty')
  .transform((val) => val.trim());

/**
 * Description validation schema with length limits and optional handling
 */
const QuestDescriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH, `Description must be no more than ${MAX_DESCRIPTION_LENGTH} characters`)
  .optional()
  .transform((val) => val?.trim() || undefined);

/**
 * Category validation schema against predefined categories
 */
const QuestCategorySchema = z
  .enum(QUEST_CATEGORIES.map(c => c.id) as [string, ...string[]])
  .refine((val) => QUEST_CATEGORIES.some(c => c.id === val), 'Invalid category');

/**
 * Tags validation schema with array constraints and XSS protection
 */
const QuestTagsSchema = z
  .array(z.string().max(MAX_TAG_LENGTH, `Each tag must be no more than ${MAX_TAG_LENGTH} characters`))
  .max(MAX_TAGS_COUNT, `Maximum ${MAX_TAGS_COUNT} tags allowed`)
  .default([])
  .refine(
    (tags) => tags.every(tag => tag.trim().length > 0),
    'Tags cannot be empty'
  )
  .transform((tags) => tags.map(tag => tag.trim()));

/**
 * Reward XP validation schema with min/max constraints
 * Note: rewardXp is now auto-calculated by backend, but this schema is kept
 * for validating rewardXp in quest responses (read-only from API)
 */
const QuestRewardXpSchema = z
  .number()
  .int('Reward XP must be a whole number')
  .min(MIN_REWARD_XP, `Reward XP must be at least ${MIN_REWARD_XP}`)
  .max(MAX_REWARD_XP, `Reward XP must be no more than ${MAX_REWARD_XP}`)
  .optional(); // Optional since it's auto-calculated

/**
 * Deadline validation schema requiring future dates (1+ hour requirement)
 */
const QuestDeadlineSchema = z
  .number()
  .int('Deadline must be a valid timestamp')
  .optional()
  .refine((val) => {
    if (val === undefined) return true;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return val > now + oneHour;
  }, 'Deadline must be at least 1 hour in the future');

/**
 * Complete quest creation input schema with all business rules
 */
const QuestCreateInputSchema = z.object({
  title: QuestTitleSchema,
  category: QuestCategorySchema,
  difficulty: QuestDifficultySchema.default('medium'),
  description: QuestDescriptionSchema,
  // Note: rewardXp is now auto-calculated by backend (not part of input)
  tags: QuestTagsSchema,
  deadline: QuestDeadlineSchema,
  privacy: QuestPrivacySchema.default('private'),
  kind: QuestKindSchema.default('linked'),

  // Linked Quest fields
  linkedGoalIds: z.array(z.string().uuid('Invalid goal ID')).optional().nullable(),
  linkedTaskIds: z.array(z.string().uuid('Invalid task ID')).optional().nullable(),
  dependsOnQuestIds: z.array(z.string().uuid('Invalid quest ID')).optional().nullable(),

  // Quantitative Quest fields
  targetCount: z.number().int().positive('Target count must be greater than 0').optional(),
  countScope: QuestCountScopeSchema.optional(),
  periodDays: z.number().int().positive('Period must be greater than 0 days').optional(),
}).refine((data) => {
  // Quantitative quest validation - all fields required for quantitative quests
  if (data.kind === 'quantitative') {
    return data.targetCount !== undefined &&
           data.countScope !== undefined &&
           data.periodDays !== undefined;
  }
  return true;
}, {
  message: 'Quantitative quests require targetCount, countScope, and periodDays',
  path: ['kind']
}).refine((data) => {
  // Linked quest validation - allow creation without linked items (validation happens when started)
  if (data.kind === 'linked') {
    return true; // Validation happens when quest is started
  }
  return true;
}, {
  message: 'Linked quests must have at least one goal or task when started',
  path: ['linkedGoalIds']
});

/**
 * Quest update input schema as partial of create schema
 */
const QuestUpdateInputSchema = QuestCreateInputSchema.partial().extend({
  // Only title validation for updates (other fields optional)
  title: QuestTitleSchema.optional(),
});

/**
 * Quest cancellation input schema with reason validation
 */
const QuestCancelInputSchema = z.object({
  reason: z.string()
    .max(200, 'Reason must be no more than 200 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
});

/**
 * Types inferred from schemas for use in components
 */
type QuestCreateInputType = z.infer<typeof QuestCreateInputSchema>;
type QuestUpdateInputType = z.infer<typeof QuestUpdateInputSchema>;
type QuestCancelInputType = z.infer<typeof QuestCancelInputSchema>;

// ============================================================================
// Phase 4: Validation Error Interfaces
// ============================================================================

/**
 * Field-level validation errors - follows GoalValidationErrors pattern exactly
 */
interface QuestValidationErrors {
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
  periodDays?: string;

  // General form errors
  form?: string;
  network?: string;
}

/**
 * Form validation state interface
 */
interface QuestFormValidation {
  isValid: boolean;
  errors: QuestValidationErrors;
  touched: Record<keyof QuestFormData, boolean>;
}

// ============================================================================
// Phase 5: Helper Functions
// ============================================================================

/**
 * Get category by ID - follows getCategoryById pattern from goal.ts
 */
const getCategoryById = (id: string): QuestCategory | undefined => {
  return QUEST_CATEGORIES.find(category => category.id === id);
};

/**
 * Get category name by ID with fallback
 */
const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || id;
};

/**
 * Get all category names for dropdowns
 */
const getCategoryNames = (): string[] => {
  return QUEST_CATEGORIES.map(category => category.name);
};

/**
 * Get quest status i18n key for display - follows formatGoalStatus pattern
 */
const getQuestStatusKey = (status: QuestStatus): string => {
  const statusMap: Record<QuestStatus, string> = {
    draft: 'quest.status.draft',
    active: 'quest.status.active',
    completed: 'quest.status.completed',
    cancelled: 'quest.status.cancelled',
    failed: 'quest.status.failed'
  };
  return statusMap[status] || status;
};

/**
 * Get status color class for UI - follows getStatusColorClass pattern
 */
const getQuestStatusColorClass = (status: QuestStatus): string => {
  const colorMap: Record<QuestStatus, string> = {
    draft: 'text-gray-600 bg-gray-50',
    active: 'text-green-600 bg-green-50',
    completed: 'text-blue-600 bg-blue-50',
    cancelled: 'text-red-600 bg-red-50',
    failed: 'text-red-600 bg-red-50'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

/**
 * Get quest difficulty i18n key for display
 */
const getQuestDifficultyKey = (difficulty: QuestDifficulty): string => {
  const difficultyMap: Record<QuestDifficulty, string> = {
    easy: 'quest.difficulty.easy',
    medium: 'quest.difficulty.medium',
    hard: 'quest.difficulty.hard'
  };
  return difficultyMap[difficulty] || difficulty;
};

/**
 * Get difficulty color class for UI
 */
const getQuestDifficultyColorClass = (difficulty: QuestDifficulty): string => {
  const colorMap: Record<QuestDifficulty, string> = {
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    hard: 'text-red-600 bg-red-50'
  };
  return colorMap[difficulty] || 'text-gray-600 bg-gray-50';
};

/**
 * Validate quest title using Zod schema with error messages
 */
const validateQuestTitle = (title: string): string | null => {
  try {
    QuestTitleSchema.parse(title);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return the first error message, or a fallback
      return error.issues?.[0]?.message || 'Invalid title';
    }
    return 'Invalid title';
  }
};

/**
 * Validate quest category using Zod schema with error messages
 */
const validateQuestCategory = (category: string): string | null => {
  try {
    QuestCategorySchema.parse(category);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return the first error message, or a fallback
      return error.issues?.[0]?.message || 'Invalid category';
    }
    return 'Invalid category';
  }
};

/**
 * Validate entire quest form and return validation state
 */
const validateQuestForm = (data: QuestFormData): QuestFormValidation => {
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

/**
 * Format quest deadline for display - returns i18n key or formatted date
 */
const formatQuestDeadline = (deadline?: number): string => {
  if (deadline === undefined || deadline === null) return 'quest.deadline.none';
  if (Number.isNaN(deadline)) return 'quest.deadline.invalid';

  try {
    return new Date(deadline).toLocaleDateString();
  } catch {
    return 'quest.deadline.invalid';
  }
};

/**
 * Format reward XP for display
 */
const formatRewardXp = (xp: number): string => {
  return `${xp} XP`;
};

/**
 * Format quest progress percentage
 */
const formatQuestProgress = (progress: number): string => {
  return `${Math.round(progress)}%`;
};

/**
 * Calculate quest progress for linked quests
 */
const calculateLinkedQuestProgress = (quest: Quest): number => {
  if (quest.kind !== 'linked') return 0;

  const totalItems = (quest.linkedGoalIds?.length || 0) + (quest.linkedTaskIds?.length || 0);
  if (totalItems === 0) return 0;

  // This would need actual completion status from goals/tasks
  // For now, return 0 - will be implemented when integrating with actual data
  return 0;
};

/**
 * Calculate quest progress for quantitative quests
 */
const calculateQuantitativeQuestProgress = (quest: Quest): number => {
  if (quest.kind !== 'quantitative' || !quest.targetCount) return 0;

  // This would need actual count data
  // For now, return 0 - will be implemented when integrating with actual data
  return 0;
};

/**
 * Main progress calculation dispatcher function
 */
const calculateQuestProgress = (quest: Quest): number => {
  switch (quest.kind) {
    case 'linked':
      return calculateLinkedQuestProgress(quest);
    case 'quantitative':
      return calculateQuantitativeQuestProgress(quest);
    default:
      return 0;
  }
};

// ============================================================================
// Phase 6: Export Structure
// ============================================================================

/**
 * Export all types, interfaces, schemas, constants, and helper functions
 */
export type {
  QuestStatus,
  QuestDifficulty,
  QuestKind,
  QuestCountScope,
  QuestPrivacy,
};

export type {
  Quest,
  QuestCategory,
  QuestFormData,
  QuestCreateInput,
  QuestUpdateInput,
  QuestCancelInput,
  QuestValidationErrors,
  QuestFormValidation,
};

export {
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

  // Constants
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_PRIVACY_OPTIONS,
  QUEST_KIND_OPTIONS,
  QUEST_COUNT_SCOPE_OPTIONS,
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
  MAX_REWARD_XP,
  MIN_REWARD_XP,
  DEFAULT_REWARD_XP,

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
  calculateQuestProgress
};
