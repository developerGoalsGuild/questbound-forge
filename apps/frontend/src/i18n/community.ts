export type Language = 'en' | 'es' | 'fr';

export interface CommunityTranslations {
  title: string;
  subtitle: string;
  stats: {
    activeMembers: string;
    guildsCreated: string;
    goalsCompleted: string;
    messagesShared: string;
  };
  features: {
    joinGuilds: {
      title: string;
      description: string;
    };
    activeDiscussions: {
      title: string;
      description: string;
    };
    leaderboards: {
      title: string;
      description: string;
    };
    sharedProgress: {
      title: string;
      description: string;
    };
  };
  cta: {
    title: string;
    subtitle: string;
    joinNow: string;
    exploreGuilds: string;
  };
}

export const communityTranslations: Record<Language, CommunityTranslations> = {
  en: {
    title: 'Join a Thriving Community',
    subtitle: 'Connect with thousands of adventurers who are achieving their goals together. Share your journey, get support, and celebrate wins as a community.',
    stats: {
      activeMembers: 'Active Members',
      guildsCreated: 'Guilds Created',
      goalsCompleted: 'Goals Completed',
      messagesShared: 'Messages Shared',
    },
    features: {
      joinGuilds: {
        title: 'Join Guilds',
        description: 'Connect with like-minded adventurers in specialized guilds focused on your interests and goals.',
      },
      activeDiscussions: {
        title: 'Active Discussions',
        description: 'Engage in meaningful conversations, share progress, and get support from fellow members.',
      },
      leaderboards: {
        title: 'Leaderboards',
        description: 'Compete in friendly challenges and see how you rank among your peers.',
      },
      sharedProgress: {
        title: 'Shared Progress',
        description: 'Celebrate achievements together and inspire others with your journey.',
      },
    },
    cta: {
      title: 'Ready to Join the Guild?',
      subtitle: 'Become part of a community that supports your journey to success.',
      joinNow: 'Join Now',
      exploreGuilds: 'Explore Guilds',
    },
  },
  es: {
    title: 'Únete a una Comunidad Próspera',
    subtitle: 'Conéctate con miles de aventureros que están logrando sus metas juntos. Comparte tu viaje, obtén apoyo y celebra victorias como comunidad.',
    stats: {
      activeMembers: 'Miembros Activos',
      guildsCreated: 'Gremios Creados',
      goalsCompleted: 'Metas Completadas',
      messagesShared: 'Mensajes Compartidos',
    },
    features: {
      joinGuilds: {
        title: 'Únete a Gremios',
        description: 'Conéctate con aventureros afines en gremios especializados enfocados en tus intereses y metas.',
      },
      activeDiscussions: {
        title: 'Discusiones Activas',
        description: 'Participa en conversaciones significativas, comparte progreso y obtén apoyo de otros miembros.',
      },
      leaderboards: {
        title: 'Tablas de Clasificación',
        description: 'Compite en desafíos amigables y ve cómo te clasificas entre tus compañeros.',
      },
      sharedProgress: {
        title: 'Progreso Compartido',
        description: 'Celebra logros juntos e inspira a otros con tu viaje.',
      },
    },
    cta: {
      title: '¿Listo para Unirte al Gremio?',
      subtitle: 'Conviértete en parte de una comunidad que apoya tu viaje al éxito.',
      joinNow: 'Únete Ahora',
      exploreGuilds: 'Explorar Gremios',
    },
  },
  fr: {
    title: 'Rejoignez une Communauté Florissante',
    subtitle: 'Connectez-vous avec des milliers d\'aventuriers qui atteignent leurs objectifs ensemble. Partagez votre parcours, obtenez du soutien et célébrez les victoires en tant que communauté.',
    stats: {
      activeMembers: 'Membres Actifs',
      guildsCreated: 'Guildes Créées',
      goalsCompleted: 'Objectifs Atteints',
      messagesShared: 'Messages Partagés',
    },
    features: {
      joinGuilds: {
        title: 'Rejoindre les Guildes',
        description: 'Connectez-vous avec des aventuriers partageant les mêmes idées dans des guildes spécialisées axées sur vos intérêts et objectifs.',
      },
      activeDiscussions: {
        title: 'Discussions Actives',
        description: 'Participez à des conversations significatives, partagez vos progrès et obtenez le soutien d\'autres membres.',
      },
      leaderboards: {
        title: 'Classements',
        description: 'Participez à des défis amicaux et voyez comment vous vous classez parmi vos pairs.',
      },
      sharedProgress: {
        title: 'Progrès Partagé',
        description: 'Célébrez les réalisations ensemble et inspirez les autres avec votre parcours.',
      },
    },
    cta: {
      title: 'Prêt à Rejoindre la Guilde?',
      subtitle: 'Faites partie d\'une communauté qui soutient votre parcours vers le succès.',
      joinNow: 'Rejoindre Maintenant',
      exploreGuilds: 'Explorer les Guildes',
    },
  },
};
