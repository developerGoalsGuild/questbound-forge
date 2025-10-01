import { nlpQuestionOrder, NLPAnswers } from '@/pages/goals/questions';
import { getAccessToken, getApiBase, graphQLClient } from '@/lib/utils';
import { ACTIVE_GOALS_COUNT } from '@/graphql/queries';
import { graphqlRaw } from './api';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface GoalInput {
  title: string;
  description?: string;
  deadline: string;
  category?: string;
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
    deadline,
    tags: buildTags(input.category),
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
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return body as GoalResponse;
}

export async function getActiveGoalsCountForUser(userId: string): Promise<number> {
  try {
    const QUERY = /* GraphQL */ `
      query ActiveGoalsCount($userId: ID!) {
        activeGoalsCount(userId: $userId)
      }
    `;

    const data = await graphqlRaw<{ activeGoalsCount: number }>(QUERY, { userId });
    return Number(data?.activeGoalsCount ?? 0);
  } catch (e: any) {
    console.error('[getActiveGoalsCountForUser] GraphQL error:', e?.errors || e?.message || e);
    return 0;
  }
}



export async function loadGoals() {
  try {
    const data = await graphqlRaw<{
      myGoals: Array<{ 
        id: string; 
        title: string; 
        description: string;
        tags: string[];
        deadline: string | null;
        status: string; 
        createdAt: number;
        updatedAt: number;
        answers: Array<{ key: string; answer: string; }>;
      }>;
    }>(`query MyGoals { 
      myGoals { 
        id 
        title 
        description 
        tags
        deadline 
        status 
        createdAt
        updatedAt
        answers {
          key
          answer
        }
      } 
    }`);

    return data?.myGoals ?? [];
  } catch (e: any) {
    console.error('[loadGoals] GraphQL error:', e?.errors || e?.message || e);
    return []; // safe fallback for UI
  }
}

// New CRUD functions for goal management

export interface GoalUpdateInput {
  title?: string;
  description?: string;
  deadline?: number; // Epoch timestamp for updates
  category?: string;
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
    payload.tags = updates.category ? [updates.category] : [];
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
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
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
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
}

export async function getGoal(goalId: string): Promise<GoalResponse> {
  try {
    const QUERY = /* GraphQL */ `
      query GetGoal($goalId: ID!) {
        goal(goalId: $goalId) {
          id
          title
          description
          tags
          deadline
          status
          createdAt
          updatedAt
          answers {
            key
            answer
          }
        }
      }
    `;

    const data = await graphqlRaw<{ goal: GoalResponse }>(QUERY, { goalId });
    if (!data?.goal) {
      throw new Error('Goal not found');
    }
    return data.goal;
  } catch (e: any) {
    console.error('[getGoal] GraphQL error:', e?.errors || e?.message || e);
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
