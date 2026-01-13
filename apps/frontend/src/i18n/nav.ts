export type Language = 'en' | 'es' | 'fr';

export interface NavTranslations {
  home: string;
  features: string;
  community: string;
  pricing: string;
  contact: string;
  login: string;
  signup: string;
  dashboard: string;
  goals: string;
  chat: string;
  logout: string;
  account: string;
  profile: string;
  subscription: string;
  manageBilling: string;
}

export const navTranslations: Record<Language, NavTranslations> = {
  en: {
    home: 'Home',
    features: 'Features',
    community: 'Community',
    pricing: 'Pricing',
    contact: 'Contact',
    login: 'Sign In',
    signup: 'Join Guild',
    dashboard: 'Dashboard',
    goals: 'Quests',
    chat: 'Chat',
    logout: 'Sign Out',
    account: 'Account',
    profile: 'Profile',
    subscription: 'Subscription',
    manageBilling: 'Manage Billing',
  },
  es: {
    home: 'Inicio',
    features: 'Funciones',
    community: 'Comunidad',
    pricing: 'Precios',
    contact: 'Contacto',
    login: 'Iniciar sesión',
    signup: 'Unirse al Gremio',
    dashboard: 'Panel',
    goals: 'Misiones',
    chat: 'Chat',
    logout: 'Cerrar sesión',
    account: 'Cuenta',
    profile: 'Perfil',
    subscription: 'Suscripción',
    manageBilling: 'Gestionar facturación',
  },
  fr: {
    home: 'Accueil',
    features: 'Fonctionnalités',
    community: 'Communauté',
    pricing: 'Tarifs',
    contact: 'Contact',
    login: 'Se connecter',
    signup: 'Rejoindre la Guilde',
    dashboard: 'Tableau de bord',
    goals: 'Quêtes',
    chat: 'Chat',
    logout: 'Se déconnecter',
    account: 'Compte',
    profile: 'Profil',
    subscription: 'Abonnement',
    manageBilling: 'Gérer la facturation',
  },
};
