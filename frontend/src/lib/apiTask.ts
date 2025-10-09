import { getAccessToken, graphQLClient } from './utils';
import {  MY_TASKS } from '@/graphql/queries';
import { graphqlRaw } from './api';
import { logger } from './logger';


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
  const operation = 'createTask';
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
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to create task';
    logger.error('CreateTask API Error', {
      operation,
      status: response.status,
      statusText: response.statusText,
      errorBody,
      url,
      input
    });
    throw new Error(message);
  }

  const data = await response.json();
  return data as TaskResponse;
}

export async function loadTasks(goalId: string): Promise<TaskResponse[]> {
  const operation = 'loadTasks';
  try {
    const QUERY = /* GraphQL */ `
        query myTasks($goalId: ID) {
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

    // Backend may or may not require goalId parameter
    // We'll pass it and handle any filtering issues
    const data = await graphqlRaw<{ myTasks: TaskResponse[] }>(QUERY, goalId ? { goalId } : {});
    const allTasks = ((data as any)?.myTasks ?? (data as any)?.MyTasks) || [];

    // If backend doesn't filter, we may need to filter client-side
    // For now, assume backend handles filtering correctly
    const tasks = allTasks.filter(task => task.goalId === goalId);

    logger.info(`Loaded ${tasks.length} tasks for goal ${goalId}`, {
      operation,
      goalId,
      totalTasks: allTasks.length,
      filteredTasks: tasks.length
    });

    return tasks;

  } catch (e: any) {
    logger.error('GraphQL error in loadTasks', {
        operation,
        goalId,
        error: e?.errors || e?.message || e
    });
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
  const url = baseUrl.replace(/\/$/, '') + `/quests/tasks/${taskId}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: JSON.stringify(updates),
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
  const url = baseUrl.replace(/\/$/, '') + `/quests/tasks/${taskId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to delete task';
    throw new Error(message);
  }
}

