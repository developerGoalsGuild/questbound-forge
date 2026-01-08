import type { Language } from './translations';

export interface GoalDetailsTranslations {
  title: string;
  subtitle: string;
  backToGoals: string;
  editGoal: string;
  viewTasks: string;
  deleteGoal: string;
  sections: {
    basicInfo: string;
    description: string;
    timeline: string;
    progress: string;
    nlpAnswers: string;
    metadata: string;
  };
  fields: {
    title: string;
    description: string;
    status: string;
    deadline: string;
    category: string;
    tags: string;
    createdAt: string;
    updatedAt: string;
    progress: string;
    answers: string;
  };
  hints: {
    iconLabel: string;
    fields: {
      title: string;
      description: string;
      status: string;
      deadline: string;
      category: string;
      tags: string;
      createdAt: string;
      updatedAt: string;
      progress: string;
      answers: string;
    };
  };
  status: {
    active: string;
    paused: string;
    completed: string;
    archived: string;
  };
  timeline: {
    created: string;
    lastUpdated: string;
    deadline: string;
    daysRemaining: string;
    daysOverdue: string;
    noDeadline: string;
  };
  progress: {
    title: string;
    noProgress: string;
    completed: string;
    inProgress: string;
    notStarted: string;
  };
  nlpAnswers: {
    title: string;
    noAnswers: string;
    question: string;
    answer: string;
  };
    actions: {
      edit: string;
      delete: string;
      viewTasks: string;
      createTask: string;
      back: string;
    };
  messages: {
    loading: string;
    error: string;
    notFound: string;
    deleteConfirm: string;
    deleteSuccess: string;
    deleteError: string;
  };
}

