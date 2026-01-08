/**
 * Quest Template models for the GoalsGuild application.
 * 
 * This file contains TypeScript interfaces for Quest Template operations
 * including creation, updates, and responses. All interfaces follow
 * the established patterns from the quest models.
 */

import { QuestDifficulty, QuestKind, QuestCountScope } from './quest';

// Quest template privacy options
export type QuestTemplatePrivacy = 'public' | 'followers' | 'private';

// Quest template creation input
export interface QuestTemplateCreateInput {
  title: string;
  description?: string;
  category: string;
  difficulty: QuestDifficulty;
  rewardXp: number;
  tags: string[];
  privacy: QuestTemplatePrivacy;
  kind: QuestKind;
  targetCount?: number;
  countScope?: QuestCountScope;
  estimatedDuration?: number;
  instructions?: string;
}

// Quest template update input
export interface QuestTemplateUpdateInput {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: QuestDifficulty;
  rewardXp?: number;
  tags?: string[];
  privacy?: QuestTemplatePrivacy;
  kind?: QuestKind;
  targetCount?: number;
  countScope?: QuestCountScope;
}

// Quest template response
export interface QuestTemplate {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  difficulty: QuestDifficulty;
  rewardXp: number;
  tags: string[];
  privacy: QuestTemplatePrivacy;
  kind: QuestKind;
  targetCount?: number;
  countScope?: QuestCountScope;
  createdAt: number;
  updatedAt: number;
}

// Quest template list response
export interface QuestTemplateListResponse {
  templates: QuestTemplate[];
  total: number;
  hasMore: boolean;
  nextToken?: string;
}

// Quest template creation form data
export interface QuestTemplateFormData {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  rewardXp: number;
  tags: string[];
  privacy: QuestTemplatePrivacy;
  kind: QuestKind;
  targetCount: number;
  countScope: QuestCountScope;
}

// Quest template validation errors
export interface QuestTemplateValidationErrors {
  [key: string]: string | undefined;
}

// Quest template filter options
export interface QuestTemplateFilters {
  search?: string;
  category?: string;
  difficulty?: QuestDifficulty;
  privacy?: QuestTemplatePrivacy;
  kind?: QuestKind;
}

// Quest template sort options
export interface QuestTemplateSortOptions {
  field: 'title' | 'createdAt' | 'updatedAt' | 'difficulty' | 'rewardXp';
  direction: 'asc' | 'desc';
}

// Quest template list options
export interface QuestTemplateListOptions {
  limit?: number;
  nextToken?: string;
  privacy?: 'user' | 'public' | 'all';
  filters?: QuestTemplateFilters;
  sort?: QuestTemplateSortOptions;
}

// Privacy level descriptions
export const PRIVACY_DESCRIPTIONS: Record<QuestTemplatePrivacy, string> = {
  public: 'Anyone can see and use this template',
  followers: 'Only your followers can see and use this template',
  private: 'Only you can see and use this template'
};

// Privacy level icons
export const PRIVACY_ICONS: Record<QuestTemplatePrivacy, string> = {
  public: '🌍',
  followers: '👥',
  private: '🔒'
};

// Privacy level colors
export const PRIVACY_COLORS: Record<QuestTemplatePrivacy, string> = {
  public: 'text-green-600',
  followers: 'text-blue-600',
  private: 'text-gray-600'
};

// Default quest template form data
export const DEFAULT_QUEST_TEMPLATE_FORM_DATA: QuestTemplateFormData = {
  title: '',
  description: '',
  category: '',
  difficulty: 'medium',
  rewardXp: 50,
  tags: [],
  privacy: 'private',
  kind: 'linked',
  targetCount: 1,
  countScope: 'completed_tasks'
};

// Quest template categories (same as quest categories)
export const QUEST_TEMPLATE_CATEGORIES = [
  'Health', 'Work', 'Personal', 'Learning', 'Fitness', 'Creative', 
  'Financial', 'Social', 'Spiritual', 'Hobby', 'Travel', 'Other'
];

// Quest template difficulty options
export const QUEST_TEMPLATE_DIFFICULTY_OPTIONS: Array<{
  value: QuestDifficulty;
  label: string;
  description: string;
}> = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Simple tasks that can be completed quickly'
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Moderate tasks requiring some effort'
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Challenging tasks requiring significant effort'
  }
];

