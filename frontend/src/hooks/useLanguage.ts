import { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { updateProfile } from '@/lib/apiProfile';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type SupportedLanguage = 'en' | 'es' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const useLanguage = () => {
  const { t, changeLanguage } = useTranslation();

  const changeLanguagePreference = useCallback(async (language: SupportedLanguage) => {
    try {
      logger.debug('Changing language preference', { language });
      
      // Update user profile with new language preference
      await updateProfile({ language });
      
      // Change i18n language immediately
      await changeLanguage(language);
      
      // Get translations for success message
      const questTranslations = (t as any)?.quest;
      const successMessage = questTranslations?.notifications?.messages?.languageChanged || 'Language changed successfully';
      
      toast.success(successMessage);
      
      logger.info('Language changed successfully', { language });
    } catch (error) {
      logger.error('Failed to change language', { error, language });
      
      // Get translations for error message
      const commonTranslations = (t as any)?.common;
      const errorMessage = commonTranslations?.errors?.languageChangeFailed || 'Failed to change language';
      
      toast.error(errorMessage);
      throw error;
    }
  }, [changeLanguage, t]);

  const availableLanguages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' }
  ];

  return {
    changeLanguage: changeLanguagePreference,
    availableLanguages,
  };
};