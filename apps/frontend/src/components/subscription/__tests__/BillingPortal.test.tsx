/**
 * BillingPortal Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { BillingPortal } from '../BillingPortal';
import { getBillingPortalUrl } from '@/lib/api/subscription';

// Mock the API
vi.mock('@/lib/api/subscription', () => ({
  getBillingPortalUrl: vi.fn(),
}));

// Mock the translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      subscription: {
        billing: {
          portal: 'Billing Portal',
          manageBilling: 'Manage Billing',
          portalFailed: 'Failed to access billing portal',
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
  href: 'http://localhost:3000/test',
  origin: 'http://localhost:3000',
  pathname: '/test',
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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('BillingPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = 'http://localhost:3000/test';
  });

  it('should render button variant by default', () => {
    render(
      <TestWrapper>
        <BillingPortal />
      </TestWrapper>
    );

    expect(screen.getByText('Manage Billing')).toBeInTheDocument();
  });

  it('should render link variant when specified', () => {
    render(
      <TestWrapper>
        <BillingPortal variant="link" />
      </TestWrapper>
    );

    expect(screen.getByText('Billing Portal')).toBeInTheDocument();
  });

  it('should open portal URL when clicked', async () => {
    const mockUrl = 'https://billing.stripe.com/p/portal_123';
    vi.mocked(getBillingPortalUrl).mockResolvedValueOnce(mockUrl);

    render(
      <TestWrapper>
        <BillingPortal />
      </TestWrapper>
    );

    const button = screen.getByText('Manage Billing');
    fireEvent.click(button);

    await waitFor(() => {
      expect(getBillingPortalUrl).toHaveBeenCalledWith('http://localhost:3000/test');
    });

    await waitFor(() => {
      expect(window.location.href).toBe(mockUrl);
    });
  });

  it('should use custom return URL when provided', async () => {
    const mockUrl = 'https://billing.stripe.com/p/portal_123';
    const customReturnUrl = 'https://example.com/custom';
    vi.mocked(getBillingPortalUrl).mockResolvedValueOnce(mockUrl);

    render(
      <TestWrapper>
        <BillingPortal returnUrl={customReturnUrl} />
      </TestWrapper>
    );

    const button = screen.getByText('Manage Billing');
    fireEvent.click(button);

    await waitFor(() => {
      expect(getBillingPortalUrl).toHaveBeenCalledWith(customReturnUrl);
    });
  });

  it('should show loading state while opening portal', async () => {
    const mockUrl = 'https://billing.stripe.com/p/portal_123';
    vi.mocked(getBillingPortalUrl).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockUrl), 100))
    );

    render(
      <TestWrapper>
        <BillingPortal />
      </TestWrapper>
    );

    const button = screen.getByText('Manage Billing');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Opening...')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    vi.mocked(getBillingPortalUrl).mockRejectedValueOnce(new Error('Failed to get portal URL'));

    render(
      <TestWrapper>
        <BillingPortal />
      </TestWrapper>
    );

    const button = screen.getByText('Manage Billing');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Failed to get portal URL/i)).toBeInTheDocument();
    });
  });

  it('should be disabled while loading', async () => {
    const mockUrl = 'https://billing.stripe.com/p/portal_123';
    vi.mocked(getBillingPortalUrl).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockUrl), 100))
    );

    render(
      <TestWrapper>
        <BillingPortal />
      </TestWrapper>
    );

    const button = screen.getByText('Manage Billing');
    fireEvent.click(button);

    await waitFor(() => {
      const disabledButton = screen.getByText('Opening...');
      expect(disabledButton).toBeDisabled();
    });
  });

  it('should render link variant with external icon', () => {
    render(
      <TestWrapper>
        <BillingPortal variant="link" />
      </TestWrapper>
    );

    const link = screen.getByText('Billing Portal');
    expect(link).toBeInTheDocument();
    // Check for external link icon
    const icon = link.parentElement?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

