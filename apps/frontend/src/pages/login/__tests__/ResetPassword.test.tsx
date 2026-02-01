/** @vitest-environment jsdom */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { TranslationProvider } from '@/hooks/useTranslation';

vi.mock('@/lib/api', () => ({
  resetPassword: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import * as api from '@/lib/api';

const renderComponent = (token?: string) => {
  const searchParams = token ? `?token=${encodeURIComponent(token)}` : '';
  return render(
    <MemoryRouter initialEntries={[`/reset-password${searchParams}`]}>
      <TranslationProvider>
        <ResetPassword />
      </TranslationProvider>
    </MemoryRouter>
  );
};

const setupUser = () => (
  vi.isFakeTimers()
    ? userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    : userEvent.setup()
);

describe('ResetPassword page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  test('shows error when token is missing', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid or missing reset token/i);
    expect(screen.getByText(/request a new password reset/i)).toBeInTheDocument();
  });

  test('renders reset password form with valid token', () => {
    renderComponent('valid-token-123');
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  test('shows validation error for empty password', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    vi.mocked(api.resetPassword).mockRejectedValue(new Error('API should not be called'));
    
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    
    expect(await screen.findAllByText(/password is required/i)).toHaveLength(2);
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  test('shows validation error for weak password', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    vi.mocked(api.resetPassword).mockRejectedValue(new Error('API should not be called'));
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    await user.type(passwordInput, 'weak');
    await user.type(confirmInput, 'weak');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  test('shows validation error when passwords do not match', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    vi.mocked(api.resetPassword).mockRejectedValue(new Error('API should not be called'));
    
    await user.type(screen.getByLabelText(/new password/i), 'StrongPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  test('validates password strength requirements', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Test missing lowercase
    await user.clear(passwordInput);
    await user.type(passwordInput, 'UPPERCASE123!');
    await user.click(submitButton);
    expect(await screen.findByText(/lowercase/i)).toBeInTheDocument();
    
    // Test missing uppercase
    await user.clear(passwordInput);
    await user.type(passwordInput, 'lowercase123!');
    await user.click(submitButton);
    expect(await screen.findByText(/uppercase/i)).toBeInTheDocument();
    
    // Test missing digit
    await user.clear(passwordInput);
    await user.type(passwordInput, 'NoDigitPass!');
    await user.click(submitButton);
    expect(await screen.findByText(/digit/i)).toBeInTheDocument();
    
    // Test missing special character
    await user.clear(passwordInput);
    await user.type(passwordInput, 'NoSpecial123');
    await user.click(submitButton);
    expect(await screen.findByText(/special character/i)).toBeInTheDocument();
  });

  test('calls API with token and new password on valid submission', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    vi.mocked(api.resetPassword).mockResolvedValue({
      message: 'Password reset successfully. Please log in with your new password.',
    });
    
    await user.type(screen.getByLabelText(/new password/i), 'NewSecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewSecurePass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    
    await waitFor(() => {
      expect(api.resetPassword).toHaveBeenCalledWith('valid-token-123', 'NewSecurePass123!');
    });
  });

  test('shows success message and redirects after successful reset', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    vi.mocked(api.resetPassword).mockResolvedValue({
      message: 'Password reset successfully.',
    });
    
    await user.type(screen.getByLabelText(/new password/i), 'NewSecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewSecurePass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    
    expect(await screen.findByText(/password reset successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/go to login/i)).toBeInTheDocument();
  });

  test('shows error for expired token', async () => {
    const user = setupUser();
    renderComponent('expired-token');
    
    vi.mocked(api.resetPassword).mockRejectedValue(
      new Error('Reset token expired')
    );
    
    await user.type(screen.getByLabelText(/new password/i), 'NewSecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewSecurePass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    
    expect(await screen.findByText(/expired/i)).toBeInTheDocument();
  });

  test('shows error for invalid token', async () => {
    const user = setupUser();
    renderComponent('invalid-token');
    
    vi.mocked(api.resetPassword).mockRejectedValue(
      new Error('Invalid reset token')
    );
    
    await user.type(screen.getByLabelText(/new password/i), 'NewSecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewSecurePass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    
    expect(await screen.findByText(/invalid/i)).toBeInTheDocument();
  });

  test('clears field errors when user starts typing', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Trigger validation error
    await user.click(submitButton);
    expect(await screen.findAllByText(/password is required/i)).toHaveLength(2);
    
    // Start typing - error should clear
    await user.type(passwordInput, 'New');
    await waitFor(() => {
      expect(screen.getAllByText(/password is required/i)).toHaveLength(1);
    });
  });

  test('disables submit button while loading', async () => {
    const user = setupUser();
    renderComponent('valid-token-123');
    
    let resolveRequest: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    vi.mocked(api.resetPassword).mockReturnValue(promise as any);
    
    await user.type(screen.getByLabelText(/new password/i), 'NewSecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewSecurePass123!');
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    resolveRequest!({ message: 'Success' });
    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    });
  });

  test('has link to login page', () => {
    renderComponent('valid-token-123');
    const loginLink = screen.getByText(/back to login/i).closest('a');
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('has link to request new reset when token is missing', () => {
    renderComponent();
    const resetLink = screen.getByText(/request a new password reset/i).closest('a');
    expect(resetLink).toHaveAttribute('href', '/forgot-password');
  });
});
