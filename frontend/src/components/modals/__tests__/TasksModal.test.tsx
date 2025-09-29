/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import TasksModal from '../TasksModal';

// Mock the API functions
vi.mock('@/lib/apiTask', () => ({
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => open ? <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>{children}</div> : null,
  DialogContent: ({ children, className }: any) => <div data-testid="dialog-content" className={className}>{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogFooter: ({ children, className }: any) => <div data-testid="dialog-footer" className={className}>{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, 'aria-label': ariaLabel, title }: any) => (
    <button
      data-testid={`button-${variant || 'default'}-${size || 'default'}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children, className }: any) => <table data-testid="table" className={className}>{children}</table>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableCell: ({ children, className, colSpan }: any) => <td data-testid="table-cell" className={className} colSpan={colSpan}>{children}</td>
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ type, value, onChange, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, placeholder }: any) => (
    <input
      data-testid="input"
      type={type}
      value={value}
      onChange={onChange}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      placeholder={placeholder}
    />
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onChange, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy }: any) => (
    <select
      data-testid="select"
      value={value}
      onChange={onChange}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </select>
  )
}));

vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  Pencil: () => <div data-testid="pencil-icon" />,
  Trash: () => <div data-testid="trash-icon" />,
  Check: () => <div data-testid="check-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

// Mock the translation hook
const mockTranslation = {
  goals: {
    modals: {
      viewTask: { title: 'My Tasks' }
    },
    list: {
      columns: {
        title: 'Title',
        deadline: 'Deadline',
        status: 'Status',
        tags: 'Tags',
        actions: 'Actions'
      },
      noTasks: 'No tasks available.'
    },
    statusLabels: {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      archived: 'Archived'
    },
    placeholders: {
      taskTags: 'Comma separated tags'
    },
    validation: {
      taskTitleRequired: 'Task title is required',
      taskDueAtRequired: 'Task due date is required',
      taskDueAtInvalid: 'Invalid due date',
      taskStatusInvalid: 'Invalid status',
      taskTagsRequired: 'At least one tag is required',
      taskTagsInvalid: 'Tags can only contain letters, numbers, hyphens, and underscores'
    },
    confirmDeleteTask: 'Are you sure you want to delete this task?',
    paginationLabel: 'Pagination',
    paginationFirst: 'First Page',
    paginationPrevious: 'Previous Page',
    paginationPage: 'Page',
    paginationOf: 'of',
    paginationNext: 'Next Page',
    paginationLast: 'Last Page'
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    ascending: 'Ascending',
    descending: 'Descending'
  }
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockTranslation })
}));

describe('TasksModal', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdateTask = vi.fn();
  const mockOnDeleteTask = vi.fn();
  const mockOnTasksChange = vi.fn();

  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      dueAt: Math.floor(new Date('2024-12-31').getTime() / 1000),
      status: 'active',
      tags: ['tag1', 'tag2']
    },
    {
      id: '2',
      title: 'Task 2',
      dueAt: Math.floor(new Date('2024-12-25').getTime() / 1000),
      status: 'completed',
      tags: ['tag3']
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    tasks: mockTasks,
    onUpdateTask: mockOnUpdateTask,
    onDeleteTask: mockOnDeleteTask,
    onTasksChange: mockOnTasksChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders modal with tasks table', () => {
    render(<TasksModal {...defaultProps} />);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('My Tasks');
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  test('does not render modal when isOpen is false', () => {
    render(<TasksModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  test('displays tasks in table rows', () => {
    render(<TasksModal {...defaultProps} />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('tag1, tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
  });

  test('shows no tasks message when tasks array is empty', () => {
    render(<TasksModal {...defaultProps} tasks={[]} />);

    expect(screen.getByText('No tasks available.')).toBeInTheDocument();
  });

  test('sorts tasks by title when title header is clicked', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    const titleHeader = screen.getByRole('button', { name: /Title/ });
    await user.click(titleHeader);

    // Check that sort icon is displayed
    expect(screen.getByLabelText('Ascending')).toBeInTheDocument();
  });

  test('sorts tasks by due date when deadline header is clicked', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    const deadlineHeader = screen.getByRole('button', { name: /Deadline/ });
    await user.click(deadlineHeader);

    expect(screen.getByLabelText('Descending')).toBeInTheDocument();
  });

  test('toggles sort direction when same column is clicked again', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    const titleHeader = screen.getByRole('button', { name: /Title/ });
    await user.click(titleHeader); // First click - ascending

    expect(screen.getByLabelText('Ascending')).toBeInTheDocument();

    await user.click(titleHeader); // Second click - descending

    expect(screen.getByLabelText('Descending')).toBeInTheDocument();
  });

  test('starts editing a task when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    // Should show input fields for editing
    expect(screen.getAllByTestId('input')).toHaveLength(3); // title, due date, tags
    expect(screen.getByTestId('select')).toBeInTheDocument(); // status
  });

  test('cancels editing when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/ });
    await user.click(cancelButtons[0]);

    // Should go back to display mode
    expect(screen.queryByTestId('input')).not.toBeInTheDocument();
  });

  test('validates required fields during editing', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    // Find and click edit button for Task 1 (second in sorted list due to dueAt sorting)
    const taskRows = screen.getAllByText('Task 1').map(el => el.closest('tr')).filter(Boolean);
    const task1Row = taskRows[0];
    const editButton = task1Row?.querySelector('[aria-label="Edit"]') as HTMLElement;
    await user.click(editButton);

    // Clear title input
    const inputs = screen.getAllByTestId('input');
    const titleInput = inputs.find(input => input.value === 'Task 1');
    if (titleInput) {
      await user.clear(titleInput);
    }

    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    expect(screen.getByText('Task title is required')).toBeInTheDocument();
  });

  test('validates due date during editing', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    // Find and click edit button for Task 1 (second in sorted list due to dueAt sorting)
    const taskRows = screen.getAllByText('Task 1').map(el => el.closest('tr')).filter(Boolean);
    const task1Row = taskRows[0];
    const editButton = task1Row?.querySelector('[aria-label="Edit"]') as HTMLElement;
    await user.click(editButton);

    // Clear date input
    const inputs = screen.getAllByTestId('input');
    const dateInput = inputs.find(input => input.type === 'date');
    if (dateInput) {
      await user.clear(dateInput);
    }

    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    expect(screen.getByText('Task due date is required')).toBeInTheDocument();
  });

  test('validates tags during editing', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    // Find and click edit button for Task 1 (second in sorted list due to dueAt sorting)
    const taskRows = screen.getAllByText('Task 1').map(el => el.closest('tr')).filter(Boolean);
    const task1Row = taskRows[0];
    const editButton = task1Row?.querySelector('[aria-label="Edit"]') as HTMLElement;
    await user.click(editButton);

    // Clear tags input
    const inputs = screen.getAllByTestId('input');
    const tagsInput = inputs.find(input => input.value === 'tag1, tag2');
    if (tagsInput) {
      await user.clear(tagsInput);
    }

    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    expect(screen.getByText('At least one tag is required')).toBeInTheDocument();
  });

  test('saves edited task with valid data', async () => {
    const user = userEvent.setup();
    mockOnUpdateTask.mockResolvedValue(undefined);

    render(<TasksModal {...defaultProps} />);

    // Click the first edit button (Task 2 comes first due to sorting)
    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    // Wait for edit mode to be activated
    await waitFor(() => {
      expect(screen.getAllByTestId('input')).toHaveLength(3); // title, due date, tags
    });

    // Modify title
    const titleInput = screen.getByDisplayValue('Task 2');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Task');

    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '2',
          title: 'Updated Task',
          status: 'completed',
          tags: ['tag3']
        })
      );
    });
  });

  test('handles save error gracefully', async () => {
    const user = userEvent.setup();
    mockOnUpdateTask.mockRejectedValue(new Error('Save failed'));

    render(<TasksModal {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdateTask).toHaveBeenCalled();
    });

    // Modal should still be open on error
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  test('deletes task when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    mockOnDeleteTask.mockResolvedValue(undefined);

    render(<TasksModal {...defaultProps} />);

    // Find delete button for Task 1 (second in sorted list due to dueAt sorting)
    const taskRows = screen.getAllByText('Task 1').map(el => el.closest('tr')).filter(Boolean);
    const task1Row = taskRows[0];
    const deleteButton = task1Row?.querySelector('[aria-label="Delete"]') as HTMLElement;
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
    expect(mockOnDeleteTask).toHaveBeenCalledWith('1');
  });

  test('does not delete task when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TasksModal {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[0]);

    expect(mockOnDeleteTask).not.toHaveBeenCalled();
  });

  test('handles delete error gracefully', async () => {
    const user = userEvent.setup();
    mockOnDeleteTask.mockRejectedValue(new Error('Delete failed'));

    render(<TasksModal {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockOnDeleteTask).toHaveBeenCalled();
    });

    // Modal should still be open on error
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TasksModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /Close/ });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows loading state during task update', async () => {
    const user = userEvent.setup();
    const { updateTask } = await import('@/lib/apiTask');
    
    // Mock a slow API response
    vi.mocked(updateTask).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        id: '1',
        title: 'Updated Task',
        dueAt: Math.floor(new Date('2024-12-31').getTime() / 1000),
        status: 'completed',
        tags: ['tag1', 'tag2'],
        createdAt: 1609459200000,
        updatedAt: 1609459200000,
      }), 100))
    );

    render(<TasksModal {...defaultProps} />);

    // Start editing
    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    // Update title (Task 2 comes first due to sorting by dueAt)
    const titleInput = screen.getByDisplayValue('Task 2');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Task');

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    // Check loading state
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Save/ })).toHaveTextContent('');

    // Wait for completion
    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('2', {
        title: 'Updated Task',
        dueAt: expect.any(Number),
        status: 'completed',
        tags: ['tag3']
      });
    });
  });

  test('shows loading state during task delete', async () => {
    const user = userEvent.setup();
    const { deleteTask } = await import('@/lib/apiTask');
    
    // Mock a slow API response
    vi.mocked(deleteTask).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(), 100))
    );

    render(<TasksModal {...defaultProps} />);

    // Click delete
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[0]);

    // Check loading state
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[0]).toHaveTextContent('');

    // Wait for completion
    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith('2');
    });
  });

  test('handles API errors gracefully during update', async () => {
    const user = userEvent.setup();
    const { updateTask } = await import('@/lib/apiTask');
    
    vi.mocked(updateTask).mockRejectedValue(new Error('API Error'));

    render(<TasksModal {...defaultProps} />);

    // Start editing
    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    // Update title (Task 2 comes first due to sorting by dueAt)
    const titleInput = screen.getByDisplayValue('Task 2');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Task');

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    // Wait for error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Update Failed",
        description: "API Error",
        variant: "destructive",
      });
    });

    // Should still be in edit mode
    expect(screen.getByDisplayValue('Updated Task')).toBeInTheDocument();
  });

  test('handles API errors gracefully during delete', async () => {
    const user = userEvent.setup();
    const { deleteTask } = await import('@/lib/apiTask');
    
    vi.mocked(deleteTask).mockRejectedValue(new Error('Delete failed'));

    render(<TasksModal {...defaultProps} />);

    // Click delete
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[0]);

    // Wait for error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Delete Failed",
        description: "Delete failed",
        variant: "destructive",
      });
    });

    // Task should still be visible
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  test('calls onTasksChange after successful update', async () => {
    const user = userEvent.setup();
    const { updateTask } = await import('@/lib/apiTask');
    
    vi.mocked(updateTask).mockResolvedValue({
      id: '1',
      title: 'Updated Task',
      dueAt: Math.floor(new Date('2024-12-31').getTime() / 1000),
      status: 'completed',
      tags: ['tag1', 'tag2'],
      createdAt: 1609459200000,
      updatedAt: 1609459200000,
    });

    render(<TasksModal {...defaultProps} />);

    // Start editing
    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    // Update title (Task 2 comes first due to sorting by dueAt)
    const titleInput = screen.getByDisplayValue('Task 2');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Task');

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save/ });
    await user.click(saveButton);

    // Wait for completion
    await waitFor(() => {
      expect(mockOnTasksChange).toHaveBeenCalled();
    });
  });

  test('calls onTasksChange after successful delete', async () => {
    const user = userEvent.setup();
    const { deleteTask } = await import('@/lib/apiTask');
    
    vi.mocked(deleteTask).mockResolvedValue(undefined);

    render(<TasksModal {...defaultProps} />);

    // Click delete
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[0]);

    // Wait for completion
    await waitFor(() => {
      expect(mockOnTasksChange).toHaveBeenCalled();
    });
  });

  test('closes modal when clicking outside', () => {
    render(<TasksModal {...defaultProps} />);

    const dialog = screen.getByTestId('dialog');
    fireEvent.click(dialog);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('resets state when tasks change', () => {
    const { rerender } = render(<TasksModal {...defaultProps} />);

    // Start editing
    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    fireEvent.click(editButtons[0]);

    // Check that editing inputs are present
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBeGreaterThan(0);

    // Change tasks
    rerender(<TasksModal {...defaultProps} tasks={[mockTasks[0]]} />);

    // Should reset editing state - no inputs should be present
    expect(screen.queryByTestId('input')).not.toBeInTheDocument();
  });

  test('paginates tasks correctly', () => {
    // Create more tasks than ITEMS_PER_PAGE (20)
    const manyTasks = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Task ${i + 1}`,
      dueAt: Math.floor(Date.now() / 1000),
      status: 'active',
      tags: [`tag${i + 1}`]
    }));

    render(<TasksModal {...defaultProps} tasks={manyTasks} />);

    // Should show pagination controls
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  test('formats dates correctly for display', () => {
    render(<TasksModal {...defaultProps} />);

    // Should format the epoch timestamps to readable dates
    const formattedDate = new Date(mockTasks[0].dueAt * 1000).toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });
});
