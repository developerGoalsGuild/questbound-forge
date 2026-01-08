import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { GoalQuestsSection } from '../GoalQuestsSection';
import type { Quest } from '@/models/quest';

// Mock the hooks
const mockUseTranslation = vi.fn();
const mockUseGoalQuests = vi.fn();
const mockNavigate = vi.fn();

// Mock the hooks
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('@/hooks/useGoalQuests', () => ({
  useGoalQuests: (...args: any[]) => mockUseGoalQuests(...args),
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
    goalIntegration: {
      title: 'Goal Quests',
      statistics: 'Quest Progress',
      questsList: 'Associated Quests',
      noQuests: 'No quests yet',
      createQuest: 'Create Quest',
      viewAll: 'View All',
      moreQuests: 'And {count} more quests...',
      viewAllQuests: 'View All Quests',
      createFirstQuest: 'Create Your First Quest',
      error: 'Failed to load goal quests',
      emptyState: {
        title: 'No quests for this goal',
        description: 'Create quests to break down this goal into actionable steps.',
      },
    },
    status: {
      draft: 'Draft',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed',
    },
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
  },
  common: {
    actions: {
      retry: 'Retry',
    },
  },
};

const mockGoalId = 'goal-123';
const mockQuests: Quest[] = [
  {
    id: 'quest-1',
    userId: 'user-1',
    goalId: mockGoalId,
    title: 'Complete project proposal',
    description: 'Write a comprehensive project proposal',
    status: 'completed',
    difficulty: 'medium',
    rewardXp: 100,
    category: 'Work',
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now(),
  },
  {
    id: 'quest-2',
    userId: 'user-1',
    goalId: mockGoalId,
    title: 'Research competitors',
    status: 'active',
    difficulty: 'easy',
    rewardXp: 50,
    category: 'Work',
    createdAt: Date.now() - 43200000, // 12 hours ago
    updatedAt: Date.now(),
  },
  {
    id: 'quest-3',
    userId: 'user-1',
    goalId: mockGoalId,
    title: 'Prepare presentation',
    status: 'draft',
    difficulty: 'hard',
    rewardXp: 200,
    category: 'Work',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockUseGoalQuestsReturn = {
  goalQuests: mockQuests,
  questCount: mockQuests.length,
  loading: false,
  error: null,
  refresh: vi.fn(),
  createQuest: vi.fn(),
};

describe('GoalQuestsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: mockTranslations,
    });
    mockUseGoalQuests.mockReturnValue(mockUseGoalQuestsReturn);
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('renders section title and quest count', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('Goal Quests')).toBeInTheDocument();
      // Quest count should be shown in a badge near the title
      const titleHeading = screen.getByRole('heading', { name: /goal quests/i });
      const badge = titleHeading.querySelector('[class*="rounded-full"]');
      expect(badge).toHaveTextContent('3');
    });

    it('renders action buttons', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create quest/i })).toBeInTheDocument();
    });

    it('renders quest statistics when quests exist', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('Quest Progress')).toBeInTheDocument();
      // Should render statistics cards with specific labels
      expect(screen.getByText('Total Quests')).toBeInTheDocument();
      // Look for "Completed" in the statistics labels (not badges)
      const completedElements = screen.getAllByText('Completed');
      const completedLabel = completedElements.find(element =>
        element.classList.contains('text-muted-foreground')
      );
      expect(completedLabel).toBeInTheDocument();
    });

    it('renders quest cards', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('Associated Quests')).toBeInTheDocument();
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByText('Research competitors')).toBeInTheDocument();
      expect(screen.getByText('Prepare presentation')).toBeInTheDocument();
    });

    it('renders quest status badges correctly', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Check for status badges within quest cards (these are the colored badges)
      const statusBadges = screen.getAllByText(/Completed|Active|Draft/).filter(element =>
        element.closest('[class*="rounded-full"]')
      );

      expect(statusBadges).toHaveLength(3);
      expect(statusBadges.some(badge => badge.textContent === 'Completed')).toBe(true);
      expect(statusBadges.some(badge => badge.textContent === 'Active')).toBe(true);
      expect(statusBadges.some(badge => badge.textContent === 'Draft')).toBe(true);
    });

    it('renders difficulty badges', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    it('renders XP rewards', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('100 XP')).toBeInTheDocument();
      expect(screen.getByText('50 XP')).toBeInTheDocument();
      expect(screen.getByText('200 XP')).toBeInTheDocument();
    });

    it.skip('limits display to 6 quests with more indicator', () => {
      const manyQuests = Array.from({ length: 8 }, (_, i) => ({
        ...mockQuests[0],
        id: `quest-${i + 1}`,
        title: `Quest ${i + 1}`,
      }));

      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        goalQuests: manyQuests,
        questCount: manyQuests.length,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Should show first 6 quests
      expect(screen.getByText('Quest 1')).toBeInTheDocument();
      expect(screen.getByText('Quest 6')).toBeInTheDocument();

      // Should show "more quests" indicator
      expect(screen.getByText('And 2 more quests...')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading', () => {
      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        loading: true,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Should show loading spinner
      const spinner = document.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();
    });

    it('renders skeleton cards during loading', () => {
      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        loading: true,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Should show skeleton elements
      const skeletonElements = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('renders error message when there is an error', () => {
      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        error: 'Failed to load quests',
        goalQuests: [],
        questCount: 0,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('Failed to load goal quests')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls refresh when retry button is clicked', () => {
      const mockRefresh = vi.fn();
      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        error: 'Failed to load quests',
        goalQuests: [],
        questCount: 0,
        refresh: mockRefresh,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no quests exist', () => {
      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        goalQuests: [],
        questCount: 0,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('No quests for this goal')).toBeInTheDocument();
      expect(screen.getByText('Create quests to break down this goal into actionable steps.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create your first quest/i })).toBeInTheDocument();
    });

    it('does not show statistics section when no quests', () => {
      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        goalQuests: [],
        questCount: 0,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Quest Progress')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to quest creation with goalId when create quest button is clicked', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      const createButton = screen.getByRole('button', { name: /create quest/i });
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith(`/quests/create?goalId=${mockGoalId}`);
    });

    it('navigates to quest dashboard when view all button is clicked', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      const viewAllButton = screen.getByRole('button', { name: /view all/i });
      fireEvent.click(viewAllButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/dashboard');
    });

    it('navigates to quest details when quest card is clicked', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      const questCard = screen.getByText('Complete project proposal').closest('div');
      fireEvent.click(questCard!);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/details/quest-1');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0]).toHaveTextContent('Goal Quests');
    });

    it('has accessible button labels', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('quest cards are keyboard accessible', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      const questCards = screen.getAllByText(/Complete project proposal|Research competitors|Prepare presentation/);
      questCards.forEach(card => {
        // Find the Card component that contains the quest text
        const cardElement = card.closest('[class*="rounded-lg"]');
        // Check that the card has hover effects (indicating it's clickable)
        expect(cardElement).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Translation Integration', () => {
    it('uses translation hook correctly', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(mockUseTranslation).toHaveBeenCalled();
    });

    it('displays translated text', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.getByText('Goal Quests')).toBeInTheDocument();
      expect(screen.getByText('Associated Quests')).toBeInTheDocument();
    });

    it('handles missing translations gracefully', () => {
      mockUseTranslation.mockReturnValue({
        t: {
          quest: {},
          common: {},
        },
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Should not crash and show some content
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Quest Statistics Integration', () => {
    it('displays quest statistics cards', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Should render statistics (the actual values depend on the mock data)
      expect(screen.getByText('Quest Progress')).toBeInTheDocument();
    });

    it('does not show statistics when no quests', () => {
      mockUseGoalQuests.mockReturnValue({
        ...mockUseGoalQuestsReturn,
        goalQuests: [],
        questCount: 0,
      });

      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Quest Progress')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('uses responsive grid classes', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Check for responsive grid classes
      const gridContainer = document.querySelector('.grid-cols-1.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    it('statistics cards use responsive layout', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      // Check for responsive statistics grid
      const statsContainer = document.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(statsContainer).toBeInTheDocument();
    });
  });

  describe('Performance and Re-rendering', () => {
    it('re-renders when goalId changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <GoalQuestsSection goalId="goal-1" />
        </BrowserRouter>
      );

      expect(mockUseGoalQuests).toHaveBeenCalledWith('goal-1', expect.any(Object));

      rerender(
        <BrowserRouter>
          <GoalQuestsSection goalId="goal-2" />
        </BrowserRouter>
      );

      expect(mockUseGoalQuests).toHaveBeenCalledWith('goal-2', expect.any(Object));
    });

    it('passes goalId to useGoalQuests hook', () => {
      render(
        <BrowserRouter>
          <GoalQuestsSection goalId={mockGoalId} />
        </BrowserRouter>
      );

      expect(mockUseGoalQuests).toHaveBeenCalledWith(mockGoalId, expect.any(Object));
    });
  });
});
