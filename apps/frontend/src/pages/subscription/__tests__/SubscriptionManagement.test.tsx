/**
 * SubscriptionManagement Page Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SubscriptionManagement from '../SubscriptionManagement';
import { getCurrentSubscription, cancelSubscription } from '@/lib/api/subscription';

// Mock the API
vi.mock('@/lib/api/subscription', () => ({
  getCurrentSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  getCreditBalance: vi.fn(),
}));

// Mock the translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      subscription: {
        billing: {
          title: 'Billing & Subscription',
          currentPlan: 'Current Plan',
          nextBilling: 'Next Billing Date',
          cancelAtPeriodEnd: 'Cancels at period end',
          cancelNow: 'Cancel Now',
          reactivate: 'Reactivate Subscription',
          manageBilling: 'Manage Billing',
          portal: 'Billing Portal',
        },
        active: 'Active',
        canceled: 'Canceled',
        errors: {
          loadFailed: 'Failed to load subscription information',
          cancelFailed: 'Failed to cancel subscription',
        },
      },
    },
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SubscriptionManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    vi.mocked(getCurrentSubscription).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    expect(screen.getByText('Billing & Subscription')).toBeInTheDocument();
  });

  it('should display active subscription', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      current_period_end: '2024-02-01T00:00:00Z',
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('JOURNEYMAN')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('should display no subscription message', async () => {
    const mockSubscription = {
      subscription_id: null,
      plan_tier: null,
      status: null,
      has_active_subscription: false,
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/don't have an active subscription/i)).toBeInTheDocument();
    });
  });

  it('should cancel subscription when confirmed', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      current_period_end: '2024-02-01T00:00:00Z',
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);
    vi.mocked(cancelSubscription).mockResolvedValueOnce();

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Cancel Now')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel Now');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/Cancel Subscription/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(cancelSubscription).toHaveBeenCalled();
    });
  });

  it('should handle cancellation errors', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      current_period_end: '2024-02-01T00:00:00Z',
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);
    vi.mocked(cancelSubscription).mockRejectedValueOnce(new Error('Cancellation failed'));

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Cancel Now')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel Now');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/Cancel Subscription/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(cancelSubscription).toHaveBeenCalled();
    });
  });

  it('should display cancel at period end warning', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      current_period_end: '2024-02-01T00:00:00Z',
      cancel_at_period_end: true,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cancels at period end/i)).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    vi.mocked(getCurrentSubscription).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load subscription information/i)).toBeInTheDocument();
    });
  });

  it('should show next billing date', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      current_period_end: '2024-02-01T00:00:00Z',
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <SubscriptionManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Next Billing Date/i)).toBeInTheDocument();
    });
  });
});

