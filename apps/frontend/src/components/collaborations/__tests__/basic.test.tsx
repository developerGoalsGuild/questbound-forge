/**
 * Basic tests for collaboration components.
 * Tests component rendering and basic functionality.
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InviteCollaboratorModal } from '../InviteCollaboratorModal';
import { CollaboratorList } from '../CollaboratorList';
import { listCollaborators, createInvite, removeCollaborator } from '../../../lib/api/collaborations';

// Mock the API module
vi.mock('../../../lib/api/collaborations', () => ({
  createInvite: vi.fn(),
  listCollaborators: vi.fn(),
  removeCollaborator: vi.fn(),
  CollaborationAPIError: class CollaborationAPIError extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = 'CollaborationAPIError';
    }
  },
}));

// Mock the toast hook
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the auth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', username: 'john_doe', email: 'john@example.com' },
    loading: false,
    error: null,
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'collaborations.invite.title': 'Invite Collaborator',
        'collaborations.invite.subtitle': 'Send an invitation to a user to collaborate on this resource.',
        'collaborations.invite.emailOrUsername': 'Email or Username',
        'collaborations.invite.placeholder': 'Enter email or username',
        'collaborations.invite.helpText': 'The user will receive an email invitation.',
        'collaborations.invite.message': 'Message (Optional)',
        'collaborations.invite.messagePlaceholder': 'Add a personal message (optional)',
        'collaborations.invite.send': 'Send Invitation',
        'collaborations.invite.sending': 'Sending...',
        'collaborations.invite.success': 'Invitation sent successfully',
        'collaborations.invite.errors.generic': 'Failed to send invitation.',
        'collaborations.invite.emailRequired': 'Email or Username is required',
        'collaborations.collaborators.title': 'Collaborators',
        'collaborations.collaborators.invite': 'Invite',
        'collaborations.collaborators.inviteFirst': 'Invite your first collaborator!',
        'collaborations.collaborators.owner': 'Owner',
        'collaborations.collaborators.you': 'You',
        'collaborations.collaborators.joined': 'Joined',
        'collaborations.collaborators.remove': 'Remove',
        'collaborations.collaborators.empty': 'No collaborators yet.',
        'collaborations.collaborators.errors.generic': 'An unexpected error occurred.',
        'collaborations.collaborators.remove.confirm.title': 'Confirm Removal',
        'collaborations.collaborators.remove.confirm.description': 'Are you sure you want to remove {username} from this resource?',
        'collaborations.collaborators.remove.success.title': 'Collaborator Removed',
        'collaborations.collaborators.remove.success.description': '{username} has been successfully removed.',
        'collaborations.collaborators.remove.errors.noPermission.title': 'Permission Denied',
        'collaborations.collaborators.remove.errors.noPermission.description': 'You do not have permission to remove this collaborator.',
        'collaborations.collaborators.remove.errors.generic.title': 'Removal Failed',
        'collaborations.collaborators.remove.errors.generic.description': 'Failed to remove collaborator.',
        'common.retry': 'Retry',
        'common.close': 'Close',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.loading': 'Loading...',
        'common.remove': 'Remove',
        'common.optional': 'optional',
        'common.characters': 'characters',
      };
      return translations[key] || key;
    },
  }),
}));

describe('Collaboration Components - Basic Tests', () => {
  const inviteModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    resourceType: 'goal' as const,
    resourceId: 'goal-123',
    resourceTitle: 'Test Goal',
    onInviteSent: vi.fn(),
  };

  const collaboratorListProps = {
    resourceType: 'goal' as const,
    resourceId: 'goal-123',
    resourceTitle: 'Test Goal',
    currentUserId: 'user-123',
    isOwner: true,
    onInviteClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    (listCollaborators as any).mockResolvedValue([
      { userId: 'user-123', username: 'john_doe', role: 'owner', joinedAt: '2023-01-01T00:00:00Z' },
      { userId: 'user-456', username: 'jane_smith', role: 'collaborator', joinedAt: '2023-01-02T00:00:00Z' }
    ]);
  });

  describe('InviteCollaboratorModal', () => {
    it('should render without crashing', () => {
      render(<InviteCollaboratorModal {...inviteModalProps} />);
      expect(screen.getByText('Invite Collaborator')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<InviteCollaboratorModal {...inviteModalProps} />);
      expect(screen.getByRole('dialog', { name: 'Invite Collaborator' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email or Username')).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
    });

    it('should close when close button is clicked', () => {
      const onClose = vi.fn();
      render(<InviteCollaboratorModal {...inviteModalProps} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: 'Close' });
      closeButton.click();
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('CollaboratorList', () => {
    it('should render without crashing', async () => {
      render(<CollaboratorList {...collaboratorListProps} />);
      await screen.findByText('Collaborators');
      expect(screen.getByText('Collaborators')).toBeInTheDocument();
    });

    it('should show invite button for owners', async () => {
      render(<CollaboratorList {...collaboratorListProps} isOwner={true} />);
      await screen.findByText('Invite');
      expect(screen.getByText('Invite')).toBeInTheDocument();
    });

    it('should not show invite button for non-owners', async () => {
      render(<CollaboratorList {...collaboratorListProps} isOwner={false} />);
      await screen.findByText('Collaborators');
      expect(screen.queryByText('Invite')).not.toBeInTheDocument();
    });

    it('should display collaborator count', async () => {
      render(<CollaboratorList {...collaboratorListProps} />);
      await screen.findByText('2'); // Should show count of 2 collaborators
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should accept different resource types', async () => {
      const questProps = { ...collaboratorListProps, resourceType: 'quest' as const };
      render(<CollaboratorList {...questProps} />);
      await screen.findByText('Collaborators');
      expect(screen.getByText('Collaborators')).toBeInTheDocument();
    });

    it('should accept different resource IDs', async () => {
      const customProps = { ...collaboratorListProps, resourceId: 'custom-id' };
      render(<CollaboratorList {...customProps} />);
      await screen.findByText('Collaborators');
      expect(screen.getByText('Collaborators')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      // Test with minimal props
      const minimalProps = {
        resourceType: 'goal' as const,
        resourceId: 'goal-123',
        resourceTitle: 'Test Goal',
        currentUserId: 'user-123',
        isOwner: false,
      };
      
      expect(() => {
        render(<CollaboratorList {...minimalProps} />);
      }).not.toThrow();
    });
  });
});
