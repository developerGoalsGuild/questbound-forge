/**
 * GuildCreationModal Component
 *
 * A modal wrapper for the guild creation form with proper accessibility,
 * keyboard navigation, and backdrop handling.
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GuildCreationForm } from './GuildCreationForm';
import { GuildCreateInput } from '@/lib/api/guild';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (guild: any) => void;
  initialData?: Partial<GuildCreateInput>;
  mode?: 'create' | 'edit';
  title?: string;
  className?: string;
}

export const GuildCreationModal: React.FC<GuildCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  mode = 'create',
  title,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the modal
      modalRef.current.focus();
    } else if (!isOpen && previousActiveElement.current) {
      // Restore focus to the previously focused element
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSuccess = (guild: any) => {
    onSuccess?.(guild);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guild-modal-title"
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl',
          'focus:outline-none',
          className
        )}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="guild-modal-title" className="text-xl font-semibold text-gray-900">
            {title || (mode === 'edit' ? (guildTranslations?.create?.title || 'Edit Guild') : (guildTranslations?.create?.title || 'Create Guild'))}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            aria-label={guildTranslations?.create?.actions?.cancel || 'Close modal'}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <GuildCreationForm
            onSuccess={handleSuccess}
            onCancel={onClose}
            initialData={initialData}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};
