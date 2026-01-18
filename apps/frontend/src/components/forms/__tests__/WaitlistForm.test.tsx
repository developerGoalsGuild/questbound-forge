/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import WaitlistForm from '../WaitlistForm';
import { subscribeToWaitlist } from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  subscribeToWaitlist: vi.fn(),
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      waitlist: {
        labels: { email: 'Email address' },
        placeholder: 'Enter your email',
        button: {
          submit: 'Join the Community',
          submitting: 'Joining...',
          success: 'Subscribed!',
        },
        validation: {
          emailRequired: 'Email is required',
          emailInvalid: 'Please enter a valid email address',
        },
        messages: {
          submitting: 'Submitting...',
          success: 'Thank you for joining! We\'ll be in touch soon.',
          error: 'Something went wrong. Please try again later.',
        },
        note: 'Join the community that\'s already changing lives.',
      },
    },
  }),
}));

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true,
}));

vi.mock('@/components/ui/ARIALiveRegion', () => ({
  default: ({ message, priority }: any) => (
    <div data-testid="aria-live-region" data-message={message} data-priority={priority} className="sr-only" />
  ),
  FormAnnouncements: {
    fieldRequired: (field: string) => `Validation error: ${field} is required`,
    validationError: (field: string) => `Validation error in ${field} field`,
    formError: (error: string) => `Form submission failed: ${error}`,
    networkRestored: () => 'Network connection restored',
  },
}));

vi.mock('@/components/ui/NetworkErrorRecovery', () => ({
  default: ({ hasError, errorMessage }: any) =>
    hasError ? <div data-testid="network-error">{errorMessage}</div> : null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, disabled, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  ),
}));

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders waitlist form', () => {
    render(<WaitlistForm />);

    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('aria-label', 'Waitlist subscription form');
  });

  test('renders email input', () => {
    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('required');
  });

  test('renders submit button', () => {
    render(<WaitlistForm />);

    const button = screen.getByRole('button', { name: /Join the Community/i });
    expect(button).toBeInTheDocument();
  });

  test('button is enabled when email is empty', () => {
    render(<WaitlistForm />);

    const button = screen.getByRole('button', { name: /Join the Community/i });
    expect(button).not.toBeDisabled();
  });

  test('button is enabled when email is entered', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    await user.type(input, 'test@example.com');

    const button = screen.getByRole('button', { name: /Join the Community/i });
    expect(button).not.toBeDisabled();
  });

  test('validates email format', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const button = screen.getByRole('button', { name: /Join the Community/i });

    await user.type(input, 'invalid-email');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument();
    });
  });

  test('shows error when email is empty and form is submitted', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    const button = screen.getByRole('button', { name: /Join the Community/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  test('submits form with valid email', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      message: 'Successfully subscribed to waitlist',
      email: 'test@example.com',
      subscribed: true,
    };

    (subscribeToWaitlist as any).mockResolvedValue(mockResponse);

    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const button = screen.getByRole('button', { name: /Join the Community/i });

    await user.type(input, 'test@example.com');
    await user.click(button);

    await waitFor(() => {
      expect(subscribeToWaitlist).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/Thank you for joining/)).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (subscribeToWaitlist as any).mockReturnValue(promise);

    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const button = screen.getByRole('button', { name: /Join the Community/i });

    await user.type(input, 'test@example.com');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Joining...')).toBeInTheDocument();
    });

    resolvePromise!({
      message: 'Successfully subscribed',
      email: 'test@example.com',
      subscribed: true,
    });
  });

  test('handles API errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error occurred';

    (subscribeToWaitlist as any).mockRejectedValue(new Error(errorMessage));

    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const button = screen.getByRole('button', { name: /Join the Community/i });

    await user.type(input, 'test@example.com');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const button = screen.getByRole('button', { name: /Join the Community/i });

    // Submit with empty email to trigger error
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(input, 'test');

    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  test('renders ARIA live region', () => {
    render(<WaitlistForm />);

    const liveRegion = screen.getByTestId('aria-live-region');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveClass('sr-only');
  });

  test('has proper accessibility attributes', () => {
    render(<WaitlistForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toHaveAttribute('id', 'waitlist-email');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  test('shows error with proper ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    const button = screen.getByRole('button', { name: /Join the Community/i });
    await user.click(button);

    await waitFor(() => {
      const errorElement = screen.getByText('Email is required');
      expect(errorElement).toHaveAttribute('id', 'waitlist-error');
      expect(errorElement).toHaveAttribute('role', 'alert');
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
