/**
 * GuildsList Component Tests
 *
 * Comprehensive unit tests for the GuildsList component,
 * including filtering, sorting, and view modes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuildsList } from '../GuildsList';
import { Guild } from '@/lib/api/guild';

describe('GuildsList', () => {
  const mockGuilds: Guild[] = [
    {
      guildId: 'guild-1',
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      createdBy: 'user-1',
      createdAt: '2024-01-15T10:00:00Z',
      memberCount: 15,
      goalCount: 8,
      questCount: 3,
      isPublic: true,
      tags: ['fitness', 'health', 'wellness'],
    },
    {
      guildId: 'guild-2',
      name: 'Study Group Alpha',
      description: 'Collaborative learning and academic achievement',
      createdBy: 'user-2',
      createdAt: '2024-01-10T14:30:00Z',
      memberCount: 12,
      goalCount: 5,
      questCount: 7,
      isPublic: true,
      tags: ['education', 'learning', 'academic'],
    },
    {
      guildId: 'guild-3',
      name: 'Creative Writers',
      description: 'Private guild for aspiring writers',
      createdBy: 'user-3',
      createdAt: '2024-01-05T09:15:00Z',
      memberCount: 8,
      goalCount: 12,
      questCount: 4,
      isPublic: false,
      tags: ['writing', 'creative', 'literature'],
    },
  ];

  const mockOnGuildClick = vi.fn();
  const mockOnJoinGuild = vi.fn();
  const mockOnLeaveGuild = vi.fn();
  const mockOnGuildSettings = vi.fn();
  const mockOnCreateGuild = vi.fn();
  const mockOnSearchChange = vi.fn();
  const mockOnTagsChange = vi.fn();
  const mockOnSortChange = vi.fn();
  const mockOnViewModeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnJoinGuild.mockResolvedValue(undefined);
    mockOnLeaveGuild.mockResolvedValue(undefined);
  });

  const renderComponent = (props = {}) => {
    return render(
      <GuildsList
        guilds={mockGuilds}
        onGuildClick={mockOnGuildClick}
        onJoinGuild={mockOnJoinGuild}
        onLeaveGuild={mockOnLeaveGuild}
        onGuildSettings={mockOnGuildSettings}
        onCreateGuild={mockOnCreateGuild}
        onSearchChange={mockOnSearchChange}
        onTagsChange={mockOnTagsChange}
        onSortChange={mockOnSortChange}
        onViewModeChange={mockOnViewModeChange}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render guild list with header', () => {
      renderComponent();

      expect(screen.getByText('My Guilds')).toBeInTheDocument();
      expect(screen.getByText('3 guilds found')).toBeInTheDocument();
      expect(screen.getByText('Create Guild')).toBeInTheDocument();
    });

    it('should render all guilds', () => {
      renderComponent();

      expect(screen.getByText('Fitness Enthusiasts')).toBeInTheDocument();
      expect(screen.getByText('Study Group Alpha')).toBeInTheDocument();
      expect(screen.getByText('Creative Writers')).toBeInTheDocument();
    });

    it('should render filters section', () => {
      renderComponent();

      expect(screen.getByText('Filters & Search')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search guilds/)).toBeInTheDocument();
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
    });

    it('should render view mode toggle', () => {
      renderComponent();

      const gridButton = screen.getByRole('button', { name: /Grid View/ });
      const listButton = screen.getByRole('button', { name: /List View/ });

      expect(gridButton).toBeInTheDocument();
      expect(listButton).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      renderComponent({ isLoading: true });

      // Should show skeleton cards
      const skeletonCards = screen.getAllByRole('button');
      expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('should not show guilds when loading', () => {
      renderComponent({ isLoading: true });

      expect(screen.queryByText('Fitness Enthusiasts')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no guilds', () => {
      renderComponent({ guilds: [] });

      expect(screen.getByText('No guilds yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first guild to start building a community around shared goals.')).toBeInTheDocument();
      expect(screen.getByText('Create Guild')).toBeInTheDocument();
    });

    it('should show empty state when no guilds match filters', () => {
      renderComponent({ searchQuery: 'nonexistent' });

      expect(screen.getByText('No guilds yet')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter guilds by name', async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Search guilds/);
      await user.type(searchInput, 'Fitness');

      // Should show only Fitness Enthusiasts
      expect(screen.getByText('Fitness Enthusiasts')).toBeInTheDocument();
      expect(screen.queryByText('Study Group Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Creative Writers')).not.toBeInTheDocument();
    });

    it('should filter guilds by description', async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Search guilds/);
      await user.type(searchInput, 'academic');

      // Should show only Study Group Alpha
      expect(screen.getByText('Study Group Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Fitness Enthusiasts')).not.toBeInTheDocument();
      expect(screen.queryByText('Creative Writers')).not.toBeInTheDocument();
    });

    it('should filter guilds by tags', async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Search guilds/);
      await user.type(searchInput, 'writing');

      // Should show only Creative Writers
      expect(screen.getByText('Creative Writers')).toBeInTheDocument();
      expect(screen.queryByText('Fitness Enthusiasts')).not.toBeInTheDocument();
      expect(screen.queryByText('Study Group Alpha')).not.toBeInTheDocument();
    });

    it('should call onSearchChange when search input changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Search guilds/);
      await user.type(searchInput, 'test');

      // Should call onSearchChange with debounced value
      expect(mockOnSearchChange).toHaveBeenCalled();
    });

    it('should show clear filters button when search is active', async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Search guilds/);
      await user.type(searchInput, 'test');

      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  describe('Tag Filtering', () => {
    it('should show available tags for filtering', () => {
      renderComponent();

      expect(screen.getByText('Filter by tags:')).toBeInTheDocument();
      expect(screen.getByText('fitness')).toBeInTheDocument();
      expect(screen.getByText('health')).toBeInTheDocument();
      expect(screen.getByText('education')).toBeInTheDocument();
      expect(screen.getByText('writing')).toBeInTheDocument();
    });

    it('should filter guilds by selected tags', async () => {
      const user = userEvent.setup();
      renderComponent();

      const fitnessTag = screen.getByText('fitness');
      await user.click(fitnessTag);

      // Should show only guilds with fitness tag
      expect(screen.getByText('Fitness Enthusiasts')).toBeInTheDocument();
      expect(screen.queryByText('Study Group Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Creative Writers')).not.toBeInTheDocument();
    });

    it('should filter guilds by multiple tags', async () => {
      const user = userEvent.setup();
      renderComponent();

      const fitnessTag = screen.getByText('fitness');
      const healthTag = screen.getByText('health');
      
      await user.click(fitnessTag);
      await user.click(healthTag);

      // Should show only guilds with both tags
      expect(screen.getByText('Fitness Enthusiasts')).toBeInTheDocument();
      expect(screen.queryByText('Study Group Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Creative Writers')).not.toBeInTheDocument();
    });

    it('should call onTagsChange when tags are selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      const fitnessTag = screen.getByText('fitness');
      await user.click(fitnessTag);

      expect(mockOnTagsChange).toHaveBeenCalledWith(['fitness']);
    });

    it('should deselect tags when clicked again', async () => {
      const user = userEvent.setup();
      renderComponent();

      const fitnessTag = screen.getByText('fitness');
      await user.click(fitnessTag);
      await user.click(fitnessTag);

      expect(mockOnTagsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Sorting', () => {
    it('should sort guilds by newest by default', () => {
      renderComponent();

      const guildCards = screen.getAllByRole('button');
      // First card should be the newest (Fitness Enthusiasts)
      expect(guildCards[0]).toHaveTextContent('Fitness Enthusiasts');
    });

    it('should sort guilds by oldest when selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      const sortSelect = screen.getByDisplayValue('Newest');
      await user.click(sortSelect);

      const oldestOption = screen.getByText('Oldest');
      await user.click(oldestOption);

      const guildCards = screen.getAllByRole('button');
      // First card should be the oldest (Creative Writers)
      expect(guildCards[0]).toHaveTextContent('Creative Writers');
    });

    it('should sort guilds by member count when selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      const sortSelect = screen.getByDisplayValue('Newest');
      await user.click(sortSelect);

      const membersOption = screen.getByText('Most Members');
      await user.click(membersOption);

      const guildCards = screen.getAllByRole('button');
      // First card should have most members (Fitness Enthusiasts with 15)
      expect(guildCards[0]).toHaveTextContent('Fitness Enthusiasts');
    });

    it('should call onSortChange when sort option changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const sortSelect = screen.getByDisplayValue('Newest');
      await user.click(sortSelect);

      const oldestOption = screen.getByText('Oldest');
      await user.click(oldestOption);

      expect(mockOnSortChange).toHaveBeenCalledWith('oldest');
    });
  });

  describe('View Mode', () => {
    it('should show grid view by default', () => {
      renderComponent();

      const gridButton = screen.getByRole('button', { name: /Grid View/ });
      expect(gridButton).toHaveClass('bg-blue-600'); // selected state
    });

    it('should switch to list view when clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const listButton = screen.getByRole('button', { name: /List View/ });
      await user.click(listButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('list');
    });

    it('should switch to grid view when clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ viewMode: 'list' });

      const gridButton = screen.getByRole('button', { name: /Grid View/ });
      await user.click(gridButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('grid');
    });
  });

  describe('Actions', () => {
    it('should call onCreateGuild when create button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const createButton = screen.getByText('Create Guild');
      await user.click(createButton);

      expect(mockOnCreateGuild).toHaveBeenCalled();
    });

    it('should call onGuildClick when guild card is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const guildCard = screen.getByRole('button', { name: /View guild Fitness Enthusiasts/ });
      await user.click(guildCard);

      expect(mockOnGuildClick).toHaveBeenCalledWith(mockGuilds[0]);
    });

    it('should call onJoinGuild when join button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ currentUserId: 'non-member-id' });

      const joinButton = screen.getByRole('button', { name: /Join/ });
      await user.click(joinButton);

      expect(mockOnJoinGuild).toHaveBeenCalledWith('guild-1');
    });

    it('should call onLeaveGuild when leave button is clicked', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderComponent({ currentUserId: 'member-id' });

      const leaveButton = screen.getByRole('button', { name: /Leave/ });
      await user.click(leaveButton);

      expect(mockOnLeaveGuild).toHaveBeenCalledWith('guild-1');

      confirmSpy.mockRestore();
    });

    it('should call onGuildSettings when settings button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ currentUserId: 'owner-id' });

      const settingsButton = screen.getByLabelText(/Guild settings/);
      await user.click(settingsButton);

      expect(mockOnGuildSettings).toHaveBeenCalledWith(mockGuilds[0]);
    });
  });

  describe('Clear Filters', () => {
    it('should clear search and tags when clear filters is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ searchQuery: 'test', selectedTags: ['fitness'] });

      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
      expect(mockOnTagsChange).toHaveBeenCalledWith([]);
    });

    it('should not show clear filters button when no filters are active', () => {
      renderComponent();

      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should hide create button when showCreateButton is false', () => {
      renderComponent({ showCreateButton: false });

      expect(screen.queryByText('Create Guild')).not.toBeInTheDocument();
    });

    it('should hide filters when showFilters is false', () => {
      renderComponent({ showFilters: false });

      expect(screen.queryByText('Filters & Search')).not.toBeInTheDocument();
    });

    it('should not call onCreateGuild when not provided', async () => {
      const user = userEvent.setup();
      renderComponent({ onCreateGuild: undefined });

      const createButton = screen.getByText('Create Guild');
      await user.click(createButton);

      // Should not throw error
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for form controls', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Search guilds/);
      expect(searchInput).toHaveAttribute('placeholder');

      const sortSelect = screen.getByDisplayValue('Newest');
      expect(sortSelect).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByPlaceholderText(/Search guilds/)).toHaveFocus();

      await user.tab();
      expect(screen.getByDisplayValue('Newest')).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty guild list', () => {
      renderComponent({ guilds: [] });

      expect(screen.getByText('No guilds yet')).toBeInTheDocument();
    });

    it('should handle guilds without tags', () => {
      const guildsWithoutTags = mockGuilds.map(guild => ({ ...guild, tags: [] }));
      renderComponent({ guilds: guildsWithoutTags });

      expect(screen.queryByText('Filter by tags:')).not.toBeInTheDocument();
    });

    it('should handle guilds with duplicate tags', () => {
      const guildsWithDuplicateTags = [
        ...mockGuilds,
        {
          ...mockGuilds[0],
          guildId: 'guild-4',
          name: 'Another Fitness Guild',
          tags: ['fitness', 'health'], // duplicate tags
        },
      ];

      renderComponent({ guilds: guildsWithDuplicateTags });

      // Should show unique tags only
      const fitnessTags = screen.getAllByText('fitness');
      expect(fitnessTags).toHaveLength(1); // Only one tag button
    });

    it('should handle very long search queries', async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/Search guilds/);
      const longQuery = 'a'.repeat(100);
      
      await user.type(searchInput, longQuery);

      // Should not crash and should filter appropriately
      expect(searchInput).toHaveValue(longQuery);
    });
  });
});

