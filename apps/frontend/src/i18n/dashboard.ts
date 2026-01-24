export type Language = 'en' | 'es' | 'fr';

export interface DashboardTranslations {
  user: {
    title: string;
    welcome: string;
    goals: string;
    progress: string;
    community: string;
    achievements: string;
    selectorLabel: string;
    selectorDescription: string;
    stats: {
      activeQuests: string;
      achievements: string;
      guildPoints: string;
      successRate: string;
    };
    progressMetrics: {
      overall: string;
      taskProgress: string;
      timeProgress: string;
      completedTasks: string;
    };
    noAchievements: string;
    completeQuestsMessage: string;
    achievement: string;
  };
  partner: {
    title: string;
    selectorLabel: string;
    selectorDescription: string;
    services: string;
    analytics: string;
    engagement: string;
    revenue: string;
  };
  patron: {
    title: string;
    selectorLabel: string;
    selectorDescription: string;
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
      selectorLabel: 'Adventurer',
      selectorDescription: 'Personal goal tracking',
      stats: {
        activeQuests: 'Active Quests',
        achievements: 'Achievements',
        guildPoints: 'Guild Points',
        successRate: 'Success Rate',
      },
      progressMetrics: {
        overall: 'Overall Progress',
        taskProgress: 'Task Progress',
        timeProgress: 'Time Progress',
        completedTasks: 'Completed Tasks',
      },
      noAchievements: 'No achievements earned yet',
      completeQuestsMessage: 'Complete quests to earn badges and achievements',
      achievement: 'Achievement',
    },
    partner: {
      title: "Merchant's Quarters",
      selectorLabel: 'Partner Company',
      selectorDescription: 'Business services',
      services: 'Your Services',
      analytics: 'Business Analytics',
      engagement: 'User Engagement',
      revenue: 'Revenue Streams',
    },
    patron: {
      title: "Noble's Court",
      selectorLabel: 'Noble Patron',
      selectorDescription: 'Community support',
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
      selectorLabel: 'Aventurero',
      selectorDescription: 'Seguimiento de objetivos personales',
      stats: {
        activeQuests: 'Misiones activas',
        achievements: 'Logros',
        guildPoints: 'Puntos del gremio',
        successRate: 'Tasa de éxito',
      },
      progressMetrics: {
        overall: 'Progreso general',
        taskProgress: 'Progreso de tareas',
        timeProgress: 'Progreso de tiempo',
        completedTasks: 'Tareas completadas',
      },
      noAchievements: 'Aún no has obtenido logros',
      completeQuestsMessage: 'Completa misiones para ganar insignias y logros',
      achievement: 'Logro',
    },
    partner: {
      title: 'Barrio del Comerciante',
      selectorLabel: 'Empresa Socia',
      selectorDescription: 'Servicios empresariales',
      services: 'Tus servicios',
      analytics: 'Analíticas',
      engagement: 'Participación',
      revenue: 'Ingresos',
    },
    patron: {
      title: 'Corte del Noble',
      selectorLabel: 'Mecenas Noble',
      selectorDescription: 'Apoyo a la comunidad',
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
      selectorLabel: 'Aventurier',
      selectorDescription: 'Suivi des objectifs personnels',
      stats: {
        activeQuests: 'Quêtes actives',
        achievements: 'Réalisations',
        guildPoints: 'Points de guilde',
        successRate: 'Taux de réussite',
      },
      progressMetrics: {
        overall: 'Progrès global',
        taskProgress: 'Progrès des tâches',
        timeProgress: 'Progrès temporel',
        completedTasks: 'Tâches complétées',
      },
      noAchievements: 'Aucune réalisation obtenue pour le moment',
      completeQuestsMessage: 'Complétez des quêtes pour gagner des badges et des réalisations',
      achievement: 'Réalisation',
    },
    partner: {
      title: 'Quartier du marchand',
      selectorLabel: 'Entreprise Partenaire',
      selectorDescription: 'Services professionnels',
      services: 'Vos services',
      analytics: 'Analyses',
      engagement: 'Engagement',
      revenue: 'Revenus',
    },
    patron: {
      title: 'Cour du noble',
      selectorLabel: 'Mécène Noble',
      selectorDescription: 'Soutien à la communauté',
      contributions: 'Votre mécénat',
      impact: 'Impact',
      benefits: 'Avantages',
      community: 'Communauté des mécènes',
    },
  },
};
