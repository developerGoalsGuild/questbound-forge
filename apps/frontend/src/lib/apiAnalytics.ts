import { QuestAnalytics, AnalyticsPeriod } from '@/models/analytics';
import { getAccessToken, getApiBase } from '@/lib/utils';

const API_BASE_URL = getApiBase();

export async function getQuestAnalytics(
  period: AnalyticsPeriod = 'weekly',
  forceRefresh: boolean = false
): Promise<QuestAnalytics> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = `${API_BASE_URL}/quests/analytics?period=${period}&force_refresh=${forceRefresh}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to fetch analytics';
    console.error('Analytics API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      url,
      period,
      forceRefresh,
      timestamp: new Date().toISOString()
    });
    throw new Error(message);
  }

  return response.json();
}

export async function refreshQuestAnalytics(period: AnalyticsPeriod): Promise<QuestAnalytics> {
  return getQuestAnalytics(period, true);
}
