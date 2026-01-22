import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language, Translations, translations } from '@/i18n/translations';
import { useLanguageInitialization } from './useLanguageInitialization';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  changeLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  isLanguageLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  // Check localStorage first for manually selected language
  const getStoredLanguage = (): Language => {
    try {
      const stored = localStorage.getItem('userLanguage');
      if (stored && (stored === 'en' || stored === 'es' || stored === 'fr')) {
        return stored as Language;
      }
    } catch (e) {
      // localStorage not available or error
    }
    return 'en';
  };

  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const { language: detectedLanguage, isLoading, error } = useLanguageInitialization();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Update language when detection completes (only on initial load)
  useEffect(() => {
    if (!isLoading && detectedLanguage && !hasInitialized) {
      setLanguage(detectedLanguage);
      try {
        localStorage.setItem('userLanguage', detectedLanguage);
      } catch (e) {
        // localStorage not available or error
      }
      setHasInitialized(true);
    }
  }, [detectedLanguage, isLoading, hasInitialized]);

  // Log any initialization errors
  useEffect(() => {
    if (error) {
      console.warn('Language initialization error:', error);
    }
  }, [error]);

  // Async changeLanguage function for compatibility with useLanguage hook
  const changeLanguage = async (lang: Language): Promise<void> => {
    setLanguage(lang);
    // Store in localStorage to persist across page reloads
    try {
      localStorage.setItem('userLanguage', lang);
    } catch (e) {
      // localStorage not available or error
    }
  };

  // Enhanced setLanguage that also stores in localStorage
  const setLanguageWithStorage = (lang: Language): void => {
    setLanguage(lang);
    // Store in localStorage to persist across page reloads
    try {
      localStorage.setItem('userLanguage', lang);
    } catch (e) {
      // localStorage not available or error
    }
  };
  
  const value = {
    language,
    setLanguage: setLanguageWithStorage,
    changeLanguage,
    t: translations[language],
    isLanguageLoading: isLoading,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  try {
    const context = useContext(TranslationContext);
    
    // Always return a fallback if context is not available
    if (!context) {
      console.warn('useTranslation must be used within TranslationProvider, using fallback');
      return {
        language: 'en' as Language,
        setLanguage: () => {},
        changeLanguage: async () => {},
        t: translations['en'],
        isLanguageLoading: false,
      };
    }
    
    return context;
  } catch (error) {
    console.warn('Error in useTranslation, using fallback:', error);
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      changeLanguage: async () => {},
      t: translations['en'],
      isLanguageLoading: false,
    };
  }
};