export const goalDetailsTranslations: Record<Language, GoalDetailsTranslations> = {
  en: {
    title: 'Goal Details',
    subtitle: 'View detailed information about your goal',
    backToGoals: 'Back to Goals',
    editGoal: 'Edit Goal',
    viewTasks: 'View Tasks',
    deleteGoal: 'Delete Goal',
    sections: {
      basicInfo: 'Basic Information',
      description: 'Description',
      timeline: 'Timeline',
      progress: 'Progress',
      nlpAnswers: 'NLP Answers',
      metadata: 'Metadata',
    },
    fields: {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      deadline: 'Deadline',
      category: 'Category',
      tags: 'Tags',
      createdAt: 'Created',
      updatedAt: 'Last Updated',
      progress: 'Progress',
      answers: 'Answers',
    },
    hints: {
      iconLabel: 'More information about {field}',
      fields: {
        title: 'The main name or title of your goal.',
        description: 'Detailed explanation of what this goal aims to achieve.',
        status: 'Current progress state of the goal (active, paused, completed, or archived).',
        deadline: 'Target completion date for this goal.',
        category: 'Optional categorization to group related goals.',
        tags: 'Labels to help organize and find related goals.',
        createdAt: 'When this goal was originally created.',
        updatedAt: 'When this goal was last modified.',
        progress: 'Current completion percentage or progress status.',
        answers: 'Your responses to the NLP (Neuro-Linguistic Programming) questions.',
      },
    },
    status: {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      archived: 'Archived',
    },
    timeline: {
      created: 'Created',
      lastUpdated: 'Last Updated',
      deadline: 'Deadline',
      daysRemaining: 'days remaining',
      daysOverdue: 'days overdue',
      noDeadline: 'No deadline set',
    },
    progress: {
      title: 'Progress',
      noProgress: 'No progress data available',
      completed: 'Completed',
      inProgress: 'In Progress',
      notStarted: 'Not Started',
    },
    nlpAnswers: {
      title: 'NLP Answers',
      noAnswers: 'No answers provided',
      question: 'Question',
      answer: 'Answer',
    },
    actions: {
      edit: 'Edit',
      delete: 'Delete',
      viewTasks: 'View Tasks',
      createTask: 'Create Task',
      back: 'Back',
    },
    messages: {
      loading: 'Loading goal details...',
      error: 'Failed to load goal details',
      notFound: 'Goal not found',
      deleteConfirm: 'Are you sure you want to delete this goal? This action cannot be undone.',
      deleteSuccess: 'Goal deleted successfully',
      deleteError: 'Failed to delete goal',
    },
  },
  es: {
    title: 'Detalles del Objetivo',
    subtitle: 'Ver información detallada sobre tu objetivo',
    backToGoals: 'Volver a Objetivos',
    editGoal: 'Editar Objetivo',
    viewTasks: 'Ver Tareas',
    deleteGoal: 'Eliminar Objetivo',
    sections: {
      basicInfo: 'Información Básica',
      description: 'Descripción',
      timeline: 'Cronología',
      progress: 'Progreso',
      nlpAnswers: 'Respuestas NLP',
      metadata: 'Metadatos',
    },
    fields: {
      title: 'Título',
      description: 'Descripción',
      status: 'Estado',
      deadline: 'Fecha Límite',
      category: 'Categoría',
      tags: 'Etiquetas',
      createdAt: 'Creado',
      updatedAt: 'Última Actualización',
      progress: 'Progreso',
      answers: 'Respuestas',
    },
    hints: {
      iconLabel: 'Más información sobre {field}',
      fields: {
        title: 'El nombre principal o título de tu objetivo.',
        description: 'Explicación detallada de lo que este objetivo pretende lograr.',
        status: 'Estado de progreso actual del objetivo (activo, pausado, completado o archivado).',
        deadline: 'Fecha objetivo de finalización para este objetivo.',
        category: 'Categorización opcional para agrupar objetivos relacionados.',
        tags: 'Etiquetas para ayudar a organizar y encontrar objetivos relacionados.',
        createdAt: 'Cuándo se creó originalmente este objetivo.',
        updatedAt: 'Cuándo se modificó por última vez este objetivo.',
        progress: 'Porcentaje de finalización actual o estado de progreso.',
        answers: 'Tus respuestas a las preguntas de PNL (Programación Neuro-Lingüística).',
      },
    },
    status: {
      active: 'Activo',
      paused: 'Pausado',
      completed: 'Completado',
      archived: 'Archivado',
    },
    timeline: {
      created: 'Creado',
      lastUpdated: 'Última Actualización',
      deadline: 'Fecha Límite',
      daysRemaining: 'días restantes',
      daysOverdue: 'días de retraso',
      noDeadline: 'Sin fecha límite',
    },
    progress: {
      title: 'Progreso',
      noProgress: 'No hay datos de progreso disponibles',
      completed: 'Completado',
      inProgress: 'En Progreso',
      notStarted: 'No Iniciado',
    },
    nlpAnswers: {
      title: 'Respuestas NLP',
      noAnswers: 'No se proporcionaron respuestas',
      question: 'Pregunta',
      answer: 'Respuesta',
    },
    actions: {
      edit: 'Editar',
      delete: 'Eliminar',
      viewTasks: 'Ver Tareas',
      createTask: 'Crear Tarea',
      back: 'Volver',
    },
    messages: {
      loading: 'Cargando detalles del objetivo...',
      error: 'Error al cargar los detalles del objetivo',
      notFound: 'Objetivo no encontrado',
      deleteConfirm: '¿Estás seguro de que quieres eliminar este objetivo? Esta acción no se puede deshacer.',
      deleteSuccess: 'Objetivo eliminado exitosamente',
      deleteError: 'Error al eliminar el objetivo',
    },
  },
  fr: {
    title: 'Détails de l\'Objectif',
    subtitle: 'Voir les informations détaillées sur votre objectif',
    backToGoals: 'Retour aux Objectifs',
    editGoal: 'Modifier l\'Objectif',
    viewTasks: 'Voir les Tâches',
    deleteGoal: 'Supprimer l\'Objectif',
    sections: {
      basicInfo: 'Informations de Base',
      description: 'Description',
      timeline: 'Chronologie',
      progress: 'Progrès',
      nlpAnswers: 'Réponses NLP',
      metadata: 'Métadonnées',
    },
    fields: {
      title: 'Titre',
      description: 'Description',
      status: 'Statut',
      deadline: 'Date Limite',
      category: 'Catégorie',
      tags: 'Étiquettes',
      createdAt: 'Créé',
      updatedAt: 'Dernière Mise à Jour',
      progress: 'Progrès',
      answers: 'Réponses',
    },
    hints: {
      iconLabel: 'Plus d\'informations sur {field}',
      fields: {
        title: 'Le nom principal ou le titre de votre objectif.',
        description: 'Explication détaillée de ce que cet objectif vise à accomplir.',
        status: 'État de progression actuel de l\'objectif (actif, en pause, terminé ou archivé).',
        deadline: 'Date cible de finalisation pour cet objectif.',
        category: 'Catégorisation optionnelle pour regrouper les objectifs liés.',
        tags: 'Étiquettes pour aider à organiser et trouver des objectifs liés.',
        createdAt: 'Quand cet objectif a été créé à l\'origine.',
        updatedAt: 'Quand cet objectif a été modifié pour la dernière fois.',
        progress: 'Pourcentage de finalisation actuel ou état de progression.',
        answers: 'Vos réponses aux questions de PNL (Programmation Neuro-Linguistique).',
      },
    },
    status: {
      active: 'Actif',
      paused: 'En Pause',
      completed: 'Terminé',
      archived: 'Archivé',
    },
    timeline: {
      created: 'Créé',
      lastUpdated: 'Dernière Mise à Jour',
      deadline: 'Date Limite',
      daysRemaining: 'jours restants',
      daysOverdue: 'jours de retard',
      noDeadline: 'Aucune date limite',
    },
    progress: {
      title: 'Progrès',
      noProgress: 'Aucune donnée de progrès disponible',
      completed: 'Terminé',
      inProgress: 'En Cours',
      notStarted: 'Non Commencé',
    },
    nlpAnswers: {
      title: 'Réponses NLP',
      noAnswers: 'Aucune réponse fournie',
      question: 'Question',
      answer: 'Réponse',
    },
    actions: {
      edit: 'Modifier',
      delete: 'Supprimer',
      viewTasks: 'Voir les Tâches',
      createTask: 'Créer une Tâche',
      back: 'Retour',
    },
    messages: {
      loading: 'Chargement des détails de l\'objectif...',
      error: 'Échec du chargement des détails de l\'objectif',
      notFound: 'Objectif non trouvé',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cet objectif ? Cette action ne peut pas être annulée.',
      deleteSuccess: 'Objectif supprimé avec succès',
      deleteError: 'Échec de la suppression de l\'objectif',
    },
  },
};
