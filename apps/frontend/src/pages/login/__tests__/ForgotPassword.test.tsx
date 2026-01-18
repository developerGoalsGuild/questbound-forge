/** @vitest-environment jsdom */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import { TranslationProvider } from '@/hooks/useTranslation';

vi.mock('@/lib/api', () => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import * as api from '@/lib/api';

const renderComponent = () =>
  render(
    <BrowserRouter>
      <TranslationProvider>
        <ForgotPassword />
      </TranslationProvider>
    </BrowserRouter>
  );

describe('ForgotPassword page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  test('renders forgot password form', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    vi.mocked(api.requestPasswordReset).mockRejectedValue(new Error('API should not be called'));
    
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    
    expect(await screen.findByRole('alert')).toHaveTextContent(/email is required/i);
    expect(api.requestPasswordReset).not.toHaveBeenCalled();
  });

  test('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    vi.mocked(api.requestPasswordReset).mockRejectedValue(new Error('API should not be called'));
    
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(api.requestPasswordReset).not.toHaveBeenCalled();
  });

  test('calls API with email and shows success message', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    vi.mocked(api.requestPasswordReset).mockResolvedValue({
      message: 'If the account exists and email is confirmed, a reset link will be sent.',
    });
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    
    await waitFor(() => {
      expect(api.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
    
    expect(await screen.findByText(/reset link will be sent/i)).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('shows error message when email is not confirmed', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    vi.mocked(api.requestPasswordReset).mockRejectedValue(
      new Error('Email not confirmed. Please confirm your email before requesting a password reset.')
    );
    
    await user.type(screen.getByLabelText(/email/i), 'unconfirmed@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    
    expect(await screen.findByRole('alert')).toHaveTextContent(/not confirmed/i);
  });

  test('shows generic error message on API failure', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    vi.mocked(api.requestPasswordReset).mockRejectedValue(new Error('Network error'));
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to request password reset/i);
  });

  test('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    vi.mocked(api.requestPasswordReset).mockRejectedValue(new Error('Error'));
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');
    
    // Error should be cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('disables submit button while loading', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    let resolveRequest: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    vi.mocked(api.requestPasswordReset).mockReturnValue(promise as any);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    await user.click(submitButton);
    
    // Button should be disabled while loading
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise
    resolveRequest!({ message: 'If the account exists and email is confirmed, a reset link will be sent.' });
    
    // Wait for the promise to resolve and component to update
    await waitFor(() => {
      // After success, the form is replaced with success message, so button won't exist
      // Instead, check for success message
      expect(screen.getByText(/reset link will be sent/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('has link to login page', () => {
    renderComponent();
    const loginLink = screen.getByText(/back to login/i).closest('a');
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
