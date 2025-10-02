# Header Component Patterns & Conventions

## Overview
This document defines the specific patterns and conventions used in the GoalsGuild header implementation, serving as a reference for future header-related development.

## Component Architecture Patterns

### 1. Header Component Structure
```typescript
// Standard header component pattern
interface HeaderProps {
  className?: string;
  // Add other props as needed
}

const HeaderComponent: React.FC<HeaderProps> = ({ className = '' }) => {
  // 1. State and hooks
  const [localState, setLocalState] = useState();
  const { data, loading, error } = useCustomHook();
  
  // 2. Event handlers (useCallback for performance)
  const handleAction = useCallback((param: string) => {
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

### 2. Menu Component Pattern
```typescript
// Standard menu component pattern
interface MenuProps {
  userData: UserProfile | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const MenuComponent: React.FC<MenuProps> = ({
  userData,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.path) {
      onNavigate(item.path);
    } else if (item.action) {
      item.action();
    }
    setIsOpen(false);
    onClose();
  }, [onNavigate, onClose]);
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      {/* Menu content */}
    </DropdownMenu>
  );
};
```

## Styling Patterns

### 1. Header Container Styling
```typescript
// Standard header container classes
const headerClasses = cn(
  'fixed top-0 left-0 right-0 z-50', // Positioning
  'backdrop-blur-md shadow-lg', // Visual effects
  'transition-all duration-300', // Animations
  'bg-primary text-primary-foreground', // Colors
  'border-0 rounded-none', // Shape
  className // Allow overrides
);
```

### 2. Button Styling Patterns
```typescript
// Primary button styling
const primaryButtonClasses = cn(
  'flex items-center gap-2 px-3 py-2 h-10',
  'hover:bg-primary-foreground/20 hover:text-primary-foreground',
  'focus:bg-primary-foreground/20 focus:text-primary-foreground',
  'transition-all duration-300 transform hover:scale-105',
  'border-2 border-transparent hover:border-primary-foreground/30',
  'rounded-lg font-cinzel font-medium',
  'bg-primary-foreground/10 text-primary-foreground shadow-sm'
);

// Ghost button styling
const ghostButtonClasses = cn(
  'flex items-center gap-3 px-4 py-2 h-12',
  'hover:bg-primary-foreground/20 hover:text-primary-foreground',
  'focus:bg-primary-foreground/20 focus:text-primary-foreground',
  'transition-all duration-300 transform hover:scale-105',
  'border-2 border-transparent hover:border-primary-foreground/30',
  'rounded-xl font-cinzel font-medium',
  'bg-primary-foreground/10 text-primary-foreground shadow-sm'
);
```

### 3. Badge Styling Patterns
```typescript
// Active goals badge styling
const badgeClasses = cn(
  'flex items-center gap-2 px-4 py-2 text-sm font-semibold',
  'bg-white/20 text-white border-white/30',
  'shadow-md backdrop-blur-sm',
  'hover:bg-white/30 hover:shadow-lg',
  'transition-all duration-300 transform hover:scale-105',
  'font-cinzel tracking-wide',
  hasError && 'bg-red-500/20 text-red-100 border-red-400',
  count === 0 && 'bg-gray-500/20 text-gray-200 border-gray-400'
);
```

## Data Management Patterns

### 1. Custom Hook Pattern
```typescript
// Standard custom hook pattern for data fetching
interface UseDataOptions {
  pollInterval?: number;
  maxRetries?: number;
  enabled?: boolean;
}

const useCustomData = (options: UseDataOptions = {}) => {
  const {
    pollInterval = 30000,
    maxRetries = 3,
    enabled = true
  } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const result = await apiCall();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(true);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [enabled]);
  
  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      fetchData();
    }
  }, [fetchData, retryCount, maxRetries]);
  
  useEffect(() => {
    fetchData();
    
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);
  
  return { data, loading, error, retry, clearError: () => setError(false) };
};
```

### 2. API Service Pattern
```typescript
// Standard API service pattern
export async function getDataForHeader(): Promise<DataType | null> {
  const token = getAccessToken();
  const userId = getUserIdFromToken();
  
  if (!token || !userId) {
    console.warn('No token or user ID found for data fetch.');
    return null;
  }
  
  try {
    const data = await graphqlRaw<{ dataField: DataType }>(QUERY);
    return data.dataField;
  } catch (e: any) {
    console.error('[getDataForHeader] GraphQL error:', e?.errors || e?.message || e);
    return null;
  }
}
```

## Translation Patterns

### 1. Translation Interface Pattern
```typescript
// Standard translation interface
export interface ComponentTranslations {
  labels: {
    [key: string]: string;
  };
  actions: {
    [key: string]: string;
  };
  messages: {
    [key: string]: string;
  };
  accessibility: {
    [key: string]: string;
  };
}

