# Accessibility Implementation Guide

## Overview

This document outlines the comprehensive accessibility features implemented in the GoalsGuild QuestBound Forge application, following WCAG 2.1 AA guidelines and best practices for inclusive design.

## Key Accessibility Features

### 1. ARIA Live Regions

**Purpose**: Provide real-time announcements to screen readers for dynamic content changes.

**Implementation**:
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

**Key Features**:
- Supports both `polite` and `assertive` priorities
- Automatically clears messages after announcement
- Screen reader only (hidden visually)
- Used for form submissions, navigation, and status changes

### 2. Focus Management

**Purpose**: Ensure proper keyboard navigation and focus handling throughout the application.

**Implementation**:
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

// Usage in forms
useEffect(() => {
  if (!isValid && isDirty && Object.keys(errors).length > 0) {
    focusFirstError(containerRef);
  }
}, [isValid, isDirty, errors, focusFirstError]);
```

**Key Features**:
- Automatic focus on first error in forms
- Focus restoration after modal close
- Keyboard navigation support (arrow keys, Enter, Escape)
- Focus trapping in modals and dropdowns

### 3. Form Accessibility

**Purpose**: Ensure all forms are accessible to users with disabilities.

**Implementation**:
```typescript
// Form structure
<form
  role="form"
  aria-labelledby="form-title"
  aria-describedby="form-description"
  noValidate
>
  <CardTitle id="form-title">Create Guild</CardTitle>
  <p id="form-description">Build a community around shared goals</p>
  
  <Input
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? `error-name-${id}` : undefined}
    className={errors.name ? 'border-red-500' : 'border-gray-300'}
  />
  {errors.name && (
    <p id={`error-name-${id}`} className="text-xs text-red-600 mt-1" role="alert">
      {errors.name}
    </p>
  )}
</form>
```

**Key Features**:
- Proper form labeling and descriptions
- Error announcements with `role="alert"`
- Field-level error display with ARIA attributes
- Validation error clearing on user input
- Form submission feedback

### 4. Button and Interactive Element Accessibility

**Purpose**: Ensure all interactive elements are accessible via keyboard and screen readers.

**Implementation**:
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

**Key Features**:
- Descriptive `aria-label` attributes
- Loading state announcements
- Icon hiding with `aria-hidden="true"`
- Proper disabled state handling
- Keyboard navigation support

### 5. Card and Content Accessibility

**Purpose**: Make content cards and containers accessible to screen readers.

**Implementation**:
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

**Key Features**:
- Semantic role attributes
- Comprehensive `aria-label` descriptions
- Proper heading hierarchy
- Keyboard interaction support
- Content structure for screen readers

### 6. Icon and Visual Element Accessibility

**Purpose**: Ensure icons and visual elements don't interfere with screen readers.

**Implementation**:
```typescript
// Icons with proper ARIA attributes
<Crown 
  className="h-4 w-4 text-yellow-500 flex-shrink-0" 
  aria-label="Owner"
  role="img"
/>
<Globe 
  className="h-4 w-4 text-green-500 flex-shrink-0" 
  aria-label="Public guild"
  role="img"
/>

// Decorative icons
<Users className="h-4 w-4" aria-hidden="true" />
```

**Key Features**:
- Semantic icons get `role="img"` and `aria-label`
- Decorative icons get `aria-hidden="true"`
- Proper color contrast considerations
- Consistent icon sizing

### 7. List and Group Accessibility

**Purpose**: Make lists and grouped content accessible to screen readers.

**Implementation**:
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

// Accessible stats group
<div className="flex items-center gap-4 mb-3 text-sm text-gray-600" role="group" aria-label="Guild statistics">
  <div className="flex items-center gap-1" aria-label={`${guild.memberCount} members`}>
    <Users className="h-4 w-4" aria-hidden="true" />
    <span>{guild.memberCount}</span>
  </div>
</div>
```

**Key Features**:
- `role="group"` for related content
- Descriptive `aria-label` for groups
- `role="text"` for text elements
- Proper list semantics

### 8. Modal and Dialog Accessibility

**Purpose**: Ensure modals and dialogs are accessible to all users.

**Implementation**:
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
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

**Key Features**:
- Proper ARIA attributes for dialogs
- Focus trapping within modals
- Escape key to close
- Focus restoration after close
- Screen reader announcements

### 9. Error Handling and Validation

**Purpose**: Provide clear, accessible error messages and validation feedback.

**Implementation**:
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

**Key Features**:
- Real-time error announcements
- Field-level error display
- Error clearing on user input
- Proper ARIA attributes for errors
- Screen reader friendly error messages

### 10. Internationalization and Accessibility

**Purpose**: Ensure accessibility features work across all supported languages.

