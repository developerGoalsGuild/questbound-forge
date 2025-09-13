/** @vitest-environment jsdom */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
vi.mock('@/lib/api', () => ({
  createUser: vi.fn(),
  confirmEmail: vi.fn(),
  isEmailAvailable: vi.fn().mockResolvedValue(true),
  isNicknameAvailable: vi.fn().mockResolvedValue(true),
}));
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SocialSignUp from '../SocialSignUp';
import * as api from '@/lib/api';
import { TranslationProvider } from '@/hooks/useTranslation';

describe('SocialSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  const renderComponent = (email: string) =>
    render(
      <TranslationProvider>
        <SocialSignUp email={email} />
      </TranslationProvider>
    );

  test('renders email field as read-only', () => {
    renderComponent('social@example.com');
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue('social@example.com');
    expect(emailInput).toHaveAttribute('readonly');
  });

  test('submits form successfully', async () => {
    (api.createUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});

    renderComponent('social@example.com');

    fireEvent.click(screen.getAllByRole('button', { name: /create account/i })[0]);

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({
        email: 'social@example.com',
        status: 'email confirmation pending',
      });
      expect(screen.getByText(/account created/i)).toBeInTheDocument();
    });
  });

  test('shows error message on submission failure', async () => {
    (api.createUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

    renderComponent('social@example.com');

    fireEvent.click(screen.getAllByRole('button', { name: /create account/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
    });
  });

  test('disables submit and shows loading text while submitting', async () => {
    // Delay createUser so we can observe loading state
    (api.createUser as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(res => setTimeout(() => res({}), 150)));

    renderComponent('social@example.com');

    const button = screen.getAllByRole('button', { name: /create account/i })[0];
    fireEvent.click(button);

    // While pending
    expect(button).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // After resolved
    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(screen.getByText(/account created/i)).toBeInTheDocument();
    });
  });

  test('clears previous messages on resubmit', async () => {
    // First attempt fails
    (api.createUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));
    // Second attempt succeeds
    ;(api.createUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    renderComponent('social@example.com');

    const button = screen.getAllByRole('button', { name: /create account/i })[0];

    // 1st: fail
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByText(/failed to create account/i)).toBeInTheDocument());

    // 2nd: success, should clear error and show success
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText(/failed to create account/i)).not.toBeInTheDocument();
      expect(screen.getByText(/account created/i)).toBeInTheDocument();
    });
  });
});
