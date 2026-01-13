export type Language = 'en' | 'es' | 'fr';

export interface ProblemRecognitionTranslations {
  title: string;
  scenarios: {
    loseSteam: { title: string; description: string };
    goingAlone: { title: string; description: string };
    overwhelmed: { title: string; description: string };
    lackAccountability: { title: string; description: string };
    perfectionism: { title: string; description: string };
    feelFailure: { title: string; description: string };
  };
  closing: {
    title: string;
    description: string;
  };
}

export interface EmpathyTranslations {
  title: string;
  message: {
    paragraph1: string;
    paragraph2: string;
  };
  stats: {
    giveUp: { label: string; reference?: string };
    motivated: { label: string; reference?: string };
    accountability: { label: string; reference?: string };
  };
}

export interface SolutionIntroTranslations {
  title: string;
  subtitle: string;
  paragraph1: string;
  paragraph2: string;
}

export interface HowItWorksTranslations {
  title: string;
  subtitle: string;
  steps: {
    step1: { title: string; description: string };
    step2: { title: string; description: string };
    step3: { title: string; description: string };
    step4: { title: string; description: string };
    step5: { title: string; description: string };
    step6: { title: string; description: string };
  };
}

export interface FeatureCarouselTranslations {
  title: string;
  subtitle: string;
  slides: {
    slide1: { title: string; description: string; tags: string[] };
    slide2: { title: string; description: string; tags: string[] };
    slide3: { title: string; description: string; tags: string[] };
    slide4: { title: string; description: string; tags: string[] };
  };
  indicators: string[];
  autoPlay: string;
}

export interface DevelopmentNoticeTranslations {
  title: string;
  message: string;
}

export interface WaitlistTranslations {
  title: string;
  subtitle: string;
  labels: {
    email: string;
  };
  placeholder: string;
  button: {
    submit: string;
    submitting: string;
    success: string;
  };
  validation: {
    emailRequired: string;
    emailInvalid: string;
  };
  messages: {
    submitting: string;
    success: string;
    error: string;
  };
  note: string;
}

export interface LandingPageTranslations {
  problemRecognition: ProblemRecognitionTranslations;
  empathy: EmpathyTranslations;
  solutionIntro: SolutionIntroTranslations;
  howItWorks: HowItWorksTranslations;
  featureCarousel: FeatureCarouselTranslations;
  developmentNotice: DevelopmentNoticeTranslations;
  waitlist: WaitlistTranslations;
}

