# Header Styling Standards

## Overview
This document defines the styling standards and conventions for header components in the GoalsGuild application, ensuring visual consistency and maintainability.

## Color Scheme Standards

### 1. Primary Color Palette
```css
/* Primary colors for header components */
--primary: 221 83% 25%; /* Deep royal blue */
--primary-foreground: 42 15% 97%; /* Light cream */
--primary-hover: 221 83% 20%; /* Darker blue for hover */
--primary-glow: 221 83% 35%; /* Glow effect color */
```

### 2. Header Background Standards
```typescript
// Standard header background classes
const headerBackgroundClasses = 'bg-primary text-primary-foreground';

// Never use these for headers:
// ❌ bg-gradient-to-r from-amber-50 to-amber-100
// ❌ btn-heraldic (has rounded corners and borders)
// ❌ bg-blue-600 (inconsistent with primary)
```

### 3. Text Color Standards
```typescript
// Standard text color classes
const textColorClasses = 'text-primary-foreground';

// For contrast and readability:
const mutedTextClasses = 'text-primary-foreground/80';
const subtleTextClasses = 'text-primary-foreground/60';
```

## Shape and Border Standards

### 1. Header Container Shape
```typescript
// Standard header container classes
const headerContainerClasses = cn(
  'fixed top-0 left-0 right-0 z-50',
  'border-0 rounded-none', // No borders, no rounded corners
  'bg-primary text-primary-foreground'
);
```

### 2. Button Shape Standards
```typescript
// Primary buttons (Dashboard button)
const primaryButtonClasses = cn(
  'rounded-lg', // Slight rounding for buttons
  'border-2 border-transparent hover:border-primary-foreground/30'
);

// Menu buttons
const menuButtonClasses = cn(
  'rounded-xl', // More rounding for menu buttons
  'border-2 border-transparent hover:border-primary-foreground/30'
);
```

### 3. Badge Shape Standards
```typescript
// Badge shape classes
const badgeClasses = cn(
  'rounded-lg', // Consistent with primary buttons
  'border border-white/30' // Subtle border for badges
);
```

## Spacing and Layout Standards

### 1. Header Height Standards
```typescript
// Standard header heights
const headerHeightClasses = 'h-16 lg:h-20'; // 64px mobile, 80px desktop

// Button heights within header
const buttonHeightClasses = 'h-10'; // 40px for primary buttons
const menuButtonHeightClasses = 'h-12'; // 48px for menu buttons
```

### 2. Padding and Margin Standards
```typescript
// Header container padding
const headerPaddingClasses = 'px-4 lg:px-6'; // 16px mobile, 24px desktop

// Button padding
const buttonPaddingClasses = 'px-3 py-2'; // Primary buttons
const menuButtonPaddingClasses = 'px-4 py-2'; // Menu buttons

// Badge padding
const badgePaddingClasses = 'px-4 py-2'; // Consistent with menu buttons
```

### 3. Gap Standards
```typescript
// Standard gap classes
const smallGapClasses = 'gap-2'; // 8px
const mediumGapClasses = 'gap-3'; // 12px
const largeGapClasses = 'gap-4'; // 16px
```

## Visual Effects Standards

### 1. Shadow Standards
```typescript
// Header shadow
const headerShadowClasses = 'shadow-lg';

// Button shadows
const buttonShadowClasses = 'shadow-sm';
const buttonHoverShadowClasses = 'hover:shadow-lg';
```

### 2. Backdrop and Blur Standards
```typescript
// Header backdrop
const headerBackdropClasses = 'backdrop-blur-md';

// Badge backdrop
const badgeBackdropClasses = 'backdrop-blur-sm';
```

### 3. Transition Standards
```typescript
// Standard transition classes
const transitionClasses = 'transition-all duration-300';

// Hover effects
const hoverScaleClasses = 'transform hover:scale-105';
const hoverOpacityClasses = 'hover:opacity-80';
```

## Interactive State Standards

### 1. Hover States
```typescript
// Primary button hover
const primaryButtonHoverClasses = cn(
  'hover:bg-primary-foreground/20',
  'hover:text-primary-foreground',
  'hover:border-primary-foreground/30'
);

// Menu button hover
const menuButtonHoverClasses = cn(
  'hover:bg-primary-foreground/20',
  'hover:text-primary-foreground',
  'hover:border-primary-foreground/30'
);
```

### 2. Focus States
```typescript
// Focus states (same as hover for consistency)
const focusClasses = cn(
  'focus:bg-primary-foreground/20',
  'focus:text-primary-foreground',
  'focus:border-primary-foreground/30',
  'focus:outline-none' // Remove default focus outline
);
```

### 3. Active States
```typescript
// Active states
const activeClasses = cn(
  'active:scale-95', // Slight scale down on click
  'active:bg-primary-foreground/30'
);
```

## Loading State Standards

### 1. Loading Overlay
```typescript
// Loading overlay classes
const loadingOverlayClasses = cn(
  'absolute inset-0',
  'bg-primary/80', // Semi-transparent primary background
  'backdrop-blur-sm',
  'flex items-center justify-center'
);
```

### 2. Loading Content
```typescript
// Loading content classes
const loadingContentClasses = cn(
  'flex items-center gap-3',
  'text-primary-foreground bg-primary/90',
  'px-4 py-2 rounded-lg shadow-md'
);
```

