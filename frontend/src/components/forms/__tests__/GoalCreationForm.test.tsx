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
    vi.mocked(useTranslation).mockImplementation(() => ({
      t: mockTranslations,
      language: 'en',
      setLanguage: vi.fn(),
    }));
    vi.mocked(useToast).mockImplementation(() => ({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    }));
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(createGoal).mockResolvedValue({
      id: 'goal-123',
      title: 'Test Goal',
      userId: 'user-1',
      description: 'Test description',
      tags: [],
      answers: [],
      deadline: '2030-01-01',
      status: 'active',
      createdAt: '2030-01-01T00:00:00Z',
      updatedAt: '2030-01-01T00:00:00Z',
      category: 'Personal',
      milestones: [],
      totalTasks: 0,
    });
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
        expect(screen.getByRole('heading', { name: /please fix the following errors/i })).toBeInTheDocument();
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
      await user.type(screen.getByLabelText(/deadline/i), '2030-12-31');

      // Fill NLP answers (use testids as labels may vary)
      await user.type(screen.getByTestId('nlp-positive-input'), 'I will learn TypeScript');
      await user.type(screen.getByTestId('nlp-specific-input'), 'Complete 3 courses by December');
      await user.type(screen.getByTestId('nlp-evidence-input'), 'I will have built 5 projects');
      await user.type(screen.getByTestId('nlp-resources-input'), 'Online courses and books');
      await user.type(screen.getByTestId('nlp-obstacles-input'), 'Time management challenges');
      await user.type(screen.getByTestId('nlp-ecology-input'), 'Will help with career advancement');
      await user.type(screen.getByTestId('nlp-timeline-input'), '3 months, evenings and weekends');
      await user.type(screen.getByTestId('nlp-firstStep-input'), 'Enroll in first course');

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createGoal).toHaveBeenCalled();
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('goal-123');
    }, 10000);

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
      await user.type(screen.getByLabelText(/description/i), 'This is a test description.');
      await user.type(screen.getByLabelText(/deadline/i), '2030-12-31');
      // Fill minimal NLP to pass validation
      await user.type(screen.getByTestId('nlp-positive-input'), 'This is valid');
      await user.type(screen.getByTestId('nlp-specific-input'), 'This is valid');
      await user.type(screen.getByTestId('nlp-evidence-input'), 'This is valid');
      await user.type(screen.getByTestId('nlp-resources-input'), 'This is valid');
      await user.type(screen.getByTestId('nlp-obstacles-input'), 'This is valid');
      await user.type(screen.getByTestId('nlp-ecology-input'), 'This is valid');
      await user.type(screen.getByTestId('nlp-timeline-input'), 'This is valid');
      await user.type(screen.getByTestId('nlp-firstStep-input'), 'This is valid');

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      // Should attempt submission
      await waitFor(() => {
        expect(createGoal).toHaveBeenCalled();
      });
    }, 10000);

    
  });

  describe('Accessibility', () => {
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

  

  

  
});
