/**
 * Gamification API client
 * Handles XP, levels, badges, challenges, and leaderboards
 */

import { getAccessToken, getApiBase } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_GAMIFICATION_API_URL || getApiBase() || '';
const API_KEY = import.meta.env.VITE_API_GATEWAY_KEY || '';

export interface XPSummary {
  userId: string;
  totalXp: number;
  currentLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  updatedAt: number;
}

export interface XPTransaction {
  amount: number;
  source: string;
  sourceId?: string;
  description: string;
  timestamp: number;
  eventId?: string;
}

export interface XPHistoryResponse {
  transactions: XPTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface LevelProgress {
  userId: string;
  totalXp: number;
  currentLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  updatedAt: number;
}

export interface LevelEvent {
  userId: string;
  level: number;
  totalXp: number;
  source?: string;
  awardedAt: number;
}

export interface LevelHistoryResponse {
  items: LevelEvent[];
  nextToken?: string | null;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  rarity: string;
  criteria?: Record<string, unknown>;
  createdAt?: number;
}

export interface UserBadge {
  badge: {
    userId: string;
    badgeId: string;
    earnedAt: number;
    progress?: number;
    metadata?: Record<string, unknown>;
  };
  definition: BadgeDefinition;
}

export interface BadgeListResponse {
  badges: UserBadge[];
  total: number;
}

type RequestInitWithBody = RequestInit & { body?: BodyInit | null };

async function authorizedRequest<T>(path: string, init: RequestInitWithBody = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-api-key': API_KEY,
    ...(init.headers || {}),
  };

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Operation failed';
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      url,
      input: init.body,
      timestamp: new Date().toISOString(),
    });
    throw new Error(message);
  }

  return response.json();
}

/**
 * Get current XP summary for authenticated user
 */
export async function getCurrentXP(): Promise<XPSummary> {
  return authorizedRequest<XPSummary>('/xp/current');
}

/**
 * Get XP transaction history
 */
export async function getXPHistory(limit: number = 50, offset: number = 0): Promise<XPHistoryResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return authorizedRequest<XPHistoryResponse>(`/xp/history?${params.toString()}`);
}

export async function getLevelProgress(): Promise<LevelProgress> {
  return authorizedRequest<LevelProgress>('/levels/me');
}

export async function getLevelHistory(limit: number = 20, nextToken?: string | null): Promise<LevelHistoryResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (nextToken) {
    params.set('nextToken', nextToken);
  }
  return authorizedRequest<LevelHistoryResponse>(`/levels/history?${params.toString()}`);
}

interface BadgeFilters {
  category?: string;
  rarity?: string;
}

function buildBadgeQuery(filters?: BadgeFilters): string {
  const params = new URLSearchParams();
  if (filters?.category) {
    params.set('category', filters.category);
  }
  if (filters?.rarity) {
    params.set('rarity', filters.rarity);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getMyBadges(filters?: BadgeFilters): Promise<BadgeListResponse> {
  return authorizedRequest<BadgeListResponse>(`/badges/me${buildBadgeQuery(filters)}`);
}

export async function getUserBadges(userId: string, filters?: BadgeFilters): Promise<BadgeListResponse> {
  return authorizedRequest<BadgeListResponse>(`/badges/${userId}${buildBadgeQuery(filters)}`);
}

export async function getBadgeCatalog(filters?: BadgeFilters): Promise<BadgeDefinition[]> {
  return authorizedRequest<BadgeDefinition[]>(`/badges${buildBadgeQuery(filters)}`);
}

