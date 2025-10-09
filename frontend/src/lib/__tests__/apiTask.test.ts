/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createTask, loadTasks } from '../apiTask';

// Mock logger before all other imports
const mockLoggerError = vi.fn();
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: mockLoggerError,
  },
}));

// Mock dependencies
vi.mock('@/lib/utils', () => ({
  getAccessToken: vi.fn(),
  graphQLClient: {}
}));

vi.mock('@/graphql/queries', () => ({
  MY_TASKS: 'myTasks query'
}));

vi.mock('@/lib/api', () => ({
  graphqlRaw: vi.fn()
}));

import * as utils from '@/lib/utils';
import * as api from '@/lib/api';

describe('createTask', () => {
  const mockUtils = vi.mocked(utils);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUtils.getAccessToken.mockReturnValue('mock-token');
    // Mock environment variable
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const validInput = {
    goalId: 'goal-123',
    title: 'Test Task',
    dueAt: 1640995200, // 2022-01-01 00:00:00 UTC
    tags: ['urgent', 'important'],
    status: 'active'
  };

  test('creates task successfully', async () => {
    const mockResponse = {
      id: 'task-123',
      goalId: 'goal-123',
      title: 'Test Task',
      dueAt: 1640995200,
      status: 'active',
      createdAt: 1640995200,
      updatedAt: 1640995200,
      tags: ['urgent', 'important']
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await createTask(validInput);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/quests/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
        'x-api-key': expect.any(String),
      },
      body: JSON.stringify(validInput)
    });
  });

  test('throws error when user is not authenticated', async () => {
    mockUtils.getAccessToken.mockReturnValue(null);

    await expect(createTask(validInput)).rejects.toThrow('User is not authenticated');
  });

  test('handles API error response with detail', async () => {
    const errorDetail = 'Invalid goal ID';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ detail: errorDetail })
    });

    await expect(createTask(validInput)).rejects.toThrow(errorDetail);
  });

  test('handles API error response without detail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Invalid JSON'))
    });

    await expect(createTask(validInput)).rejects.toThrow('Internal Server Error');
  });

  test('handles API error with fallback message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: '',
      json: () => Promise.reject(new Error('Invalid JSON'))
    });

    await expect(createTask(validInput)).rejects.toThrow('Failed to create task');
  });

  test('handles network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(createTask(validInput)).rejects.toThrow('Network error');
  });

  test('uses default API base URL when env var not set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'task-123' })
    });

    await createTask(validInput);

    expect(global.fetch).toHaveBeenCalledWith('/quests/createTask', expect.any(Object));
  });

  test('removes trailing slash from API base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'task-123' })
    });

    await createTask(validInput);

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/quests/createTask', expect.any(Object));
  });
});

describe('loadTasks', () => {
  const mockGraphQL = vi.mocked(api);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads tasks successfully', async () => {
    const mockTask = {
      id: 'task-123',
      goalId: 'goal-123',
      title: 'Test Task',
      dueAt: 1640995200,
      tags: ['urgent'],
      status: 'active',
      createdAt: 1640995200,
      updatedAt: 1640995200
    };

    mockGraphQL.graphqlRaw.mockResolvedValue({ MyTasks: [mockTask] });

    const result = await loadTasks('goal-123');

    expect(result).toEqual([mockTask]);
    expect(mockGraphQL.graphqlRaw).toHaveBeenCalledWith(
      expect.stringContaining('query myTasks'),
      { goalId: 'goal-123' } // goalId parameter sent to GraphQL when provided
    );
  });

  test('returns null for null response', async () => {
    mockGraphQL.graphqlRaw.mockResolvedValue(null);

    const result = await loadTasks('goal-123');

    expect(result).toBeNull();
  });

  test('returns null on GraphQL error', async () => {
    mockGraphQL.graphqlRaw.mockRejectedValue(new Error('GraphQL error'));

    const result = await loadTasks('goal-123');

    expect(result).toBeNull();
    expect(mockLoggerError).toHaveBeenCalledWith(
      'GraphQL error in loadTasks',
      expect.objectContaining({
        goalId: 'goal-123',
        error: expect.any(Error),
      })
    );
  });

  test('handles GraphQL errors with details', async () => {
    const graphQLError = { errors: [{ message: 'Goal not found' }] };
    mockGraphQL.graphqlRaw.mockRejectedValue(graphQLError);

    const result = await loadTasks('goal-123');

    expect(result).toBeNull();
    expect(mockLoggerError).toHaveBeenCalledWith(
      'GraphQL error in loadTasks',
      expect.objectContaining({
        goalId: 'goal-123',
        error: graphQLError,
      })
    );
  });

  test('handles GraphQL errors with message', async () => {
    const graphQLError = { message: 'Network timeout' };
    mockGraphQL.graphqlRaw.mockRejectedValue(graphQLError);

    const result = await loadTasks('goal-123');

    expect(result).toBeNull();
    expect(mockLoggerError).toHaveBeenCalledWith(
      'GraphQL error in loadTasks',
      expect.objectContaining({
        goalId: 'goal-123',
        error: graphQLError,
      })
    );
  });
});
