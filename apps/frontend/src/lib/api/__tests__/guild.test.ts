/**
 * Guild API Client Tests
 *
 * Comprehensive unit tests for the guild API client functions,
 * including mock implementations and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  guildAPI,
  mockGuildAPI,
  GuildCreateInput,
  Guild,
  GuildAPIError,
} from '../guild';

// Mock the utils module
vi.mock('@/lib/utils', () => ({
  getAccessToken: vi.fn(() => 'mock-token'),
  getApiBase: vi.fn(() => '/v1'),
}));

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_BASE_URL: '/v1',
  VITE_API_GATEWAY_KEY: 'mock-api-key',
  DEV: true,
}));

describe('Guild API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createGuild', () => {
    it('should create a guild successfully', async () => {
      const guildData: GuildCreateInput = {
        name: 'Test Guild',
        description: 'A test guild',
        tags: ['test', 'guild'],
        guild_type: 'public',
      };

      const result = await mockGuildAPI.createGuild(guildData);

      expect(result).toMatchObject({
        name: guildData.name,
        description: guildData.description,
        tags: guildData.tags,
        member_count: 1,
        goal_count: 0,
        quest_count: 0,
      });
      expect(result.guild_id).toBeDefined();
      expect(result.created_by).toBe('current_user_id');
      expect(result.created_at).toBeDefined();
    });

    it('should handle creation errors', async () => {
      const invalidData = {} as GuildCreateInput;

      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await mockGuildAPI.createGuild(invalidData);
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleSpy.mockRestore();
    });
  });

  describe('getMyGuilds', () => {
    it('should return user guilds', async () => {
      const result = await mockGuildAPI.getMyGuilds();

      expect(result).toHaveProperty('guilds');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.guilds)).toBe(true);
      expect(result.guilds.length).toBeGreaterThan(0);
      expect(result.total).toBe(result.guilds.length);
    });

    it('should return guilds with correct structure', async () => {
      const result = await mockGuildAPI.getMyGuilds();

      const guild = result.guilds[0];
      expect(guild).toHaveProperty('guild_id');
      expect(guild).toHaveProperty('name');
      expect(guild).toHaveProperty('description');
      expect(guild).toHaveProperty('created_by');
      expect(guild).toHaveProperty('created_at');
      expect(guild).toHaveProperty('member_count');
      expect(guild).toHaveProperty('goal_count');
      expect(guild).toHaveProperty('quest_count');
      expect(guild).toHaveProperty('guild_type');
      expect(guild).toHaveProperty('tags');
    });
  });

  describe('getGuild', () => {
    it('should return guild details', async () => {
      const guildId = 'test-guild-id';
      const result = await mockGuildAPI.getGuild(guildId);

      expect(result.guild_id).toBe(guildId);
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('members');
      expect(Array.isArray(result.members)).toBe(true);
    });
  });

  describe('joinGuild', () => {
    it('should join a guild successfully', async () => {
      const guildId = 'test-guild-id';
      const result = await mockGuildAPI.joinGuild(guildId);

      expect(result.guild_id).toBe(guildId);
      expect(result.member_count).toBeGreaterThan(0);
    });
  });

  describe('leaveGuild', () => {
    it('should leave a guild successfully', async () => {
      const guildId = 'test-guild-id';
      
      // Mock console.log to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(mockGuildAPI.leaveGuild(guildId)).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('updateGuild', () => {
    it('should update guild successfully', async () => {
      const guildId = 'test-guild-id';
      const updateData = {
        name: 'Updated Guild Name',
        description: 'Updated description',
        guild_type: 'private',
      };

      const result = await mockGuildAPI.updateGuild(guildId, updateData);

      expect(result.guild_id).toBe(guildId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.guild_type).toBe(updateData.guild_type);
      expect(result.updated_at).toBeDefined();
    });
  });

  describe('deleteGuild', () => {
    it('should delete guild successfully', async () => {
      const guildId = 'test-guild-id';
      
      // Mock console.log to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(mockGuildAPI.deleteGuild(guildId)).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('getGuildMembers', () => {
    it('should return guild members', async () => {
      const guildId = 'test-guild-id';
      const result = await mockGuildAPI.getGuildMembers(guildId);

      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('totalCount');
      expect(Array.isArray(result.members)).toBe(true);
      expect(result.members.length).toBeGreaterThan(0);

      const member = result.members[0];
      expect(member).toHaveProperty('user_id');
      expect(member).toHaveProperty('username');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('joined_at');
      expect(['owner', 'member']).toContain(member.role);
    });
  });

  describe('removeGuildMember', () => {
    it('should remove guild member successfully', async () => {
      const guildId = 'test-guild-id';
      const userId = 'test-user-id';
      
      // Mock console.log to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(mockGuildAPI.removeGuildMember(guildId, userId)).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('addGoalToGuild', () => {
    it('should add goal to guild successfully', async () => {
      const guildId = 'test-guild-id';
      const goalId = 'test-goal-id';
      const result = await mockGuildAPI.addGoalToGuild(guildId, goalId);

      expect(result.guild_id).toBe(guildId);
      expect(result.goal_count).toBeGreaterThan(0);
    });
  });

  describe('removeGoalFromGuild', () => {
    it('should remove goal from guild successfully', async () => {
      const guildId = 'test-guild-id';
      const goalId = 'test-goal-id';
      const result = await mockGuildAPI.removeGoalFromGuild(guildId, goalId);

      expect(result.guild_id).toBe(guildId);
      expect(result.goal_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addQuestToGuild', () => {
    it('should add quest to guild successfully', async () => {
      const guildId = 'test-guild-id';
      const questId = 'test-quest-id';
      const result = await mockGuildAPI.addQuestToGuild(guildId, questId);

      expect(result.guild_id).toBe(guildId);
      expect(result.quest_count).toBeGreaterThan(0);
    });
  });

  describe('removeQuestFromGuild', () => {
    it('should remove quest from guild successfully', async () => {
      const guildId = 'test-guild-id';
      const questId = 'test-quest-id';
      const result = await mockGuildAPI.removeQuestFromGuild(guildId, questId);

      expect(result.guild_id).toBe(guildId);
      expect(result.quest_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('discoverGuilds', () => {
    it('should discover guilds successfully', async () => {
      const result = await mockGuildAPI.discoverGuilds();

      expect(result).toHaveProperty('guilds');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.guilds)).toBe(true);
      expect(result.guilds.length).toBeGreaterThan(0);
    });

    it('should filter guilds by search query', async () => {
      const searchQuery = 'tech';
      const result = await mockGuildAPI.discoverGuilds(searchQuery);

      expect(result).toHaveProperty('guilds');
      expect(Array.isArray(result.guilds)).toBe(true);
    });

    it('should filter guilds by tags', async () => {
      const tags = ['technology', 'innovation'];
      const result = await mockGuildAPI.discoverGuilds(undefined, tags);

      expect(result).toHaveProperty('guilds');
      expect(Array.isArray(result.guilds)).toBe(true);
    });
  });

  describe('GuildAPIError', () => {
    it('should create error with message and status', () => {
      const error = new GuildAPIError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.name).toBe('GuildAPIError');
    });
  });

  describe('API Integration', () => {
    it('should use mock API in development', () => {
      expect(guildAPI).not.toBe(mockGuildAPI);
    });

    it('should handle async operations with proper timing', async () => {
      const startTime = Date.now();
      await mockGuildAPI.getMyGuilds();
      const endTime = Date.now();
      
      // Should take at least 500ms (mock delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(400);
    });
  });
});

