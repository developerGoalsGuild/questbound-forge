/**
 * FAQ Data
 */

import { Language } from '@/i18n/common';

export interface FAQTranslations {
  question: string;
  answer: string;
}

export interface FAQ {
  id: string;
  translations: Record<Language, FAQTranslations>;
  category: string;
}

export const faqs: FAQ[] = [
  {
    id: 'what-is-goalsguild',
    translations: {
      en: {
        question: 'What is GoalsGuild?',
        answer: 'GoalsGuild is a platform that helps you achieve your goals through community support, gamification, and AI-powered guidance. You can create goals, break them down into tasks, join guilds, and track your progress.',
      },
      es: {
        question: '¿Qué es GoalsGuild?',
        answer: 'GoalsGuild es una plataforma que te ayuda a lograr tus metas a través del apoyo comunitario, la gamificación y la orientación impulsada por IA. Puedes crear metas, dividirlas en tareas, unirte a gremios y rastrear tu progreso.',
      },
      fr: {
        question: 'Qu\'est-ce que GoalsGuild?',
        answer: 'GoalsGuild est une plateforme qui vous aide à atteindre vos objectifs grâce au soutien communautaire, à la gamification et à des conseils alimentés par l\'IA. Vous pouvez créer des objectifs, les décomposer en tâches, rejoindre des guildes et suivre vos progrès.',
      },
    },
    category: 'getting-started'
  },
  {
    id: 'how-to-create-goal',
    translations: {
      en: {
        question: 'How do I create a goal?',
        answer: 'To create a goal, click the "Create Goal" button on your dashboard. Fill in the goal details including title, description, deadline, and category. You can also answer NLP questions to help break down your goal into actionable tasks.',
      },
      es: {
        question: '¿Cómo creo una meta?',
        answer: 'Para crear una meta, haz clic en el botón "Crear Meta" en tu panel. Completa los detalles de la meta incluyendo título, descripción, fecha límite y categoría. También puedes responder preguntas de NLP para ayudar a desglosar tu meta en tareas accionables.',
      },
      fr: {
        question: 'Comment créer un objectif?',
        answer: 'Pour créer un objectif, cliquez sur le bouton "Créer un Objectif" sur votre tableau de bord. Remplissez les détails de l\'objectif, y compris le titre, la description, la date limite et la catégorie. Vous pouvez également répondre aux questions NLP pour aider à décomposer votre objectif en tâches actionnables.',
      },
    },
    category: 'getting-started'
  },
  {
    id: 'what-are-quests',
    translations: {
      en: {
        question: 'What are quests?',
        answer: 'Quests are gamified challenges that reward you with XP and badges when completed. They help make goal achievement fun and motivating. You can create custom quests or use templates.',
      },
      es: {
        question: '¿Qué son las misiones?',
        answer: 'Las misiones son desafíos gamificados que te recompensan con XP e insignias cuando se completan. Ayudan a hacer que el logro de metas sea divertido y motivador. Puedes crear misiones personalizadas o usar plantillas.',
      },
      fr: {
        question: 'Qu\'est-ce que les quêtes?',
        answer: 'Les quêtes sont des défis gamifiés qui vous récompensent avec de l\'XP et des badges lorsqu\'elles sont complétées. Elles aident à rendre la réalisation d\'objectifs amusante et motivante. Vous pouvez créer des quêtes personnalisées ou utiliser des modèles.',
      },
    },
    category: 'goals-quests'
  },
  {
    id: 'how-to-join-guild',
    translations: {
      en: {
        question: 'How do I join a guild?',
        answer: 'You can browse available guilds from the Guilds page. Click on a guild to view details, then click "Join Guild" if it\'s public, or "Request to Join" if it requires approval.',
      },
      es: {
        question: '¿Cómo me uno a un gremio?',
        answer: 'Puedes explorar los gremios disponibles desde la página de Gremios. Haz clic en un gremio para ver los detalles, luego haz clic en "Unirse al Gremio" si es público, o "Solicitar Unirse" si requiere aprobación.',
      },
      fr: {
        question: 'Comment rejoindre une guilde?',
        answer: 'Vous pouvez parcourir les guildes disponibles depuis la page Guildes. Cliquez sur une guilde pour voir les détails, puis cliquez sur "Rejoindre la Guilde" si elle est publique, ou "Demander à Rejoindre" si elle nécessite une approbation.',
      },
    },
    category: 'guilds'
  },
  {
    id: 'how-to-collaborate',
    translations: {
      en: {
        question: 'How do I collaborate on goals?',
        answer: 'You can invite others to collaborate on your goals by clicking the "Invite Collaborator" button. Enter their email address and send an invite. They\'ll receive a notification and can accept to start collaborating.',
      },
      es: {
        question: '¿Cómo colaboro en metas?',
        answer: 'Puedes invitar a otros a colaborar en tus metas haciendo clic en el botón "Invitar Colaborador". Ingresa su dirección de correo electrónico y envía una invitación. Recibirán una notificación y pueden aceptar para comenzar a colaborar.',
      },
      fr: {
        question: 'Comment collaborer sur des objectifs?',
        answer: 'Vous pouvez inviter d\'autres personnes à collaborer sur vos objectifs en cliquant sur le bouton "Inviter un Collaborateur". Entrez leur adresse e-mail et envoyez une invitation. Ils recevront une notification et pourront accepter pour commencer à collaborer.',
      },
    },
    category: 'goals-quests'
  },
  {
    id: 'subscription-plans',
    translations: {
      en: {
        question: 'What subscription plans are available?',
        answer: 'GoalsGuild offers multiple subscription tiers: Free, Journeyman, and Patron. Each tier includes different features and limits. Visit the Subscription page to see details and upgrade.',
      },
      es: {
        question: '¿Qué planes de suscripción están disponibles?',
        answer: 'GoalsGuild ofrece múltiples niveles de suscripción: Gratis, Aprendiz y Patrón. Cada nivel incluye diferentes características y límites. Visita la página de Suscripción para ver detalles y actualizar.',
      },
      fr: {
        question: 'Quels plans d\'abonnement sont disponibles?',
        answer: 'GoalsGuild propose plusieurs niveaux d\'abonnement: Gratuit, Compagnon et Patron. Chaque niveau comprend différentes fonctionnalités et limites. Visitez la page Abonnement pour voir les détails et mettre à niveau.',
      },
    },
    category: 'billing'
  },
  {
    id: 'how-to-cancel',
    translations: {
      en: {
        question: 'How do I cancel my subscription?',
        answer: 'You can cancel your subscription from the Subscription Management page. Your subscription will remain active until the end of your billing period, and you\'ll continue to have access to all features until then.',
      },
      es: {
        question: '¿Cómo cancelo mi suscripción?',
        answer: 'Puedes cancelar tu suscripción desde la página de Gestión de Suscripción. Tu suscripción permanecerá activa hasta el final de tu período de facturación, y continuarás teniendo acceso a todas las funciones hasta entonces.',
      },
      fr: {
        question: 'Comment annuler mon abonnement?',
        answer: 'Vous pouvez annuler votre abonnement depuis la page de Gestion d\'Abonnement. Votre abonnement restera actif jusqu\'à la fin de votre période de facturation, et vous continuerez à avoir accès à toutes les fonctionnalités jusqu\'à ce moment-là.',
      },
    },
    category: 'billing'
  },
  {
    id: 'reset-password',
    translations: {
      en: {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive an email with instructions to reset your password.',
      },
      es: {
        question: '¿Cómo restablezco mi contraseña?',
        answer: 'Haz clic en "Olvidé mi Contraseña" en la página de inicio de sesión e ingresa tu dirección de correo electrónico. Recibirás un correo con instrucciones para restablecer tu contraseña.',
      },
      fr: {
        question: 'Comment réinitialiser mon mot de passe?',
        answer: 'Cliquez sur "Mot de Passe Oublié" sur la page de connexion et entrez votre adresse e-mail. Vous recevrez un e-mail avec des instructions pour réinitialiser votre mot de passe.',
      },
    },
    category: 'troubleshooting'
  },
  {
    id: 'delete-account',
    translations: {
      en: {
        question: 'How do I delete my account?',
        answer: 'You can delete your account from the Profile Settings page. This action is permanent and will delete all your data including goals, quests, and guild memberships.',
      },
      es: {
        question: '¿Cómo elimino mi cuenta?',
        answer: 'Puedes eliminar tu cuenta desde la página de Configuración de Perfil. Esta acción es permanente y eliminará todos tus datos, incluyendo metas, misiones y membresías de gremios.',
      },
      fr: {
        question: 'Comment supprimer mon compte?',
        answer: 'Vous pouvez supprimer votre compte depuis la page Paramètres du Profil. Cette action est permanente et supprimera toutes vos données, y compris les objectifs, les quêtes et les adhésions aux guildes.',
      },
    },
    category: 'troubleshooting'
  },
  {
    id: 'export-data',
    translations: {
      en: {
        question: 'Can I export my data?',
        answer: 'Yes, you can export your goals and progress data. This feature is available in your Profile Settings. You\'ll receive a downloadable file with all your data.',
      },
      es: {
        question: '¿Puedo exportar mis datos?',
        answer: 'Sí, puedes exportar tus metas y datos de progreso. Esta función está disponible en tu Configuración de Perfil. Recibirás un archivo descargable con todos tus datos.',
      },
      fr: {
        question: 'Puis-je exporter mes données?',
        answer: 'Oui, vous pouvez exporter vos objectifs et données de progression. Cette fonctionnalité est disponible dans vos Paramètres de Profil. Vous recevrez un fichier téléchargeable avec toutes vos données.',
      },
    },
    category: 'troubleshooting'
  }
];
