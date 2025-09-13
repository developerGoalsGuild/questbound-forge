/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
// Force feature flag ON for this file
vi.mock('@/config/featureFlags', () => ({ emailConfirmationEnabled: true }));
vi.mock('@/lib/api', () => ({
  createUser: vi.fn(),
  confirmEmail: vi.fn(),
  isEmailAvailable: vi.fn().mockResolvedValue(true),
  isNicknameAvailable: vi.fn().mockResolvedValue(true),
}));
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import LocalSignUp from '../LocalSignUp';
import * as api from '@/lib/api';
import { TranslationProvider } from '@/hooks/useTranslation';

const renderComponent = () =>
  render(
    <TranslationProvider>
      <LocalSignUp />
    </TranslationProvider>
  );

describe('LocalSignUp (flag enabled)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  test('shows banner and uses email confirmation flow', async () => {
    (api.createUser as any).mockResolvedValue({});
    (api.confirmEmail as any).mockResolvedValue(undefined);
    renderComponent();

    // Banner present
    expect(
      screen.getByRole('note')
    ).toBeInTheDocument();

    // Fill minimal required fields
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'flag@example.com' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Flag User' } });
    fireEvent.change(screen.getByLabelText(/nickname/i), { target: { value: 'flaguser' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    const ctry = screen.getByLabelText(/country/i);
    fireEvent.change(ctry, { target: { value: 'United States' } });
    const pick = await screen.findByRole('button', { name: /United States/i });
    fireEvent.click(pick);
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Aa1!aaaa' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Aa1!aaaa' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith(expect.objectContaining({ status: 'email confirmation pending' }));
      expect(api.confirmEmail).toHaveBeenCalledWith('flag@example.com');
      // success message may include the confirm text based on translation
      expect(screen.getByRole('alert')).toHaveTextContent(/account created/i);
    });
  });
});

