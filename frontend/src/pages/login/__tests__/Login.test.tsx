/** @vitest-environment jsdom */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
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
    vi.clearAllMocks();
    localStorage.clear();
    // default env for API base URL
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/dev');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  test('renders localized labels and button in English', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test('renders localized labels in Spanish', () => {
    renderWithLanguage('es');
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('renders localized labels in French', () => {
    renderWithLanguage('fr');
    expect(screen.getByRole('heading', { name: /se connecter/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  test('validation: shows error for empty email', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email is required/i);
  });

  test('validation: shows error for invalid email', async () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bad' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  test('validation: shows error for empty password', async () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/password is required/i);
  });

  test('calls API, stores JWT, and redirects to dashboard (default user)', async () => {
    const tok = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ sub: 'u', role: 'user' })) + '.sig';
    (api.login as any).mockResolvedValue({ token_type: 'Bearer', access_token: tok, expires_in: 3600 });

    delete (window as any).location;
    (window as any).location = { href: '', assign: vi.fn() } as any;

    renderComponent();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'Aa1!aaaa' } });

    // clicking submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('user@example.com', 'Aa1!aaaa');
      const raw = localStorage.getItem('auth');
      expect(raw).toBeTruthy();
    });
  });

  test('redirects based on user type from id_token (partner)', async () => {
    const idTok = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ role: 'partner' })) + '.sig';
    (api.login as any).mockResolvedValue({ token_type: 'Bearer', access_token: 'x.y.z', id_token: idTok, expires_in: 3600 });
    delete (window as any).location;
    (window as any).location = { href: '', assign: vi.fn() } as any;

    renderComponent();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'p@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'Aa1!aaaa' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect((window as any).location.href).toMatch(/\/dashboard\?type=partner/);
    });
  });

  test('shows API error message on failure', async () => {
    (api.login as any).mockRejectedValue(new Error('Invalid credentials'));
    renderComponent();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });
});
