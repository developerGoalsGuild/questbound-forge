import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GoalCreationForm from '../GoalCreationForm';
import { createGoal } from '@/lib/apiGoal';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('@/lib/apiGoal');
vi.mock('@/hooks/useTranslation');
vi.mock('@/hooks/use-toast');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

// Mock translation data
const mockTranslations = {
  goalCreation: {
    title: 'Create New Goal',
    subtitle: 'Set up a new goal with detailed planning',
    sections: {
      basicInfo: 'Basic Information',
      nlpQuestions: 'Well-formed Outcome (NLP)',
      aiFeatures: 'AI-Powered Features'
    },
    fields: {
      title: 'Title',
      description: 'Description',
      deadline: 'Deadline',
      category: 'Category'
    },
    placeholders: {
      title: 'Enter your goal title',
      description: 'Describe your goal in detail',
      deadline: 'YYYY-MM-DD',
      category: 'Select a category'
    },
    actions: {
      createGoal: 'Create Goal',
      cancel: 'Cancel',
      reset: 'Reset',
      backToGoals: 'Back to Goals',
      creating: 'Creating...',
      generateImage: 'Generate Image',
      suggestImprovements: 'Suggest Improvements'
    },
    hints: {
      title: 'Give your goal a short, action-focused name',
      description: 'Share the motivation and desired outcome',
      deadline: 'Pick a target date to finish your goal',
      category: 'Choose a category that best fits your goal',
      iconLabel: 'More information about {field}'
    },
    messages: {
      success: 'Success',
      goalCreated: 'Goal created successfully',
      error: 'Error'
    }
  },
  goals: {
    fields: {
      category: 'Category'
    },
    hints: {
      fields: {
        category: 'Choose a category that best fits your goal'
      },
      iconLabel: 'More information about {field}'
    }
  },
  common: {}
};

// Mock toast
const mockToast = vi.fn();
const mockUseToast = vi.fn(() => ({ toast: mockToast }));

// Mock navigation
const mockNavigate = vi.fn();

