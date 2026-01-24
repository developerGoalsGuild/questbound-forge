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
    sortBy: string;
    order: string;
    sortOptions: {
      createdAt: string;
      title: string;
      deadline: string;
      status: string;
    };
    orderOptions: {
      newestFirst: string;
      oldestFirst: string;
    };
    itemsPerPage: string;
    categoryLabel: string;
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
    actions: string;
    edit: string;
    delete: string;
    changeStatus: string;
    statusDescriptions: {
      active: string;
      paused: string;
      completed: string;
      archived: string;
    };
    deleteDialog: {
      title: string;
      description: string;
      cancel: string;
      delete: string;
      deleting: string;
    };
    statusChangeSuccess: string;
    deleteSuccess: string;
    error: string;
    changing: string;
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
    error: string;
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
      sortBy: 'Sort By',
      order: 'Order',
      sortOptions: {
        createdAt: 'Created Date',
        title: 'Title',
        deadline: 'Deadline',
        status: 'Status',
      },
      orderOptions: {
        newestFirst: 'Newest First',
        oldestFirst: 'Oldest First',
      },
      itemsPerPage: 'Items per page:',
      categoryLabel: 'Category:',
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
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      changeStatus: 'Change Status',
      statusDescriptions: {
        active: 'Resume working on this goal',
        paused: 'Temporarily pause this goal',
        completed: 'Mark this goal as completed',
        archived: 'Archive this goal',
      },
      deleteDialog: {
        title: 'Delete Goal',
        description: 'Are you sure you want to delete "{goalTitle}"? This action cannot be undone.',
        cancel: 'Cancel',
        delete: 'Delete',
        deleting: 'Deleting...',
      },
      statusChangeSuccess: 'Goal status changed to {status}',
      deleteSuccess: 'Goal deleted successfully',
      error: 'Error',
      changing: 'Changing...',
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
      error: 'Error',
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
      sortBy: 'Ordenar por',
      order: 'Orden',
      sortOptions: {
        createdAt: 'Fecha de Creación',
        title: 'Título',
        deadline: 'Fecha Límite',
        status: 'Estado',
      },
      orderOptions: {
        newestFirst: 'Más Recientes Primero',
        oldestFirst: 'Más Antiguos Primero',
      },
      itemsPerPage: 'Elementos por página:',
      categoryLabel: 'Categoría:',
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
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      changeStatus: 'Cambiar Estado',
      statusDescriptions: {
        active: 'Reanudar el trabajo en este objetivo',
        paused: 'Pausar temporalmente este objetivo',
        completed: 'Marcar este objetivo como completado',
        archived: 'Archivar este objetivo',
      },
      deleteDialog: {
        title: 'Eliminar Objetivo',
        description: '¿Estás seguro de que quieres eliminar "{goalTitle}"? Esta acción no se puede deshacer.',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        deleting: 'Eliminando...',
      },
      statusChangeSuccess: 'Estado del objetivo cambiado a {status}',
      deleteSuccess: 'Objetivo eliminado exitosamente',
      error: 'Error',
      changing: 'Cambiando...',
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
      error: 'Error',
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
      sortBy: 'Trier par',
      order: 'Ordre',
      sortOptions: {
        createdAt: 'Date de Création',
        title: 'Titre',
        deadline: 'Échéance',
        status: 'Statut',
      },
      orderOptions: {
        newestFirst: 'Plus Récent en Premier',
        oldestFirst: 'Plus Ancien en Premier',
      },
      itemsPerPage: 'Éléments par page:',
      categoryLabel: 'Catégorie:',
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
      actions: 'Actions',
      edit: 'Modifier',
      delete: 'Supprimer',
      changeStatus: 'Changer le Statut',
      statusDescriptions: {
        active: 'Reprendre le travail sur cet objectif',
        paused: 'Mettre temporairement en pause cet objectif',
        completed: 'Marquer cet objectif comme terminé',
        archived: 'Archiver cet objectif',
      },
      deleteDialog: {
        title: 'Supprimer l\'Objectif',
        description: 'Êtes-vous sûr de vouloir supprimer "{goalTitle}" ? Cette action ne peut pas être annulée.',
        cancel: 'Annuler',
        delete: 'Supprimer',
        deleting: 'Suppression...',
      },
      statusChangeSuccess: 'Statut de l\'objectif changé en {status}',
      deleteSuccess: 'Objectif supprimé avec succès',
      error: 'Erreur',
      changing: 'Changement...',
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
      error: 'Erreur',
    },
    validation: {
      searchRequired: 'Le terme de recherche est requis',
      invalidSearchTerm: 'Terme de recherche invalide',
    },
  },
};
