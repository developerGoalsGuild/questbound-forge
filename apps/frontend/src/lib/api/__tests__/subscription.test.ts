/**
 * Subscription API Client Tests
 *
 * Comprehensive unit tests for the subscription API client functions,
 * including mock implementations and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentSubscription,
  createCheckoutSession,
  cancelSubscription,
  updateSubscriptionPlan,
  getBillingPortalUrl,
  getCreditBalance,
  topUpCredits,
  SubscriptionTier,
} from '../subscription';

// Mock the utils module
vi.mock('@/lib/utils', () => ({
  getAccessToken: vi.fn(() => 'mock-token'),
  getApiBase: vi.fn(() => '/v1'),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_GATEWAY_KEY: 'mock-api-key',
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Subscription API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentSubscription', () => {
    it('should fetch current subscription successfully', async () => {
      const mockSubscription = {
        subscription_id: 'sub_123',
        plan_tier: 'JOURNEYMAN' as SubscriptionTier,
        status: 'active',
        stripe_customer_id: 'cus_123',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        cancel_at_period_end: false,
        has_active_subscription: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      });

      const result = await getCurrentSubscription();

      expect(result).toEqual(mockSubscription);
      expect(global.fetch).toHaveBeenCalledWith(
        '/v1/subscriptions/current',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
            'x-api-key': 'mock-api-key',
          }),
        })
      );
    });

    it('should return empty subscription on forbidden response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ detail: 'Forbidden' }),
      });

      const result = await getCurrentSubscription();

      expect(result).toEqual({
        subscription_id: null,
        plan_tier: null,
        status: null,
        stripe_customer_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        has_active_subscription: false,
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Subscription not found' }),
      });

      await expect(getCurrentSubscription()).rejects.toThrow('Subscription not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getCurrentSubscription()).rejects.toThrow('Network error');
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockSession = {
        session_id: 'cs_123',
        url: 'https://checkout.stripe.com/cs_123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      });

      const result = await createCheckoutSession(
        'JOURNEYMAN',
        'https://example.com/success',
        'https://example.com/cancel'
      );

      expect(result).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalledWith(
        '/v1/subscriptions/create-checkout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            plan_tier: 'JOURNEYMAN',
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
          }),
        })
      );
    });

    it('should handle checkout creation errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Invalid plan tier' }),
      });

      await expect(
        createCheckoutSession('INVALID', 'https://example.com/success', 'https://example.com/cancel')
      ).rejects.toThrow('Invalid plan tier');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const mockResponse = {
        subscription_id: 'sub_123',
        status: 'canceled',
        cancel_at_period_end: true,
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(cancelSubscription()).resolves.toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/v1/subscriptions/cancel',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        })
      );
    });

    it('should handle cancellation errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Cannot cancel inactive subscription' }),
      });

      await expect(cancelSubscription()).rejects.toThrow('Cannot cancel inactive subscription');
    });
  });

  describe('updateSubscriptionPlan', () => {
    it('should update subscription plan successfully', async () => {
      const mockResponse = {
        subscription_id: 'sub_123',
        plan_tier: 'SAGE',
        status: 'active',
        cancel_at_period_end: false,
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateSubscriptionPlan({ plan_tier: 'SAGE', change_timing: 'immediate' });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/v1/subscriptions/update-plan',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ plan_tier: 'SAGE', change_timing: 'immediate' }),
        })
      );
    });

    it('should handle update plan errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Already on selected plan' }),
      });

      await expect(
        updateSubscriptionPlan({ plan_tier: 'SAGE', change_timing: 'immediate' })
      ).rejects.toThrow('Already on selected plan');
    });
  });

  describe('getBillingPortalUrl', () => {
    it('should get billing portal URL successfully', async () => {
      const mockResponse = {
        url: 'https://billing.stripe.com/p/portal_123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getBillingPortalUrl('https://example.com/return');

      expect(result).toBe(mockResponse.url);
      expect(global.fetch).toHaveBeenCalledWith(
        '/v1/subscriptions/portal?return_url=https%3A%2F%2Fexample.com%2Freturn',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle portal URL errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'No customer found' }),
      });

      await expect(getBillingPortalUrl('https://example.com/return')).rejects.toThrow('No customer found');
    });

    it('should return null when portal access is forbidden', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ detail: 'Forbidden' }),
      });

      await expect(getBillingPortalUrl('https://example.com/return')).resolves.toBeNull();
    });
  });

  describe('getCreditBalance', () => {
    it('should get credit balance successfully', async () => {
      const mockBalance = {
        balance: 100,
        last_top_up: '2024-01-01T00:00:00Z',
        last_reset: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBalance,
      });

      const result = await getCreditBalance();

      expect(result).toEqual(mockBalance);
      expect(global.fetch).toHaveBeenCalledWith(
        '/v1/credits/balance',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle balance fetch errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Database error' }),
      });

      await expect(getCreditBalance()).rejects.toThrow('Database error');
    });

    it('should return empty balance when forbidden', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ detail: 'Forbidden' }),
      });

      await expect(getCreditBalance()).resolves.toEqual({
        balance: 0,
        last_top_up: null,
        last_reset: null,
      });
    });
  });

  describe('topUpCredits', () => {
    it('should top up credits successfully', async () => {
      const mockResponse = {
        balance: 150,
        last_top_up: '2024-01-02T00:00:00Z',
        last_reset: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await topUpCredits(50);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/v1/credits/topup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ amount: 50 }),
        })
      );
    });

    it('should handle top-up errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Invalid amount' }),
      });

      await expect(topUpCredits(-10)).rejects.toThrow('Invalid amount');
    });

    it('should handle minimum amount validation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Minimum amount is 10 credits' }),
      });

      await expect(topUpCredits(5)).rejects.toThrow('Minimum amount is 10 credits');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing token gracefully', async () => {
      const { getAccessToken } = await import('@/lib/utils');
      vi.mocked(getAccessToken).mockReturnValueOnce(null as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Unauthorized' }),
      });

      await expect(getCurrentSubscription()).rejects.toThrow('Unauthorized');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(getCurrentSubscription()).rejects.toThrow();
    });
  });
});

