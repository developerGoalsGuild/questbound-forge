import { useState, useEffect, useCallback } from 'react';
import { getProfile } from '@/lib/apiProfile';
import { getAccessToken } from '@/lib/utils';
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
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // Check if user is authenticated
      const token = getAccessToken();
      if (!token) {
        // User not logged in, use browser language
        const browserLang = detectBrowserLanguage();
        setLanguage(browserLang);
        logger.info('User not authenticated, using browser language', { language: browserLang });
        return;
      }

      try {
        // Try to get user profile
        const profile = await getProfile();
        const profileLanguage = profile.language as SupportedLanguage;
        
        // Validate that the profile language is supported
        const supportedLanguages: SupportedLanguage[] = ['en', 'es', 'fr'];
        if (supportedLanguages.includes(profileLanguage)) {
          setLanguage(profileLanguage);
          logger.info('Using user profile language', { language: profileLanguage });
        } else {
          // Profile has unsupported language, fall back to browser
          const browserLang = detectBrowserLanguage();
          setLanguage(browserLang);
          logger.warn('Profile language not supported, using browser language', { 
            profileLanguage, 
            fallbackLanguage: browserLang 
          });
        }
      } catch (profileError) {
        // Profile fetch failed, use browser language
        const browserLang = detectBrowserLanguage();
        setLanguage(browserLang);
        logger.warn('Failed to fetch user profile, using browser language', { 
          error: profileError, 
          fallbackLanguage: browserLang 
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
  }, [detectBrowserLanguage]);

  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  return {
    language,
    isLoading,
    error
  };
};
