/**
 * Guild validation schemas using Zod.
 *
 * This module provides validation schemas for guild-related forms and data,
 * following the project's validation patterns and requirements.
 */

import { z } from 'zod';

// Validation constants
const MIN_GUILD_NAME_LENGTH = 3;
const MAX_GUILD_NAME_LENGTH = 50;
const MAX_GUILD_DESCRIPTION_LENGTH = 500;
const MAX_TAGS_COUNT = 10;
const MIN_TAG_LENGTH = 2;
const MAX_TAG_LENGTH = 20;

// Guild name validation regex - alphanumeric, spaces, hyphens, underscores
const GUILD_NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

// Tag validation regex - alphanumeric and spaces
const TAG_REGEX = /^[a-zA-Z0-9\s]+$/;

/**
 * Schema for guild creation form validation
 */
export const guildCreateSchema = z.object({
  name: z
    .string()
    .min(MIN_GUILD_NAME_LENGTH, {
      message: `Guild name must be at least ${MIN_GUILD_NAME_LENGTH} characters long`,
    })
    .max(MAX_GUILD_NAME_LENGTH, {
      message: `Guild name must be less than ${MAX_GUILD_NAME_LENGTH} characters`,
    })
    .regex(GUILD_NAME_REGEX, {
      message: 'Guild name can only contain letters, numbers, spaces, hyphens, and underscores',
    })
    .transform((val) => val.trim())
    .refine((val) => val.length >= MIN_GUILD_NAME_LENGTH, {
      message: 'Guild name cannot be empty after trimming',
    }),

  description: z
    .string()
    .max(MAX_GUILD_DESCRIPTION_LENGTH, {
      message: `Description must be less than ${MAX_GUILD_DESCRIPTION_LENGTH} characters`,
    })
    .optional()
    .transform((val) => val?.trim() || undefined),

  tags: z
    .array(
      z
        .string()
        .min(MIN_TAG_LENGTH, {
          message: `Each tag must be at least ${MIN_TAG_LENGTH} characters long`,
        })
        .max(MAX_TAG_LENGTH, {
          message: `Each tag must be less than ${MAX_TAG_LENGTH} characters`,
        })
        .regex(TAG_REGEX, {
          message: 'Tags can only contain letters, numbers, and spaces',
        })
        .transform((val) => val.trim().toLowerCase())
    )
    .max(MAX_TAGS_COUNT, {
      message: `Maximum ${MAX_TAGS_COUNT} tags allowed`,
    })
    .default([])
    .transform((tags) => {
      // Remove duplicates and empty tags
      const uniqueTags = Array.from(new Set(tags.filter(tag => tag.length > 0)));
      return uniqueTags;
    }),

  guildType: z.enum(['public', 'private', 'approval']).default('public'),
});

/**
 * Schema for guild update form validation
 */
export const guildUpdateSchema = z.object({
  name: z
    .string()
    .min(MIN_GUILD_NAME_LENGTH, {
      message: `Guild name must be at least ${MIN_GUILD_NAME_LENGTH} characters long`,
    })
    .max(MAX_GUILD_NAME_LENGTH, {
      message: `Guild name must be less than ${MAX_GUILD_NAME_LENGTH} characters`,
    })
    .regex(GUILD_NAME_REGEX, {
      message: 'Guild name can only contain letters, numbers, spaces, hyphens, and underscores',
    })
    .transform((val) => val.trim())
    .optional(),

  description: z
    .string()
    .max(MAX_GUILD_DESCRIPTION_LENGTH, {
      message: `Description must be less than ${MAX_GUILD_DESCRIPTION_LENGTH} characters`,
    })
    .optional()
    .transform((val) => val?.trim() || undefined),

  tags: z
    .array(
      z
        .string()
        .min(MIN_TAG_LENGTH, {
          message: `Each tag must be at least ${MIN_TAG_LENGTH} characters long`,
        })
        .max(MAX_TAG_LENGTH, {
          message: `Each tag must be less than ${MAX_TAG_LENGTH} characters`,
        })
        .regex(TAG_REGEX, {
          message: 'Tags can only contain letters, numbers, and spaces',
        })
        .transform((val) => val.trim().toLowerCase())
    )
    .max(MAX_TAGS_COUNT, {
      message: `Maximum ${MAX_TAGS_COUNT} tags allowed`,
    })
    .optional()
    .transform((tags) => {
      if (!tags) return undefined;
      // Remove duplicates and empty tags
      const uniqueTags = Array.from(new Set(tags.filter(tag => tag.length > 0)));
      return uniqueTags;
    }),

  guildType: z.enum(['public', 'private', 'approval']).optional(),
});

/**
 * Schema for guild search and filter validation
 */
export const guildSearchSchema = z.object({
  search: z
    .string()
    .min(2, {
      message: 'Search term must be at least 2 characters long',
    })
    .max(100, {
      message: 'Search term must be less than 100 characters',
    })
    .optional()
    .transform((val) => val?.trim() || undefined),

  tags: z
    .array(z.string().min(1).max(50))
    .max(10, {
      message: 'Maximum 10 tags for filtering',
    })
    .optional(),

  sortBy: z
    .enum(['newest', 'oldest', 'members', 'activity'])
    .default('newest'),

  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20),

  nextToken: z.string().optional(),
});

/**
 * Schema for guild member management validation
 */
export const guildMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['owner', 'moderator', 'member'], {
    errorMap: () => ({ message: 'Role must be owner, moderator, or member' }),
  }),
});

/**
 * Schema for adding content to guild validation
 */
export const addContentToGuildSchema = z.object({
  guildId: z.string().min(1, 'Guild ID is required'),
  contentId: z.string().min(1, 'Content ID is required'),
  contentType: z.enum(['goal', 'quest'], {
    errorMap: () => ({ message: 'Content type must be either goal or quest' }),
  }),
});

