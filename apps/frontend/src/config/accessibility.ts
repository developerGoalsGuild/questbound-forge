/**
 * Accessibility Configuration
 * 
 * Configuration settings for accessibility testing and validation.
 */

export interface AccessibilityConfig {
  // Test settings
  autoRunTests: boolean;
  testInterval: number; // in milliseconds
  maxTestRetries: number;
  
  // Test categories to run
  testCategories: {
    headingHierarchy: boolean;
    imageAltText: boolean;
    formLabels: boolean;
    ariaLiveRegions: boolean;
    focusManagement: boolean;
    colorContrast: boolean;
    keyboardNavigation: boolean;
    buttonAccessibility: boolean;
    modalAccessibility: boolean;
    errorHandling: boolean;
    internationalization: boolean;
    semanticHTML: boolean;
    ariaAttributes: boolean;
    listAccessibility: boolean;
    iconAccessibility: boolean;
    contentStructure: boolean;
  };
  
  // Thresholds for test results
  thresholds: {
    minScore: number; // minimum acceptable score (0-100)
    maxFailures: number; // maximum acceptable failures
    maxWarnings: number; // maximum acceptable warnings
  };
  
  // Reporting settings
  reporting: {
    includeRecommendations: boolean;
    includeElementReferences: boolean;
    includeScreenshots: boolean;
    exportFormats: ('txt' | 'json' | 'csv')[];
  };
  
  // Development settings
  development: {
    showTestResults: boolean;
    highlightIssues: boolean;
    autoFixSuggestions: boolean;
  };
}

export const defaultAccessibilityConfig: AccessibilityConfig = {
  autoRunTests: process.env.NODE_ENV === 'development',
  testInterval: 30000, // 30 seconds
  maxTestRetries: 3,
  
  testCategories: {
    headingHierarchy: true,
    imageAltText: true,
    formLabels: true,
    ariaLiveRegions: true,
    focusManagement: true,
    colorContrast: true,
    keyboardNavigation: true,
    buttonAccessibility: true,
    modalAccessibility: true,
    errorHandling: true,
    internationalization: true,
    semanticHTML: true,
    ariaAttributes: true,
    listAccessibility: true,
    iconAccessibility: true,
    contentStructure: true,
  },
  
  thresholds: {
    minScore: 80,
    maxFailures: 0,
    maxWarnings: 5,
  },
  
  reporting: {
    includeRecommendations: true,
    includeElementReferences: true,
    includeScreenshots: false,
    exportFormats: ['txt', 'json'],
  },
  
  development: {
    showTestResults: true,
    highlightIssues: true,
    autoFixSuggestions: false,
  },
};

// Test category descriptions
export const testCategoryDescriptions: Record<keyof AccessibilityConfig['testCategories'], string> = {
  headingHierarchy: 'Ensures proper heading structure (h1 → h2 → h3, etc.)',
  imageAltText: 'Verifies all images have appropriate alt text',
  formLabels: 'Checks that all form inputs have associated labels',
  ariaLiveRegions: 'Validates ARIA live regions for dynamic content',
  focusManagement: 'Tests keyboard focus and navigation',
  colorContrast: 'Checks color contrast ratios for readability',
  keyboardNavigation: 'Ensures all interactive elements are keyboard accessible',
  buttonAccessibility: 'Validates button labels and accessibility',
  modalAccessibility: 'Checks modal dialog accessibility',
  errorHandling: 'Verifies error messages are properly announced',
  internationalization: 'Tests translation and localization support',
  semanticHTML: 'Validates use of semantic HTML elements',
  ariaAttributes: 'Checks ARIA attribute usage and validity',
  listAccessibility: 'Ensures proper list structure and accessibility',
  iconAccessibility: 'Validates icon accessibility attributes',
  contentStructure: 'Checks overall content structure and organization',
};

// WCAG 2.1 AA compliance checklist
export const wcagChecklist = {
  perceivable: [
    'All images have alt text or are marked as decorative',
    'Color is not the only means of conveying information',
    'Text has sufficient color contrast (4.5:1 for normal text)',
    'Content can be resized up to 200% without loss of functionality',
    'Audio content has captions or transcripts',
  ],
  operable: [
    'All functionality is available via keyboard',
    'No content flashes more than 3 times per second',
    'Users can pause, stop, or hide moving content',
    'Focus indicators are visible and clear',
    'Navigation is consistent and predictable',
  ],
  understandable: [
    'Language is clear and simple',
    'Form labels and instructions are clear',
    'Error messages are helpful and specific',
    'Content appears and operates predictably',
    'Users can avoid and correct mistakes',
  ],
  robust: [
    'HTML is valid and well-formed',
    'ARIA attributes are used correctly',
    'Content works with assistive technologies',
    'Code follows web standards',
    'Future compatibility is maintained',
  ],
};

