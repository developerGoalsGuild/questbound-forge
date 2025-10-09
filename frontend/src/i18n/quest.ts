/**
 * Quest translations for GoalsGuild application
 * 
 * This file contains all quest-related translations including:
 * - Status labels (draft, active, completed, cancelled, failed)
 * - Difficulty levels (easy, medium, hard)
 * - Form labels and validation messages
 * - Action buttons and confirmations
 * - Error messages and notifications
 * 
 * Structure follows the established pattern from other translation files
 * and aligns with getQuestStatusKey and getQuestDifficultyKey helpers.
 */

export interface QuestTranslations {
  // Status translations
  status: {
    draft: string;
    active: string;
    completed: string;
    cancelled: string;
    failed: string;
  };
  
  // Difficulty translations
  difficulty: {
    easy: string;
    medium: string;
    hard: string;
  };

  // Count scope translations
  countScope: {
    completed_tasks: string;
    completed_goals: string;
  };
  
  // Form fields
  fields: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    rewardXp: string;
    tags: string;
    deadline: string;
    privacy: string;
    kind: string;
    linkedGoals: string;
    linkedTasks: string;
    linkedItems: string;
    linkedItemsDescription: string;
    goals: string;
    tasks: string;
    dependsOnQuests: string;
    targetCount: string;
    countScope: string;
    period: string;
    days: string;
    createdAt: string;
    updatedAt: string;
    startedAt: string;
  };

  // Filters
  filters: {
    title: 'Filters',
    search: 'Search',
    searchPlaceholder: 'Search quests...',
    searchAriaLabel: 'Search quests',
    status: 'Status',
    statusPlaceholder: 'All statuses',
    difficulty: 'Difficulty',
    difficultyPlaceholder: 'All difficulties',
    category: 'Category',
    categoryPlaceholder: 'All categories',
    clear: 'Clear',
    clearAll: 'Clear All',
    clearFilters: 'Clear all filters',
    active: 'active',
    activeFilters: 'active filters',
    showing: 'Showing',
  };

  // Tooltips
  tooltips: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    privacy: string;
    kind: string;
    tags: string;
    targetCount: string;
    countScope: string;
    period: string;
    deadline: string;
    progressQuantitative: string;
    progressLinked: string;
    editButton: string;
    startButton: string;
    startDisabled: string;
    startDisabledQuantitative: string;
    deleteButton: string;
    viewButton: string;
    cancelButton: string;
    failButton: string;
    viewCompletedButton: string;
    linkedGoals: string;
    linkedTasks: string;
    filters: string;
    statusFilter: string;
    difficultyFilter: string;
    categoryFilter: string;
    clearFilters: string;
    createQuest: string;
    retry: string;
  };
  
  // Validation messages
  validation: {
    titleRequired: string;
    titleMinLength: string;
    titleMaxLength: string;
    titleEmpty: string;
    descriptionMaxLength: string;
    categoryRequired: string;
    categoryInvalid: string;
    difficultyRequired: string;
    privacyRequired: string;
    kindRequired: string;
    targetCountRequired: string;
    countScopeRequired: string;
    periodRequired: string;
    deadlineRequired: string;
    deadlineFuture: string;
    invalidConfiguration: string;
    rewardXpMin: string;
    rewardXpMax: string;
    rewardXpInteger: string;
    tagsMaxCount: string;
    tagMaxLength: string;
    deadlineInvalid: string;
    targetCountPositive: string;
    periodPositive: string;
    quantitativeFieldsRequired: string;
    linkedItemsRequired: string;
    linkedGoalsRequired: string;
    linkedTasksRequired: string;
    reasonMaxLength: string;
  };
  
  // Actions
  actions: {
    create: string;
    edit: string;
    start: string;
    cancel: string;
    fail: string;
    delete: string;
    save: string;
    saving: string;
    canceling: string;
    deleting: string;
    starting: string;
    failing: string;
    retry: string;
    refresh: string;
    updateQuest: string;
    updating: string;
    next: string;
    previous: string;
    createQuest: string;
    creating: string;
    back: string;
    finish: string;
    finishing: string;
  };
  
  // Messages
  messages: {
    createSuccess: string;
    editSuccess: string;
    startSuccess: string;
    cancelSuccess: string;
    failSuccess: string;
    deleteSuccess: string;
    createError: string;
    editError: string;
    startError: string;
    cancelError: string;
    failError: string;
    deleteError: string;
    loadError: string;
    networkError: string;
    validationError: string;
    permissionError: string;
    notFoundError: string;
    conflictError: string;
    serverError: string;
    unexpectedError: string;
    notStarted: string;
    loadFailed: string;
    cannotEdit: string;
    noGoals: string;
    noTasks: string;
    loading: string;
  };

  // Goal Integration
  goalIntegration: {
    title: 'Goal Quests',
    statistics: 'Quest Progress',
    questsList: 'Associated Quests',
    noQuests: 'No quests yet',
    createQuest: 'Create Quest',
    viewAll: 'View All',
    moreQuests: 'And {count} more quests...',
    viewAllQuests: 'View All Quests',
    createFirstQuest: 'Create Your First Quest',
    error: 'Failed to load goal quests',
    emptyState: {
      title: 'No quests for this goal',
      description: 'Create quests to break down this goal into actionable steps.',
    },
  };

  // Dashboard
  dashboard: {
    title: string;
    description: string;
    viewDashboard: string;
    statistics: {
      title: string;
      comingSoon: string;
    };
    quickActions: {
      title: string;
      createQuest: string;
      viewAllQuests: string;
      joinChallenges: string;
      viewActivity: string;
    };
    tabs: {
      title: string;
      myQuests: string;
      followingQuests: string;
      comingSoon: string;
    };
  };

  // Sections
  sections: {
    quantitativeInfo: string;
    linkedItems: string;
    details: string;
  };
  
  // Confirmations
  confirmations: {
    deleteQuest: string;
    cancelQuest: string;
    failQuest: string;
    startQuest: string;
    deleteConfirm: string;
    cancelConfirm: string;
    failConfirm: string;
    startConfirm: string;
  };
  
  // Categories
  categories: {
    Health: string;
    Work: string;
    Personal: string;
    Learning: string;
    Fitness: string;
    Creative: string;
    Financial: string;
    Social: string;
    Spiritual: string;
    Hobby: string;
    Travel: string;
    Other: string;
  };
  
  // Privacy levels
  privacy: {
    public: string;
    followers: string;
    private: string;
  };
  
  // Quest types
  kinds: {
    linked: string;
    quantitative: string;
  };
  
  // Count scopes
  countScope: {
    any: string;
    linked: string;
  };
  
  // Deadlines
  deadline: {
    none: string;
    invalid: string;
    past: string;
    tooSoon: string;
  };
  
  // Progress
  progress: {
    calculating: string;
    completed: string;
    inProgress: string;
    notStarted: string;
    status: string;
  };
  
  // Steps
  steps: {
    basicInfo: string;
    advancedOptions: string;
    review: string;
    step: string;
    of: string;
  };
  
  // Loading
  loading: {
    loadingQuest: string;
  };
}

