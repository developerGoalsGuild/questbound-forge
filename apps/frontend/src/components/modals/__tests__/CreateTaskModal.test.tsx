/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import CreateTaskModal from '../CreateTaskModal';

// Mock the UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => {
    const handleClickOutside = (e: any) => {
      if (e.target === e.currentTarget) {
        onOpenChange?.(false);
      }
    };
    return open ? <div data-testid="dialog" onClick={handleClickOutside}>{children}</div> : null;
  },
  DialogContent: ({ children, className }: any) => <div data-testid="dialog-content" className={className}>{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogFooter: ({ children, className }: any) => <div data-testid="dialog-footer" className={className}>{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant }: any) => (
    <button
      data-testid={`button-${variant || 'default'}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children, id }: any) => <div data-testid="tooltip-content" id={id}>{children}</div>,
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div data-testid="tooltip-trigger">{children}</div>
}));

vi.mock('lucide-react', () => ({
  Info: () => <div data-testid="info-icon" />,
  X: () => <div data-testid="x-icon" />
}));

// Mock the translation hook
const mockTranslation = {
  goals: {
    modal: { createTaskTitle: 'Create New Task' },
    fields: {
      taskTitle: 'Task Title',
      taskDueAt: 'Task Due Date',
      taskTags: 'Tags',
      taskStatus: 'Status'
    },
    hints: {
      taskTitle: 'Enter a descriptive title for your task',
      taskDueAt: 'Select when this task should be completed',
      taskTags: 'Add tags to categorize your task',
      taskStatus: 'Choose the current status of your task',
      iconLabel: 'More information about {field}'
    },
    placeholders: { taskTags: 'Add tag and press Enter' },
    validation: {
      taskTitleRequired: 'Task title is required',
      taskDueAtRequired: 'Task due date is required',
      taskDueAtExceedsGoalDeadline: 'Task due date cannot exceed goal deadline',
      taskTagsRequired: 'At least one tag is required',
      taskTagsInvalid: 'Tags can only contain letters, numbers, hyphens, and underscores',
      taskTagsDuplicate: 'Duplicate tags are not allowed',
      taskStatusInvalid: 'Invalid status selected'
    },
    statusLabels: {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      archived: 'Archived'
    },
    actions: { createTask: 'Create Task' }
  },
  common: {
    cancel: 'Cancel',
    loading: 'Loading...'
  }
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockTranslation })
}));

describe.skip('CreateTaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreate: mockOnCreate,
    goalDeadline: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('renders modal when isOpen is true', () => {
    render(<CreateTaskModal {...defaultProps} />);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Create New Task');
  });

  test('does not render modal when isOpen is false', () => {
    render(<CreateTaskModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  test('resets form when modal opens', () => {
    const { rerender } = render(<CreateTaskModal {...defaultProps} isOpen={false} />);

    // Open modal
    rerender(<CreateTaskModal {...defaultProps} isOpen={true} />);

    // Check that title input is empty
    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    // Check that due date input is empty
    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    expect(dueDateInput.value).toBe('');

    // Check that tags input is empty
    const tagsInput = document.getElementById('task-tags') as HTMLInputElement;
    expect(tagsInput.value).toBe('');
  });

  test('validates required fields on submit', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    expect(screen.getByText('Task title is required')).toBeInTheDocument();
    expect(screen.getByText('Task due date is required')).toBeInTheDocument();
    expect(screen.getByText('At least one tag is required')).toBeInTheDocument();
  });

  test('validates task title is required', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    // Fill other fields but leave title empty
    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    await user.type(dueDateInput, '2024-12-31');

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    expect(screen.getByText('Task title is required')).toBeInTheDocument();
  });

  test('validates due date is required', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    // Fill other fields but leave due date empty
    const titleInput = screen.getByRole('textbox', { name: 'Task Title Enter a descriptive title for your task' });
    await user.type(titleInput, 'Test Task');

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    expect(screen.getByText('Task due date is required')).toBeInTheDocument();
  });

  test('validates tags are required', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    // Fill other fields but leave tags empty
    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    await user.type(titleInput, 'Test Task');

    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    await user.type(dueDateInput, '2024-12-31');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    expect(screen.getByText('At least one tag is required')).toBeInTheDocument();
  });

  test('validates due date does not exceed goal deadline', async () => {
    const user = userEvent.setup();
    const goalDeadline = '2024-12-25'; // Earlier than task due date

    render(<CreateTaskModal {...defaultProps} goalDeadline={goalDeadline} />);

    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    await user.type(titleInput, 'Test Task');

    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2024-12-31'); // After goal deadline

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    expect(screen.getByText('Task due date cannot exceed goal deadline')).toBeInTheDocument();
  });

  test('allows adding valid tags', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  test('prevents adding duplicate tags', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');
    await user.type(tagInput, 'test-tag{enter}');

    expect(screen.getByText('Duplicate tags are not allowed')).toBeInTheDocument();
  });

  test('prevents adding invalid tags', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'invalid tag{enter}');

    expect(screen.getByText('Tags can only contain letters, numbers, hyphens, and underscores')).toBeInTheDocument();
  });

  test('allows removing tags', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    expect(screen.getByText('test-tag')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /Remove tag test-tag/i });
    await user.click(removeButton);

    expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockOnCreate.mockResolvedValue(undefined);

    render(<CreateTaskModal {...defaultProps} />);

    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    await user.type(titleInput, 'Test Task');

    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2024-12-31');

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith('Test Task', '2024-12-31', ['test-tag'], 'active');
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles submit error gracefully', async () => {
    const user = userEvent.setup();
    mockOnCreate.mockRejectedValue(new Error('Submit failed'));

    render(<CreateTaskModal {...defaultProps} />);

    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    await user.type(titleInput, 'Test Task');

    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2024-12-31');

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalled();
    });

    // Modal should still be open on error
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  test('disables buttons during submission', async () => {
    const user = userEvent.setup();
    mockOnCreate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<CreateTaskModal {...defaultProps} />);

    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    await user.type(titleInput, 'Test Task');

    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2024-12-31');

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
  });

  test('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when clicking outside', () => {
    render(<CreateTaskModal {...defaultProps} />);

    const dialog = screen.getByTestId('dialog');
    fireEvent.click(dialog);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows loading text during submission', async () => {
    const user = userEvent.setup();
    mockOnCreate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<CreateTaskModal {...defaultProps} />);

    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    await user.type(titleInput, 'Test Task');

    const dueDateInput = document.getElementById('task-dueAt') as HTMLInputElement;
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2024-12-31');

    const tagInput = screen.getByPlaceholderText('Add tag and press Enter');
    await user.type(tagInput, 'test-tag{enter}');

    const submitButton = screen.getByRole('button', { name: /Create Task/i });
    await user.click(submitButton);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
