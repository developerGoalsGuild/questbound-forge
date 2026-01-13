/**
 * Blog page translations
 */

import { Language } from './common';

export interface BlogTranslations {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  all: string;
  featured: string;
  allPosts: string;
  noPosts: string;
  minRead: string;
  categories: {
    productUpdates: string;
    community: string;
    tipsTricks: string;
  };
  notFound: string;
  notFoundDescription: string;
  backToBlog: string;
  loading: string;
}

export const blogTranslations: Record<Language, BlogTranslations> = {
  en: {
    title: 'Blog',
    subtitle: 'Stories, tips, and updates from GoalsGuild',
    searchPlaceholder: 'Search posts...',
    all: 'All',
    featured: 'Featured Posts',
    allPosts: 'All Posts',
    noPosts: 'No posts found',
    minRead: 'min read',
    categories: {
      productUpdates: 'Product Updates',
      community: 'Community',
      tipsTricks: 'Tips & Tricks',
    },
    notFound: 'Post Not Found',
    notFoundDescription: 'The blog post you\'re looking for doesn\'t exist.',
    backToBlog: 'Back to Blog',
    loading: 'Loading...',
  },
  es: {
    title: 'Blog',
    subtitle: 'Historias, consejos y actualizaciones de GoalsGuild',
    searchPlaceholder: 'Buscar publicaciones...',
    all: 'Todas',
    featured: 'Publicaciones Destacadas',
    allPosts: 'Todas las Publicaciones',
    noPosts: 'No se encontraron publicaciones',
    minRead: 'min de lectura',
    categories: {
      productUpdates: 'Actualizaciones de Producto',
      community: 'Comunidad',
      tipsTricks: 'Consejos y Trucos',
    },
    notFound: 'Publicación No Encontrada',
    notFoundDescription: 'La publicación que buscas no existe.',
    backToBlog: 'Volver al Blog',
    loading: 'Cargando...',
  },
  fr: {
    title: 'Blog',
    subtitle: 'Histoires, conseils et mises à jour de GoalsGuild',
    searchPlaceholder: 'Rechercher des articles...',
    all: 'Tous',
    featured: 'Articles en Vedette',
    allPosts: 'Tous les Articles',
    noPosts: 'Aucun article trouvé',
    minRead: 'min de lecture',
    categories: {
      productUpdates: 'Mises à Jour du Produit',
      community: 'Communauté',
      tipsTricks: 'Conseils et Astuces',
    },
    notFound: 'Article Non Trouvé',
    notFoundDescription: 'L\'article que vous recherchez n\'existe pas.',
    backToBlog: 'Retour au Blog',
    loading: 'Chargement...',
  },
};
