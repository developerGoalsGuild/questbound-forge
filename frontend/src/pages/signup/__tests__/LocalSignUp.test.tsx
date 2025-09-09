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
import LocalSignUp from '../LocalSignUp';
import * as api from '@/lib/api';
import { TranslationProvider } from '@/hooks/useTranslation';

describe('LocalSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <TranslationProvider>
        <LocalSignUp />
      </TranslationProvider>
    );

  test('renders form fields', () => {
    renderComponent();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test('shows validation errors on empty submit', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    const errs = await screen.findAllByText(/this field is required/i);
    expect(errs.length).toBeGreaterThanOrEqual(4);
  });

  test('shows password mismatch error', async () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password2' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('submits form successfully', async () => {
    (api.createUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (api.confirmEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/nickname/i), { target: { value: 'nick' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    const countryInput = screen.getByLabelText(/country/i);
    fireEvent.change(countryInput, { target: { value: 'United States' } });
    // pick first matching option
    const opt = await screen.findByRole('button', { name: /United States/i });
    fireEvent.click(opt);
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Aa1!aaaa' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Aa1!aaaa' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'Aa1!aaaa',
        status: 'email confirmation pending',
      }));
      expect(api.confirmEmail).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/account created! please check your email/i)).toBeInTheDocument();
    });
  });

  test('shows error message on submission failure', async () => {
    (api.createUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));
    renderComponent();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Fail User' } });
    fireEvent.change(screen.getByLabelText(/nickname/i), { target: { value: 'nick' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    const ctry = screen.getByLabelText(/country/i);
    fireEvent.change(ctry, { target: { value: 'United States' } });
    const pick = await screen.findByRole('button', { name: /United States/i });
    fireEvent.click(pick);
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Aa1!aaaa' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Aa1!aaaa' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
    });
  });
});
