/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import UserDashboard from '../UserDashboard';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div data-testid="card-title" className={className}>{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, className }: any) => asChild ? children : <button data-testid="button" className={className}>{children}</button>
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />
}));

vi.mock('lucide-react', () => ({
  Target: () => <div data-testid="target-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Star: () => <div data-testid="star-icon" />
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to }: any) => <a data-testid="link" href={to}>{children}</a>
  };
});

// Mock hooks
const mockUserData = {
  stats: {
    activeQuests: 7,
    achievements: 12,
    guildPoints: 250,
    successRate: 85
  },
  goals: [
    {
      id: '1',
      title: 'Complete React Course',
      progress: 75,
      category: 'Learning',
      dueDate: '2024-12-31'
    },
    {
      id: '2',
      title: 'Build Portfolio',
      progress: 30,
      category: 'Project',
      dueDate: '2024-11-15'
    }
  ],
  achievements: [
    {
      name: 'First Quest',
      icon: () => <div>Icon1</div>,
      earned: true
    },
    {
      name: 'Goal Crusher',
      icon: () => <div>Icon2</div>,
      earned: false
    }
  ],
  nextAchievement: {
    description: 'Complete 10 quests',
    progress: 70,
    current: 7,
    target: 10
  }
};

const mockCommunityActivities = [
  {
    id: '1',
    type: 'achievement',
    userInitial: 'A',
    activity: 'Alice earned "Goal Crusher" achievement',
    timeAgo: '2 hours ago',
    details: 'Completed 5 quests'
  },
  {
    id: '2',
    type: 'quest',
    userInitial: 'B',
    activity: 'Bob completed "Learn React"',
    timeAgo: '5 hours ago',
    details: null
  }
];

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      dashboard: {
        user: {
          title: 'Quest Board',
          welcome: 'Welcome back, adventurer!',
          goals: 'Active Goals',
          achievements: 'Achievements',
          community: 'Community Activity',
          stats: {
            activeQuests: 'Active Quests',
            achievements: 'Achievements',
            guildPoints: 'Guild Points'
          }
        }
      }
    }
  })
}));

vi.mock('@/hooks/useUserData', () => ({
  useUserData: () => ({
    data: mockUserData,
    loading: false,
    error: null
  })
}));

vi.mock('@/hooks/useCommunityData', () => ({
  useCommunityActivities: vi.fn(() => ({
    activities: mockCommunityActivities
  }))
}));

// Mock API functions
vi.mock('@/lib/apiGoal', () => ({
  getActiveGoalsCountForUser: vi.fn().mockResolvedValue(7)
}));

vi.mock('@/lib/utils', () => ({
  getUserIdFromToken: vi.fn().mockReturnValue('user123')
}));

describe.skip('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });


  test('renders dashboard with user data', async () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Quest Board')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, adventurer!')).toBeInTheDocument();

    // Stats cards
    expect(screen.getByText('7')).toBeInTheDocument(); // Active quests
    expect(screen.getByText('12')).toBeInTheDocument(); // Achievements
    expect(screen.getByText('250')).toBeInTheDocument(); // Guild points
    expect(screen.getByText('85%')).toBeInTheDocument(); // Success rate

    // Goals section
    expect(screen.getByText('Active Goals')).toBeInTheDocument();
    expect(screen.getByText('Complete React Course')).toBeInTheDocument();
    expect(screen.getByText('Build Portfolio')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();

    // Achievements section
    const trophyIcons = screen.getAllByTestId('trophy-icon');
    // Find the one in the achievements card (not the stats card)
    const achievementsCard = trophyIcons.find(icon => {
      const card = icon.closest('[data-testid="card"]');
      return card?.textContent?.includes('Achievements');
    })?.closest('[data-testid="card"]');
    expect(achievementsCard).toHaveTextContent('Achievements');
    expect(screen.getByText('First Quest')).toBeInTheDocument();
    expect(screen.getByText('Goal Crusher')).toBeInTheDocument();

    // Next achievement
    expect(screen.getByText('Next Achievement')).toBeInTheDocument();
    expect(screen.getByText('Complete 10 quests')).toBeInTheDocument();
    expect(screen.getByText('7/10 quests completed')).toBeInTheDocument();

    // Community activity
    expect(screen.getByText('Community Activity')).toBeInTheDocument();
    expect(screen.getByText('Alice earned "Goal Crusher" achievement')).toBeInTheDocument();
    expect(screen.getByText('Bob completed "Learn React"')).toBeInTheDocument();
  });


  test('renders progress bars for goals', () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    // Check for progress bars using the actual CSS classes used in the component
    const progressBars = document.querySelectorAll('.progress-medieval');
    expect(progressBars).toHaveLength(3); // 2 goals + 1 next achievement progress bar
  });

  test('renders achievement icons correctly', () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    // Should have earned and unearned achievements with different styles
    expect(screen.getByText('First Quest')).toBeInTheDocument();
    expect(screen.getByText('Goal Crusher')).toBeInTheDocument();

    // Check that achievement icons are rendered (mocked as div elements)
    const achievementIcons = screen.getAllByText(/Icon1|Icon2/);
    expect(achievementIcons).toHaveLength(2);
  });

  test('renders community activity with user avatars', () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  test('renders link to goals page', () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/goals');
    expect(link).toHaveTextContent('Add New Quest');
  });


  test('displays goal categories and due dates', () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Learning')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('2024-12-31')).toBeInTheDocument();
    expect(screen.getByText('2024-11-15')).toBeInTheDocument();
  });

  test('displays success rate with percentage', () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });
});
