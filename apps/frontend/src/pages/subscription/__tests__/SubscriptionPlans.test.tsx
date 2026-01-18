/**
 * SubscriptionPlans Page Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SubscriptionPlans from '../SubscriptionPlans';
import { getCurrentSubscription, createCheckoutSession } from '@/lib/api/subscription';

// Mock the API
vi.mock('@/lib/api/subscription', () => ({
  getCurrentSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  getCreditBalance: vi.fn(),
}));

// Mock the translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      subscription: {
        title: 'Subscription Plans',
        subtitle: 'Choose the plan that fits your goals',
        currentPlan: 'Current Plan',
        plans: {
          initiate: {
            name: 'Initiate',
            price: '$1',
            period: '/month',
            description: 'Perfect for getting started',
            features: ['10 video generation credits/month'],
            cta: 'Get Started',
            popular: false,
          },
          journeyman: {
            name: 'Journeyman',
            price: '$15',
            period: '/month',
            description: 'For serious goal achievers',
            features: ['100 video generation credits/month'],
            cta: 'Subscribe',
            popular: true,
          },
          sage: {
            name: 'Radiant Sage',
            price: '$49',
            period: '/month',
            description: 'Maximum productivity',
            features: ['500 video generation credits/month'],
            cta: 'Subscribe',
            popular: false,
          },
          guildmaster: {
            name: 'Guildmaster',
            price: 'Custom',
            period: '',
            description: 'Enterprise solutions',
            features: ['Unlimited credits'],
            cta: 'Contact Sales',
            popular: false,
          },
        },
        errors: {
          loadFailed: 'Failed to load subscription information',
          checkoutFailed: 'Failed to create checkout session',
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

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
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

describe('SubscriptionPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = 'http://localhost:3000';
  });

  it('should display loading state', () => {
    vi.mocked(getCurrentSubscription).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <SubscriptionPlans />
      </TestWrapper>
    );

    const skeletons = screen.getAllByRole('generic').filter((el) =>
      el.className.includes('animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display subscription plans', async () => {
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
        <SubscriptionPlans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Initiate')).toBeInTheDocument();
      expect(screen.getByText('Journeyman')).toBeInTheDocument();
      expect(screen.getByText('Radiant Sage')).toBeInTheDocument();
      expect(screen.getByText('Guildmaster')).toBeInTheDocument();
    });
  });

  it('should display current plan information', async () => {
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
        <SubscriptionPlans />
      </TestWrapper>
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Current Plan/i);
    expect(alert).toHaveTextContent(/Journeyman/i);
  });

  it('should create checkout session when plan is selected', async () => {
    const mockSubscription = {
      subscription_id: null,
      plan_tier: null,
      status: null,
      has_active_subscription: false,
      cancel_at_period_end: false,
    };

    const mockCheckoutSession = {
      session_id: 'cs_123',
      url: 'https://checkout.stripe.com/cs_123',
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);
    vi.mocked(createCheckoutSession).mockResolvedValueOnce(mockCheckoutSession);

    render(
      <TestWrapper>
        <SubscriptionPlans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Initiate')).toBeInTheDocument();
    });

    const initiateButton = screen.getAllByText('Get Started')[0];
    fireEvent.click(initiateButton);

    await waitFor(() => {
      expect(createCheckoutSession).toHaveBeenCalledWith(
        'INITIATE',
        expect.stringContaining('/subscription/success'),
        expect.stringContaining('/subscription')
      );
    });

    await waitFor(() => {
      expect(window.location.href).toBe(mockCheckoutSession.url);
    });
  });

  it('should handle checkout errors', async () => {
    const mockSubscription = {
      subscription_id: null,
      plan_tier: null,
      status: null,
      has_active_subscription: false,
      cancel_at_period_end: false,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);
    vi.mocked(createCheckoutSession).mockRejectedValueOnce(new Error('Checkout failed'));

    render(
      <TestWrapper>
        <SubscriptionPlans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Initiate')).toBeInTheDocument();
    });

    const initiateButton = screen.getAllByText('Get Started')[0];
    fireEvent.click(initiateButton);

    await waitFor(() => {
      expect(createCheckoutSession).toHaveBeenCalled();
    });
  });

  it('should display error message when subscription fetch fails', async () => {
    vi.mocked(getCurrentSubscription).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <TestWrapper>
        <SubscriptionPlans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load subscription information/i)).toBeInTheDocument();
    });
  });

  it('should show cancel at period end warning', async () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      plan_tier: 'JOURNEYMAN',
      status: 'active',
      has_active_subscription: true,
      cancel_at_period_end: true,
    };

    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(mockSubscription);

    render(
      <TestWrapper>
        <SubscriptionPlans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cancels at period end/i)).toBeInTheDocument();
    });
  });

  it('should disable current plan button', async () => {
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
        <SubscriptionPlans />
      </TestWrapper>
    );

    await waitFor(() => {
      const journeymanButton = screen.getAllByText('Current Plan').find(
        (btn) => btn.closest('button')?.disabled
      );
      expect(journeymanButton).toBeInTheDocument();
    });
  });
});

