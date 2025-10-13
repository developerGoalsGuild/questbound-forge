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

export interface TaskResponse {
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

export async function loadTasks(goalId: string): Promise<TaskResponse[] | null> {
  const operation = 'loadTasks';
  
  // Validate input
  if (!goalId || typeof goalId !== 'string') {
    logger.warn('Invalid goalId provided to loadTasks', { operation, goalId });
    return null;
  }

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

    // Pass goalId as required parameter
    const data = await graphqlRaw<{ myTasks: TaskResponse[] }>(QUERY, { goalId });
    if (!data) {
      return null;
    }
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
      error: e?.errors || e?.message || e,
      errorType: e?.name || 'Unknown'
    });
    return null;
  }
}

/**
 * Mock task data for development/testing when GraphQL fails
 */
export function getMockTasks(goalId: string): TaskResponse[] {
  return [
    {
      id: `mock-task-1-${goalId}`,
      goalId,
      title: 'Sample Task 1',
      dueAt: Date.now() + 86400000, // 1 day from now
      status: 'pending',
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now() - 3600000, // 1 hour ago
      tags: ['sample', 'mock']
    },
    {
      id: `mock-task-2-${goalId}`,
      goalId,
      title: 'Sample Task 2',
      dueAt: Date.now() + 172800000, // 2 days from now
      status: 'completed',
      createdAt: Date.now() - 172800000, // 2 days ago
      updatedAt: Date.now() - 7200000, // 2 hours ago
      tags: ['sample', 'mock', 'completed']
    }
  ];
}

/**
 * Updates an existing task.
 * Requires authenticated user token.
 */
export async function updateTask(taskId: string, updates: Partial<CreateTaskInput>): Promise<TaskResponse> {
  const operation = 'updateTask';
  const token = getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  logger.info('Task update started', {
    operation,
    taskId,
    updates,
    timestamp: new Date().toISOString()
  });

  // Check if this is a task completion
  if (updates.status === 'completed' || updates.status === 'done') {
    logger.info('Task completion detected', {
      operation,
      taskId,
      goalId: updates.goalId,
      status: updates.status,
      timestamp: new Date().toISOString()
    });
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseUrl.replace(/\/$/, '') + `/quests/tasks/${taskId}`;

  logger.info('Task update API call', {
    operation,
    taskId,
    url,
    method: 'PUT',
    hasToken: !!token,
    hasApiKey: !!import.meta.env.VITE_API_GATEWAY_KEY
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: JSON.stringify(updates),
  });

  logger.info('Task update API response', {
    operation,
    taskId,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to update task';
    
    logger.error('Task update failed', {
      operation,
      taskId,
      status: response.status,
      statusText: response.statusText,
      errorBody,
      message
    });
    
    throw new Error(message);
  }

  const data = await response.json();
  
  logger.info('Task update successful', {
    operation,
    taskId,
    updatedTask: data,
    isCompleted: data.status === 'completed' || data.status === 'done'
  });

  // If task was completed, trigger quest completion check
  if (data.status === 'completed' || data.status === 'done') {
    logger.info('Task completed, triggering quest completion check', {
      operation,
      taskId,
      goalId: updates.goalId
    });
    
    try {
      await triggerQuestCompletion(taskId, updates.goalId || '');
      logger.info('Quest completion check completed successfully', {
        operation,
        taskId,
        goalId: updates.goalId
      });
    } catch (questError) {
      logger.error('Quest completion check failed', {
        operation,
        taskId,
        goalId: updates.goalId,
        error: questError
      });
      // Don't throw here - task update was successful, quest completion is secondary
    }
  }

  return data as TaskResponse;
}

/**
 * Triggers quest auto-completion check when a task is completed.
 * This should be called by the goals service, but we can also call it from frontend for testing.
 */
export async function triggerQuestCompletion(taskId: string, goalId: string): Promise<void> {
  const operation = 'triggerQuestCompletion';
  const token = getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  logger.info('Quest completion check triggered', {
    operation,
    taskId,
    goalId,
    timestamp: new Date().toISOString()
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseUrl.replace(/\/$/, '') + '/quests/check-completion';

  logger.info('Quest completion API call', {
    operation,
    taskId,
    goalId,
    url,
    method: 'POST',
    hasToken: !!token,
    hasApiKey: !!import.meta.env.VITE_API_GATEWAY_KEY
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: JSON.stringify({
      completed_task_id: taskId,
      completed_goal_id: goalId
    }),
  });

  logger.info('Quest completion API response', {
    operation,
    taskId,
    goalId,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to check quest completion';

    logger.error('Quest completion check failed', {
      operation,
      taskId,
      goalId,
      status: response.status,
      statusText: response.statusText,
      errorBody,
      message
    });

    throw new Error(message);
  }

  const data = await response.json();

  logger.info('Quest completion check successful', {
    operation,
    taskId,
    goalId,
    result: data,
    completedQuests: data.completed_quests,
    errors: data.errors
  });

  return data;
}

/**
 * Manually trigger quest completion check for all active quests
 * This is useful for debugging and manual quest completion checks
 */
export async function triggerManualQuestCompletionCheck(): Promise<{ completed_quests: string[], errors: string[] }> {
  const operation = 'triggerManualQuestCompletionCheck';
  const token = getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  logger.info('Manual quest completion check triggered', {
    operation,
    timestamp: new Date().toISOString()
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseUrl.replace(/\/$/, '') + '/quests/check-completion';

  logger.info('Manual quest completion API call', {
    operation,
    url,
    method: 'POST',
    hasToken: !!token,
    hasApiKey: !!import.meta.env.VITE_API_GATEWAY_KEY
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({
        completed_task_id: '',
        completed_goal_id: ''
      }),
    });

    logger.info('Manual quest completion API response', {
      operation,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to check quest completion';

      logger.error('Manual quest completion check failed', {
        operation,
        status: response.status,
        statusText: response.statusText,
        errorBody,
        message
      });

      throw new Error(message);
    }

    const data = await response.json();

    logger.info('Manual quest completion check successful', {
      operation,
      result: data,
      completedQuests: data.completed_quests,
      errors: data.errors
    });

    return data;
  } catch (error) {
    logger.error('Manual quest completion check error', {
      operation,
      error
    });
    throw error;
  }
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

