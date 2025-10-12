/**
 * Authentication hook for getting current user information.
 */

import { useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/api/auth';

interface User {
  id: string;
  username: string;
  email: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userData = getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading, error };
};

