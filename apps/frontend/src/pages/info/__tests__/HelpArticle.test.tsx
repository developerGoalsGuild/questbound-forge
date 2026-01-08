/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import HelpArticle from '../HelpArticle';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      help: {
        backToHelp: 'Back to Help Center',
        articleNotFound: 'Article Not Found'
      },
      common: { back: 'Back' }
    }
  })
}));

// Mock useNavigate
const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({ slug: 'test-article' }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams()
  };
});

// Mock articles data
vi.mock('@/data/help/articles', () => ({
  helpArticles: [
    {
      slug: 'test-article',
      title: 'Test Article',
      excerpt: 'Test excerpt',
      category: 'getting-started',
      content: '# Test Article\n\nContent here'
    }
  ]
}));

describe('HelpArticle page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders article title', () => {
    render(
      <MemoryRouter>
        <HelpArticle />
      </MemoryRouter>
    );

    // Title appears in both header and content, use getAllByText
    const titles = screen.getAllByText('Test Article');
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeInTheDocument();
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <HelpArticle />
      </MemoryRouter>
    );

    // There are multiple back buttons, get the first one
    const backButtons = screen.getAllByRole('button', { name: /back/i });
    expect(backButtons.length).toBeGreaterThan(0);
    expect(backButtons[0]).toBeInTheDocument();
  });

  test('shows not found for invalid slug', () => {
    // Update the mock to return invalid slug
    mockUseParams.mockReturnValue({ slug: 'invalid' });

    render(
      <MemoryRouter>
        <HelpArticle />
      </MemoryRouter>
    );

    expect(screen.getByText('Article Not Found')).toBeInTheDocument();
  });
});

