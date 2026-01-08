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
  const [language, setLanguage] = useState<Language>('en');
  const { language: detectedLanguage, isLoading, error } = useLanguageInitialization();

  // Update language when detection completes
  useEffect(() => {
    if (!isLoading && detectedLanguage) {
      setLanguage(detectedLanguage);
    }
  }, [detectedLanguage, isLoading]);

  // Log any initialization errors
  useEffect(() => {
    if (error) {
      console.warn('Language initialization error:', error);
    }
  }, [error]);

  // Async changeLanguage function for compatibility with useLanguage hook
  const changeLanguage = async (lang: Language): Promise<void> => {
    setLanguage(lang);
  };
  
  const value = {
    language,
    setLanguage,
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
