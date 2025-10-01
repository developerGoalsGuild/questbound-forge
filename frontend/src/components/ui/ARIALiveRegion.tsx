import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ARIALiveRegionProps {
  /**
   * The message to announce
   */
  message: string;
  /**
   * The priority of the announcement
   */
  priority?: 'polite' | 'assertive';
  /**
   * Whether to clear the message after announcement
   */
  clearAfter?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Whether the region is visible (for testing)
   */
  visible?: boolean;
}

/**
 * Component for announcing dynamic content changes to screen readers
 */
const ARIALiveRegion: React.FC<ARIALiveRegionProps> = ({
  message,
  priority = 'polite',
  clearAfter,
  className = '',
  visible = false
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      
      // Clear message after specified time
      if (clearAfter && clearAfter > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <div
      className={`sr-only ${visible ? 'not-sr-only' : ''} ${className}`}
      aria-live={priority}
      aria-atomic="true"
      role="status"
    >
      {currentMessage}
    </div>
  );
};

/**
 * Hook for managing ARIA live announcements
 */
export const useARIALiveAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    clearAfter?: number;
  }>>([]);

  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    clearAfter?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAnnouncements(prev => [...prev, { id, message, priority, clearAfter }]);
    
    // Remove announcement after clearAfter time
    if (clearAfter && clearAfter > 0) {
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }, clearAfter);
    }
  }, []);

  const clearAll = useCallback(() => {
    setAnnouncements([]);
  }, []);

  const clearById = useCallback((id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    announcements,
    announce,
    clearAll,
    clearById
  };
};

/**
 * Component for managing multiple ARIA live announcements
 */
export const ARIALiveManager: React.FC<{
  className?: string;
  visible?: boolean;
}> = ({ className = '', visible = false }) => {
  const { announcements } = useARIALiveAnnouncements();

  return (
    <div className={className}>
      {announcements.map(({ id, message, priority }) => (
        <ARIALiveRegion
          key={id}
          message={message}
          priority={priority}
          visible={visible}
        />
      ))}
    </div>
  );
};

/**
 * Predefined announcement messages for common form actions
 */
export const FormAnnouncements = {
  validationError: (fieldName: string) => 
    `Validation error in ${fieldName} field`,
  
  validationSuccess: (fieldName: string) => 
    `${fieldName} field is valid`,
  
  formSubmitted: () => 
    'Form submitted successfully',
  
  formError: (error: string) => 
    `Form submission failed: ${error}`,
  
  fieldRequired: (fieldName: string) => 
    `${fieldName} field is required`,
  
  fieldSaved: (fieldName: string) => 
    `${fieldName} field saved`,
  
  loading: (action: string) => 
    `${action} in progress`,
  
  loadingComplete: (action: string) => 
    `${action} completed`,
  
  networkError: () => 
    'Network error occurred. Please check your connection',
  
  networkRestored: () => 
    'Network connection restored',
  
  retryAttempt: (attempt: number, maxAttempts: number) => 
    `Retry attempt ${attempt} of ${maxAttempts}`,
  
  autoSave: () => 
    'Changes saved automatically',
  
  undoAvailable: () => 
    'Undo available for last action',
  
  redoAvailable: () => 
    'Redo available for last action'
};

export default ARIALiveRegion;
