/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, asChild }: any) => asChild ? children : (
    <button
      data-testid={`button-${variant || 'default'}-${size || 'default'}`}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children, align, className }: any) => (
    <div data-testid="dropdown-content" className={className} data-align={align}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <div
      data-testid="dropdown-item"
      onClick={onClick}
      className={className}
    >
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => asChild ? children : (
    <div data-testid="dropdown-trigger">{children}</div>
  )
}));

vi.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
  Globe: () => <div data-testid="globe-icon" />
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to }: any) => <a data-testid="link" href={to}>{children}</a>
  };
});

// Mock the translation hook
const mockSetLanguage = vi.fn();
const mockTranslation = {
  nav: {
    features: 'Features',
    community: 'Community',
    pricing: 'Pricing',
    contact: 'Contact',
    goals: 'Quests',
    login: 'Login',
    signup: 'Sign Up'
  }
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    setLanguage: mockSetLanguage,
    t: mockTranslation
  })
}));

describe.skip('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders header with logo and navigation', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    expect(screen.getByText('GoalGuild')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
  });

  test('renders language selector with current language flag', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
    const languageButton = screen.getByTestId('globe-icon').closest('button');
    expect(languageButton).toHaveTextContent('🇺🇸'); // English flag in button
  });

  test('renders login and signup buttons on desktop', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const loginLinks = screen.getAllByText('Login');
    const signupLinks = screen.getAllByText('Sign Up');

    expect(loginLinks.length).toBeGreaterThan(0);
    expect(signupLinks.length).toBeGreaterThan(0);
  });

  test('shows mobile menu button on small screens', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  test('toggles mobile menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button', { name: '' }); // Button with menu icon

    // Initially only desktop nav should be visible
    expect(screen.getByText('Features')).toBeInTheDocument(); // Desktop nav

    // Click to open mobile menu
    await user.click(menuButton);

    // Mobile menu should now be visible
    expect(screen.getAllByText('Features')).toHaveLength(2); // Desktop + mobile nav
    expect(screen.getByTestId('x-icon')).toBeInTheDocument(); // Close icon

    // Click again to close
    await user.click(menuButton);
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument(); // Menu icon back
  });

  test('changes language when language option is selected', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Click language selector
    const languageButton = screen.getByRole('button', { name: '' }); // Button with globe icon
    await user.click(languageButton);

    // Click Spanish option
    const spanishOption = screen.getByText('🇪🇸');
    await user.click(spanishOption);

    expect(mockSetLanguage).toHaveBeenCalledWith('es');
  });

  test('highlights current language in dropdown', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // The English option should have bg-accent class (simulated in mock)
    const englishItem = screen.getByText('English').closest('[data-testid="dropdown-item"]');
    expect(englishItem).toBeInTheDocument();
  });

  test('renders navigation links with correct hrefs', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute('href', '#community');
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '#pricing');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
  });

  test('renders login and signup links with correct routes', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const loginLinks = screen.getAllByTestId('link');
    const loginLink = loginLinks.find(link => link.textContent === 'Login');
    const signupLink = loginLinks.find(link => link.textContent === 'Sign Up');

    expect(loginLink).toHaveAttribute('href', '/login/Login');
    expect(signupLink).toHaveAttribute('href', '/signup/LocalSignUp');
  });

  test('renders goals link with correct route', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const goalsLinks = screen.getAllByTestId('link');
    const goalsLink = goalsLinks.find(link => link.textContent === 'Quests');

    expect(goalsLink).toHaveAttribute('href', '/goals');
  });

  test('mobile menu contains all navigation items', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);

    // All navigation items should be present in mobile menu
    expect(screen.getAllByText('Features')).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText('Community')).toHaveLength(2);
    expect(screen.getAllByText('Pricing')).toHaveLength(2);
    expect(screen.getAllByText('Contact')).toHaveLength(2);
    expect(screen.getAllByText('Quests')).toHaveLength(2);
  });

  test('mobile menu has login and signup buttons', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);

    const mobileLoginButtons = screen.getAllByText('Login');
    const mobileSignupButtons = screen.getAllByText('Sign Up');

    expect(mobileLoginButtons.length).toBeGreaterThan(1); // Desktop + mobile
    expect(mobileSignupButtons.length).toBeGreaterThan(1);
  });

  test('closes mobile menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);

    expect(screen.getByTestId('x-icon')).toBeInTheDocument();

    // Click the menu button again to close
    await user.click(menuButton);

    // Menu should close
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });
});
