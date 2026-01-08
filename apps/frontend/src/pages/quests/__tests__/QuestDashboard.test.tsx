import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import QuestDashboard from '../QuestDashboard';

// Mock the hooks
const mockUseTranslation = vi.fn();
const mockUseQuests = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('@/hooks/useQuest', () => ({
  useQuests: () => mockUseQuests(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock translations
const mockTranslations = {
  quest: {
    dashboard: {
      title: 'Quest Dashboard',
      description: 'Track your quest progress and statistics',
      quickActions: {
        title: 'Quick Actions',
        createQuest: 'Create Quest',
        viewAllQuests: 'View All',
        joinChallenges: 'Challenges',
        viewActivity: 'Activity',
      },
      statistics: {
        title: 'Quest Statistics',
        comingSoon: 'Statistics coming soon...',
      },
      tabs: {
        title: 'Quest Overview',
        comingSoon: 'Quest tabs coming soon...',
      },
      viewDashboard: 'View Dashboard',
    },
    actions: {
      create: 'Create Quest',
      retry: 'Retry',
    },
    messages: {
      loadError: 'Failed to load quests',
    },
  },
};

// Mock quests data
const mockQuests = [
  {
    id: 'quest-1',
    title: 'Test Quest',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('QuestDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: mockTranslations,
    });

    mockUseQuests.mockReturnValue({
      quests: mockQuests,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders dashboard title and description', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Quest Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Track your quest progress and statistics')).toBeInTheDocument();
    });

    it('renders quick actions section', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      // Check for quick action button labels within the Quick Actions section
      const quickActionsSection = screen.getByText('Quick Actions').closest('div');
      expect(quickActionsSection).toBeInTheDocument();

      // Check that all quick action labels are present
      expect(screen.getAllByText('Create Quest')).toHaveLength(2); // Header + Quick Actions
      expect(screen.getByText('View All')).toBeInTheDocument();
      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });

    it('renders statistics section', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Quest Statistics')).toBeInTheDocument();
      // Should render statistics cards when data is available
      // The actual content depends on the mock data
    });

    it('renders quest tabs', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Quest Overview')).toBeInTheDocument();
      expect(screen.getByText('My Quests')).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading spinner when loading', () => {
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: true,
        error: null,
        refresh: vi.fn(),
      });

      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Check for loading spinner with animate-spin class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('renders skeleton cards during loading', () => {
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: true,
        error: null,
        refresh: vi.fn(),
      });

      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Check for animated pulse elements (skeleton loading)
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('renders error message when there is an error', () => {
      const mockRefresh = vi.fn();
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: false,
        error: new Error('Network error'),
        refresh: mockRefresh,
      });

      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Failed to load quests')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls refresh when retry button is clicked', () => {
      const mockRefresh = vi.fn();
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: false,
        error: new Error('Network error'),
        refresh: mockRefresh,
      });

      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quick Actions', () => {
    it('navigates to create quest page when header create button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Get the header create button (first one)
      const createButtons = screen.getAllByRole('button', { name: /create quest/i });
      const headerCreateButton = createButtons[0]; // Header button
      fireEvent.click(headerCreateButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/create');
    });

    it('navigates to create quest page when quick action create button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Get the quick action create button (second one)
      const createButtons = screen.getAllByRole('button', { name: /create quest/i });
      const quickActionCreateButton = createButtons[1]; // Quick actions button
      fireEvent.click(quickActionCreateButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/create');
    });

    it('navigates to quests list when view all button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      const viewAllButton = screen.getByRole('button', { name: 'View All' });
      fireEvent.click(viewAllButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests');
    });

    it('navigates to challenges page when challenges button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      const challengesButton = screen.getByRole('button', { name: 'Challenges' });
      fireEvent.click(challengesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/challenges');
    });

    it('navigates to activity page when activity button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      const activityButton = screen.getByRole('button', { name: 'Activity' });
      fireEvent.click(activityButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/activity');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Quest Dashboard');
    });

    it('has accessible button labels', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Check that buttons have proper aria-labels or accessible names
      const createButtons = screen.getAllByRole('button', { name: /create quest/i });
      const viewAllButton = screen.getByRole('button', { name: 'View All' });
      const challengesButton = screen.getByRole('button', { name: 'Challenges' });
      const activityButton = screen.getByRole('button', { name: 'Activity' });

      expect(createButtons).toHaveLength(2); // Header and quick action buttons
      expect(viewAllButton).toBeInTheDocument();
      expect(challengesButton).toBeInTheDocument();
      expect(activityButton).toBeInTheDocument();
    });

    it('has proper ARIA labels on quick action buttons', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Check for aria-label attributes on quick action buttons
      const quickActionButtons = screen.getAllByRole('button').filter(button =>
        button.getAttribute('aria-label')?.includes('Create Quest') ||
        button.getAttribute('aria-label')?.includes('View All') ||
        button.getAttribute('aria-label')?.includes('Challenges') ||
        button.getAttribute('aria-label')?.includes('Activity')
      );

      expect(quickActionButtons).toHaveLength(4); // Should have 4 quick action buttons with aria-labels

      quickActionButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('Responsive Design', () => {
    it('uses mobile-first grid classes for quick actions', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Check for responsive grid classes
      const gridContainer = document.querySelector('.grid-cols-2.md\\:grid-cols-4');
      expect(gridContainer).toBeInTheDocument();
    });

    it('uses responsive container classes', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Check for responsive container
      const container = document.querySelector('.container.mx-auto.px-4.py-8');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Translation Integration', () => {
    it('uses translation hook correctly', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      expect(mockUseTranslation).toHaveBeenCalled();
    });

    it('displays translated text with fallbacks', () => {
      // Test with missing translations
      mockUseTranslation.mockReturnValue({
        t: {
          quest: {},
        },
      });

      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Should show fallback text
      expect(screen.getByText('Quest Dashboard')).toBeInTheDocument();
    });
  });

  describe('Quest Data Integration', () => {
    it('uses quests hook correctly', () => {
      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      expect(mockUseQuests).toHaveBeenCalled();
    });

    it('handles empty quests array', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        refresh: vi.fn(),
      });

      render(
        <BrowserRouter>
          <QuestDashboard />
        </BrowserRouter>
      );

      // Should still render without crashing
      expect(screen.getByText('Quest Dashboard')).toBeInTheDocument();
    });
  });
});
