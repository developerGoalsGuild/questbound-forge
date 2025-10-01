export type Language = 'en' | 'es' | 'fr';

export interface GoalDashboardTranslations {
  button: {
    title: string;
    subtitle: string;
    viewAll: string;
  };
  stats: {
    activeGoals: string;
    completedGoals: string;
    totalGoals: string;
  };
  messages: {
    noGoals: string;
    loading: string;
  };
  tooltips: {
    viewGoals: string;
    createGoal: string;
  };
}

export const goalDashboardTranslations: Record<Language, GoalDashboardTranslations> = {
  en: {
    button: {
      title: 'Goals',
      subtitle: 'Manage your goals',
      viewAll: 'View All Goals',
    },
    stats: {
      activeGoals: 'Active Goals',
      completedGoals: 'Completed Goals',
      totalGoals: 'Total Goals',
    },
    messages: {
      noGoals: 'No goals yet',
      loading: 'Loading goals...',
    },
    tooltips: {
      viewGoals: 'View and manage your goals',
      createGoal: 'Create a new goal',
    },
  },
  es: {
    button: {
      title: 'Objetivos',
      subtitle: 'Gestiona tus objetivos',
      viewAll: 'Ver Todos los Objetivos',
    },
    stats: {
      activeGoals: 'Objetivos Activos',
      completedGoals: 'Objetivos Completados',
      totalGoals: 'Total de Objetivos',
    },
    messages: {
      noGoals: 'Aún no hay objetivos',
      loading: 'Cargando objetivos...',
    },
    tooltips: {
      viewGoals: 'Ver y gestionar tus objetivos',
      createGoal: 'Crear un nuevo objetivo',
    },
  },
  fr: {
    button: {
      title: 'Objectifs',
      subtitle: 'Gérez vos objectifs',
      viewAll: 'Voir Tous les Objectifs',
    },
    stats: {
      activeGoals: 'Objectifs Actifs',
      completedGoals: 'Objectifs Terminés',
      totalGoals: 'Total des Objectifs',
    },
    messages: {
      noGoals: 'Aucun objectif pour le moment',
      loading: 'Chargement des objectifs...',
    },
    tooltips: {
      viewGoals: 'Voir et gérer vos objectifs',
      createGoal: 'Créer un nouvel objectif',
    },
  },
};
