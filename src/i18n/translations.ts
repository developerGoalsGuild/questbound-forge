// Multilingual translation framework for the goal collaboration platform

export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    features: string;
    community: string;
    pricing: string;
    contact: string;
    login: string;
    signup: string;
    dashboard: string;
    logout: string;
  };

  // Hero section
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };

  // Features
  features: {
    title: string;
    subtitle: string;
    goalTracking: {
      title: string;
      description: string;
    };
    community: {
      title: string;
      description: string;
    };
    gamification: {
      title: string;
      description: string;
    };
    patronage: {
      title: string;
      description: string;
    };
  };

  // Dashboards
  dashboard: {
    user: {
      title: string;
      welcome: string;
      goals: string;
      progress: string;
      community: string;
      achievements: string;
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
  };

  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    close: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: "Home",
      features: "Features",
      community: "Community",
      pricing: "Pricing",
      contact: "Contact",
      login: "Sign In",
      signup: "Join Guild",
      dashboard: "Dashboard",
      logout: "Sign Out",
    },
    hero: {
      title: "Unite in Purpose, Achieve Together",
      subtitle: "Join a medieval-inspired community where goals become quests, progress is celebrated, and mutual support leads to extraordinary achievements.",
      ctaPrimary: "Begin Your Quest",
      ctaSecondary: "Explore Features",
    },
    features: {
      title: "Guild Features",
      subtitle: "Powerful tools to help you and your community achieve greatness together.",
      goalTracking: {
        title: "Quest Management",
        description: "Set, track, and achieve your personal and shared goals with our intuitive quest system.",
      },
      community: {
        title: "Guild Community",
        description: "Connect with like-minded adventurers, share knowledge, and support each other's journeys.",
      },
      gamification: {
        title: "Honor & Achievements",
        description: "Earn badges, climb leaderboards, and celebrate milestones in true medieval fashion.",
      },
      patronage: {
        title: "Noble Patronage",
        description: "Support the community and unlock exclusive benefits through our patronage program.",
      },
    },
    dashboard: {
      user: {
        title: "Adventurer's Hall",
        welcome: "Welcome back, brave adventurer!",
        goals: "Active Quests",
        progress: "Progress Overview",
        community: "Guild Activities",
        achievements: "Earned Honors",
      },
      partner: {
        title: "Merchant's Quarters",
        services: "Your Services",
        analytics: "Business Analytics",
        engagement: "User Engagement",
        revenue: "Revenue Streams",
      },
      patron: {
        title: "Noble's Court",
        contributions: "Your Patronage",
        impact: "Community Impact",
        benefits: "Exclusive Benefits",
        community: "Patron Community",
      },
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      success: "Success!",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      close: "Close",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      features: "Características",
      community: "Comunidad",
      pricing: "Precios",
      contact: "Contacto",
      login: "Iniciar Sesión",
      signup: "Unirse al Gremio",
      dashboard: "Panel",
      logout: "Cerrar Sesión",
    },
    hero: {
      title: "Únete en Propósito, Logra Juntos",
      subtitle: "Únete a una comunidad inspirada en lo medieval donde las metas se convierten en misiones, el progreso se celebra y el apoyo mutuo lleva a logros extraordinarios.",
      ctaPrimary: "Comienza tu Misión",
      ctaSecondary: "Explorar Características",
    },
    features: {
      title: "Características del Gremio",
      subtitle: "Herramientas poderosas para ayudarte a ti y a tu comunidad a lograr grandeza juntos.",
      goalTracking: {
        title: "Gestión de Misiones",
        description: "Establece, rastrea y logra tus metas personales y compartidas con nuestro sistema intuitivo de misiones.",
      },
      community: {
        title: "Comunidad del Gremio",
        description: "Conecta con aventureros afines, comparte conocimiento y apoya los viajes de otros.",
      },
      gamification: {
        title: "Honor y Logros",
        description: "Gana insignias, escala tablas de clasificación y celebra hitos al verdadero estilo medieval.",
      },
      patronage: {
        title: "Patrocinio Noble",
        description: "Apoya la comunidad y desbloquea beneficios exclusivos a través de nuestro programa de patrocinio.",
      },
    },
    dashboard: {
      user: {
        title: "Salón del Aventurero",
        welcome: "¡Bienvenido de vuelta, valiente aventurero!",
        goals: "Misiones Activas",
        progress: "Resumen de Progreso",
        community: "Actividades del Gremio",
        achievements: "Honores Ganados",
      },
      partner: {
        title: "Cuartos del Mercader",
        services: "Tus Servicios",
        analytics: "Análisis de Negocio",
        engagement: "Participación de Usuarios",
        revenue: "Flujos de Ingresos",
      },
      patron: {
        title: "Corte del Noble",
        contributions: "Tu Patrocinio",
        impact: "Impacto en la Comunidad",
        benefits: "Beneficios Exclusivos",
        community: "Comunidad de Patrones",
      },
    },
    common: {
      loading: "Cargando...",
      error: "Ocurrió un error",
      success: "¡Éxito!",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      view: "Ver",
      close: "Cerrar",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      features: "Fonctionnalités",
      community: "Communauté",
      pricing: "Tarifs",
      contact: "Contact",
      login: "Se Connecter",
      signup: "Rejoindre la Guilde",
      dashboard: "Tableau de Bord",
      logout: "Se Déconnecter",
    },
    hero: {
      title: "Unis dans le But, Réussissez Ensemble",
      subtitle: "Rejoignez une communauté d'inspiration médiévale où les objectifs deviennent des quêtes, les progrès sont célébrés et le soutien mutuel mène à des réalisations extraordinaires.",
      ctaPrimary: "Commencer votre Quête",
      ctaSecondary: "Découvrir les Fonctionnalités",
    },
    features: {
      title: "Fonctionnalités de la Guilde",
      subtitle: "Des outils puissants pour vous aider, vous et votre communauté, à atteindre la grandeur ensemble.",
      goalTracking: {
        title: "Gestion des Quêtes",
        description: "Définissez, suivez et atteignez vos objectifs personnels et partagés avec notre système de quêtes intuitif.",
      },
      community: {
        title: "Communauté de la Guilde",
        description: "Connectez-vous avec des aventuriers partageant les mêmes idées, partagez des connaissances et soutenez les parcours des autres.",
      },
      gamification: {
        title: "Honneur et Réalisations",
        description: "Gagnez des badges, gravissez les classements et célébrez les jalons dans le vrai style médiéval.",
      },
      patronage: {
        title: "Mécénat Noble",
        description: "Soutenez la communauté et débloquez des avantages exclusifs grâce à notre programme de mécénat.",
      },
    },
    dashboard: {
      user: {
        title: "Salle de l'Aventurier",
        welcome: "Bon retour, brave aventurier !",
        goals: "Quêtes Actives",
        progress: "Aperçu des Progrès",
        community: "Activités de la Guilde",
        achievements: "Honneurs Gagnés",
      },
      partner: {
        title: "Quartiers du Marchand",
        services: "Vos Services",
        analytics: "Analyses Commerciales",
        engagement: "Engagement des Utilisateurs",
        revenue: "Sources de Revenus",
      },
      patron: {
        title: "Cour du Noble",
        contributions: "Votre Mécénat",
        impact: "Impact Communautaire",
        benefits: "Avantages Exclusifs",
        community: "Communauté des Mécènes",
      },
    },
    common: {
      loading: "Chargement...",
      error: "Une erreur s'est produite",
      success: "Succès !",
      save: "Sauvegarder",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      view: "Voir",
      close: "Fermer",
    },
  },
};