export const componentTranslations: Record<Language, ComponentTranslations> = {
  en: {
    labels: { /* English labels */ },
    actions: { /* English actions */ },
    messages: { /* English messages */ },
    accessibility: { /* English accessibility */ },
  },
  es: { /* Spanish translations */ },
  fr: { /* French translations */ },
};
```

### 2. Safe Translation Access Pattern
```typescript
// Standard safe translation access
const Component: React.FC = () => {
  const { t } = useTranslation();
  
  // Safe access with fallbacks
  const componentTranslations = (t as any)?.component;
  const commonTranslations = (t as any)?.common;
  
  return (
    <div>
      <span>
        {componentTranslations?.labels?.title || 'Default Title'}
      </span>
      <button>
        {componentTranslations?.actions?.submit || 'Submit'}
      </button>
    </div>
  );
};
```

## Layout Integration Patterns

### 1. AuthenticatedLayout Pattern
```typescript
// Standard authenticated layout pattern
const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  className = '',
}) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <UserHeader />
      
      <main className={cn(
        'pt-16 lg:pt-20',
        isDashboard && 'pt-0' // Dashboard-specific adjustments
      )}>
        <div className={cn(
          'container mx-auto px-4 lg:px-6',
          isDashboard && 'px-0' // Dashboard-specific adjustments
        )}>
          {!isDashboard && (
            <div className="mb-6">
              <Breadcrumb />
            </div>
          )}
          
          {children}
        </div>
      </main>
    </div>
  );
};
```

### 2. Route Integration Pattern
```typescript
// Standard route integration pattern
const routes = [
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <Dashboard />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/edit',
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <ProfileEdit />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  // ... other routes
];
```

## Error Handling Patterns

### 1. Component Error Handling
```typescript
// Standard component error handling
const Component: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleAction = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await performAction();
    } catch (err) {
      console.error('Action failed:', err);
      setError('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={handleAction} disabled={loading}>
          {loading ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }
  
  return <div>{/* Component content */}</div>;
};
```

### 2. Loading State Pattern
```typescript
// Standard loading state pattern
const Component: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }
  
  return <div>{/* Component content */}</div>;
};
```

## Accessibility Patterns

### 1. ARIA Attributes Pattern
```typescript
// Standard ARIA attributes pattern
<button
  aria-label={translations?.button?.label || 'Button'}
  aria-expanded={isOpen}
  aria-haspopup="menu"
  aria-describedby={error ? 'error-message' : undefined}
>
  Button Content
</button>

{error && (
  <div id="error-message" role="alert" className="error-message">
    {error}
  </div>
)}
```

### 2. Keyboard Navigation Pattern
```typescript
// Standard keyboard navigation pattern
const handleKeyDown = useCallback((event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      handleClick();
      break;
    case 'Escape':
      handleClose();
      break;
    case 'ArrowDown':
      event.preventDefault();
      focusNext();
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusPrevious();
      break;
  }
}, [handleClick, handleClose, focusNext, focusPrevious]);
```

## Performance Patterns

### 1. Memoization Pattern
```typescript
// Standard memoization pattern
const Component: React.FC<Props> = ({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: processItem(item)
    }));
  }, [data]);
  
  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);
  
  return <div>{/* Component content */}</div>;
};
```

### 2. Debouncing Pattern
```typescript
// Standard debouncing pattern
const useDebouncedCallback = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};
```

## Testing Patterns

### 1. Component Testing Pattern
```typescript
// Standard component testing pattern
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    const mockHandler = jest.fn();
    render(<Component onAction={mockHandler} />);
    
    await user.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
  
  it('shows loading state', () => {
    render(<Component loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### 2. Accessibility Testing Pattern
```typescript
// Standard accessibility testing pattern
describe('Component Accessibility', () => {
  it('has proper ARIA attributes', () => {
    render(<Component />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-expanded');
  });
  
  it('supports keyboard navigation', async () => {
    render(<Component />);
    const button = screen.getByRole('button');
    
    button.focus();
    await user.keyboard('{Enter}');
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

## Conclusion

These patterns provide a consistent foundation for header-related development in the GoalsGuild application. Use these patterns as templates and adapt them to specific use cases while maintaining consistency with the established conventions.
