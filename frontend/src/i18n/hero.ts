export type Language = 'en' | 'es' | 'fr';

export interface HeroTranslations {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: {
    activeAdventurers: string;
    goalsAchieved: string;
    partnerGuilds: string;
  };
}

export const heroTranslations: Record<Language, HeroTranslations> = {
  en: {
    title: 'Unite in Purpose, Achieve Together',
    subtitle: 'Join a medieval-inspired community where goals become quests and progress is celebrated.',
    ctaPrimary: 'Begin Your Quest',
    ctaSecondary: 'Explore Features',
    stats: {
      activeAdventurers: 'Active Adventurers',
      goalsAchieved: 'Goals Achieved',
      partnerGuilds: 'Partner Guilds',
    },
  },
  es: {
    title: 'Únete en propósito, logremos juntos',
    subtitle: 'Una comunidad inspirada en lo medieval donde las metas se vuelven misiones.',
    ctaPrimary: 'Comienza tu misión',
    ctaSecondary: 'Explorar funciones',
    stats: {
      activeAdventurers: 'Aventureros activos',
      goalsAchieved: 'Metas logradas',
      partnerGuilds: 'Gremios asociados',
    },
  },
  fr: {
    title: 'Unis dans le but, réussir ensemble',
    subtitle: 'Une communauté médiévale où les objectifs deviennent des quêtes.',
    ctaPrimary: 'Commencer la quête',
    ctaSecondary: 'Découvrir les fonctions',
    stats: {
      activeAdventurers: 'Aventuriers actifs',
      goalsAchieved: 'Objectifs atteints',
      partnerGuilds: 'Guildes partenaires',
    },
  },
};
