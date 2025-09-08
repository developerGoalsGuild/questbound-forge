import { jest } from '@jest/globals';
import { handler } from '../index.mjs';

describe('appsync_create_user lambda', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { jest.resetModules(); process.env = { ...OLD_ENV }; });
  afterAll(() => { process.env = OLD_ENV; });

  test('validates required fields', async () => {
    process.env.USER_SERVICE_BASE_URL = 'https://example.com/dev';
    await expect(handler({ input: { email: '', fullName: 'A', password: 'Password1!' } })).rejects.toThrow(/email required/);
    await expect(handler({ input: { email: 'a@b.com', fullName: '', password: 'Password1!' } })).rejects.toThrow(/fullName required/);
    await expect(handler({ input: { email: 'a@b.com', fullName: 'A', password: '' } })).rejects.toThrow(/password required/);
  });

  test('rejects weak password', async () => {
    process.env.USER_SERVICE_BASE_URL = 'https://example.com/dev';
    await expect(handler({ input: { email: 'a@b.com', fullName: 'A', password: 'short' } })).rejects.toThrow(/at least 8/);
  });

  test('calls signup endpoint and returns ok', async () => {
    process.env.USER_SERVICE_BASE_URL = 'https://example.com/dev';
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => JSON.stringify({ message: 'Signup successful' }) }));
    const res = await handler({ input: { email: 'a@b.com', fullName: 'A', password: 'Strong1!' } });
    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });

  test('propagates error messages from service', async () => {
    process.env.USER_SERVICE_BASE_URL = 'https://example.com/dev';
    global.fetch = jest.fn(async () => ({ ok: false, text: async () => JSON.stringify({ detail: 'User already exists' }) }));
    await expect(handler({ input: { email: 'a@b.com', fullName: 'A', password: 'Strong1!' } })).rejects.toThrow(/already exists/);
  });
});