export const landingPageTranslations: Record<Language, LandingPageTranslations> = {
  en: {
    problemRecognition: {
      title: 'Does This Sound Like You?',
      scenarios: {
        loseSteam: {
          title: 'You Set Goals But Lose Steam',
          description: 'You get excited about a new goal, make a plan, but after a few weeks you\'re back to your old habits. You feel like you\'re the only one who can\'t stick to their goals.',
        },
        goingAlone: {
          title: 'You\'re Going It Alone',
          description: 'Your friends don\'t share your goals or understand your struggles. You wish you had someone who gets it, someone to celebrate your wins and help you through the tough days.',
        },
        overwhelmed: {
          title: 'You Feel Overwhelmed',
          description: 'You have big dreams but no idea how to break them down. You start multiple goals but never finish any of them. You need guidance, not just another app.',
        },
        lackAccountability: {
          title: 'You Lack Accountability',
          description: 'You know what you need to do, but there\'s no one holding you accountable. You make excuses, skip days, and eventually give up. You need someone who cares about your success.',
        },
        perfectionism: {
          title: 'You\'re Stuck in Perfectionism',
          description: 'You want everything to be perfect before you start, so you never actually begin. You research endlessly, plan obsessively, but never take the first step. You need someone to push you forward.',
        },
        feelFailure: {
          title: 'You Feel Like a Failure',
          description: 'Every time you don\'t follow through, you feel like you\'re letting yourself down. You start to believe you\'re just not the type of person who can achieve big goals. You need proof that you can succeed.',
        },
      },
      closing: {
        title: 'If you nodded "yes" to any of these, you\'re not alone.',
        description: 'Millions of people struggle with the same challenges. The problem isn\'t you - it\'s that you\'re trying to achieve your goals in isolation.',
      },
    },
    empathy: {
      title: 'We Get It',
      message: {
        paragraph1: 'We know how it feels to be excited about a goal, only to lose motivation when you\'re going it alone. It\'s frustrating when you have big dreams but no one to share the journey with. You\'re not alone in feeling like traditional goal-setting methods just don\'t work.',
        paragraph2: 'The truth is, humans weren\'t meant to achieve goals in isolation. We\'re social creatures who thrive on connection, support, and shared experiences. When you try to go it alone, you\'re fighting against your natural instincts.',
      },
      stats: {
        giveUp: { 
          label: 'of people give up on their goals within 3 months',
          reference: 'Source: University of Scranton study on New Year\'s resolutions (2016)'
        },
        motivated: { 
          label: 'feel more motivated when working with others',
          reference: 'Source: Harvard Business Review - The Power of Social Connection (2018)'
        },
        accountability: { 
          label: 'more likely to succeed with accountability',
          reference: 'Source: American Society of Training and Development study on accountability partnerships (2015)'
        },
      },
    },
    solutionIntro: {
      title: 'Here\'s What Changed Everything',
      subtitle: 'What if you never had to achieve your goals alone again?',
      paragraph1: 'GoalsGuild is the first platform designed around the truth that humans achieve more together than alone. We connect you with people who share your struggles, understand your goals, and genuinely want to see you succeed.',
      paragraph2: 'Imagine having a community of people who actually get it - who celebrate your wins, help you through setbacks, and hold you accountable when you need it most. That\'s what GoalsGuild provides.',
    },
    howItWorks: {
      title: 'How GoalsGuild Works',
      subtitle: 'Six simple steps to transform your goal achievement',
      steps: {
        step1: {
          title: 'Share Your Goals',
          description: 'Tell us about your goals and what you\'re trying to achieve. Our AI helps you break them down into actionable steps.',
        },
        step2: {
          title: 'Find Your People',
          description: 'We connect you with others who share similar goals, challenges, or can offer the support you need.',
        },
        step3: {
          title: 'Achieve Together',
          description: 'Work with your community, track progress, celebrate wins, and finally achieve the goals that matter to you.',
        },
        step4: {
          title: 'Get Matched Intelligently',
          description: 'Our AI analyzes your goals, personality, and preferences to connect you with the perfect accountability partners and mentors.',
        },
        step5: {
          title: 'Stay Motivated & Engaged',
          description: 'Earn points, unlock achievements, and participate in challenges that make goal achievement fun and rewarding.',
        },
        step6: {
          title: 'Celebrate Your Success',
          description: 'Share your wins with a community that truly understands and celebrates your achievements, creating lasting motivation.',
        },
      },
    },
    featureCarousel: {
      title: 'Why GoalsGuild Works',
      subtitle: 'The features that make goal achievement finally possible',
      slides: {
        slide1: {
          title: 'Never Set Goals Alone Again',
          description: 'Finally, a way to break down your big dreams into manageable steps with AI guidance and community support. No more overwhelming goals that you abandon after a few weeks.',
          tags: ['AI Guidance', 'Clear Steps', 'Community Support'],
        },
        slide2: {
          title: 'Find Your Support System',
          description: 'Connect with people who actually understand your struggles and want to see you succeed. No more feeling alone in your journey.',
          tags: ['Smart Matching', 'Real Support', 'Genuine Connection'],
        },
        slide3: {
          title: 'Stay Motivated & Engaged',
          description: 'Finally, a way to make goal achievement fun and rewarding. Earn recognition for your progress and stay motivated with a system that actually works.',
          tags: ['Fun & Rewarding', 'Real Recognition', 'Sustained Motivation'],
        },
        slide4: {
          title: 'Get Real Support When You Need It',
          description: 'Connect with mentors who\'ve been where you are, join communities that understand your goals, and get support exactly when you need it most.',
          tags: ['Real Mentors', 'Active Communities', 'Timely Support'],
        },
      },
      indicators: ['Smart Goals', 'Matching', 'Gamification', 'Collaboration'],
      autoPlay: 'Auto-play',
    },
    developmentNotice: {
      title: 'Platform in Development',
      message: 'The features described on this page are currently in development and may change before the final product launch. Some features may not be available at the initial release, and we reserve the right to modify or remove features based on user feedback and technical considerations.',
    },
    waitlist: {
      title: 'Ready to Finally Achieve Your Goals?',
      subtitle: 'Stop setting goals alone. Join thousands of people who are already transforming their lives with community support, accountability, and the motivation they\'ve been missing.',
      labels: {
        email: 'Email address',
      },
      placeholder: 'Enter your email',
      button: {
        submit: 'Join the Community',
        submitting: 'Joining...',
        success: 'Subscribed!',
      },
      validation: {
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
      },
      messages: {
        submitting: 'Submitting...',
        success: 'Thank you for joining! We\'ll be in touch soon.',
        error: 'Something went wrong. Please try again later.',
      },
      note: 'Join the community that\'s already changing lives. No spam, just results.',
    },
  },
  es: {
    problemRecognition: {
      title: '¿Te suena familiar?',
      scenarios: {
        loseSteam: {
          title: 'Estableces metas pero pierdes impulso',
          description: 'Te emocionas con una nueva meta, haces un plan, pero después de unas semanas vuelves a tus viejos hábitos. Sientes que eres el único que no puede cumplir sus metas.',
        },
        goingAlone: {
          title: 'Vas solo',
          description: 'Tus amigos no comparten tus metas ni entienden tus luchas. Desearías tener a alguien que lo entienda, alguien que celebre tus victorias y te ayude en los días difíciles.',
        },
        overwhelmed: {
          title: 'Te sientes abrumado',
          description: 'Tienes grandes sueños pero no sabes cómo dividirlos. Comienzas múltiples metas pero nunca terminas ninguna. Necesitas orientación, no solo otra aplicación.',
        },
        lackAccountability: {
          title: 'Te falta responsabilidad',
          description: 'Sabes lo que necesitas hacer, pero no hay nadie que te haga responsable. Pones excusas, te saltas días y eventualmente te rindes. Necesitas a alguien que se preocupe por tu éxito.',
        },
        perfectionism: {
          title: 'Estás atrapado en el perfeccionismo',
          description: 'Quieres que todo sea perfecto antes de empezar, así que nunca realmente comienzas. Investigas sin fin, planeas obsesivamente, pero nunca das el primer paso. Necesitas a alguien que te impulse hacia adelante.',
        },
        feelFailure: {
          title: 'Te sientes como un fracaso',
          description: 'Cada vez que no cumples, sientes que te estás defraudando. Empiezas a creer que simplemente no eres el tipo de persona que puede lograr grandes metas. Necesitas prueba de que puedes tener éxito.',
        },
      },
      closing: {
        title: 'Si asentiste "sí" a cualquiera de estos, no estás solo.',
        description: 'Millones de personas luchan con los mismos desafíos. El problema no eres tú: es que estás tratando de lograr tus metas en aislamiento.',
      },
    },
    empathy: {
      title: 'Te entendemos',
      message: {
        paragraph1: 'Sabemos cómo se siente emocionarse por una meta, solo para perder la motivación cuando vas solo. Es frustrante cuando tienes grandes sueños pero nadie con quien compartir el viaje. No estás solo en sentir que los métodos tradicionales de establecimiento de metas simplemente no funcionan.',
        paragraph2: 'La verdad es que los humanos no fueron hechos para lograr metas en aislamiento. Somos criaturas sociales que prosperan con la conexión, el apoyo y las experiencias compartidas. Cuando intentas ir solo, estás luchando contra tus instintos naturales.',
      },
      stats: {
        giveUp: { 
          label: 'de las personas abandonan sus metas en 3 meses',
          reference: 'Fuente: Estudio de la Universidad de Scranton sobre resoluciones de Año Nuevo (2016)'
        },
        motivated: { 
          label: 'se sienten más motivados cuando trabajan con otros',
          reference: 'Fuente: Harvard Business Review - El Poder de la Conexión Social (2018)'
        },
        accountability: { 
          label: 'más probabilidades de tener éxito con responsabilidad',
          reference: 'Fuente: Estudio de la Sociedad Americana de Capacitación y Desarrollo sobre asociaciones de responsabilidad (2015)'
        },
      },
    },
    solutionIntro: {
      title: 'Esto es lo que cambió todo',
      subtitle: '¿Qué pasaría si nunca tuvieras que lograr tus metas solo de nuevo?',
      paragraph1: 'GoalsGuild es la primera plataforma diseñada en torno a la verdad de que los humanos logran más juntos que solos. Te conectamos con personas que comparten tus luchas, entienden tus metas y genuinamente quieren verte tener éxito.',
      paragraph2: 'Imagina tener una comunidad de personas que realmente lo entienden: que celebran tus victorias, te ayudan a superar los contratiempos y te hacen responsable cuando más lo necesitas. Eso es lo que GoalsGuild proporciona.',
    },
    howItWorks: {
      title: 'Cómo funciona GoalsGuild',
      subtitle: 'Seis pasos simples para transformar el logro de tus metas',
      steps: {
        step1: {
          title: 'Comparte tus metas',
          description: 'Cuéntanos sobre tus metas y lo que estás tratando de lograr. Nuestra IA te ayuda a dividirlas en pasos accionables.',
        },
        step2: {
          title: 'Encuentra tu gente',
          description: 'Te conectamos con otros que comparten metas similares, desafíos o pueden ofrecer el apoyo que necesitas.',
        },
        step3: {
          title: 'Logra juntos',
          description: 'Trabaja con tu comunidad, rastrea el progreso, celebra las victorias y finalmente logra las metas que te importan.',
        },
        step4: {
          title: 'Obtén coincidencias inteligentes',
          description: 'Nuestra IA analiza tus metas, personalidad y preferencias para conectarte con los socios de responsabilidad y mentores perfectos.',
        },
        step5: {
          title: 'Mantente motivado y comprometido',
          description: 'Gana puntos, desbloquea logros y participa en desafíos que hacen que el logro de metas sea divertido y gratificante.',
        },
        step6: {
          title: 'Celebra tu éxito',
          description: 'Comparte tus victorias con una comunidad que realmente entiende y celebra tus logros, creando motivación duradera.',
        },
      },
    },
    featureCarousel: {
      title: 'Por qué funciona GoalsGuild',
      subtitle: 'Las características que hacen posible el logro de metas',
      slides: {
        slide1: {
          title: 'Nunca establezcas metas solo de nuevo',
          description: 'Finalmente, una forma de dividir tus grandes sueños en pasos manejables con orientación de IA y apoyo comunitario. No más metas abrumadoras que abandonas después de unas semanas.',
          tags: ['Orientación IA', 'Pasos claros', 'Apoyo comunitario'],
        },
        slide2: {
          title: 'Encuentra tu sistema de apoyo',
          description: 'Conéctate con personas que realmente entienden tus luchas y quieren verte tener éxito. No más sentirse solo en tu viaje.',
          tags: ['Coincidencias inteligentes', 'Apoyo real', 'Conexión genuina'],
        },
        slide3: {
          title: 'Mantente motivado y comprometido',
          description: 'Finalmente, una forma de hacer que el logro de metas sea divertido y gratificante. Gana reconocimiento por tu progreso y mantente motivado con un sistema que realmente funciona.',
          tags: ['Divertido y gratificante', 'Reconocimiento real', 'Motivación sostenida'],
        },
        slide4: {
          title: 'Obtén apoyo real cuando lo necesites',
          description: 'Conéctate con mentores que han estado donde estás, únete a comunidades que entienden tus metas y obtén apoyo exactamente cuando más lo necesitas.',
          tags: ['Mentores reales', 'Comunidades activas', 'Apoyo oportuno'],
        },
      },
      indicators: ['Metas inteligentes', 'Coincidencias', 'Gamificación', 'Colaboración'],
      autoPlay: 'Reproducción automática',
    },
    developmentNotice: {
      title: 'Plataforma en desarrollo',
      message: 'Las características descritas en esta página están actualmente en desarrollo y pueden cambiar antes del lanzamiento del producto final. Algunas características pueden no estar disponibles en el lanzamiento inicial, y nos reservamos el derecho de modificar o eliminar características según los comentarios de los usuarios y consideraciones técnicas.',
    },
    waitlist: {
      title: '¿Listo para Finalmente Lograr tus Metas?',
      subtitle: 'Deja de establecer metas solo. Únete a miles de personas que ya están transformando sus vidas con apoyo comunitario, responsabilidad y la motivación que les ha faltado.',
      labels: {
        email: 'Dirección de correo electrónico',
      },
      placeholder: 'Ingresa tu correo electrónico',
      button: {
        submit: 'Únete a la comunidad',
        submitting: 'Uniéndose...',
        success: '¡Suscrito!',
      },
      validation: {
        emailRequired: 'El correo electrónico es obligatorio',
        emailInvalid: 'Por favor ingresa una dirección de correo electrónico válida',
      },
      messages: {
        submitting: 'Enviando...',
        success: '¡Gracias por unirte! Nos pondremos en contacto pronto.',
        error: 'Algo salió mal. Por favor intenta de nuevo más tarde.',
      },
      note: 'Únete a la comunidad que ya está cambiando vidas. Sin spam, solo resultados.',
    },
  },
  fr: {
    problemRecognition: {
      title: 'Cela vous ressemble-t-il?',
      scenarios: {
        loseSteam: {
          title: 'Vous fixez des objectifs mais perdez votre élan',
          description: 'Vous êtes excité par un nouvel objectif, vous faites un plan, mais après quelques semaines, vous revenez à vos anciennes habitudes. Vous avez l\'impression d\'être le seul à ne pas pouvoir tenir vos objectifs.',
        },
        goingAlone: {
          title: 'Vous y allez seul',
          description: 'Vos amis ne partagent pas vos objectifs ou ne comprennent pas vos difficultés. Vous souhaiteriez avoir quelqu\'un qui comprend, quelqu\'un pour célébrer vos victoires et vous aider dans les moments difficiles.',
        },
        overwhelmed: {
          title: 'Vous vous sentez submergé',
          description: 'Vous avez de grands rêves mais aucune idée de comment les décomposer. Vous commencez plusieurs objectifs mais n\'en terminez jamais aucun. Vous avez besoin de conseils, pas seulement d\'une autre application.',
        },
        lackAccountability: {
          title: 'Vous manquez de responsabilité',
          description: 'Vous savez ce que vous devez faire, mais personne ne vous tient responsable. Vous trouvez des excuses, sautez des jours et finissez par abandonner. Vous avez besoin de quelqu\'un qui se soucie de votre succès.',
        },
        perfectionism: {
          title: 'Vous êtes coincé dans le perfectionnisme',
          description: 'Vous voulez que tout soit parfait avant de commencer, alors vous ne commencez jamais vraiment. Vous recherchez sans fin, planifiez de manière obsessionnelle, mais ne faites jamais le premier pas. Vous avez besoin de quelqu\'un pour vous pousser vers l\'avant.',
        },
        feelFailure: {
          title: 'Vous vous sentez comme un échec',
          description: 'Chaque fois que vous ne suivez pas, vous avez l\'impression de vous laisser tomber. Vous commencez à croire que vous n\'êtes tout simplement pas le type de personne qui peut atteindre de grands objectifs. Vous avez besoin de preuves que vous pouvez réussir.',
        },
      },
      closing: {
        title: 'Si vous avez hoché la tête "oui" à l\'un de ces éléments, vous n\'êtes pas seul.',
        description: 'Des millions de personnes luttent avec les mêmes défis. Le problème n\'est pas vous - c\'est que vous essayez d\'atteindre vos objectifs en isolement.',
      },
    },
    empathy: {
      title: 'Nous comprenons',
      message: {
        paragraph1: 'Nous savons ce que c\'est que d\'être excité par un objectif, pour perdre ensuite sa motivation quand on y va seul. C\'est frustrant d\'avoir de grands rêves mais personne avec qui partager le voyage. Vous n\'êtes pas seul à penser que les méthodes traditionnelles de fixation d\'objectifs ne fonctionnent tout simplement pas.',
        paragraph2: 'La vérité est que les humains n\'étaient pas faits pour atteindre des objectifs en isolement. Nous sommes des créatures sociales qui prospèrent grâce à la connexion, au soutien et aux expériences partagées. Quand vous essayez d\'y aller seul, vous luttez contre vos instincts naturels.',
      },
      stats: {
        giveUp: { 
          label: 'des personnes abandonnent leurs objectifs en 3 mois',
          reference: 'Source: Étude de l\'Université de Scranton sur les résolutions du Nouvel An (2016)'
        },
        motivated: { 
          label: 'se sentent plus motivés en travaillant avec d\'autres',
          reference: 'Source: Harvard Business Review - Le Pouvoir de la Connexion Sociale (2018)'
        },
        accountability: { 
          label: 'plus susceptibles de réussir avec la responsabilité',
          reference: 'Source: Étude de l\'American Society of Training and Development sur les partenariats de responsabilité (2015)'
        },
      },
    },
    solutionIntro: {
      title: 'Voici ce qui a tout changé',
      subtitle: 'Et si vous n\'aviez plus jamais à atteindre vos objectifs seul?',
      paragraph1: 'GoalsGuild est la première plateforme conçue autour de la vérité que les humains accomplissent plus ensemble que seuls. Nous vous connectons avec des personnes qui partagent vos difficultés, comprennent vos objectifs et veulent vraiment vous voir réussir.',
      paragraph2: 'Imaginez avoir une communauté de personnes qui comprennent vraiment - qui célèbrent vos victoires, vous aident à surmonter les revers et vous tiennent responsable quand vous en avez le plus besoin. C\'est ce que GoalsGuild offre.',
    },
    howItWorks: {
      title: 'Comment fonctionne GoalsGuild',
      subtitle: 'Six étapes simples pour transformer la réalisation de vos objectifs',
      steps: {
        step1: {
          title: 'Partagez vos objectifs',
          description: 'Parlez-nous de vos objectifs et de ce que vous essayez d\'atteindre. Notre IA vous aide à les décomposer en étapes actionnables.',
        },
        step2: {
          title: 'Trouvez vos personnes',
          description: 'Nous vous connectons avec d\'autres qui partagent des objectifs similaires, des défis ou peuvent offrir le soutien dont vous avez besoin.',
        },
        step3: {
          title: 'Réussissez ensemble',
          description: 'Travaillez avec votre communauté, suivez les progrès, célébrez les victoires et atteignez enfin les objectifs qui vous tiennent à cœur.',
        },
        step4: {
          title: 'Obtenez des correspondances intelligentes',
          description: 'Notre IA analyse vos objectifs, votre personnalité et vos préférences pour vous connecter avec les partenaires de responsabilité et les mentors parfaits.',
        },
        step5: {
          title: 'Restez motivé et engagé',
          description: 'Gagnez des points, débloquez des réalisations et participez à des défis qui rendent la réalisation d\'objectifs amusante et gratifiante.',
        },
        step6: {
          title: 'Célébrez votre succès',
          description: 'Partagez vos victoires avec une communauté qui comprend vraiment et célèbre vos réalisations, créant une motivation durable.',
        },
      },
    },
    featureCarousel: {
      title: 'Pourquoi GoalsGuild fonctionne',
      subtitle: 'Les fonctionnalités qui rendent enfin possible la réalisation d\'objectifs',
      slides: {
        slide1: {
          title: 'Ne fixez plus jamais d\'objectifs seul',
          description: 'Enfin, un moyen de décomposer vos grands rêves en étapes gérables avec des conseils IA et un soutien communautaire. Plus d\'objectifs accablants que vous abandonnez après quelques semaines.',
          tags: ['Conseils IA', 'Étapes claires', 'Soutien communautaire'],
        },
        slide2: {
          title: 'Trouvez votre système de soutien',
          description: 'Connectez-vous avec des personnes qui comprennent vraiment vos difficultés et veulent vous voir réussir. Plus de sentiment de solitude dans votre parcours.',
          tags: ['Correspondances intelligentes', 'Soutien réel', 'Connexion authentique'],
        },
        slide3: {
          title: 'Restez motivé et engagé',
          description: 'Enfin, un moyen de rendre la réalisation d\'objectifs amusante et gratifiante. Gagnez la reconnaissance de vos progrès et restez motivé avec un système qui fonctionne vraiment.',
          tags: ['Amusant et gratifiant', 'Reconnaissance réelle', 'Motivation durable'],
        },
        slide4: {
          title: 'Obtenez un soutien réel quand vous en avez besoin',
          description: 'Connectez-vous avec des mentors qui ont été là où vous êtes, rejoignez des communautés qui comprennent vos objectifs et obtenez un soutien exactement quand vous en avez le plus besoin.',
          tags: ['Mentors réels', 'Communautés actives', 'Soutien opportun'],
        },
      },
      indicators: ['Objectifs intelligents', 'Correspondances', 'Gamification', 'Collaboration'],
      autoPlay: 'Lecture automatique',
    },
    developmentNotice: {
      title: 'Plateforme en développement',
      message: 'Les fonctionnalités décrites sur cette page sont actuellement en développement et peuvent changer avant le lancement du produit final. Certaines fonctionnalités peuvent ne pas être disponibles au lancement initial, et nous nous réservons le droit de modifier ou de supprimer des fonctionnalités en fonction des commentaires des utilisateurs et des considérations techniques.',
    },
    waitlist: {
      title: 'Prêt à Atteindre Enfin Vos Objectifs?',
      subtitle: 'Arrêtez de fixer des objectifs seuls. Rejoignez des milliers de personnes qui transforment déjà leur vie avec le soutien communautaire, la responsabilité et la motivation qui leur manquaient.',
      labels: {
        email: 'Adresse e-mail',
      },
      placeholder: 'Entrez votre e-mail',
      button: {
        submit: 'Rejoindre la communauté',
        submitting: 'Adhésion...',
        success: 'Abonné!',
      },
      validation: {
        emailRequired: 'L\'e-mail est requis',
        emailInvalid: 'Veuillez entrer une adresse e-mail valide',
      },
      messages: {
        submitting: 'Envoi...',
        success: 'Merci de nous rejoindre! Nous vous contacterons bientôt.',
        error: 'Quelque chose s\'est mal passé. Veuillez réessayer plus tard.',
      },
      note: 'Rejoignez la communauté qui change déjà des vies. Pas de spam, juste des résultats.',
    },
  },
};
