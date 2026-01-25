import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const breadcrumbTranslations = (t as any)?.common?.breadcrumb;

  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Always start with Dashboard
    items.push({
      label: breadcrumbTranslations?.dashboard || 'Dashboard',
      path: '/dashboard',
      current: location.pathname === '/dashboard'
    });

    // Handle quest pages with proper hierarchy
    if (location.pathname.startsWith('/quests')) {
      // Add Quests as parent
      items.push({
        label: breadcrumbTranslations?.quests || 'Quests',
        path: '/quests',
        current: location.pathname === '/quests'
      });

      // Add specific quest page if not on main quests page
      if (location.pathname !== '/quests') {
        const questPage = getQuestPageLabel(location.pathname);
        if (questPage) {
          items.push({
            label: questPage,
            current: true
          });
        }
      }
    } else if (location.pathname !== '/dashboard') {
      // Handle other pages
      const currentPage = getPageLabel(location.pathname);
      if (currentPage) {
        items.push({
          label: currentPage,
          current: true
        });
      }
    }

    return items;
  };

  // Get quest page label based on path
  const getQuestPageLabel = (path: string): string => {
    if (path === '/quests/create') {
      return breadcrumbTranslations?.create || 'Create';
    }
    if (path.startsWith('/quests/edit/')) {
      return breadcrumbTranslations?.edit || 'Edit';
    }
    if (path.startsWith('/quests/details/')) {
      return breadcrumbTranslations?.view || 'View';
    }
    
    // Default fallback for quest pages
    return breadcrumbTranslations?.quest || 'Quest';
  };

  // Get page label based on path
  const getPageLabel = (path: string): string => {
    const pathMap: Record<string, string> = {
      '/profile': breadcrumbTranslations?.profile || 'Profile',
      '/profile/edit': breadcrumbTranslations?.editProfile || 'Edit Profile',
      '/goals': breadcrumbTranslations?.goals || 'Goals',
      '/goals/list': breadcrumbTranslations?.goalsList || 'Goals List',
      '/goals/create': breadcrumbTranslations?.createGoal || 'Create Goal',
      '/goals/edit': breadcrumbTranslations?.editGoal || 'Edit Goal',
      '/goals/details': breadcrumbTranslations?.goalDetails || 'Goal Details',
      '/account/change-password': breadcrumbTranslations?.changePassword || 'Change Password',
      '/guilds': breadcrumbTranslations?.guilds || 'Guilds',
      '/chat': breadcrumbTranslations?.chat || 'Chat',
      '/subscription': breadcrumbTranslations?.subscription || 'Subscription',
      '/my-collaborations': breadcrumbTranslations?.myCollaborations || 'My Collaborations',
    };

    // Check for exact matches first
    if (pathMap[path]) {
      return pathMap[path];
    }

    // Check for dynamic routes
    if (path.startsWith('/goals/edit/')) {
      return breadcrumbTranslations?.editGoal || 'Edit Goal';
    }
    if (path.startsWith('/goals/details/')) {
      return breadcrumbTranslations?.goalDetails || 'Goal Details';
    }
    if (path.startsWith('/guilds/')) {
      return breadcrumbTranslations?.guilds || 'Guilds';
    }
    if (path.startsWith('/subscription/')) {
      return breadcrumbTranslations?.subscription || 'Subscription';
    }

    // Default fallback
    return path.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || (breadcrumbTranslations?.page || 'Page');
  };

  const breadcrumbItems = getBreadcrumbItems();

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.path && !item.current) {
      navigate(item.path);
    }
  };

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumb if only on dashboard
  }

  return (
    <nav
      className={cn(
        'flex items-center gap-2 text-sm',
        'bg-gradient-to-r from-blue-50 to-blue-100 backdrop-blur-sm',
        'px-4 py-2 rounded-lg border-2 border-blue-300',
        'shadow-md',
        className
      )}
      aria-label="Breadcrumb"
    >
      <Home className="h-4 w-4 text-blue-600" />
      
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-blue-500" />
          )}
          
          {item.current ? (
            <span className="font-cinzel font-semibold text-blue-900">
              {item.label}
            </span>
          ) : (
            <Button
              variant="ghost"
              onClick={() => handleItemClick(item)}
              className={cn(
                'h-auto p-1 text-blue-800 hover:text-blue-900',
                'hover:bg-blue-200 rounded-md',
                'font-cinzel font-medium text-sm',
                'transition-colors duration-200'
              )}
            >
              {item.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;