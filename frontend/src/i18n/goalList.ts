export type Language = 'en' | 'es' | 'fr';

export interface GoalListTranslations {
  title: string;
  subtitle: string;
  search: {
    placeholder: string;
    label: string;
  };
  filters: {
    statusLabel: string;
    allStatuses: string;
    statusActive: string;
    statusPaused: string;
    statusCompleted: string;
    statusArchived: string;
  };
  hints: {
    iconLabel: string;
    filters: {
      search: string;
      status: string;
    };
    table: {
      title: string;
      description: string;
      deadline: string;
      status: string;
      category: string;
      actions: string;
    };
  };
  actions: {
    createGoal: string;
    editGoal: string;
    deleteGoal: string;
    viewTasks: string;
    viewDetails: string;
  };
  table: {
    columns: {
      title: string;
      description: string;
      deadline: string;
      status: string;
      category: string;
      actions: string;
    };
    noGoals: string;
    noGoalsDescription: string;
  };
  pagination: {
    showing: string;
    of: string;
    results: string;
    previous: string;
    next: string;
  };
  messages: {
    deleteConfirm: string;
    deleteSuccess: string;
    deleteError: string;
    statusUpdateSuccess: string;
    statusUpdateError: string;
    loading: string;
  };
  validation: {
    searchRequired: string;
    invalidSearchTerm: string;
  };
}

