// src/pages/goals/__tests__/Goals.test.tsx
import React from 'react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// -------- Hoisted mocks (fix ReferenceError) --------
const { graphqlMock, toastMock, loadGoalsMock, createGoalMock } = vi.hoisted(() => ({
  graphqlMock: vi.fn(),
  toastMock: vi.fn(),
  loadGoalsMock: vi.fn(),
  createGoalMock: vi.fn(),
}));

// Subject under test
import GoalsPage from '../Goals';

// ----- Mocks -----

// Minimal i18n fixture so labels exist during tests
vi.mock('@/hooks/useTranslation', () => {
  const t = {
    common: { loading: 'Loading...', error: 'Error' },
    goals: {
      title: 'Goals',
      actions: {
        refresh: 'Refresh',
        generateImage: 'Generate Image',
        suggestImprovements: 'Suggest',
        createGoal: 'Create Goal',
      },
      validation: {
        titleRequired: 'Title is required',
        deadlineRequired: 'Deadline is required',
      },
      hints: {
        iconLabel: 'More information about {field}',
        fields: { title: 'Give your goal a clear title.' },
        questions: { positive: 'Be positive.' },
        filters: { search: 'Filter by text', status: 'Filter by status' },
        tasks: { title: 'Short task name', dueAt: 'When is it due?' },
      },
      section: {
        nlpTitle: 'Planner',
        nlpSubtitle: 'Answer to refine your plan',
      },
      fields: {
        title: 'Title',
        description: 'Description',
        deadline: 'Deadline',
      },
      list: {
        myGoals: 'My Quests',
        noGoals: 'No goals yet.',
        statusFilterLabel: 'Status',
        searchLabel: 'Search goals',
        allStatuses: 'All',
        statusActive: 'Active',
        statusPaused: 'Paused',
        statusCompleted: 'Completed',
        statusArchived: 'Archived',
        columns: {
          title: 'Title',
          description: 'Description',
          deadline: 'Deadline',
          status: 'Status',
          actions: 'Actions',
        },
        viewTasks: 'View Tasks',
        createTask: 'Create Task',
        tasks: 'Tasks',
        noTasks: 'No tasks yet.',
        taskTitle: 'Task title',
        taskDueAtLabel: 'Due date',
        taskCreated: 'Task created',
        showMore: 'Show more',
      },
      inspiration: { title: 'Inspiration' },
      suggestions: { title: 'Suggestions' },
      messages: {
        aiImageFailed: 'AI image failed',
        aiSuggestFailed: 'AI suggestions failed',
      },
    },
  };
  return { useTranslation: () => ({ t, language: 'en' }) };
});

// Toasts
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

// RoleRoute – just render children
vi.mock('@/lib/auth', () => ({ RoleRoute: ({ children }: any) => <>{children}</> }));

// Tooltip & Lucide Info → keep DOM simple
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
}));
vi.mock('lucide-react', () => ({ Info: (props: any) => <svg aria-hidden="true" {...props} /> }));

// GraphQL client
vi.mock('@/lib/utils', () => ({
  graphQLClient: () => ({ graphql: graphqlMock }),
}));

// API helpers for goals
vi.mock('@/lib/apiGoal', () => ({
  loadGoals: (...args: any[]) => loadGoalsMock(...args),
  createGoal: (...args: any[]) => createGoalMock(...args),
}));

// GQL documents – only identity needed for comparisons in tests
vi.mock('@/graphql/queries', () => ({
  MY_GOALS: { kind: 'Doc', name: 'MY_GOALS' },
  MY_TASKS: { kind: 'Doc', name: 'MY_TASKS' },
}));
vi.mock('@/graphql/mutations', () => ({
  CREATE_GOAL: { kind: 'Doc', name: 'CREATE_GOAL' },
  ADD_TASK: { kind: 'Doc', name: 'ADD_TASK' },
}));

// Utility to render
const renderPage = () =>
  render(
    <BrowserRouter>
      <GoalsPage />
    </BrowserRouter>
  );

