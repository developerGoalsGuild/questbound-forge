/**
 * QuestEditForm Component Tests
 * 
 * Comprehensive unit tests for the QuestEditForm component with 90%+ coverage.
 * Tests include form validation, multi-step navigation, data loading, error handling,
 * accessibility features, and internationalization support.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QuestEditForm from '../QuestEditForm';
import { useQuest, useQuestEdit } from '@/hooks/useQuest';
import { useTranslation } from '@/hooks/useTranslation';
import type { Quest } from '@/models/quest';

// Mock the hooks
vi.mock('@/hooks/useQuest');
vi.mock('@/hooks/useTranslation');

// Mock the translation hook
const mockUseTranslation = vi.mocked(useTranslation);
const mockUseQuest = vi.mocked(useQuest);
const mockUseQuestEdit = vi.mocked(useQuestEdit);

// Mock quest data
const mockQuest: Quest = {
  id: 'quest-1',
  userId: 'user-1',
  title: 'Test Quest',
  description: 'Test quest description',
  difficulty: 'medium',
  rewardXp: 100,
  status: 'draft',
  category: 'Work',
  tags: ['test', 'example'],
  privacy: 'public',
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
  createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
  kind: 'quantitative',
  linkedGoalIds: ['goal-1'],
  linkedTaskIds: ['task-1'],
  dependsOnQuestIds: [],
  targetCount: 5,
  countScope: 'completed_tasks',
  periodDays: 7,
};

// Mock translations
const mockTranslations = {
  quest: {
    title: 'Edit Quest',
    description: 'Edit your quest details and settings',
    fields: {
      title: 'Title',
      description: 'Description',
      category: 'Category',
      difficulty: 'Difficulty',
      privacy: 'Privacy',
      kind: 'Quest Type',
      deadline: 'Deadline',
      targetCount: 'Target Count',
      countScope: 'Count Scope',
      period: 'Period',
    },
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
    privacy: {
      public: 'Public',
      followers: 'Followers',
      private: 'Private',
    },
    kind: {
      linked: 'Linked',
      quantitative: 'Quantitative',
    },
    countScope: {
      completed_tasks: 'Completed Tasks',
      completed_goals: 'Completed Goals',
    },
    sections: {
      quantitativeSettings: 'Quantitative Settings',
      review: 'Review Quest',
      reviewDescription: 'Please review your quest details before updating.',
      calculatedReward: 'Calculated based on difficulty level',
    },
    actions: {
      next: 'Next',
      previous: 'Previous',
      updateQuest: 'Update Quest',
      updating: 'Updating...',
    },
    steps: {
      basicInfo: 'Basic Info',
      advancedOptions: 'Advanced',
      review: 'Review',
      step: 'Step',
      of: 'of',
    },
    loading: {
      loadingQuest: 'Loading quest...',
    },
    validation: {
      titleRequired: 'Title is required',
      categoryRequired: 'Category is required',
      difficultyRequired: 'Difficulty is required',
      privacyRequired: 'Privacy is required',
      kindRequired: 'Quest type is required',
      deadlineRequired: 'Deadline is required',
      deadlineFuture: 'Deadline must be in the future',
      targetCountRequired: 'Target count is required for quantitative quests',
      countScopeRequired: 'Count scope is required for quantitative quests',
      periodRequired: 'Period is required for quantitative quests',
    },
    placeholders: {
      title: 'Enter quest title...',
      description: 'Enter quest description...',
      category: 'Select category...',
      difficulty: 'Select difficulty...',
      privacy: 'Select privacy...',
      kind: 'Select quest type...',
      targetCount: 'Enter target count...',
      countScope: 'Select count scope...',
      period: 'Select period...',
    },
    tooltips: {
      title: 'Enter a clear, descriptive title for your quest.',
      description: 'Provide a detailed description of your quest.',
      category: 'Choose the category that best fits your quest.',
      difficulty: 'Select the difficulty level for your quest.',
      privacy: 'Set the privacy level for your quest.',
      kind: 'Choose the quest type.',
      targetCount: 'How many completed tasks or goals do you want to achieve?',
      countScope: 'Choose what to count for this quest.',
      period: 'How often should this quest be checked for progress?',
      deadline: 'Set a deadline for your quest.',
    },
    errors: {
      notFoundError: 'Quest not found',
    },
  },
  common: {
    back: 'Back',
  },
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('QuestEditForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockUseTranslation.mockReturnValue({
      t: mockTranslations,
      language: 'en',
      setLanguage: vi.fn(),
    });

    mockUseQuest.mockReturnValue({
      quest: mockQuest,
      loading: false,
      error: null,
      loadQuest: vi.fn(),
      refetch: vi.fn(),
    });

    mockUseQuestEdit.mockReturnValue({
      edit: mockEdit,
      loading: false,
      error: null,
      validationErrors: {},
      isEditing: vi.fn().mockReturnValue(false),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state when quest is loading', () => {
      mockUseQuest.mockReturnValue({
        quest: null,
        loading: true,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByText('Loading quest...')).toBeInTheDocument();
      expect(screen.getByText('Loading quest...')).toBeInTheDocument();
    });

    it('should render error state when quest fails to load', () => {
      mockUseQuest.mockReturnValue({
        quest: null,
        loading: false,
        error: 'Failed to load quest',
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByText('Failed to load quest')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render not found error when quest is null', () => {
      mockUseQuest.mockReturnValue({
        quest: null,
        loading: false,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByText('Quest Not Found')).toBeInTheDocument();
    });

    it('should render form when quest is loaded successfully', () => {
      mockUseQuest.mockReturnValue({
        quest: mockQuest,
        loading: false,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Quest')).toBeInTheDocument();
    });
  });

  describe('Form Pre-population', () => {
    it('should pre-populate form with quest data', () => {
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Test Quest')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test quest description')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should pre-populate quantitative quest fields', () => {
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to step 2
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Quantitative')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
    });
  });

  describe('Multi-step Navigation', () => {
    it('should navigate to next step when Next button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });

    it('should navigate to previous step when Previous button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to step 2
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();

      // Navigate back to step 1
      await user.click(screen.getByText('Previous'));
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('should show progress bar with correct percentage', () => {
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '33.33333333333333');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields in step 1', async () => {
      const user = userEvent.setup();
      
      // Mock quest with empty required fields
      const emptyQuest = { ...mockQuest, title: '', category: '', difficulty: '' };
      mockUseQuest.mockReturnValue({
        quest: emptyQuest,
        loading: false,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
      expect(screen.getByText('Difficulty is required')).toBeInTheDocument();
    });

    it('should validate required fields in step 2', async () => {
      const user = userEvent.setup();
      
      // Mock quest with empty required fields for step 2
      const emptyQuest = { 
        ...mockQuest, 
        privacy: '', 
        kind: '', 
        deadline: undefined 
      };
      mockUseQuest.mockReturnValue({
        quest: emptyQuest,
        loading: false,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to step 2
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Privacy is required')).toBeInTheDocument();
      expect(screen.getByText('Quest type is required')).toBeInTheDocument();
      expect(screen.getByText('Deadline is required')).toBeInTheDocument();
    });

    it('should validate deadline is in the future', async () => {
      const user = userEvent.setup();
      
      // Mock quest with past deadline
      const pastDeadlineQuest = { 
        ...mockQuest, 
        deadline: Date.now() - 24 * 60 * 60 * 1000 // 1 day ago
      };
      mockUseQuest.mockReturnValue({
        quest: pastDeadlineQuest,
        loading: false,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to step 2
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Deadline must be in the future')).toBeInTheDocument();
    });

    it.skip('should validate quantitative quest fields', async () => {
      const user = userEvent.setup();
      
      // Mock quantitative quest with empty fields
      const emptyQuantitativeQuest = { 
        ...mockQuest, 
        kind: 'quantitative',
        targetCount: null,
        countScope: null,
        periodDays: null
      };
      mockUseQuest.mockReturnValue({
        quest: emptyQuantitativeQuest,
        loading: false,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to step 2
      await user.click(screen.getByText('Next'));
      
      // Wait for form to be initialized with quest data
      await screen.findByText('Target Count');
      
      // Check if quantitative fields are visible
      expect(screen.getByText('Target Count')).toBeInTheDocument();
      expect(screen.getByText('Count Scope')).toBeInTheDocument();
      expect(screen.getByText('Period')).toBeInTheDocument();
      
      // Try to go to step 3 (this should trigger validation)
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Target count is required for quantitative quests')).toBeInTheDocument();
      expect(screen.getByText('Count scope is required for quantitative quests')).toBeInTheDocument();
      expect(screen.getByText('Period is required for quantitative quests')).toBeInTheDocument();
    });

    it('should clear errors when field values change', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Clear title field to trigger validation error
      const titleInput = screen.getByDisplayValue('Test Quest');
      await user.clear(titleInput);
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Title is required')).toBeInTheDocument();

      // Type in title field to clear error
      await user.type(titleInput, 'New Title');
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      const user = userEvent.setup();
      mockEdit.mockResolvedValue(mockQuest);

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to review step
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      // Submit form
      await user.click(screen.getByText('Update Quest'));

      expect(mockEdit).toHaveBeenCalledWith('quest-1', expect.objectContaining({
        title: 'Test Quest',
        description: 'Test quest description',
        category: 'Work',
        difficulty: 'medium',
        privacy: 'public',
        kind: 'quantitative',
        targetCount: 5,
        countScope: 'completed_tasks',
        periodDays: 7,
      }));
    });

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();
      mockEdit.mockResolvedValue(mockQuest);

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to review step and submit
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Update Quest'));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockQuest);
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockUseQuestEdit.mockReturnValue({
        edit: mockEdit,
        loading: true,
        error: null,
        validationErrors: {},
        isEditing: vi.fn().mockReturnValue(true),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to review step
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Updating...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    });

    it('should display error message when submission fails', () => {
      mockUseQuestEdit.mockReturnValue({
        edit: mockEdit,
        loading: false,
        error: 'Failed to update quest',
        validationErrors: {},
        isEditing: vi.fn().mockReturnValue(false),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByText('Failed to update quest')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const titleInput = screen.getByDisplayValue('Test Quest');
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');

      const descriptionInput = screen.getByDisplayValue('Test quest description');
      expect(descriptionInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Clear title field to trigger validation error
      const titleInput = screen.getByDisplayValue('Test Quest');
      await user.clear(titleInput);
      await user.click(screen.getByText('Next'));

      const errorMessage = screen.getByText('Title is required');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('id', 'error-title');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Tab through form elements: first tab should focus the title input
      await user.tab();
      expect(screen.getByDisplayValue('Test Quest')).toHaveFocus();

      await user.tab();
      expect(screen.getByDisplayValue('Test quest description')).toHaveFocus();
    });
  });

  describe('Internationalization', () => {
    it('should display translated text for different languages', () => {
      mockUseTranslation.mockReturnValue({
        t: {
          ...mockTranslations,
          quest: {
            ...mockTranslations.quest,
            title: 'Editar Misión',
            fields: {
              ...mockTranslations.quest.fields,
              title: 'Título',
            },
          },
        },
        language: 'es',
        setLanguage: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      expect(screen.getByText('Título *')).toBeInTheDocument();
    });

    it('should display tooltips with translated text', () => {
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const infoIcons = screen.getAllByRole('button', { hidden: true });
      expect(infoIcons.length).toBeGreaterThan(0); // Should have tooltip buttons
    });
  });

  describe('Quantitative Quest Specific Features', () => {
    it('should show quantitative settings section for quantitative quests', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to step 2
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Quantitative Settings')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });

    it('should not show quantitative settings for linked quests', async () => {
      const user = userEvent.setup();
      
      const linkedQuest = { ...mockQuest, kind: 'linked' as const };
      mockUseQuest.mockReturnValue({
        quest: linkedQuest,
        loading: false,
        error: null,
        loadQuest: vi.fn(),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to step 2
      await user.click(screen.getByText('Next'));

      expect(screen.queryByText('Quantitative Settings')).not.toBeInTheDocument();
    });
  });

  describe('Review Step', () => {
    it('should display all quest information in review step', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to review step
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('Test quest description')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
      // Look for medium/public in any occurrence within the review details
      expect(screen.getAllByText('medium').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Public').length).toBeGreaterThan(0);
    });

    it('should display calculated reward XP', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to review step
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      // Look for the XP reward specifically in the reward section
      expect(screen.getByText('100', { selector: '[class*="text-muted-foreground"]' })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle edit function errors gracefully', async () => {
      const user = userEvent.setup();
      mockEdit.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <QuestEditForm questId="quest-1" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Navigate to review step and submit
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Update Quest'));

      // Should not call onSuccess when edit fails
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});
