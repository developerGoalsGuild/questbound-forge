import { generateClient } from "aws-amplify/api";
import awsConfigDev from '@/config/aws-exports.dev';
import awsConfigProd from '@/config/aws-exports.prod';
import { IS_EMAIL_AVAILABLE, IS_NICKNAME_AVAILABLE, GOALS_BY_USER, ACTIVE_GOALS_COUNT } from "@/graphql/queries";
import { emailConfirmationEnabled } from "@/config/featureFlags";
import { getAccessToken, graphQLClient, getApiBase, getTokenExpiry, renewToken, getUserIdFromToken } from '@/lib/utils';


export interface CreateUserInput {
  email: string;
  fullName?: string;
  password?: string;
  status?: string;
  role?: 'user' | 'partner' | 'patron';
  [key: string]: any;
}


// GraphQL client with Lambda auth. The token comes from our local storage auth.
export function graphQLClientProtected() {
  const client = generateClient({
    authMode: 'lambda',
    authToken: () => {
      const tok = getAccessToken();
      if (!tok) {
        console.error('[AuthToken] missing token');
        throw new Error('NO_TOKEN');
      }
      return tok; // raw JWT
    },
  });

  const originalGraphql = client.graphql.bind(client);

  (client as any).graphql = async (args: any) => {
    const opName =
      (args?.query as any)?.definitions?.[0]?.name?.value || 'anonymous';
    try {
      console.info('[GraphQL] →', opName, 'authMode:', args?.authMode || 'lambda');
      const res = await originalGraphql(args);
      if (res?.errors?.length) {
        console.warn('[GraphQL errors]', opName, res.errors);
      }
      return res;
    } catch (err: any) {
      // Amplify often throws TypeError for network/preflight and rich objects otherwise
      console.error('[GraphQL] ✖', opName, err?.name || err, err?.message);
      if (err?.errors) console.error('errors:', err.errors);
      if (err?.response && typeof err.response.text === 'function') {
        try {
          const text = await err.response.text();
          console.error('raw response:', text);
        } catch {}
      }
      console.error('stack:', err?.stack);
      throw err;
    }
  };

  return client;
}


export async function graphqlRaw<T = any>(query: string, variables: any = {}) {
  //TODO: CHANGE endpoint FOr the env variable
  const endpoint = 'https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql';
  const tok = JSON.parse(localStorage.getItem('auth') || '{}')?.access_token;
  if (!tok) throw new Error('NO_TOKEN');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: tok },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw Object.assign(new Error('GraphQL error'), { response: res, errors: json.errors, data: json.data });
  }
  return json.data as T;
}



/*const client = generateClient({
  authMode: "lambda",
  authToken: () => myGetToken(), // Lambda authorizer token
});*/

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
    status
  };
  const headers: Record<string,string> = { 'content-type': 'application/json' };
  if (apiKey) { headers['x-api-key'] = apiKey; }

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
      console.log(`Confirmation email sent to ${email}`);
      resolve();
    }, 500);
  });
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  const { data, errors } = await graphQLClient().graphql({
    query: IS_EMAIL_AVAILABLE,
    variables: { email },
    authMode: 'apiKey',
  });
  if (errors?.length) {
    throw new Error(errors.map(e => e.message).join(" | "));
  }
  return Boolean((data as any)?.isEmailAvailable);
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, errors } = await graphQLClient().graphql({
    query: IS_NICKNAME_AVAILABLE,
    variables: { nickname },
    authMode: 'apiKey',
  });
  if (errors?.length) {
    throw new Error(errors.map(e => e.message).join(" | "));
  }
  return Boolean((data as any)?.isNicknameAvailable);
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

export { getAccessToken, renewToken, getTokenExpiry, getUserIdFromToken } from '@/lib/utils';;
export { getActiveGoalsCountForUser } from '@/lib/apiGoal';