// Reset between tests
beforeEach(() => {
  vi.clearAllMocks();
  // default: two goals returned
  loadGoalsMock.mockResolvedValue([
    {
      id: 'g1',
      title: 'Learn Spanish',
      description: 'Daily practice',
      deadline: Math.floor(new Date('2030-01-01T10:00:00Z').getTime() / 1000),
      status: 'active',
    },
    {
      id: 'g2',
      title: 'Run 5K',
      description: '',
      deadline: '2031-02-01T12:00:00Z',
      status: 'paused',
    },
  ]);
  // GraphQL default: tasks empty
  graphqlMock.mockResolvedValue({ data: { myTasks: [] }, errors: null });
  // fetch default
  // @ts-expect-error
  global.fetch = vi.fn();
});

// ----- Tests -----

describe('GoalsPage', () => {
  it('loads and renders initial goals list', async () => {
    renderPage();

    expect(await screen.findByText('Goals')).toBeInTheDocument();
    expect(screen.getByLabelText('Search goals')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();

    expect(await screen.findByText('Learn Spanish')).toBeInTheDocument();
    expect(screen.getByText('Run 5K')).toBeInTheDocument();

    expect(screen.getAllByText(/\/\d{4}$/).length).toBeGreaterThan(0);
    expect(loadGoalsMock).toHaveBeenCalledTimes(1);
  });

  it('renders NLP section with all ordered questions', async () => {
    renderPage();
    await screen.findByText('Goals');

    expect(screen.getByText('Planner')).toBeInTheDocument();
    const nlpList = screen.getByTestId('nlp-questions');
    const areas = nlpList.querySelectorAll('textarea');
    expect(areas.length).toBe(8);
  });

  it('validates required fields before creating a goal', async () => {
    renderPage();
    await screen.findByText('Goals');

    fireEvent.click(screen.getByRole('button', { name: 'Create Goal' }));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Title is required', variant: 'destructive' })
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My New Goal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Goal' }));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Deadline is required', variant: 'destructive' })
    );

    expect(createGoalMock).not.toHaveBeenCalled();
  });

  it('creates a goal with epoch seconds converted from datetime-local', async () => {
    renderPage();
    await screen.findByText('Goals');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ship MVP' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Finish core features' } });

    const isoLocal = '2032-12-31T12:34';
    fireEvent.change(screen.getByLabelText('Deadline'), { target: { value: isoLocal } });

    createGoalMock.mockResolvedValue({ id: 'new1' });

    fireEvent.click(screen.getByRole('button', { name: 'Create Goal' }));

    await waitFor(() => expect(createGoalMock).toHaveBeenCalledTimes(1));

    const args = createGoalMock.mock.calls[0][0];
    expect(args.title).toBe('Ship MVP');
    expect(typeof args.deadline).toBe('number');
    const approx = Math.floor(new Date(isoLocal).getTime() / 1000);
    expect(Math.abs(args.deadline - approx)).toBeLessThanOrEqual(1);

    await waitFor(() => expect(loadGoalsMock).toHaveBeenCalledTimes(2));
  });

  it('filters by search query and status', async () => {
    renderPage();
    await screen.findByText('Goals');

    fireEvent.change(screen.getByLabelText('Search goals'), { target: { value: 'spanish' } });
    expect(await screen.findByText('Learn Spanish')).toBeInTheDocument();
    expect(screen.queryByText('Run 5K')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search goals'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'paused' } });
    expect(await screen.findByText('Run 5K')).toBeInTheDocument();
    expect(screen.queryByText('Learn Spanish')).not.toBeInTheDocument();
  });

  it('increments visible rows with "Show more"', async () => {
    loadGoalsMock.mockResolvedValue(
      Array.from({ length: 7 }).map((_, i) => ({
        id: `g-${i + 1}`,
        title: `G${i + 1}`,
        description: '',
        deadline: Math.floor(Date.now() / 1000),
        status: 'active',
      }))
    );
    renderPage();
    await screen.findByText('G1');

    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(await screen.findByText('G6')).toBeInTheDocument();
    expect(screen.getByText('G7')).toBeInTheDocument();
  });

  it('loads and shows tasks after "View Tasks"', async () => {
    graphqlMock.mockResolvedValueOnce({
      data: { myTasks: [{ id: 't1', title: 'Buy book', dueAt: 1956528000 }, { id: 't2', title: 'Practice', dueAt: null }] },
      errors: null,
    });

    renderPage();
    await screen.findByText('Learn Spanish');

    fireEvent.click(screen.getAllByRole('button', { name: 'View Tasks' })[0]);

    expect(await screen.findByRole('heading', { name: /Tasks/i })).toBeInTheDocument();
    expect(screen.getByText(/Buy book/)).toBeInTheDocument();
    expect(screen.getByText(/Practice/)).toBeInTheDocument();

    expect(graphqlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ name: 'MY_TASKS' }),
        variables: { goalId: 'g1' },
      })
    );
  });

  it('creates a task inline and refreshes the list', async () => {
    // Initial MY_TASKS after opening panel
    graphqlMock.mockResolvedValueOnce({ data: { myTasks: [] }, errors: null });

    // ADD_TASK mutation then tasks refresh call
    graphqlMock
      .mockResolvedValueOnce({ data: { addTask: { id: 't-new' } }, errors: null }) // <- ADD_TASK
      .mockResolvedValueOnce({
        data: { myTasks: [{ id: 't-new', title: 'Vocabulary', dueAt: null }] },
        errors: null,
      }); // <- refresh MY_TASKS

    renderPage();
    await screen.findByText('Learn Spanish');

    // Open the first goal's tasks
    fireEvent.click(screen.getAllByRole('button', { name: 'View Tasks' })[0]);

    // Ensure panel is rendered and get a handle to it
    const tasksHeading = await screen.findByRole('heading', { name: /Tasks/i });
    const panel =
      tasksHeading.closest('section') ??
      tasksHeading.parentElement ??
      document.body;

    // ====== SCOPED QUERIES (avoid matches on tooltip button aria-labels) ======
    // Use the label but force selector to 'input' so it won't grab the tooltip "More information about Task title" button
    fireEvent.change(
      within(panel).getByLabelText(/task title/i, { selector: 'input' }),
      { target: { value: 'Vocabulary' } }
    );

    fireEvent.change(
      within(panel).getByLabelText(/due date/i, { selector: 'input' }),
      { target: { value: '2033-01-01T09:00' } }
    );

    // Click Create Task inside the same panel
    fireEvent.click(within(panel).getByRole('button', { name: /create task/i }));

    // Wait until the ADD_TASK mutation happens (order-independent)
    await waitFor(() => {
      const hadAddTask = graphqlMock.mock.calls.some(([arg]) => {
        return arg?.query?.name === 'ADD_TASK';
      });
      expect(hadAddTask).toBe(true);
    });

    // Ensure the refresh call (MY_TASKS) happened with the correct goalId
    await waitFor(() => {
      const hadRefresh = graphqlMock.mock.calls.some(([arg]) => {
        return arg?.query?.name === 'MY_TASKS' && arg?.variables?.goalId === 'g1';
      });
      expect(hadRefresh).toBe(true);
    });

    // UI shows the new task in the same panel
    expect(await within(panel).findByText('Vocabulary')).toBeInTheDocument();

    // Success toast fired
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Task created' }));
  });

  it('AI image button sets imageUrl on success and shows error toast on failure', async () => {
    // Success
    // @ts-expect-error
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ imageUrl: 'https://img.example/foo.jpg' }),
    });

    renderPage();
    await screen.findByText('Goals');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Climb Everest' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Train hard' } });

    fireEvent.click(screen.getByTestId('btn-generate-image'));

    expect(await screen.findByAltText('Inspiration')).toBeInTheDocument();

    // Failure
    // @ts-expect-error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'boom' }),
    });

    fireEvent.click(screen.getByTestId('btn-generate-image'));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'AI image failed', variant: 'destructive' })
      )
    );
  });

  it('AI suggestions button sets suggestions on success and shows error toast on failure', async () => {
    // Success
    // @ts-expect-error
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: ['Break into milestones', 'Schedule weekly review'] }),
    });

    renderPage();
    await screen.findByText('Goals');

    fireEvent.click(screen.getByTestId('btn-suggest-improvements'));
    expect(await screen.findByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Break into milestones')).toBeInTheDocument();

    // Failure
    // @ts-expect-error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'nope' }),
    });

    fireEvent.click(screen.getByTestId('btn-suggest-improvements'));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'AI suggestions failed', variant: 'destructive' })
      )
    );
  });
});
