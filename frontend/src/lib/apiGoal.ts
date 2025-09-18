import { nlpQuestionOrder, NLPAnswers } from '@/pages/goals/questions';
import { getAccessToken } from '@/lib/utils';
import { graphQLClient } from '@/lib/utils';
import { ACTIVE_GOALS_COUNT } from '@/graphql/queries';



export interface GoalInput {
  title: string;
  description?: string;
  deadline: number; // timestamp in seconds
  category?: string;
  nlpAnswers: NLPAnswers;
}

// GraphQL mutation string for creating a goal
const CREATE_GOAL_MUTATION = `
  mutation createGoal($input: GoalInput!) {
    createGoal(input: $input) {
      id
      userId
      title
      description
      tags
      deadline
      status
      createdAt
      updatedAt
      answers {              # <— NEW
        key
        answer
      }
    }
  }
`;


interface CreateGoalInput {
  title: string;
  description?: string;
  deadline: number;
  tags: string[];
  answers: { [key: string]: string };
}


export async function createGoal(input: GoalInput) {
  const endpoint = import.meta.env.VITE_APPSYNC_ENDPOINT;
  if (!endpoint) throw new Error('AppSync endpoint not configured');

  // Prepare tags array from category string
  const tags = input.category ? [input.category] : [];

  // Prepare answers object with all keys from nlpQuestionOrder, filling missing with empty string
  const answers: { [key: string]: string } = {};
  nlpQuestionOrder.forEach((key) => {
    answers[key] = input.nlpAnswers[key] || '';
  });

  // Construct input object for mutation
  const variables = {
    input: {
      title: input.title,
      description: input.description,
      deadline: input.deadline,
      tags,
      answers,
    } as CreateGoalInput,
  };

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `${token}`;
  }

  // Send POST request to AppSync GraphQL endpoint
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: CREATE_GOAL_MUTATION,
      variables,
      operationName: 'createGoal',
    }),
  });

  const text = await res.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {}

  if (!res.ok || body.errors) {
    const msg = body.errors?.map((e: any) => e.message).join(' | ') || text || 'Goal creation failed';
    console.error('Error creating goal:', msg);
    throw new Error(msg);
  }

  return body.data.createGoal;
}



// ---- Goals / Quests ----

export async function getActiveGoalsCountForUser(userId: string): Promise<number> {
  try {
    const { data, errors } = await graphQLClient().graphql({
      query: ACTIVE_GOALS_COUNT as any,
      variables: { userId },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(' | '));
    return Number((data as any)?.activeGoalsCount ?? 0);
  } catch (e) {
    return 0;
  }
}

export async function loadGoals(MY_GOALS: any) {
  try {
    const { data, errors } = await graphQLClient().graphql({ query: MY_GOALS as any });
    if (errors?.length) throw new Error(errors.map((e: any) => e.message).join(' | '));
    return data.myGoals || [];
  } catch (e) {
    // noop UI fallback
  }
}