**Implementation**:
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

**Key Features**:
- Translation-aware ARIA labels
- Fallback text for missing translations
- Consistent accessibility across languages
- Cultural considerations for accessibility

## Testing and Validation

### 1. Automated Testing

**Accessibility Test Component**:
```typescript
import { AccessibilityTest } from '@/components/ui/accessibility-test';

// Use in development
<AccessibilityTest />
```

**Tests Include**:
- Heading hierarchy validation
- Image alt text checking
- Form label verification
- ARIA live region detection
- Focus management testing
- Color contrast checking
- Keyboard navigation validation

### 2. Manual Testing Checklist

**Keyboard Navigation**:
- [ ] All interactive elements are reachable via Tab
- [ ] Focus indicators are visible
- [ ] Arrow keys work in lists and menus
- [ ] Enter and Space activate buttons
- [ ] Escape closes modals and dropdowns

**Screen Reader Testing**:
- [ ] All content is announced correctly
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced
- [ ] Navigation is logical and clear

**Visual Testing**:
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is readable at 200% zoom
- [ ] Focus indicators are visible
- [ ] Error states are clearly indicated
- [ ] Loading states are apparent

### 3. Browser Testing

**Supported Browsers**:
- Chrome with NVDA
- Firefox with JAWS
- Safari with VoiceOver
- Edge with Narrator

**Testing Tools**:
- axe-core browser extension
- WAVE Web Accessibility Evaluator
- Lighthouse accessibility audit
- Manual keyboard testing

## Best Practices

### 1. Semantic HTML

**Use proper HTML elements**:
```typescript
// Good
<button onClick={handleClick}>Submit</button>
<h1>Page Title</h1>
<nav>Navigation</nav>

// Avoid
<div onClick={handleClick}>Submit</div>
<div className="title">Page Title</div>
<div className="nav">Navigation</div>
```

### 2. ARIA Attributes

**Use ARIA appropriately**:
```typescript
// Good
<button aria-label="Close dialog">×</button>
<div role="alert">Error message</div>
<input aria-describedby="help-text" />

// Avoid
<button aria-label="Button">Submit</button>
<div role="alert">Success message</div>
<input aria-describedby="unrelated-id" />
```

### 3. Focus Management

**Handle focus properly**:
```typescript
// Good
useEffect(() => {
  if (isOpen) {
    focusFirst(modalRef);
  }
}, [isOpen, focusFirst]);

// Avoid
useEffect(() => {
  if (isOpen) {
    document.querySelector('button')?.focus();
  }
}, [isOpen]);
```

### 4. Error Handling

**Provide clear error messages**:
```typescript
// Good
{errors.email && (
  <p id="email-error" className="text-red-600" role="alert">
    Please enter a valid email address
  </p>
)}

// Avoid
{errors.email && (
  <p className="text-red-600">Error</p>
)}
```

## Common Issues and Solutions

### 1. Missing Alt Text

**Problem**: Images without alt text
**Solution**: Always provide alt text or mark as decorative
```typescript
// Good
<img src="logo.png" alt="Company Logo" />
<img src="decoration.png" alt="" role="presentation" />

// Bad
<img src="logo.png" />
```

### 2. Poor Focus Management

**Problem**: Focus not managed properly in modals
**Solution**: Use focus management hooks
```typescript
// Good
const { focusFirst, focusLast } = useFocusManagement();
useEffect(() => {
  if (isOpen) focusFirst(modalRef);
}, [isOpen, focusFirst]);

// Bad
useEffect(() => {
  if (isOpen) {
    const firstButton = modalRef.current?.querySelector('button');
    firstButton?.focus();
  }
}, [isOpen]);
```

### 3. Missing Form Labels

**Problem**: Form inputs without labels
**Solution**: Always associate labels with inputs
```typescript
// Good
<Label htmlFor="email">Email</Label>
<Input id="email" />

// Bad
<Label>Email</Label>
<Input />
```

### 4. Inaccessible Error Messages

**Problem**: Error messages not announced to screen readers
**Solution**: Use proper ARIA attributes
```typescript
// Good
<input aria-invalid={!!error} aria-describedby="error-message" />
{error && <p id="error-message" role="alert">{error}</p>}

// Bad
<input />
{error && <p className="text-red-600">{error}</p>}
```

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

## Conclusion

The GoalsGuild QuestBound Forge application implements comprehensive accessibility features to ensure an inclusive user experience. By following WCAG 2.1 AA guidelines and implementing proper ARIA attributes, focus management, and screen reader support, the application is accessible to users with various disabilities.

Regular testing and validation ensure that accessibility features continue to work correctly as the application evolves. The combination of automated testing tools and manual testing provides comprehensive coverage of accessibility requirements.

