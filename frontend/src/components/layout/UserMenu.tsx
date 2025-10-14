import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Key,
  LogOut,
  ChevronDown,
  Loader2,
  Home,
  Target,
  BarChart3,
  Mail,
  Users
} from 'lucide-react';
import { UserMenuProps, MenuItem } from '@/models/header';
import { getUserInitials, getUserDisplayName } from '@/lib/apiHeader';
import { useLogout } from '@/lib/logout';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const UserMenu: React.FC<UserMenuProps> = ({
  userData,
  isOpen,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { performLogout } = useLogout();
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Get translations with safety checks
  const headerTranslations = (t as any)?.header;
  const commonTranslations = (t as any)?.common;

  const userInitials = getUserInitials(userData);
  const userDisplayName = getUserDisplayName(userData);

  // Menu items configuration
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: headerTranslations?.userMenu?.dashboard || 'Dashboard',
      icon: Home,
      path: '/dashboard',
    },
    {
      id: 'quests',
      label: headerTranslations?.userMenu?.quests || 'Quests',
      icon: Target,
      path: '/quests',
    },
    {
      id: 'quest-dashboard',
      label: headerTranslations?.userMenu?.questDashboard || 'Quest Dashboard',
      icon: BarChart3,
      path: '/quests/dashboard',
    },
    {
      id: 'invites',
      label: headerTranslations?.userMenu?.invites || 'Invites',
      icon: Mail,
      path: '/invites',
    },
    {
      id: 'myCollaborations',
      label: headerTranslations?.userMenu?.myCollaborations || 'My Collaborations',
      icon: Users,
      path: '/my-collaborations',
    },
    {
      id: 'profile',
      label: headerTranslations?.userMenu?.profile || 'Edit Profile',
      icon: User,
      path: '/profile/edit',
    },
    {
      id: 'change-password',
      label: headerTranslations?.userMenu?.changePassword || 'Change Password',
      icon: Key,
      path: '/account/change-password',
    },
  ];

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!internalOpen) return;

    const totalItems = menuItems.length + 1; // +1 for logout item

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
          handleMenuItemClick(menuItems[focusedIndex]);
        } else if (focusedIndex === menuItems.length) {
          handleLogout();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setInternalOpen(false);
        onClose();
        triggerRef.current?.focus();
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(totalItems - 1);
        break;
    }
  }, [internalOpen, focusedIndex, menuItems, onClose]);

  // Reset focus when menu closes
  useEffect(() => {
    if (!internalOpen) {
      setFocusedIndex(-1);
    }
  }, [internalOpen]);

  // Focus management
  useEffect(() => {
    if (internalOpen && menuRef.current) {
      const focusableItems = menuRef.current.querySelectorAll('[role="menuitem"]');
      if (focusedIndex >= 0 && focusedIndex < focusableItems.length) {
        (focusableItems[focusedIndex] as HTMLElement)?.focus();
      }
    }
  }, [focusedIndex, internalOpen]);

  // Handle menu open/close
  const handleOpenChange = (open: boolean) => {
    setInternalOpen(open);
    if (!open) {
      onClose();
    }
  };

  // Handle menu item click
  const handleMenuItemClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
      onNavigate(item.path);
    } else if (item.action) {
      item.action();
    }
    setInternalOpen(false);
    onClose();
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await performLogout();
      onLogout();
    } catch (error) {
      logger.error('Logout failed from UserMenu', { error });
    } finally {
      setIsLoggingOut(false);
    }
    setInternalOpen(false);
    onClose();
  };

  return (
    <DropdownMenu open={internalOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            className={cn(
              'flex items-center gap-3 px-4 py-2 h-12',
              'hover:bg-primary-foreground/20 hover:text-primary-foreground',
              'focus:bg-primary-foreground/20 focus:text-primary-foreground',
              'transition-all duration-300 transform hover:scale-105',
              'border-2 border-transparent hover:border-primary-foreground/30',
              'rounded-xl font-cinzel font-medium',
              'bg-primary-foreground/10 text-primary-foreground shadow-sm'
            )}
            aria-label={headerTranslations?.userMenu?.openMenu || 'Open user menu'}
            aria-expanded={internalOpen}
            aria-haspopup="menu"
            onKeyDown={handleKeyDown}
          >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-semibold border border-primary-foreground/30">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline font-medium text-sm">
            {userDisplayName}
          </span>
          <ChevronDown 
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              internalOpen && 'rotate-180'
            )} 
          />
        </Button>
      </DropdownMenuTrigger>

        <DropdownMenuContent
          ref={menuRef}
          align="end"
          className={cn(
            'w-64 p-2',
            'bg-gradient-to-br from-blue-50 to-blue-100',
            'border-2 border-blue-300 shadow-xl',
            'rounded-xl overflow-hidden backdrop-blur-sm',
            'animate-in slide-in-from-top-2 duration-200'
          )}
          role="menu"
          aria-label={headerTranslations?.userMenu?.userMenuLabel || 'User account menu'}
          onKeyDown={handleKeyDown}
        >
        {/* User Info Header */}
        <div className="px-4 py-3 border-b-2 border-blue-200 bg-gradient-to-r from-blue-100 to-blue-50">
          <p className="text-sm font-cinzel font-semibold text-blue-900 truncate">
            {userDisplayName}
          </p>
          <p className="text-xs text-blue-700 truncate font-medium">
            {userData?.email || ''}
          </p>
        </div>

        {/* Menu Items */}
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isFocused = focusedIndex === index;
          return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => handleMenuItemClick(item)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer',
                  'hover:bg-gradient-to-r hover:from-blue-200 hover:to-blue-100',
                  'hover:text-blue-900 hover:shadow-md',
                  'focus:bg-gradient-to-r focus:from-blue-200 focus:to-blue-100',
                  'focus:text-blue-900 focus:shadow-md',
                  'transition-all duration-200 transform hover:scale-105',
                  'text-sm font-cinzel font-medium text-blue-800',
                  'rounded-lg mx-1',
                  isFocused && 'bg-gradient-to-r from-blue-200 to-blue-100 text-blue-900 shadow-md'
                )}
                role="menuitem"
                tabIndex={-1}
                aria-selected={isFocused}
              >
              <IconComponent className="h-4 w-4 text-gray-600" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="bg-blue-200 my-2" />

        {/* Logout Item */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'flex items-center gap-3 px-4 py-3 cursor-pointer',
            'hover:bg-gradient-to-r hover:from-red-200 hover:to-red-100',
            'hover:text-red-900 hover:shadow-md',
            'focus:bg-gradient-to-r focus:from-red-200 focus:to-red-100',
            'focus:text-red-900 focus:shadow-md',
            'transition-all duration-200 transform hover:scale-105',
            'text-sm font-cinzel font-medium text-red-700',
            'rounded-lg mx-1',
            isLoggingOut && 'opacity-50 cursor-not-allowed',
            focusedIndex === menuItems.length && 'bg-gradient-to-r from-red-200 to-red-100 text-red-900 shadow-md'
          )}
          role="menuitem"
          tabIndex={-1}
          aria-selected={focusedIndex === menuItems.length}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>
            {isLoggingOut 
              ? (commonTranslations?.loading || 'Loading...')
              : (headerTranslations?.userMenu?.logout || 'Logout')
            }
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;