import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  loadQuests, 
  createQuest, 
  startQuest, 
  editQuest, 
  cancelQuest, 
  failQuest, 
  deleteQuest 
} from '../apiQuest';
import type { Quest, QuestCreateInput, QuestUpdateInput, QuestCancelInput } from '@/models/quest';
import { authFetch, graphqlRaw } from '../api';

// Mock the API utilities
vi.mock('../api', () => ({
  authFetch: vi.fn(),
  graphqlRaw: vi.fn()
}));

// Mock the utils (define inside factory to avoid hoist-time refs)
vi.mock('@/lib/utils', () => ({
  getAccessToken: vi.fn(),
  getApiBase: vi.fn(),
}));
import * as utils from '@/lib/utils';

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_GATEWAY_KEY: 'test-api-key',
    VITE_APP_VERSION: '1.0.0',
    VITE_APPSYNC_ENDPOINT: 'https://test-appsync.amazonaws.com/graphql',
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console methods to avoid noise in tests
const mockConsole = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
Object.defineProperty(console, 'info', { value: mockConsole.info });
Object.defineProperty(console, 'error', { value: mockConsole.error });
Object.defineProperty(console, 'warn', { value: mockConsole.warn });

describe('Quest API Integration Tests', () => {
  const mockToken = 'mock-jwt-token';
  // utils is the mocked module imported above
  
  // Get the mocked functions
  const mockAuthFetch = vi.mocked(authFetch);
  const mockGraphqlRaw = vi.mocked(graphqlRaw);
  
  const mockQuest: Quest = {
    id: 'quest-123',
    userId: 'user-123',
    title: 'Integration Test Quest',
    description: 'A quest for integration testing',
    difficulty: 'medium',
    rewardXp: 100,
    status: 'draft',
    category: 'Health',
    tags: ['test', 'integration'],
    privacy: 'private',
    deadline: Date.now() + 86400000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    kind: 'linked',
    linkedGoalIds: [],
    linkedTaskIds: [],
    dependsOnQuestIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFetch.mockClear();
    mockGraphqlRaw.mockClear();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ access_token: mockToken }));
    
    // Reset mock implementations
    utils.getAccessToken.mockReturnValue(mockToken);
    utils.getApiBase.mockReturnValue('https://api.example.com/v1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End API Calls', () => {
    it('should perform complete quest lifecycle', async () => {
      // Mock successful responses for all operations
      mockGraphqlRaw.mockResolvedValueOnce({
        data: { myQuests: [] }
      });
      
      mockAuthFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockQuest, status: 'active' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockQuest, title: 'Updated Quest' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockQuest, status: 'cancelled' }),
        });

      // 1. Load quests (empty initially)
      const initialQuests = await loadQuests();
      expect(initialQuests).toEqual([]);

      // 2. Create quest
      const questCreateInput: QuestCreateInput = {
        title: 'Integration Test Quest',
        category: 'Health',
        difficulty: 'medium',
        rewardXp: 100,
        description: 'A quest for integration testing',
        tags: ['test', 'integration'],
        privacy: 'private',
        kind: 'linked',
      };

      const createdQuest = await createQuest(questCreateInput);
      expect(createdQuest).toEqual(mockQuest);

      // 3. Start quest
      const startedQuest = await startQuest(createdQuest.id);
      expect(startedQuest.status).toBe('active');

      // 4. Edit quest
      const questUpdateInput: QuestUpdateInput = {
        title: 'Updated Quest',
      };

      const editedQuest = await editQuest(createdQuest.id, questUpdateInput);
      expect(editedQuest.title).toBe('Updated Quest');

      // 5. Cancel quest
      const questCancelInput: QuestCancelInput = {
        reason: 'Integration test completed',
      };

      const cancelledQuest = await cancelQuest(createdQuest.id, questCancelInput);
      expect(cancelledQuest.status).toBe('cancelled');
    });

    it('should handle quest failure scenario', async () => {
      mockAuthFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockQuest, status: 'active' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockQuest, status: 'failed' }),
        });

      // Start quest
      const startedQuest = await startQuest('quest-123');
      expect(startedQuest.status).toBe('active');

      // Fail quest
      const failedQuest = await failQuest('quest-123');
      expect(failedQuest.status).toBe('failed');
    });

    it('should handle quest deletion', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Quest deleted successfully' }),
      });

      await deleteQuest('quest-123');

      // Verify the delete request was made
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/quests/quests/quest-123'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'x-api-key': 'test-api-key',
          }),
        })
      );
    });
  });

  describe('Authentication Flow', () => {
    it('should handle missing authentication token', async () => {
      mockGetAccessToken.mockReturnValueOnce(null);
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ detail: 'You must be signed in to create a quest.' }),
      });

      await expect(createQuest({
        title: 'Test Quest',
        category: 'Health',
        difficulty: 'medium',
        rewardXp: 100,
        description: 'A test quest',
        tags: ['test'],
        privacy: 'private',
        kind: 'linked'
      })).rejects.toThrow('You must be signed in to create a quest.');
    });

    it('should handle invalid authentication token', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ access_token: 'invalid-token' }));

      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ detail: 'Invalid token' }),
      });

      await expect(createQuest({
        title: 'Test Quest',
        category: 'Health',
      })).rejects.toThrow('You must be signed in to perform this action');
    });
  });

  describe('Network Error Recovery', () => {
    it('should retry on network failures', async () => {
      // First two calls fail with network error, third succeeds
      mockAuthFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuest),
        });

      const result = await createQuest({
        title: 'Test Quest',
        category: 'Health',
      });

      expect(result).toEqual(mockQuest);
      expect(mockAuthFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on authentication errors', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('You must be signed in'));

      await expect(createQuest({
        title: 'Test Quest',
        category: 'Health',
      })).rejects.toThrow('You must be signed in');

      expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on validation errors', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('Invalid quest data'));

      await expect(createQuest({
        title: 'Test Quest',
        category: 'Health',
      })).rejects.toThrow('Invalid quest data');

      expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle server errors gracefully', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ detail: 'Server error' }),
      });

      await expect(createQuest({
        title: 'Test Quest',
        category: 'Health',
      })).rejects.toThrow('Server error. Please try again later');
    });

    it('should handle rate limiting', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ detail: 'Rate limit exceeded' }),
      });

      await expect(createQuest({
        title: 'Test Quest',
        category: 'Health',
      })).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle malformed JSON responses', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(createQuest({
        title: 'Test Quest',
        category: 'Health',
      })).rejects.toThrow();
    });
  });

  describe('Request Headers and Metadata', () => {
    it('should include all required headers', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      });

      await createQuest({
        title: 'Test Quest',
        category: 'Health',
      });

      const call = mockAuthFetch.mock.calls[0];
      const [url, options] = call;

      expect(url).toContain('/quests/createQuest');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
          'x-api-key': 'test-api-key',
          'x-request-id': expect.any(String),
          'x-client-version': '1.0.0',
        })
      );
    });

    it('should generate unique request IDs', async () => {
      mockAuthFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuest),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuest),
        });

      await createQuest({
        title: 'Test Quest 1',
        category: 'Health',
      });

      await createQuest({
        title: 'Test Quest 2',
        category: 'Work',
      });

      const call1 = mockAuthFetch.mock.calls[0];
      const call2 = mockAuthFetch.mock.calls[1];

      expect(call1[1].headers['x-request-id']).not.toBe(call2[1].headers['x-request-id']);
    });
  });

  describe('GraphQL Integration', () => {
    it('should call GraphQL endpoint with correct parameters', async () => {
      mockGraphqlRaw.mockResolvedValueOnce({
        data: { myQuests: [mockQuest] }
      });

      await loadQuests('goal-123');

      expect(mockGraphqlRaw).toHaveBeenCalledWith(
        expect.stringContaining('query MyQuests'),
        { goalId: 'goal-123' }
      );
    });

    it('should handle GraphQL errors', async () => {
      mockGraphqlRaw.mockRejectedValueOnce(new Error('GraphQL error'));

      await expect(loadQuests()).rejects.toThrow('GraphQL error');
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete operations within reasonable time', async () => {
      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      });

      const startTime = Date.now();
      await createQuest({
        title: 'Performance Test Quest',
        category: 'Health',
      });
      const endTime = Date.now();

      // Should complete within 1 second (allowing for retry delays)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      });

      const promises = Array.from({ length: 5 }, (_, i) =>
        createQuest({
          title: `Concurrent Quest ${i}`,
          category: 'Health',
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(mockAuthFetch).toHaveBeenCalledTimes(5);
    });
  });
});
