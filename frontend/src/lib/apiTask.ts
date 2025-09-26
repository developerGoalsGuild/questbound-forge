import { getAccessToken, graphQLClient } from './utils';
import {  MY_TASKS } from '@/graphql/queries';
import { graphqlRaw } from './api';


interface CreateTaskInput {
  goalId: string;
  title: string;
  dueAt: number; // epoch seconds
  tags: string[];
  status: string;
}

interface TaskResponse {
  id: string;
  goalId: string;
  title: string;
  dueAt: number;
  status: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

/**
 * Calls the API Gateway endpoint to create a new task.
 * Requires authenticated user token.
 */
export async function createTask(input: CreateTaskInput): Promise<TaskResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseUrl.replace(/\/$/, '') + '/quests/createTask';

  const response = await fetch(url, {                                         
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to create task';
    throw new Error(message);
  }

  const data = await response.json();
  return data as TaskResponse;
}

export async function loadTasks(goalId: string): Promise<TaskResponse[]> {
  try {
    const QUERY = /* GraphQL */ `
        query myTasks($goalId: ID!) {
          myTasks(goalId: $goalId) {
            id
            goalId
            title
            dueAt
            tags
            status
            createdAt
            updatedAt
          }
        }
      `;

    const data = await graphqlRaw<{ myTasks: TaskResponse[] }>(QUERY, { goalId });
    return data.myTasks;

  } catch (e: any) {
    console.error('[loadTasks] GraphQL error:', e?.errors || e?.message || e);
    return null;
  }
}

/**
 * Updates an existing task.
 * Requires authenticated user token.
 */
export async function updateTask(taskId: string, updates: Partial<CreateTaskInput>): Promise<TaskResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseUrl.replace(/\/$/, '') + '/quests/updateTask';

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: taskId, ...updates }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to update task';
    throw new Error(message);
  }

  const data = await response.json();
  return data as TaskResponse;
}

/**
 * Deletes a task by ID.
 * Requires authenticated user token.
 */
export async function deleteTask(taskId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseUrl.replace(/\/$/, '') + '/quests/deleteTask';

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: taskId }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to delete task';
    throw new Error(message);
  }
}

