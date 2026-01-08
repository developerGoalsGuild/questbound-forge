import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GoalsButton from '../GoalsButton';
import { useTranslation } from '@/hooks/useTranslation';
import { getActiveGoalsCountForUser, loadDashboardGoalsWithProgress } from '@/lib/apiGoal';
import { getUserIdFromToken } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Mock the dependencies
vi.mock('@/hooks/useTranslation');
vi.mock('@/lib/apiGoal');
vi.mock('@/lib/utils');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockGetActiveGoalsCountForUser = vi.mocked(getActiveGoalsCountForUser);
const mockLoadDashboardGoals = vi.mocked(loadDashboardGoalsWithProgress);
const mockGetUserIdFromToken = vi.mocked(getUserIdFromToken);

describe('GoalsButton', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useTranslation).mockReturnValue({
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

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
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