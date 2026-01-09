import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      return navigator.onLine;
    }
    return true; // Default to online if we can't determine
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