/**
 * Schema for guild join request validation
 */
export const guildJoinRequestSchema = z.object({
  guildId: z.string().min(1, 'Guild ID is required'),
  message: z
    .string()
    .max(500, 'Join request message must be less than 500 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
});

/**
 * Schema for guild ownership transfer validation
 */
export const guildOwnershipTransferSchema = z.object({
  guildId: z.string().min(1, 'Guild ID is required'),
  newOwnerId: z.string().min(1, 'New owner ID is required'),
  reason: z
    .string()
    .max(500, 'Transfer reason must be less than 500 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
});

/**
 * Schema for moderator assignment validation
 */
export const moderatorAssignmentSchema = z.object({
  guildId: z.string().min(1, 'Guild ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Schema for moderation action validation
 */
export const moderationActionSchema = z.object({
  action: z.enum(['block_user', 'unblock_user', 'remove_comment', 'toggle_comment_permission'], {
    errorMap: () => ({ message: 'Invalid moderation action' }),
  }),
  targetUserId: z.string().min(1, 'Target user ID is required').optional(),
  commentId: z.string().min(1, 'Comment ID is required').optional(),
  reason: z
    .string()
    .max(500, 'Moderation reason must be less than 500 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
}).refine(
  (data) => {
    // Ensure targetUserId is provided for user-related actions
    if (['block_user', 'unblock_user', 'toggle_comment_permission'].includes(data.action)) {
      return !!data.targetUserId;
    }
    // Ensure commentId is provided for comment-related actions
    if (data.action === 'remove_comment') {
      return !!data.commentId;
    }
    return true;
  },
  {
    message: 'Required fields missing for the selected action',
  }
);

/**
 * Type inference from schemas
 */
export type GuildCreateForm = z.infer<typeof guildCreateSchema>;
export type GuildUpdateForm = z.infer<typeof guildUpdateSchema>;
export type GuildSearchForm = z.infer<typeof guildSearchSchema>;
export type GuildMemberForm = z.infer<typeof guildMemberSchema>;
export type AddContentToGuildForm = z.infer<typeof addContentToGuildSchema>;
export type GuildJoinRequestForm = z.infer<typeof guildJoinRequestSchema>;
export type GuildOwnershipTransferForm = z.infer<typeof guildOwnershipTransferSchema>;
export type ModeratorAssignmentForm = z.infer<typeof moderatorAssignmentSchema>;
export type ModerationActionForm = z.infer<typeof moderationActionSchema>;

/**
 * Validation helper functions
 */
export const validateGuildName = (name: string): { isValid: boolean; error?: string } => {
  try {
    guildCreateSchema.shape.name.parse(name);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid guild name' };
  }
};

export const validateGuildDescription = (description: string): { isValid: boolean; error?: string } => {
  try {
    guildCreateSchema.shape.description.parse(description);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid description' };
  }
};

export const validateGuildTags = (tags: string[]): { isValid: boolean; error?: string } => {
  try {
    guildCreateSchema.shape.tags.parse(tags);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid tags' };
  }
};

/**
 * Server-side validation simulation (for name uniqueness check)
 * In a real implementation, this would make an API call to check uniqueness
 */
export const checkGuildNameAvailability = async (name: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock unavailable names
  const unavailableNames = ['test', 'admin', 'guild', 'community'];
  const normalizedName = name.toLowerCase().trim();
  
  return !unavailableNames.includes(normalizedName);
};

/**
 * Enhanced guild creation schema with server-side name uniqueness validation
 */
export const guildCreateWithUniquenessSchema = guildCreateSchema.extend({
  name: guildCreateSchema.shape.name.refine(
    async (name) => {
      const isAvailable = await checkGuildNameAvailability(name);
      if (!isAvailable) {
        throw new z.ZodError([
          {
            code: 'custom',
            message: 'Guild name is already taken',
            path: ['name'],
          },
        ]);
      }
      return true;
    },
    {
      message: 'Guild name is already taken',
    }
  ),
});

/**
 * Popular tags for suggestions
 */
export const POPULAR_GUILD_TAGS = [
  'fitness',
  'health',
  'education',
  'technology',
  'art',
  'music',
  'sports',
  'gaming',
  'business',
  'travel',
  'cooking',
  'photography',
  'writing',
  'design',
  'science',
  'environment',
  'volunteer',
  'book club',
  'language learning',
  'career development',
] as const;

/**
 * Tag suggestions based on input
 */
export const getTagSuggestions = (input: string, existingTags: string[] = []): string[] => {
  if (!input || input.length < 1) {
    return POPULAR_GUILD_TAGS.filter(tag => !existingTags.includes(tag)).slice(0, 10);
  }

  const normalizedInput = input.toLowerCase().trim();
  const suggestions = POPULAR_GUILD_TAGS.filter(
    tag => 
      tag.includes(normalizedInput) && 
      !existingTags.includes(tag)
  );

  return suggestions.slice(0, 5);
};

/**
 * Form field validation states
 */
export interface ValidationState {
  isValid: boolean;
  error?: string;
  isDirty: boolean;
  isTouched: boolean;
}

/**
 * Create validation state for form fields
 */
export const createValidationState = (
  value: string,
  schema: z.ZodSchema,
  isDirty: boolean = false,
  isTouched: boolean = false
): ValidationState => {
  try {
    schema.parse(value);
    return {
      isValid: true,
      isDirty,
      isTouched,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message,
        isDirty,
        isTouched,
      };
    }
    return {
      isValid: false,
      error: 'Validation error',
      isDirty,
      isTouched,
    };
  }
};
