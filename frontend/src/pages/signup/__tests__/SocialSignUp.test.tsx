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
});
