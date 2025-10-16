/**
 * Accessibility Hook
 * 
 * A custom hook for managing accessibility features including
 * focus management, screen reader announcements, and keyboard navigation.
 */

import { useCallback, useRef, useState } from 'react';

interface FocusManagementOptions {
  focusOnError?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}

interface AnnouncementOptions {
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export const useAccessibility = (options: FocusManagementOptions = {}) => {
  const {
    focusOnError = true,
    restoreFocus = true,
    trapFocus = false,
  } = options;

  const [announcements, setAnnouncements] = useState<string[]>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store previous focus element
  const storeFocus = useCallback(() => {
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [restoreFocus]);

  // Restore previous focus
  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [restoreFocus]);

  // Focus first error in form
  const focusFirstError = useCallback((formRef: React.RefObject<HTMLFormElement>) => {
    if (!focusOnError || !formRef.current) return;

    const firstError = formRef.current.querySelector('[aria-invalid="true"]') as HTMLElement;
    if (firstError) {
      firstError.focus();
    }
  }, [focusOnError]);

  // Focus first focusable element
  const focusFirst = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();
  }, []);

  // Announce message to screen readers
  const announce = useCallback((message: string, options: AnnouncementOptions = {}) => {
    const { priority = 'polite', delay = 0 } = options;
    
    const announcement = {
      id: Date.now().toString(),
      message,
      priority,
      timestamp: Date.now(),
    };

    setAnnouncements(prev => [...prev, announcement.id]);

    if (delay > 0) {
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(id => id !== announcement.id));
      }, delay);
    } else {
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(id => id !== announcement.id));
      }, 5000);
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, options: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }) => {
    const { onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight } = options;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight?.();
        break;
    }
  }, []);

  // Get ARIA live region props
  const getLiveRegionProps = useCallback(() => ({
    'aria-live': 'polite' as const,
    'aria-atomic': 'true',
    'role': 'status' as const,
  }), []);

  return {
    announcements,
    containerRef,
    storeFocus,
    restorePreviousFocus,
    focusFirstError,
    focusFirst,
    announce,
    handleKeyDown,
    getLiveRegionProps,
  };
};

// Form validation announcements
export const useFormAccessibility = () => {
  const { announce, focusFirstError } = useAccessibility({ focusOnError: true });

  const announceValidationError = useCallback((fieldName: string, error: string) => {
    announce(`Validation error in ${fieldName}: ${error}`, { priority: 'assertive' });
  }, [announce]);

  const announceFormSuccess = useCallback((message: string) => {
    announce(message, { priority: 'polite' });
  }, [announce]);

  const announceFormError = useCallback((message: string) => {
    announce(message, { priority: 'assertive' });
  }, [announce]);

  return {
    announceValidationError,
    announceFormSuccess,
    announceFormError,
    focusFirstError,
  };
};

// Loading state announcements
export const useLoadingAccessibility = () => {
  const { announce } = useAccessibility();

  const announceLoadingStart = useCallback((action: string) => {
    announce(`${action} in progress...`, { priority: 'polite' });
  }, [announce]);

  const announceLoadingComplete = useCallback((action: string) => {
    announce(`${action} completed`, { priority: 'polite' });
  }, [announce]);

  const announceLoadingError = useCallback((action: string, error: string) => {
    announce(`${action} failed: ${error}`, { priority: 'assertive' });
  }, [announce]);

  return {
    announceLoadingStart,
    announceLoadingComplete,
    announceLoadingError,
  };
};

