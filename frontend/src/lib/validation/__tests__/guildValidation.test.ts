/**
 * Guild Validation Tests
 *
 * Comprehensive unit tests for guild validation schemas and helper functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  guildCreateSchema,
  guildUpdateSchema,
  guildSearchSchema,
  validateGuildName,
  validateGuildDescription,
  validateGuildTags,
  checkGuildNameAvailability,
  getTagSuggestions,
  createValidationState,
  POPULAR_GUILD_TAGS,
} from '../guildValidation';

describe('Guild Validation Schemas', () => {
  describe('guildCreateSchema', () => {
    it('should validate valid guild creation data', () => {
      const validData = {
        name: 'Test Guild',
        description: 'A test guild description',
        tags: ['test', 'guild'],
        isPublic: true,
      };

      const result = guildCreateSchema.parse(validData);
      
      expect(result.name).toBe('Test Guild');
      expect(result.description).toBe('A test guild description');
      expect(result.tags).toEqual(['test', 'guild']);
      expect(result.isPublic).toBe(true);
    });

    it('should handle minimal valid data', () => {
      const minimalData = {
        name: 'Min',
        isPublic: false,
      };

      const result = guildCreateSchema.parse(minimalData);
      
      expect(result.name).toBe('Min');
      expect(result.description).toBeUndefined();
      expect(result.tags).toEqual([]);
      expect(result.isPublic).toBe(false);
    });

    it('should transform and normalize data', () => {
      const dataWithWhitespace = {
        name: '  Test Guild  ',
        description: '  A test description  ',
        tags: ['  TEST  ', '  GUILD  '],
        isPublic: true,
      };

      const result = guildCreateSchema.parse(dataWithWhitespace);
      
      expect(result.name).toBe('Test Guild');
      expect(result.description).toBe('A test description');
      expect(result.tags).toEqual(['test', 'guild']);
    });

    it('should remove duplicate tags', () => {
      const dataWithDuplicates = {
        name: 'Test Guild',
        tags: ['test', 'guild', 'test', 'guild', 'unique'],
        isPublic: true,
      };

      const result = guildCreateSchema.parse(dataWithDuplicates);
      
      expect(result.tags).toEqual(['test', 'guild', 'unique']);
    });

    it('should reject invalid guild names', () => {
      const invalidNames = [
        '', // empty
        'ab', // too short
        'a'.repeat(51), // too long
        'Test@Guild', // invalid characters
        'Test#Guild', // invalid characters
        'Test$Guild', // invalid characters
      ];

      invalidNames.forEach(name => {
        expect(() => {
          guildCreateSchema.parse({ name, isPublic: true });
        }).toThrow();
      });
    });

    it('should reject invalid descriptions', () => {
      const longDescription = 'a'.repeat(501);
      
      expect(() => {
        guildCreateSchema.parse({
          name: 'Test Guild',
          description: longDescription,
          isPublic: true,
        });
      }).toThrow();
    });

    it('should reject invalid tags', () => {
      const invalidTagData = {
        name: 'Test Guild',
        tags: ['a'.repeat(21)], // too long
        isPublic: true,
      };

      expect(() => {
        guildCreateSchema.parse(invalidTagData);
      }).toThrow();
    });

    it('should reject too many tags', () => {
      const manyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      
      expect(() => {
        guildCreateSchema.parse({
          name: 'Test Guild',
          tags: manyTags,
          isPublic: true,
        });
      }).toThrow();
    });
  });

  describe('guildUpdateSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        name: 'Updated Guild',
        description: 'Updated description',
        tags: ['updated', 'guild'],
        isPublic: false,
      };

      const result = guildUpdateSchema.parse(validData);
      
      expect(result.name).toBe('Updated Guild');
      expect(result.description).toBe('Updated description');
      expect(result.tags).toEqual(['updated', 'guild']);
      expect(result.isPublic).toBe(false);
    });

    it('should handle partial updates', () => {
      const partialData = {
        name: 'New Name',
      };

      const result = guildUpdateSchema.parse(partialData);
      
      expect(result.name).toBe('New Name');
      expect(result.description).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.isPublic).toBeUndefined();
    });

    it('should handle empty update data', () => {
      const emptyData = {};

      const result = guildUpdateSchema.parse(emptyData);
      
      expect(result.name).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.isPublic).toBeUndefined();
    });
  });

  describe('guildSearchSchema', () => {
    it('should validate valid search data', () => {
      const validData = {
        search: 'test guild',
        tags: ['test', 'guild'],
        sortBy: 'newest' as const,
        limit: 20,
      };

      const result = guildSearchSchema.parse(validData);
      
      expect(result.search).toBe('test guild');
      expect(result.tags).toEqual(['test', 'guild']);
      expect(result.sortBy).toBe('newest');
      expect(result.limit).toBe(20);
    });

    it('should use default values', () => {
      const minimalData = {};

      const result = guildSearchSchema.parse(minimalData);
      
      expect(result.search).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.sortBy).toBe('newest');
      expect(result.limit).toBe(20);
    });

    it('should reject invalid sort options', () => {
      expect(() => {
        guildSearchSchema.parse({ sortBy: 'invalid' });
      }).toThrow();
    });

    it('should reject invalid limits', () => {
      expect(() => {
        guildSearchSchema.parse({ limit: 0 });
      }).toThrow();

      expect(() => {
        guildSearchSchema.parse({ limit: 51 });
      }).toThrow();
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('validateGuildName', () => {
    it('should validate correct guild names', () => {
      const validNames = [
        'Test Guild',
        'My Awesome Guild',
        'Guild-123',
        'Guild_Test',
        'Guild 123',
      ];

      validNames.forEach(name => {
        const result = validateGuildName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid guild names', () => {
      const invalidNames = [
        { name: '', expectedError: 'Guild name must be at least 3 characters long' },
        { name: 'ab', expectedError: 'Guild name must be at least 3 characters long' },
        { name: 'a'.repeat(51), expectedError: 'Guild name must be less than 50 characters' },
        { name: 'Test@Guild', expectedError: 'Guild name can only contain letters, numbers, spaces, hyphens, and underscores' },
      ];

      invalidNames.forEach(({ name, expectedError }) => {
        const result = validateGuildName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });
  });

  describe('validateGuildDescription', () => {
    it('should validate correct descriptions', () => {
      const validDescriptions = [
        'A test description',
        'A'.repeat(500),
        '',
      ];

      validDescriptions.forEach(description => {
        const result = validateGuildDescription(description);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject descriptions that are too long', () => {
      const longDescription = 'a'.repeat(501);
      const result = validateGuildDescription(longDescription);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Description must be less than 500 characters');
    });
  });

  describe('validateGuildTags', () => {
    it('should validate correct tags', () => {
      const validTags = [
        ['test', 'guild'],
        ['tag1', 'tag2', 'tag3'],
        [],
      ];

      validTags.forEach(tags => {
        const result = validateGuildTags(tags);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid tags', () => {
      const invalidTags = [
        { tags: ['a'.repeat(21)], expectedError: 'Each tag must be less than 20 characters' },
        { tags: Array.from({ length: 11 }, (_, i) => `tag${i}`), expectedError: 'Maximum 10 tags allowed' },
      ];

      invalidTags.forEach(({ tags, expectedError }) => {
        const result = validateGuildTags(tags);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });
  });

  describe('checkGuildNameAvailability', () => {
    it('should check name availability', async () => {
      const availableName = 'Available Guild Name';
      const result = await checkGuildNameAvailability(availableName);
      
      expect(result).toBe(true);
    });

    it('should reject unavailable names', async () => {
      const unavailableNames = ['test', 'admin', 'guild', 'community'];
      
      for (const name of unavailableNames) {
        const result = await checkGuildNameAvailability(name);
        expect(result).toBe(false);
      }
    });

    it('should handle async timing', async () => {
      const startTime = Date.now();
      await checkGuildNameAvailability('test name');
      const endTime = Date.now();
      
      // Should take at least 300ms (mock delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
    });
  });

  describe('getTagSuggestions', () => {
    it('should return popular tags when no input', () => {
      const suggestions = getTagSuggestions('');
      
      expect(suggestions).toHaveLength(10);
      expect(suggestions).toEqual(POPULAR_GUILD_TAGS.slice(0, 10));
    });

    it('should filter suggestions based on input', () => {
      const suggestions = getTagSuggestions('fit');
      
      expect(suggestions.length).toBeLessThanOrEqual(5);
      expect(suggestions.every(tag => tag.includes('fit'))).toBe(true);
    });

    it('should exclude existing tags', () => {
      const existingTags = ['fitness', 'health'];
      const suggestions = getTagSuggestions('', existingTags);
      
      expect(suggestions).not.toContain('fitness');
      expect(suggestions).not.toContain('health');
    });

    it('should return empty array when no matches', () => {
      const suggestions = getTagSuggestions('nonexistent');
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('createValidationState', () => {
    it('should create valid state for correct input', () => {
      const schema = guildCreateSchema.shape.name;
      const state = createValidationState('Valid Name', schema, true, true);
      
      expect(state.isValid).toBe(true);
      expect(state.error).toBeUndefined();
      expect(state.isDirty).toBe(true);
      expect(state.isTouched).toBe(true);
    });

    it('should create invalid state for incorrect input', () => {
      const schema = guildCreateSchema.shape.name;
      const state = createValidationState('ab', schema, true, true);
      
      expect(state.isValid).toBe(false);
      expect(state.error).toBeDefined();
      expect(state.isDirty).toBe(true);
      expect(state.isTouched).toBe(true);
    });

    it('should handle default dirty and touched states', () => {
      const schema = guildCreateSchema.shape.name;
      const state = createValidationState('Valid Name', schema);
      
      expect(state.isDirty).toBe(false);
      expect(state.isTouched).toBe(false);
    });
  });
});

describe('Constants and Configuration', () => {
  it('should have correct popular tags', () => {
    expect(POPULAR_GUILD_TAGS).toHaveLength(20);
    expect(POPULAR_GUILD_TAGS).toContain('fitness');
    expect(POPULAR_GUILD_TAGS).toContain('technology');
    expect(POPULAR_GUILD_TAGS).toContain('education');
  });

  it('should have all popular tags as strings', () => {
    POPULAR_GUILD_TAGS.forEach(tag => {
      expect(typeof tag).toBe('string');
      expect(tag.length).toBeGreaterThan(0);
    });
  });
});

