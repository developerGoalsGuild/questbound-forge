import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GoalActions from '../GoalActions';
import { useTranslation } from '@/hooks/useTranslation';

// Mock dependencies
vi.mock('@/hooks/useTranslation');

// Mock translation data
const mockTranslations = {
  goalActions: {
    actions: {
      edit: 'Edit',
      delete: 'Delete',
      viewTasks: 'View Tasks',
      createTask: 'Create Task'
    },
    confirmations: {
      delete: {
        title: 'Delete Goal',
        message: 'Are you sure you want to delete this goal? This action cannot be undone.',
        confirm: 'Delete',
        cancel: 'Cancel'
      }
    },
    tooltips: {
      edit: 'Edit this goal',
      delete: 'Delete this goal',
      viewTasks: 'View and manage tasks for this goal',
      createTask: 'Create a new task for this goal'
    }
  }
};

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

describe('GoalActions', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockImplementation(mockUseTranslation);
  });

  describe('Rendering', () => {
    test('renders edit and delete buttons by default', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    test('renders additional actions when provided', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      const mockOnViewTasks = vi.fn();
      const mockOnCreateTask = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onViewTasks={mockOnViewTasks}
            onCreateTask={mockOnCreateTask}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    test('renders with proper accessibility attributes', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      expect(editButton).toHaveAttribute('aria-label', 'Edit this goal');
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete this goal');
    });
  });

  describe('User Interactions', () => {
    test('calls onEdit when edit button is clicked', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('goal-123');
    });

    test('calls onViewTasks when view tasks button is clicked', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      const mockOnViewTasks = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onViewTasks={mockOnViewTasks}
          />
        </TestWrapper>
      );

      const viewTasksButton = screen.getByRole('button', { name: /view tasks/i });
      await user.click(viewTasksButton);

      expect(mockOnViewTasks).toHaveBeenCalledWith('goal-123');
    });

    test('calls onCreateTask when create task button is clicked', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      const mockOnCreateTask = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onCreateTask={mockOnCreateTask}
          />
        </TestWrapper>
      );

      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      expect(mockOnCreateTask).toHaveBeenCalledWith('goal-123');
    });

    test('shows confirmation dialog when delete button is clicked', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Check confirmation dialog appears
      expect(screen.getByText('Delete Goal')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this goal? This action cannot be undone.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('calls onDelete when delete is confirmed', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      expect(mockOnDelete).toHaveBeenCalledWith('goal-123');
    });

    test('does not call onDelete when delete is cancelled', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('shows loading state for delete operation', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            isDeleting={true}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeDisabled();
      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });

    test('shows loading state for edit operation', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            isEditing={true}
          />
        </TestWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeDisabled();
      expect(screen.getByText(/editing/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      editButton.focus();

      // Tab to next button
      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: /delete/i })).toHaveFocus();
    });

    test('announces actions to screen readers', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      expect(editButton).toHaveAttribute('aria-label', 'Edit this goal');
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete this goal');
    });

    test('confirmation dialog is accessible', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });
  });

  describe('Error Handling', () => {
    test('handles delete errors gracefully', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn().mockRejectedValue(new Error('Delete failed'));
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      // Should handle error gracefully (error would be handled by parent component)
      expect(mockOnDelete).toHaveBeenCalledWith('goal-123');
    });
  });

  describe('Internationalization', () => {
    test('uses translated button labels', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    test('uses translated confirmation dialog text', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('Delete Goal')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this goal? This action cannot be undone.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing callbacks gracefully', () => {
      render(
        <TestWrapper>
          <GoalActions 
            goalId="goal-123"
            onEdit={undefined as any}
            onDelete={undefined as any}
          />
        </TestWrapper>
      );

      // Should render without crashing
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    test('handles empty goalId', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      render(
        <TestWrapper>
          <GoalActions 
            goalId=""
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      // Should render without crashing
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });
});
