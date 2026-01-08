export type Language = 'en' | 'es' | 'fr';

export interface DashboardTranslations {
  user: {
    title: string;
    welcome: string;
    goals: string;
    progress: string;
    community: string;
    achievements: string;
    stats: {
      activeQuests: string;
      achievements: string;
      guildPoints: string;
    };
  };
  partner: {
    title: string;
    services: string;
    analytics: string;
    engagement: string;
    revenue: string;
  };
  patron: {
    title: string;
    contributions: string;
    impact: string;
    benefits: string;
    community: string;
  };
}

export const dashboardTranslations: Record<Language, DashboardTranslations> = {
  en: {
    user: {
      title: "Adventurer's Hall",
      welcome: 'Welcome back!',
      goals: 'Active Quests',
      progress: 'Progress Overview',
      community: 'Guild Activities',
      achievements: 'Earned Honors',
      stats: {
        activeQuests: 'Active Quests',
        achievements: 'Achievements',
        guildPoints: 'Guild Points',
      },
    },
    partner: {
      title: "Merchant's Quarters",
      services: 'Your Services',
      analytics: 'Business Analytics',
      engagement: 'User Engagement',
      revenue: 'Revenue Streams',
    },
    patron: {
      title: "Noble's Court",
      contributions: 'Your Patronage',
      impact: 'Community Impact',
      benefits: 'Exclusive Benefits',
      community: 'Patron Community',
    },
  },
  es: {
    user: {
      title: 'Sala del Aventurero',
      welcome: '¡Bienvenido de nuevo!',
      goals: 'Misiones activas',
      progress: 'Resumen de progreso',
      community: 'Actividades del gremio',
      achievements: 'Honores ganados',
      stats: {
        activeQuests: 'Misiones activas',
        achievements: 'Logros',
        guildPoints: 'Puntos del gremio',
      },
    },
    partner: {
      title: 'Barrio del Comerciante',
      services: 'Tus servicios',
      analytics: 'Analíticas',
      engagement: 'Participación',
      revenue: 'Ingresos',
    },
    patron: {
      title: 'Corte del Noble',
      contributions: 'Tu mecenazgo',
      impact: 'Impacto',
      benefits: 'Beneficios',
      community: 'Comunidad de mecenas',
    },
  },
  fr: {
    user: {
      title: "Salle de l'Aventurier",
      welcome: 'Bon retour !',
      goals: 'Quêtes actives',
      progress: 'Aperçu des progrès',
      community: 'Activités de la guilde',
      achievements: 'Honneurs',
      stats: {
        activeQuests: 'Quêtes actives',
        achievements: 'Réalisations',
        guildPoints: 'Points de guilde',
      },
    },
    partner: {
      title: 'Quartier du marchand',
      services: 'Vos services',
      analytics: 'Analyses',
      engagement: 'Engagement',
      revenue: 'Revenus',
    },
    patron: {
      title: 'Cour du noble',
      contributions: 'Votre mécénat',
      impact: 'Impact',
      benefits: 'Avantages',
      community: 'Communauté des mécènes',
    },
  },
};
