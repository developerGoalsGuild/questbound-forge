import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuestList from '../QuestList';
import { Quest } from '@/models/quest';

// Mock the useTranslation hook
const mockT = {
  quest: {
    actions: {
      create: 'Create Quest',
      retry: 'Retry',
    },
    messages: {
      loadError: 'Failed to load quests',
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
    progress: {
      inProgress: 'Progress',
    },
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

// Mock the useQuests hook
const mockUseQuests = vi.fn();
vi.mock('@/hooks/useQuest', () => ({
  useQuests: () => mockUseQuests(),
}));

describe('QuestList', () => {
  const mockHandlers = {
    onViewDetails: vi.fn(),
    onStart: vi.fn(),
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    onFail: vi.fn(),
    onDelete: vi.fn(),
    onCreateQuest: vi.fn(),
  };

  const mockQuests: Quest[] = [
    {
      id: 'quest-1',
      userId: 'user-1',
      title: 'Test Quest 1',
      description: 'A test quest description',
      difficulty: 'medium',
      rewardXp: 100,
      status: 'draft',
      category: 'Work',
      tags: ['test'],
      privacy: 'private',
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now() - 86400000,
      kind: 'linked',
      linkedGoalIds: ['goal-1'],
      linkedTaskIds: ['task-1'],
    },
    {
      id: 'quest-2',
      userId: 'user-1',
      title: 'Test Quest 2',
      description: 'Another test quest',
      difficulty: 'easy',
      rewardXp: 50,
      status: 'active',
      category: 'Health',
      tags: ['health'],
      privacy: 'private',
      createdAt: Date.now() - 172800000, // 2 days ago
      updatedAt: Date.now() - 172800000,
      kind: 'quantitative',
      targetCount: 10,
      countScope: 'any',
      startAt: Date.now() - 172800000,
      periodSeconds: 86400,
    },
    {
      id: 'quest-3',
      userId: 'user-1',
      title: 'Completed Quest',
      description: 'A completed quest',
      difficulty: 'hard',
      rewardXp: 200,
      status: 'completed',
      category: 'Personal',
      tags: ['personal'],
      privacy: 'private',
      createdAt: Date.now() - 259200000, // 3 days ago
      updatedAt: Date.now() - 259200000,
      kind: 'linked',
      linkedGoalIds: ['goal-2'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading skeletons when loading', () => {
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: true,
        error: null,
        refresh: vi.fn(),
      });

      render(<QuestList {...mockHandlers} />);

      // Check for skeleton elements by their class
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('shows error message when there is an error', () => {
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: false,
        error: 'Network error',
        refresh: vi.fn(),
      });

      render(<QuestList {...mockHandlers} />);

      expect(screen.getByText('Failed to load quests')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls refresh when retry button is clicked', () => {
      const mockRefresh = vi.fn();
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: false,
        error: 'Network error',
        refresh: mockRefresh,
      });

      render(<QuestList {...mockHandlers} />);

      fireEvent.click(screen.getByText('Retry'));
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no quests exist', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        refresh: vi.fn(),
      });

      render(<QuestList {...mockHandlers} />);

      expect(screen.getByText("You don't have any quests yet.")).toBeInTheDocument();
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
    });

    it('calls onCreateQuest when create button is clicked in empty state', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        refresh: vi.fn(),
      });

      render(<QuestList {...mockHandlers} />);

      fireEvent.click(screen.getByText('Create Quest'));
      expect(mockHandlers.onCreateQuest).toHaveBeenCalled();
    });

    it('shows filtered empty state when no quests match filters', () => {
      mockUseQuests.mockReturnValue({
        quests: mockQuests,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });

      render(<QuestList {...mockHandlers} />);

      // Set a filter that will return no results
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByTestId('select-item-failed'));

      expect(screen.getByText('No quests match your current filters.')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  describe('Quest Display', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: mockQuests,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });
    });

    it('renders all quests by default', () => {
      render(<QuestList {...mockHandlers} />);

      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
      expect(screen.getByText('Completed Quest')).toBeInTheDocument();
    });

    it('shows correct quest count', () => {
      render(<QuestList {...mockHandlers} />);

      expect(screen.getByText('Showing 3 of 3 quests')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: mockQuests,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });
    });

    it('filters by status', () => {
      render(<QuestList {...mockHandlers} />);

      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByTestId('select-item-draft'));

      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('filters by difficulty', () => {
      render(<QuestList {...mockHandlers} />);

      const difficultySelect = screen.getByRole('combobox', { name: /difficulty/i });
      fireEvent.click(difficultySelect);
      fireEvent.click(screen.getByTestId('select-item-easy'));

      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('filters by category', () => {
      render(<QuestList {...mockHandlers} />);

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      fireEvent.click(categorySelect);
      fireEvent.click(screen.getByTestId('select-item-work'));

      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('filters by search term', () => {
      render(<QuestList {...mockHandlers} />);

      const searchInput = screen.getByPlaceholderText('Search quests...');
      fireEvent.change(searchInput, { target: { value: 'Test Quest 1' } });

      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('searches in title, description, and category', () => {
      render(<QuestList {...mockHandlers} />);

      const searchInput = screen.getByPlaceholderText('Search quests...');
      
      // Search by title
      fireEvent.change(searchInput, { target: { value: 'Test Quest 1' } });
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      
      // Search by description
      fireEvent.change(searchInput, { target: { value: 'Another test quest' } });
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
      
      // Search by category
      fireEvent.change(searchInput, { target: { value: 'Health' } });
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', () => {
      render(<QuestList {...mockHandlers} />);

      // Set some filters
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByTestId('select-item-draft'));

      const searchInput = screen.getByPlaceholderText('Search quests...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Clear filters
      fireEvent.click(screen.getByText('Clear'));

      // All quests should be visible again
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
      expect(screen.getByText('Completed Quest')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: mockQuests,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });
    });

    it('sorts quests by updatedAt descending (most recent first)', () => {
      render(<QuestList {...mockHandlers} />);

      const questCards = screen.getAllByText(/Test Quest|Completed Quest/);
      // The most recent quest should be first
      expect(questCards[0]).toHaveTextContent('Test Quest 1');
    });
  });

  describe('Quest Card Integration', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: mockQuests,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });
    });

    it('passes correct handlers to QuestCard components', () => {
      render(<QuestList {...mockHandlers} />);

      // The QuestCard components should be rendered with the correct props
      // We can't directly test the props, but we can verify the cards are rendered
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
      expect(screen.getByText('Completed Quest')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: mockQuests,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });
    });

    it('has proper form labels and accessibility attributes', () => {
      render(<QuestList {...mockHandlers} />);

      const searchInput = screen.getByPlaceholderText('Search quests...');
      expect(searchInput).toBeInTheDocument();

      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      expect(statusSelect).toBeInTheDocument();

      const difficultySelect = screen.getByRole('combobox', { name: /difficulty/i });
      expect(difficultySelect).toBeInTheDocument();

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      expect(categorySelect).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined quests gracefully', () => {
      mockUseQuests.mockReturnValue({
        quests: undefined,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });

      render(<QuestList {...mockHandlers} />);

      expect(screen.getByText("You don't have any quests yet.")).toBeInTheDocument();
    });

    it('handles empty search results', () => {
      mockUseQuests.mockReturnValue({
        quests: mockQuests,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });

      render(<QuestList {...mockHandlers} />);

      const searchInput = screen.getByPlaceholderText('Search quests...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent quest' } });

      expect(screen.getByText('No quests match your current filters.')).toBeInTheDocument();
    });
  });
});
