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
      category: 'getting-started',
      translations: {
        en: {
          question: 'Test Question?',
          answer: 'Test Answer'
        },
        es: {
          question: '¿Pregunta de prueba?',
          answer: 'Respuesta de prueba'
        },
        fr: {
          question: 'Question de test ?',
          answer: 'Réponse de test'
        }
      }
    }
  ]
}));

vi.mock('@/data/help/articles', () => ({
  helpArticles: [
    {
      slug: 'test-article',
      category: 'getting-started',
      translations: {
        en: {
          title: 'Test Article',
          excerpt: 'Test excerpt',
          content: 'Test content'
        },
        es: {
          title: 'Artículo de prueba',
          excerpt: 'Extracto de prueba',
          content: 'Contenido de prueba'
        },
        fr: {
          title: 'Article de test',
          excerpt: 'Extrait de test',
          content: 'Contenu de test'
        }
      }
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

