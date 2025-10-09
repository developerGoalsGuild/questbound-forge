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

// Mock the useQuestFilters hook
const mockUseQuestFilters = vi.fn();
vi.mock('@/hooks/useQuestFilters', () => ({
  useQuestFilters: (...args: any[]) => mockUseQuestFilters(...args),
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

    // Default mock for useQuestFilters
    mockUseQuestFilters.mockReturnValue({
      filters: {
        status: 'all',
        difficulty: 'all',
        category: 'all',
        search: '',
      },
      hasActiveFilters: false,
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
      setStatus: vi.fn(),
      setDifficulty: vi.fn(),
      setCategory: vi.fn(),
      setSearch: vi.fn(),
      getActiveFilterCount: vi.fn(() => 0),
      validationErrors: {},
      hasValidationErrors: false,
      isFormValid: true,
    });
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

      // Mock filters with a status that matches no quests
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'failed',
          difficulty: 'all',
          category: 'all',
          search: '',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

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
      // Mock filters to show filtering is working
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'draft',
          difficulty: 'all',
          category: 'all',
          search: '',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

      // With status filter set to 'draft', only Test Quest 1 should be visible
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('filters by difficulty', () => {
      // Mock filters to show filtering is working
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'easy',
          category: 'all',
          search: '',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

      // With difficulty filter set to 'easy', only Test Quest 2 should be visible
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('filters by category', () => {
      // Mock filters to show filtering is working
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'all',
          category: 'Work',
          search: '',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

      // With category filter set to 'Work', only Test Quest 1 should be visible
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('filters by search term', () => {
      // Mock filters to show filtering is working
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'all',
          category: 'all',
          search: 'Test Quest 1',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

      // With search filter set to 'Test Quest 1', only Test Quest 1 should be visible
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Quest')).not.toBeInTheDocument();
    });

    it('searches in title, description, and category', () => {
      // Test search by title
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'all',
          category: 'all',
          search: 'Test Quest 1',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      const { rerender } = render(<QuestList {...mockHandlers} />);
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();

      // Test search by description
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'all',
          category: 'all',
          search: 'Another test quest',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      rerender(<QuestList {...mockHandlers} />);
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();

      // Test search by category
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'all',
          category: 'all',
          search: 'Health',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      rerender(<QuestList {...mockHandlers} />);
      expect(screen.getByText('Test Quest 2')).toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', () => {
      const mockUpdateFilters = vi.fn();
      // Mock filters to show active filters
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'draft',
          difficulty: 'all',
          category: 'all',
          search: 'test',
        },
        hasActiveFilters: true,
        updateFilters: mockUpdateFilters,
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 2),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

      // Verify filtering is applied (only Test Quest 1 visible due to draft status)
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();

      // Click clear filters button (should be visible since hasActiveFilters is true)
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      expect(clearButton).toBeInTheDocument();
      fireEvent.click(clearButton);

      // Verify updateFilters was called with cleared filters
      expect(mockUpdateFilters).toHaveBeenCalledWith({
        status: 'all',
        difficulty: 'all',
        category: 'all',
        search: '',
      });
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

      // Get all quest titles in order
      const questTitles = screen.getAllByRole('heading', { level: 3 });
      // The most recent quest (Test Quest 1 - updated 1 day ago) should be first
      expect(questTitles[0]).toHaveTextContent('Test Quest 1');
      // Test Quest 2 (updated 2 days ago) should be second
      expect(questTitles[1]).toHaveTextContent('Test Quest 2');
      // Completed Quest (updated 3 days ago) should be third
      expect(questTitles[2]).toHaveTextContent('Completed Quest');
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
      // Mock active filters to show clear button
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'all',
          category: 'all',
          search: 'test',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

      const searchInput = screen.getByPlaceholderText('Search quests...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-label', 'Search quests');

      // In compact mode, QuestFilters only shows search input, no select elements
      // Check for clear filters button when filters are active
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      expect(clearButton).toBeInTheDocument();
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

      // Mock filters with a search term that matches no quests
      mockUseQuestFilters.mockReturnValue({
        filters: {
          status: 'all',
          difficulty: 'all',
          category: 'all',
          search: 'nonexistent quest',
        },
        hasActiveFilters: true,
        updateFilters: vi.fn(),
        clearFilters: vi.fn(),
        setStatus: vi.fn(),
        setDifficulty: vi.fn(),
        setCategory: vi.fn(),
        setSearch: vi.fn(),
        getActiveFilterCount: vi.fn(() => 1),
        validationErrors: {},
        hasValidationErrors: false,
        isFormValid: true,
      });

      render(<QuestList {...mockHandlers} />);

      expect(screen.getByText('No quests match your current filters.')).toBeInTheDocument();
    });
  });
});
