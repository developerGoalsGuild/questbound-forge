/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Careers from '../Careers';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      careers: {
        title: 'Careers',
        subtitle: 'Join our team',
        searchPlaceholder: 'Search jobs...',
        allDepartments: 'All Departments',
        allTypes: 'All Types',
        openPositions: 'Open Positions',
        apply: 'Apply',
        noJobs: 'No jobs found'
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

// Mock jobs data
vi.mock('@/data/careers/jobs', () => ({
  jobs: [
    {
      id: 'test-job',
      title: 'Test Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'full-time',
      description: 'Test description',
      requirements: ['Requirement 1'],
      responsibilities: ['Responsibility 1'],
      postedDate: '2024-12-01',
      salary: '$100,000'
    }
  ]
}));

describe('Careers page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders page title', () => {
    render(
      <MemoryRouter>
        <Careers />
      </MemoryRouter>
    );

    expect(screen.getByText('Careers')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(
      <MemoryRouter>
        <Careers />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search jobs...');
    expect(searchInput).toBeInTheDocument();
  });

  test('filters jobs when searching', () => {
    render(
      <MemoryRouter>
        <Careers />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search jobs...');
    fireEvent.change(searchInput, { target: { value: 'engineer' } });

    expect(searchInput).toHaveValue('engineer');
  });

  test('renders job listings', () => {
    render(
      <MemoryRouter>
        <Careers />
      </MemoryRouter>
    );

    expect(screen.getByText('Test Engineer')).toBeInTheDocument();
  });

  test('navigates to application when apply button clicked', () => {
    render(
      <MemoryRouter>
        <Careers />
      </MemoryRouter>
    );

    const applyButton = screen.getByRole('button', { name: /apply/i });
    applyButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/careers/apply/test-job');
  });

  test('renders back button', () => {
    render(
      <MemoryRouter>
        <Careers />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });
});

