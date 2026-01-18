/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import BlogPost from '../BlogPost';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      blog: {
        backToBlog: 'Back to Blog',
        minRead: 'min read',
        loading: 'Loading...',
        notFound: 'Post Not Found'
      },
      common: { back: 'Back' }
    }
  })
}));

// Mock useNavigate
const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({ slug: 'test-post' }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams()
  };
});

// Mock blog posts data
vi.mock('@/data/blog/posts', () => ({
  blogPosts: [
    {
      slug: 'test-post',
      date: '2024-12-01',
      category: 'product-updates',
      featured: true,
      readTime: 5,
      translations: {
        en: {
          title: 'Test Post',
          excerpt: 'Test excerpt',
          author: 'Test Author',
          content: 'Test content'
        },
        es: {
          title: 'Publicación de prueba',
          excerpt: 'Extracto de prueba',
          author: 'Autor de prueba',
          content: 'Contenido de prueba'
        },
        fr: {
          title: 'Article de test',
          excerpt: 'Extrait de test',
          author: 'Auteur de test',
          content: 'Contenu de test'
        }
      }
    }
  ]
}));

// Mock fetch for markdown content
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('# Test Post\n\nContent here')
  })
) as any;

describe('BlogPost page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ slug: 'test-post' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders post title', async () => {
    render(
      <MemoryRouter>
        <BlogPost />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
  });

  test('renders post author', async () => {
    render(
      <MemoryRouter>
        <BlogPost />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <BlogPost />
      </MemoryRouter>
    );

    // There are multiple back buttons, get the first one
    const backButtons = screen.getAllByRole('button', { name: /back/i });
    expect(backButtons.length).toBeGreaterThan(0);
  });

  test('shows not found for invalid slug', () => {
    // Change mock to return invalid slug
    mockUseParams.mockReturnValue({ slug: 'invalid' });

    render(
      <MemoryRouter>
        <BlogPost />
      </MemoryRouter>
    );

    expect(screen.getByText('Post Not Found')).toBeInTheDocument();
    
    // Reset mock for other tests
    mockUseParams.mockReturnValue({ slug: 'test-post' });
  });
});

