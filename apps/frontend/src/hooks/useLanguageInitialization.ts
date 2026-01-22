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
      
<<<<<<< HEAD
      // Always check stored language first - it takes priority over everything
      const storedLanguage = getStoredLanguage();
      
=======
>>>>>>> d8129db (Update environment configuration: Add Stripe keys and price IDs for subscription management, enhance language initialization logic to prioritize stored or browser language, and improve profile edit translations. Remove obsolete test file for ProfileEdit component.)
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
<<<<<<< HEAD
        // User not logged in or token expired, use stored or browser language
=======
        // User not logged in or token expired, use browser language
        const storedLanguage = getStoredLanguage();
>>>>>>> d8129db (Update environment configuration: Add Stripe keys and price IDs for subscription management, enhance language initialization logic to prioritize stored or browser language, and improve profile edit translations. Remove obsolete test file for ProfileEdit component.)
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

      // If we have a stored language, use it immediately (don't wait for profile fetch)
      if (storedLanguage) {
        setLanguage(storedLanguage);
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
<<<<<<< HEAD
          // Profile has unsupported language, fall back to stored or browser
=======
          // Profile has unsupported language, fall back to browser
          const storedLanguage = getStoredLanguage();
>>>>>>> d8129db (Update environment configuration: Add Stripe keys and price IDs for subscription management, enhance language initialization logic to prioritize stored or browser language, and improve profile edit translations. Remove obsolete test file for ProfileEdit component.)
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
<<<<<<< HEAD
        // Profile fetch failed, use stored language (already set above) or browser language
        // Don't change language if we already set it from storedLanguage
        if (!storedLanguage) {
          const browserLang = detectBrowserLanguage();
          setLanguage(browserLang);
        }
        logger.warn('Failed to fetch user profile, using stored or browser language', { 
          error: profileError,
          storedLanguage,
          fallbackLanguage: storedLanguage || detectBrowserLanguage()
=======
        // Profile fetch failed, use browser language
        const storedLanguage = getStoredLanguage();
        const browserLang = detectBrowserLanguage();
        const resolvedLanguage = storedLanguage || browserLang;
        setLanguage(resolvedLanguage);
        logger.warn('Failed to fetch user profile, using stored or browser language', { 
          error: profileError,
          storedLanguage,
          fallbackLanguage: resolvedLanguage 
>>>>>>> d8129db (Update environment configuration: Add Stripe keys and price IDs for subscription management, enhance language initialization logic to prioritize stored or browser language, and improve profile edit translations. Remove obsolete test file for ProfileEdit component.)
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize language';
      setError(errorMessage);
      logger.error('Language initialization failed', { error: errorMessage });
      
      // Fallback to stored language first, then browser language
      const storedLanguage = getStoredLanguage();
      const browserLang = detectBrowserLanguage();
      setLanguage(storedLanguage || browserLang);
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
