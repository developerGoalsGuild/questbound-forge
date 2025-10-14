import { nlpQuestionOrder, NLPAnswers } from '@/pages/goals/questions';
import { getAccessToken, getApiBase, graphQLClient } from '@/lib/utils';
import { ACTIVE_GOALS_COUNT } from '@/graphql/queries';
import { graphqlRaw, graphqlWithApiKey } from './api';
import { sortGoals } from './goalProgress';
import { logger } from './logger';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface GoalInput {
  title: string;
  description?: string;
  deadline: string;
  category?: string;
  tags?: string[];
  nlpAnswers: NLPAnswers;
}

export interface GoalAnswer {
  key: string;
  answer: string;
}

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
  // Backend progress fields
  progress?: number;
  milestones?: Milestone[];
  completedTasks?: number;
  totalTasks?: number;
}

export interface Milestone {
  id: string;
  name: string;
  percentage: number;
  achieved: boolean;
  achievedAt?: number;
  description?: string;
}

export interface GoalProgressResponse {
  goalId: string;
  progressPercentage: number;
  taskProgress: number;
  timeProgress: number;
  completedTasks: number;
  totalTasks: number;
  milestones: Milestone[];
  lastUpdated: number;
  isOverdue: boolean;
  isUrgent: boolean;
}

export function buildAnswers(nlpAnswers: NLPAnswers): GoalAnswer[] {
  return nlpQuestionOrder.map((key) => ({
    key,
    answer: (nlpAnswers[key] || '').trim(),
  }));
}

export function buildTags(category?: string): string[] {
  if (!category) return [];
  const trimmed = category.trim();
  return trimmed ? [trimmed] : [];
}

export function assertValidDeadline(deadline: string): string {
  const trimmed = deadline?.trim?.() ?? '';
  if (!DATE_ONLY_REGEX.test(trimmed)) {
    throw new Error('Deadline must follow YYYY-MM-DD format.');
  }

  // Create a Date object and verify it represents the same date
  const date = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Deadline must be a valid calendar date.');
  }

  // Verify the date components match (to catch invalid dates like Feb 30)
  const [year, month, day] = trimmed.split('-').map(Number);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    throw new Error('Deadline must be a valid calendar date.');
  }

  return trimmed;
}

export async function createGoal(input: GoalInput): Promise<GoalResponse> {
  const base = getApiBase();
  const url = base.replace(/\/$/, '') + '/quests';

  const deadline = assertValidDeadline(input.deadline);
  const payload = {
    title: input.title,
    description: input.description?.trim?.() ?? '',
    category: input.category?.trim?.() || null,
    deadline,
    tags: input.tags || buildTags(input.category), // Use provided tags or build from category
    answers: buildAnswers(input.nlpAnswers),
  };

  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to create a goal.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    const detail = body?.detail || text || 'Goal creation failed';
    const error = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    logger.error('Goal creation failed', { error, url, input });
    throw error;
  }

  return body as GoalResponse;
}

export async function getActiveGoalsCountForUser(userId: string): Promise<number> {
  const operation = 'getActiveGoalsCountForUser';
  try {
    const QUERY = /* GraphQL */ `
      query ActiveGoalsCount($userId: ID!) {
        activeGoalsCount(userId: $userId)
      }
    `;

    const data = await graphqlRaw<{ activeGoalsCount: number }>(QUERY, { userId });
    return Number(data?.activeGoalsCount ?? 0);
  } catch (e: any) {
    logger.error('GraphQL error in getActiveGoalsCountForUser', { 
        operation, 
        error: e?.errors || e?.message || e 
    });
    return 0;
  }
}



export async function loadGoals() {
  const operation = 'loadGoals';
  try {
    const data = await graphqlRaw<{
      myGoals: Array<{ 
        id: string; 
        userId: string;
        title: string; 
        description: string;
        category: string | null;
        tags: string[];
        deadline: string | null;
        status: string; 
        createdAt: number;
        updatedAt: number;
        answers: Array<{ key: string; answer: string; }>;
        // Progress fields from backend
        progress?: number;
        milestones?: Array<{
          id: string;
          name: string;
          percentage: number;
          achieved: boolean;
          achievedAt?: number;
          description?: string;
        }>;
        completedTasks?: number;
        totalTasks?: number;
      }>;
    }>(`query MyGoals { 
      myGoals { 
        id 
        userId
        title 
        description 
        category
        tags
        deadline 
        status 
        createdAt
        updatedAt
        answers {
          key
          answer
        }
        # Progress fields
        progress
        milestones {
          id
          name
          percentage
          achieved
          achievedAt
          description
        }
        completedTasks
        totalTasks
      } 
    }`);

    const goals = data?.myGoals ?? [];
    // Ensure milestones is always an array
    return goals.map(goal => ({
      ...goal,
      milestones: goal.milestones || [],
    }));
  } catch (e: any) {
    logger.error('GraphQL error in loadGoals', { 
        operation, 
        error: e?.errors || e?.message || e 
    });
    return []; // safe fallback for UI
  }
}