// Common accessibility issues and solutions
export const commonIssues = {
  missingAltText: {
    description: 'Images without alt text',
    solution: 'Add alt text or mark as decorative with role="presentation"',
    example: '<img src="logo.png" alt="Company Logo" />',
  },
  poorFocusManagement: {
    description: 'Focus not managed properly in modals',
    solution: 'Use focus management hooks and trap focus within modals',
    example: 'const { focusFirst, focusLast } = useFocusManagement();',
  },
  missingFormLabels: {
    description: 'Form inputs without labels',
    solution: 'Associate labels with inputs using for/id or aria-label',
    example: '<label htmlFor="email">Email</label><input id="email" />',
  },
  inaccessibleErrorMessages: {
    description: 'Error messages not announced to screen readers',
    solution: 'Use role="alert" for error messages',
    example: '<p role="alert">Please enter a valid email address</p>',
  },
  poorColorContrast: {
    description: 'Text and background colors lack sufficient contrast',
    solution: 'Use color contrast checker and adjust colors',
    example: 'Ensure 4.5:1 contrast ratio for normal text',
  },
  missingAriaLabels: {
    description: 'Interactive elements without accessible names',
    solution: 'Add aria-label, aria-labelledby, or visible text',
    example: '<button aria-label="Close dialog">×</button>',
  },
  improperHeadingHierarchy: {
    description: 'Headings not in logical order',
    solution: 'Use proper heading hierarchy (h1 → h2 → h3)',
    example: '<h1>Page Title</h1><h2>Section Title</h2>',
  },
  missingLiveRegions: {
    description: 'Dynamic content changes not announced',
    solution: 'Use ARIA live regions for dynamic content',
    example: '<div aria-live="polite">Status updates</div>',
  },
};

// Accessibility testing tools and resources
export const testingTools = {
  browserExtensions: [
    {
      name: 'axe-core',
      description: 'Comprehensive accessibility testing',
      url: 'https://www.deque.com/axe/',
      browsers: ['Chrome', 'Firefox', 'Edge'],
    },
    {
      name: 'WAVE',
      description: 'Web Accessibility Evaluator',
      url: 'https://wave.webaim.org/',
      browsers: ['Chrome', 'Firefox', 'Edge'],
    },
    {
      name: 'Lighthouse',
      description: 'Built-in Chrome accessibility audit',
      url: 'https://developers.google.com/web/tools/lighthouse',
      browsers: ['Chrome'],
    },
  ],
  screenReaders: [
    {
      name: 'NVDA',
      description: 'Free screen reader for Windows',
      url: 'https://www.nvaccess.org/',
      platforms: ['Windows'],
    },
    {
      name: 'JAWS',
      description: 'Professional screen reader for Windows',
      url: 'https://www.freedomscientific.com/products/software/jaws/',
      platforms: ['Windows'],
    },
    {
      name: 'VoiceOver',
      description: 'Built-in screen reader for macOS',
      url: 'https://www.apple.com/accessibility/vision/',
      platforms: ['macOS'],
    },
    {
      name: 'Narrator',
      description: 'Built-in screen reader for Windows',
      url: 'https://support.microsoft.com/en-us/windows/complete-guide-to-narrator-e4397a0d-ef4f-b386-d8ae-c172f109bdb1',
      platforms: ['Windows'],
    },
  ],
  colorContrast: [
    {
      name: 'WebAIM Color Contrast Checker',
      description: 'Online color contrast testing tool',
      url: 'https://webaim.org/resources/contrastchecker/',
    },
    {
      name: 'Colour Contrast Analyser',
      description: 'Desktop application for color contrast testing',
      url: 'https://www.tpgi.com/color-contrast-checker/',
    },
    {
      name: 'Chrome DevTools',
      description: 'Built-in color picker with contrast ratios',
      url: 'https://developers.google.com/web/tools/chrome-devtools',
    },
  ],
  keyboardTesting: [
    {
      name: 'Keyboard Navigation Test',
      description: 'Test keyboard navigation manually',
      steps: [
        'Use Tab to navigate through interactive elements',
        'Use Shift+Tab to navigate backwards',
        'Use Enter and Space to activate buttons',
        'Use Arrow keys in lists and menus',
        'Use Escape to close modals and dropdowns',
      ],
    },
  ],
};

// Accessibility testing best practices
export const bestPractices = {
  testing: [
    'Test with actual screen readers, not just automated tools',
    'Test keyboard navigation without a mouse',
    'Test with different zoom levels (up to 200%)',
    'Test with high contrast mode enabled',
    'Test with reduced motion preferences',
    'Test with different color vision deficiencies',
  ],
  development: [
    'Use semantic HTML elements whenever possible',
    'Add ARIA attributes only when necessary',
    'Test accessibility features during development',
    'Include accessibility in code reviews',
    'Document accessibility requirements',
    'Train team members on accessibility best practices',
  ],
  design: [
    'Ensure sufficient color contrast ratios',
    'Design for different screen sizes and orientations',
    'Provide multiple ways to access content',
    'Use clear, simple language',
    'Design consistent navigation patterns',
    'Consider users with different abilities',
  ],
};

export default defaultAccessibilityConfig;

