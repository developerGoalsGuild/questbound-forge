/**
 * Modal component for inviting collaborators to resources.
 * 
 * This component provides a form for inviting users to collaborate on
 * Goals, Quests, or Tasks via email or username.
 */

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { X, Send, User, Mail, MessageSquare } from 'lucide-react';
import { createInvite, CollaborationAPIError } from '../../lib/api/collaborations';
import { useToast } from '../../hooks/use-toast';

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  resourceTitle: string;
  onInviteSent?: () => void;
}

interface FormData {
  inviteeIdentifier: string;
  message: string;
}

interface FormErrors {
  inviteeIdentifier?: string;
  message?: string;
  general?: string;
}

// Helper function to get localized error messages
const getLocalizedErrorMessage = (
  backendMessage: string, 
  identifier: string, 
  t: any
): string => {
  // Check if it's a duplicate invite error
  if (backendMessage.includes('already sent a collaboration invite') || 
      backendMessage.includes('already exists for this user')) {
    return (t.invite?.errors?.duplicateInvite || 'You have already sent a collaboration invite to {identifier}. Please wait for them to respond to the existing invite, or check if they have already accepted it.')
      .replace('{identifier}', identifier);
  }
  
  // Check if it's an already collaborator error
  if (backendMessage.includes('already a collaborator') || 
      backendMessage.includes('already has access')) {
    return (t.invite?.errors?.alreadyCollaborator || '{identifier} is already a collaborator on this resource. No invitation is needed as they already have access.')
      .replace('{identifier}', identifier);
  }
  
  // For other errors, return the backend message as fallback
  return backendMessage;
};

export const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  onInviteSent
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    inviteeIdentifier: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ inviteeIdentifier: '', message: '' });
      setErrors({});
    }
  }, [isOpen]);
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate invitee identifier
    if (!formData.inviteeIdentifier.trim()) {
      newErrors.inviteeIdentifier = t.invite?.validation?.required || 'This field is required';
    } else {
      const identifier = formData.inviteeIdentifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(identifier);
      
      if (!isEmail && !isUsername) {
        newErrors.inviteeIdentifier = t.invite?.validation?.invalidFormat || 'Invalid email or username format';
      }
    }
    
    // Validate message length
    if (formData.message && formData.message.length > 500) {
      newErrors.message = t.invite?.validation?.messageTooLong || 'Message is too long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createInvite({
        resourceType,
        resourceId,
        inviteeIdentifier: formData.inviteeIdentifier.trim(),
        message: formData.message.trim() || undefined
      });
      
      toast({
        title: t.invite?.success?.title || 'Invitation Sent',
        description: t.invite?.success?.description || 'Invitation sent successfully',
        variant: 'default'
      });
      
      onInviteSent?.();
      onClose();
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      
      if (error instanceof CollaborationAPIError) {
        // Show the specific error message from the backend for all error types
        if (error.status === 404) {
          // User not found - show error on the identifier field
          setErrors({ 
            inviteeIdentifier: error.message || t.invite?.errors?.userNotFound || 'User not found' 
          });
        } else {
          // All other errors (400, 403, etc.) - show localized error message
          const errorMessage = getLocalizedErrorMessage(error.message, formData.inviteeIdentifier.trim(), t);
          setErrors({ general: errorMessage });
        }
      } else {
        setErrors({ 
          general: t.invite?.errors?.generic || 'Failed to send invitation' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="invite-modal-title"
        aria-describedby="invite-modal-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 
              id="invite-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t.invite?.title || 'Invite Collaborator'}
            </h2>
            <p 
              id="invite-modal-description"
              className="text-sm text-gray-600 mt-1"
            >
              {(t.invite?.subtitle || 'Invite someone to collaborate on this {resourceType}').replace('{resourceType}', t.common?.resourceTypes?.[resourceType] || resourceType)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t.common?.close || 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error */}
          {errors.general && (
            <div 
              className="bg-red-50 border border-red-200 rounded-md p-3"
              role="alert"
            >
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          
          {/* Invitee Identifier Field */}
          <div>
            <label 
              htmlFor="invitee-identifier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t.invite?.emailOrUsername || 'Email or Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {formData.inviteeIdentifier.includes('@') ? (
                  <Mail className="h-4 w-4 text-gray-400" />
                ) : (
                  <User className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="invitee-identifier"
                type="text"
                value={formData.inviteeIdentifier}
                onChange={(e) => handleInputChange('inviteeIdentifier', e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.inviteeIdentifier 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder={t.invite?.placeholder || 'Enter email or username'}
                aria-invalid={!!errors.inviteeIdentifier}
                aria-describedby={errors.inviteeIdentifier ? 'invitee-error' : undefined}
                disabled={isSubmitting}
              />
            </div>
            {errors.inviteeIdentifier && (
              <p 
                id="invitee-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.inviteeIdentifier}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t.invite?.helpText || 'Enter an email address or username. If using email, make sure the user has an account.'}
            </p>
          </div>
          
          {/* Message Field */}
          <div>
            <label 
              htmlFor="invite-message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t.invite?.message || 'Message'}
              <span className="text-gray-400 ml-1">({t.common?.optional || 'optional'})</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </div>
              <textarea
                id="invite-message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={3}
                maxLength={500}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  errors.message 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder={t.invite?.messagePlaceholder || 'Optional message...'}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : 'message-help'}
                aria-label={t.invite?.message || 'Message'}
                disabled={isSubmitting}
              />
            </div>
            {errors.message && (
              <p 
                id="message-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.message}
              </p>
            )}
            <p 
              id="message-help"
              className="mt-1 text-xs text-gray-500"
            >
              {formData.message.length}/500 {t.common?.characters || 'characters'}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
            >
              {t.common?.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t.invite?.sending || 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t.invite?.send || 'Send Invitation'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
