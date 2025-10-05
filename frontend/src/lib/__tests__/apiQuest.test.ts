import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  loadQuests, 
  createQuest, 
  startQuest, 
  editQuest, 
  cancelQuest, 
  failQuest, 
  deleteQuest,
  type QuestApiError 
} from '../apiQuest';
import type { Quest, QuestCreateInput, QuestUpdateInput, QuestCancelInput } from '@/models/quest';

// Mock dependencies
vi.mock('../api', () => ({
  authFetch: vi.fn(),
  graphqlRaw: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  getAccessToken: vi.fn(),
  getApiBase: vi.fn(),
}));

vi.mock('@/models/quest', () => ({
  QuestCreateInputSchema: {
    parse: vi.fn(),
  },
  QuestUpdateInputSchema: {
    parse: vi.fn(),
  },
  QuestCancelInputSchema: {
    parse: vi.fn(),
  },
}));

import { authFetch, graphqlRaw } from '../api';
import { getAccessToken } from '@/lib/utils';
import { QuestCreateInputSchema, QuestUpdateInputSchema, QuestCancelInputSchema } from '@/models/quest';

// Mock data
const mockQuest: Quest = {
  id: 'quest-123',
  userId: 'user-123',
  title: 'Test Quest',
  description: 'A test quest',
  difficulty: 'medium',
  rewardXp: 100,
  status: 'draft',
  category: 'Health',
  tags: ['test'],
  privacy: 'private',
  deadline: Date.now() + 86400000,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  kind: 'linked',
  linkedGoalIds: [],
  linkedTaskIds: [],
  dependsOnQuestIds: [],
};

const mockQuestCreateInput: QuestCreateInput = {
  title: 'Test Quest',
  category: 'Health',
  difficulty: 'medium',
  rewardXp: 100,
  description: 'A test quest',
  tags: ['test'],
  privacy: 'private',
  kind: 'linked',
};

const mockQuestUpdateInput: QuestUpdateInput = {
  title: 'Updated Quest',
  description: 'Updated description',
};

const mockQuestCancelInput: QuestCancelInput = {
  reason: 'No longer needed',
};