// Dashboard-specific function for top 3 goals (using myGoals with frontend filtering)
export async function loadDashboardGoals(sortBy: string = 'deadline-asc'): Promise<GoalResponse[]> {
  const operation = 'loadDashboardGoals';
  try {
    const data = await graphqlRaw<{
      myGoals: Array<{ 
        id: string; 
        userId: string;
        title: string; 
        description: string;
        category: string | null;
        tags: string[];
        deadline: string | null;
        status: string; 
        createdAt: number;
        updatedAt: number;
        // Progress fields from backend
        progress?: number;
        milestones?: Array<{
          id: string;
          name: string;
          percentage: number;
          achieved: boolean;
          achievedAt?: number;
          description?: string;
        }>;
        completedTasks?: number;
        totalTasks?: number;
      }>;
    }>(`query MyGoals { 
      myGoals { 
        id 
        userId
        title 
        description 
        category
        tags
        deadline 
        status 
        createdAt
        updatedAt
        # Progress fields
        progress
        milestones {
          id
          name
          percentage
          achieved
          achievedAt
          description
        }
        completedTasks
        totalTasks
      } 
    }`);

    // Filter active goals and limit to 3
    const goals = data?.myGoals ?? [];
    const activeGoals = goals
      .filter(goal => goal.status === 'active')
      .map(goal => ({
        ...goal,
        milestones: goal.milestones || [],
      }));
    
    // Sort the goals based on sortBy parameter
    const sortedGoals = sortGoals(activeGoals as any, sortBy);
    
    // Return top 3
    return sortedGoals.slice(0, 3) as GoalResponse[];
  } catch (e: any) {
    logger.error('GraphQL error in loadDashboardGoals', { 
        operation, 
        error: e?.errors || e?.message || e 
    });
    return []; // safe fallback for UI
  }
}

// New CRUD functions for goal management

export interface GoalUpdateInput {
  title?: string;
  description?: string;
  deadline?: number; // Epoch timestamp for updates
  category?: string;
  tags?: string[];
  nlpAnswers?: { [K in string]?: string };
  status?: string;
}

export async function updateGoal(goalId: string, updates: GoalUpdateInput): Promise<GoalResponse> {
  const base = getApiBase();
  const url = base.replace(/\/$/, '') + `/quests/${goalId}`;

  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to update a goal.');
  }

  // Prepare payload with only provided fields
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.deadline !== undefined) {
    // Convert epoch timestamp to YYYY-MM-DD format for backend
    const date = new Date(Number(updates.deadline) * 1000);
    payload.deadline = date.toISOString().split('T')[0];
  }
  if (updates.category !== undefined) {
    payload.category = updates.category?.trim?.() || null;
  }
  if (updates.tags !== undefined) {
    payload.tags = updates.tags || [];
  }
  if (updates.nlpAnswers !== undefined) {
    payload.answers = Object.entries(updates.nlpAnswers).map(([key, answer]) => ({
      key,
      answer: answer || ''
    }));
  }
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    const detail = body?.detail || text || 'Goal update failed';
    const error = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    logger.error('Goal update failed', { error, url, updates });
    throw error;
  }

  return body as GoalResponse;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const base = getApiBase();
  const url = base.replace(/\/$/, '') + `/quests/${goalId}`;

  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to delete a goal.');
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let body: any = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
    const detail = body?.detail || text || 'Goal deletion failed';
    const error = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    logger.error('Goal deletion failed', { error, url, goalId });
    throw error;
  }
}

export async function getGoal(goalId: string): Promise<GoalResponse> {
  const operation = 'getGoal';
  try {
    const token = getAccessToken();
    const apiBase = getApiBase();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${apiBase}/quests/${goalId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to load goal';
      throw new Error(message);
    }

    const goal = await response.json();
    return goal;
  } catch (e: any) {
    logger.error('REST API error in getGoal', { 
        operation,
        goalId,
        error: e?.message || e 
    });
    throw new Error(e?.message || 'Failed to load goal');
  }
}

export async function validateGoalTitle(title: string): Promise<boolean> {
  try {
    // Basic validation - could be enhanced with server-side validation
    return title.trim().length >= 3 && title.trim().length <= 100;
  } catch {
    return false;
  }
}

export async function getGoalCategories(): Promise<string[]> {
  // Return predefined categories - could be enhanced to fetch from server
  return [
    'health',
    'career',
    'education',
    'personal',
    'financial',
    'relationships',
    'hobbies',
    'travel',
    'creative',
    'other'
  ];
}

// Progress API Functions

/**
 * Get progress data for a specific goal from the backend using GraphQL
 */
