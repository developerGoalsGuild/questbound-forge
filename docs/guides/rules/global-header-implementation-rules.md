# Global Header Implementation Rules

## Overview
These rules define the standards and patterns for implementing global header components in the GoalsGuild application, based on the completed header feature implementation.

## Core Principles

### 1. Header Consistency
- **Universal Styling**: All header components must use the same color scheme across all pages
- **No Conditional Styling**: Avoid page-specific styling variations in header components
- **Primary Color Scheme**: Use `bg-primary text-primary-foreground` for all header elements
- **No Rounded Corners**: Always use `rounded-none` for header containers
- **No Borders**: Use `border-0` for clean header appearance

### 2. Component Architecture
- **Single Responsibility**: Each header component should have one clear purpose
- **Composition Over Inheritance**: Build complex headers from smaller, reusable components
- **Props Interface**: Always define TypeScript interfaces for component props
- **Default Props**: Provide sensible defaults for optional props

### 3. State Management
- **Custom Hooks**: Use custom hooks for complex state logic (e.g., `useActiveGoalsCount`)
- **Local State**: Keep UI state local to components when possible
- **Error Boundaries**: Implement proper error handling and recovery mechanisms
- **Loading States**: Always provide loading indicators for async operations

## Implementation Standards

### 1. Header Component Structure
```typescript
// Header component should follow this structure
const HeaderComponent: React.FC<HeaderProps> = ({ className = '' }) => {
  // 1. Hooks and state
  const [state, setState] = useState();
  const { data, loading, error } = useCustomHook();
  
  // 2. Event handlers
  const handleAction = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // 3. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 4. Render
  return (
    <header className={cn('base-classes', className)}>
      {/* Content */}
    </header>
  );
};
```

### 2. Styling Conventions
```typescript
// Use consistent styling patterns
const headerClasses = cn(
  'fixed top-0 left-0 right-0 z-50', // Positioning
  'backdrop-blur-md shadow-lg', // Visual effects
  'transition-all duration-300', // Animations
  'bg-primary text-primary-foreground', // Colors
  'border-0 rounded-none', // Shape
  className // Allow overrides
);
```

### 3. Menu Component Standards
```typescript
// Menu components should include
interface MenuProps {
  userData: UserProfile | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

// Always include accessibility attributes
<Button
  aria-label={translations?.menu?.openMenu || 'Open menu'}
  aria-expanded={isOpen}
  aria-haspopup="menu"
>
```

### 4. Translation Integration
```typescript
// Always use safe translation access
const headerTranslations = (t as any)?.header;
const commonTranslations = (t as any)?.common;

// Provide fallbacks for all translations
{headerTranslations?.goalsCount?.active || 'Active Goals'}
```

## Layout Integration Rules

### 1. AuthenticatedLayout Usage
- **Wrap All Pages**: Use `AuthenticatedLayout` for all authenticated pages
- **Conditional Styling**: Only apply page-specific styling in layout, not header
- **Dashboard Special Case**: Handle dashboard-specific layout adjustments
- **Breadcrumb Logic**: Show/hide breadcrumbs based on page context

### 2. Route Integration
```typescript
// All authenticated routes must use AuthenticatedLayout
<Route 
  path="/page" 
  element={
    <ProtectedRoute>
      <AuthenticatedLayout>
        <PageComponent />
      </AuthenticatedLayout>
    </ProtectedRoute>
  } 
/>
```

### 3. Responsive Design
- **Mobile-First**: Design for mobile, enhance for desktop
- **Breakpoint Usage**: Use `sm:`, `md:`, `lg:` prefixes consistently
- **Touch Targets**: Ensure minimum 44px touch targets
- **Hidden Elements**: Use `hidden sm:block` for responsive visibility

## Data Management Rules

### 1. API Integration
- **Custom Hooks**: Create custom hooks for data fetching
- **Error Handling**: Implement comprehensive error handling
- **Loading States**: Provide clear loading indicators
- **Retry Logic**: Include retry mechanisms for failed requests

### 2. Polling and Real-time Updates
```typescript
// Use polling for real-time data
const useActiveGoalsCount = (pollInterval = 30000) => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);
  
  return { data, loading, error, retry: fetchData };
};
```

### 3. State Synchronization
- **Single Source of Truth**: Keep data in one place
- **Event-Driven Updates**: Use events for cross-component communication
- **Cleanup**: Always cleanup subscriptions and intervals

## Accessibility Standards

### 1. ARIA Attributes
- **Role Attributes**: Use appropriate ARIA roles (`banner`, `menu`, `menuitem`)
- **State Attributes**: Include `aria-expanded`, `aria-haspopup`
- **Label Attributes**: Provide `aria-label` for all interactive elements
- **Live Regions**: Use ARIA live regions for dynamic content