### 3. Spinner Standards
```typescript
// Spinner classes
const spinnerClasses = cn(
  'h-5 w-5 border-2 rounded-full animate-spin',
  'border-primary-foreground/30 border-t-primary-foreground'
);
```

## Responsive Design Standards

### 1. Mobile-First Approach
```typescript
// Mobile-first responsive classes
const responsiveClasses = cn(
  'text-sm', // Base mobile size
  'sm:text-base', // Small screens and up
  'md:text-lg', // Medium screens and up
  'lg:text-xl' // Large screens and up
);
```

### 2. Visibility Standards
```typescript
// Responsive visibility
const visibilityClasses = cn(
  'hidden sm:block', // Hidden on mobile, visible on small screens
  'hidden md:block', // Hidden on mobile/tablet, visible on desktop
  'block sm:hidden' // Visible on mobile, hidden on small screens
);
```

### 3. Layout Responsiveness
```typescript
// Responsive layout
const layoutClasses = cn(
  'flex flex-col', // Mobile: vertical layout
  'sm:flex-row', // Small screens: horizontal layout
  'gap-2 sm:gap-4' // Responsive gaps
);
```

## Typography Standards

### 1. Font Family Standards
```typescript
// Font family classes
const fontFamilyClasses = 'font-cinzel'; // Primary font for headers
const fontWeightClasses = 'font-medium'; // Standard weight
const fontSemiboldClasses = 'font-semibold'; // Emphasized text
```

### 2. Font Size Standards
```typescript
// Font size hierarchy
const textSizeClasses = {
  xs: 'text-xs', // 12px - Small labels
  sm: 'text-sm', // 14px - Body text
  base: 'text-base', // 16px - Default text
  lg: 'text-lg', // 18px - Headings
  xl: 'text-xl', // 20px - Large headings
  '2xl': 'text-2xl', // 24px - Page titles
  '3xl': 'text-3xl', // 30px - Large titles
  '4xl': 'text-4xl' // 36px - Hero titles
};
```

### 3. Text Color Hierarchy
```typescript
// Text color hierarchy
const textColorHierarchy = {
  primary: 'text-primary-foreground', // Main text
  secondary: 'text-primary-foreground/80', // Secondary text
  muted: 'text-primary-foreground/60', // Muted text
  subtle: 'text-primary-foreground/40' // Subtle text
};
```

## Component-Specific Standards

### 1. UserHeader Standards
```typescript
// UserHeader specific classes
const userHeaderClasses = cn(
  'fixed top-0 left-0 right-0 z-50',
  'backdrop-blur-md shadow-lg',
  'transition-all duration-300',
  'bg-primary text-primary-foreground',
  'border-0 rounded-none'
);
```

### 2. UserMenu Standards
```typescript
// UserMenu specific classes
const userMenuClasses = cn(
  'flex items-center gap-3 px-4 py-2 h-12',
  'hover:bg-primary-foreground/20 hover:text-primary-foreground',
  'focus:bg-primary-foreground/20 focus:text-primary-foreground',
  'transition-all duration-300 transform hover:scale-105',
  'border-2 border-transparent hover:border-primary-foreground/30',
  'rounded-xl font-cinzel font-medium',
  'bg-primary-foreground/10 text-primary-foreground shadow-sm'
);
```

### 3. ActiveGoalsBadge Standards
```typescript
// ActiveGoalsBadge specific classes
const activeGoalsBadgeClasses = cn(
  'flex items-center gap-2 px-4 py-2 text-sm font-semibold',
  'bg-white/20 text-white border-white/30',
  'shadow-md backdrop-blur-sm',
  'hover:bg-white/30 hover:shadow-lg',
  'transition-all duration-300 transform hover:scale-105',
  'font-cinzel tracking-wide'
);
```

## Accessibility Standards

### 1. Color Contrast
- **Minimum Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: High contrast focus states
- **Error States**: Clear visual distinction for errors

### 2. Interactive Elements
- **Minimum Touch Target**: 44px x 44px
- **Focus States**: Visible focus indicators
- **Hover States**: Clear hover feedback

### 3. Visual Hierarchy
- **Clear Hierarchy**: Use size, weight, and color to establish hierarchy
- **Consistent Spacing**: Maintain consistent spacing patterns
- **Logical Grouping**: Group related elements visually

## Performance Standards

### 1. CSS Optimization
- **Minimal Classes**: Use only necessary classes
- **Efficient Selectors**: Avoid complex selectors
- **Critical CSS**: Inline critical styles

### 2. Animation Performance
- **GPU Acceleration**: Use transform and opacity for animations
- **Smooth Transitions**: 60fps animations
- **Reduced Motion**: Respect user preferences

### 3. Bundle Size
- **Tree Shaking**: Remove unused styles
- **Purge CSS**: Remove unused classes in production
- **Minimal Dependencies**: Use only necessary styling libraries

## Maintenance Standards

### 1. Naming Conventions
- **BEM Methodology**: Block__Element--Modifier
- **Semantic Names**: Use descriptive class names
- **Consistent Prefixes**: Use consistent prefixes for related classes

### 2. Documentation
- **Style Guide**: Maintain a living style guide
- **Component Examples**: Provide usage examples
- **Changelog**: Document style changes

### 3. Testing
- **Visual Regression**: Test visual changes
- **Cross-Browser**: Test on multiple browsers
- **Responsive**: Test on different screen sizes

## Conclusion

These styling standards ensure consistency, maintainability, and accessibility across all header components. Follow these standards to maintain the visual integrity of the GoalsGuild application while providing an excellent user experience.
