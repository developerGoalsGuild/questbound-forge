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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: 'test-post' })
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

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('shows not found for invalid slug', () => {
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({ slug: 'invalid' });

    render(
      <MemoryRouter>
        <BlogPost />
      </MemoryRouter>
    );

    expect(screen.getByText('Post Not Found')).toBeInTheDocument();
  });
});

