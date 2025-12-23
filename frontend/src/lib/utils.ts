import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateClient } from "aws-amplify/api";
import { print } from "graphql";
import awsConfigDev from '@/config/aws-exports.dev';
import awsConfigProd from '@/config/aws-exports.prod';
import { logger } from "./logger";
import type { AvailabilityKeyResponse, SubscriptionKeyResponse } from '@/types/appsync';



const KEY_REFRESH_BUFFER_MS = 60_000;

interface CachedKey {
  value: string;
  expiresAt: number;
}

let subscriptionKeyCache: CachedKey | null = null;
let availabilityKeyCache: CachedKey | null = null;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface LoginResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
}


export function getApiBase(): string {
  // In dev, use proxy to avoid CORS
  if (import.meta.env.DEV) return '/v1';
  
  // In production, use the full API Gateway URL
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (base && base.trim()) return base;
  
  return '';
}


// ---- Auth helpers for subsequent API calls ----
export function getStoredAuth(): LoginResponse | null {
  try {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) as LoginResponse : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  const a = getStoredAuth();
  if (!a) return null;
  // Prefer id_token for user profile claims when available
  return a.id_token || a.access_token || null;
}

function decodeJwt(token: string): any | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getTokenExpiry(): number | null {
  const tok = getAccessToken();
  if (!tok) return null;
  const claims = decodeJwt(tok);
  return typeof claims?.exp === 'number' ? claims.exp : null;
}

export function getUserIdFromToken(): string | null {
  const tok = getAccessToken();
  if (!tok) return null;
  const claims = decodeJwt(tok);
  if (!claims) return null;
  // Prefer a stable user id; fallback to sub/email if needed
  return (
    claims.sub ||
    claims.user_id ||
    claims.username ||
    claims.email ||
    null
  );
}


