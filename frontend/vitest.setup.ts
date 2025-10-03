// vitest.setup.ts
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Ensure JSDOM is reset between tests
afterEach(() => {
  cleanup();
});

// Mock common UI components that might cause issues in tests
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', {
      role: 'progressbar',
      'aria-valuenow': value,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      className: className,
      ...props
    });
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: (props: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'sonner-toaster', ...props });
  },
}));

// Mock TooltipProvider
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tooltip-provider' }, children);
  },
  Tooltip: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tooltip' }, children);
  },
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tooltip-trigger' }, children);
  },
  TooltipContent: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tooltip-content' }, children);
  },
}));

// Mock useTranslation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => {
      // Mock translations for GoalCategorySelector tests
      const mockTranslations: any = {
        goals: {
          fields: {
            category: 'Category'
          },
          hints: {
            fields: {
              category: 'Choose a category that best fits your goal'
            },
            iconLabel: 'More information about {field}',
            questions: {
              positive: 'Focus on what you want to achieve, not what you want to avoid.',
              specific: 'Include details about when, where, and how this will happen.',
              evidence: 'Describe measurable outcomes or observable changes.',
              resources: 'Consider both internal resources (skills, time) and external ones (tools, support).',
              obstacles: 'Think about potential challenges and how you might overcome them.',
              ecology: 'Ensure this goal aligns with your values and doesn\'t harm others.',
              timeline: 'Be specific about timing, location, and people involved.',
              firstStep: 'Identify the very first action you can take toward this goal.'
            }
          },
          questions: {
            positive: 'State your goal positively',
            specific: 'Make it specific and context-bound',
            evidence: 'How will you know you achieved it?',
            resources: 'What resources do you have/need?',
            obstacles: 'What obstacles might arise?',
            ecology: 'Is this ecological for you and others?',
            timeline: 'When, where, with whom will this happen?',
            firstStep: 'What is your immediate first step?'
          },
          section: {
            nlpQuestions: 'Well-formed Outcome (NLP)',
            nlpSubtitle: 'Answer these questions to clarify and strengthen your goal.'
          }
        },
        goalCreation: {
          title: 'Create New Goal',
          subtitle: 'Set up a new goal with detailed planning',
          sections: {
            basicInfo: 'Basic Information',
            nlpQuestions: 'Well-formed Outcome (NLP)',
            nlpSubtitle: 'Answer these questions to clarify and strengthen your goal.',
            aiFeatures: 'AI-Powered Features',
            aiSubtitle: 'Get inspiration and suggestions for your goal.'
          },
          fields: {
            title: 'Title',
            description: 'Description',
            deadline: 'Deadline',
            category: 'Category'
          },
          placeholders: {
            title: 'Enter your goal title',
            description: 'Describe your goal in detail'
          },
          hints: {
            title: 'Enter a clear, concise title for your goal',
            description: 'Provide detailed information about what you want to achieve',
            iconLabel: 'More information about {field}'
          },
          actions: {
            backToGoals: 'Back to Goals',
            generateImage: 'Generate Image',
            suggestImprovements: 'Suggest Improvements',
            reset: 'Reset Form',
            cancel: 'Cancel',
            submit: 'Create Goal'
          },
          messages: {
            aiImageFailed: 'AI image generation failed',
            aiSuggestFailed: 'AI suggestions failed'
          },
          aiResults: {
            imageTitle: 'Inspirational Image',
            suggestionsTitle: 'AI Suggestions'
          }
        }
      };
      
      // Simple key resolution - return the value if found, otherwise return the key
      const keys = key.split('.');
      let value = mockTranslations;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      return value || key;
    },
  }),
  TranslationProvider: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'translation-provider' }, children);
  },
}));

