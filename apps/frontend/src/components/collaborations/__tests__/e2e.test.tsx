import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CollaboratorList } from '../CollaboratorList';
import { InviteCollaboratorModal } from '../InviteCollaboratorModal';
import { createInvite, listCollaborators, removeCollaborator } from '../../../lib/api/collaborations';

// Mock i18n
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

// Mock API calls
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

describe('Collaboration E2E Tests', () => {
  const defaultProps = {
    resourceType: 'goal' as const,
    resourceId: 'goal-123',
    resourceTitle: 'Test Goal',
    currentUserId: 'user-123',
    isOwner: true,
    onInviteClick: vi.fn(),
    onInviteSent: vi.fn(),
    onCollaboratorRemoved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Component Integration', () => {
    it('should render CollaboratorList with collaborators', async () => {
      (listCollaborators as any).mockResolvedValue([
        { userId: 'user-123', username: 'john_doe', role: 'owner', joinedAt: '2023-01-01T00:00:00Z' },
        { userId: 'user-456', username: 'jane_smith', role: 'collaborator', joinedAt: '2023-01-02T00:00:00Z' }
      ]);

      render(<CollaboratorList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Collaborators')).toBeInTheDocument();
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
      });
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
      (listCollaborators as any).mockResolvedValue([
        { userId: 'user-123', username: 'john_doe', role: 'owner', joinedAt: '2023-01-01T00:00:00Z' }
      ]);

      render(<CollaboratorList {...defaultProps} isOwner={false} />);

      await waitFor(() => {
        expect(screen.getByText('Collaborators')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: 'Invite' })).not.toBeInTheDocument();
    });
  });

  describe('Invite Modal Integration', () => {
    it('should open and close invite modal', async () => {
      const mockOnClose = vi.fn();
      render(<InviteCollaboratorModal {...defaultProps} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Invite Collaborator')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle form submission with valid data', async () => {
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

      render(<InviteCollaboratorModal {...defaultProps} isOpen={true} onClose={vi.fn()} />);

      const emailInput = screen.getByPlaceholderText('Enter email or username');
      const messageInput = screen.getByPlaceholderText('Add a personal message (optional)');
      const sendButton = screen.getByText('Send Invitation');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(messageInput, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(createInvite).toHaveBeenCalledWith({
          resource_type: 'goal',
          resource_id: 'goal-123',
          invitee_identifier: 'test@example.com',
          message: 'Hello!',
        });
        expect(screen.getByText('Invitation sent successfully')).toBeInTheDocument();
      });
    });

    it('should handle form submission errors', async () => {
      (createInvite as any).mockRejectedValue(new Error('User not found'));

      render(<InviteCollaboratorModal {...defaultProps} isOpen={true} onClose={vi.fn()} />);

      const emailInput = screen.getByPlaceholderText('Enter email or username');
      const sendButton = screen.getByText('Send Invitation');

      fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(createInvite).toHaveBeenCalledWith({
          resource_type: 'goal',
          resource_id: 'goal-123',
          invitee_identifier: 'invalid@example.com',
          message: '',
        });
        expect(screen.getByText('Failed to send invitation.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should retry when retry button is clicked', async () => {
      (listCollaborators as any)
        .mockRejectedValueOnce(new Error('Failed to load collaborators'))
        .mockResolvedValueOnce([
          { userId: 'user-123', username: 'john_doe', role: 'owner', joinedAt: '2023-01-01T00:00:00Z' }
        ]);

      render(<CollaboratorList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(listCollaborators).toHaveBeenCalledTimes(2);
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
    });
  });

  describe('User Permission Scenarios', () => {
    it('should handle non-owner user experience', async () => {
      const nonOwnerProps = {
        ...defaultProps,
        isOwner: false,
        currentUserId: 'user-456',
      };

      (listCollaborators as any).mockResolvedValue([
        { userId: 'user-123', username: 'john_doe', role: 'owner', joinedAt: '2023-01-01T00:00:00Z' },
        { userId: 'user-456', username: 'jane_smith', role: 'collaborator', joinedAt: '2023-01-02T00:00:00Z' }
      ]);

      render(<CollaboratorList {...nonOwnerProps} />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
      });

      // Should not show invite button
      expect(screen.queryByRole('button', { name: 'Invite' })).not.toBeInTheDocument();

      // Should not show remove buttons
      const moreVerticalButtons = screen.queryAllByRole('button').filter(button =>
        button.querySelector('svg[class*="h-4 w-4"]')
      );
      expect(moreVerticalButtons).toHaveLength(0);
    });
  });
});