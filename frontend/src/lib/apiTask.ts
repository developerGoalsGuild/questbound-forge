import { getAccessToken } from './utils';

interface CreateTaskInput {
  goalId: string;
  title: string;
  dueAt: number; // epoch seconds
  tags: string[];
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
