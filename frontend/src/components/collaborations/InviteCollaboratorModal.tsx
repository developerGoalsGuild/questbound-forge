/**
 * Modal component for inviting collaborators to resources.
 * 
 * This component provides a form for inviting users to collaborate on
 * Goals, Quests, or Tasks via email or username.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
      newErrors.inviteeIdentifier = t('collaborations.invite.validation.required');
    } else {
      const identifier = formData.inviteeIdentifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(identifier);
      
      if (!isEmail && !isUsername) {
        newErrors.inviteeIdentifier = t('collaborations.invite.validation.invalidFormat');
      }
    }
    
    // Validate message length
    if (formData.message && formData.message.length > 500) {
      newErrors.message = t('collaborations.invite.validation.messageTooLong');
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
        title: t('collaborations.invite.success.title'),
        description: t('collaborations.invite.success.description'),
        variant: 'default'
      });
      
      onInviteSent?.();
      onClose();
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      
      if (error instanceof CollaborationAPIError) {
        if (error.status === 400) {
          setErrors({ general: error.message });
        } else if (error.status === 404) {
          setErrors({ 
            inviteeIdentifier: t('collaborations.invite.errors.userNotFound') 
          });
        } else {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ 
          general: t('collaborations.invite.errors.generic') 
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
              {t('collaborations.invite.title')}
            </h2>
            <p 
              id="invite-modal-description"
              className="text-sm text-gray-600 mt-1"
            >
              {t('collaborations.invite.subtitle', { 
                resourceType: t(`common.resourceTypes.${resourceType}`),
                resourceTitle 
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('common.close')}
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
              {t('collaborations.invite.emailOrUsername')}
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
                placeholder={t('collaborations.invite.placeholder')}
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
              {t('collaborations.invite.helpText')}
            </p>
          </div>
          
          {/* Message Field */}
          <div>
            <label 
              htmlFor="invite-message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('collaborations.invite.message')}
              <span className="text-gray-400 ml-1">({t('common.optional')})</span>
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
                placeholder={t('collaborations.invite.messagePlaceholder')}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : 'message-help'}
                aria-label={t('collaborations.invite.message')}
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
              {formData.message.length}/500 {t('common.characters')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t('collaborations.invite.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('collaborations.invite.send')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