export async function getGoalProgress(goalId: string): Promise<GoalProgressResponse> {
  const operation = 'getGoalProgress';
  try {
    const QUERY = /* GraphQL */ `
      query GoalProgress($goalId: ID!) {
        goalProgress(goalId: $goalId) {
          goalId
          progressPercentage
          taskProgress
          timeProgress
          completedTasks
          totalTasks
          milestones {
            id
            name
            percentage
            achieved
            achievedAt
            description
          }
          lastUpdated
          isOverdue
          isUrgent
        }
      }
    `;

    const data = await graphqlRaw<{ goalProgress: GoalProgressResponse }>(QUERY, { goalId });
    if (!data?.goalProgress) {
      throw new Error('Goal progress not found');
    }
    return data.goalProgress;
  } catch (e: any) {
    logger.error('GraphQL error in getGoalProgress', { 
        operation,
        goalId,
        error: e?.errors || e?.message || e 
    });
    throw new Error(e?.message || 'Failed to load goal progress');
  }
}

/**
 * Get raw goals and tasks data for frontend progress calculation
 */
export async function getGoalsWithTasks(): Promise<import('./progressCalculation').GoalWithTasks[]> {
  const operation = 'getGoalsWithTasks';
  try {
    const QUERY = /* GraphQL */ `
      query MyGoalsWithTasks {
        myGoalsWithTasks {
          id
          title
          deadline
          status
          createdAt
          tasks {
            id
            dueAt
            status
            createdAt
            updatedAt
          }
        }
      }
    `;

    const data = await graphqlRaw<{ myGoalsWithTasks: import('./progressCalculation').GoalWithTasks[] }>(QUERY);
    return data?.myGoalsWithTasks ?? [];
  } catch (e: any) {
    logger.error('GraphQL error in getGoalsWithTasks', { 
        operation,
        error: e?.errors || e?.message || e 
    });
    return []; // safe fallback for UI
  }
}

export async function getAllGoalsProgress(): Promise<GoalProgressResponse[]> {
  const operation = 'getAllGoalsProgress';
  try {
    const { calculateMultipleGoalsProgress } = await import('./progressCalculation');
    const goalsWithTasks = await getGoalsWithTasks();
    const progress = calculateMultipleGoalsProgress(goalsWithTasks);
    
    // Convert to the expected interface format
    return progress.map(p => ({
      goalId: p.goalId,
      progressPercentage: p.progressPercentage,
      taskProgress: p.taskProgress,
      timeProgress: p.timeProgress,
      completedTasks: p.completedTasks,
      totalTasks: p.totalTasks,
      milestones: p.milestones,
      lastUpdated: p.lastUpdated,
      isOverdue: p.isOverdue,
      isUrgent: p.isUrgent
    }));
  } catch (e: any) {
    logger.error('Error in getAllGoalsProgress', {
        operation,
        error: e?.errors || e?.message || e
    });
    return []; // safe fallback for UI
  }
}

/**
 * Load goals with progress data from backend
 * This combines goal data with progress data for comprehensive goal information
 */
export async function loadGoalsWithProgress(): Promise<GoalResponse[]> {
  try {
    // Get goals from GraphQL
    const goals = await loadGoals();
    
    // Get progress data from backend API
    const progressData = await getAllGoalsProgress();
    
    // Create a map of progress data by goal ID
    const progressMap = new Map<string, GoalProgressResponse>();
    progressData.forEach(progress => {
      progressMap.set(progress.goalId, progress);
    });
    
    // Merge goal data with progress data
    return goals.map(goal => {
      const progress = progressMap.get(goal.id);
      if (progress) {
        return {
          ...goal,
          progress: progress.progressPercentage,
          completedTasks: progress.completedTasks,
          totalTasks: progress.totalTasks,
          milestones: progress.milestones || [],
        } as GoalResponse;
      }
      return {
        ...goal,
        milestones: goal.milestones || [],
      } as GoalResponse;
    });
  } catch (e: any) {
    logger.error('Error in loadGoalsWithProgress', { 
        error: e?.message || e 
    });
    // Fallback to regular goals loading
    return loadGoals();
  }
}

/**
 * Load dashboard goals with progress data from backend
 * This provides the top 3 goals with comprehensive progress information
 */
export async function loadDashboardGoalsWithProgress(sortBy: string = 'deadline-asc'): Promise<GoalResponse[]> {
  try {
    // Get goals with progress data
    const goalsWithProgress = await loadGoalsWithProgress();
    
    // Filter active goals
    const activeGoals = goalsWithProgress.filter(goal => goal.status === 'active');
    
    // Sort the goals based on sortBy parameter
    const sortedGoals = sortGoals(activeGoals as any, sortBy);
    
    // Return top 3
    return sortedGoals.slice(0, 3) as GoalResponse[];
  } catch (e: any) {
    logger.error('Error in loadDashboardGoalsWithProgress', {
        error: e?.message || e
    });
    // Fallback to regular dashboard goals loading
    return await loadDashboardGoals(sortBy);
  }
}

export async function validateGoalDeadline(deadline: string): Promise<boolean> {
  try {
    // Basic validation - could be enhanced with server-side validation
    const date = new Date(deadline + 'T00:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(date.getTime()) && date >= today;
  } catch {
    return false;
  }
}
