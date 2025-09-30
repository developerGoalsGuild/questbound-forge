/** @vitest-environment jsdom */
import { describe, test, expect } from 'vitest';
import { profileUpdateSchema, nicknameSchema, birthDateSchema, countrySchema } from '@/lib/validation/profileValidation';

describe('profileValidation', () => {
  test('valid profile passes', () => {
    const input = {
      fullName: 'Alice Smith',
      nickname: 'alice_123',
      birthDate: '1990-01-01',
      country: 'US',
      language: 'en',
      gender: 'female',
      pronouns: 'she/her',
      bio: 'Hello',
      tags: ['fitness', 'coding']
    };
    expect(() => profileUpdateSchema.parse(input)).not.toThrow();
  });

  test('invalid nickname fails', () => {
    expect(() => nicknameSchema.parse('bad nick')).toThrow();
  });

  test('invalid birth date fails', () => {
    expect(() => birthDateSchema.parse('2024-13-40')).toThrow();
  });

  test('invalid country fails', () => {
    expect(() => countrySchema.parse('XX')).toThrow();
  });
});


