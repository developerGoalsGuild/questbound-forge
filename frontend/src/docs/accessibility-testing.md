# Accessibility Testing Guide

## Overview

This guide provides comprehensive information about accessibility testing in the GoalsGuild QuestBound Forge application. It covers automated testing, manual testing, tools, and best practices for ensuring the application is accessible to all users.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Automated Testing](#automated-testing)
3. [Manual Testing](#manual-testing)
4. [Testing Tools](#testing-tools)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [Best Practices](#best-practices)
7. [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Screen reader software (optional but recommended)
- Accessibility testing browser extensions

### Installation

The accessibility testing tools are included in the project dependencies. No additional installation is required.

### Quick Start

1. **Run the development server:**
   ```bash
   npm run dev
   ```

2. **Open the accessibility test page:**
   ```
   http://localhost:3000/accessibility-test
   ```

3. **Run automated tests:**
   - Click "Run Tests" button
   - Review the results
   - Download the report if needed

## Automated Testing

### Built-in Test Suite

The application includes a comprehensive automated testing suite that checks for:

- **Heading Hierarchy**: Ensures proper heading structure (h1 → h2 → h3, etc.)
- **Image Alt Text**: Verifies all images have appropriate alt text
- **Form Labels**: Checks that all form inputs have associated labels
- **ARIA Live Regions**: Validates ARIA live regions for dynamic content
- **Focus Management**: Tests keyboard focus and navigation
- **Color Contrast**: Checks color contrast ratios for readability
- **Keyboard Navigation**: Ensures all interactive elements are keyboard accessible
- **Button Accessibility**: Validates button labels and accessibility
- **Modal Accessibility**: Checks modal dialog accessibility
- **Error Handling**: Verifies error messages are properly announced
- **Internationalization**: Tests translation and localization support
- **Semantic HTML**: Validates use of semantic HTML elements
- **ARIA Attributes**: Checks ARIA attribute usage and validity
- **List Accessibility**: Ensures proper list structure and accessibility
- **Icon Accessibility**: Validates icon accessibility attributes
- **Content Structure**: Checks overall content structure and organization

### Running Tests

#### Programmatic Testing

```typescript
import { useAccessibilityTesting } from '@/hooks/useAccessibilityTesting';

const MyComponent = () => {
  const { runTests, report, isRunning } = useAccessibilityTesting();
  
  const handleRunTests = async () => {
    await runTests();
    console.log('Test results:', report);
  };
  
  return (
    <button onClick={handleRunTests} disabled={isRunning}>
      {isRunning ? 'Running Tests...' : 'Run Tests'}
    </button>
  );
};
```

#### Console Testing

```javascript
// In browser console
const tester = new AccessibilityTester();
tester.runAllTests().then(report => {
  console.log(tester.generateReport(report));
});
```

#### Component Testing

```typescript
import { AccessibilityTest } from '@/components/ui/accessibility-test';

const MyPage = () => {
  return (
    <div>
      {/* Your page content */}
      <AccessibilityTest />
    </div>
  );
};
```

### Test Configuration

Tests can be configured using the accessibility configuration:

```typescript
import { defaultAccessibilityConfig } from '@/config/accessibility';

// Customize test settings
const config = {
  ...defaultAccessibilityConfig,
  testCategories: {
    ...defaultAccessibilityConfig.testCategories,
    colorContrast: false, // Disable color contrast testing
  },
  thresholds: {
    minScore: 90, // Require 90% score
    maxFailures: 0,
    maxWarnings: 3,
  },
};
```

## Manual Testing

### Keyboard Navigation Testing

1. **Tab Navigation:**
   - Use Tab to navigate through interactive elements
   - Use Shift+Tab to navigate backwards
   - Ensure focus indicators are visible
   - Verify logical tab order

2. **Keyboard Activation:**
   - Use Enter and Space to activate buttons
   - Use Arrow keys in lists and menus
   - Use Escape to close modals and dropdowns
   - Test all interactive elements

3. **Focus Management:**
   - Verify focus is trapped in modals
   - Check focus restoration after modal close
   - Ensure focus moves logically through forms

### Screen Reader Testing

#### NVDA (Windows)

1. **Installation:**
   - Download from [NVDA website](https://www.nvaccess.org/)
   - Install and start the application

2. **Testing:**
   - Navigate through the page using arrow keys
   - Use Tab to move between interactive elements
   - Listen for proper announcements
   - Check that all content is accessible

#### VoiceOver (macOS)

1. **Activation:**
   - Press Cmd+F5 to enable VoiceOver
   - Use VoiceOver Utility to customize settings

2. **Testing:**
   - Use VO+Arrow keys to navigate
   - Use VO+Space to activate elements
   - Check rotor navigation (VO+U)
   - Verify proper announcements

#### JAWS (Windows)

1. **Installation:**
   - Download from [Freedom Scientific](https://www.freedomscientific.com/)
   - Install and configure

2. **Testing:**
   - Use Tab and Shift+Tab for navigation
   - Use Enter and Space for activation
   - Check that all content is announced
   - Verify proper form navigation

### Visual Testing

1. **Color Contrast:**
   - Use WebAIM Color Contrast Checker
   - Test with different color vision deficiencies
   - Verify 4.5:1 contrast ratio for normal text
   - Check 3:1 contrast ratio for large text

2. **Zoom Testing:**
   - Test at 200% zoom level
   - Verify content remains usable
   - Check that horizontal scrolling is not required
   - Ensure all functionality is accessible

3. **High Contrast Mode:**
   - Enable high contrast mode in Windows
   - Test with high contrast themes
   - Verify all content is visible
   - Check that functionality is preserved

## Testing Tools

### Browser Extensions

#### axe-core

- **Installation:** Chrome Web Store, Firefox Add-ons
- **Usage:** Click the axe icon in browser toolbar
- **Features:** Comprehensive accessibility testing, detailed reports
- **Best for:** Automated testing, CI/CD integration

#### WAVE

- **Installation:** Chrome Web Store, Firefox Add-ons
- **Usage:** Click the WAVE icon in browser toolbar
- **Features:** Visual accessibility indicators, detailed explanations
- **Best for:** Visual testing, learning accessibility concepts

#### Lighthouse

- **Installation:** Built into Chrome DevTools
- **Usage:** Open DevTools → Lighthouse tab
- **Features:** Performance and accessibility audits
- **Best for:** Overall page quality assessment

### Desktop Applications

#### Colour Contrast Analyser

- **Platform:** Windows, macOS
- **Usage:** Point and click to test color combinations
- **Features:** Real-time contrast ratio calculation
- **Best for:** Color contrast testing

#### NVDA

- **Platform:** Windows
- **Usage:** Free screen reader for testing
- **Features:** Full screen reader functionality
- **Best for:** Screen reader testing

### Online Tools

#### WebAIM Color Contrast Checker

- **URL:** https://webaim.org/resources/contrastchecker/
- **Usage:** Enter color codes or use color picker
- **Features:** WCAG compliance checking
- **Best for:** Quick color contrast validation

#### WAVE Web Accessibility Evaluator

- **URL:** https://wave.webaim.org/
- **Usage:** Enter URL or upload HTML file
- **Features:** Comprehensive accessibility analysis
- **Best for:** Detailed accessibility reports

## Common Issues and Solutions

### Missing Alt Text

**Problem:** Images without alt text
**Solution:** Add alt text or mark as decorative
```html
<!-- Good -->
<img src="logo.png" alt="Company Logo" />

<!-- Decorative image -->
<img src="decoration.png" alt="" role="presentation" />
```

### Poor Focus Management

**Problem:** Focus not managed properly in modals
**Solution:** Use focus management hooks
```typescript
const { focusFirst, focusLast } = useFocusManagement();

useEffect(() => {
  if (isOpen) {
    focusFirst(modalRef);
  }
}, [isOpen, focusFirst]);
```

### Missing Form Labels

**Problem:** Form inputs without labels
**Solution:** Associate labels with inputs
```html
<!-- Good -->
<label htmlFor="email">Email</label>
<input id="email" />

<!-- Or use aria-label -->
<input aria-label="Email address" />
```

### Inaccessible Error Messages

**Problem:** Error messages not announced to screen readers
**Solution:** Use role="alert" for error messages
```html
<p role="alert">Please enter a valid email address</p>
```

### Poor Color Contrast

**Problem:** Text and background colors lack sufficient contrast
**Solution:** Use color contrast checker and adjust colors
```css
/* Ensure 4.5:1 contrast ratio for normal text */
.text-primary {
  color: #000000; /* Black text */
  background-color: #ffffff; /* White background */
}
```

### Missing ARIA Labels

**Problem:** Interactive elements without accessible names
**Solution:** Add aria-label, aria-labelledby, or visible text
```html
<button aria-label="Close dialog">×</button>
```

## Best Practices

### Development

1. **Test Early and Often:**
   - Run accessibility tests during development
   - Include accessibility in code reviews
   - Test with real users when possible

2. **Use Semantic HTML:**
   - Prefer semantic elements over divs
   - Use proper heading hierarchy
   - Structure content logically

3. **Implement ARIA Correctly:**
   - Use ARIA attributes only when necessary
   - Ensure ARIA attributes are valid
   - Test with screen readers

4. **Design for Accessibility:**
   - Ensure sufficient color contrast
   - Design for different screen sizes
   - Provide multiple ways to access content

### Testing

1. **Test with Real Users:**
   - Include users with disabilities in testing
   - Test with different assistive technologies
   - Gather feedback on usability

2. **Test Across Browsers:**
   - Test in different browsers
   - Verify cross-browser compatibility
   - Check for browser-specific issues

3. **Test with Different Devices:**
   - Test on mobile devices
   - Test with different screen sizes
   - Verify touch accessibility

### Maintenance

1. **Regular Testing:**
   - Run accessibility tests regularly
   - Update tests when adding new features
   - Monitor for regressions

2. **Stay Updated:**
   - Keep up with accessibility standards
   - Update testing tools regularly
   - Learn about new accessibility features

## WCAG 2.1 AA Compliance

### Perceivable

- **Text Alternatives:** All images have alt text
- **Captions:** Audio content has captions
- **Adaptable:** Content can be presented in different ways
- **Distinguishable:** Text and images are distinguishable

### Operable

- **Keyboard Accessible:** All functionality is keyboard accessible
- **No Seizures:** Content doesn't cause seizures
- **Navigable:** Users can navigate and find content
- **Input Modalities:** Users can interact with content

### Understandable

- **Readable:** Text is readable and understandable
- **Predictable:** Content appears and operates predictably
- **Input Assistance:** Users can avoid and correct mistakes

### Robust

- **Compatible:** Content is compatible with assistive technologies
- **Valid:** HTML is valid and well-formed
- **Future-proof:** Content works with future technologies

## Troubleshooting

### Common Problems

1. **Tests Not Running:**
   - Check browser console for errors
   - Verify all dependencies are installed
   - Ensure you're in development mode

2. **False Positives:**
   - Review test configuration
   - Check for edge cases
   - Update test logic if needed

3. **Missing Issues:**
   - Run manual testing
   - Use different testing tools
   - Check for dynamic content

### Getting Help

1. **Documentation:**
   - Check this guide for common issues
   - Review WCAG 2.1 guidelines
   - Consult accessibility resources

2. **Community:**
   - Ask questions in accessibility forums
   - Join accessibility communities
   - Share knowledge with others

3. **Professional Help:**
   - Consult accessibility experts
   - Hire accessibility consultants
   - Attend accessibility conferences

## Conclusion

Accessibility testing is an ongoing process that requires both automated and manual testing. By following the guidelines in this document, you can ensure that the GoalsGuild QuestBound Forge application is accessible to all users.

Remember that accessibility is not just about compliance—it's about creating an inclusive experience that works for everyone. Regular testing, user feedback, and continuous improvement are key to maintaining accessibility standards.

For more information, refer to the [WCAG 2.1 guidelines](https://www.w3.org/WAI/WCAG21/quickref/) and other accessibility resources mentioned in this guide.

