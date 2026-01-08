/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import About from '../About';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      about: {
        title: 'About Us',
        subtitle: 'Learn more about GoalsGuild',
        mission: { title: 'Our Mission', content: 'Test mission' },
        vision: { title: 'Our Vision', content: 'Test vision' },
        values: { title: 'Our Values' },
        whatWeDo: { title: 'What We Do' },
        team: { title: 'Our Team' },
        contact: { title: 'Get in Touch' }
      },
      common: { back: 'Back' }
    }
  })
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('About page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title and subtitle', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText(/Learn more about GoalsGuild/i)).toBeInTheDocument();
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('navigates to home when back button is clicked', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    backButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('renders mission section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText('Our Mission')).toBeInTheDocument();
  });

  test('renders vision section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText('Our Vision')).toBeInTheDocument();
  });

  test('renders values section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText('Our Values')).toBeInTheDocument();
  });

  test('renders contact section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
  });
});

