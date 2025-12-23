/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Status from '../Status';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      status: {
        title: 'System Status',
        subtitle: 'Service health information',
        refresh: 'Refresh',
        overallStatus: 'Overall Status',
        services: 'Services',
        lastUpdated: 'Last Updated'
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

// Mock status API
vi.mock('@/lib/api/status', () => ({
  checkServiceHealth: vi.fn(() =>
    Promise.resolve({
      status: 'ok',
      message: 'Service is operational',
      timestamp: new Date().toISOString()
    })
  )
}));

describe('Status page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title', () => {
    render(
      <MemoryRouter>
        <Status />
      </MemoryRouter>
    );

    // System Status appears multiple times (h1 and span), check for h1
    const titles = screen.getAllByText('System Status');
    expect(titles.length).toBeGreaterThan(0);
  });

  test('renders refresh button', () => {
    render(
      <MemoryRouter>
        <Status />
      </MemoryRouter>
    );

    // There are multiple buttons with "refresh" text, get all and check
    const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
    expect(refreshButtons.length).toBeGreaterThan(0);
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <Status />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('displays service status after loading', async () => {
    render(
      <MemoryRouter>
        <Status />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Services')).toBeInTheDocument();
    });
  });
});

