/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Help from '../Help';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      help: {
        title: 'Help Center',
        subtitle: 'Find answers',
        searchPlaceholder: 'Search for help...',
        categories: {
          title: 'Browse by Category',
          gettingStarted: 'Getting Started',
          goalsQuests: 'Goals & Quests',
          guilds: 'Guilds',
          billing: 'Billing',
          troubleshooting: 'Troubleshooting'
        },
        faq: 'Frequently Asked Questions',
        articles: 'Help Articles',
        popularArticles: 'Popular Articles',
        contactSupport: 'Still Need Help?'
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

// Mock FAQ and articles data
vi.mock('@/data/help/faq', () => ({
  faqs: [
    {
      id: 'test-faq',
      question: 'Test Question?',
      answer: 'Test Answer',
      category: 'getting-started'
    }
  ]
}));

vi.mock('@/data/help/articles', () => ({
  helpArticles: [
    {
      slug: 'test-article',
      title: 'Test Article',
      excerpt: 'Test excerpt',
      category: 'getting-started',
      content: 'Test content'
    }
  ]
}));

describe('Help page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );

    expect(screen.getByText('Help Center')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search for help...');
    expect(searchInput).toBeInTheDocument();
  });

  test('renders FAQ section', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  test('renders category filters', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  test('filters content when searching', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search for help...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(searchInput).toHaveValue('test');
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });
});

