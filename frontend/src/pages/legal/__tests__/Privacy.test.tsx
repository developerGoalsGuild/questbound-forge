/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Privacy from '../Privacy';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      privacy: {
        title: 'Privacy Policy',
        subtitle: 'How we protect your data',
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

// Mock privacy policy data
vi.mock('@/data/legal/privacy', () => ({
  privacyPolicyContent: {
    lastUpdated: 'December 23, 2024',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: ['Test content']
      }
    ]
  }
}));

describe('Privacy page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title', () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('renders table of contents', () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
  });

  test('renders privacy policy sections', () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });
});

