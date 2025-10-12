/**
 * Integration tests for collaboration components.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InviteCollaboratorModal } from '../InviteCollaboratorModal';
import { CollaboratorList } from '../CollaboratorList';
import { createInvite, listCollaborators, removeCollaborator } from '../../../lib/api/collaborations';

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

// Mock the hooks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'collaborations.invite.title': 'Invite Collaborator',
        'collaborations.collaborators.title': 'Collaborators',
        'common.cancel': 'Cancel',
        'common.close': 'Close'
      };
      return options ? translations[key]?.replace(/\{(\w+)\}/g, (_, key) => options[key] || '') : translations[key] || key;
    }
  })
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' }
  })
}));

describe('Collaboration Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    (listCollaborators as any).mockResolvedValue([
      { id: 'user1', username: 'john_doe', role: 'owner' },
      { id: 'user2', username: 'jane_smith', role: 'collaborator' }
    ]);
    
    (createInvite as any).mockResolvedValue({
      id: 'invite123',
      status: 'pending'
    });
    
    (removeCollaborator as any).mockResolvedValue({});
  });

  describe('InviteCollaboratorModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      resourceType: 'goal' as const,
      resourceId: 'goal-123',
      resourceTitle: 'Test Goal',
      onInviteSent: vi.fn()
    };

    it('renders without crashing', () => {
      render(<InviteCollaboratorModal {...defaultProps} />);
      expect(screen.getByText('Invite Collaborator')).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<InviteCollaboratorModal {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'invite-modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'invite-modal-description');
    });
  });

  describe('CollaboratorList', () => {
    const defaultProps = {
      resourceType: 'goal' as const,
      resourceId: 'goal-123',
      resourceTitle: 'Test Goal',
      currentUserId: 'user-123',
      isOwner: true,
      onInviteClick: vi.fn()
    };

    it('renders without crashing', () => {
      render(<CollaboratorList {...defaultProps} />);
      expect(screen.getByText('Collaborators')).toBeInTheDocument();
    });

    it('shows invite button for owners', async () => {
      render(<CollaboratorList {...defaultProps} isOwner={true} />);
      await waitFor(() => {
        expect(screen.getByText('collaborations.collaborators.invite')).toBeInTheDocument();
      });
    });

    it('does not show invite button for non-owners', () => {
      render(<CollaboratorList {...defaultProps} isOwner={false} />);
      expect(screen.queryByText('collaborations.collaborators.invite')).not.toBeInTheDocument();
    });
  });
});