// Mock API functions
vi.mock('@/lib/apiGoal', () => ({
  loadGoals: vi.fn().mockImplementation(() => Promise.resolve([])),
  deleteGoal: vi.fn().mockResolvedValue({}),
  updateGoal: vi.fn().mockResolvedValue({}),
  createGoal: vi.fn().mockResolvedValue({}),
  loadGoalsWithProgress: vi.fn().mockResolvedValue([]),
  getActiveGoalsCountForUser: vi.fn().mockResolvedValue(0),
}));

// Mock API header functions
vi.mock('@/lib/apiHeader', () => ({
  getUserProfileForHeader: vi.fn().mockRejectedValue(new Error('No authentication token found')),
  getUserInitials: vi.fn().mockReturnValue('U'),
  getUserDisplayName: vi.fn().mockReturnValue('User'),
}));

// Mock useDebouncedValidation hook
vi.mock('@/hooks/useDebouncedValidation', () => ({
  useDebouncedValidation: vi.fn(() => ({
    debouncedValidateField: vi.fn(),
    clearFieldValidation: vi.fn(),
    isFieldValidating: vi.fn(() => false),
    getFieldError: vi.fn(() => undefined),
    isFieldValid: vi.fn(() => undefined),
    isFormValid: true,
    getValidationSummary: vi.fn(() => ({ isValid: true, errors: {} }))
  })),
  registerFieldSchema: vi.fn()
}));

// Mock useFocusManagement hook
vi.mock('@/hooks/useFocusManagement', () => ({
  default: vi.fn(() => ({
    containerRef: { current: null },
    focusFirstError: vi.fn(),
    focusFirst: vi.fn(),
    handleKeyDown: vi.fn()
  }))
}));

// Mock useNetworkStatus hook
vi.mock('@/components/ui/NetworkErrorRecovery', () => ({
  default: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'network-error-recovery' }, children);
  },
  useNetworkStatus: vi.fn(() => ({
    isOnline: true,
    hasError: false,
    errorMessage: '',
    setError: vi.fn(),
    clearError: vi.fn()
  }))
}));

// Mock useARIALiveAnnouncements hook
vi.mock('@/components/ui/ARIALiveRegion', () => ({
  default: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'aria-live-region' }, children);
  },
  useARIALiveAnnouncements: vi.fn(() => ({
    announce: vi.fn(),
    clearAll: vi.fn()
  })),
  FormAnnouncements: {
    fieldSaved: (field: string) => `Field ${field} saved`,
    validationError: (field: string) => `Validation error in ${field}`,
    networkRestored: () => 'Network connection restored',
    loading: (form: string) => `${form} is loading`,
    formError: (error: string) => `Form error: ${error}`,
    formSuccess: (form: string) => `${form} submitted successfully`,
    formSubmitted: (form: string) => `${form} submitted`
  }
}));

// Mock skeleton components
vi.mock('@/components/ui/SkeletonFormField', () => ({
  SkeletonFormSection: ({ fields, showTitle }: { fields: number; showTitle: boolean }) => {
    const React = require('react');
    return React.createElement('div', { 
      'data-testid': 'skeleton-form-section',
      'data-fields': fields,
      'data-show-title': showTitle
    }, 'Skeleton Form Section');
  },
  SkeletonNLPQuestions: ({ questions }: { questions: number }) => {
    const React = require('react');
    return React.createElement('div', { 
      'data-testid': 'skeleton-nlp-questions',
      'data-questions': questions
    }, 'Skeleton NLP Questions');
  },
  SkeletonFormActions: ({ buttons }: { buttons: number }) => {
    const React = require('react');
    return React.createElement('div', { 
      'data-testid': 'skeleton-form-actions',
      'data-buttons': buttons
    }, 'Skeleton Form Actions');
  }
}));

