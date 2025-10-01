import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GoalsButton from '../GoalsButton';
import { useTranslation } from '@/hooks/useTranslation';
import { getActiveGoalsCountForUser, loadDashboardGoals } from '@/lib/apiGoal';
import { getUserIdFromToken } from '@/lib/utils';

// Mock the dependencies
jest.mock('@/hooks/useTranslation');
jest.mock('@/lib/apiGoal');
jest.mock('@/lib/utils');

const mockGetActiveGoalsCountForUser = getActiveGoalsCountForUser as jest.MockedFunction<typeof getActiveGoalsCountForUser>;
const mockLoadDashboardGoals = loadDashboardGoals as jest.MockedFunction<typeof loadDashboardGoals>;
const mockGetUserIdFromToken = getUserIdFromToken as jest.MockedFunction<typeof getUserIdFromToken>;

describe('GoalsButton', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useTranslation as jest.Mock).mockReturnValue({
      t: {
        goalDashboard: {
          button: {
            title: 'Goals',
            viewAll: 'View All Goals',
            createGoal: 'Create Goal'
          },
          stats: {
            activeGoals: 'Active Goals'
          },
          goalsList: {
            title: 'Top Goals',
            sortBy: 'Sort by',
            sortOptions: {
              deadlineAsc: 'Deadline (earliest first)',
              deadlineDesc: 'Deadline (latest first)',
              progressAsc: 'Progress (lowest first)',
              progressDesc: 'Progress (highest first)',
              titleAsc: 'Title (A-Z)',
              titleDesc: 'Title (Z-A)',
              createdAsc: 'Created (oldest first)',
              createdDesc: 'Created (newest first)',
            },
            noDeadline: 'No deadline',
            progress: {
              overdue: 'Overdue',
              urgent: 'Urgent',
              onTrack: 'On Track',
              noDeadline: 'No Deadline',
            },
            expandCollapse: {
              expand: 'Show Goals',
              collapse: 'Hide Goals',
            },
          },
          messages: {
            noGoals: 'No goals found',
            loading: 'Loading...'
          },
          tooltips: {
            createGoal: 'Create a new goal'
          }
        }
      }
    });

    mockGetUserIdFromToken.mockReturnValue('test-user-123');
    mockGetActiveGoalsCountForUser.mockResolvedValue(5);
    mockLoadDashboardGoals.mockResolvedValue([]);

    // Mock useNavigate
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));
  });

  it('renders with loading state', () => {
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Goals')).toBeInTheDocument();
  });

  it('displays active goals count', async () => {
    mockGetActiveGoalsCountForUser.mockResolvedValue(5);
    
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Active Goals')).toBeInTheDocument();
    });
  });

  it('navigates to goals list when view button is clicked', async () => {
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      const viewButton = screen.getByText('View All Goals');
      fireEvent.click(viewButton);
      expect(mockNavigate).toHaveBeenCalledWith('/goals');
    });
  });

  it('navigates to create goal when create button is clicked', async () => {
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      const createButton = screen.getByText('Create Goal');
      fireEvent.click(createButton);
      expect(mockNavigate).toHaveBeenCalledWith('/goals/create');
    });
  });

  it('shows expand/collapse button when there are active goals', async () => {
    mockGetActiveGoalsCountForUser.mockResolvedValue(3);
    
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Top Goals')).toBeInTheDocument();
    });
  });

  it('expands goals list when expand button is clicked', async () => {
    mockGetActiveGoalsCountForUser.mockResolvedValue(3);
    mockLoadDashboardGoals.mockResolvedValue([
      {
        id: 'goal-1',
        title: 'Test Goal 1',
        description: 'Test description',
        deadline: '2024-12-31',
        status: 'active',
        createdAt: Date.now() - 86400000, // 1 day ago
        updatedAt: Date.now(),
        tags: ['work']
      }
    ]);
    
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Top Goals');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(mockLoadDashboardGoals).toHaveBeenCalledWith('deadline-asc');
      expect(screen.getByText('Test Goal 1')).toBeInTheDocument();
    });
  });

  it('shows sort dropdown when expanded', async () => {
    mockGetActiveGoalsCountForUser.mockResolvedValue(3);
    mockLoadDashboardGoals.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Top Goals');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Sort by')).toBeInTheDocument();
    });
  });

  it('handles sort change', async () => {
    mockGetActiveGoalsCountForUser.mockResolvedValue(3);
    mockLoadDashboardGoals.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Top Goals');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      const sortSelect = screen.getByRole('combobox');
      fireEvent.click(sortSelect);
    });

    await waitFor(() => {
      const progressOption = screen.getByText('Progress (highest first)');
      fireEvent.click(progressOption);
    });

    await waitFor(() => {
      expect(mockLoadDashboardGoals).toHaveBeenCalledWith('progress-desc');
    });
  });

  it('shows no goals message when no goals are found', async () => {
    mockGetActiveGoalsCountForUser.mockResolvedValue(3);
    mockLoadDashboardGoals.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Top Goals');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('No goals found')).toBeInTheDocument();
    });
  });

  it('displays goal progress information correctly', async () => {
    mockGetActiveGoalsCountForUser.mockResolvedValue(3);
    const mockGoal = {
      id: 'goal-1',
      title: 'Test Goal',
      description: 'Test description',
      deadline: '2024-12-31',
      status: 'active',
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now(),
      tags: ['work']
    };
    mockLoadDashboardGoals.mockResolvedValue([mockGoal]);
    
    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Top Goals');
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Goal')).toBeInTheDocument();
      expect(screen.getByText('work')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockGetActiveGoalsCountForUser.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    expect(screen.getByText('Unable to load count')).toBeInTheDocument();
  });

  it('shows zero count when no user ID', async () => {
    mockGetUserIdFromToken.mockReturnValue(null);

    render(
      <BrowserRouter>
        <GoalsButton />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});