### 2. Keyboard Navigation
- **Tab Order**: Ensure logical tab order
- **Arrow Keys**: Support arrow key navigation in menus
- **Enter/Space**: Handle Enter and Space key activation
- **Escape**: Close menus with Escape key

### 3. Screen Reader Support
- **Semantic HTML**: Use proper HTML elements
- **Descriptive Text**: Provide meaningful labels and descriptions
- **Status Announcements**: Announce important state changes

## Performance Optimization

### 1. Rendering Optimization
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Conditional Rendering**: Only render components when needed
- **Lazy Loading**: Load non-critical components asynchronously

### 2. Bundle Size
- **Tree Shaking**: Import only needed functions
- **Code Splitting**: Split large components into smaller chunks
- **Dynamic Imports**: Use dynamic imports for heavy dependencies

### 3. Network Optimization
- **Debouncing**: Debounce user input for API calls
- **Caching**: Implement proper caching strategies
- **Error Recovery**: Provide retry mechanisms with exponential backoff

## Testing Standards

### 1. Component Testing
- **Unit Tests**: Test individual component functionality
- **Integration Tests**: Test component interactions
- **Accessibility Tests**: Verify ARIA attributes and keyboard navigation
- **Error Scenarios**: Test error handling and recovery

### 2. User Experience Testing
- **Cross-Browser**: Test on multiple browsers
- **Responsive**: Test on different screen sizes
- **Performance**: Monitor Core Web Vitals
- **Accessibility**: Use screen readers and keyboard navigation

## Error Handling Patterns

### 1. API Errors
```typescript
// Always handle API errors gracefully
try {
  const data = await apiCall();
  setData(data);
} catch (error) {
  console.error('API Error:', error);
  setError(true);
  // Provide user-friendly error message
} finally {
  setLoading(false);
}
```

### 2. User Feedback
- **Error Messages**: Show clear, actionable error messages
- **Retry Options**: Provide retry buttons for failed operations
- **Loading States**: Show loading indicators during async operations
- **Success Feedback**: Confirm successful operations

### 3. Recovery Mechanisms
- **Automatic Retry**: Implement automatic retry with backoff
- **Manual Retry**: Provide manual retry options
- **Fallback Data**: Show fallback content when data fails to load
- **Graceful Degradation**: Ensure app remains functional with errors

## Code Quality Standards

### 1. TypeScript Usage
- **Strict Types**: Use strict TypeScript configuration
- **Interface Definitions**: Define interfaces for all props and data
- **Type Safety**: Avoid `any` types, use proper typing
- **Generic Types**: Use generics for reusable components

### 2. Code Organization
- **File Structure**: Organize files by feature/component
- **Import Order**: Group imports logically (React, third-party, local)
- **Export Patterns**: Use named exports for components
- **Barrel Exports**: Create index files for clean imports

### 3. Documentation
- **Component Documentation**: Document component purpose and usage
- **Prop Documentation**: Document all props with JSDoc
- **Example Usage**: Provide usage examples
- **Changelog**: Maintain changelog for significant changes

## Security Considerations

### 1. Data Protection
- **Sensitive Data**: Never log sensitive user data
- **Token Handling**: Secure token storage and transmission
- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Sanitize user-generated content

### 2. Authentication
- **Token Validation**: Validate tokens before API calls
- **Session Management**: Handle session expiration gracefully
- **Logout Security**: Clear all sensitive data on logout
- **Route Protection**: Protect authenticated routes properly

## Maintenance Guidelines

### 1. Code Updates
- **Backward Compatibility**: Maintain backward compatibility when possible
- **Deprecation Warnings**: Provide warnings for deprecated features
- **Migration Guides**: Create guides for breaking changes
- **Version Management**: Use semantic versioning

### 2. Performance Monitoring
- **Bundle Analysis**: Regularly analyze bundle size
- **Performance Metrics**: Monitor Core Web Vitals
- **Error Tracking**: Track and analyze errors
- **User Feedback**: Collect and act on user feedback

### 3. Documentation Updates
- **Keep Current**: Update documentation with code changes
- **Examples**: Maintain working examples
- **Troubleshooting**: Document common issues and solutions
- **Best Practices**: Update best practices based on learnings

## Conclusion

These rules ensure consistent, maintainable, and high-quality header implementations across the GoalsGuild application. Follow these patterns to maintain code quality and user experience standards.

Remember: The header is the first thing users see and interact with - it sets the tone for the entire application experience.
