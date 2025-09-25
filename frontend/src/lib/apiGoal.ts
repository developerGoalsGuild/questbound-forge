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
      myGoals: Array<{ id: string; title: string; status: string; deadline: string | null }>;
    }>(`query MyGoals { myGoals { id title description status deadline } }`);

    return data?.myGoals ?? [];
  } catch (e: any) {
    console.error('[loadGoals] GraphQL error:', e?.errors || e?.message || e);
    return []; // safe fallback for UI
  }
}
