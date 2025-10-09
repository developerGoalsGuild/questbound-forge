import { HeaderTranslations } from '@/models/header';

export const headerTranslations: Record<string, HeaderTranslations> = {
  en: {
    goalsCount: {
      active: 'Active Goals',
      loading: 'Loading...',
      error: 'Failed to load',
      retry: 'Retry',
    },
    userMenu: {
      dashboard: 'Dashboard',
      quests: 'Quests',
      questDashboard: 'Quest Dashboard',
      profile: 'Edit Profile',
      changePassword: 'Change Password',
      logout: 'Logout',
      openMenu: 'Open user menu',
      closeMenu: 'Close user menu',
    },
    accessibility: {
      goalsCountLabel: 'Number of active goals',
      userMenuLabel: 'User account menu',
      navigationHint: 'Use arrow keys to navigate menu items, Enter to select, Escape to close',
    },
  },
  es: {
    goalsCount: {
      active: 'Objetivos Activos',
      loading: 'Cargando...',
      error: 'Error al cargar',
      retry: 'Reintentar',
    },
    userMenu: {
      dashboard: 'Panel de Control',
      quests: 'Misiones',
      questDashboard: 'Panel de Misiones',
      profile: 'Editar Perfil',
      changePassword: 'Cambiar Contraseña',
      logout: 'Cerrar Sesión',
      openMenu: 'Abrir menú de usuario',
      closeMenu: 'Cerrar menú de usuario',
    },
    accessibility: {
      goalsCountLabel: 'Número de objetivos activos',
      userMenuLabel: 'Menú de cuenta de usuario',
      navigationHint: 'Usa las flechas para navegar por los elementos del menú, Enter para seleccionar, Escape para cerrar',
    },
  },
  fr: {
    goalsCount: {
      active: 'Objectifs Actifs',
      loading: 'Chargement...',
      error: 'Échec du chargement',
      retry: 'Réessayer',
    },
    userMenu: {
      dashboard: 'Tableau de Bord',
      quests: 'Quêtes',
      questDashboard: 'Tableau de Bord des Quêtes',
      profile: 'Modifier le Profil',
      changePassword: 'Changer le Mot de Passe',
      logout: 'Se Déconnecter',
      openMenu: 'Ouvrir le menu utilisateur',
      closeMenu: 'Fermer le menu utilisateur',
    },
    accessibility: {
      goalsCountLabel: 'Nombre d\'objectifs actifs',
      userMenuLabel: 'Menu du compte utilisateur',
      navigationHint: 'Utilisez les flèches pour naviguer dans les éléments du menu, Entrée pour sélectionner, Échap pour fermer',
    },
  },
};

export default headerTranslations;
