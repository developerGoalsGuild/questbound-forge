import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CollaboratorList } from '../CollaboratorList';
import { listCollaborators, createInvite, removeCollaborator } from '../../../lib/api/collaborations';

// Mock the API functions
vi.mock('../../../lib/api/collaborations', () => ({
  listCollaborators: vi.fn(),
  createInvite: vi.fn(),
  removeCollaborator: vi.fn(),
  CollaborationAPIError: class CollaborationAPIError extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = 'CollaborationAPIError';
    }
  }
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'collaborations.collaborators.title': 'Collaborators',
        'collaborations.collaborators.invite': 'Invite',
        'collaborations.collaborators.inviteFirst': 'Invite your first collaborator!',
        'collaborations.collaborators.owner': 'Owner',
        'collaborations.collaborators.you': 'You',
        'collaborations.collaborators.joined': 'Joined',
        'collaborations.collaborators.remove': 'Remove',
        'collaborations.collaborators.empty': 'No collaborators yet.',
        'collaborations.collaborators.errors.generic': 'An unexpected error occurred.',
        'common.retry': 'Retry',
        'common.close': 'Close',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.loading': 'Loading...',
        'common.remove': 'Remove',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', username: 'testuser' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }),
}));

// Mock useToast hook
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Collaboration Integration Tests', () => {
  const defaultProps = {
    resourceType: 'goal' as const,
    resourceId: 'goal-123',
    resourceTitle: 'Test Goal',
    currentUserId: 'user-123',
    isOwner: true,
    onInviteClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for successful API responses
    (listCollaborators as any).mockResolvedValue([
      { userId: 'user-123', username: 'john_doe', role: 'owner', joinedAt: '2023-01-01T00:00:00Z' },
      { userId: 'user-456', username: 'jane_smith', role: 'collaborator', joinedAt: '2023-01-02T00:00:00Z' }
    ]);
    (createInvite as any).mockResolvedValue({
      inviteId: 'invite-123',
      status: 'pending',
      inviterUsername: 'john_doe',
      resourceTitle: 'Test Goal',
      resourceType: 'goal',
      resourceId: 'goal-123',
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    (removeCollaborator as any).mockResolvedValue({});
  });

  describe('Basic Component Rendering', () => {
    it('should render CollaboratorList with collaborators', async () => {
      render(<CollaboratorList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Collaborators')).toBeInTheDocument();
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
      });

      // Check owner badge
      expect(screen.getByTitle('Owner')).toBeInTheDocument();
      
      // Check invite button
      expect(screen.getByText('Invite')).toBeInTheDocument();
    });

    it('should show empty state when no collaborators', async () => {
      (listCollaborators as any).mockResolvedValue([]);
      
      render(<CollaboratorList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No collaborators yet.')).toBeInTheDocument();
        expect(screen.getByText('Invite your first collaborator!')).toBeInTheDocument();
      });
    });

    it('should show error state when API fails', async () => {
      (listCollaborators as any).mockRejectedValue(new Error('Failed to load collaborators'));
      
      render(<CollaboratorList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should not show invite button for non-owners', async () => {
      render(<CollaboratorList {...defaultProps} isOwner={false} />);

      await waitFor(() => {
        expect(screen.getByText('Collaborators')).toBeInTheDocument();
      });

      expect(screen.queryByText('Invite')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching collaborators', () => {
      (listCollaborators as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<CollaboratorList {...defaultProps} />);
      
      // Should show loading state (skeleton loading)
      expect(screen.getByText('Collaborators')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should retry when retry button is clicked', async () => {
      (listCollaborators as any)
        .mockRejectedValueOnce(new Error('Failed to load collaborators'))
        .mockResolvedValueOnce([
          { userId: 'user-123', username: 'john_doe', role: 'owner', joinedAt: '2023-01-01T00:00:00Z' }
        ]);
      
      render(<CollaboratorList {...defaultProps} />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
      });
      
      // Click retry button
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      // Should retry API call
      await waitFor(() => {
        expect(listCollaborators).toHaveBeenCalledTimes(2);
      });
      
      // Should show collaborators
      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call listCollaborators on mount', async () => {
      render(<CollaboratorList {...defaultProps} />);

      await waitFor(() => {
        expect(listCollaborators).toHaveBeenCalledWith('goal', 'goal-123');
      });
    });

    it('should call onInviteClick when invite button is clicked', async () => {
      const mockOnInviteClick = vi.fn();
      render(<CollaboratorList {...defaultProps} onInviteClick={mockOnInviteClick} />);

      await waitFor(() => {
        expect(screen.getByText('Collaborators')).toBeInTheDocument();
      });

      const inviteButton = screen.getByText('Invite');
      fireEvent.click(inviteButton);

      expect(mockOnInviteClick).toHaveBeenCalledTimes(1);
    });
  });
});