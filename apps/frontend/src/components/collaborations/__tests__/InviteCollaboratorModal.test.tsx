/**
 * Unit tests for InviteCollaboratorModal component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InviteCollaboratorModal } from '../InviteCollaboratorModal';

// Mock the API module
vi.mock('../../../lib/api/collaborations', () => ({
  createInvite: vi.fn()
}));

// Mock the hooks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'collaborations.invite.title': 'Invite Collaborator',
        'collaborations.invite.subtitle': 'Invite someone to collaborate on this {resourceType}',
        'collaborations.invite.emailOrUsername': 'Email or Username',
        'collaborations.invite.message': 'Message',
        'collaborations.invite.placeholder': 'Enter email or username',
        'collaborations.invite.helpText': 'Enter an email address or username',
        'collaborations.invite.messagePlaceholder': 'Optional message...',
        'collaborations.invite.send': 'Send Invitation',
        'collaborations.invite.sending': 'Sending...',
        'collaborations.invite.success.title': 'Invitation Sent',
        'collaborations.invite.success.description': 'Invitation sent successfully',
        'collaborations.invite.errors.userNotFound': 'User not found',
        'collaborations.invite.errors.generic': 'Failed to send invitation',
        'collaborations.invite.validation.required': 'This field is required',
        'collaborations.invite.validation.invalidFormat': 'Invalid email or username format',
        'collaborations.invite.validation.messageTooLong': 'Message is too long',
        'common.resourceTypes.goal': 'Goal',
        'common.resourceTypes.quest': 'Quest',
        'common.resourceTypes.task': 'Task',
        'common.optional': 'Optional',
        'common.characters': 'characters',
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

describe('InviteCollaboratorModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    resourceType: 'goal' as const,
    resourceId: 'goal-123',
    resourceTitle: 'Test Goal',
    onInviteSent: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    expect(screen.getByText('Invite Collaborator')).toBeInTheDocument();
    expect(screen.getByText('Invite someone to collaborate on this Goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Email or Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<InviteCollaboratorModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Invite Collaborator')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Send Invitation');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const emailInput = screen.getByLabelText('Email or Username');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByText('Send Invitation');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or username format')).toBeInTheDocument();
    });
  });

  it('validates username format', async () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const usernameInput = screen.getByLabelText('Email or Username');
    fireEvent.change(usernameInput, { target: { value: 'ab' } }); // Too short
    
    const submitButton = screen.getByText('Send Invitation');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or username format')).toBeInTheDocument();
    });
  });

  it('validates message length', async () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const emailInput = screen.getByLabelText('Email or Username');
    const messageInput = screen.getByLabelText('Message');
    
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'a'.repeat(501) } }); // Too long
    
    const submitButton = screen.getByText('Send Invitation');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Message is too long')).toBeInTheDocument();
    });
  });

  it('accepts valid email', async () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const emailInput = screen.getByLabelText('Email or Username');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    
    const submitButton = screen.getByText('Send Invitation');
    expect(submitButton).not.toBeDisabled();
  });

  it('accepts valid username', async () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const usernameInput = screen.getByLabelText('Email or Username');
    fireEvent.change(usernameInput, { target: { value: 'valid_username' } });
    
    const submitButton = screen.getByText('Send Invitation');
    expect(submitButton).not.toBeDisabled();
  });

  it('shows character count for message', () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const messageInput = screen.getByLabelText('Message');
    fireEvent.change(messageInput, { target: { value: 'Hello world' } });
    
    expect(screen.getByText('11/500 characters')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    render(<InviteCollaboratorModal {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('resets form when modal opens', () => {
    const { rerender } = render(<InviteCollaboratorModal {...defaultProps} isOpen={false} />);
    
    // Open modal
    rerender(<InviteCollaboratorModal {...defaultProps} isOpen={true} />);
    
    const emailInput = screen.getByLabelText('Email or Username');
    const messageInput = screen.getByLabelText('Message');
    
    expect(emailInput).toHaveValue('');
    expect(messageInput).toHaveValue('');
  });
});