// Mock Radix UI Select components
vi.mock('@radix-ui/react-select', () => ({
  Root: ({ children, ...props }: any) => {
    const React = require('react');
    const [value, setValue] = React.useState(props.defaultValue || props.value);

    const onValueChange = (newValue: string) => {
      setValue(newValue);
      props.onValueChange?.(newValue);
    };

    return React.createElement(
      'div',
      { 'data-testid': 'select-root', ...props },
      React.Children.map(children, (child: any) =>
        React.isValidElement(child) ? React.cloneElement(child, { onValueChange }) : child
      )
    );
  },
  Trigger: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'button',
      {
        'data-testid': 'select-trigger',
        role: 'combobox',
        'aria-expanded': 'false',
        'aria-haspopup': 'listbox',
        ...props,
      },
      children
    );
  },
  Value: ({ children, placeholder, ...props }: any) => {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'select-value', ...props }, children || placeholder);
  },
  Content: ({ children, ...props }: any) => {
    const React = require('react');
    // Pass onValueChange to children
    const childrenWithProps = React.Children.map(children, (child: any) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { onValueChange: props.onValueChange });
      }
      return child;
    });
    return React.createElement('div', { 'data-testid': 'select-content', ...props }, childrenWithProps);
  },
  Item: ({ children, value, onValueChange, ...props }: any) => {
    const React = require('react');
    const handleClick = () => {
      onValueChange?.(value);
    };
    return React.createElement('div', { 'data-testid': `select-item-${value}`, onClick: handleClick, ...props }, children);
  },
  ItemText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'select-item-text', ...props }, children);
  },
  ItemIndicator: (props: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'select-item-indicator', ...props });
  },
  Viewport: ({ children, ...props }: any) => {
    const React = require('react');
    // Pass onValueChange to children
    const childrenWithProps = React.Children.map(children, (child: any) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { onValueChange: props.onValueChange });
      }
      return child;
    });
    return React.createElement('div', { 'data-testid': 'select-viewport', ...props }, childrenWithProps);
  },
  Group: ({ children, ...props }: any) => {
    const React = require('react');
    // Pass onValueChange to children
    const childrenWithProps = React.Children.map(children, (child: any) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { onValueChange: props.onValueChange });
      }
      return child;
    });
    return React.createElement('div', { 'data-testid': 'select-group', ...props }, childrenWithProps);
  },
  ScrollUpButton: (props: any) => {
    const React = require('react');
    return React.createElement('button', { 'data-testid': 'select-scroll-up', ...props });
  },
  ScrollDownButton: (props: any) => {
    const React = require('react');
    return React.createElement('button', { 'data-testid': 'select-scroll-down', ...props });
  },
  Separator: (props: any) => {
    const React = require('react');
    return React.createElement('hr', { 'data-testid': 'select-separator', ...props });
  },
  Label: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'select-label', ...props }, children);
  },
  Icon: (props: any) => {
    const React = require('react');
    return React.createElement('svg', { 'data-testid': 'select-icon', ...props });
  },
  Portal: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', { 
      'data-testid': 'select-portal',
      ...props 
    }, children);
  },
}));

// Mock lucide-react icons dynamically to prevent memory leaks and missing icon errors
vi.mock('lucide-react', async (importOriginal) => {
  const React = require('react');
  const actual = await importOriginal();
  const MockIcon = (props: any) => React.createElement('svg', { 'aria-hidden': 'true', ...props });

  // Ensure 'actual' is an object before using Object.keys
  const iconKeys = typeof actual === 'object' && actual !== null ? Object.keys(actual as object) : [];
  const mockedIcons = iconKeys.reduce<Record<string, React.FC<any>>>((acc, key) => {
    acc[key] = MockIcon;
    return acc;
  }, {});

  return {
    ...mockedIcons,
    __esModule: true,
    default: MockIcon,
  };
});


// Add JSDOM polyfills for missing browser APIs
Object.defineProperty(Element.prototype, 'hasPointerCapture', {
  value: vi.fn().mockReturnValue(false),
});

Object.defineProperty(Element.prototype, 'setPointerCapture', {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

Object.defineProperty(Element.prototype, 'releasePointerCapture', {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

// Add polyfill for HTMLElement.scrollIntoView
if (typeof HTMLElement !== 'undefined') {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
}