// Quest template privacy options
export const QUEST_TEMPLATE_PRIVACY_OPTIONS: Array<{
  value: QuestTemplatePrivacy;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can see and use this template',
    icon: '🌍'
  },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Only your followers can see and use this template',
    icon: '👥'
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see and use this template',
    icon: '🔒'
  }
];

// Quest template kind options
export const QUEST_TEMPLATE_KIND_OPTIONS: Array<{
  value: QuestKind;
  label: string;
  description: string;
}> = [
  {
    value: 'linked',
    label: 'Linked Quest',
    description: 'Quest based on completing specific tasks or goals'
  },
  {
    value: 'quantitative',
    label: 'Quantitative Quest',
    description: 'Quest based on completing a certain number of items'
  }
];

// Quest template count scope options
export const QUEST_TEMPLATE_COUNT_SCOPE_OPTIONS: Array<{
  value: QuestCountScope;
  label: string;
  description: string;
}> = [
  {
    value: 'completed_tasks',
    label: 'Completed Tasks',
    description: 'Count completed tasks'
  },
  {
    value: 'completed_goals',
    label: 'Completed Goals',
    description: 'Count completed goals'
  }
];

// Utility functions
export const getPrivacyDescription = (privacy: QuestTemplatePrivacy): string => {
  return PRIVACY_DESCRIPTIONS[privacy];
};

export const getPrivacyIcon = (privacy: QuestTemplatePrivacy): string => {
  return PRIVACY_ICONS[privacy];
};

export const getPrivacyColor = (privacy: QuestTemplatePrivacy): string => {
  return PRIVACY_COLORS[privacy];
};

export const formatTemplateTitle = (title: string): string => {
  return title.trim();
};

export const formatTemplateDescription = (description: string): string => {
  return description.trim();
};

export const formatTemplateTags = (tags: string[]): string[] => {
  return tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 10); // Limit to 10 tags
};

export const validateTemplateTitle = (title: string): string | null => {
  if (!title || title.trim().length < 3) {
    return 'Title must be at least 3 characters long';
  }
  if (title.trim().length > 100) {
    return 'Title must be 100 characters or less';
  }
  return null;
};

export const validateTemplateDescription = (description: string): string | null => {
  if (description && description.trim().length > 500) {
    return 'Description must be 500 characters or less';
  }
  return null;
};

export const validateTemplateTags = (tags: string[]): string | null => {
  if (tags.length > 10) {
    return 'Maximum 10 tags allowed';
  }
  for (const tag of tags) {
    if (tag.trim().length > 20) {
      return 'Each tag must be 20 characters or less';
    }
  }
  return null;
};

export const validateTemplateTargetCount = (targetCount: number, kind: QuestKind): string | null => {
  if (kind === 'quantitative') {
    if (!targetCount || targetCount < 1) {
      return 'Target count is required for quantitative quests';
    }
    if (targetCount > 1000) {
      return 'Target count must be 1000 or less';
    }
  }
  return null;
};

export const validateTemplateCountScope = (countScope: QuestCountScope, kind: QuestKind): string | null => {
  if (kind === 'quantitative') {
    if (!countScope) {
      return 'Count scope is required for quantitative quests';
    }
  }
  return null;
};

export const validateQuestTemplate = (template: QuestTemplateFormData): QuestTemplateValidationErrors => {
  const errors: QuestTemplateValidationErrors = {};

  const titleError = validateTemplateTitle(template.title);
  if (titleError) errors.title = titleError;

  const descriptionError = validateTemplateDescription(template.description);
  if (descriptionError) errors.description = descriptionError;

  const tagsError = validateTemplateTags(template.tags);
  if (tagsError) errors.tags = tagsError;

  const targetCountError = validateTemplateTargetCount(template.targetCount, template.kind);
  if (targetCountError) errors.targetCount = targetCountError;

  const countScopeError = validateTemplateCountScope(template.countScope, template.kind);
  if (countScopeError) errors.countScope = countScopeError;

  return errors;
};

export const hasValidationErrors = (errors: QuestTemplateValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};
