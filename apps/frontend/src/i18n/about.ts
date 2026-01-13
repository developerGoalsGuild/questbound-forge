/**
 * About page translations
 */

import { Language } from './common';

export interface AboutTranslations {
  title: string;
  subtitle: string;
  mission: {
    title: string;
    subtitle: string;
    content: string;
  };
  vision: {
    title: string;
    subtitle: string;
    content: string;
  };
  values: {
    title: string;
    subtitle: string;
    purpose: {
      title: string;
      description: string;
    };
    community: {
      title: string;
      description: string;
    };
    empathy: {
      title: string;
      description: string;
    };
    excellence: {
      title: string;
      description: string;
    };
  };
  whatWeDo: {
    title: string;
    subtitle: string;
    goals: {
      title: string;
      description: string;
    };
    quests: {
      title: string;
      description: string;
    };
    guilds: {
      title: string;
      description: string;
    };
    collaboration: {
      title: string;
      description: string;
    };
  };
  team: {
    title: string;
    subtitle: string;
    description: string;
    member: {
      title: string;
      role: string;
    };
  };
  contact: {
    title: string;
    subtitle: string;
    email: {
      label: string;
      value: string;
    };
    support: {
      label: string;
      value: string;
    };
  };
}

export const aboutTranslations: Record<Language, AboutTranslations> = {
  en: {
    title: 'About Us',
    subtitle: 'Learn more about GoalsGuild and our mission',
    mission: {
      title: 'Our Mission',
      subtitle: 'What drives us every day',
      content: 'To democratize access to goal achievement by connecting people with complementary objectives, providing AI-powered guidance, and creating a sustainable ecosystem where users, businesses, and patrons collaborate for mutual growth.',
    },
    vision: {
      title: 'Our Vision',
      subtitle: 'Where we\'re heading',
      content: 'A world where no one achieves their goals alone. We envision a global community where every aspiration is supported, every milestone is celebrated, and every journey is shared.',
    },
    values: {
      title: 'Our Values',
      subtitle: 'The principles that guide us',
      purpose: {
        title: 'Purpose-Driven',
        description: 'We believe every goal matters and deserves support.',
      },
      community: {
        title: 'Community First',
        description: 'Together we achieve more than we ever could alone.',
      },
      empathy: {
        title: 'Empathy & Support',
        description: 'We understand the journey and celebrate every step.',
      },
      excellence: {
        title: 'Excellence',
        description: 'We strive for the highest quality in everything we do.',
      },
    },
    whatWeDo: {
      title: 'What We Do',
      subtitle: 'Our platform features',
      goals: {
        title: 'Goal Management',
        description: 'Create, track, and achieve your goals with AI-powered guidance and intelligent task breakdown.',
      },
      quests: {
        title: 'Quest System',
        description: 'Gamify your journey with quests, XP, badges, and achievements that make progress fun and engaging.',
      },
      guilds: {
        title: 'Guilds & Community',
        description: 'Join or create guilds to collaborate with like-minded individuals and achieve shared objectives.',
      },
      collaboration: {
        title: 'Collaboration',
        description: 'Invite others to collaborate on your goals and quests, sharing the journey together.',
      },
    },
    team: {
      title: 'Our Team',
      subtitle: 'The people behind GoalsGuild',
      description: 'We\'re a passionate team of developers, designers, and dreamers working to make goal achievement accessible to everyone.',
      member: {
        title: 'Team Member',
        role: 'Role',
      },
    },
    contact: {
      title: 'Get in Touch',
      subtitle: 'We\'d love to hear from you',
      email: {
        label: 'Email',
        value: 'hello@goalsguild.com',
      },
      support: {
        label: 'Support',
        value: 'Visit our Help Center',
      },
    },
  },
  es: {
    title: 'Sobre Nosotros',
    subtitle: 'Conoce más sobre GoalsGuild y nuestra misión',
    mission: {
      title: 'Nuestra Misión',
      subtitle: 'Lo que nos impulsa cada día',
      content: 'Democratizar el acceso al logro de objetivos conectando a personas con objetivos complementarios, proporcionando orientación impulsada por IA y creando un ecosistema sostenible donde usuarios, empresas y patrocinadores colaboran para el crecimiento mutuo.',
    },
    vision: {
      title: 'Nuestra Visión',
      subtitle: 'Hacia dónde nos dirigimos',
      content: 'Un mundo donde nadie logre sus objetivos solo. Imaginamos una comunidad global donde cada aspiración sea apoyada, cada hito sea celebrado y cada viaje sea compartido.',
    },
    values: {
      title: 'Nuestros Valores',
      subtitle: 'Los principios que nos guían',
      purpose: {
        title: 'Impulsado por el Propósito',
        description: 'Creemos que cada meta importa y merece apoyo.',
      },
      community: {
        title: 'La Comunidad Primero',
        description: 'Juntos logramos más de lo que jamás podríamos solos.',
      },
      empathy: {
        title: 'Empatía y Apoyo',
        description: 'Entendemos el viaje y celebramos cada paso.',
      },
      excellence: {
        title: 'Excelencia',
        description: 'Nos esforzamos por la más alta calidad en todo lo que hacemos.',
      },
    },
    whatWeDo: {
      title: 'Lo Que Hacemos',
      subtitle: 'Características de nuestra plataforma',
      goals: {
        title: 'Gestión de Metas',
        description: 'Crea, rastrea y logra tus metas con orientación impulsada por IA y desglose inteligente de tareas.',
      },
      quests: {
        title: 'Sistema de Misiones',
        description: 'Gamifica tu viaje con misiones, XP, insignias y logros que hacen que el progreso sea divertido y atractivo.',
      },
      guilds: {
        title: 'Gremios y Comunidad',
        description: 'Únete o crea gremios para colaborar con personas afines y lograr objetivos compartidos.',
      },
      collaboration: {
        title: 'Colaboración',
        description: 'Invita a otros a colaborar en tus metas y misiones, compartiendo el viaje juntos.',
      },
    },
    team: {
      title: 'Nuestro Equipo',
      subtitle: 'Las personas detrás de GoalsGuild',
      description: 'Somos un equipo apasionado de desarrolladores, diseñadores y soñadores trabajando para hacer que el logro de objetivos sea accesible para todos.',
      member: {
        title: 'Miembro del Equipo',
        role: 'Rol',
      },
    },
    contact: {
      title: 'Contáctanos',
      subtitle: 'Nos encantaría saber de ti',
      email: {
        label: 'Correo Electrónico',
        value: 'hello@goalsguild.com',
      },
      support: {
        label: 'Soporte',
        value: 'Visita nuestro Centro de Ayuda',
      },
    },
  },
  fr: {
    title: 'À Propos',
    subtitle: 'En savoir plus sur GoalsGuild et notre mission',
    mission: {
      title: 'Notre Mission',
      subtitle: 'Ce qui nous motive chaque jour',
      content: 'Démocratiser l\'accès à la réalisation d\'objectifs en connectant les personnes ayant des objectifs complémentaires, en fournissant des conseils alimentés par l\'IA et en créant un écosystème durable où les utilisateurs, les entreprises et les mécènes collaborent pour une croissance mutuelle.',
    },
    vision: {
      title: 'Notre Vision',
      subtitle: 'Où nous allons',
      content: 'Un monde où personne n\'atteint ses objectifs seul. Nous envisageons une communauté mondiale où chaque aspiration est soutenue, chaque jalon est célébré et chaque voyage est partagé.',
    },
    values: {
      title: 'Nos Valeurs',
      subtitle: 'Les principes qui nous guident',
      purpose: {
        title: 'Axé sur le But',
        description: 'Nous croyons que chaque objectif compte et mérite du soutien.',
      },
      community: {
        title: 'La Communauté d\'Abord',
        description: 'Ensemble, nous accomplissons plus que nous ne pourrions jamais le faire seuls.',
      },
      empathy: {
        title: 'Empathie et Soutien',
        description: 'Nous comprenons le voyage et célébrons chaque étape.',
      },
      excellence: {
        title: 'Excellence',
        description: 'Nous visons la plus haute qualité dans tout ce que nous faisons.',
      },
    },
    whatWeDo: {
      title: 'Ce Que Nous Faisons',
      subtitle: 'Caractéristiques de notre plateforme',
      goals: {
        title: 'Gestion des Objectifs',
        description: 'Créez, suivez et atteignez vos objectifs avec des conseils alimentés par l\'IA et une décomposition intelligente des tâches.',
      },
      quests: {
        title: 'Système de Quêtes',
        description: 'Gamifiez votre parcours avec des quêtes, XP, badges et réalisations qui rendent le progrès amusant et engageant.',
      },
      guilds: {
        title: 'Guildes et Communauté',
        description: 'Rejoignez ou créez des guildes pour collaborer avec des personnes partageant les mêmes idées et atteindre des objectifs communs.',
      },
      collaboration: {
        title: 'Collaboration',
        description: 'Invitez d\'autres à collaborer sur vos objectifs et quêtes, partageant le voyage ensemble.',
      },
    },
    team: {
      title: 'Notre Équipe',
      subtitle: 'Les personnes derrière GoalsGuild',
      description: 'Nous sommes une équipe passionnée de développeurs, de designers et de rêveurs qui travaillent à rendre la réalisation d\'objectifs accessible à tous.',
      member: {
        title: 'Membre de l\'Équipe',
        role: 'Rôle',
      },
    },
    contact: {
      title: 'Contactez-Nous',
      subtitle: 'Nous aimerions avoir de vos nouvelles',
      email: {
        label: 'E-mail',
        value: 'hello@goalsguild.com',
      },
      support: {
        label: 'Support',
        value: 'Visitez notre Centre d\'Aide',
      },
    },
  },
};