function buildApiUrl(path: string): string {
  const base = getApiBase().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

function resolveExpiryMs(value: string | null | undefined, fallbackMinutes: number): number {
  if (value && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now() + fallbackMinutes * 60_000;
}

function isCacheValid(cache: CachedKey | null): boolean {
  return !!cache && (cache.expiresAt - KEY_REFRESH_BUFFER_MS) > Date.now();
}

export async function renewToken(): Promise<LoginResponse> {
  const base = getApiBase();
  const apiKey = import.meta.env.VITE_API_GATEWAY_KEY;
  const url = base.replace(/\/$/, '') + '/auth/renew';
  const currentAuth = getStoredAuth();
  const tokenForRenew =
    currentAuth?.access_token ||
    currentAuth?.id_token ||
    (currentAuth as any)?.token ||
    null;

  if (!tokenForRenew) {
    throw new Error('Missing token for renewal');
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  headers['Authorization'] = `Bearer ${tokenForRenew}`;
  const refreshToken = currentAuth?.refresh_token;
  const payload: Record<string, string> = { access_token: tokenForRenew };
  if (refreshToken) {
    payload.refresh_token = refreshToken;
  }
  const res = await fetch(url, { 
    method: 'POST', 
    headers, 
    body: JSON.stringify(payload) 
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Renew failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  const mergedBody: LoginResponse = {
    ...(currentAuth || {}),
    ...body,
    refresh_token: body?.refresh_token || currentAuth?.refresh_token,
  };
  try {
    localStorage.setItem('auth', JSON.stringify(mergedBody));
    window.dispatchEvent(new CustomEvent('auth:change'));
  } catch {}
  return mergedBody;
}









export async function getSubscriptionApiKey(forceRefresh = false): Promise<string> {
  if (!forceRefresh && isCacheValid(subscriptionKeyCache)) {
    return subscriptionKeyCache.value;
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error('Missing access token');
  }

  const url = buildApiUrl('/appsync/subscription-key');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  });

  const textBody = await res.text();
  let payload: Partial<SubscriptionKeyResponse> = {};
  try {
    payload = textBody ? JSON.parse(textBody) : {};
  } catch (error) {
    logger.error('Failed to parse subscription key response', { error });
  }

  if (!res.ok) {
    const message = (payload as any)?.detail || (payload as any)?.message || res.statusText;
    logger.error('Subscription key fetch failed', { status: res.status, message });
    throw new Error(typeof message === 'string' && message ? message : 'Failed to fetch subscription key');
  }

  if (!payload.apiKey) {
    throw new Error('Subscription key unavailable');
  }

  const expiresAt = resolveExpiryMs(payload.expiresAt, 60);
  subscriptionKeyCache = { value: payload.apiKey, expiresAt };
  logger.debug('Subscription key refreshed', { expiresAt });
  return subscriptionKeyCache.value;
}

export async function getAvailabilityApiKey(forceRefresh = false): Promise<string> {
  if (!forceRefresh && isCacheValid(availabilityKeyCache)) {
    return availabilityKeyCache.value;
  }

  const url = buildApiUrl('/appsync/availability-key');
  const apiKey = import.meta.env.VITE_API_GATEWAY_KEY;
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    accept: 'application/json' 
  };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  const res = await fetch(url, {
    method: 'GET',
    headers,
  });

  const textBody = await res.text();
  let payload: Partial<AvailabilityKeyResponse> = {};
  try {
    payload = textBody ? JSON.parse(textBody) : {};
  } catch (error) {
    logger.error('Failed to parse availability key response', { error });
  }

  if (!res.ok) {
    const message = (payload as any)?.detail || (payload as any)?.message || res.statusText;
    // Use debug level for expected failures (e.g., API Gateway 403 in dev)
    // The availability check functions will handle this gracefully
    if (res.status === 403 || res.status === 401) {
      logger.debug('Availability key fetch failed (auth required)', { status: res.status, message });
    } else {
      logger.warn('Availability key fetch failed', { status: res.status, message });
    }
    throw new Error(typeof message === 'string' && message ? message : 'Failed to fetch availability key');
  }

  if (!payload.apiKey) {
    throw new Error('Availability key unavailable');
  }

  const expiresAt = resolveExpiryMs(payload.expiresAt, 15);
  availabilityKeyCache = { value: payload.apiKey, expiresAt };
  logger.debug('Availability key refreshed', { expiresAt });
  return availabilityKeyCache.value;
}

// GraphQL client with Lambda auth. The token comes from our local storage auth.
export function graphQLClient() {
  const cfg = import.meta.env.PROD ? awsConfigProd : awsConfigDev;
  try {
    // Log the resolved GraphQL endpoint used by Amplify
    logger.debug('AppSync GraphQL endpoint', { endpoint: cfg?.API?.GraphQL?.endpoint });
  } catch {}

  let lambdaClient: ReturnType<typeof generateClient> | null = null;
  const resolveLambdaClient = () => {
    if (!lambdaClient) {
      lambdaClient = generateClient({
        authMode: 'lambda',
        authToken: () => {
          const tok = getAccessToken();
          if (!tok) {
            logger.error('AuthToken missing for GraphQL client');
            throw new Error('NO_TOKEN');
          }
          return tok; // raw JWT without Bearer prefix
        },
      });
    }
    return lambdaClient;
  };

  return {
    graphql: async (args: any) => {
      const opName = (args?.query as any)?.definitions?.[0]?.name?.value || 'anonymous';
      const requestedMode = args?.authMode === 'apiKey' ? 'apiKey' : 'lambda';

      if (requestedMode === 'apiKey') {
        throw new Error('API key auth is restricted; use graphqlWithApiKey helper instead.');
      }

      logger.debug('GraphQL request', {
        endpoint: cfg?.API?.GraphQL?.endpoint,
        operation: opName,
        authMode: requestedMode,
      });
      const target = resolveLambdaClient();
      return target.graphql(args);
    },
  } as any;
}

export async function graphqlWithApiKey<T = any>(query: string | any, variables: any = {}) {
  const operation = 'graphqlWithApiKey';
  const endpoint = import.meta.env.VITE_APPSYNC_ENDPOINT as string | undefined;
  if (!endpoint || !endpoint.trim()) {
    throw new Error('AppSync endpoint not configured');
  }
  const apiKey = await getAvailabilityApiKey();
  
  // Validate API key format (AppSync API keys are typically base64-like strings)
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('AppSync API key is empty or invalid');
  }

  // Convert GraphQL DocumentNode to string if needed (for Apollo Client gql tags)
  let queryString: string;
  if (typeof query === 'string') {
    queryString = query;
  } else if (query && typeof query === 'object') {
    // Apollo Client DocumentNode - use GraphQL print to convert to string
    try {
      queryString = print(query);
    } catch (error) {
      logger.error('Failed to convert GraphQL query to string', { error });
      throw new Error('Invalid GraphQL query format - unable to convert to string');
    }
  } else {
    throw new Error('Invalid GraphQL query format');
  }

  logger.debug('Executing GraphQL query with API key', { 
    operation, 
    endpoint,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
    queryPreview: queryString.substring(0, 100) + '...',
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 
      'content-type': 'application/json', 
      'x-api-key': apiKey 
    },
    body: JSON.stringify({ query: queryString, variables }),
  });

  const json = await res.json();
  logger.debug('GraphQL with API key response', {
    operation,
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    responseJson: json,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
  });

  if (!res.ok || json.errors?.length) {
    const errorMessage = json.errors?.[0]?.message || json.message || res.statusText || 'GraphQL error';
    const errorDetails = json.errors?.[0] || {};
    logger.error('GraphQL query with API key failed', {
      operation,
      status: res.status,
      statusText: res.statusText,
      errors: json.errors,
      data: json.data,
      errorMessage,
      errorType: errorDetails.errorType || errorDetails.extensions?.errorType,
      errorInfo: errorDetails.extensions,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
    });
    throw Object.assign(new Error(errorMessage), { response: res, errors: json.errors, data: json.data });
  }
  return json.data as T;
}



