/**
 * Gamification API client
 * Handles XP, levels, badges, challenges, and leaderboards
 */

import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_GAMIFICATION_API_URL || import.meta.env.VITE_API_GATEWAY_URL || '';

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

/**
 * Get current XP summary for authenticated user
 */
export async function getCurrentXP(): Promise<XPSummary> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = `${API_BASE_URL}/xp/current`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to get XP';
    throw new Error(message);
  }

  return response.json();
}

/**
 * Get XP transaction history
 */
export async function getXPHistory(limit: number = 50, offset: number = 0): Promise<XPHistoryResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = `${API_BASE_URL}/xp/history?limit=${limit}&offset=${offset}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to get XP history';
    throw new Error(message);
  }

  return response.json();
}

