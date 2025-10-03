/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createGoal, 
  buildTags,
  assertValidDeadline,
  getActiveGoalsCountForUser,
  loadGoals,
  buildAnswers
} from '../apiGoal';

vi.unmock('@/lib/apiGoal');

// Mock dependencies
vi.mock('@/pages/goals/questions', () => ({
  nlpQuestionOrder: ['question1', 'question2', 'question3'],
  NLPAnswers: {}
}));

vi.mock('@/lib/utils', () => ({
  getAccessToken: vi.fn(),
  getApiBase: vi.fn(),
  graphQLClient: {}
}));

vi.mock('@/graphql/queries', () => ({
  ACTIVE_GOALS_COUNT: 'activeGoalsCount query'
}));

vi.mock('@/lib/api', () => ({
  graphqlRaw: vi.fn()
}));

import * as utils from '@/lib/utils';
import * as api from '@/lib/api';
import * as mockGraphQL from '@/lib/graphql';

describe('buildAnswers', () => {
  test('builds answers array from NLP answers', () => {
    const nlpAnswers = {
      question1: 'Answer 1',
      question2: 'Answer 2',
      question3: 'Answer 3'
    };

    const result = buildAnswers(nlpAnswers);

    expect(result).toEqual([
      { key: 'question1', answer: 'Answer 1' },
      { key: 'question2', answer: 'Answer 2' },
      { key: 'question3', answer: 'Answer 3' }
    ]);
  });

  test('handles missing answers with empty strings', () => {
    const nlpAnswers = {
      question1: 'Answer 1',
      // question2 missing
      question3: 'Answer 3'
    };

    const result = buildAnswers(nlpAnswers);

    expect(result).toEqual([
      { key: 'question1', answer: 'Answer 1' },
      { key: 'question2', answer: '' },
      { key: 'question3', answer: 'Answer 3' }
    ]);
  });

  test('trims whitespace from answers', () => {
    const nlpAnswers = {
      question1: '  Answer 1  ',
      question2: 'Answer 2',
      question3: 'Answer 3'
    };

    const result = buildAnswers(nlpAnswers);

    expect(result).toEqual([
      { key: 'question1', answer: 'Answer 1' },
      { key: 'question2', answer: 'Answer 2' },
      { key: 'question3', answer: 'Answer 3' }
    ]);
  });
});

describe('buildTags', () => {
  test('returns empty array for undefined category', () => {
    expect(buildTags(undefined)).toEqual([]);
  });

  test('returns array with trimmed category', () => {
    expect(buildTags('  Learning  ')).toEqual(['Learning']);
  });

  test('returns empty array for empty category', () => {
    expect(buildTags('')).toEqual([]);
    expect(buildTags('   ')).toEqual([]);
  });
});

describe('assertValidDeadline', () => {
  test('accepts valid YYYY-MM-DD format', () => {
    expect(assertValidDeadline('2024-12-31')).toBe('2024-12-31');
    expect(assertValidDeadline('2023-01-01')).toBe('2023-01-01');
  });

  test('trims whitespace', () => {
    expect(assertValidDeadline('  2024-12-31  ')).toBe('2024-12-31');
  });

  test('rejects invalid format', () => {
    expect(() => assertValidDeadline('12-31-2024')).toThrow('Deadline must follow YYYY-MM-DD format.');
    expect(() => assertValidDeadline('2024/12/31')).toThrow('Deadline must follow YYYY-MM-DD format.');
    expect(() => assertValidDeadline('2024-1-31')).toThrow('Deadline must follow YYYY-MM-DD format.');
  });

  test('rejects invalid dates', () => {
    expect(() => assertValidDeadline('2024-02-30')).toThrow('Deadline must be a valid calendar date.');
    expect(() => assertValidDeadline('2024-13-31')).toThrow('Deadline must be a valid calendar date.');
  });

  test('handles null/undefined input', () => {
    expect(() => assertValidDeadline(null as any)).toThrow('Deadline must follow YYYY-MM-DD format.');
    expect(() => assertValidDeadline(undefined as any)).toThrow('Deadline must follow YYYY-MM-DD format.');
  });
});

