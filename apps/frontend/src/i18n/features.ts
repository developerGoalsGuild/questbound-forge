export type Language = 'en' | 'es' | 'fr';

export interface FeaturesTranslations {
  title: string;
  subtitle: string;
  goalTracking: { 
    title: string; 
    description: string;
    badge?: string;
    tags?: string[];
    learnMore?: string;
  };
  community: { 
    title: string; 
    description: string;
    badge?: string;
    tags?: string[];
    learnMore?: string;
  };
  gamification: { 
    title: string; 
    description: string;
    badge?: string;
    tags?: string[];
    learnMore?: string;
  };
  patronage: { 
    title: string; 
    description: string;
    badge?: string;
    tags?: string[];
    learnMore?: string;
  };
  aiInsights?: {
    title: string;
    description: string;
    badge?: string;
    tags?: string[];
    learnMore?: string;
  };
  progressTracking?: {
    title: string;
    description: string;
    badge?: string;
    tags?: string[];
    learnMore?: string;
  };
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
    goalTracking: { 
      title: 'Quest Management', 
      description: 'Set, track and achieve your goals.',
      badge: 'AI-Powered',
      tags: ['NLP Processing', 'Task Breakdown', 'Progress Tracking'],
      learnMore: '#',
    },
    community: { 
      title: 'Guild Community', 
      description: 'Connect, share and support each other.',
      badge: 'Smart Algorithm',
      tags: ['AI Matching', 'Skill Analysis', 'Goal Alignment'],
      learnMore: '#',
    },
    gamification: { 
      title: 'Honor & Achievements', 
      description: 'Earn badges and celebrate milestones.',
      badge: 'Engaging',
      tags: ['XP System', 'Badges', 'Leaderboards'],
      learnMore: '#',
    },
    patronage: { 
      title: 'Noble Patronage', 
      description: 'Support the community and unlock benefits.',
      learnMore: '#',
    },
    aiInsights: {
      title: 'AI-Powered Insights',
      description: 'Get personalized recommendations, progress analysis, and AI-generated inspirational content to optimize your goal achievement strategy.',
      badge: 'Intelligent',
      tags: ['ML Analytics', 'Predictions', 'Personalization'],
      learnMore: '#',
    },
    progressTracking: {
      title: 'Progress Tracking',
      description: 'Visual dashboards, milestone tracking, and detailed analytics help you understand your patterns and celebrate achievements.',
      badge: 'Analytics',
      tags: ['Dashboards', 'Milestones', 'Analytics'],
      learnMore: '#',
    },
    cta: {
      title: 'Ready to Begin Your Adventure?',
      subtitle: 'Join thousands of adventurers already achieving their goals together.',
      button: 'Start Your Journey',
    },
  },
  es: {
    title: 'Funciones del Gremio',
    subtitle: 'Herramientas para lograr grandes cosas.',
    goalTracking: { 
      title: 'Gestión de misiones', 
      description: 'Define, sigue y logra tus metas.',
      badge: 'Impulsado por IA',
      tags: ['Procesamiento NLP', 'Desglose de tareas', 'Seguimiento de progreso'],
      learnMore: '#',
    },
    community: { 
      title: 'Comunidad del Gremio', 
      description: 'Conecta, comparte y apoya.',
      badge: 'Algoritmo inteligente',
      tags: ['Coincidencias IA', 'Análisis de habilidades', 'Alineación de metas'],
      learnMore: '#',
    },
    gamification: { 
      title: 'Honores y logros', 
      description: 'Gana insignias y celebra hitos.',
      badge: 'Atractivo',
      tags: ['Sistema XP', 'Insignias', 'Tablas de clasificación'],
      learnMore: '#',
    },
    patronage: { 
      title: 'Mecenazgo', 
      description: 'Apoya a la comunidad y desbloquea beneficios.',
      learnMore: '#',
    },
    aiInsights: {
      title: 'Insights impulsados por IA',
      description: 'Obtén recomendaciones personalizadas, análisis de progreso y contenido inspiracional generado por IA para optimizar tu estrategia de logro de metas.',
      badge: 'Inteligente',
      tags: ['Análisis ML', 'Predicciones', 'Personalización'],
      learnMore: '#',
    },
    progressTracking: {
      title: 'Seguimiento de progreso',
      description: 'Los tableros visuales, el seguimiento de hitos y los análisis detallados te ayudan a entender tus patrones y celebrar logros.',
      badge: 'Análisis',
      tags: ['Tableros', 'Hitos', 'Análisis'],
      learnMore: '#',
    },
    cta: {
      title: '¿Listo para comenzar tu aventura?',
      subtitle: 'Únete a miles de aventureros que ya están logrando sus metas juntos.',
      button: 'Comienza tu viaje',
    },
  },
  fr: {
    title: 'Fonctionnalités de la Guilde',
    subtitle: 'Des outils pour réussir ensemble.',
    goalTracking: { 
      title: 'Gestion des quêtes', 
      description: 'Définir, suivre et réussir.',
      badge: 'Alimenté par IA',
      tags: ['Traitement NLP', 'Décomposition des tâches', 'Suivi des progrès'],
      learnMore: '#',
    },
    community: { 
      title: 'Communauté de la Guilde', 
      description: 'Se connecter, partager, soutenir.',
      badge: 'Algorithme intelligent',
      tags: ['Correspondances IA', 'Analyse des compétences', 'Alignement des objectifs'],
      learnMore: '#',
    },
    gamification: { 
      title: 'Honneurs & succès', 
      description: 'Gagner des badges et célébrer.',
      badge: 'Engageant',
      tags: ['Système XP', 'Badges', 'Classements'],
      learnMore: '#',
    },
    patronage: { 
      title: 'Mécénat', 
      description: 'Soutenir et débloquer des avantages.',
      learnMore: '#',
    },
    aiInsights: {
      title: 'Insights alimentés par IA',
      description: 'Obtenez des recommandations personnalisées, une analyse des progrès et du contenu inspirant généré par IA pour optimiser votre stratégie de réalisation d\'objectifs.',
      badge: 'Intelligent',
      tags: ['Analytique ML', 'Prédictions', 'Personnalisation'],
      learnMore: '#',
    },
    progressTracking: {
      title: 'Suivi des progrès',
      description: 'Les tableaux de bord visuels, le suivi des jalons et les analyses détaillées vous aident à comprendre vos modèles et à célébrer les réalisations.',
      badge: 'Analytique',
      tags: ['Tableaux de bord', 'Jalons', 'Analyses'],
      learnMore: '#',
    },
    cta: {
      title: 'Prêt à commencer votre aventure ?',
      subtitle: 'Rejoignez des milliers d\'aventuriers qui réalisent déjà leurs objectifs ensemble.',
      button: 'Commencez votre voyage',
    },
  },
};
