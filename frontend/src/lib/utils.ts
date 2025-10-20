import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateClient } from "aws-amplify/api";
import awsConfigDev from '@/config/aws-exports.dev';
import awsConfigProd from '@/config/aws-exports.prod';
import { logger } from "./logger";



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

export async function renewToken(): Promise<LoginResponse> {
  const base = getApiBase();
  const apiKey = import.meta.env.VITE_API_GATEWAY_KEY;
  const url = base.replace(/\/$/, '') + '/auth/renew';
  const token = getAccessToken();
  const headers: Record<string,string> = { 'content-type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  if (token) headers['authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Renew failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  try { localStorage.setItem('auth', JSON.stringify(body)); window.dispatchEvent(new CustomEvent('auth:change')); } catch {}
  return body as LoginResponse;
}









// GraphQL client with Lambda auth. The token comes from our local storage auth.
export function graphQLClient() {
  const cfg = import.meta.env.PROD ? awsConfigProd : awsConfigDev;
  try {
    // Log the resolved GraphQL endpoint used by Amplify
    logger.debug('AppSync GraphQL endpoint', { endpoint: cfg?.API?.GraphQL?.endpoint });
  } catch {}

  const haveApiKey = !!(import.meta.env.VITE_APPSYNC_API_KEY as string | undefined);
  // Use the configured Amplify instance - it will use the endpoint from awsConfig
  const client = haveApiKey
    ? generateClient({ authMode: 'apiKey' })
    : generateClient({
        authMode: 'lambda',
        authToken: (() => {
          const tok = getAccessToken();
          if (!tok) {
            logger.error('AuthToken missing for GraphQL client');
            throw new Error('NO_TOKEN');
          }
          return tok; // raw JWT without Bearer prefix
        })(),
      });

  const originalGraphql = client.graphql.bind(client);
  (client as any).graphql = async (args: any) => {
    const opName = (args?.query as any)?.definitions?.[0]?.name?.value || 'anonymous';
    logger.debug('GraphQL request', { 
        endpoint: cfg?.API?.GraphQL?.endpoint, 
        operation: opName, 
        authMode: args?.authMode || 'lambda' 
    });
    return originalGraphql(args);
  };

  return client;
}



