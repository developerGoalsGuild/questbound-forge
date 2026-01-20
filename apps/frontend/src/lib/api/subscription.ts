/**
 * API client for subscription features.
 *
 * This module provides functions for managing subscriptions, credits, and billing.
 */

import { getAccessToken, getApiBase } from '@/lib/utils';
import { logger } from '@/lib/logger';

const API_BASE = getApiBase();

export type SubscriptionTier = 'INITIATE' | 'JOURNEYMAN' | 'SAGE' | 'GUILDMASTER';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired';

export interface SubscriptionResponse {
  subscription_id?: string | null;
  plan_tier?: SubscriptionTier | null;
  status?: SubscriptionStatus | null;
  stripe_customer_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  has_active_subscription: boolean;
}

export interface CreateCheckoutRequest {
  plan_tier: SubscriptionTier;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutSessionResponse {
  session_id: string;
  url: string;
}

export interface CancelSubscriptionRequest {
  cancel_at_period_end?: boolean;
}

export interface CancelSubscriptionResponse {
  subscription_id: string;
  status: SubscriptionStatus;
  cancel_at_period_end: boolean;
}

export interface UpdatePlanRequest {
  plan_tier: SubscriptionTier;
  change_timing?: 'immediate' | 'period_end';
}

export interface UpdatePlanResponse {
  subscription_id: string;
  plan_tier: SubscriptionTier;
  status: SubscriptionStatus;
  cancel_at_period_end: boolean;
}

export interface CreditBalanceResponse {
  balance: number;
  last_top_up?: string | null;
  last_reset?: string | null;
}

export interface TopUpCreditsRequest {
  amount: number;
}

export interface BillingPortalResponse {
  url: string;
}

/**
 * Get authentication headers
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const apiKey = import.meta.env.VITE_API_GATEWAY_KEY || '';
  
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
    'x-api-key': apiKey,
  };
}

/**
 * Get current user's subscription
 */
export async function getCurrentSubscription(): Promise<SubscriptionResponse> {
  try {
    const url = `${API_BASE}/subscriptions/current`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 403) {
      const errorBody = await response.json().catch(() => ({}));
      logger.warn('Subscription access forbidden, returning empty subscription', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        timestamp: new Date().toISOString(),
      });
      return {
        subscription_id: null,
        plan_tier: null,
        status: null,
        stripe_customer_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        has_active_subscription: false,
      };
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to get subscription';
      logger.error('Failed to get subscription', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        timestamp: new Date().toISOString(),
      });
      throw new Error(message);
    }

    return await response.json();
  } catch (error: any) {
    logger.error('Error getting subscription', { error: error.message });
    throw error;
  }
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  planTier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSessionResponse> {
  try {
    const url = `${API_BASE}/subscriptions/create-checkout`;
    const payload: CreateCheckoutRequest = {
      plan_tier: planTier,
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to create checkout session';
      logger.error('Failed to create checkout session', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        payload,
        timestamp: new Date().toISOString(),
      });
      throw new Error(message);
    }

    return await response.json();
  } catch (error: any) {
    logger.error('Error creating checkout session', { error: error.message });
    throw error;
  }
}

/**
 * Cancel current subscription
 */
export async function cancelSubscription(
  payload: CancelSubscriptionRequest = {}
): Promise<CancelSubscriptionResponse> {
  try {
    const url = `${API_BASE}/subscriptions/cancel`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to cancel subscription';
      logger.error('Failed to cancel subscription', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        timestamp: new Date().toISOString(),
      });
      throw new Error(message);
    }
    return (await response.json()) as CancelSubscriptionResponse;
  } catch (error: any) {
    logger.error('Error canceling subscription', { error: error.message });
    throw error;
  }
}

/**
 * Update subscription plan
 */
export async function updateSubscriptionPlan(
  payload: UpdatePlanRequest
): Promise<UpdatePlanResponse> {
  try {
    const url = `${API_BASE}/subscriptions/update-plan`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to update subscription plan';
      logger.error('Failed to update subscription plan', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        payload,
        timestamp: new Date().toISOString(),
      });
      throw new Error(message);
    }

    return (await response.json()) as UpdatePlanResponse;
  } catch (error: any) {
    logger.error('Error updating subscription plan', { error: error.message });
    throw error;
  }
}

/**
 * Get billing portal URL
 */
export async function getBillingPortalUrl(returnUrl: string): Promise<string | null> {
  try {
    const url = `${API_BASE}/subscriptions/portal?return_url=${encodeURIComponent(returnUrl)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        logger.warn('Billing portal access forbidden, returning null', {
          status: response.status,
          statusText: response.statusText,
          url,
          timestamp: new Date().toISOString(),
        });
        return null;
      }
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to get billing portal URL';
      logger.error('Failed to get billing portal URL', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        timestamp: new Date().toISOString(),
      });
      throw new Error(message);
    }

    const data: BillingPortalResponse = await response.json();
    return data.url;
  } catch (error: any) {
    logger.error('Error getting billing portal URL', { error: error.message });
    throw error;
  }
}

/**
 * Get credit balance
 */
export async function getCreditBalance(): Promise<CreditBalanceResponse> {
  try {
    const url = `${API_BASE}/credits/balance`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        logger.warn('Credit balance access forbidden, returning empty balance', {
          status: response.status,
          statusText: response.statusText,
          url,
          timestamp: new Date().toISOString(),
        });
        return {
          balance: 0,
          last_top_up: null,
          last_reset: null,
        };
      }
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to get credit balance';
      logger.error('Failed to get credit balance', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        timestamp: new Date().toISOString(),
      });
      throw new Error(message);
    }

    return await response.json();
  } catch (error: any) {
    logger.error('Error getting credit balance', { error: error.message });
    throw error;
  }
}

/**
 * Top up credits
 */
export async function topUpCredits(amount: number): Promise<CreditBalanceResponse> {
  try {
    const url = `${API_BASE}/credits/topup`;
    const payload: TopUpCreditsRequest = { amount };

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to top up credits';
      logger.error('Failed to top up credits', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url,
        payload,
        timestamp: new Date().toISOString(),
      });
      throw new Error(message);
    }

    return await response.json();
  } catch (error: any) {
    logger.error('Error topping up credits', { error: error.message });
    throw error;
  }
}

