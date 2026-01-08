import { z } from 'zod';
import { NLPQuestionKey, nlpQuestionOrder } from '@/pages/goals/questions';
import { GoalStatus, GOAL_CATEGORIES } from '@/models/goal';

// Title validation schema
export const titleSchema = z
  .string()
  .min(3, 'Title must be at least 3 characters long')
  .max(100, 'Title must be no more than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Title contains invalid characters')
  .refine((val) => val.trim().length >= 3, 'Title cannot be just whitespace');

// Description validation schema
export const descriptionSchema = z
  .string()
  .max(500, 'Description must be no more than 500 characters')
  .optional()
  .or(z.literal(''));

// Deadline validation schema with business rules
export const deadlineSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be in YYYY-MM-DD format')
  .refine((val) => {
    const date = new Date(val + 'T00:00:00Z');
    return !isNaN(date.getTime());
  }, 'Deadline must be a valid date')
  .refine((val) => {
    const date = new Date(val + 'T00:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Deadline must be today or in the future')
  .refine((val) => {
    const date = new Date(val + 'T00:00:00Z');
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    return date <= maxDate;
  }, 'Deadline cannot be more than 10 years in the future');

// Category validation schema
export const categorySchema = z
  .string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === '') return true;
    const validCategories = GOAL_CATEGORIES.map(cat => cat.id);
    return validCategories.includes(val) || val.length <= 50;
  }, 'Invalid category selected');

// Tags validation schema
export const tagsSchema = z
  .array(z.string())
  .optional()
  .refine((val) => {
    if (!val || val.length === 0) return true;
    return val.every(tag => 
      tag.trim().length > 0 && 
      tag.trim().length <= 50 && 
      /^[a-zA-Z0-9\s\-_]+$/.test(tag.trim())
    );
  }, 'Tags must be 1-50 characters and contain only letters, numbers, spaces, hyphens, and underscores');

// Individual NLP answer validation schema
export const nlpAnswerSchema = z
  .string()
  .min(10, 'Answer must be at least 10 characters long')
  .max(500, 'Answer must be no more than 500 characters')
  .refine((val) => val.trim().length >= 10, 'Answer cannot be just whitespace');

// NLP answers validation schema
export const nlpAnswersSchema = z.object({
  positive: nlpAnswerSchema,
  specific: nlpAnswerSchema,
  evidence: nlpAnswerSchema,
  resources: nlpAnswerSchema,
  obstacles: nlpAnswerSchema,
  ecology: nlpAnswerSchema,
  timeline: nlpAnswerSchema,
  firstStep: nlpAnswerSchema,
});

// Goal status validation schema
export const goalStatusSchema = z.nativeEnum(GoalStatus);

// Main goal creation validation schema
export const goalCreateSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  deadline: deadlineSchema,
  category: categorySchema,
  tags: tagsSchema,
  nlpAnswers: nlpAnswersSchema,
});

// Goal update validation schema (all fields optional)
export const goalUpdateSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  deadline: deadlineSchema.optional(),
  category: categorySchema,
  tags: tagsSchema,
  nlpAnswers: nlpAnswersSchema.partial().optional(),
  status: goalStatusSchema.optional(),
});

// Goal list filter validation schema
export const goalListFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Goal search validation schema
export const goalSearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100, 'Search query too long'),
  filters: z.object({
    status: z.string().optional(),
    category: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional(),
});

// Validation helper functions
export const validateGoalTitle = (title: string): { isValid: boolean; error?: string } => {
  try {
    titleSchema.parse(title);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid title' };
  }
};

export const validateGoalDeadline = (deadline: string): { isValid: boolean; error?: string } => {
  try {
    deadlineSchema.parse(deadline);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid deadline' };
  }
};

export const validateNLPAnswer = (answer: string): { isValid: boolean; error?: string } => {
  try {
    nlpAnswerSchema.parse(answer);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid answer' };
  }
};

export const validateGoalCategory = (category: string): { isValid: boolean; error?: string } => {
  try {
    categorySchema.parse(category);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid category' };
  }
};

// Type exports for use in components
export type GoalCreateInput = z.infer<typeof goalCreateSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
export type GoalListFilter = z.infer<typeof goalListFilterSchema>;
export type GoalSearchInput = z.infer<typeof goalSearchSchema>;
export type NLPAnswerInput = z.infer<typeof nlpAnswerSchema>;
