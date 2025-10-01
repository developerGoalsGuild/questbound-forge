import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GoalsList from '../GoalsList';
import { useTranslation } from '@/hooks/useTranslation';
import { loadGoals, deleteGoal } from '@/lib/apiGoal';

// Mock dependencies
vi.mock('@/hooks/useTranslation');
vi.mock('@/lib/apiGoal');

// Mock translation data
const mockTranslations = {
  goalList: {
    title: 'My Goals',
    subtitle: 'Manage your goals and track your progress',
    actions: {
      createGoal: 'Create New Goal',
      refresh: 'Refresh',
      search: 'Search goals',
      filter: 'Filter by status'
    },
    filters: {
      all: 'All',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      archived: 'Archived'
    },
    columns: {
      title: 'Title',
      description: 'Description',
      deadline: 'Deadline',
      status: 'Status',
      actions: 'Actions'
    },
    messages: {
      noGoals: 'No goals found',
      loading: 'Loading goals...',
      error: 'Failed to load goals'
    },
    confirmations: {
      delete: {
        title: 'Delete Goal',
        message: 'Are you sure you want to delete this goal? This action cannot be undone.',
        confirm: 'Delete',
        cancel: 'Cancel'
      }
    }
  }
};

// Mock translation hook
const mockUseTranslation = vi.fn(() => ({
  t: () => mockTranslations,
  language: 'en'
}));

// Mock API functions
const mockLoadGoals = vi.mocked(loadGoals);
const mockDeleteGoal = vi.mocked(deleteGoal);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('GoalsList', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockImplementation(mockUseTranslation);
    
    // Default mock data
    mockLoadGoals.mockResolvedValue([
      {
        id: 'goal-1',
        title: 'Learn TypeScript',
        description: 'Master TypeScript programming',
        deadline: '2024-12-31',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'goal-2',
        title: 'Run Marathon',
        description: 'Complete a full marathon',
        deadline: '2024-06-15',
        status: 'paused',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]);
  });

  describe('Rendering', () => {
    test('renders goals list with title and actions', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      expect(screen.getByText('My Goals')).toBeInTheDocument();
      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      
      // Wait for goals to load
      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Run Marathon')).toBeInTheDocument();
      });
    });

    test('renders search and filter controls', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/search goals/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    });

    test('renders goals in responsive layout', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      // Check that goals are rendered in a list/table format
      const goalsContainer = screen.getByTestId('goals-list');
      expect(goalsContainer).toBeInTheDocument();
    });

    test('renders with proper accessibility attributes', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search goals/i);
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder', 'Search goals...');

      const filterSelect = screen.getByLabelText(/filter by status/i);
      expect(filterSelect).toHaveAttribute('role', 'combobox');
    });
  });

  describe('Data Loading', () => {
    test('loads goals on component mount', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockLoadGoals).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
    });

    test('shows loading state while fetching goals', () => {
      mockLoadGoals.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      expect(screen.getByText('Loading goals...')).toBeInTheDocument();
    });

    test('shows error state when loading fails', async () => {
      mockLoadGoals.mockRejectedValue(new Error('Failed to load goals'));
      
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load goals')).toBeInTheDocument();
      });
    });

    test('shows empty state when no goals exist', async () => {
      mockLoadGoals.mockResolvedValue([]);
      
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No goals found')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    test('filters goals by search query', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search goals/i);
      await user.type(searchInput, 'TypeScript');

      // Should show only TypeScript goal
      expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      expect(screen.queryByText('Run Marathon')).not.toBeInTheDocument();
    });

    test('filters goals by status', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(filterSelect, 'paused');

      // Should show only paused goals
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
      expect(screen.queryByText('Learn TypeScript')).not.toBeInTheDocument();
    });

    test('clears search when clear button is clicked', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search goals/i);
      await user.type(searchInput, 'TypeScript');

      // Clear search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Should show all goals again
      expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
    });
  });

  describe('Goal Actions', () => {
    test('navigates to edit page when edit button is clicked', async () => {
      const mockNavigate = vi.fn();
      vi.doMock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/goals/goal-1/edit');
    });

    test('navigates to create goal page when create button is clicked', async () => {
      const mockNavigate = vi.fn();
      vi.doMock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /create new goal/i });
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/goals/create');
    });

    test('shows confirmation dialog when delete button is clicked', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      expect(screen.getByText('Delete Goal')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this goal? This action cannot be undone.')).toBeInTheDocument();
    });

    test('deletes goal when confirmed', async () => {
      mockDeleteGoal.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteGoal).toHaveBeenCalledWith('goal-1');
      });

      // Should refresh the goals list
      expect(mockLoadGoals).toHaveBeenCalledTimes(2);
    });

    test('cancels delete when cancel button is clicked', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockDeleteGoal).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    test('shows pagination controls for large lists', async () => {
      // Mock large dataset
      const largeGoalsList = Array.from({ length: 25 }, (_, i) => ({
        id: `goal-${i}`,
        title: `Goal ${i + 1}`,
        description: `Description for goal ${i + 1}`,
        deadline: '2024-12-31',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      mockLoadGoals.mockResolvedValue(largeGoalsList);

      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Goal 1')).toBeInTheDocument();
      });

      // Should show pagination controls
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });

    test('navigates between pages', async () => {
      const largeGoalsList = Array.from({ length: 25 }, (_, i) => ({
        id: `goal-${i}`,
        title: `Goal ${i + 1}`,
        description: `Description for goal ${i + 1}`,
        deadline: '2024-12-31',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      mockLoadGoals.mockResolvedValue(largeGoalsList);

      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Goal 1')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should show next page of goals
      await waitFor(() => {
        expect(screen.getByText('Goal 11')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search goals/i);
      searchInput.focus();

      // Tab to next element
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/filter by status/i)).toHaveFocus();
    });

    test('announces actions to screen readers', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      expect(editButton).toHaveAttribute('aria-label', 'Edit Learn TypeScript');

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete Learn TypeScript');
    });

    test('provides proper table structure for screen readers', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(5); // Title, Description, Deadline, Status, Actions
    });
  });

  describe('Error Handling', () => {
    test('handles delete errors gracefully', async () => {
      mockDeleteGoal.mockRejectedValue(new Error('Delete failed'));
      
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/delete failed/i)).toBeInTheDocument();
      });
    });

    test('handles network errors gracefully', async () => {
      mockLoadGoals.mockRejectedValue(new Error('Network error'));
      
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization', () => {
    test('uses translated text throughout', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      expect(screen.getByText('My Goals')).toBeInTheDocument();
      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
      expect(screen.getByText('Search goals')).toBeInTheDocument();
      expect(screen.getByText('Filter by status')).toBeInTheDocument();
    });

    test('uses translated status labels', async () => {
      render(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      });

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });
  });
});
