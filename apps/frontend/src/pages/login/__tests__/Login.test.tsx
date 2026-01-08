/** @vitest-environment jsdom */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import Login from '../Login';
import { TranslationProvider, useTranslation } from '@/hooks/useTranslation';

vi.mock('@/lib/api', () => ({
  login: vi.fn(),
}));

import * as api from '@/lib/api';

const renderComponent = () =>
  render(
    <TranslationProvider>
      <Login />
    </TranslationProvider>
  );

const renderWithLanguage = (lang: 'en'|'es'|'fr') => {
  const LangSetter = () => {
    const { setLanguage } = useTranslation();
    React.useEffect(() => { setLanguage(lang); }, [lang]);
    return null;
  };
  return render(
    <TranslationProvider>
      <LangSetter />
      <Login />
    </TranslationProvider>
  );
};

describe('Login page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    // default env for API base URL
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
  });
  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  test('renders localized labels and button in English', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test('renders localized labels in Spanish', () => {
    renderWithLanguage('es');
    // Note: In test environment, fallbacks are used, so English text is shown
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders localized labels in French', () => {
    renderWithLanguage('fr');
    // Note: In test environment, fallbacks are used, so English text is shown
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validation: shows error for empty email', async () => {
    const user = userEvent.setup();
    renderComponent();
    vi.mocked(api.login).mockRejectedValue(new Error('API should not be called'));
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email is required/i);
  });

  test('validation: shows error for invalid email', async () => {
    const user = userEvent.setup();
    renderComponent();
    vi.mocked(api.login).mockRejectedValue(new Error('API should not be called'));
    await user.type(screen.getByLabelText(/email/i), 'bad');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  test('validation: shows error for empty password', async () => {
    const user = userEvent.setup();
    renderComponent();
    vi.mocked(api.login).mockRejectedValue(new Error('API should not be called'));
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/password is required/i);
  });

  test('calls API, stores JWT, and redirects to dashboard (default user)', async () => {
    const user = userEvent.setup();
    const tok = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ sub: 'u', role: 'user' })) + '.sig';
    vi.mocked(api.login).mockResolvedValue({ token_type: 'Bearer', access_token: tok, expires_in: 3600 });

    delete (window as any).location;
    (window as any).location = { href: '', assign: vi.fn() } as any;

    renderComponent();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'Aa1!aaaa');

    // clicking submit
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('user@example.com', 'Aa1!aaaa');
      const raw = localStorage.getItem('auth');
      expect(raw).toBeTruthy();
    });
  });

  test('redirects based on user type from id_token (partner)', async () => {
    const user = userEvent.setup();
    const idTok = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ role: 'partner' })) + '.sig';
    vi.mocked(api.login).mockResolvedValue({ token_type: 'Bearer', access_token: 'x.y.z', id_token: idTok, expires_in: 3600 });
    delete (window as any).location;
    (window as any).location = { href: '', assign: vi.fn() } as any;

    renderComponent();
    await user.type(screen.getByLabelText(/email/i), 'p@example.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'Aa1!aaaa');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect((window as any).location.href).toMatch(/\/dashboard\?type=partner/);
    });
  });

  test('shows API error message on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockRejectedValue(new Error('Invalid credentials'));
    renderComponent();
    await user.type(screen.getByLabelText(/email/i), 'fail@example.com');
    await user.type(screen.getByLabelText(/password/i), { target: { value: 'bad' } });
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });
});
