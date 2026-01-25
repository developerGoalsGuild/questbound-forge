export type Language = 'en' | 'es' | 'fr';

export interface GoalDashboardTranslations {
  button: {
    title: string;
    subtitle: string;
    viewAll: string;
    createGoal: string;
  };
  stats: {
    activeGoals: string;
    activeGoalsCount: string; // Format: "{count} active goals"
    activeGoalCount: string; // Format: "1 active goal" (singular)
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
  goalsList: {
    title: string;
    sortBy: string;
    sortOptions: {
      deadlineAsc: string;
      deadlineDesc: string;
      progressAsc: string;
      progressDesc: string;
      taskProgressAsc: string;
      taskProgressDesc: string;
      titleAsc: string;
      titleDesc: string;
      createdAsc: string;
      createdDesc: string;
    };
    noDeadline: string;
    progress: {
      overdue: string;
      urgent: string;
      onTrack: string;
      noDeadline: string;
    };
    expandCollapse: {
      expand: string;
      collapse: string;
    };
  };
  progressMetrics: {
    overall: string;
    taskProgress: string;
    timeProgress: string;
    completedTasks: string;
    totalTasks: string;
    tasks: string;
    daysLeft: string;
    milestones: {
      title: string;
      achieved: string;
      upcoming: string;
      firstQuarter: string;
      halfwayPoint: string;
      threeQuarters: string;
      complete: string;
    };
  };
}

export const goalDashboardTranslations: Record<Language, GoalDashboardTranslations> = {
  en: {
    button: {
      title: 'Goals',
      subtitle: 'Manage your goals',
      viewAll: 'View All Goals',
      createGoal: 'Create Goal',
    },
    stats: {
      activeGoals: 'Active Goals',
      activeGoalsCount: '{count} active goals',
      activeGoalCount: '1 active goal',
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
    goalsList: {
      title: 'Top Goals',
      sortBy: 'Sort by',
      sortOptions: {
        deadlineAsc: 'Deadline (earliest first)',
        deadlineDesc: 'Deadline (latest first)',
        progressAsc: 'Progress (lowest first)',
        progressDesc: 'Progress (highest first)',
        taskProgressAsc: 'Task Progress (lowest first)',
        taskProgressDesc: 'Task Progress (highest first)',
        titleAsc: 'Title (A-Z)',
        titleDesc: 'Title (Z-A)',
        createdAsc: 'Created (oldest first)',
        createdDesc: 'Created (newest first)',
      },
      noDeadline: 'No deadline',
      progress: {
        overdue: 'Overdue',
        urgent: 'Urgent',
        onTrack: 'On Track',
        noDeadline: 'No Deadline',
      },
      expandCollapse: {
        expand: 'Show Goals',
        collapse: 'Hide Goals',
      },
    },
    progressMetrics: {
      overall: 'Overall Progress',
      taskProgress: 'Task Progress',
      timeProgress: 'Time Progress',
      completedTasks: 'Completed Tasks',
      totalTasks: 'Total Tasks',
      tasks: 'tasks',
      daysLeft: 'days left',
      milestones: {
        title: 'Milestones',
        achieved: 'Achieved',
        upcoming: 'Upcoming',
        firstQuarter: 'First Quarter',
        halfwayPoint: 'Halfway Point',
        threeQuarters: 'Three Quarters',
        complete: 'Complete',
      },
    },
  },
  es: {
    button: {
      title: 'Objetivos',
      subtitle: 'Gestiona tus objetivos',
      viewAll: 'Ver Todos los Objetivos',
      createGoal: 'Crear Objetivo',
    },
    stats: {
      activeGoals: 'Objetivos Activos',
      activeGoalsCount: '{count} objetivos activos',
      activeGoalCount: '1 objetivo activo',
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
    goalsList: {
      title: 'Mejores Objetivos',
      sortBy: 'Ordenar por',
      sortOptions: {
        deadlineAsc: 'Fecha límite (más temprana primero)',
        deadlineDesc: 'Fecha límite (más tardía primero)',
        progressAsc: 'Progreso (menor primero)',
        progressDesc: 'Progreso (mayor primero)',
        taskProgressAsc: 'Progreso de Tareas (menor primero)',
        taskProgressDesc: 'Progreso de Tareas (mayor primero)',
        titleAsc: 'Título (A-Z)',
        titleDesc: 'Título (Z-A)',
        createdAsc: 'Creado (más antiguo primero)',
        createdDesc: 'Creado (más reciente primero)',
      },
      noDeadline: 'Sin fecha límite',
      progress: {
        overdue: 'Vencido',
        urgent: 'Urgente',
        onTrack: 'En camino',
        noDeadline: 'Sin fecha límite',
      },
      expandCollapse: {
        expand: 'Mostrar Objetivos',
        collapse: 'Ocultar Objetivos',
      },
    },
    progressMetrics: {
      overall: 'Progreso General',
      taskProgress: 'Progreso de Tareas',
      timeProgress: 'Progreso de Tiempo',
      completedTasks: 'Tareas Completadas',
      totalTasks: 'Total de Tareas',
      tasks: 'tareas',
      daysLeft: 'días restantes',
      milestones: {
        title: 'Hitos',
        achieved: 'Logrado',
        upcoming: 'Próximo',
        firstQuarter: 'Primer Cuarto',
        halfwayPoint: 'Punto Medio',
        threeQuarters: 'Tres Cuartos',
        complete: 'Completo',
      },
    },
  },
  fr: {
    button: {
      title: 'Objectifs',
      subtitle: 'Gérez vos objectifs',
      viewAll: 'Voir Tous les Objectifs',
      createGoal: 'Créer Objectif',
    },
    stats: {
      activeGoals: 'Objectifs Actifs',
      activeGoalsCount: '{count} objectifs actifs',
      activeGoalCount: '1 objectif actif',
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
    goalsList: {
      title: 'Meilleurs Objectifs',
      sortBy: 'Trier par',
      sortOptions: {
        deadlineAsc: 'Échéance (plus tôt en premier)',
        deadlineDesc: 'Échéance (plus tard en premier)',
        progressAsc: 'Progrès (plus faible en premier)',
        progressDesc: 'Progrès (plus élevé en premier)',
        taskProgressAsc: 'Progrès des Tâches (plus faible en premier)',
        taskProgressDesc: 'Progrès des Tâches (plus élevé en premier)',
        titleAsc: 'Titre (A-Z)',
        titleDesc: 'Titre (Z-A)',
        createdAsc: 'Créé (plus ancien en premier)',
        createdDesc: 'Créé (plus récent en premier)',
      },
      noDeadline: 'Aucune échéance',
      progress: {
        overdue: 'En retard',
        urgent: 'Urgent',
        onTrack: 'Sur la bonne voie',
        noDeadline: 'Aucune échéance',
      },
      expandCollapse: {
        expand: 'Afficher les Objectifs',
        collapse: 'Masquer les Objectifs',
      },
    },
    progressMetrics: {
      overall: 'Progrès Global',
      taskProgress: 'Progrès des Tâches',
      timeProgress: 'Progrès Temporel',
      completedTasks: 'Tâches Terminées',
      totalTasks: 'Total des Tâches',
      tasks: 'tâches',
      daysLeft: 'jours restants',
      milestones: {
        title: 'Jalons',
        achieved: 'Atteint',
        upcoming: 'À Venir',
        firstQuarter: 'Premier Quart',
        halfwayPoint: 'Mi-Parcours',
        threeQuarters: 'Trois Quarts',
        complete: 'Complet',
      },
    },
  },
};
