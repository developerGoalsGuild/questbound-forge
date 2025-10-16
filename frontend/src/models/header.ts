// Header component models and interfaces
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  role: string;
  tier: string;
  language: string;
  country: string;
  bio?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ActiveGoalsState {
  count: number | null;
  isLoading: boolean;
  hasError: boolean;
  lastUpdated: Date | null;
  retryCount: number;
}

export interface UserMenuState {
  isOpen: boolean;
  selectedIndex: number;
  userData: UserProfile | null;
}

export interface UserHeaderProps {
  className?: string;
}

export interface UserMenuProps {
  userData: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export interface ActiveGoalsBadgeProps {
  count: number | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry?: () => void;
  className?: string;
}

export interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Menu item types
export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  action?: () => void;
}

// Error types
export interface HeaderError {
  type: 'network' | 'auth' | 'api' | 'unknown';
  message: string;
  retryable: boolean;
}

// Translation interfaces
export interface HeaderTranslations {
  goalsCount: {
    active: string;
    loading: string;
    error: string;
    retry: string;
  };
  userMenu: {
    dashboard: string;
    quests: string;
    questDashboard: string;
    invites: string;
    myCollaborations: string;
    guilds: string;
    rankings: string;
    profile: string;
    changePassword: string;
    logout: string;
    openMenu: string;
    closeMenu: string;
  };
  accessibility: {
    goalsCountLabel: string;
    userMenuLabel: string;
    navigationHint: string;
  };
}