// Mock translation hook
const mockUseTranslation = vi.fn(() => ({
  t: () => mockTranslations,
  language: 'en'
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('GoalCreationForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockImplementation(mockUseTranslation);
    vi.mocked(useToast).mockImplementation(mockUseToast);
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(createGoal).mockResolvedValue({ id: 'goal-123', title: 'Test Goal' });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    test('renders form with all required fields', () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      expect(screen.getByTestId('goal-creation-form')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deadline/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    test('renders all NLP questions', () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const nlpQuestions = [
        'State your goal positively',
        'Make it specific and context-bound',
        'How will you know you achieved it?',
        'What resources do you have/need?',
        'What obstacles might arise?',
        'Is this ecological for you and others?',
        'When, where, with whom will this happen?',
        'What is your immediate first step?'
      ];

      nlpQuestions.forEach(question => {
        expect(screen.getByText(question)).toBeInTheDocument();
      });
    });

    test('renders form actions', () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /create goal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('renders with proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const form = screen.getByTestId('goal-creation-form');
      expect(form).toHaveAttribute('role', 'form');
      expect(form).toHaveAttribute('aria-label', 'Goal creation form');
      expect(form).toHaveAttribute('noValidate');
    });
  });

  describe('Form Validation', () => {
    test('validates required fields on submit', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/goal title is required/i)).toBeInTheDocument();
      });
    });

    test('validates title length', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'ab'); // Too short

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    test('validates deadline is future date', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const deadlineInput = screen.getByLabelText(/deadline/i);
      await user.type(deadlineInput, '2023-01-01'); // Past date

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/deadline must be in the future/i)).toBeInTheDocument();
      });
    });

    test('validates NLP answers length', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const positiveInput = screen.getByLabelText(/state your goal positively/i);
      await user.type(positiveInput, 'x'); // Too short

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/answer must be at least 10 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      const mockOnSuccess = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCreationForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Fill basic information
      await user.type(screen.getByLabelText(/title/i), 'Learn TypeScript');
      await user.type(screen.getByLabelText(/description/i), 'Master TypeScript programming');
      await user.type(screen.getByLabelText(/deadline/i), '2024-12-31');

      // Fill NLP answers
      await user.type(screen.getByLabelText(/state your goal positively/i), 'I will learn TypeScript');
      await user.type(screen.getByLabelText(/make it specific/i), 'Complete 3 courses by December');
      await user.type(screen.getByLabelText(/how will you know/i), 'I will have built 5 projects');
      await user.type(screen.getByLabelText(/what resources/i), 'Online courses and books');
      await user.type(screen.getByLabelText(/what obstacles/i), 'Time management challenges');
      await user.type(screen.getByLabelText(/is this ecological/i), 'Will help with career advancement');
      await user.type(screen.getByLabelText(/when, where, with whom/i), '3 months, evenings and weekends');
      await user.type(screen.getByLabelText(/what is your immediate/i), 'Enroll in first course');

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createGoal).toHaveBeenCalledWith({
          title: 'Learn TypeScript',
          description: 'Master TypeScript programming',
          deadline: '2024-12-31',
          category: '',
          nlpAnswers: {
            positive: 'I will learn TypeScript',
            specific: 'Complete 3 courses by December',
            evidence: 'I will have built 5 projects',
            resources: 'Online courses and books',
            obstacles: 'Time management challenges',
            ecology: 'Will help with career advancement',
            timeline: '3 months, evenings and weekends',
            firstStep: 'Enroll in first course'
          }
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('goal-123');
    });

    test('shows loading state during submission', async () => {
      // Mock a slow API response
      vi.mocked(createGoal).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'goal-123' }), 1000))
      );

      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Goal');
      await user.type(screen.getByLabelText(/deadline/i), '2024-12-31');

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/creating/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    test('handles submission errors', async () => {
      const errorMessage = 'Failed to create goal';
      vi.mocked(createGoal).mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Goal');
      await user.type(screen.getByLabelText(/deadline/i), '2024-12-31');

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      });
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/title/i);
      titleInput.focus();

      // Tab to next field
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/description/i)).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/deadline/i)).toHaveFocus();
    });

    test('announces validation errors to screen readers', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      // Should have ARIA live region for announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });

    test('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/title/i)).toHaveAttribute('id', 'goal-title');
      expect(screen.getByLabelText(/deadline/i)).toHaveAttribute('id', 'goal-deadline');
    });
  });

  describe('Form Reset', () => {
    test('resets form when reset button is clicked', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Goal');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');

      // Click reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Form should be cleared
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });
  });

  describe('Cancel Functionality', () => {
    test('calls onCancel when cancel button is clicked', async () => {
      const mockOnCancel = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCreationForm onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('navigates to goals page when cancel is clicked without onCancel prop', async () => {
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/goals');
    });
  });

  describe('Loading States', () => {
    test('shows skeleton loading on initial load', () => {
      // Mock loading state
      vi.mocked(useTranslation).mockReturnValue({
        t: () => mockTranslations,
        language: 'en'
      });

      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      // Should show skeleton components
      expect(screen.getByTestId('skeleton-form-section')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-nlp-questions')).toBeInTheDocument();
    });
  });

  describe('Network Error Handling', () => {
    test('handles network errors', async () => {
      // Mock network error
      vi.mocked(createGoal).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Goal');
      await user.type(screen.getByLabelText(/deadline/i), '2024-12-31');

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Validation', () => {
    test('validates fields as user types', async () => {
      vi.useFakeTimers();
      
      render(
        <TestWrapper>
          <GoalCreationForm />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/title/i);

      // Type invalid input
      await user.type(titleInput, 'ab');

      // Fast-forward timers to trigger debounced validation
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });
});
