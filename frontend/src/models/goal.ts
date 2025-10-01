import { NLPQuestionKey, NLPAnswers } from '@/pages/goals/questions';

// Goal status enumeration
export enum GoalStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// Goal category interface
export interface GoalCategory {
  id: string;
  name: string;
  description?: string;
}

// Form data interface for goal creation/editing
export interface GoalFormData {
  title: string;
  description: string;
  deadline: string;
  category?: string;
  nlpAnswers: NLPAnswers;
}

// Validation errors interface
export interface GoalValidationErrors {
  title?: string;
  description?: string;
  deadline?: string;
  category?: string;
  nlpAnswers?: {
    [K in NLPQuestionKey]?: string;
  };
}

// Goal list item interface for display in lists
export interface GoalListItem {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: GoalStatus;
  category?: string;
  createdAt: number;
  updatedAt: number;
  progress?: number; // Optional progress percentage
}

// Goal answer interface for API responses
export interface GoalAnswer {
  key: string;
  answer: string;
}

// Goal response interface from API
export interface GoalResponse {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  answers: GoalAnswer[];
  deadline: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
}

// Goal input interface for API calls
export interface GoalInput {
  title: string;
  description?: string;
  deadline: string;
  category?: string;
  nlpAnswers: NLPAnswers;
}

// Goal update input interface
export interface GoalUpdateInput {
  title?: string;
  description?: string;
  deadline?: string;
  category?: string;
  nlpAnswers?: NLPAnswers;
  status?: GoalStatus;
}

// Predefined goal categories
export const GOAL_CATEGORIES: GoalCategory[] = [
  { id: 'health', name: 'Health & Fitness', description: 'Physical and mental health goals' },
  { id: 'career', name: 'Career & Professional', description: 'Work and professional development goals' },
  { id: 'education', name: 'Education & Learning', description: 'Learning and skill development goals' },
  { id: 'personal', name: 'Personal Development', description: 'Personal growth and self-improvement goals' },
  { id: 'financial', name: 'Financial', description: 'Money and financial planning goals' },
  { id: 'relationships', name: 'Relationships', description: 'Social and relationship goals' },
  { id: 'hobbies', name: 'Hobbies & Interests', description: 'Recreational and hobby-related goals' },
  { id: 'travel', name: 'Travel & Adventure', description: 'Travel and adventure goals' },
  { id: 'creative', name: 'Creative & Artistic', description: 'Creative and artistic expression goals' },
  { id: 'other', name: 'Other', description: 'Goals that don\'t fit other categories' }
];

// Helper function to get category by ID
export const getCategoryById = (id: string): GoalCategory | undefined => {
  return GOAL_CATEGORIES.find(category => category.id === id);
};

// Helper function to get all category names
export const getCategoryNames = (): string[] => {
  return GOAL_CATEGORIES.map(category => category.name);
};

// Helper function to validate goal status
export const isValidGoalStatus = (status: string): status is GoalStatus => {
  return Object.values(GoalStatus).includes(status as GoalStatus);
};

// Helper function to format goal status for display
export const formatGoalStatus = (status: GoalStatus): string => {
  const statusMap: Record<GoalStatus, string> = {
    [GoalStatus.ACTIVE]: 'Active',
    [GoalStatus.PAUSED]: 'Paused',
    [GoalStatus.COMPLETED]: 'Completed',
    [GoalStatus.ARCHIVED]: 'Archived'
  };
  return statusMap[status] || status;
};

// Helper function to get status color class
export const getStatusColorClass = (status: GoalStatus): string => {
  const colorMap: Record<GoalStatus, string> = {
    [GoalStatus.ACTIVE]: 'text-green-600 bg-green-50',
    [GoalStatus.PAUSED]: 'text-yellow-600 bg-yellow-50',
    [GoalStatus.COMPLETED]: 'text-blue-600 bg-blue-50',
    [GoalStatus.ARCHIVED]: 'text-gray-600 bg-gray-50'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

// Helper function to format deadline for display
export const formatDeadline = (deadline: string): string => {
  try {
    // Treat the deadline as a local date, not UTC
    const date = new Date(deadline + 'T00:00:00');
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return deadline;
  }
};