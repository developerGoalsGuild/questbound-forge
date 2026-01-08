/**
 * Quest Template API Client Tests
 * 
 * Comprehensive unit tests for the quest template API client functions,
 * covering all CRUD operations, error handling, and edge cases.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createQuestTemplate, 
  getTemplate, 
  updateTemplate, 
  deleteTemplate, 
  listTemplates,
  listUserTemplates,
  listPublicTemplates,
  searchTemplates,
  getTemplatesByCategory,
  getTemplatesByDifficulty,
  getTemplatesByPrivacy,
  getTemplatesByKind
} from '../apiQuestTemplate';
import { authFetch } from '../api';

// Mock the authFetch function
vi.mock('../api', () => ({
  authFetch: vi.fn(),
}));

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Set environment variables for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_QUEST_SERVICE_URL: 'https://api.example.com',
    VITE_API_GATEWAY_KEY: 'test-api-key',
  },
  writable: true,
});

const mockAuthFetch = vi.mocked(authFetch);

describe('Quest Template API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createQuestTemplate', () => {
    it('creates template successfully', async () => {
      const mockTemplate = {
        id: 'template-1',
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium',
        privacy: 'public',
        kind: 'linked',
        tags: ['test'],
        rewardXp: 100,
        estimatedDuration: 7,
        instructions: 'Test instructions',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdBy: 'user-1',
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockTemplate),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: ['test'],
        rewardXp: 100,
        estimatedDuration: 7,
        instructions: 'Test instructions',
      };

      const result = await createQuestTemplate(templateData);

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
          },
          body: JSON.stringify(templateData),
        })
      );

      expect(result).toEqual(mockTemplate);
    });

    it('handles creation errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          detail: 'Validation failed: Title is required',
        }),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      const templateData = {
        title: '',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        estimatedDuration: 7,
      };

      await expect(createQuestTemplate(templateData)).rejects.toThrow('Validation failed: Title is required');
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      mockAuthFetch.mockRejectedValue(networkError);

      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium' as const,
        privacy: 'public' as const,
        kind: 'linked' as const,
        tags: [],
        rewardXp: 0,
        estimatedDuration: 7,
      };

      await expect(createQuestTemplate(templateData)).rejects.toThrow('Network error');
    });
  });

  describe('getTemplate', () => {
    it('retrieves template successfully', async () => {
      const mockTemplate = {
        id: 'template-1',
        title: 'Test Template',
        description: 'Test Description',
        category: 'Fitness',
        difficulty: 'medium',
        privacy: 'public',
        kind: 'linked',
        tags: ['test'],
        rewardXp: 100,
        estimatedDuration: 7,
        instructions: 'Test instructions',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdBy: 'user-1',
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockTemplate),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      const result = await getTemplate('template-1');

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates/template-1'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
          },
        })
      );

      expect(result).toEqual(mockTemplate);
    });

    it('handles template not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({
          detail: 'Template not found',
        }),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      await expect(getTemplate('nonexistent-template')).rejects.toThrow('Template not found');
    });
  });

  describe('updateTemplate', () => {
    it('updates template successfully', async () => {
      const mockTemplate = {
        id: 'template-1',
        title: 'Updated Template',
        description: 'Updated Description',
        category: 'Health',
        difficulty: 'hard',
        privacy: 'private',
        kind: 'quantitative',
        tags: ['updated'],
        rewardXp: 200,
        estimatedDuration: 14,
        instructions: 'Updated instructions',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        createdBy: 'user-1',
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockTemplate),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      const updateData = {
        title: 'Updated Template',
        description: 'Updated Description',
        category: 'Health',
        difficulty: 'hard' as const,
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        tags: ['updated'],
        rewardXp: 200,
        estimatedDuration: 14,
        instructions: 'Updated instructions',
      };

      const result = await updateTemplate('template-1', updateData);

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates/template-1'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(result).toEqual(mockTemplate);
    });

    it('handles update errors', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: vi.fn().mockResolvedValue({
          detail: 'You do not have permission to update this template',
        }),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      const updateData = {
        title: 'Updated Template',
        description: 'Updated Description',
        category: 'Health',
        difficulty: 'hard' as const,
        privacy: 'private' as const,
        kind: 'quantitative' as const,
        tags: ['updated'],
        rewardXp: 200,
        estimatedDuration: 14,
      };

      await expect(updateTemplate('template-1', updateData)).rejects.toThrow('You do not have permission to update this template');
    });
  });

  describe('deleteTemplate', () => {
    it('deletes template successfully', async () => {
      const mockResponse = {
        ok: true,
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      await deleteTemplate('template-1');

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates/template-1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
          },
        })
      );
    });

    it('handles delete errors', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: vi.fn().mockResolvedValue({
          detail: 'You do not have permission to delete this template',
        }),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      await expect(deleteTemplate('template-1')).rejects.toThrow('You do not have permission to delete this template');
    });
  });

  describe('listTemplates', () => {
    it('lists templates successfully', async () => {
      const mockResponse = {
        templates: [
          {
            id: 'template-1',
            title: 'Template 1',
            description: 'Description 1',
            category: 'Fitness',
            difficulty: 'medium',
            privacy: 'public',
            kind: 'linked',
            tags: ['test'],
            rewardXp: 100,
            estimatedDuration: 7,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            createdBy: 'user-1',
          },
          {
            id: 'template-2',
            title: 'Template 2',
            description: 'Description 2',
            category: 'Health',
            difficulty: 'hard',
            privacy: 'private',
            kind: 'quantitative',
            tags: ['health'],
            rewardXp: 200,
            estimatedDuration: 14,
            createdAt: '2023-01-02T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            createdBy: 'user-2',
          },
        ],
        total: 2,
        nextToken: 'next-token',
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      const result = await listTemplates();

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('lists templates with options', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      const options = {
        limit: 10,
        nextToken: 'token',
        privacy: 'public' as const,
      };

      await listTemplates(options);

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=10&next_token=token&privacy=public'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
          },
        })
      );
    });

    it('handles list errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({
          detail: 'Internal server error',
        }),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      await expect(listTemplates()).rejects.toThrow('Internal server error');
    });
  });

  describe('Specialized List Functions', () => {
    it('listUserTemplates calls listTemplates with user privacy', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      await listUserTemplates({ limit: 5 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=5&privacy=user'),
        expect.any(Object)
      );
    });

    it('listPublicTemplates calls listTemplates with public privacy', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      await listPublicTemplates({ limit: 10 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=10&privacy=public'),
        expect.any(Object)
      );
    });

    it('searchTemplates calls listTemplates with search filter', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      await searchTemplates('fitness', { limit: 5 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=5'),
        expect.any(Object)
      );
    });

    it('getTemplatesByCategory calls listTemplates with category filter', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      await getTemplatesByCategory('Fitness', { limit: 5 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=5'),
        expect.any(Object)
      );
    });

    it('getTemplatesByDifficulty calls listTemplates with difficulty filter', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      await getTemplatesByDifficulty('medium', { limit: 5 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=5'),
        expect.any(Object)
      );
    });

    it('getTemplatesByPrivacy calls listTemplates with privacy filter', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      await getTemplatesByPrivacy('followers', { limit: 5 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=5&privacy=followers'),
        expect.any(Object)
      );
    });

    it('getTemplatesByKind calls listTemplates with kind filter', async () => {
      const mockResponse = {
        templates: [],
        total: 0,
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };

      mockAuthFetch.mockResolvedValue(mockFetchResponse as any);

      await getTemplatesByKind('linked', { limit: 5 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates?limit=5'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('handles JSON parse errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      await expect(createQuestTemplate({
        title: 'Test',
        description: 'Test',
        category: 'Fitness',
        difficulty: 'medium',
        privacy: 'public',
        kind: 'linked',
        tags: [],
        rewardXp: 0,
        estimatedDuration: 7,
      })).rejects.toThrow('Internal Server Error');
    });

    it('handles missing error details', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({}),
      };

      mockAuthFetch.mockResolvedValue(mockResponse as any);

      await expect(createQuestTemplate({
        title: 'Test',
        description: 'Test',
        category: 'Fitness',
        difficulty: 'medium',
        privacy: 'public',
        kind: 'linked',
        tags: [],
        rewardXp: 0,
        estimatedDuration: 7,
      })).rejects.toThrow('Bad Request');
    });
  });
});
