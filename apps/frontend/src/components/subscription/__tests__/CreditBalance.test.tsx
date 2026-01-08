/**
 * CreditBalance Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { CreditBalance } from '../CreditBalance';
import { getCreditBalance } from '@/lib/api/subscription';

// Mock the API
vi.mock('@/lib/api/subscription', () => ({
  getCreditBalance: vi.fn(),
}));

// Mock the translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      subscription: {
        credits: {
          title: 'Credit Balance',
          balance: 'Balance',
          credits: 'credits',
          lastTopUp: 'Last Top-Up',
          lastReset: 'Last Reset',
          insufficient: 'Insufficient Credits',
          buyMore: 'Buy More Credits',
          balanceFailed: 'Failed to load credit balance',
        },
      },
    },
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('CreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    vi.mocked(getCreditBalance).mockImplementation(() => new Promise(() => {}));

    const { container } = render(
      <TestWrapper>
        <CreditBalance />
      </TestWrapper>
    );

    expect(screen.getByText('Credit Balance')).toBeInTheDocument();
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should display credit balance', async () => {
    const mockBalance = {
      balance: 100,
      last_top_up: '2024-01-01T00:00:00Z',
      last_reset: '2024-01-01T00:00:00Z',
    };

    vi.mocked(getCreditBalance).mockResolvedValueOnce(mockBalance);

    render(
      <TestWrapper>
        <CreditBalance />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('100').length).toBeGreaterThan(0);
      expect(screen.getByText(/credits/i)).toBeInTheDocument();
    });
  });

  it('should display zero balance warning', async () => {
    const mockBalance = {
      balance: 0,
      last_top_up: null,
      last_reset: null,
    };

    vi.mocked(getCreditBalance).mockResolvedValueOnce(mockBalance);

    render(
      <TestWrapper>
        <CreditBalance />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getByText(/Insufficient Credits/i)).toBeInTheDocument();
    });
  });

  it('should display error state', async () => {
    vi.mocked(getCreditBalance).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <TestWrapper>
        <CreditBalance />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load credit balance/i)).toBeInTheDocument();
    });
  });

  it('should hide last top-up when showLastTopUp is false', async () => {
    const mockBalance = {
      balance: 100,
      last_top_up: '2024-01-01T00:00:00Z',
      last_reset: null,
    };

    vi.mocked(getCreditBalance).mockResolvedValueOnce(mockBalance);

    render(
      <TestWrapper>
        <CreditBalance showLastTopUp={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('100').length).toBeGreaterThan(0);
      expect(screen.queryByText(/Last Top-Up/i)).not.toBeInTheDocument();
    });
  });

  it('should hide last reset when showLastReset is false', async () => {
    const mockBalance = {
      balance: 100,
      last_top_up: null,
      last_reset: '2024-01-01T00:00:00Z',
    };

    vi.mocked(getCreditBalance).mockResolvedValueOnce(mockBalance);

    render(
      <TestWrapper>
        <CreditBalance showLastReset={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('100').length).toBeGreaterThan(0);
      expect(screen.queryByText(/Last Reset/i)).not.toBeInTheDocument();
    });
  });
});

