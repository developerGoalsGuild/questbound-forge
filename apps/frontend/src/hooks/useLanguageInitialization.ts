import { useState, useEffect, useCallback } from 'react';
import { getProfile } from '@/lib/apiProfile';
import { isTokenValid } from '@/lib/auth';
import { logger } from '@/lib/logger';

export type SupportedLanguage = 'en' | 'es' | 'fr';

interface UseLanguageInitializationReturn {
  language: SupportedLanguage;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to initialize language based on user profile or browser default
 * Priority: User profile language > Browser language > Default (en)
 */
export const useLanguageInitialization = (): UseLanguageInitializationReturn => {
  // Check localStorage first for manually selected language
  const getStoredLanguage = useCallback((): SupportedLanguage | null => {
    try {
      const stored = localStorage.getItem('userLanguage');
      if (stored && (stored === 'en' || stored === 'es' || stored === 'fr')) {
        return stored as SupportedLanguage;
      }
    } catch (e) {
      // localStorage not available or error
    }
    return null;
  }, []);

  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem('userLanguage');
      if (stored && (stored === 'en' || stored === 'es' || stored === 'fr')) {
        return stored as SupportedLanguage;
      }
    } catch (e) {
      // localStorage not available or error
    }
    return 'en';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // List of public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/login/Login',
    '/signup/LocalSignUp',
    '/forgot-password',
    '/reset-password',
    '/docs',
    '/about',
    '/blog',
    '/careers',
    '/help',
    '/status',
    '/privacy',
    '/terms',
  ];

  const isPublicRoute = useCallback(() => {
    // Use window.location.pathname instead of useLocation() since this hook
    // may be called outside Router context (TranslationProvider wraps BrowserRouter)
    const pathname = window.location.pathname;
    return publicRoutes.some(route => {
      // Exact match
      if (pathname === route) return true;
      // Check if pathname starts with route followed by / (for sub-routes)
      if (pathname.startsWith(route + '/')) return true;
      // Handle dynamic routes like /blog/:slug
      if (route.includes(':')) {
        const routePattern = route.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}(/.*)?$`);
        return regex.test(pathname);
      }
      return false;
    });
  }, []);

  const detectBrowserLanguage = useCallback((): SupportedLanguage => {
    try {
      // Get browser language
      const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
      
      // Extract language code (e.g., 'en-US' -> 'en')
      const langCode = browserLang.split('-')[0].toLowerCase();
      
      // Map to supported languages
      const supportedLanguages: Record<string, SupportedLanguage> = {
        'en': 'en',
        'es': 'es',
        'fr': 'fr'
      };
      
      const detectedLang = supportedLanguages[langCode] || 'en';
      logger.debug('Browser language detection', { 
        browserLang, 
        langCode, 
        detectedLang 
      });
      
      return detectedLang;
    } catch (error) {
      logger.warn('Error detecting browser language, using default', { error });
      return 'en';
    }
  }, []);

  const initializeLanguage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Skip API calls on public routes
      if (isPublicRoute()) {
        const storedLanguage = getStoredLanguage();
        const browserLang = detectBrowserLanguage();
        const resolvedLanguage = storedLanguage || browserLang;
        setLanguage(resolvedLanguage);
        logger.info('Public route detected, using stored or browser language', { 
          route: window.location.pathname,
          storedLanguage,
          language: resolvedLanguage
        });
        setIsLoading(false);
        return;
      }
      
      // Check if user is authenticated with a valid token
      if (!isTokenValid()) {
        // User not logged in or token expired, use browser language
        const storedLanguage = getStoredLanguage();
        const browserLang = detectBrowserLanguage();
        const resolvedLanguage = storedLanguage || browserLang;
        setLanguage(resolvedLanguage);
        logger.info('User not authenticated, using stored or browser language', { 
          storedLanguage,
          language: resolvedLanguage 
        });
        setIsLoading(false);
        return;
      }

      try {
        // Try to get user profile (only if token is valid and not on public route)
        const profile = await getProfile();
        const profileLanguage = profile.language as SupportedLanguage;
        
        // Validate that the profile language is supported
        const supportedLanguages: SupportedLanguage[] = ['en', 'es', 'fr'];
        if (supportedLanguages.includes(profileLanguage)) {
          setLanguage(profileLanguage);
          try {
            localStorage.setItem('userLanguage', profileLanguage);
          } catch (e) {
            // localStorage not available or error
          }
          logger.info('Using user profile language', { language: profileLanguage });
        } else {
          // Profile has unsupported language, fall back to browser
          const storedLanguage = getStoredLanguage();
          const browserLang = detectBrowserLanguage();
          const resolvedLanguage = storedLanguage || browserLang;
          setLanguage(resolvedLanguage);
          logger.warn('Profile language not supported, using stored or browser language', { 
            profileLanguage,
            storedLanguage,
            fallbackLanguage: resolvedLanguage 
          });
        }
      } catch (profileError) {
        // Profile fetch failed, use browser language
        const storedLanguage = getStoredLanguage();
        const browserLang = detectBrowserLanguage();
        const resolvedLanguage = storedLanguage || browserLang;
        setLanguage(resolvedLanguage);
        logger.warn('Failed to fetch user profile, using stored or browser language', { 
          error: profileError,
          storedLanguage,
          fallbackLanguage: resolvedLanguage 
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize language';
      setError(errorMessage);
      logger.error('Language initialization failed', { error: errorMessage });
      
      // Fallback to browser language even on error
      const browserLang = detectBrowserLanguage();
      setLanguage(browserLang);
    } finally {
      setIsLoading(false);
    }
  }, [detectBrowserLanguage, isPublicRoute, getStoredLanguage]);

  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  return {
    language,
    isLoading,
    error
  };
};
