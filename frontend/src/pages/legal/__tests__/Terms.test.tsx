/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Terms from '../Terms';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      terms: {
        title: 'Terms of Service',
        subtitle: 'Terms and conditions',
        lastUpdated: 'Last Updated',
        print: 'Print',
        tableOfContents: 'Table of Contents'
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

// Mock terms data
vi.mock('@/data/legal/terms', () => ({
  termsOfServiceContent: {
    lastUpdated: 'December 23, 2024',
    sections: [
      {
        id: 'acceptance',
        title: 'Acceptance of Terms',
        content: ['Test content']
      }
    ]
  }
}));

describe('Terms page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('renders table of contents', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
  });

  test('renders terms sections', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    expect(screen.getByText('Acceptance of Terms')).toBeInTheDocument();
  });
});

