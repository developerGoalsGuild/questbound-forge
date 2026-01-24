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
import type { GoalListTranslations } from './goalList';
import type { GoalEditTranslations } from './goalEdit';
import type { GoalCreationTranslations } from './goalCreation';
import type { GoalActionsTranslations } from './goalActions';
import type { GoalDashboardTranslations } from './goalDashboard';
import type { GoalDetailsTranslations } from './goalDetails';
import type { HeaderTranslations } from '@/models/header';
import type { QuestTranslations } from './quest';
import type { CollaborationsTranslations } from './collaborations';
import type { CommonTranslations } from './common';
import type { GuildTranslations } from './guild';
import type { SubscriptionTranslations } from './subscription';
import type { LandingPageTranslations } from './landingPage';
import type { CommunityTranslations } from './community';
import type { ContactTranslations } from './contact';
import type { AboutTranslations } from './about';
import type { BlogTranslations } from './blog';
import type { HelpTranslations } from './help';
import type { PrivacyTranslations } from './privacy';
import type { TermsTranslations } from './terms';

import { navTranslations } from './nav';
import { communityTranslations } from './community';
import { contactTranslations } from './contact';
import { loginTranslations } from './login';
import { heroTranslations } from './hero';
import { featuresTranslations } from './features';
import { dashboardTranslations } from './dashboard';
import { goalsTranslations } from './goals';
import { signupTranslations } from './signup';
import { profileTranslations } from './profile';
import { commonTranslations } from './common';
import { goalListTranslations } from './goalList';
import { goalEditTranslations } from './goalEdit';
import { goalCreationTranslations } from './goalCreation';
import { goalActionsTranslations } from './goalActions';
import { goalDashboardTranslations } from './goalDashboard';
import { goalDetailsTranslations } from './goalDetails';
import { headerTranslations } from './header';
import { questTranslations } from './quest';
import { collaborationsTranslations } from './collaborations';
import { guildTranslations } from './guild';
import { subscriptionTranslations } from './subscription';
import { landingPageTranslations } from './landingPage';
import { aboutTranslations } from './about';
import { blogTranslations } from './blog';
import { helpTranslations } from './help';
import { privacyTranslations } from './privacy';
import { termsTranslations } from './terms';
import { gamificationTranslations } from './gamification';

export type Language = 'en' | 'es' | 'fr';

/**
 * Main translation interface combining all page-specific translations.
 * All keys must be present in all languages.
 */
