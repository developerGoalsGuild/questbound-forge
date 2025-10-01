import { useRef, useCallback, useEffect } from 'react';

interface FocusManagementOptions {
  /**
   * Whether to automatically focus the first error field when validation fails
   */
  focusOnError?: boolean;
  /**
   * Whether to restore focus to the last focused element when component unmounts
   */
  restoreFocus?: boolean;
  /**
   * Custom selector for the first focusable element
   */
  firstFocusableSelector?: string;
  /**
   * Custom selector for error elements
   */
  errorSelector?: string;
}

interface FocusManagementReturn {
  /**
   * Ref to attach to the container element
   */
  containerRef: React.RefObject<HTMLDivElement>;
  /**
   * Focus the first error field
   */
  focusFirstError: () => boolean;
  /**
   * Focus the first focusable element
   */
  focusFirst: () => boolean;
  /**
   * Focus a specific element by selector
   */
  focusElement: (selector: string) => boolean;
  /**
   * Focus the next focusable element
   */
  focusNext: () => boolean;
  /**
   * Focus the previous focusable element
   */
  focusPrevious: () => boolean;
  /**
   * Handle keyboard navigation
   */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /**
   * Get all focusable elements within the container
   */
  getFocusableElements: () => HTMLElement[];
  /**
   * Check if an element is focusable
   */
  isFocusable: (element: HTMLElement) => boolean;
}

/**
 * Hook for managing focus within a form or component
 * Provides keyboard navigation, error focus, and accessibility features
 */
export const useFocusManagement = (options: FocusManagementOptions = {}): FocusManagementReturn => {
  const {
    focusOnError = true,
    restoreFocus = true,
    firstFocusableSelector = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
    errorSelector = '[aria-invalid="true"], .border-destructive, [role="alert"]'
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Store the last focused element
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        lastFocusedRef.current = event.target as HTMLElement;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('focusin', handleFocusIn);
      return () => container.removeEventListener('focusin', handleFocusIn);
    }
  }, []);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus && lastFocusedRef.current) {
        lastFocusedRef.current.focus();
      }
    };
  }, [restoreFocus]);

  /**
   * Check if an element is focusable
   */
  const isFocusable = useCallback((element: HTMLElement): boolean => {
    if (!element || element.offsetParent === null) return false;
    
    const tagName = element.tagName.toLowerCase();
    const tabIndex = element.getAttribute('tabindex');
    
    // Elements that are naturally focusable
    if (['input', 'textarea', 'select', 'button', 'a'].includes(tagName)) {
      return !element.disabled;
    }
    
    // Elements with tabindex
    if (tabIndex !== null) {
      return tabIndex !== '-1';
    }
    
    return false;
  }, []);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const elements = Array.from(
      containerRef.current.querySelectorAll(firstFocusableSelector)
    ) as HTMLElement[];
    
    return elements.filter(isFocusable);
  }, [firstFocusableSelector, isFocusable]);

  /**
   * Focus the first error field
   */
  const focusFirstError = useCallback((): boolean => {
    if (!containerRef.current) return false;
    
    const errorElements = Array.from(
      containerRef.current.querySelectorAll(errorSelector)
    ) as HTMLElement[];
    
    // Find the first focusable error element
    for (const element of errorElements) {
      if (isFocusable(element)) {
        element.focus();
        return true;
      }
      
      // Look for focusable elements within the error element
      const focusableChild = element.querySelector(firstFocusableSelector) as HTMLElement;
      if (focusableChild && isFocusable(focusableChild)) {
        focusableChild.focus();
        return true;
      }
    }
    
    return false;
  }, [errorSelector, firstFocusableSelector, isFocusable]);

  /**
   * Focus the first focusable element
   */
  const focusFirst = useCallback((): boolean => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }, [getFocusableElements]);

  /**
   * Focus a specific element by selector
   */
  const focusElement = useCallback((selector: string): boolean => {
    if (!containerRef.current) return false;
    
    const element = containerRef.current.querySelector(selector) as HTMLElement;
    if (element && isFocusable(element)) {
      element.focus();
      return true;
    }
    return false;
  }, [isFocusable]);

  /**
   * Focus the next focusable element
   */
  const focusNext = useCallback((): boolean => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
      return true;
    }
    
    return false;
  }, [getFocusableElements]);

  /**
   * Focus the previous focusable element
   */
  const focusPrevious = useCallback((): boolean => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
      return true;
    }
    
    return false;
  }, [getFocusableElements]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const { key, ctrlKey, metaKey } = event;
    
    // Tab navigation (default browser behavior)
    if (key === 'Tab') {
      return; // Let browser handle default tab behavior
    }
    
    // Arrow key navigation
    if (key === 'ArrowDown') {
      event.preventDefault();
      focusNext();
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      focusPrevious();
    }
    
    // Home/End navigation
    if (key === 'Home') {
      event.preventDefault();
      focusFirst();
    } else if (key === 'End') {
      event.preventDefault();
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus();
      }
    }
    
    // Escape key - focus first element
    if (key === 'Escape') {
      event.preventDefault();
      focusFirst();
    }
    
    // Ctrl/Cmd + Enter - submit form
    if ((ctrlKey || metaKey) && key === 'Enter') {
      event.preventDefault();
      const submitButton = containerRef.current?.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
      }
    }
  }, [focusNext, focusPrevious, focusFirst, getFocusableElements]);

  return {
    containerRef,
    focusFirstError,
    focusFirst,
    focusElement,
    focusNext,
    focusPrevious,
    handleKeyDown,
    getFocusableElements,
    isFocusable
  };
};

export default useFocusManagement;
