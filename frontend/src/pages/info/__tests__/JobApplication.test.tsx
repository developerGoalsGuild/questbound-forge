/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import JobApplication from '../JobApplication';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      careers: {
        applyFor: 'Apply for',
        jobDescription: 'Job Description',
        responsibilities: 'Responsibilities',
        requirements: 'Requirements',
        applicationForm: 'Application Form',
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        resume: 'Resume',
        coverLetter: 'Cover Letter',
        portfolio: 'Portfolio',
        submitApplication: 'Submit Application',
        submitting: 'Submitting...',
        applicationSubmitted: 'Application Submitted',
        applicationSuccess: 'Application Submitted!',
        jobNotFound: 'Job Not Found'
      },
      common: { back: 'Back', cancel: 'Cancel' }
    }
  })
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ jobId: 'test-job' })
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
      postedDate: '2024-12-01'
    }
  ]
}));

describe('JobApplication page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockToast.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  test('renders job title', () => {
    render(
      <MemoryRouter>
        <JobApplication />
      </MemoryRouter>
    );

    expect(screen.getByText(/Apply for.*Test Engineer/i)).toBeInTheDocument();
  });

  test('renders application form fields', () => {
    render(
      <MemoryRouter>
        <JobApplication />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
  });

  test('submits form successfully', async () => {
    render(
      <MemoryRouter>
        <JobApplication />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Submit Application/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    // Mock file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    });
    fireEvent.change(fileInput);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Application Submitted!')).toBeInTheDocument();
    });
  });

  test('shows not found for invalid job id', () => {
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({ jobId: 'invalid' });

    render(
      <MemoryRouter>
        <JobApplication />
      </MemoryRouter>
    );

    expect(screen.getByText('Job Not Found')).toBeInTheDocument();
  });
});

