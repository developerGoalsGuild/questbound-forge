import { generateClient } from "aws-amplify/api";
import awsConfigDev from '@/config/aws-exports.dev';
import awsConfigProd from '@/config/aws-exports.prod';
import { IS_EMAIL_AVAILABLE, IS_NICKNAME_AVAILABLE, IS_NICKNAME_AVAILABLE_FOR_USER, GOALS_BY_USER, ACTIVE_GOALS_COUNT } from "@/graphql/queries";
import { emailConfirmationEnabled } from "@/config/featureFlags";
import { getAccessToken, getApiBase, getTokenExpiry, renewToken, getUserIdFromToken, graphqlWithApiKey } from '@/lib/utils';
import { logger } from './logger';


import { SubscriptionTier } from './api/subscription';

export interface CreateUserInput {
  email: string;
  fullName?: string;
  password?: string;
  status?: string;
  role?: 'user' | 'partner' | 'patron';
  subscriptionTier?: SubscriptionTier;
  [key: string]: any;
}


// GraphQL client with Lambda auth. The token comes from our local storage auth.
export function graphQLClientProtected() {
  // Use the configured Amplify instance - it will use the endpoint from awsConfig
  logger.debug('Creating protected GraphQL client...');
  const client = generateClient({
    authMode: 'lambda',
    authToken: () => {
      const tok = getAccessToken();
      logger.debug('GraphQL AuthToken check', { hasToken: !!tok });
      if (!tok) {
        logger.error('Missing token for GraphQL protected client');
        throw new Error('NO_TOKEN');
      }
      return tok; // raw JWT
    },
  } as any);

  const originalGraphql = client.graphql.bind(client);

  (client as any).graphql = async (args: any) => {
    const opName =
      (args?.query as any)?.definitions?.[0]?.name?.value || 'anonymous';
    try {
      logger.debug(`Executing GraphQL operation: ${opName}`, { operation: opName, authMode: args?.authMode || 'lambda' });
      const res = await originalGraphql(args);
      if (res?.errors?.length) {
        logger.warn(`GraphQL operation returned errors: ${opName}`, { operation: opName, errors: res.errors });
      }
      return res;
    } catch (err: any) {
      // Amplify often throws TypeError for network/preflight and rich objects otherwise
      console.error('GraphQL Error Details:', {
        operation: opName,
        errorName: err?.name,
        errorMessage: err?.message,
        errors: err?.errors,
        stack: err?.stack,
        response: err?.response,
        cause: err?.cause
      });
      logger.error(`GraphQL operation failed: ${opName}`, {
        operation: opName,
        errorName: err?.name,
        errorMessage: err?.message,
        errors: err?.errors,
        stack: err?.stack,
      });

      if (err?.response && typeof err.response.text === 'function') {
        try {
          const text = await err.response.text();
          logger.error('Raw GraphQL error response:', { operation: opName, rawResponse: text });
        } catch {}
      }
      throw err;
    }
  };

  return client;
}


export async function graphqlRaw<T = any>(query: string, variables: any = {}, opts?: { quiet?: boolean }) {
  const operation = 'graphqlRaw';
  const endpoint = import.meta.env.VITE_APPSYNC_ENDPOINT || 'https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql';

  const getToken = () => {
    try {
      const raw = localStorage.getItem('auth');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.access_token as string | undefined;
    } catch {
      return undefined;
    }
  };

  const execute = async (token: string) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
    let json: any = {};
    try { json = await res.json(); } catch {}
    return { res, json } as const;
  };

  const shouldRetryAuth = (status: number, json: any) => {
    if (status === 401) return true;
    const msg = json?.errors?.[0]?.message || '';
    return /unauthorized|not authorized|no auth token/i.test(msg);
  };

  let token = getToken();
  if (!token) throw new Error('NO_TOKEN');

  logger.debug('Executing raw GraphQL query', { operation, endpoint });
  let { res, json } = await execute(token);
  logger.debug('Raw GraphQL response', { operation, status: res.status, headers: Object.fromEntries(res.headers.entries()), responseJson: json });

  if (!res.ok || json.errors?.length) {
    if (shouldRetryAuth(res.status, json)) {
      try {
        await renewToken();
        token = getToken();
        if (token) {
          ({ res, json } = await execute(token));
          logger.debug('Raw GraphQL response (retry)', { operation, status: res.status, responseJson: json });
        }
      } catch (e) {
        if (!opts?.quiet) logger.error('Token renew failed', { operation, error: (e as any)?.message });
      }
    }
  }

  if (!res.ok || json.errors?.length) {
    if (!opts?.quiet) logger.error('Raw GraphQL query failed', { operation, status: res.status, statusText: res.statusText, errors: json.errors, data: json.data });
    throw Object.assign(new Error('GraphQL error'), { response: res, errors: json.errors, data: json.data });
  }
  return json.data as T;
}

