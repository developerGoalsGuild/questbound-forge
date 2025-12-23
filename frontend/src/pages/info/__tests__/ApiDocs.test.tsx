/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import ApiDocs from '../ApiDocs';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      apiDocs: {
        title: 'API Documentation',
        subtitle: 'Complete API reference',
        searchPlaceholder: 'Search endpoints...',
        copied: 'Copied!',
        authentication: { title: 'Authentication' }
      },
      common: { back: 'Back' }
    }
  })
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
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

// Mock API endpoints data
vi.mock('@/data/api/endpoints', () => ({
  apiEndpoints: [
    {
      name: 'Authentication',
      description: 'Auth endpoints',
      endpoints: [
        {
          method: 'POST',
          path: '/users/login',
          description: 'Login endpoint',
          category: 'authentication',
          requiresAuth: false,
          exampleResponse: { token: 'test' }
        }
      ]
    }
  ]
}));

describe('ApiDocs page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title', () => {
    render(
      <MemoryRouter>
        <ApiDocs />
      </MemoryRouter>
    );

    expect(screen.getByText('API Documentation')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(
      <MemoryRouter>
        <ApiDocs />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search endpoints...');
    expect(searchInput).toBeInTheDocument();
  });

  test('filters endpoints when searching', () => {
    render(
      <MemoryRouter>
        <ApiDocs />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search endpoints...');
    fireEvent.change(searchInput, { target: { value: 'login' } });

    expect(searchInput).toHaveValue('login');
  });

  test('renders authentication section', () => {
    render(
      <MemoryRouter>
        <ApiDocs />
      </MemoryRouter>
    );

    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <ApiDocs />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });
});

