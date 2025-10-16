# Accessibility Testing - GoalsGuild QuestBound Forge

## Overview

This document provides comprehensive information about accessibility testing in the GoalsGuild QuestBound Forge application. The application implements WCAG 2.1 AA compliance standards and includes comprehensive accessibility features for users with disabilities.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Accessibility Features](#accessibility-features)
3. [Testing Tools](#testing-tools)
4. [Running Tests](#running-tests)
5. [Common Issues](#common-issues)
6. [Best Practices](#best-practices)
7. [Resources](#resources)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Screen reader software (optional but recommended)

### Installation

No additional installation required. Accessibility testing tools are included in the project.

### Running Tests

```bash
# Run all accessibility tests
npm run test:accessibility

# Run tests in watch mode
npm run test:accessibility:watch

# Run tests for CI/CD
npm run test:accessibility:ci

# Generate report only
npm run test:accessibility:report
```

### Accessing Test Page

In development mode, visit: `http://localhost:3000/accessibility-test`

## Accessibility Features

### 1. ARIA Live Regions

Real-time announcements for dynamic content changes:

```typescript
// ARIALiveRegion component
<ARIALiveRegion 
  message="" 
  priority="polite" 
  className="sr-only"
/>

// Usage in components
const { announce } = useAccessibility();
announce('Guild created successfully!', { priority: 'polite' });
```

### 2. Focus Management

Comprehensive keyboard navigation and focus handling:

```typescript
// useFocusManagement hook
const {
  containerRef,
  focusFirstError,
  focusFirst,
  handleKeyDown
} = useFocusManagement({
  focusOnError: true,
  restoreFocus: true
});
```

### 3. Form Accessibility

All forms include proper labeling, error handling, and validation:

```typescript
// Form structure
<form
  role="form"
  aria-labelledby="form-title"
  aria-describedby="form-description"
  noValidate
>
  <Input
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? `error-name-${id}` : undefined}
  />
  {errors.name && (
    <p id={`error-name-${id}`} className="text-xs text-red-600 mt-1" role="alert">
      {errors.name}
    </p>
  )}
</form>
```

### 4. Button and Interactive Element Accessibility

All interactive elements are keyboard accessible and screen reader friendly:

```typescript
// Accessible button
<Button
  aria-label={`${translations?.details?.actions?.join || 'Join'} ${guild.name}`}
  aria-describedby={isLoading ? `join-loading-${guild.guildId}` : undefined}
  disabled={isLoading}
>
  {actionLoading === 'join' ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden="true" />
      <span id={`join-loading-${guild.guildId}`} className="sr-only">Joining guild...</span>
    </>
  ) : (
    <UserPlus className="h-4 w-4 mr-1" aria-hidden="true" />
  )}
  {translations?.details?.actions?.join || 'Join'}
</Button>
```

### 5. Card and Content Accessibility

Content cards and containers are accessible to screen readers:

```typescript
// Accessible card
<Card
  role="button"
  aria-label={`${translations?.details?.actions?.viewProfile || 'View guild'} ${guild.name}. ${guild.memberCount} members, ${guild.goalCount} goals, ${guild.questCount} quests. ${guild.guildType} guild.`}
  aria-describedby={`guild-${guild.guildId}-description`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleGuildClick();
    }
  }}
>
  <h3 id={`guild-${guild.guildId}-title`}>{guild.name}</h3>
  <p id={`guild-${guild.guildId}-description`}>{guild.description}</p>
</Card>
```

### 6. Icon and Visual Element Accessibility

Icons and visual elements don't interfere with screen readers:

```typescript
// Semantic icons
<Crown 
  className="h-4 w-4 text-yellow-500 flex-shrink-0" 
  aria-label="Owner"
  role="img"
/>

// Decorative icons
<Users className="h-4 w-4" aria-hidden="true" />
```

### 7. List and Group Accessibility

Lists and grouped content are accessible to screen readers:

```typescript
// Accessible list
<div 
  className="flex flex-wrap gap-1" 
  role="group" 
  aria-label={`Guild tags: ${displayTags.join(', ')}${remainingCount > 0 ? ` and ${remainingCount} more` : ''}`}
>
  {displayTags.map((tag) => (
    <Badge key={tag} variant="secondary" className="text-xs" role="text">
      {tag}
    </Badge>
  ))}
</div>
```

### 8. Modal and Dialog Accessibility

Modals and dialogs are accessible to all users:

```typescript
// Accessible modal
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    role="dialog"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <DialogTitle id="modal-title">Create Guild</DialogTitle>
    <DialogDescription id="modal-description">
      Build a community around shared goals and interests
    </DialogDescription>
  </DialogContent>
</Dialog>
```

### 9. Error Handling and Validation

Clear, accessible error messages and validation feedback:

```typescript
// Error announcement
if (Object.keys(newErrors).length > 0) {
  setHasValidationErrors(true);
  announce(FormAnnouncements.validationError('form'), 'assertive');
}

// Field-level error display
<input
  aria-invalid={!!errors.fieldName}
  aria-describedby={errors.fieldName ? `error-fieldName-${id}` : undefined}
  className={errors.fieldName ? 'border-red-500' : 'border-gray-300'}
/>
{errors.fieldName && (
  <p id={`error-fieldName-${id}`} className="text-xs text-red-600 mt-1" role="alert">
    {errors.fieldName}
  </p>
)}
```

### 10. Internationalization and Accessibility

Accessibility features work across all supported languages:

```typescript
// Translation-aware accessibility
const { t } = useTranslation();
const guildTranslations = (t as any)?.guild;

// Accessible button with translations
<Button
  aria-label={`${guildTranslations?.details?.actions?.join || 'Join'} ${guild.name}`}
>
  {guildTranslations?.details?.actions?.join || 'Join'}
</Button>
```

## Testing Tools

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

### Browser Extensions

- **axe-core**: Comprehensive accessibility testing
- **WAVE**: Web Accessibility Evaluator
- **Lighthouse**: Built-in Chrome accessibility audit

### Screen Readers

- **NVDA**: Free screen reader for Windows
- **JAWS**: Professional screen reader for Windows
- **VoiceOver**: Built-in screen reader for macOS
- **Narrator**: Built-in screen reader for Windows

### Color Contrast Tools

- **WebAIM Color Contrast Checker**: Online color contrast testing tool
- **Colour Contrast Analyser**: Desktop application for color contrast testing
- **Chrome DevTools**: Built-in color picker with contrast ratios

## Running Tests

### Automated Testing

```bash
# Run all accessibility tests
npm run test:accessibility

# Run tests in watch mode
npm run test:accessibility:watch

# Run tests for CI/CD
npm run test:accessibility:ci

# Generate report only
npm run test:accessibility:report
```

### Manual Testing

1. **Keyboard Navigation:**
   - Use Tab to navigate through interactive elements
   - Use Shift+Tab to navigate backwards
   - Use Enter and Space to activate buttons
   - Use Arrow keys in lists and menus
   - Use Escape to close modals and dropdowns

2. **Screen Reader Testing:**
   - Test with NVDA, JAWS, VoiceOver, or Narrator
   - Navigate through the page using screen reader commands
   - Verify all content is announced correctly
   - Check that form labels are associated with inputs

3. **Visual Testing:**
   - Test at 200% zoom level
   - Test with high contrast mode enabled
   - Test with different color vision deficiencies
   - Verify focus indicators are visible

### Component Testing

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

### Hook Testing

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

## Common Issues

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

## Resources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Resources](https://webaim.org/)

### Tools

- [axe-core](https://github.com/dequelabs/axe-core)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Testing

- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Testing Guide](https://webaim.org/articles/keyboard/)
- [Mobile Accessibility Testing](https://webaim.org/articles/mobile/)

### Community

- [WebAIM Community](https://webaim.org/community/)
- [A11y Project](https://www.a11yproject.com/)
- [Accessibility Developer Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Conclusion

The GoalsGuild QuestBound Forge application implements comprehensive accessibility features to ensure an inclusive user experience. By following WCAG 2.1 AA guidelines and implementing proper ARIA attributes, focus management, and screen reader support, the application is accessible to users with various disabilities.

Regular testing and validation ensure that accessibility features continue to work correctly as the application evolves. The combination of automated testing tools and manual testing provides comprehensive coverage of accessibility requirements.

For more information, refer to the [WCAG 2.1 guidelines](https://www.w3.org/WAI/WCAG21/quickref/) and other accessibility resources mentioned in this guide.

