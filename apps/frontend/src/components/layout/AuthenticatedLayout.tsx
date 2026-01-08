import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthenticatedLayoutProps } from '@/models/header';
import UserHeader from './UserHeader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ErrorBoundary, { HeaderErrorFallback } from '@/components/ui/ErrorBoundary';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  className = '',
}) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header with Error Boundary */}
      <ErrorBoundary
        fallback={<HeaderErrorFallback onRetry={() => window.location.reload()} />}
        onError={(error, errorInfo) => {
          logger.error('Error in UserHeader component', { 
              error, 
              componentStack: errorInfo.componentStack 
          });
          // Could send to error reporting service here
        }}
      >
        <UserHeader />
      </ErrorBoundary>
      
      {/* Main Content */}
      <main className={cn(
        'pt-16 lg:pt-20',
        isDashboard && 'pt-0' // Remove padding for dashboard
      )}>
        <div className={cn(
          'container mx-auto px-4 lg:px-6',
          isDashboard && 'px-0' // Remove container padding for dashboard
        )}>
          {/* Breadcrumb Navigation - Hide on dashboard */}
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

export default AuthenticatedLayout;