describe('createGoal', () => {
  const mockUtils = vi.mocked(utils);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUtils.getAccessToken.mockReturnValue('mock-token');
    mockUtils.getApiBase.mockReturnValue('https://api.example.com');
  });

  const validInput = {
    title: 'Test Goal',
    description: 'Test description',
    deadline: '2024-12-31',
    category: 'Learning',
    nlpAnswers: {
      question1: 'Answer 1',
      question2: 'Answer 2',
      question3: 'Answer 3'
    }
  };

  test('creates goal successfully', async () => {
    const mockResponse = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Test Goal',
      description: 'Test description',
      tags: ['Learning'],
      answers: [
        { key: 'question1', answer: 'Answer 1' },
        { key: 'question2', answer: 'Answer 2' },
        { key: 'question3', answer: 'Answer 3' }
      ],
      deadline: '2024-12-31',
      status: 'active',
      createdAt: 1234567890,
      updatedAt: 1234567890
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    });

    const result = await createGoal(validInput);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/quests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token'
      },
      body: JSON.stringify({
        title: 'Test Goal',
        description: 'Test description',
        category: 'Learning',
        deadline: '2024-12-31',
        tags: ['Learning'],
        answers: [
          { key: 'question1', answer: 'Answer 1' },
          { key: 'question2', answer: 'Answer 2' },
          { key: 'question3', answer: 'Answer 3' }
        ]
      })
    });
  });

  test('throws error when not signed in', async () => {
    mockUtils.getAccessToken.mockReturnValue(null);

    await expect(createGoal(validInput)).rejects.toThrow('You must be signed in to create a goal.');
  });

  test('throws error for invalid deadline', async () => {
    const invalidInput = { ...validInput, deadline: 'invalid-date' };

    await expect(createGoal(invalidInput)).rejects.toThrow('Deadline must follow YYYY-MM-DD format.');
  });

  test('handles API error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Server error')
    });

    await expect(createGoal(validInput)).rejects.toThrow('Server error');
  });

  test('handles API error with detail', async () => {
    const errorDetail = 'Validation failed';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(JSON.stringify({ detail: errorDetail }))
    });

    await expect(createGoal(validInput)).rejects.toThrow(errorDetail);
  });

  test('handles malformed JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('not json')
    });

    await expect(createGoal(validInput)).rejects.toThrow('not json');
  });

  test('handles network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(createGoal(validInput)).rejects.toThrow('Network error');
  });
});

describe('getActiveGoalsCountForUser', () => {
  const mockGraphQL = vi.mocked(api);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns active goals count successfully', async () => {
    mockGraphQL.graphqlRaw.mockResolvedValue({ activeGoalsCount: 5 });

    const result = await getActiveGoalsCountForUser('user-123');

    expect(result).toBe(5);
    expect(mockGraphQL.graphqlRaw).toHaveBeenCalledWith(
      expect.stringContaining('query ActiveGoalsCount'),
      { userId: 'user-123' }
    );
  });

  test('returns 0 for null/undefined response', async () => {
    mockGraphQL.graphqlRaw.mockResolvedValue(null);

    const result = await getActiveGoalsCountForUser('user-123');

    expect(result).toBe(0);
  });

  test('returns 0 on GraphQL error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGraphQL.graphqlRaw.mockRejectedValue(new Error('GraphQL error'));

    const result = await getActiveGoalsCountForUser('user-123');

    expect(result).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[getActiveGoalsCountForUser] GraphQL error:',
      'GraphQL error'
    );

    consoleSpy.mockRestore();
  });

  test('handles GraphQL errors with details', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const graphQLError = { errors: [{ message: 'Field not found' }] };
    mockGraphQL.graphqlRaw.mockRejectedValue(graphQLError);

    const result = await getActiveGoalsCountForUser('user-123');

    expect(result).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[getActiveGoalsCountForUser] GraphQL error:',
      graphQLError.errors
    );

    consoleSpy.mockRestore();
  });
});

describe('loadGoals', () => {
  const mockGraphQL = vi.mocked(api);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads goals successfully', async () => {
    const mockGoals = [
      { id: '1', title: 'Goal 1', status: 'active', deadline: '2024-12-31', milestones: [] },
      { id: '2', title: 'Goal 2', status: 'completed', deadline: null, milestones: [] }
    ];

    mockGraphQL.graphqlRaw.mockResolvedValue({ myGoals: mockGoals });

    const result = await loadGoals();

    expect(result).toEqual(mockGoals);
    expect(mockGraphQL.graphqlRaw).toHaveBeenCalledWith(
      expect.stringContaining('query MyGoals')
    );
  });

  test('returns empty array for null response', async () => {
    mockGraphQL.graphqlRaw.mockResolvedValue(null);

    const result = await loadGoals();

    expect(result).toEqual([]);
  });

  test('returns empty array on GraphQL error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGraphQL.graphqlRaw.mockRejectedValue(new Error('GraphQL error'));

    const result = await loadGoals();

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[loadGoals] GraphQL error:',
      'GraphQL error'
    );

    consoleSpy.mockRestore();
  });

  test('handles GraphQL errors with details', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const graphQLError = { errors: [{ message: 'Authentication failed' }] };
    mockGraphQL.graphqlRaw.mockRejectedValue(graphQLError);

    const result = await loadGoals();

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[loadGoals] GraphQL error:',
      graphQLError.errors
    );

    consoleSpy.mockRestore();
  });
});