export const goalListTranslations: Record<Language, GoalListTranslations> = {
  en: {
    title: 'My Goals',
    subtitle: 'Manage and track your goals',
    search: {
      placeholder: 'Search goals...',
      label: 'Search goals',
    },
    filters: {
      statusLabel: 'Filter by status',
      allStatuses: 'All Statuses',
      statusActive: 'Active',
      statusPaused: 'Paused',
      statusCompleted: 'Completed',
      statusArchived: 'Archived',
    },
    hints: {
      iconLabel: 'More information about {field}',
      filters: {
        search: 'Type keywords to find goals by title or description content.',
        status: 'Filter goals by their current progress state (active, paused, completed, or archived).',
      },
      table: {
        title: 'The main name or title of your goal.',
        description: 'Brief summary of what this goal aims to achieve.',
        deadline: 'Target completion date for this goal.',
        status: 'Current progress state of the goal.',
        category: 'Optional categorization to group related goals.',
        actions: 'Available operations you can perform on this goal.',
      },
    },
    actions: {
      createGoal: 'Create New Goal',
      editGoal: 'Edit Goal',
      deleteGoal: 'Delete Goal',
      viewTasks: 'View Tasks',
      viewDetails: 'View Details',
    },
    table: {
      columns: {
        title: 'Title',
        description: 'Description',
        deadline: 'Deadline',
        status: 'Status',
        category: 'Category',
        actions: 'Actions',
      },
      noGoals: 'No goals yet',
      noGoalsDescription: 'Create your first goal to get started on your journey.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      results: 'results',
      previous: 'Previous',
      next: 'Next',
    },
    messages: {
      deleteConfirm: 'Are you sure you want to delete this goal? This action cannot be undone.',
      deleteSuccess: 'Goal deleted successfully',
      deleteError: 'Failed to delete goal',
      statusUpdateSuccess: 'Goal status updated successfully',
      statusUpdateError: 'Failed to update goal status',
      loading: 'Loading goals...',
    },
    validation: {
      searchRequired: 'Search term is required',
      invalidSearchTerm: 'Invalid search term',
    },
  },
  es: {
    title: 'Mis Objetivos',
    subtitle: 'Gestiona y rastrea tus objetivos',
    search: {
      placeholder: 'Buscar objetivos...',
      label: 'Buscar objetivos',
    },
    filters: {
      statusLabel: 'Filtrar por estado',
      allStatuses: 'Todos los Estados',
      statusActive: 'Activo',
      statusPaused: 'Pausado',
      statusCompleted: 'Completado',
      statusArchived: 'Archivado',
    },
    hints: {
      iconLabel: 'Más información sobre {field}',
      filters: {
        search: 'Escribe palabras clave para encontrar objetivos por título o contenido de descripción.',
        status: 'Filtra objetivos por su estado de progreso actual (activo, pausado, completado o archivado).',
      },
      table: {
        title: 'El nombre principal o título de tu objetivo.',
        description: 'Resumen breve de lo que este objetivo pretende lograr.',
        deadline: 'Fecha objetivo de finalización para este objetivo.',
        status: 'Estado de progreso actual del objetivo.',
        category: 'Categorización opcional para agrupar objetivos relacionados.',
        actions: 'Operaciones disponibles que puedes realizar en este objetivo.',
      },
    },
    actions: {
      createGoal: 'Crear Nuevo Objetivo',
      editGoal: 'Editar Objetivo',
      deleteGoal: 'Eliminar Objetivo',
      viewTasks: 'Ver Tareas',
      viewDetails: 'Ver Detalles',
    },
    table: {
      columns: {
        title: 'Título',
        description: 'Descripción',
        deadline: 'Fecha Límite',
        status: 'Estado',
        category: 'Categoría',
        actions: 'Acciones',
      },
      noGoals: 'Aún no hay objetivos',
      noGoalsDescription: 'Crea tu primer objetivo para comenzar tu viaje.',
    },
    pagination: {
      showing: 'Mostrando',
      of: 'de',
      results: 'resultados',
      previous: 'Anterior',
      next: 'Siguiente',
    },
    messages: {
      deleteConfirm: '¿Estás seguro de que quieres eliminar este objetivo? Esta acción no se puede deshacer.',
      deleteSuccess: 'Objetivo eliminado exitosamente',
      deleteError: 'Error al eliminar objetivo',
      statusUpdateSuccess: 'Estado del objetivo actualizado exitosamente',
      statusUpdateError: 'Error al actualizar estado del objetivo',
      loading: 'Cargando objetivos...',
    },
    validation: {
      searchRequired: 'El término de búsqueda es obligatorio',
      invalidSearchTerm: 'Término de búsqueda inválido',
    },
  },
  fr: {
    title: 'Mes Objectifs',
    subtitle: 'Gérez et suivez vos objectifs',
    search: {
      placeholder: 'Rechercher des objectifs...',
      label: 'Rechercher des objectifs',
    },
    filters: {
      statusLabel: 'Filtrer par statut',
      allStatuses: 'Tous les Statuts',
      statusActive: 'Actif',
      statusPaused: 'En Pause',
      statusCompleted: 'Terminé',
      statusArchived: 'Archivé',
    },
    hints: {
      iconLabel: 'Plus d\'informations sur {field}',
      filters: {
        search: 'Tapez des mots-clés pour trouver des objectifs par titre ou contenu de description.',
        status: 'Filtrez les objectifs par leur état de progression actuel (actif, en pause, terminé ou archivé).',
      },
      table: {
        title: 'Le nom principal ou le titre de votre objectif.',
        description: 'Résumé bref de ce que cet objectif vise à accomplir.',
        deadline: 'Date cible de finalisation pour cet objectif.',
        status: 'État de progression actuel de l\'objectif.',
        category: 'Catégorisation optionnelle pour regrouper les objectifs liés.',
        actions: 'Opérations disponibles que vous pouvez effectuer sur cet objectif.',
      },
    },
    actions: {
      createGoal: 'Créer un Nouvel Objectif',
      editGoal: 'Modifier l\'Objectif',
      deleteGoal: 'Supprimer l\'Objectif',
      viewTasks: 'Voir les Tâches',
      viewDetails: 'Voir les Détails',
    },
    table: {
      columns: {
        title: 'Titre',
        description: 'Description',
        deadline: 'Échéance',
        status: 'Statut',
        category: 'Catégorie',
        actions: 'Actions',
      },
      noGoals: 'Aucun objectif pour le moment',
      noGoalsDescription: 'Créez votre premier objectif pour commencer votre voyage.',
    },
    pagination: {
      showing: 'Affichage',
      of: 'sur',
      results: 'résultats',
      previous: 'Précédent',
      next: 'Suivant',
    },
    messages: {
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cet objectif ? Cette action ne peut pas être annulée.',
      deleteSuccess: 'Objectif supprimé avec succès',
      deleteError: 'Échec de la suppression de l\'objectif',
      statusUpdateSuccess: 'Statut de l\'objectif mis à jour avec succès',
      statusUpdateError: 'Échec de la mise à jour du statut de l\'objectif',
      loading: 'Chargement des objectifs...',
    },
    validation: {
      searchRequired: 'Le terme de recherche est requis',
      invalidSearchTerm: 'Terme de recherche invalide',
    },
  },
};
