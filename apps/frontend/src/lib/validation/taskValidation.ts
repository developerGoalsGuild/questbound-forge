import { z } from 'zod';

// Task status validation schema
export const taskStatusSchema = z.enum(['active', 'paused', 'completed', 'archived'], {
  errorMap: () => ({ message: 'Status must be one of: active, paused, completed, archived' })
});

// Task title validation schema
export const taskTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(100, 'Title must be no more than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Title contains invalid characters')
  .refine((val) => val.trim().length >= 1, 'Title cannot be just whitespace');

// Task description validation schema
export const taskDescriptionSchema = z
  .string()
  .max(500, 'Description must be no more than 500 characters')
  .optional()
  .or(z.literal(''));

// Task due date validation schema
export const taskDueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
  .refine((val) => {
    const date = new Date(val + 'T00:00:00Z');
    return !isNaN(date.getTime());
  }, 'Due date must be a valid date')
  .refine((val) => {
    const date = new Date(val + 'T00:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Due date must be today or in the future')
  .refine((val) => {
    const date = new Date(val + 'T00:00:00Z');
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    return date <= maxDate;
  }, 'Due date cannot be more than 5 years in the future');

// Task tags validation schema
export const taskTagsSchema = z
  .array(z.string())
  .max(10, 'Maximum 10 tags allowed')
  .refine((tags) => {
    return tags.every(tag => 
      tag.length >= 1 && 
      tag.length <= 20 && 
      /^[a-zA-Z0-9-_]+$/.test(tag)
    );
  }, 'Each tag must be 1-20 characters and contain only letters, numbers, hyphens, and underscores');

// Individual tag validation schema
export const taskTagSchema = z
  .string()
  .min(1, 'Tag cannot be empty')
  .max(20, 'Tag must be no more than 20 characters')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Tag can only contain letters, numbers, hyphens, and underscores');

// Main task creation validation schema
export const taskCreateSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  dueAt: taskDueDateSchema,
  status: taskStatusSchema.optional().default('active'),
  tags: taskTagsSchema.optional().default([]),
  goalId: z.string().min(1, 'Goal ID is required'),
});

// Task update validation schema (all fields optional)
export const taskUpdateSchema = z.object({
  title: taskTitleSchema.optional(),
  description: taskDescriptionSchema,
  dueAt: taskDueDateSchema.optional(),
  status: taskStatusSchema.optional(),
  tags: taskTagsSchema.optional(),
});

// Task list filter validation schema
export const taskListFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  goalId: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Task search validation schema
export const taskSearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100, 'Search query too long'),
  filters: z.object({
    status: z.string().optional(),
    goalId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional(),
});

// Validation helper functions
export const validateTaskTitle = (title: string): { isValid: boolean; error?: string } => {
  try {
    taskTitleSchema.parse(title);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid title' };
  }
};

export const validateTaskDueDate = (dueDate: string): { isValid: boolean; error?: string } => {
  try {
    taskDueDateSchema.parse(dueDate);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid due date' };
  }
};

export const validateTaskTag = (tag: string): { isValid: boolean; error?: string } => {
  try {
    taskTagSchema.parse(tag);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid tag' };
  }
};

export const validateTaskStatus = (status: string): { isValid: boolean; error?: string } => {
  try {
    taskStatusSchema.parse(status);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid status' };
  }
};

// Type exports for use in components
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskListFilter = z.infer<typeof taskListFilterSchema>;
export type TaskSearchInput = z.infer<typeof taskSearchSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskTag = z.infer<typeof taskTagSchema>;
