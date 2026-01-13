/**
 * Blog Posts Metadata
 */

import { Language } from '@/i18n/common';

export interface BlogPostTranslations {
  title: string;
  excerpt: string;
  author: string;
}

export interface BlogPost {
  slug: string;
  translations: Record<Language, BlogPostTranslations>;
  date: string;
  category: 'product-updates' | 'community' | 'tips-tricks';
  featured: boolean;
  readTime: number;
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'welcome-to-goalsguild',
    translations: {
      en: {
        title: 'Welcome to GoalsGuild: Your Journey Starts Here',
        excerpt: 'We\'re excited to introduce GoalsGuild, a revolutionary platform that helps you achieve your goals through community, gamification, and AI-powered guidance.',
        author: 'GoalsGuild Team',
      },
      es: {
        title: 'Bienvenido a GoalsGuild: Tu Viaje Comienza Aquí',
        excerpt: 'Estamos emocionados de presentar GoalsGuild, una plataforma revolucionaria que te ayuda a lograr tus metas a través de la comunidad, la gamificación y la orientación impulsada por IA.',
        author: 'Equipo GoalsGuild',
      },
      fr: {
        title: 'Bienvenue sur GoalsGuild: Votre Voyage Commence Ici',
        excerpt: 'Nous sommes ravis de vous présenter GoalsGuild, une plateforme révolutionnaire qui vous aide à atteindre vos objectifs grâce à la communauté, la gamification et des conseils alimentés par l\'IA.',
        author: 'Équipe GoalsGuild',
      },
    },
    date: '2024-12-15',
    category: 'product-updates',
    featured: true,
    readTime: 5
  },
  {
    slug: 'getting-started-with-goals',
    translations: {
      en: {
        title: 'Getting Started with Goals: A Beginner\'s Guide',
        excerpt: 'Learn how to create your first goal, break it down into manageable tasks, and track your progress effectively.',
        author: 'GoalsGuild Team',
      },
      es: {
        title: 'Cómo Empezar con las Metas: Guía para Principiantes',
        excerpt: 'Aprende a crear tu primera meta, dividirla en tareas manejables y rastrear tu progreso de manera efectiva.',
        author: 'Equipo GoalsGuild',
      },
      fr: {
        title: 'Commencer avec les Objectifs: Guide pour Débutants',
        excerpt: 'Apprenez à créer votre premier objectif, à le décomposer en tâches gérables et à suivre efficacement vos progrès.',
        author: 'Équipe GoalsGuild',
      },
    },
    date: '2024-12-10',
    category: 'tips-tricks',
    featured: true,
    readTime: 8
  },
  {
    slug: 'building-successful-guilds',
    translations: {
      en: {
        title: 'Building Successful Guilds: Tips for Community Leaders',
        excerpt: 'Discover strategies for creating and managing thriving guilds that help members achieve their goals together.',
        author: 'GoalsGuild Team',
      },
      es: {
        title: 'Construyendo Gremios Exitosos: Consejos para Líderes Comunitarios',
        excerpt: 'Descubre estrategias para crear y gestionar gremios prósperos que ayuden a los miembros a lograr sus metas juntos.',
        author: 'Equipo GoalsGuild',
      },
      fr: {
        title: 'Construire des Guildes Réussies: Conseils pour les Leaders Communautaires',
        excerpt: 'Découvrez des stratégies pour créer et gérer des guildes prospères qui aident les membres à atteindre leurs objectifs ensemble.',
        author: 'Équipe GoalsGuild',
      },
    },
    date: '2024-12-05',
    category: 'community',
    featured: false,
    readTime: 6
  },
  {
    slug: 'quest-system-explained',
    translations: {
      en: {
        title: 'The Quest System Explained: Gamify Your Progress',
        excerpt: 'Understand how quests work, how to earn XP and badges, and how gamification can motivate you to achieve more.',
        author: 'GoalsGuild Team',
      },
      es: {
        title: 'El Sistema de Misiones Explicado: Gamifica tu Progreso',
        excerpt: 'Entiende cómo funcionan las misiones, cómo ganar XP e insignias, y cómo la gamificación puede motivarte a lograr más.',
        author: 'Equipo GoalsGuild',
      },
      fr: {
        title: 'Le Système de Quêtes Expliqué: Gamifiez Votre Progrès',
        excerpt: 'Comprenez comment fonctionnent les quêtes, comment gagner de l\'XP et des badges, et comment la gamification peut vous motiver à accomplir plus.',
        author: 'Équipe GoalsGuild',
      },
    },
    date: '2024-11-28',
    category: 'tips-tricks',
    featured: false,
    readTime: 7
  },
  {
    slug: 'december-2024-updates',
    translations: {
      en: {
        title: 'December 2024 Updates: New Features and Improvements',
        excerpt: 'Check out the latest features we\'ve added, including improved collaboration tools, enhanced analytics, and more.',
        author: 'GoalsGuild Team',
      },
      es: {
        title: 'Actualizaciones de Diciembre 2024: Nuevas Funciones y Mejoras',
        excerpt: 'Consulta las últimas funciones que hemos agregado, incluyendo herramientas de colaboración mejoradas, análisis mejorados y más.',
        author: 'Equipo GoalsGuild',
      },
      fr: {
        title: 'Mises à Jour de Décembre 2024: Nouvelles Fonctionnalités et Améliorations',
        excerpt: 'Découvrez les dernières fonctionnalités que nous avons ajoutées, notamment des outils de collaboration améliorés, des analyses améliorées et plus encore.',
        author: 'Équipe GoalsGuild',
      },
    },
    date: '2024-12-01',
    category: 'product-updates',
    featured: true,
    readTime: 4
  }
];