/**
 * Quest translations for English (en)
 */
export const questTranslations: Record<'en' | 'es' | 'fr', QuestTranslations> = {
  en: {
    status: {
      draft: 'Draft',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed'
    },
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard'
    },
    countScope: {
      completed_tasks: 'Completed Tasks',
      completed_goals: 'Completed Goals',
    },
    fields: {
      title: 'Title',
      description: 'Description',
      category: 'Category',
      difficulty: 'Difficulty',
      rewardXp: 'Reward XP',
      tags: 'Tags',
      deadline: 'Deadline',
      privacy: 'Privacy',
      kind: 'Quest Type',
      linkedGoals: 'Linked Goals',
      linkedTasks: 'Linked Tasks',
      linkedItems: 'Linked Goals & Tasks',
      linkedItemsDescription: 'Select the goals and tasks that this quest will track.',
      goals: 'Goals',
      tasks: 'Tasks',
      dependsOnQuests: 'Depends On Quests',
      targetCount: 'Target Count',
      countScope: 'Count Scope',
      period: 'Quest Period',
      days: 'days',
      rewardXp: 'Reward XP',
      createdAt: 'Created',
      updatedAt: 'Updated',
      startedAt: 'Started'
    },

    // Tooltips
    tooltips: {
      title: 'Enter a clear, descriptive title for your quest. This will help you identify it later.',
      description: 'Provide a detailed description of your quest. This helps you and others understand what needs to be accomplished.',
      category: 'Choose the category that best fits your quest. This helps organize and filter your quests.',
      difficulty: 'Select the difficulty level. This affects the reward XP you\'ll earn when completing the quest.',
      privacy: 'Set the privacy level for your quest. Public quests are visible to everyone, followers-only to your followers, and private only to you.',
      kind: 'Choose the quest type. Linked quests are tied to specific goals and tasks, while quantitative quests track completion counts over time.',
      tags: 'Add tags to help categorize and find your quest. Use descriptive keywords separated by commas.',
      targetCount: 'How many completed tasks or goals do you want to achieve? Enter a number greater than 0.',
      countScope: 'Choose what to count for this quest: completed tasks or completed goals within the specified period.',
      period: 'How often should this quest be checked for progress? Choose the time interval for counting completed tasks or goals.',
      deadline: 'Set an optional deadline for your quest. This helps create urgency and track progress over time.',
      progressQuantitative: 'Progress for quantitative quests is calculated based on completed tasks or goals within the specified period.',
      progressLinked: 'Progress for linked quests is calculated based on completion of linked goals and tasks.',
      editButton: 'Edit this quest to modify its details, settings, or requirements.',
      startButton: 'Start this quest to begin tracking your progress and earning rewards.',
      startDisabled: 'This quest cannot be started in its current state.',
      startDisabledQuantitative: 'Cannot start quantitative quest without count scope. Please edit the quest first.',
      deleteButton: 'Permanently delete this quest. This action cannot be undone.',
      viewButton: 'View detailed information about this active quest and its progress.',
      cancelButton: 'Cancel this quest. You won\'t receive rewards and progress will be lost.',
      failButton: 'Mark this quest as failed. This will end the quest without rewards.',
      viewCompletedButton: 'View details and results of this completed quest.',
      linkedGoals: 'Select active goals to link to this quest. Quest progress will be based on completion of these goals.',
      linkedTasks: 'Select specific tasks to link to this quest. Quest progress will be based on completion of these tasks.',
      filters: 'Use these filters to find specific quests. You can search by title, filter by status, difficulty, or category.',
      statusFilter: 'Filter quests by their current status: Draft, Active, Completed, Cancelled, or Failed.',
      difficultyFilter: 'Filter quests by difficulty level: Easy (50 XP), Medium (100 XP), or Hard (200 XP).',
      categoryFilter: 'Filter quests by category: Health, Work, Personal, Learning, Fitness, Creative, Financial, Social, Spiritual, Hobby, Travel, or Other.',
      clearFilters: 'Clear all active filters and show all quests.',
      createQuest: 'Create a new quest to track your progress and earn rewards.',
      retry: 'Retry loading quests. This will attempt to fetch your quests again.'
    },
    validation: {
      titleRequired: 'Title is required',
      titleMinLength: 'Title must be at least 3 characters',
      titleMaxLength: 'Title must be no more than 100 characters',
      titleEmpty: 'Title cannot be empty',
      descriptionMaxLength: 'Description must be no more than 500 characters',
      categoryRequired: 'Category is required',
      difficultyRequired: 'Difficulty is required',
      privacyRequired: 'Privacy is required',
      kindRequired: 'Quest type is required',
      targetCountRequired: 'Target count is required for quantitative quests',
      countScopeRequired: 'Count scope is required for quantitative quests',
      periodRequired: 'Period is required for quantitative quests',
      deadlineRequired: 'Deadline is required',
      deadlineFuture: 'Deadline must be in the future',
      invalidConfiguration: 'Invalid Configuration',
      categoryInvalid: 'Invalid category',
      rewardXpMin: 'Reward XP must be at least 0',
      rewardXpMax: 'Reward XP must be no more than 1000',
      rewardXpInteger: 'Reward XP must be a whole number',
      tagsMaxCount: 'Maximum 10 tags allowed',
      tagMaxLength: 'Each tag must be no more than 20 characters',
      deadlineInvalid: 'Invalid deadline',
      targetCountPositive: 'Target count must be greater than 0',
      periodPositive: 'Period must be greater than 0 days',
      quantitativeFieldsRequired: 'Quantitative quests require targetCount, countScope, and periodDays',
      linkedItemsRequired: 'Linked quests must have at least one goal or task when started',
      linkedGoalsRequired: 'At least one goal is required for linked quests',
      linkedTasksRequired: 'At least one task is required for linked quests',
      reasonMaxLength: 'Reason must be no more than 200 characters'
    },
    actions: {
      create: 'Create',
      edit: 'Edit',
      start: 'Start',
      cancel: 'Cancel',
      fail: 'Mark as Failed',
      delete: 'Delete',
      save: 'Save',
      saving: 'Saving...',
      canceling: 'Canceling...',
      deleting: 'Deleting...',
      starting: 'Starting...',
      failing: 'Marking as Failed...',
      retry: 'Retry',
      refresh: 'Refresh',
      updateQuest: 'Update Quest',
      updating: 'Updating...',
      next: 'Next',
      previous: 'Previous',
      createQuest: 'Create Quest',
      creating: 'Creating...',
      back: 'Back',
      finish: 'Finish',
      finishing: 'Finishing...'
    },
    messages: {
      createSuccess: 'Quest created successfully',
      editSuccess: 'Quest updated successfully',
      startSuccess: 'Quest started successfully',
      cancelSuccess: 'Quest cancelled successfully',
      failSuccess: 'Quest marked as failed',
      deleteSuccess: 'Quest deleted successfully',
      createError: 'Failed to create quest',
      editError: 'Failed to update quest',
      startError: 'Failed to start quest',
      cancelError: 'Failed to cancel quest',
      failError: 'Failed to mark quest as failed',
      deleteError: 'Failed to delete quest',
      loadError: 'Failed to load quests',
      networkError: 'Network error. Please check your connection.',
      validationError: 'Please fix the validation errors',
      permissionError: 'You do not have permission to perform this action',
      notFoundError: 'Quest not found',
      conflictError: 'Quest was modified by another operation. Please refresh and try again',
      serverError: 'Server error. Please try again later',
      unexpectedError: 'An unexpected error occurred',
      notStarted: 'Not Started',
      loadFailed: 'Failed to load quest. Please try again.',
      cannotEdit: 'Cannot edit quest. This quest is currently {status}. Only draft quests can be edited.',
      noGoals: 'No goals available. Create some goals first.',
      noTasks: 'No tasks available for selected goals.',
      loading: 'Loading quest...'
    },

    sections: {
      quantitativeInfo: 'Quantitative Quest Details',
      linkedItems: 'Linked Items',
      details: 'Quest Details'
    },
    confirmations: {
      deleteQuest: 'Delete Quest',
      cancelQuest: 'Cancel Quest',
      failQuest: 'Mark as Failed',
      startQuest: 'Start Quest',
      deleteConfirm: 'Are you sure you want to delete this quest? This action cannot be undone.',
      cancelConfirm: 'Are you sure you want to cancel this quest?',
      failConfirm: 'Are you sure you want to mark this quest as failed?',
      startConfirm: 'Are you sure you want to start this quest?'
    },
    categories: {
      Health: 'Health',
      Work: 'Work',
      Personal: 'Personal',
      Learning: 'Learning',
      Fitness: 'Fitness',
      Creative: 'Creative',
      Financial: 'Financial',
      Social: 'Social',
      Spiritual: 'Spiritual',
      Hobby: 'Hobby',
      Travel: 'Travel',
      Other: 'Other'
    },
    privacy: {
      public: 'Public',
      followers: 'Followers Only',
      private: 'Private'
    },
    kinds: {
      linked: 'Linked Quest',
      quantitative: 'Quantitative Quest'
    },
    countScope: {
      any: 'Any',
      linked: 'Linked Items Only'
    },
    deadline: {
      none: 'No deadline',
      invalid: 'Invalid deadline',
      past: 'Deadline has passed',
      tooSoon: 'Deadline must be at least 1 hour in the future'
    },
    progress: {
      calculating: 'Calculating progress...',
      completed: 'Completed',
      inProgress: 'Progress',
      notStarted: 'Not Started',
      status: 'Status:'
    },
    steps: {
      basicInfo: 'Basic Info',
      advancedOptions: 'Advanced',
      review: 'Review',
      step: 'Step',
      of: 'of'
    },
    loading: {
      loadingQuest: 'Loading quest...'
    },
    dashboard: {
      title: 'Quest Dashboard',
      description: 'Track your quest progress and statistics',
      viewDashboard: 'View Dashboard',
      statistics: {
        title: 'Quest Statistics',
        comingSoon: 'Statistics coming soon...'
      },
      quickActions: {
        title: 'Quick Actions',
        createQuest: 'Create Quest',
        viewAllQuests: 'View All',
        joinChallenges: 'Challenges',
        viewActivity: 'Activity'
      },
      tabs: {
        title: 'Quest Overview',
        myQuests: 'My Quests',
        followingQuests: 'Following',
        comingSoon: 'Quest tabs coming soon...'
      }
    }
  },
  es: {
    status: {
      draft: 'Borrador',
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado',
      failed: 'Fallido'
    },
    difficulty: {
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil'
    },
    countScope: {
      completed_tasks: 'Tareas Completadas',
      completed_goals: 'Objetivos Completados',
    },
    fields: {
      title: 'Título',
      description: 'Descripción',
      category: 'Categoría',
      difficulty: 'Dificultad',
      rewardXp: 'XP de Recompensa',
      tags: 'Etiquetas',
      deadline: 'Fecha Límite',
      privacy: 'Privacidad',
      kind: 'Tipo de Misión',
      linkedGoals: 'Objetivos Vinculados',
      linkedTasks: 'Tareas Vinculadas',
      dependsOnQuests: 'Depende de Misiones',
      targetCount: 'Cantidad Objetivo',
      countScope: 'Alcance del Conteo',
      period: 'Período de la Misión',
      days: 'días',
      rewardXp: 'XP de Recompensa',
      createdAt: 'Creado',
      updatedAt: 'Actualizado',
      startedAt: 'Iniciado'
    },

    // Tooltips
    tooltips: {
      title: 'Ingresa un título claro y descriptivo para tu misión. Esto te ayudará a identificarla más tarde.',
      description: 'Proporciona una descripción detallada de tu misión. Esto te ayuda a ti y a otros a entender qué se necesita lograr.',
      category: 'Elige la categoría que mejor se ajuste a tu misión. Esto ayuda a organizar y filtrar tus misiones.',
      difficulty: 'Selecciona el nivel de dificultad. Esto afecta los XP de recompensa que ganarás al completar la misión.',
      privacy: 'Establece el nivel de privacidad para tu misión. Las misiones públicas son visibles para todos, solo seguidores para tus seguidores, y privadas solo para ti.',
      kind: 'Elige el tipo de misión. Las misiones vinculadas están ligadas a metas y tareas específicas, mientras que las misiones cuantitativas rastrean conteos de finalización a lo largo del tiempo.',
      tags: 'Agrega etiquetas para ayudar a categorizar y encontrar tu misión. Usa palabras clave descriptivas separadas por comas.',
      targetCount: '¿Cuántas tareas o metas completadas quieres lograr? Ingresa un número mayor que 0.',
      countScope: 'Elige qué contar para esta misión: tareas completadas o metas completadas dentro del período especificado.',
      period: '¿Con qué frecuencia debe verificarse el progreso de esta misión? Elige el intervalo de tiempo para contar tareas o metas completadas.',
      deadline: 'Establece una fecha límite opcional para tu misión. Esto ayuda a crear urgencia y rastrear el progreso a lo largo del tiempo.',
      progressQuantitative: 'El progreso para misiones cuantitativas se calcula basado en tareas o metas completadas dentro del período especificado.',
      progressLinked: 'El progreso para misiones vinculadas se calcula basado en la finalización de metas y tareas vinculadas.',
      editButton: 'Edita esta misión para modificar sus detalles, configuraciones o requisitos.',
      startButton: 'Inicia esta misión para comenzar a rastrear tu progreso y ganar recompensas.',
      startDisabled: 'Esta misión no se puede iniciar en su estado actual.',
      startDisabledQuantitative: 'No se puede iniciar una misión cuantitativa sin alcance de conteo. Por favor edita la misión primero.',
      deleteButton: 'Elimina permanentemente esta misión. Esta acción no se puede deshacer.',
      viewButton: 'Ve información detallada sobre esta misión activa y su progreso.',
      cancelButton: 'Cancela esta misión. No recibirás recompensas y se perderá el progreso.',
      failButton: 'Marca esta misión como fallida. Esto terminará la misión sin recompensas.',
      viewCompletedButton: 'Ve detalles y resultados de esta misión completada.',
      linkedGoals: 'Selecciona objetivos activos para vincular a esta misión. El progreso de la misión se basará en la finalización de estos objetivos.',
      linkedTasks: 'Selecciona tareas específicas para vincular a esta misión. El progreso de la misión se basará en la finalización de estas tareas.',
      filters: 'Usa estos filtros para encontrar misiones específicas. Puedes buscar por título, filtrar por estado, dificultad o categoría.',
      statusFilter: 'Filtra misiones por su estado actual: Borrador, Activo, Completado, Cancelado o Fallido.',
      difficultyFilter: 'Filtra misiones por nivel de dificultad: Fácil (50 XP), Medio (100 XP) o Difícil (200 XP).',
      categoryFilter: 'Filtra misiones por categoría: Salud, Trabajo, Personal, Aprendizaje, Fitness, Creativo, Financiero, Social, Espiritual, Hobby, Viaje u Otro.',
      clearFilters: 'Limpiar todos los filtros activos y mostrar todas las misiones.',
      createQuest: 'Crea una nueva misión para rastrear tu progreso y ganar recompensas.',
      retry: 'Reintentar cargar misiones. Esto intentará obtener tus misiones nuevamente.'
    },
    validation: {
      titleRequired: 'El título es requerido',
      titleMinLength: 'El título debe tener al menos 3 caracteres',
      titleMaxLength: 'El título no puede tener más de 100 caracteres',
      titleEmpty: 'El título no puede estar vacío',
      descriptionMaxLength: 'La descripción no puede tener más de 500 caracteres',
      categoryRequired: 'La categoría es requerida',
      difficultyRequired: 'La dificultad es requerida',
      privacyRequired: 'La privacidad es requerida',
      kindRequired: 'El tipo de misión es requerido',
      targetCountRequired: 'El conteo objetivo es requerido para misiones cuantitativas',
      countScopeRequired: 'El alcance del conteo es requerido para misiones cuantitativas',
      periodRequired: 'El período es requerido para misiones cuantitativas',
      deadlineRequired: 'La fecha límite es requerida',
      deadlineFuture: 'La fecha límite debe estar en el futuro',
      invalidConfiguration: 'Configuración Inválida',
      categoryInvalid: 'Categoría inválida',
      rewardXpMin: 'La XP de recompensa debe ser al menos 0',
      rewardXpMax: 'La XP de recompensa no puede ser más de 1000',
      rewardXpInteger: 'La XP de recompensa debe ser un número entero',
      tagsMaxCount: 'Máximo 10 etiquetas permitidas',
      tagMaxLength: 'Cada etiqueta debe tener máximo 20 caracteres',
      deadlineInvalid: 'Fecha límite inválida',
      targetCountPositive: 'La cantidad objetivo debe ser mayor que 0',
      periodPositive: 'El período debe ser mayor que 0 días',
      quantitativeFieldsRequired: 'Las misiones cuantitativas requieren cantidad objetivo, alcance del conteo y período',
      linkedItemsRequired: 'Las misiones vinculadas deben tener al menos un objetivo o tarea cuando se inicien',
      reasonMaxLength: 'La razón no puede tener más de 200 caracteres'
    },
    actions: {
      create: 'Crear',
      edit: 'Editar',
      start: 'Iniciar',
      cancel: 'Cancelar',
      fail: 'Marcar como Fallida',
      delete: 'Eliminar',
      save: 'Guardar',
      saving: 'Guardando...',
      canceling: 'Cancelando...',
      deleting: 'Eliminando...',
      starting: 'Iniciando...',
      failing: 'Marcando como Fallida...',
      retry: 'Reintentar',
      refresh: 'Actualizar',
      updateQuest: 'Actualizar Misión',
      updating: 'Actualizando...',
      next: 'Siguiente',
      previous: 'Anterior',
      createQuest: 'Crear Misión',
      creating: 'Creando...',
      back: 'Atrás',
      finish: 'Finalizar',
      finishing: 'Finalizando...'
    },
    filters: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar misiones...',
      searchAriaLabel: 'Buscar misiones',
      status: 'Estado',
      statusPlaceholder: 'Todos los estados',
      difficulty: 'Dificultad',
      difficultyPlaceholder: 'Todas las dificultades',
      category: 'Categoría',
      categoryPlaceholder: 'Todas las categorías',
      clear: 'Limpiar',
      clearAll: 'Limpiar Todo',
      clearFilters: 'Limpiar todos los filtros',
      active: 'activos',
      activeFilters: 'filtros activos',
      showing: 'Mostrando',
    },
    messages: {
      createSuccess: 'Misión creada exitosamente',
      editSuccess: 'Misión actualizada exitosamente',
      startSuccess: 'Misión iniciada exitosamente',
      cancelSuccess: 'Misión cancelada exitosamente',
      failSuccess: 'Misión marcada como fallida',
      deleteSuccess: 'Misión eliminada exitosamente',
      createError: 'Error al crear la misión',
      editError: 'Error al actualizar la misión',
      startError: 'Error al iniciar la misión',
      cancelError: 'Error al cancelar la misión',
      failError: 'Error al marcar la misión como fallida',
      deleteError: 'Error al eliminar la misión',
      loadError: 'Error al cargar las misiones',
      networkError: 'Error de red. Por favor verifica tu conexión.',
      validationError: 'Por favor corrige los errores de validación',
      permissionError: 'No tienes permisos para realizar esta acción',
      notFoundError: 'Misión no encontrada',
      conflictError: 'La misión fue modificada por otra operación. Por favor actualiza e intenta de nuevo',
      serverError: 'Error del servidor. Por favor intenta más tarde',
      unexpectedError: 'Ocurrió un error inesperado',
      notStarted: 'No Iniciado',
      loadFailed: 'Error al cargar la misión. Por favor intenta de nuevo.',
      cannotEdit: 'No se puede editar la misión. Esta misión está actualmente {status}. Solo las misiones en borrador pueden ser editadas.',
      loading: 'Cargando misión...'
    },

    sections: {
      quantitativeInfo: 'Detalles de Misión Cuantitativa',
      linkedItems: 'Elementos Vinculados',
      details: 'Detalles de la Misión'
    },
    confirmations: {
      deleteQuest: 'Eliminar Misión',
      cancelQuest: 'Cancelar Misión',
      failQuest: 'Marcar como Fallida',
      startQuest: 'Iniciar Misión',
      deleteConfirm: '¿Estás seguro de que quieres eliminar esta misión? Esta acción no se puede deshacer.',
      cancelConfirm: '¿Estás seguro de que quieres cancelar esta misión?',
      failConfirm: '¿Estás seguro de que quieres marcar esta misión como fallida?',
      startConfirm: '¿Estás seguro de que quieres iniciar esta misión?'
    },
    categories: {
      Health: 'Salud',
      Work: 'Trabajo',
      Personal: 'Personal',
      Learning: 'Aprendizaje',
      Fitness: 'Fitness',
      Creative: 'Creativo',
      Financial: 'Financiero',
      Social: 'Social',
      Spiritual: 'Espiritual',
      Hobby: 'Pasatiempo',
      Travel: 'Viaje',
      Other: 'Otro'
    },
    privacy: {
      public: 'Público',
      followers: 'Solo Seguidores',
      private: 'Privado'
    },
    kinds: {
      linked: 'Misión Vinculada',
      quantitative: 'Misión Cuantitativa'
    },
    countScope: {
      any: 'Cualquiera',
      linked: 'Solo Elementos Vinculados'
    },
    deadline: {
      none: 'Sin fecha límite',
      invalid: 'Fecha límite inválida',
      past: 'La fecha límite ha pasado',
      tooSoon: 'La fecha límite debe ser al menos 1 hora en el futuro'
    },
    progress: {
      calculating: 'Calculando progreso...',
      completed: 'Completado',
      inProgress: 'Progreso',
      notStarted: 'No Iniciado',
      status: 'Estado:'
    },
    steps: {
      basicInfo: 'Información Básica',
      advancedOptions: 'Avanzado',
      review: 'Revisar',
      step: 'Paso',
      of: 'de'
    },
    loading: {
      loadingQuest: 'Cargando misión...'
    },
    goalIntegration: {
      title: 'Misiones de Meta',
      statistics: 'Progreso de Misiones',
      questsList: 'Misiones Asociadas',
      noQuests: 'Sin misiones aún',
      createQuest: 'Crear Misión',
      viewAll: 'Ver Todas',
      moreQuests: 'Y {count} misiones más...',
      viewAllQuests: 'Ver Todas las Misiones',
      createFirstQuest: 'Crear Tu Primera Misión',
      error: 'Error al cargar misiones de meta',
      emptyState: {
        title: 'Sin misiones para esta meta',
        description: 'Crea misiones para dividir esta meta en pasos accionables.',
      },
    },
    dashboard: {
      title: 'Panel de Misiones',
      description: 'Rastrea el progreso y estadísticas de tus misiones',
      viewDashboard: 'Ver Panel',
      statistics: {
        title: 'Estadísticas de Misiones',
        comingSoon: 'Estadísticas próximamente...'
      },
      quickActions: {
        title: 'Acciones Rápidas',
        createQuest: 'Crear Misión',
        viewAllQuests: 'Ver Todas',
        joinChallenges: 'Desafíos',
        viewActivity: 'Actividad'
      },
      tabs: {
        title: 'Resumen de Misiones',
        myQuests: 'Mis Misiones',
        followingQuests: 'Siguiendo',
        comingSoon: 'Pestañas de misiones próximamente...'
      }
    }
  },
  fr: {
    status: {
      draft: 'Brouillon',
      active: 'Actif',
      completed: 'Terminé',
      cancelled: 'Annulé',
      failed: 'Échoué'
    },
    difficulty: {
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile'
    },
    countScope: {
      completed_tasks: 'Tâches Terminées',
      completed_goals: 'Objectifs Terminés',
    },
    fields: {
      title: 'Titre',
      description: 'Description',
      category: 'Catégorie',
      difficulty: 'Difficulté',
      rewardXp: 'XP de Récompense',
      tags: 'Étiquettes',
      deadline: 'Date Limite',
      privacy: 'Confidentialité',
      kind: 'Type de Quête',
      linkedGoals: 'Objectifs Liés',
      linkedTasks: 'Tâches Liées',
      dependsOnQuests: 'Dépend des Quêtes',
      targetCount: 'Nombre Cible',
      countScope: 'Portée du Comptage',
      period: 'Période de la Quête',
      days: 'jours',
      rewardXp: 'XP de Récompense',
      createdAt: 'Créé',
      updatedAt: 'Mis à jour',
      startedAt: 'Démarré'
    },

    // Tooltips
    tooltips: {
      title: 'Entrez un titre clair et descriptif pour votre quête. Cela vous aidera à l\'identifier plus tard.',
      description: 'Fournissez une description détaillée de votre quête. Cela vous aide, vous et les autres, à comprendre ce qui doit être accompli.',
      category: 'Choisissez la catégorie qui correspond le mieux à votre quête. Cela aide à organiser et filtrer vos quêtes.',
      difficulty: 'Sélectionnez le niveau de difficulté. Cela affecte les XP de récompense que vous gagnerez en complétant la quête.',
      privacy: 'Définissez le niveau de confidentialité pour votre quête. Les quêtes publiques sont visibles par tous, les abonnés seulement par vos abonnés, et privées seulement par vous.',
      kind: 'Choisissez le type de quête. Les quêtes liées sont liées à des objectifs et tâches spécifiques, tandis que les quêtes quantitatives suivent les comptes de finalisation au fil du temps.',
      tags: 'Ajoutez des étiquettes pour aider à catégoriser et trouver votre quête. Utilisez des mots-clés descriptifs séparés par des virgules.',
      targetCount: 'Combien de tâches ou d\'objectifs complétés voulez-vous atteindre ? Entrez un nombre supérieur à 0.',
      countScope: 'Choisissez ce qu\'il faut compter pour cette quête : tâches complétées ou objectifs complétés dans la période spécifiée.',
      period: 'À quelle fréquence cette quête doit-elle être vérifiée pour le progrès ? Choisissez l\'intervalle de temps pour compter les tâches ou objectifs complétés.',
      deadline: 'Définissez une date limite optionnelle pour votre quête. Cela aide à créer de l\'urgence et à suivre les progrès au fil du temps.',
      progressQuantitative: 'Le progrès pour les quêtes quantitatives est calculé basé sur les tâches ou objectifs complétés dans la période spécifiée.',
      progressLinked: 'Le progrès pour les quêtes liées est calculé basé sur l\'achèvement des objectifs et tâches liés.',
      editButton: 'Modifiez cette quête pour changer ses détails, paramètres ou exigences.',
      startButton: 'Démarrez cette quête pour commencer à suivre votre progrès et gagner des récompenses.',
      startDisabled: 'Cette quête ne peut pas être démarrée dans son état actuel.',
      startDisabledQuantitative: 'Impossible de démarrer une quête quantitative sans portée de comptage. Veuillez d\'abord modifier la quête.',
      deleteButton: 'Supprimez définitivement cette quête. Cette action ne peut pas être annulée.',
      viewButton: 'Voir les informations détaillées sur cette quête active et son progrès.',
      cancelButton: 'Annulez cette quête. Vous ne recevrez pas de récompenses et le progrès sera perdu.',
      failButton: 'Marquez cette quête comme échouée. Cela terminera la quête sans récompenses.',
      viewCompletedButton: 'Voir les détails et résultats de cette quête complétée.',
      linkedGoals: 'Sélectionnez des objectifs actifs à lier à cette quête. Le progrès de la quête sera basé sur l\'achèvement de ces objectifs.',
      linkedTasks: 'Sélectionnez des tâches spécifiques à lier à cette quête. Le progrès de la quête sera basé sur l\'achèvement de ces tâches.',
      filters: 'Utilisez ces filtres pour trouver des quêtes spécifiques. Vous pouvez rechercher par titre, filtrer par statut, difficulté ou catégorie.',
      statusFilter: 'Filtrez les quêtes par leur statut actuel : Brouillon, Actif, Complété, Annulé ou Échoué.',
      difficultyFilter: 'Filtrez les quêtes par niveau de difficulté : Facile (50 XP), Moyen (100 XP) ou Difficile (200 XP).',
      categoryFilter: 'Filtrez les quêtes par catégorie : Santé, Travail, Personnel, Apprentissage, Fitness, Créatif, Financier, Social, Spirituel, Loisir, Voyage ou Autre.',
      clearFilters: 'Effacer tous les filtres actifs et afficher toutes les quêtes.',
      createQuest: 'Créer une nouvelle quête pour suivre votre progrès et gagner des récompenses.',
      retry: 'Réessayer de charger les quêtes. Cela tentera de récupérer vos quêtes à nouveau.'
    },
    validation: {
      titleRequired: 'Le titre est requis',
      titleMinLength: 'Le titre doit avoir au moins 3 caractères',
      titleMaxLength: 'Le titre ne peut pas dépasser 100 caractères',
      titleEmpty: 'Le titre ne peut pas être vide',
      descriptionMaxLength: 'La description ne peut pas dépasser 500 caractères',
      categoryRequired: 'La catégorie est requise',
      difficultyRequired: 'La difficulté est requise',
      privacyRequired: 'La confidentialité est requise',
      kindRequired: 'Le type de quête est requis',
      targetCountRequired: 'Le nombre cible est requis pour les quêtes quantitatives',
      countScopeRequired: 'La portée du comptage est requise pour les quêtes quantitatives',
      periodRequired: 'La période est requise pour les quêtes quantitatives',
      deadlineRequired: 'La date limite est requise',
      deadlineFuture: 'La date limite doit être dans le futur',
      invalidConfiguration: 'Configuration Invalide',
      categoryInvalid: 'Catégorie invalide',
      rewardXpMin: 'L\'XP de récompense doit être au moins 0',
      rewardXpMax: 'L\'XP de récompense ne peut pas dépasser 1000',
      rewardXpInteger: 'L\'XP de récompense doit être un nombre entier',
      tagsMaxCount: 'Maximum 10 étiquettes autorisées',
      tagMaxLength: 'Chaque étiquette doit avoir maximum 20 caractères',
      deadlineInvalid: 'Date limite invalide',
      targetCountPositive: 'Le nombre cible doit être supérieur à 0',
      periodPositive: 'La période doit être supérieure à 0 jours',
      quantitativeFieldsRequired: 'Les quêtes quantitatives nécessitent un nombre cible, une portée de comptage et une période',
      linkedItemsRequired: 'Les quêtes liées doivent avoir au moins un objectif ou une tâche lors du démarrage',
      reasonMaxLength: 'La raison ne peut pas dépasser 200 caractères'
    },
    actions: {
      create: 'Créer',
      edit: 'Modifier',
      start: 'Démarrer',
      cancel: 'Annuler',
      fail: 'Marquer comme Échoué',
      delete: 'Supprimer',
      save: 'Sauvegarder',
      saving: 'Sauvegarde...',
      canceling: 'Annulation...',
      deleting: 'Suppression...',
      starting: 'Démarrage...',
      failing: 'Marquage comme Échoué...',
      retry: 'Réessayer',
      refresh: 'Actualiser',
      updateQuest: 'Mettre à jour la Quête',
      updating: 'Mise à jour...',
      next: 'Suivant',
      previous: 'Précédent',
      createQuest: 'Créer une Quête',
      creating: 'Création...',
      back: 'Retour',
      finish: 'Terminer',
      finishing: 'Finalisation...'
    },
    messages: {
      createSuccess: 'Quête créée avec succès',
      editSuccess: 'Quête mise à jour avec succès',
      startSuccess: 'Quête démarrée avec succès',
      cancelSuccess: 'Quête annulée avec succès',
      failSuccess: 'Quête marquée comme échouée',
      deleteSuccess: 'Quête supprimée avec succès',
      createError: 'Échec de la création de la quête',
      editError: 'Échec de la mise à jour de la quête',
      startError: 'Échec du démarrage de la quête',
      cancelError: 'Échec de l\'annulation de la quête',
      failError: 'Échec du marquage de la quête comme échouée',
      deleteError: 'Échec de la suppression de la quête',
      loadError: 'Échec du chargement des quêtes',
      networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
      validationError: 'Veuillez corriger les erreurs de validation',
      permissionError: 'Vous n\'avez pas la permission d\'effectuer cette action',
      notFoundError: 'Quête non trouvée',
      conflictError: 'La quête a été modifiée par une autre opération. Veuillez actualiser et réessayer',
      serverError: 'Erreur serveur. Veuillez réessayer plus tard',
      unexpectedError: 'Une erreur inattendue s\'est produite',
      notStarted: 'Non Démarré',
      loadFailed: 'Échec du chargement de la quête. Veuillez réessayer.',
      cannotEdit: 'Impossible de modifier la quête. Cette quête est actuellement {status}. Seules les quêtes en brouillon peuvent être modifiées.',
      loading: 'Chargement de la quête...'
    },

    sections: {
      quantitativeInfo: 'Détails de Quête Quantitative',
      linkedItems: 'Éléments Liés',
      details: 'Détails de la Quête'
    },
    confirmations: {
      deleteQuest: 'Supprimer Quête',
      cancelQuest: 'Annuler Quête',
      failQuest: 'Marquer comme Échoué',
      startQuest: 'Démarrer Quête',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette quête ? Cette action ne peut pas être annulée.',
      cancelConfirm: 'Êtes-vous sûr de vouloir annuler cette quête ?',
      failConfirm: 'Êtes-vous sûr de vouloir marquer cette quête comme échouée ?',
      startConfirm: 'Êtes-vous sûr de vouloir démarrer cette quête ?'
    },
    categories: {
      Health: 'Santé',
      Work: 'Travail',
      Personal: 'Personnel',
      Learning: 'Apprentissage',
      Fitness: 'Fitness',
      Creative: 'Créatif',
      Financial: 'Financier',
      Social: 'Social',
      Spiritual: 'Spirituel',
      Hobby: 'Loisir',
      Travel: 'Voyage',
      Other: 'Autre'
    },
    privacy: {
      public: 'Public',
      followers: 'Abonnés Seulement',
      private: 'Privé'
    },
    kinds: {
      linked: 'Quête Liée',
      quantitative: 'Quête Quantitative'
    },
    countScope: {
      any: 'N\'importe',
      linked: 'Éléments Liés Seulement'
    },
    deadline: {
      none: 'Aucune date limite',
      invalid: 'Date limite invalide',
      past: 'La date limite est passée',
      tooSoon: 'La date limite doit être au moins 1 heure dans le futur'
    },
    progress: {
      calculating: 'Calcul du progrès...',
      completed: 'Terminé',
      inProgress: 'Progrès',
      notStarted: 'Non Démarré',
      status: 'Statut:'
    },
    steps: {
      basicInfo: 'Informations de Base',
      advancedOptions: 'Avancé',
      review: 'Révision',
      step: 'Étape',
      of: 'de'
    },
    loading: {
      loadingQuest: 'Chargement de la quête...'
    },
    goalIntegration: {
      title: 'Quêtes d\'Objectif',
      statistics: 'Progrès des Quêtes',
      questsList: 'Quêtes Associées',
      noQuests: 'Pas encore de quêtes',
      createQuest: 'Créer une Quête',
      viewAll: 'Voir Tout',
      moreQuests: 'Et {count} quêtes de plus...',
      viewAllQuests: 'Voir Toutes les Quêtes',
      createFirstQuest: 'Créer Votre Première Quête',
      error: 'Échec du chargement des quêtes d\'objectif',
      emptyState: {
        title: 'Aucune quête pour cet objectif',
        description: 'Créez des quêtes pour diviser cet objectif en étapes actionnables.',
      },
    },
    filters: {
      title: 'Filtres',
      search: 'Rechercher',
      searchPlaceholder: 'Rechercher des quêtes...',
      searchAriaLabel: 'Rechercher des quêtes',
      status: 'Statut',
      statusPlaceholder: 'Tous les statuts',
      difficulty: 'Difficulté',
      difficultyPlaceholder: 'Toutes les difficultés',
      category: 'Catégorie',
      categoryPlaceholder: 'Toutes les catégories',
      clear: 'Effacer',
      clearAll: 'Tout Effacer',
      clearFilters: 'Effacer tous les filtres',
      active: 'actifs',
      activeFilters: 'filtres actifs',
      showing: 'Affichage',
    },
    dashboard: {
      title: 'Tableau de Bord des Quêtes',
      description: 'Suivez vos progrès et statistiques de quête',
      viewDashboard: 'Voir le Tableau',
      statistics: {
        title: 'Statistiques des Quêtes',
        comingSoon: 'Statistiques bientôt disponibles...'
      },
      quickActions: {
        title: 'Actions Rapides',
        createQuest: 'Créer une Quête',
        viewAllQuests: 'Voir Tout',
        joinChallenges: 'Défis',
        viewActivity: 'Activité'
      },
      tabs: {
        title: 'Aperçu des Quêtes',
        myQuests: 'Mes Quêtes',
        followingQuests: 'Abonnements',
        comingSoon: 'Onglets de quête bientôt disponibles...'
      }
    }
  }
};


