/*
  Translation files have been reorganized according to pages/components for better maintainability.

  Structure:
  - nav.ts: Navigation-related translations
  - login.ts: Login page translations
  - hero.ts: Hero section translations
  - features.ts: Features section translations
  - dashboard.ts: Dashboard translations for all user types
  - goals.ts: Goals page translations (largest section)
  - signup.ts: Signup page translations
  - common.ts: Common/shared translations

  This main file now imports and combines all page-specific translation files.
  Each page/component should import only the translations it needs.
*/

import type { NavTranslations } from './nav';
import type { LoginTranslations } from './login';
import type { HeroTranslations } from './hero';
import type { FeaturesTranslations } from './features';
import type { DashboardTranslations } from './dashboard';
import type { GoalsTranslations } from './goals';
import type { SignupTranslations } from './signup';
import type { ProfileTranslations } from './profile';
import type { CommonTranslations } from './common';

import { navTranslations } from './nav';
import { loginTranslations } from './login';
import { heroTranslations } from './hero';
import { featuresTranslations } from './features';
import { dashboardTranslations } from './dashboard';
import { goalsTranslations } from './goals';
import { signupTranslations } from './signup';
import { profileTranslations } from './profile';
import { commonTranslations } from './common';

export type Language = 'en' | 'es' | 'fr';

/**
 * Main translation interface combining all page-specific translations.
 * All keys must be present in all languages.
 */
export type Translations = { [key: string]: any } & { profile: ProfileTranslations };

/**
 * Combined translations from all page-specific files
 */
export const translations: Record<Language, Translations> = {
  en: {
    ...navTranslations.en,
    ...loginTranslations.en,
    ...heroTranslations.en,
    ...featuresTranslations.en,
    ...dashboardTranslations.en,
    ...goalsTranslations.en,
    ...signupTranslations.en,
    profile: profileTranslations.en,
    ...commonTranslations.en,
  },
  es: {
    ...navTranslations.es,
    ...loginTranslations.es,
    ...heroTranslations.es,
    ...featuresTranslations.es,
    ...dashboardTranslations.es,
    ...goalsTranslations.es,
    ...signupTranslations.es,
    profile: profileTranslations.es,
    ...commonTranslations.es,
  },
  fr: {
    ...navTranslations.fr,
    ...loginTranslations.fr,
    ...heroTranslations.fr,
    ...featuresTranslations.fr,
    ...dashboardTranslations.fr,
    ...goalsTranslations.fr,
    ...signupTranslations.fr,
    profile: profileTranslations.fr,
    ...commonTranslations.fr,
  },
};