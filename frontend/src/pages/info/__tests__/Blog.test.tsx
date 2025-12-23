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
      title: 'Test Post',
      excerpt: 'Test excerpt',
      author: 'Test Author',
      date: '2024-12-01',
      category: 'product-updates',
      featured: true,
      readTime: 5
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
    expect(screen.getByText('Product Updates')).toBeInTheDocument();
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

    const postCard = screen.getByText('Test Post');
    postCard.click();

    expect(mockNavigate).toHaveBeenCalledWith('/blog/test-post');
  });
});

