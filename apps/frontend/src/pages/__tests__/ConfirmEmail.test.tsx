import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: { common: { loading: 'Loading...' } },
    language: 'en',
    setLanguage: vi.fn()
  })
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getApiBase: () => '/v1'
  };
});

vi.mock('@/lib/api', () => ({
  resendConfirmationEmail: vi.fn()
}));

import ConfirmEmail from '@/pages/ConfirmEmail';
import { resendConfirmationEmail } from '@/lib/api';

describe('ConfirmEmail', () => {
  beforeEach(() => {
    (resendConfirmationEmail as any).mockReset().mockResolvedValue({ message: 'sent' });
    (globalThis.fetch as any) = vi.fn();
  });

  test('confirms email when token is present', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ message: 'Email confirmed. You may now log in.' })
    });

    render(
      <MemoryRouter initialEntries={['/confirm-email?token=abc']}>
        <Routes>
          <Route path="/confirm-email" element={<ConfirmEmail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email confirmed/i);
    });
  });

  test('shows resend form when token is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/confirm-email']}>
        <Routes>
          <Route path="/confirm-email" element={<ConfirmEmail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/invalid confirmation link/i);

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /resend confirmation email/i }));

    await waitFor(() => {
      expect(resendConfirmationEmail).toHaveBeenCalledWith('user@example.com');
    });
  });
});
