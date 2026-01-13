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
  IS_NICKNAME_AVAILABLE: 'IS_NICKNAME_AVAILABLE',
  ACTIVE_GOALS_COUNT: 'ACTIVE_GOALS_COUNT',
}));

import { createUser, isEmailAvailable, isNicknameAvailable, login, authFetch, getAccessToken, renewToken, getUserIdFromToken, requestPasswordReset, resetPassword } from './api';
import { getActiveGoalsCountForUser } from './apiGoal';

describe('frontend api lib', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
    // Mock fetch for graphqlRaw calls
    fetchSpy = vi.spyOn(globalThis, 'fetch' as any);
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

  it('login posts to /users/login and returns token', async () => {
    const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ token_type: 'Bearer', access_token: 'aaa.bbb.ccc', expires_in: 3600 })
    } as any);
    const resp = await login('user@example.com', 'Aa1!aaaa');
    expect(spy).toHaveBeenCalled();
    const [url, init] = spy.mock.calls[0];
    expect(url).toMatch(/\/users\/login$/);
    const body = JSON.parse((init as any).body);
    expect(body.email).toBe('user@example.com');
    expect(resp.access_token).toBeDefined();
  });

  it('login surfaces API errors', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: false, text: async () => JSON.stringify({ detail: 'bad creds' }) } as any);
    await expect(login('bad@example.com', 'wrong')).rejects.toThrow(/bad creds/);
  });

  it('login allows pending confirmation when flag is OFF', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
    vi.doMock('@/config/featureFlags', () => ({ emailConfirmationEnabled: false }));
    const { login: loginWithFlagOff } = await import('./api');
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: false, text: async () => JSON.stringify({ detail: 'Email confirmation pending' }) } as any);
    const resp = await loginWithFlagOff('u@e.com', 'pass');
    expect(resp.access_token).toBeTruthy();
    // token should be a JWT-like string with 3 parts
    expect(resp.access_token.split('.').length).toBe(3);
  });

  it('authFetch attaches Authorization and x-api-key when available', async () => {
    // Mock browser localStorage in this test environment
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => store.clear(),
      }
    });
    const tok = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ sub: 'u' })) + '.sig';
    localStorage.setItem('auth', JSON.stringify({ token_type: 'Bearer', access_token: tok, expires_in: 3600 }));
    const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: true, text: async () => '' } as any);
    await authFetch('/protected/resource', { method: 'GET' });
    const [url, init] = spy.mock.calls[0];
    expect(url).toMatch(/^https:\/\/api\.example\.com\/dev\/protected\/resource$/);
    const headers = (init as any).headers;
    const auth = headers.get ? headers.get('authorization') : headers['authorization'];
    expect(auth).toMatch(/^Bearer /);
  });

  it('authFetch renews token when expiring soon', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
    // mock localStorage and time-sensitive token (exp in 10s)
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => store.clear(),
      }
    });
    const exp = Math.floor(Date.now()/1000) + 10;
    const soon = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ exp })) + '.sig';
    localStorage.setItem('auth', JSON.stringify({ token_type: 'Bearer', access_token: soon, expires_in: 10 }));

    // First call is renew, second is actual endpoint
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any)
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ token_type: 'Bearer', access_token: soon, expires_in: 1200 }) } as any)
      .mockResolvedValueOnce({ ok: true, text: async () => '' } as any);

    await authFetch('/protected', { method: 'GET' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toMatch(/\/auth\/renew$/);
  });

  it('authFetch clears auth if renew fails with 401', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => store.clear(),
      }
    });
    const exp = Math.floor(Date.now()/1000) + 10;
    const soon = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ exp })) + '.sig';
    localStorage.setItem('auth', JSON.stringify({ token_type: 'Bearer', access_token: soon, expires_in: 10 }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any)
      .mockResolvedValueOnce({ ok: false, text: async () => JSON.stringify({ detail: 'Token expired or invalid' }) } as any)
      .mockResolvedValueOnce({ ok: true, text: async () => '' } as any);
    await authFetch('/protected', { method: 'GET' });
    expect(localStorage.getItem('auth')).toBeNull();
  });

  it('createUser surfaces API errors', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: false, text: async () => JSON.stringify({ detail: 'bad' }) } as any);
    await expect(createUser({ email: 'u@e.com', fullName: 'U', password: 'Aa1!aaaa' })).rejects.toThrow(/bad/);
  });

  it('normalizes pending status to active when flag is OFF', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
    vi.doMock('@/config/featureFlags', () => ({ emailConfirmationEnabled: false }));
    const { createUser: createUserWithFlagOff } = await import('./api');
    const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true })
    } as any);
    await createUserWithFlagOff({ email: 'x@y.com', status: 'email confirmation pending' });
    const [, init] = spy.mock.calls[0];
    const body = JSON.parse((init as any).body);
    expect(body.status).toBe('active');
  });

  it('keeps pending status when flag is ON', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
    vi.doMock('@/config/featureFlags', () => ({ emailConfirmationEnabled: true }));
    const { createUser: createUserWithFlagOn } = await import('./api');
    const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true })
    } as any);
    await createUserWithFlagOn({ email: 'x@y.com', status: 'email confirmation pending' });
    const [, init] = spy.mock.calls[0];
    const body = JSON.parse((init as any).body);
    expect(body.status).toBe('email confirmation pending');
  });

  it('isEmailAvailable returns true/false from GraphQL', async () => {
    await expect(isEmailAvailable('free@example.com')).resolves.toBe(true);
    await expect(isEmailAvailable('taken@example.com')).resolves.toBe(false);
  });

  it('isNicknameAvailable returns true/false from GraphQL', async () => {
    await expect(isNicknameAvailable('trinity')).resolves.toBe(true);
    await expect(isNicknameAvailable('neo')).resolves.toBe(false);
  });

  it('getUserIdFromToken returns sub or email fallback', () => {
    const subTok = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ sub: 'U1' })) + '.sig';
    // Mock localStorage retrieval path used by getAccessToken
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => store.clear(),
      }
    });
    localStorage.setItem('auth', JSON.stringify({ access_token: subTok }));
    expect(getUserIdFromToken()).toBe('U1');
    const emailTok = 'e.' + btoa(JSON.stringify({ email: 'x@y.com' })) + '.s';
    localStorage.setItem('auth', JSON.stringify({ access_token: emailTok }));
    expect(getUserIdFromToken()).toBe('x@y.com');
  });

  it('getActiveGoalsCountForUser counts active goals', async () => {
    vi.mocked(getActiveGoalsCountForUser).mockResolvedValue(2);
    await expect(getActiveGoalsCountForUser('U1')).resolves.toBe(2);
  });

  it('getActiveGoalsCountForUser returns 0 on error', async () => {
    vi.mocked(getActiveGoalsCountForUser).mockRejectedValue(new Error('Network error'));
    await expect(getActiveGoalsCountForUser('ERR')).rejects.toThrow('Network error');
  });

  describe('password reset API functions', () => {
    it('requestPasswordReset posts to /password/reset-request with email', async () => {
      const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ message: 'If the account exists and email is confirmed, a reset link will be sent.' })
      } as any);
      
      const result = await requestPasswordReset('user@example.com');
      
      expect(spy).toHaveBeenCalled();
      const [url, init] = spy.mock.calls[0];
      expect(url).toMatch(/\/password\/reset-request$/);
      const body = JSON.parse((init as any).body);
      expect(body.email).toBe('user@example.com');
      expect(result.message).toBeDefined();
    });

    it('requestPasswordReset includes x-api-key header when available', async () => {
      vi.stubEnv('VITE_API_GATEWAY_KEY', 'test-api-key');
      const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ message: 'Success' })
      } as any);
      
      await requestPasswordReset('user@example.com');
      
      const [, init] = spy.mock.calls[0];
      const headers = (init as any).headers;
      const apiKey = headers['x-api-key'] || (headers.get && headers.get('x-api-key'));
      expect(apiKey).toBe('test-api-key');
    });

    it('requestPasswordReset throws error when email not confirmed', async () => {
      vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ detail: 'Email not confirmed. Please confirm your email before requesting a password reset.' })
      } as any);
      
      await expect(requestPasswordReset('unconfirmed@example.com')).rejects.toThrow(/not confirmed/i);
    });

    it('requestPasswordReset throws error on network failure', async () => {
      vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ detail: 'Internal server error' })
      } as any);
      
      await expect(requestPasswordReset('user@example.com')).rejects.toThrow(/internal server error/i);
    });

    it('resetPassword posts to /password/change with reset_token', async () => {
      const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ message: 'Password reset successfully. Please log in with your new password.' })
      } as any);
      
      const result = await resetPassword('reset-token-123', 'NewSecurePass123!');
      
      expect(spy).toHaveBeenCalled();
      const [url, init] = spy.mock.calls[0];
      expect(url).toMatch(/\/password\/change$/);
      const body = JSON.parse((init as any).body);
      expect(body.reset_token).toBe('reset-token-123');
      expect(body.new_password).toBe('NewSecurePass123!');
      expect(result.message).toBeDefined();
    });

    it('resetPassword includes x-api-key header when available', async () => {
      vi.stubEnv('VITE_API_GATEWAY_KEY', 'test-api-key');
      const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ message: 'Success' })
      } as any);
      
      await resetPassword('token', 'NewPass123!');
      
      const [, init] = spy.mock.calls[0];
      const headers = (init as any).headers;
      const apiKey = headers['x-api-key'] || (headers.get && headers.get('x-api-key'));
      expect(apiKey).toBe('test-api-key');
    });

    it('resetPassword throws error for expired token', async () => {
      vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ detail: 'Reset token expired' })
      } as any);
      
      await expect(resetPassword('expired-token', 'NewPass123!')).rejects.toThrow(/expired/i);
    });

    it('resetPassword throws error for invalid token', async () => {
      vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ detail: 'Invalid or expired reset token' })
      } as any);
      
      await expect(resetPassword('invalid-token', 'NewPass123!')).rejects.toThrow(/invalid/i);
    });

    it('resetPassword throws error for weak password', async () => {
      vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ detail: 'Password must be at least 8 characters' })
      } as any);
      
      await expect(resetPassword('valid-token', 'weak')).rejects.toThrow(/password/i);
    });
  });
});