describe('Quest API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue('mock-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadQuests', () => {
    it('should load quests successfully', async () => {
      const mockQuests = [mockQuest];
      vi.mocked(graphqlRaw).mockResolvedValue({ myQuests: mockQuests });

      const result = await loadQuests();

      expect(result).toEqual(mockQuests);
      expect(graphqlRaw).toHaveBeenCalledWith(
        expect.stringContaining('query MyQuests'),
        { goalId: undefined }
      );
    });

    it('should load quests with goalId filter', async () => {
      const mockQuests = [mockQuest];
      vi.mocked(graphqlRaw).mockResolvedValue({ myQuests: mockQuests });

      const result = await loadQuests('goal-123');

      expect(result).toEqual(mockQuests);
      expect(graphqlRaw).toHaveBeenCalledWith(
        expect.stringContaining('query MyQuests'),
        { goalId: 'goal-123' }
      );
    });

    it('should handle GraphQL errors', async () => {
      const error = new Error('GraphQL error');
      vi.mocked(graphqlRaw).mockRejectedValue(error);

      await expect(loadQuests()).rejects.toThrow('GraphQL error');
    });

    it('should return empty array when no quests found', async () => {
      vi.mocked(graphqlRaw).mockResolvedValue({ myQuests: [] });

      const result = await loadQuests();

      expect(result).toEqual([]);
    });
  });

  describe('createQuest', () => {
    it('should create quest successfully', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      } as Response);

      const result = await createQuest(mockQuestCreateInput);

      expect(result).toEqual(mockQuest);
      expect(QuestCreateInputSchema.parse).toHaveBeenCalledWith(mockQuestCreateInput);
      expect(authFetch).toHaveBeenCalledWith('/quests/createQuest', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          'x-api-key': '',
          'x-request-id': expect.any(String),
          'x-client-version': expect.any(String),
        }),
        body: JSON.stringify(mockQuestCreateInput),
      });
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(getAccessToken).mockReturnValue(null);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow(
        'You must be signed in to create a quest.'
      );
    });

    it('should throw error on input validation failure', async () => {
      const validationError = new Error('Invalid input');
      vi.mocked(QuestCreateInputSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow('Invalid quest data');
    });

    it('should throw error on API failure', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ detail: 'Invalid data' }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow('Invalid data');
    });

    it('should retry on network errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      
      // First call fails, second succeeds
      vi.mocked(authFetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuest),
        } as Response);

      const result = await createQuest(mockQuestCreateInput);

      expect(result).toEqual(mockQuest);
      expect(authFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('startQuest', () => {
    it('should start quest successfully', async () => {
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      } as Response);

      const result = await startQuest('quest-123');

      expect(result).toEqual(mockQuest);
      expect(authFetch).toHaveBeenCalledWith('/quests/quests/quest-123/start', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          'x-api-key': '',
          'x-request-id': expect.any(String),
          'x-client-version': expect.any(String),
        }),
      });
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(getAccessToken).mockReturnValue(null);

      await expect(startQuest('quest-123')).rejects.toThrow(
        'You must be signed in to start a quest.'
      );
    });
  });

  describe('editQuest', () => {
    it('should edit quest successfully', async () => {
      vi.mocked(QuestUpdateInputSchema.parse).mockReturnValue(mockQuestUpdateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      } as Response);

      const result = await editQuest('quest-123', mockQuestUpdateInput);

      expect(result).toEqual(mockQuest);
      expect(QuestUpdateInputSchema.parse).toHaveBeenCalledWith(mockQuestUpdateInput);
      expect(authFetch).toHaveBeenCalledWith('/quests/quests/quest-123', {
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          'x-api-key': '',
          'x-request-id': expect.any(String),
          'x-client-version': expect.any(String),
        }),
        body: JSON.stringify(mockQuestUpdateInput),
      });
    });

    it('should throw error on input validation failure', async () => {
      const validationError = new Error('Invalid update data');
      vi.mocked(QuestUpdateInputSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      await expect(editQuest('quest-123', mockQuestUpdateInput)).rejects.toThrow(
        'Invalid quest update data'
      );
    });
  });

  describe('cancelQuest', () => {
    it('should cancel quest successfully', async () => {
      vi.mocked(QuestCancelInputSchema.parse).mockReturnValue(mockQuestCancelInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      } as Response);

      const result = await cancelQuest('quest-123', mockQuestCancelInput);

      expect(result).toEqual(mockQuest);
      expect(QuestCancelInputSchema.parse).toHaveBeenCalledWith(mockQuestCancelInput);
      expect(authFetch).toHaveBeenCalledWith('/quests/quests/quest-123/cancel', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          'x-api-key': '',
          'x-request-id': expect.any(String),
          'x-client-version': expect.any(String),
        }),
        body: JSON.stringify(mockQuestCancelInput),
      });
    });

    it('should cancel quest without payload', async () => {
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      } as Response);

      const result = await cancelQuest('quest-123');

      expect(result).toEqual(mockQuest);
      expect(authFetch).toHaveBeenCalledWith('/quests/quests/quest-123/cancel', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          'x-api-key': '',
          'x-request-id': expect.any(String),
          'x-client-version': expect.any(String),
        }),
        body: JSON.stringify({}),
      });
    });
  });

  describe('failQuest', () => {
    it('should mark quest as failed successfully', async () => {
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      } as Response);

      const result = await failQuest('quest-123');

      expect(result).toEqual(mockQuest);
      expect(authFetch).toHaveBeenCalledWith('/quests/quests/quest-123/fail', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          'x-api-key': '',
          'x-request-id': expect.any(String),
          'x-client-version': expect.any(String),
        }),
      });
    });
  });

  describe('deleteQuest', () => {
    it('should delete quest successfully', async () => {
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Quest deleted successfully' }),
      } as Response);

      await deleteQuest('quest-123');

      expect(authFetch).toHaveBeenCalledWith('/quests/quests/quest-123', {
        method: 'DELETE',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          'x-api-key': '',
          'x-request-id': expect.any(String),
          'x-client-version': expect.any(String),
        }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 authentication errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ detail: 'Invalid token' }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow(
        'You must be signed in to perform this action'
      );
    });

    it('should handle 403 permission errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ detail: 'Permission denied' }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow(
        'You do not have permission to perform this action'
      );
    });

    it('should handle 404 not found errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ detail: 'Quest not found' }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow('Quest not found');
    });

    it('should handle 409 conflict errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: () => Promise.resolve({ detail: 'Version conflict' }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow(
        'Quest was modified by another operation. Please refresh and try again'
      );
    });

    it('should handle 500 server errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ detail: 'Server error' }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow(
        'Server error. Please try again later'
      );
    });
  });

  describe('Retry Mechanism', () => {
    it('should not retry authentication errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockRejectedValue(new Error('You must be signed in'));

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow(
        'You must be signed in'
      );
      expect(authFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry validation errors', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockRejectedValue(new Error('Invalid data'));

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow('Invalid data');
      expect(authFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry network errors up to 3 times', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      
      // All calls fail with network error
      vi.mocked(authFetch).mockRejectedValue(new Error('Network error'));

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow('Network error');
      expect(authFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Response Validation', () => {
    it('should validate quest response structure', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockQuest),
      } as Response);

      const result = await createQuest(mockQuestCreateInput);

      expect(result).toEqual(mockQuest);
    });

    it('should throw error for invalid quest response', async () => {
      vi.mocked(QuestCreateInputSchema.parse).mockReturnValue(mockQuestCreateInput);
      vi.mocked(authFetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      } as Response);

      await expect(createQuest(mockQuestCreateInput)).rejects.toThrow(
        'Invalid quest response: missing required field'
      );
    });
  });
});
