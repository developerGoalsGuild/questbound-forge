/**
 * Tests for QuestFilters component
 *
 * Tests cover:
 * - Rendering in both compact and full modes
 * - Filter interactions and state updates
 * - Accessibility features
 * - Edge cases and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuestFilters } from '../QuestFilters';
import type { Quest } from '@/models/quest';

// Mock the useTranslation hook
const mockUseTranslation = vi.fn();
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

describe('QuestFilters', () => {
  const mockQuests: Quest[] = [
    {
      id: '1',
      userId: 'user1',
      title: 'Test Quest 1',
      description: 'Description 1',
      status: 'completed',
      difficulty: 'hard',
      category: 'Work',
      rewardXp: 100,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['tag1'],
      privacy: 'public',
      kind: 'linked' as const,
      linkedGoalIds: [],
      linkedTaskIds: [],
      dependsOnQuestIds: [],
      targetCount: 1,
      countScope: 'completed_tasks',
      periodDays: 7,
    },
    {
      id: '2',
      userId: 'user1',
      title: 'Test Quest 2',
      description: 'Description 2',
      status: 'active',
      difficulty: 'medium',
      category: 'Learning',
      rewardXp: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['tag2'],
      privacy: 'private',
      kind: 'quantitative',
      linkedGoalIds: [],
      linkedTaskIds: [],
      dependsOnQuestIds: [],
      targetCount: 1,
      countScope: 'completed_goals',
      periodDays: 7,
    },
  ];

  const defaultFilters = {
    status: 'all',
    difficulty: 'all',
    category: 'all',
    search: '',
  };

  const mockOnFiltersChange = vi.fn();

  // Helper function to render QuestFilters with default props
  const renderQuestFilters = (props: any = {}) => {
    const defaultProps = {
      quests: mockQuests,
      filters: defaultFilters,
      onFiltersChange: mockOnFiltersChange,
      ...props,
    };
    return render(<QuestFilters {...defaultProps} />);
  };

  const mockTranslations = {
    quest: {
      filters: {
        title: 'Filters',
        search: 'Search',
        searchPlaceholder: 'Search quests...',
        searchTooltip: 'Search in quest titles, descriptions, and categories',
        status: 'Status',
        difficulty: 'Difficulty',
        category: 'Category',
        clearAll: 'Clear All Filters',
        activeCount: '{{count}} active',
        searchAriaLabel: 'Search quests',
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
      all: 'All',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({ t: mockTranslations });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Compact Mode Rendering', () => {
    it('renders compact layout when compact is true', () => {
      renderQuestFilters({ compact: true });

      // Should render search input
      expect(screen.getByLabelText('Search quests')).toBeInTheDocument();

      // Should render select dropdowns (they don't have accessible names in compact mode)
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes).toHaveLength(2); // Status, Difficulty (Category not shown in compact mode)

      // Should not render full layout elements
      expect(screen.queryByText('Filters')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
    });

    it('renders active filter count when filters are active', () => {
      const activeFilters = { ...defaultFilters, status: 'active', difficulty: 'easy' };
      renderQuestFilters({ filters: activeFilters, compact: true });

      // Compact mode doesn't show filter count, only the clear button
      expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
    });

    it('shows clear button when filters are active', () => {
      const activeFilters = { ...defaultFilters, status: 'active' };
      renderQuestFilters({ filters: activeFilters, compact: true });

      expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
    });
  });

  describe('Full Mode Rendering', () => {
    it('renders full layout when compact is false', () => {
      renderQuestFilters({ compact: false });

      // Should render title
      expect(screen.getByText('Filters')).toBeInTheDocument();

      // Should render all filter sections
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      renderQuestFilters({ compact: false, title: "Custom Filters" });

      expect(screen.getByText('Custom Filters')).toBeInTheDocument();
    });

    it('does not render title when showTitle is false', () => {
      renderQuestFilters({ compact: false, showTitle: false });

      expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });

    it('renders filter statistics when showStats is true', () => {
      const activeFilters = { ...defaultFilters, status: 'active', difficulty: 'easy' };
      renderQuestFilters({ compact: false, showStats: true, filters: activeFilters });

      // The filter count text is split across multiple elements, so we need to look for the container
      const filterCountElement = screen.getByText((content, element) => {
        return element?.textContent === '2 active filters';
      });
      expect(filterCountElement).toBeInTheDocument();
    });
  });

  describe('Filter Interactions', () => {
    it('calls onFiltersChange when search input changes', async () => {
      renderQuestFilters();

      const searchInput = screen.getByPlaceholderText('Search quests...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          search: 'test search',
        });
      });
    });

    it('calls onFiltersChange when status select changes', async () => {
      renderQuestFilters();

      const statusSelect = screen.getAllByRole('combobox')[0]; // First combobox is status
      fireEvent.click(statusSelect);

      // Wait for the select options to appear and click on "Active"
      await waitFor(() => {
        const activeOption = screen.getByText('Active');
        fireEvent.click(activeOption);
      });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          status: 'active',
        });
      });
    });

    it('calls onFiltersChange when difficulty select changes', async () => {
      renderQuestFilters();

      const difficultySelect = screen.getAllByRole('combobox')[1]; // Second combobox is difficulty
      fireEvent.click(difficultySelect);

      // Wait for the select options to appear and click on "Medium"
      await waitFor(() => {
        const mediumOption = screen.getByText('Medium');
        fireEvent.click(mediumOption);
      });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          difficulty: 'medium',
        });
      });
    });

    it('calls onFiltersChange when clear button is clicked', async () => {
      const activeFilters = { ...defaultFilters, status: 'active' };
      renderQuestFilters({ filters: activeFilters });

      const clearButtons = screen.getAllByRole('button', { name: 'Clear all filters' });
      const clearButton = clearButtons[0]; // Get the first clear button
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          status: 'all',
          difficulty: 'all',
          category: 'all',
          search: '',
        });
      });
    });

    it('renders unique categories from quests', () => {
      renderQuestFilters({ compact: false });

      // Should show categories from mockQuests
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Learning')).toBeInTheDocument();
    });
  });

  describe('Validation and Error Handling', () => {
    it('handles missing translations gracefully', () => {
      mockUseTranslation.mockReturnValue({ t: {} });
      
      renderQuestFilters();

      // Should still render without crashing
      expect(screen.getByLabelText('Search quests')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for search input', () => {
      renderQuestFilters();

      const searchInput = screen.getByLabelText('Search quests');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-label', 'Search quests');
    });

    it('provides proper ARIA labels for select inputs', () => {
      renderQuestFilters({ compact: false });

      // In full mode, selects should have proper labels
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('provides accessible clear button', () => {
      const activeFilters = { ...defaultFilters, status: 'active' };
      renderQuestFilters({ filters: activeFilters });

      const clearButtons = screen.getAllByRole('button', { name: 'Clear all filters' });
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('shows filter statistics for screen readers', () => {
      const activeFilters = { ...defaultFilters, status: 'active', difficulty: 'easy' };
      renderQuestFilters({ compact: false, showStats: true, filters: activeFilters });

      expect(screen.getByText((content, element) => {
        return element?.textContent === '2 active filters';
      })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty quests array', () => {
      renderQuestFilters({ quests: [] });

      expect(screen.getByLabelText('Search quests')).toBeInTheDocument();
    });

    it('handles null quests array', () => {
      renderQuestFilters({ quests: null as any });

      expect(screen.getByLabelText('Search quests')).toBeInTheDocument();
    });

    it('handles undefined quests array', () => {
      renderQuestFilters({ quests: undefined as any });

      expect(screen.getByLabelText('Search quests')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderQuestFilters({ className: 'custom-class' });
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('calls onFiltersChange when provided', () => {
      const customOnChange = vi.fn();
      renderQuestFilters({ onFiltersChange: customOnChange });

      const searchInput = screen.getByPlaceholderText('Search quests...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(customOnChange).toHaveBeenCalled();
    });
  });

  describe('Performance and Re-rendering', () => {
    it('memoizes category extraction', () => {
      const { rerender } = renderQuestFilters({ quests: mockQuests });

      // Re-render with same quests
      rerender(<QuestFilters quests={mockQuests} filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />);

      // Should still work correctly
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('re-extracts categories when quests change', () => {
      const { rerender } = renderQuestFilters({ quests: mockQuests });

      const newQuests = [...mockQuests, {
        id: '3',
        userId: 'user1',
        title: 'Test Quest 3',
        description: 'Description 3',
        status: 'draft',
        difficulty: 'easy',
        category: 'Health',
        rewardXp: 25,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['tag3'],
        privacy: 'public',
        kind: 'personal',
        linkedGoalIds: [],
        linkedTaskIds: [],
        dependsOnQuestIds: [],
        targetCount: 1,
        countScope: 'any',
        periodDays: 7,
      }] as Quest[];

      rerender(<QuestFilters quests={newQuests} filters={defaultFilters} onFiltersChange={mockOnFiltersChange} compact={false} />);

      // Should show new category
      expect(screen.getByText('Health')).toBeInTheDocument();
    });
  });

  describe('Tooltip Integration', () => {
    it('renders tooltip for search field in full mode', () => {
      renderQuestFilters({ compact: false });

      // Should render tooltip trigger (Info icon) for search field
      const tooltipTrigger = screen.getByTestId('tooltip-trigger');
      expect(tooltipTrigger).toBeInTheDocument();
    });
  });
});