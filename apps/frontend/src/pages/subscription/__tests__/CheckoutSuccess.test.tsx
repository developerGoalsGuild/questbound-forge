/**
 * CheckoutSuccess Page Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CheckoutSuccess from '../CheckoutSuccess';
import { getCurrentSubscription } from '@/lib/api/subscription';

// Mock the API
vi.mock('@/lib/api/subscription', () => ({
  getCurrentSubscription: vi.fn(),
}));

// Mock the translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      subscription: {
        checkout: {
          success: 'Payment Successful!',
          error: 'Payment error occurred',
          processing: 'Processing...',
          verifying: 'Verifying your subscription...',
          delayed: 'Payment delayed',
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

// Mock useSearchParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [
      new URLSearchParams('?session_id=cs_test_123'),
    ],
  };
});

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

describe('CheckoutSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    vi.mocked(getCurrentSubscription).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should display success message for active subscription', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      expect(screen.getByText(/successfully activated/i)).toBeInTheDocument();
    });
  });

  it('should stop polling after subscription becomes active', async () => {
    vi.useFakeTimers();
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    await vi.advanceTimersByTimeAsync(4000);

    expect(getCurrentSubscription).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should display verification message for inactive subscription', async () => {
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
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Verifying your subscription/i)).toBeInTheDocument();
    });
  });

  it('should display session ID', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/cs_test_123/i)).toBeInTheDocument();
    });
  });

  it('should display navigation buttons on success', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Subscription')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(getCurrentSubscription).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should still show loading or error state
      expect(screen.queryByText('Payment Successful!')).not.toBeInTheDocument();
    });
  });
});

