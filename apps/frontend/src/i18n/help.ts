/**
 * Help center translations
 */

import { Language } from './common';

export interface HelpTranslations {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  all: string;
  categories: {
    title: string;
    gettingStarted: string;
    goalsQuests: string;
    guilds: string;
    billing: string;
    troubleshooting: string;
  };
  popularArticles: string;
  faq: string;
  noFaqs: string;
  articles: string;
  contactSupport: string;
  contactSupportDescription: string;
  email: string;
  responseTime: string;
  articleNotFound: string;
  articleNotFoundDescription: string;
  backToHelp: string;
}

export const helpTranslations: Record<Language, HelpTranslations> = {
  en: {
    title: 'Help Center',
    subtitle: 'Find answers and learn how to use GoalsGuild',
    searchPlaceholder: 'Search for help...',
    all: 'All',
    categories: {
      title: 'Browse by Category',
      gettingStarted: 'Getting Started',
      goalsQuests: 'Goals & Quests',
      guilds: 'Guilds',
      billing: 'Billing',
      troubleshooting: 'Troubleshooting',
    },
    popularArticles: 'Popular Articles',
    faq: 'Frequently Asked Questions',
    noFaqs: 'No FAQs found',
    articles: 'Help Articles',
    contactSupport: 'Still Need Help?',
    contactSupportDescription: 'Can\'t find what you\'re looking for? Contact our support team.',
    email: 'Email',
    responseTime: 'We typically respond within 24 hours.',
    articleNotFound: 'Article Not Found',
    articleNotFoundDescription: 'The help article you\'re looking for doesn\'t exist.',
    backToHelp: 'Back to Help Center',
  },
  es: {
    title: 'Centro de Ayuda',
    subtitle: 'Encuentra respuestas y aprende a usar GoalsGuild',
    searchPlaceholder: 'Buscar ayuda...',
    all: 'Todas',
    categories: {
      title: 'Explorar por Categoría',
      gettingStarted: 'Cómo Empezar',
      goalsQuests: 'Metas y Misiones',
      guilds: 'Gremios',
      billing: 'Facturación',
      troubleshooting: 'Solución de Problemas',
    },
    popularArticles: 'Artículos Populares',
    faq: 'Preguntas Frecuentes',
    noFaqs: 'No se encontraron preguntas frecuentes',
    articles: 'Artículos de Ayuda',
    contactSupport: '¿Aún Necesitas Ayuda?',
    contactSupportDescription: '¿No encuentras lo que buscas? Contacta a nuestro equipo de soporte.',
    email: 'Correo Electrónico',
    responseTime: 'Normalmente respondemos en 24 horas.',
    articleNotFound: 'Artículo No Encontrado',
    articleNotFoundDescription: 'El artículo de ayuda que buscas no existe.',
    backToHelp: 'Volver al Centro de Ayuda',
  },
  fr: {
    title: 'Centre d\'Aide',
    subtitle: 'Trouvez des réponses et apprenez à utiliser GoalsGuild',
    searchPlaceholder: 'Rechercher de l\'aide...',
    all: 'Tous',
    categories: {
      title: 'Parcourir par Catégorie',
      gettingStarted: 'Pour Commencer',
      goalsQuests: 'Objectifs et Quêtes',
      guilds: 'Guildes',
      billing: 'Facturation',
      troubleshooting: 'Dépannage',
    },
    popularArticles: 'Articles Populaires',
    faq: 'Questions Fréquemment Posées',
    noFaqs: 'Aucune FAQ trouvée',
    articles: 'Articles d\'Aide',
    contactSupport: 'Besoin d\'Aide?',
    contactSupportDescription: 'Vous ne trouvez pas ce que vous cherchez? Contactez notre équipe de support.',
    email: 'E-mail',
    responseTime: 'Nous répondons généralement dans les 24 heures.',
    articleNotFound: 'Article Non Trouvé',
    articleNotFoundDescription: 'L\'article d\'aide que vous recherchez n\'existe pas.',
    backToHelp: 'Retour au Centre d\'Aide',
  },
};
