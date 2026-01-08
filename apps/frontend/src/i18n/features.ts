export type Language = 'en' | 'es' | 'fr';

export interface FeaturesTranslations {
  title: string;
  subtitle: string;
  goalTracking: { title: string; description: string };
  community: { title: string; description: string };
  gamification: { title: string; description: string };
  patronage: { title: string; description: string };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
}

export const featuresTranslations: Record<Language, FeaturesTranslations> = {
  en: {
    title: 'Guild Features',
    subtitle: 'Tools that help your community achieve greatness.',
    goalTracking: { title: 'Quest Management', description: 'Set, track and achieve your goals.' },
    community: { title: 'Guild Community', description: 'Connect, share and support each other.' },
    gamification: { title: 'Honor & Achievements', description: 'Earn badges and celebrate milestones.' },
    patronage: { title: 'Noble Patronage', description: 'Support the community and unlock benefits.' },
    cta: {
      title: 'Ready to Begin Your Adventure?',
      subtitle: 'Join thousands of adventurers already achieving their goals together.',
      button: 'Start Your Journey',
    },
  },
  es: {
    title: 'Funciones del Gremio',
    subtitle: 'Herramientas para lograr grandes cosas.',
    goalTracking: { title: 'Gestión de misiones', description: 'Define, sigue y logra tus metas.' },
    community: { title: 'Comunidad del Gremio', description: 'Conecta, comparte y apoya.' },
    gamification: { title: 'Honores y logros', description: 'Gana insignias y celebra hitos.' },
    patronage: { title: 'Mecenazgo', description: 'Apoya a la comunidad y desbloquea beneficios.' },
    cta: {
      title: '¿Listo para comenzar tu aventura?',
      subtitle: 'Únete a miles de aventureros que ya están logrando sus metas juntos.',
      button: 'Comienza tu viaje',
    },
  },
  fr: {
    title: 'Fonctionnalités de la Guilde',
    subtitle: 'Des outils pour réussir ensemble.',
    goalTracking: { title: 'Gestion des quêtes', description: 'Définir, suivre et réussir.' },
    community: { title: 'Communauté de la Guilde', description: 'Se connecter, partager, soutenir.' },
    gamification: { title: 'Honneurs & succès', description: 'Gagner des badges et célébrer.' },
    patronage: { title: 'Mécénat', description: 'Soutenir et débloquer des avantages.' },
    cta: {
      title: 'Prêt à commencer votre aventure ?',
      subtitle: 'Rejoignez des milliers d\'aventuriers qui réalisent déjà leurs objectifs ensemble.',
      button: 'Commencez votre voyage',
    },
  },
};
