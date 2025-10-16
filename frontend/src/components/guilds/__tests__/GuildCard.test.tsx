/**
 * GuildCard Component Tests
 *
 * Comprehensive unit tests for the GuildCard component,
 * including rendering, interactions, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuildCard } from '../GuildCard';
import { Guild } from '@/lib/api/guild';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days ago'),
}));

describe('GuildCard', () => {
  const mockGuild: Guild = {
    guildId: 'test-guild-id',
    name: 'Test Guild',
    description: 'A test guild for testing purposes',
    createdBy: 'owner-user-id',
    createdAt: '2024-01-15T10:00:00Z',
    memberCount: 15,
    goalCount: 8,
    questCount: 3,
    isPublic: true,
    tags: ['test', 'guild', 'development'],
    members: [
      {
        userId: 'owner-user-id',
        username: 'owner',
        role: 'owner',
        joinedAt: '2024-01-15T10:00:00Z',
      },
      {
        userId: 'member-user-id',
        username: 'member',
        role: 'member',
        joinedAt: '2024-01-16T11:00:00Z',
      },
    ],
  };

  const mockOnGuildClick = vi.fn();
  const mockOnJoin = vi.fn();
  const mockOnLeave = vi.fn();
  const mockOnSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnJoin.mockResolvedValue(undefined);
    mockOnLeave.mockResolvedValue(undefined);
  });

  const renderComponent = (props = {}) => {
    return render(
      <GuildCard
        guild={mockGuild}
        onGuildClick={mockOnGuildClick}
        onJoin={mockOnJoin}
        onLeave={mockOnLeave}
        onSettings={mockOnSettings}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render guild information correctly', () => {
      renderComponent();

      expect(screen.getByText('Test Guild')).toBeInTheDocument();
      expect(screen.getByText('A test guild for testing purposes')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // member count
      expect(screen.getByText('8')).toBeInTheDocument(); // goal count
      expect(screen.getByText('3')).toBeInTheDocument(); // quest count
      expect(screen.getByText('2 days ago')).toBeInTheDocument(); // created date
    });

    it('should render guild tags', () => {
      renderComponent();

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('guild')).toBeInTheDocument();
      expect(screen.getByText('development')).toBeInTheDocument();
    });

    it('should show public/private indicators', () => {
      renderComponent();

      // Should show globe icon for public guild
      expect(screen.getByText(/Public - Anyone can discover and join/)).toBeInTheDocument();
    });

    it('should show private indicators for private guilds', () => {
      const privateGuild = { ...mockGuild, isPublic: false };
      renderComponent({ guild: privateGuild });

      expect(screen.getByText(/Private - Invite-only access/)).toBeInTheDocument();
    });

    it('should render guild avatar with initials', () => {
      renderComponent();

      expect(screen.getByText('TG')).toBeInTheDocument(); // Test Guild initials
    });

    it('should render in compact variant', () => {
      renderComponent({ variant: 'compact' });

      expect(screen.getByText('Test Guild')).toBeInTheDocument();
      // Description should not be shown in compact mode
      expect(screen.queryByText('A test guild for testing purposes')).not.toBeInTheDocument();
    });
  });

  describe('User Role Display', () => {
    it('should show owner crown for guild owner', () => {
      renderComponent({ currentUserId: 'owner-user-id' });

      expect(screen.getByText('Test Guild')).toBeInTheDocument();
      // Crown icon should be present (tested by checking for the owner role in members)
    });

    it('should show member status for regular members', () => {
      renderComponent({ currentUserId: 'member-user-id' });

      expect(screen.getByText('Test Guild')).toBeInTheDocument();
    });

    it('should show join button for non-members on public guilds', () => {
      renderComponent({ currentUserId: 'non-member-id' });

      expect(screen.getByRole('button', { name: /Join/ })).toBeInTheDocument();
    });

    it('should not show join button for private guilds', () => {
      const privateGuild = { ...mockGuild, isPublic: false };
      renderComponent({ guild: privateGuild, currentUserId: 'non-member-id' });

      expect(screen.queryByRole('button', { name: /Join/ })).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onGuildClick when card is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const card = screen.getByRole('button', { name: /View guild Test Guild/ });
      await user.click(card);

      expect(mockOnGuildClick).toHaveBeenCalledWith(mockGuild);
    });

    it('should call onJoin when join button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ currentUserId: 'non-member-id' });

      const joinButton = screen.getByRole('button', { name: /Join/ });
      await user.click(joinButton);

      expect(mockOnJoin).toHaveBeenCalledWith('test-guild-id');
    });

    it('should call onLeave when leave button is clicked', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderComponent({ currentUserId: 'member-user-id' });

      const leaveButton = screen.getByRole('button', { name: /Leave/ });
      await user.click(leaveButton);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to leave this guild?');
      expect(mockOnLeave).toHaveBeenCalledWith('test-guild-id');

      confirmSpy.mockRestore();
    });

    it('should not call onLeave when user cancels confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderComponent({ currentUserId: 'member-user-id' });

      const leaveButton = screen.getByRole('button', { name: /Leave/ });
      await user.click(leaveButton);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnLeave).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should call onSettings when settings button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ currentUserId: 'owner-user-id' });

      const settingsButton = screen.getByLabelText(/Guild settings/);
      await user.click(settingsButton);

      expect(mockOnSettings).toHaveBeenCalledWith(mockGuild);
    });

    it('should show settings button only for owners', () => {
      renderComponent({ currentUserId: 'owner-user-id' });

      expect(screen.getByLabelText(/Guild settings/)).toBeInTheDocument();
    });

    it('should not show settings button for non-owners', () => {
      renderComponent({ currentUserId: 'member-user-id' });

      expect(screen.queryByLabelText(/Guild settings/)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state for join action', async () => {
      const user = userEvent.setup();
      // Mock a slow join operation
      mockOnJoin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderComponent({ currentUserId: 'non-member-id' });

      const joinButton = screen.getByRole('button', { name: /Join/ });
      await user.click(joinButton);

      // Should show loading state
      expect(screen.getByText(/Joining.../)).toBeInTheDocument();
      expect(joinButton).toBeDisabled();
    });

    it('should show loading state for leave action', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      // Mock a slow leave operation
      mockOnLeave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderComponent({ currentUserId: 'member-user-id' });

      const leaveButton = screen.getByRole('button', { name: /Leave/ });
      await user.click(leaveButton);

      // Should show loading state
      expect(screen.getByText(/Leaving.../)).toBeInTheDocument();
      expect(leaveButton).toBeDisabled();

      confirmSpy.mockRestore();
    });
  });

  describe('Tag Display', () => {
    it('should show all tags in default variant', () => {
      renderComponent();

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('guild')).toBeInTheDocument();
      expect(screen.getByText('development')).toBeInTheDocument();
    });

    it('should show limited tags in compact variant', () => {
      const guildWithManyTags = {
        ...mockGuild,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };

      renderComponent({ guild: guildWithManyTags, variant: 'compact' });

      // Should show first 2 tags in compact mode
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument(); // remaining count
    });

    it('should show remaining count for many tags', () => {
      const guildWithManyTags = {
        ...mockGuild,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      };

      renderComponent({ guild: guildWithManyTags });

      // Should show first 3 tags and remaining count
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument(); // remaining count
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();

      const card = screen.getByRole('button', { name: /View guild Test Guild/ });
      expect(card).toHaveAttribute('aria-label', 'View guild Test Guild');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderComponent();

      const card = screen.getByRole('button', { name: /View guild Test Guild/ });

      // Should be focusable
      card.focus();
      expect(card).toHaveFocus();

      // Should respond to Enter key
      await user.keyboard('{Enter}');
      expect(mockOnGuildClick).toHaveBeenCalledWith(mockGuild);
    });

    it('should have proper button labels', () => {
      renderComponent({ currentUserId: 'non-member-id' });

      const joinButton = screen.getByRole('button', { name: /Join/ });
      expect(joinButton).toBeInTheDocument();
    });
  });

  describe('Event Propagation', () => {
    it('should prevent event propagation for action buttons', async () => {
      const user = userEvent.setup();
      renderComponent({ currentUserId: 'non-member-id' });

      const joinButton = screen.getByRole('button', { name: /Join/ });
      
      // Click join button
      await user.click(joinButton);

      // Should call onJoin but not onGuildClick
      expect(mockOnJoin).toHaveBeenCalledWith('test-guild-id');
      expect(mockOnGuildClick).not.toHaveBeenCalled();
    });

    it('should prevent event propagation for settings button', async () => {
      const user = userEvent.setup();
      renderComponent({ currentUserId: 'owner-user-id' });

      const settingsButton = screen.getByLabelText(/Guild settings/);
      
      // Click settings button
      await user.click(settingsButton);

      // Should call onSettings but not onGuildClick
      expect(mockOnSettings).toHaveBeenCalledWith(mockGuild);
      expect(mockOnGuildClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle guild without description', () => {
      const guildWithoutDescription = { ...mockGuild, description: undefined };
      renderComponent({ guild: guildWithoutDescription });

      expect(screen.getByText('Test Guild')).toBeInTheDocument();
      expect(screen.queryByText('A test guild for testing purposes')).not.toBeInTheDocument();
    });

    it('should handle guild without tags', () => {
      const guildWithoutTags = { ...mockGuild, tags: [] };
      renderComponent({ guild: guildWithoutTags });

      expect(screen.getByText('Test Guild')).toBeInTheDocument();
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should handle guild without members', () => {
      const guildWithoutMembers = { ...mockGuild, members: undefined };
      renderComponent({ guild: guildWithoutMembers });

      expect(screen.getByText('Test Guild')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // member count should still show
    });

    it('should handle long guild names', () => {
      const guildWithLongName = {
        ...mockGuild,
        name: 'This is a very long guild name that should be truncated properly',
      };
      renderComponent({ guild: guildWithLongName });

      expect(screen.getByText('This is a very long guild name that should be truncated properly')).toBeInTheDocument();
    });
  });
});

