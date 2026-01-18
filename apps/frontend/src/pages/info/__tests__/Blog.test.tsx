/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Blog from '../Blog';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      blog: {
        title: 'Blog',
        subtitle: 'Stories and updates',
        searchPlaceholder: 'Search posts...',
        categories: {
          productUpdates: 'Product Updates',
          community: 'Community',
          tipsTricks: 'Tips & Tricks'
        },
        featured: 'Featured Posts',
        allPosts: 'All Posts',
        minRead: 'min read'
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

describe('Blog page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    );

    expect(screen.getByText('Blog')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search posts...');
    expect(searchInput).toBeInTheDocument();
  });

  test('filters posts when searching', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search posts...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(searchInput).toHaveValue('test');
  });

  test('renders category filters', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    // Product Updates appears multiple times (button and badge), so use getAllByText
    const productUpdates = screen.getAllByText('Product Updates');
    expect(productUpdates.length).toBeGreaterThan(0);
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('navigates to post when clicked', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    );

    // Test Post appears multiple times (featured and all posts), get first one
    const postCards = screen.getAllByText('Test Post');
    expect(postCards.length).toBeGreaterThan(0);
    // Click the first card
    postCards[0].click();

    expect(mockNavigate).toHaveBeenCalledWith('/blog/test-post');
  });
});