export async function createUser(input: CreateUserInput) {
  const base = getApiBase();
  const apiKey = import.meta.env.VITE_API_GATEWAY_KEY;
  if (!base) throw new Error('API base URL not configured');
  const url = base.replace(/\/$/, '') + '/users/signup';
  // Status handling: if the feature flag is OFF, treat
  // 'email confirmation pending' as active to bypass confirmation.
  let status = input.status ?? 'active';
  if (!emailConfirmationEnabled && status === 'email confirmation pending') {
    status = 'active';
  }

  const payload: any = {
    provider: 'local',
    email: input.email,
    password: input.password,
    name: input.fullName,
    role: input.role,
    // pass through optional profile fields if present
    nickname: input.nickname,
    birthDate: input.birthDate,
    country: input.country,
    language: input.language,
    gender: input.gender,
    pronouns: input.pronouns,
    bio: input.bio,
    tags: input.tags,
    subscriptionTier: input.subscriptionTier,
    status
  };
  const headers: Record<string,string> = { 'content-type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Signup failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body;
}

export interface LoginResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const base = getApiBase();
  const apiKey = import.meta.env.VITE_API_GATEWAY_KEY;
  if (!base) throw new Error('API base URL not configured');
  const url = base.replace(/\/$/, '') + '/users/login';
  const headers: Record<string,string> = { 'content-type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password })
  });
  const text = await res.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Login failed';
    // Dev escape hatch: when email confirmation is disabled, allow login
    // for accounts that are pending email confirmation by issuing a
    // short-lived local token. This only affects frontend behavior.
    if (!emailConfirmationEnabled && /confirm|verification|verify|pending/i.test(String(msg))) {
      const header = { alg: 'none', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: email, email, role: 'user', user_type: 'user', exp: now + 3600 };
      const b64 = (o: any) => btoa(JSON.stringify(o)).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
      const token = b64(header) + '.' + b64(payload) + '.devsig';
      return { token_type: 'Bearer', access_token: token, id_token: token, expires_in: 3600 } as LoginResponse;
    }
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body as LoginResponse;
}

// Simulated user-service confirmEmail call
export async function confirmEmail(email: string) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      logger.info(`Confirmation email sent to ${email}`, { operation: 'confirmEmail' });
      resolve();
    }, 500);
  });
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  const data = await graphqlWithApiKey<{ isEmailAvailable: boolean }>(IS_EMAIL_AVAILABLE, { email });
  return Boolean(data?.isEmailAvailable);
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const data = await graphqlWithApiKey<{ isNicknameAvailable: boolean }>(IS_NICKNAME_AVAILABLE, { nickname });
  return Boolean(data?.isNicknameAvailable);
}

export async function isNicknameAvailableForUser(nickname: string): Promise<boolean> {
  try {
    const data = await graphqlRaw<{ isNicknameAvailableForUser: boolean }>(IS_NICKNAME_AVAILABLE_FOR_USER, { nickname });
    return Boolean(data?.isNicknameAvailableForUser);
  } catch (e: any) {
    logger.error('GraphQL error in isNicknameAvailableForUser', { 
        operation: 'isNicknameAvailableForUser',
        error: e?.errors || e?.message || e 
    });
    throw new Error(e?.message || 'Failed to check nickname availability');
  }
}



export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
  challenge_token?: string | null;
}

export async function changePassword(input: ChangePasswordInput): Promise<LoginResponse> {
  // Use authFetch to include Authorization header automatically
  const res = await authFetch('/password/change', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      current_password: input.current_password,
      new_password: input.new_password,
      challenge_token: input.challenge_token || undefined,
    }),
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Password change failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  try { localStorage.setItem('auth', JSON.stringify(body)); window.dispatchEvent(new CustomEvent('auth:change')); } catch {}
  return body as LoginResponse;
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  const apiKey = import.meta.env.VITE_API_GATEWAY_KEY;
  const url = input.startsWith('http') ? input : (base.replace(/\/$/, '') + (input.startsWith('/') ? input : '/' + input));
  // Sliding expiration: proactively renew if expiring within 5 minutes
  const exp = getTokenExpiry();
  const now = Math.floor(Date.now() / 1000);
  if (exp && exp - now < 300) {
    try {
      await renewToken();
    } catch (e) {
      // Clear invalid token
      try { localStorage.removeItem('auth'); window.dispatchEvent(new CustomEvent('auth:change')); } catch {}
    }
  }
  const token = getAccessToken();
  const headers = new Headers(init.headers as any);
  headers.set('content-type', headers.get('content-type') || 'application/json');
  if (apiKey) headers.set('x-api-key', apiKey);
  if (token) headers.set('authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

export interface NotificationPreferences {
  questStarted: boolean;
  questCompleted: boolean;
  questFailed: boolean;
  progressMilestones: boolean;
  deadlineWarnings: boolean;
  streakAchievements: boolean;
  challengeUpdates: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'partner' | 'patron';
  fullName?: string;
  nickname?: string;
  birthDate?: string;
  status: string;
  country?: string;
  language: string;
  gender?: string;
  pronouns?: string;
  bio?: string;
  tags: string[];
  tier: string;
  provider: string;
  email_confirmed: boolean;
  notificationPreferences?: NotificationPreferences;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileUpdateInput {
  fullName?: string;
  nickname?: string;
  birthDate?: string;
  country?: string;
  language?: string;
  gender?: string;
  pronouns?: string;
  bio?: string;
  tags?: string[];
  notificationPreferences?: NotificationPreferences;
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await authFetch('/profile', {
    method: 'GET',
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Failed to get profile';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body as UserProfile;
}

export async function updateUserProfile(input: ProfileUpdateInput): Promise<UserProfile> {
  const res = await authFetch('/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Failed to update profile';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body as UserProfile;
}

export { getAccessToken, renewToken, getTokenExpiry, getUserIdFromToken } from '@/lib/utils';;
export { getActiveGoalsCountForUser } from '@/lib/apiGoal';