export type Translations = { [key: string]: any } & {
  profile: ProfileTranslations;
  goalList: GoalListTranslations;
  goalEdit: GoalEditTranslations;
  goalCreation: GoalCreationTranslations;
  goalActions: GoalActionsTranslations;
  goalDashboard: GoalDashboardTranslations;
  goalDetails: GoalDetailsTranslations;
  header: HeaderTranslations;
  quest: QuestTranslations;
  guild: GuildTranslations;
  subscription: SubscriptionTranslations;
  common: CommonTranslations;
  problemRecognition: LandingPageTranslations['problemRecognition'];
  empathy: LandingPageTranslations['empathy'];
  solutionIntro: LandingPageTranslations['solutionIntro'];
  howItWorks: LandingPageTranslations['howItWorks'];
  featureCarousel: LandingPageTranslations['featureCarousel'];
  developmentNotice: LandingPageTranslations['developmentNotice'];
  waitlist: LandingPageTranslations['waitlist'];
  community: CommunityTranslations;
  contact: ContactTranslations;
  about: AboutTranslations;
  blog: BlogTranslations;
  help: HelpTranslations;
  privacy: PrivacyTranslations;
  terms: TermsTranslations;
  gamification: typeof gamificationTranslations.en.gamification;
} & CollaborationsTranslations;

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
    goals: goalsTranslations.en,
    signup: signupTranslations.en,
    profile: profileTranslations.en,
    goalList: goalListTranslations.en,
    goalEdit: goalEditTranslations.en,
    goalCreation: goalCreationTranslations.en,
    goalActions: goalActionsTranslations.en,
    goalDashboard: goalDashboardTranslations.en,
    goalDetails: goalDetailsTranslations.en,
    header: headerTranslations.en,
    quest: questTranslations.en,
    guild: guildTranslations.en,
    subscription: subscriptionTranslations.en.subscription,
    ...collaborationsTranslations.en,
    common: commonTranslations.en,
    problemRecognition: landingPageTranslations.en.problemRecognition,
    empathy: landingPageTranslations.en.empathy,
    solutionIntro: landingPageTranslations.en.solutionIntro,
    howItWorks: landingPageTranslations.en.howItWorks,
    featureCarousel: landingPageTranslations.en.featureCarousel,
    developmentNotice: landingPageTranslations.en.developmentNotice,
    waitlist: landingPageTranslations.en.waitlist,
    community: communityTranslations.en,
    contact: contactTranslations.en,
    about: aboutTranslations.en,
    blog: blogTranslations.en,
    help: helpTranslations.en,
    privacy: privacyTranslations.en,
    terms: termsTranslations.en,
    gamification: gamificationTranslations.en.gamification,
  },
  es: {
    ...navTranslations.es,
    ...loginTranslations.es,
    ...heroTranslations.es,
    ...featuresTranslations.es,
    ...dashboardTranslations.es,
    ...goalsTranslations.es,
    goals: goalsTranslations.es,
    signup: signupTranslations.es,
    profile: profileTranslations.es,
    goalList: goalListTranslations.es,
    goalEdit: goalEditTranslations.es,
    goalCreation: goalCreationTranslations.es,
    goalActions: goalActionsTranslations.es,
    goalDashboard: goalDashboardTranslations.es,
    goalDetails: goalDetailsTranslations.es,
    header: headerTranslations.es,
    quest: questTranslations.es,
    guild: guildTranslations.es,
    subscription: subscriptionTranslations.es.subscription,
    ...collaborationsTranslations.es,
    common: commonTranslations.es,
    problemRecognition: landingPageTranslations.es.problemRecognition,
    empathy: landingPageTranslations.es.empathy,
    solutionIntro: landingPageTranslations.es.solutionIntro,
    howItWorks: landingPageTranslations.es.howItWorks,
    featureCarousel: landingPageTranslations.es.featureCarousel,
    developmentNotice: landingPageTranslations.es.developmentNotice,
    waitlist: landingPageTranslations.es.waitlist,
    community: communityTranslations.es,
    contact: contactTranslations.es,
    about: aboutTranslations.es,
    blog: blogTranslations.es,
    help: helpTranslations.es,
    privacy: privacyTranslations.es,
    terms: termsTranslations.es,
    gamification: gamificationTranslations.es.gamification,
  },
  fr: {
    ...navTranslations.fr,
    ...loginTranslations.fr,
    ...heroTranslations.fr,
    ...featuresTranslations.fr,
    ...dashboardTranslations.fr,
    ...goalsTranslations.fr,
    goals: goalsTranslations.fr,
    signup: signupTranslations.fr,
    profile: profileTranslations.fr,
    goalList: goalListTranslations.fr,
    goalEdit: goalEditTranslations.fr,
    goalCreation: goalCreationTranslations.fr,
    goalActions: goalActionsTranslations.fr,
    goalDashboard: goalDashboardTranslations.fr,
    goalDetails: goalDetailsTranslations.fr,
    header: headerTranslations.fr,
    quest: questTranslations.fr,
    guild: guildTranslations.fr,
    subscription: subscriptionTranslations.fr.subscription,
    ...collaborationsTranslations.fr,
    common: commonTranslations.fr,
    problemRecognition: landingPageTranslations.fr.problemRecognition,
    empathy: landingPageTranslations.fr.empathy,
    solutionIntro: landingPageTranslations.fr.solutionIntro,
    howItWorks: landingPageTranslations.fr.howItWorks,
    featureCarousel: landingPageTranslations.fr.featureCarousel,
    developmentNotice: landingPageTranslations.fr.developmentNotice,
    waitlist: landingPageTranslations.fr.waitlist,
    community: communityTranslations.fr,
    contact: contactTranslations.fr,
    about: aboutTranslations.fr,
    blog: blogTranslations.fr,
    help: helpTranslations.fr,
    privacy: privacyTranslations.fr,
    terms: termsTranslations.fr,
    gamification: gamificationTranslations.fr.gamification,
  },
};