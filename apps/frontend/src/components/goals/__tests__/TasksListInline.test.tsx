import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TasksListInline from '../TasksListInline';

vi.mock('@/lib/apiTask', () => ({
  submitTaskVerification: vi.fn().mockResolvedValue({ id: 'task-1' }),
  reviewTaskVerification: vi.fn(),
  flagTaskVerification: vi.fn()
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      goals: {
        actions: {
          submitVerification: 'Submit for review'
        },
        messages: {
          verificationSubmitted: 'Verification submitted'
        },
        validation: {
          taskCompletionNoteRequired: 'Completion note required'
        },
        tasks: {
          title: 'Tasks',
          addTask: 'Add Task',
          createTask: 'Create Task',
          fields: {
            title: 'Title',
            dueDate: 'Due Date',
            status: 'Status',
            tags: 'Tags',
            completionNote: 'Completion Note'
          }
        },
        statusLabels: {
          completed: 'Completed'
        }
      },
      common: {
        success: 'Success',
        error: 'Error'
      }
    }
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant, size }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} data-variant={variant} data-size={size}>
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span />,
  Edit2: () => <span />,
  Trash2: () => <span />,
  Check: () => <span />,
  X: () => <span />,
  Calendar: () => <span />,
  Tag: () => <span />,
  Loader2: () => <span />,
  AlertCircle: () => <span />
}));

describe('TasksListInline', () => {
  it('submits verification for completed task', async () => {
    const { submitTaskVerification } = await import('@/lib/apiTask');
    const onUpdateTask = vi.fn();
    const onDeleteTask = vi.fn();
    const onCreateTask = vi.fn();
    const onTasksChange = vi.fn();

    render(
      <TasksListInline
        tasks={[
          {
            id: 'task-1',
            goalId: 'goal-1',
            title: 'Task 1',
            dueAt: 1735689600,
            status: 'completed',
            tags: ['tag'],
            completionNote: 'Completed after finishing the deliverables.',
            createdAt: 0,
            updatedAt: 0
          }
        ]}
        goalId="goal-1"
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onCreateTask={onCreateTask}
        onTasksChange={onTasksChange}
      />
    );

    fireEvent.click(screen.getByText('Submit for review'));

    await waitFor(() => {
      expect(submitTaskVerification).toHaveBeenCalledWith('task-1', {
        completionNote: 'Completed after finishing the deliverables.',
        evidenceType: 'text',
        evidencePayload: { note: 'Completed after finishing the deliverables.' }
      });
    });
  });
});
