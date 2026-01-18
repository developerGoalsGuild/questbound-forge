/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Custom render function for App tests
const renderApp = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
};

// Mock BrowserRouter to render children without router wrapper in tests
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock all the imported components and providers
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="sonner-toaster" />
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: function QueryClient() {
    return {};
  },
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query-provider">{children}</div>
}));

vi.mock('@/hooks/useTranslation', () => ({
  TranslationProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="translation-provider">{children}</div>,
  useTranslation: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock('./pages/Index', () => ({
  default: () => <div data-testid="index-page">Index Page</div>
}));

vi.mock('./pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

vi.mock('./pages/signup/LocalSignUp', () => ({
  default: () => <div data-testid="local-signup-page">Local Signup Page</div>
}));

vi.mock('./pages/login/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('./pages/NotFound', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>
}));

vi.mock('./pages/goals/Goals', () => ({
  default: () => <div data-testid="goals-page">Goals Page</div>
}));

vi.mock('./pages/account/ChangePassword', () => ({
  default: () => <div data-testid="change-password-page">Change Password Page</div>
}));

vi.mock('@/lib/session', () => ({
  SessionKeepAlive: () => <div data-testid="session-keep-alive" />
}));

vi.mock('@/lib/auth', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
  AuthWatcher: () => <div data-testid="auth-watcher" />
}));

describe('App', () => {
  test('renders all providers and components', () => {
    renderApp();

    // Check that all providers are rendered
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('translation-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();

    // Check that toasters are rendered
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();

    // Check that session keep alive is rendered
    expect(screen.getByTestId('session-keep-alive')).toBeInTheDocument();

    // Check that auth watcher is rendered
    expect(screen.getByTestId('auth-watcher')).toBeInTheDocument();
  });

  test('renders Index page on root path', () => {
    renderApp(['/']);

    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });

  test('renders Dashboard page on /dashboard path with protection', () => {
    renderApp(['/dashboard']);

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  /* test('renders Goals page on /goals path', () => {
    renderApp(['/goals']);

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('goals-page')).toBeInTheDocument();
  }); */

  test('renders ChangePassword page on /account/change-password path with protection', () => {
    renderApp(['/account/change-password']);

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('change-password-page')).toBeInTheDocument();
  });

  test('renders Login page on /login/Login path', () => {
    renderApp(['/login/Login']);

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('renders LocalSignup page on /signup/LocalSignUp path', () => {
    renderApp(['/signup/LocalSignUp']);

    expect(screen.getByTestId('local-signup-page')).toBeInTheDocument();
  });

  test('renders NotFound page for unknown paths', () => {
    renderApp(['/unknown-path']);

    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });
});
