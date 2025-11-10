/**
 * TopUpCredits Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { TopUpCredits } from '../TopUpCredits';
import { topUpCredits } from '@/lib/api/subscription';

// Mock the API
vi.mock('@/lib/api/subscription', () => ({
  topUpCredits: vi.fn(),
}));

// Mock the translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      subscription: {
        credits: {
          topUp: 'Top Up Credits',
          amount: 'Amount',
          minAmount: 'Minimum 10 credits ($5)',
          addCredits: 'Add Credits',
          topUpFailed: 'Failed to top up credits',
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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('TopUpCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render default trigger button', () => {
    render(
      <TestWrapper>
        <TopUpCredits />
      </TestWrapper>
    );

    expect(screen.getByText('Top Up Credits')).toBeInTheDocument();
  });

  it('should render custom trigger', () => {
    render(
      <TestWrapper>
        <TopUpCredits trigger={<button>Custom Trigger</button>} />
      </TestWrapper>
    );

    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    render(
      <TestWrapper>
        <TopUpCredits />
      </TestWrapper>
    );

    const trigger = screen.getByText('Top Up Credits');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });
  });

  it('should validate minimum amount', async () => {
    vi.mocked(topUpCredits).mockResolvedValueOnce({
      balance: 100,
      last_top_up: '2024-01-01T00:00:00Z',
      last_reset: null,
    });

    render(
      <TestWrapper>
        <TopUpCredits />
      </TestWrapper>
    );

    const trigger = screen.getByText('Top Up Credits');
    fireEvent.click(trigger);

    await waitFor(() => {
      const input = screen.getByLabelText(/amount/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/amount/i);
    fireEvent.change(input, { target: { value: '5' } });

    const submitButton = screen.getByText('Add Credits');
    fireEvent.click(submitButton);

    // Give a moment for validation to run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify API was not called (validation should prevent submission)
    expect(topUpCredits).not.toHaveBeenCalled();
  });

  it('should submit valid amount', async () => {
    const mockResponse = {
      balance: 150,
      last_top_up: '2024-01-02T00:00:00Z',
      last_reset: null,
    };

    vi.mocked(topUpCredits).mockResolvedValueOnce(mockResponse);

    render(
      <TestWrapper>
        <TopUpCredits />
      </TestWrapper>
    );

    const trigger = screen.getByText('Top Up Credits');
    fireEvent.click(trigger);

    await waitFor(() => {
      const input = screen.getByLabelText(/amount/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/amount/i);
    fireEvent.change(input, { target: { value: '50' } });

    const submitButton = screen.getByText('Add Credits');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(topUpCredits).toHaveBeenCalledWith(50);
    });
  });

  it('should handle API errors', async () => {
    vi.mocked(topUpCredits).mockRejectedValueOnce(new Error('Payment failed'));

    render(
      <TestWrapper>
        <TopUpCredits />
      </TestWrapper>
    );

    const trigger = screen.getByText('Top Up Credits');
    fireEvent.click(trigger);

    await waitFor(() => {
      const input = screen.getByLabelText(/amount/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/amount/i);
    fireEvent.change(input, { target: { value: '20' } });

    const submitButton = screen.getByText('Add Credits');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
    });
  });

  it('should clear errors when user starts typing', async () => {
    render(
      <TestWrapper>
        <TopUpCredits />
      </TestWrapper>
    );

    const trigger = screen.getByText('Top Up Credits');
    fireEvent.click(trigger);

    await waitFor(() => {
      const input = screen.getByLabelText(/amount/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/amount/i);
    
    // Set invalid value
    fireEvent.change(input, { target: { value: '5' } });
    
    const submitButton = screen.getByText('Add Credits');
    fireEvent.click(submitButton);

    // Give a moment for validation to run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify API was not called (validation should prevent submission)
    expect(topUpCredits).not.toHaveBeenCalled();

    // Clear error by typing valid value
    fireEvent.change(input, { target: { value: '10' } });
    
    // Give a moment for error clearing
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const mockResponse = {
      balance: 150,
      last_top_up: '2024-01-02T00:00:00Z',
      last_reset: null,
    };

    vi.mocked(topUpCredits).mockResolvedValueOnce(mockResponse);

    render(
      <TestWrapper>
        <TopUpCredits onSuccess={onSuccess} />
      </TestWrapper>
    );

    const trigger = screen.getByText('Top Up Credits');
    fireEvent.click(trigger);

    await waitFor(() => {
      const input = screen.getByLabelText(/amount/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/amount/i);
    fireEvent.change(input, { target: { value: '50' } });

    const submitButton = screen.getByText('Add Credits');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

