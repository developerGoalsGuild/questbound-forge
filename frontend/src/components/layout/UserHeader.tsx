import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserHeaderProps, UserProfile } from '@/models/header';
import { useActiveGoalsCount } from '@/hooks/useActiveGoalsCount';
import { getUserProfileForHeader } from '@/lib/apiHeader';
import { useTranslation } from '@/hooks/useTranslation';
import ActiveGoalsBadge from '@/components/ui/ActiveGoalsBadge';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const UserHeader: React.FC<UserHeaderProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Get translations with safety checks
  const headerTranslations = (t as any)?.header;
  const commonTranslations = (t as any)?.common;

  // Active goals count hook
  const {
    count: activeGoalsCount,
    isLoading: isLoadingGoals,
    hasError: hasGoalsError,
    retry: retryGoals,
    clearError: clearGoalsError,
  } = useActiveGoalsCount({
    pollInterval: 30000, // 30 seconds
    maxRetries: 3,
  });

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await getUserProfileForHeader();
      setUserProfile(profile);
    } catch (error) {
      logger.error('Failed to load user profile in UserHeader', { error });
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Handle user menu navigation
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Handle logout
  const handleLogout = useCallback(() => {
    // Additional cleanup if needed
    setUserProfile(null);
  }, []);

  // Handle user menu toggle
  const handleUserMenuToggle = useCallback((open: boolean) => {
    setIsUserMenuOpen(open);
  }, []);

  // Handle user menu close
  const handleUserMenuClose = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  // Handle goals retry
  const handleGoalsRetry = useCallback(() => {
    clearGoalsError();
    retryGoals();
  }, [clearGoalsError, retryGoals]);

  // Handle dashboard navigation
  const handleDashboardClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Check if we're on dashboard page
  const isOnDashboard = location.pathname === '/dashboard';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'backdrop-blur-md shadow-lg',
        'transition-all duration-300',
        'bg-primary text-primary-foreground', // Use same primary color on all pages
        'border-0 rounded-none', // Remove border and rounded corners on all pages
        className
      )}
      role="banner"
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Left Side - Dashboard Button and Active Goals Count */}
          <div className="flex items-center gap-4">
            {/* Dashboard Button */}
            {!isOnDashboard && (
              <Button
                onClick={handleDashboardClick}
                variant="ghost"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 h-10',
                  'hover:bg-white/20 hover:text-white',
                  'focus:bg-white/20 focus:text-white',
                  'transition-all duration-300 transform hover:scale-105',
                  'border-2 border-transparent hover:border-white/30',
                  'rounded-lg font-cinzel font-medium',
                  'bg-white/10 text-white shadow-sm'
                )}
                aria-label={headerTranslations?.userMenu?.dashboard || 'Go to Dashboard'}
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">
                  {headerTranslations?.userMenu?.dashboard || 'Dashboard'}
                </span>
              </Button>
            )}

            {/* Active Goals Count */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <span className="text-sm font-cinzel font-semibold text-white">
                  {headerTranslations?.goalsCount?.active || 'Active Goals'}
                </span>
              </div>
              <ActiveGoalsBadge
                count={activeGoalsCount}
                isLoading={isLoadingGoals}
                hasError={hasGoalsError}
                onRetry={handleGoalsRetry}
                className="flex-shrink-0"
              />
            </div>
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center gap-4">
            <UserMenu
              userData={userProfile}
              isOpen={isUserMenuOpen}
              onClose={handleUserMenuClose}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay for Profile */}
      {isLoadingProfile && (
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 text-primary-foreground bg-primary/90 px-4 py-2 rounded-lg shadow-md">
            <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span className="text-sm font-medium font-cinzel">
              {commonTranslations?.loading || 'Loading...'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default UserHeader;
