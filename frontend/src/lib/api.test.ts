import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('aws-amplify/api', () => {
  const graph = vi.fn(async ({ query, variables }: any) => {
    if (query === 'IS_EMAIL_AVAILABLE') {
      return { data: { isEmailAvailable: variables?.email !== 'taken@example.com' }, errors: [] };
    }
    if (query === 'IS_NICKNAME_AVAILABLE') {
      return { data: { isNicknameAvailable: variables?.nickname !== 'neo' }, errors: [] };
    }
    return { data: {}, errors: [] };
  });
  return { generateClient: () => ({ graphql: graph }) };
});

vi.mock('@/graphql/queries', () => ({
  IS_EMAIL_AVAILABLE: 'IS_EMAIL_AVAILABLE',
  IS_NICKNAME_AVAILABLE: 'IS_NICKNAME_AVAILABLE'
}));

import { createUser, isEmailAvailable, isNicknameAvailable } from './api';

describe('frontend api lib', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('createUser posts to /users/signup with payload', async () => {
    const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ message: 'Signup successful' })
    } as any);
    await createUser({ email: 'user@example.com', fullName: 'User', password: 'Aa1!aaaa', nickname: 'nick', country: 'US' });
    expect(spy).toHaveBeenCalled();
    const [url, init] = spy.mock.calls[0];
    expect(url).toMatch(/\/users\/signup$/);
    const body = JSON.parse((init as any).body);
    expect(body.provider).toBe('local');
    expect(body.email).toBe('user@example.com');
    expect(body.name).toBe('User');
  });

  it('createUser surfaces API errors', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: false, text: async () => JSON.stringify({ detail: 'bad' }) } as any);
    await expect(createUser({ email: 'u@e.com', fullName: 'U', password: 'Aa1!aaaa' })).rejects.toThrow(/bad/);
  });

  it('isEmailAvailable returns true/false from GraphQL', async () => {
    await expect(isEmailAvailable('free@example.com')).resolves.toBe(true);
    await expect(isEmailAvailable('taken@example.com')).resolves.toBe(false);
  });

  it('isNicknameAvailable returns true/false from GraphQL', async () => {
    await expect(isNicknameAvailable('trinity')).resolves.toBe(true);
    await expect(isNicknameAvailable('neo')).resolves.toBe(false);
  });
});
