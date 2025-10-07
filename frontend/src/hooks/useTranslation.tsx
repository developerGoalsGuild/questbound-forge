import { createContext, useContext, useState, ReactNode } from 'react';
import { Language, Translations, translations } from '@/i18n/translations';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  
  const value = {
    language,
    setLanguage,
    t: translations[language],
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
        t: translations['en'],
      };
    }
    
    return context;
  } catch (error) {
    console.warn('Error in useTranslation, using fallback:', error);
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: translations['en'],
    };
  }
};
