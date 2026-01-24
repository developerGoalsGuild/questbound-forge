export type Language = 'en' | 'es' | 'fr';

export interface GoalEditTranslations {
  title: string;
  subtitle: string;
  form: {
    title: {
      label: string;
      placeholder: string;
    };
    description: {
      label: string;
      placeholder: string;
    };
    deadline: {
      label: string;
      placeholder: string;
    };
    category: {
      label: string;
      placeholder: string;
    };
  };
  tasks: {
    title: string;
    viewTasks: string;
    noTasks: string;
    createTask: string;
  };
  actions: {
    save: string;
    cancel: string;
    backToList: string;
    createNewGoal: string;
  };
  validation: {
    titleRequired: string;
    titleMinLength: string;
    titleMaxLength: string;
    deadlineRequired: string;
    deadlineInvalid: string;
    deadlinePast: string;
    descriptionMaxLength: string;
    categoryInvalid: string;
  };
  messages: {
    saveSuccess: string;
    saveError: string;
    loading: string;
    loadingGoalData: string;
    updating: string;
    goalNotFound: string;
    taskCreated: string;
    taskUpdated: string;
    taskDeleted: string;
  };
  nlp: {
    title: string;
    subtitle: string;
    questions: {
      positive: string;
      specific: string;
      evidence: string;
      resources: string;
      obstacles: string;
      ecology: string;
      timeline: string;
      firstStep: string;
    };
    hints: {
      positive: string;
      specific: string;
      evidence: string;
      resources: string;
      obstacles: string;
      ecology: string;
      timeline: string;
      firstStep: string;
    };
  };
}

export const goalEditTranslations: Record<Language, GoalEditTranslations> = {
  en: {
    title: 'Edit Goal',
    subtitle: 'Update your goal details and manage tasks',
    form: {
      title: {
        label: 'Goal Title',
        placeholder: 'Enter your goal title',
      },
      description: {
        label: 'Description',
        placeholder: 'Describe your goal in detail',
      },
      deadline: {
        label: 'Deadline',
        placeholder: 'YYYY-MM-DD',
      },
      category: {
        label: 'Category',
        placeholder: 'Select a category',
      },
    },
    tasks: {
      title: 'Tasks',
      viewTasks: 'View Tasks',
      noTasks: 'No tasks yet for this goal',
      createTask: 'Create Task',
    },
    actions: {
      save: 'Save Changes',
      cancel: 'Cancel',
      backToList: 'Back to Goals List',
      createNewGoal: 'Create New Goal',
    },
    validation: {
      titleRequired: 'Goal title is required',
      titleMinLength: 'Title must be at least 3 characters',
      titleMaxLength: 'Title must be no more than 100 characters',
      deadlineRequired: 'Deadline is required',
      deadlineInvalid: 'Please enter a valid date (YYYY-MM-DD)',
      deadlinePast: 'Deadline must be in the future',
      descriptionMaxLength: 'Description must be no more than 500 characters',
      categoryInvalid: 'Please select a valid category',
    },
    messages: {
      saveSuccess: 'Goal updated successfully',
      saveError: 'Failed to update goal',
      loading: 'Loading goal...',
      loadingGoalData: 'Loading goal data...',
      updating: 'Updating...',
      goalNotFound: 'Goal not found',
      taskCreated: 'Task created successfully',
      taskUpdated: 'Task updated successfully',
      taskDeleted: 'Task deleted successfully',
    },
    nlp: {
      title: 'Well-formed Outcome (NLP)',
      subtitle: 'Answer these questions to clarify and strengthen your goal',
      questions: {
        positive: 'State your goal positively',
        specific: 'Make it specific and context-bound',
        evidence: 'How will you know you achieved it? (evidence)',
        resources: 'What resources do you have/need?',
        obstacles: 'What obstacles might arise? How will you overcome them?',
        ecology: 'Who or what will this affect? What do you have to give up?',
        timeline: 'When, where, with whom will this happen?',
        firstStep: 'What is your immediate first step?',
      },
      hints: {
        positive: 'Focus on what you want to achieve, not what you want to avoid',
        specific: 'Include specific details like location, time, and people involved',
        evidence: 'Describe measurable outcomes or observable signs of success',
        resources: 'List skills, tools, people, or time you have or need',
        obstacles: 'Think about potential challenges and your response strategies',
        ecology: 'Think about how this goal will impact your life, relationships, and commitments. What will you need to sacrifice or change?',
        timeline: 'Be specific about when and where this will happen',
        firstStep: 'Identify the very next action you can take',
      },
    },
  },
  es: {
    title: 'Editar Objetivo',
    subtitle: 'Actualiza los detalles de tu objetivo y gestiona tareas',
    form: {
      title: {
        label: 'Título del Objetivo',
        placeholder: 'Ingresa el título de tu objetivo',
      },
      description: {
        label: 'Descripción',
        placeholder: 'Describe tu objetivo en detalle',
      },
      deadline: {
        label: 'Fecha Límite',
        placeholder: 'AAAA-MM-DD',
      },
      category: {
        label: 'Categoría',
        placeholder: 'Selecciona una categoría',
      },
    },
    tasks: {
      title: 'Tareas',
      viewTasks: 'Ver Tareas',
      noTasks: 'Aún no hay tareas para este objetivo',
      createTask: 'Crear Tarea',
    },
    actions: {
      save: 'Guardar Cambios',
      cancel: 'Cancelar',
      backToList: 'Volver a la Lista de Objetivos',
      createNewGoal: 'Crear Nuevo Objetivo',
    },
    validation: {
      titleRequired: 'El título del objetivo es obligatorio',
      titleMinLength: 'El título debe tener al menos 3 caracteres',
      titleMaxLength: 'El título no debe tener más de 100 caracteres',
      deadlineRequired: 'La fecha límite es obligatoria',
      deadlineInvalid: 'Por favor ingresa una fecha válida (AAAA-MM-DD)',
      deadlinePast: 'La fecha límite debe ser en el futuro',
      descriptionMaxLength: 'La descripción no debe tener más de 500 caracteres',
      categoryInvalid: 'Por favor selecciona una categoría válida',
    },
    messages: {
      saveSuccess: 'Objetivo actualizado exitosamente',
      saveError: 'Error al actualizar objetivo',
      loading: 'Cargando objetivo...',
      loadingGoalData: 'Cargando datos del objetivo...',
      updating: 'Actualizando...',
      goalNotFound: 'Objetivo no encontrado',
      taskCreated: 'Tarea creada exitosamente',
      taskUpdated: 'Tarea actualizada exitosamente',
      taskDeleted: 'Tarea eliminada exitosamente',
    },
    nlp: {
      title: 'Resultado Bien Formado (PNL)',
      subtitle: 'Responde estas preguntas para clarificar y fortalecer tu objetivo',
      questions: {
        positive: 'Expresa tu objetivo en positivo',
        specific: 'Hazlo específico y con contexto',
        evidence: '¿Cómo sabrás que lo lograste? (evidencia)',
        resources: '¿Qué recursos tienes/necesitas?',
        obstacles: '¿Qué obstáculos podrían aparecer? ¿Cómo los superarás?',
        ecology: '¿Quién o qué se verá afectado? ¿Qué tendrás que renunciar?',
        timeline: '¿Cuándo, dónde y con quién ocurrirá?',
        firstStep: '¿Cuál es tu primer paso inmediato?',
      },
      hints: {
        positive: 'Enfócate en lo que quieres lograr, no en lo que quieres evitar',
        specific: 'Incluye detalles específicos como ubicación, tiempo y personas involucradas',
        evidence: 'Describe resultados medibles o señales observables de éxito',
        resources: 'Enumera habilidades, herramientas, personas o tiempo que tienes o necesitas',
        obstacles: 'Piensa en desafíos potenciales y tus estrategias de respuesta',
        ecology: 'Piensa en cómo este objetivo afectará tu vida, relaciones y compromisos. ¿Qué tendrás que sacrificar o cambiar?',
        timeline: 'Sé específico sobre cuándo y dónde ocurrirá esto',
        firstStep: 'Identifica la próxima acción inmediata que puedes tomar',
      },
    },
  },
  fr: {
    title: 'Modifier l\'Objectif',
    subtitle: 'Mettez à jour les détails de votre objectif et gérez les tâches',
    form: {
      title: {
        label: 'Titre de l\'Objectif',
        placeholder: 'Entrez le titre de votre objectif',
      },
      description: {
        label: 'Description',
        placeholder: 'Décrivez votre objectif en détail',
      },
      deadline: {
        label: 'Échéance',
        placeholder: 'AAAA-MM-JJ',
      },
      category: {
        label: 'Catégorie',
        placeholder: 'Sélectionnez une catégorie',
      },
    },
    tasks: {
      title: 'Tâches',
      viewTasks: 'Voir les Tâches',
      noTasks: 'Aucune tâche pour cet objectif pour le moment',
      createTask: 'Créer une Tâche',
    },
    actions: {
      save: 'Enregistrer les Modifications',
      cancel: 'Annuler',
      backToList: 'Retour à la Liste des Objectifs',
      createNewGoal: 'Créer un Nouvel Objectif',
    },
    validation: {
      titleRequired: 'Le titre de l\'objectif est requis',
      titleMinLength: 'Le titre doit contenir au moins 3 caractères',
      titleMaxLength: 'Le titre ne doit pas dépasser 100 caractères',
      deadlineRequired: 'L\'échéance est requise',
      deadlineInvalid: 'Veuillez entrer une date valide (AAAA-MM-JJ)',
      deadlinePast: 'L\'échéance doit être dans le futur',
      descriptionMaxLength: 'La description ne doit pas dépasser 500 caractères',
      categoryInvalid: 'Veuillez sélectionner une catégorie valide',
    },
    messages: {
      saveSuccess: 'Objectif mis à jour avec succès',
      saveError: 'Échec de la mise à jour de l\'objectif',
      loading: 'Chargement de l\'objectif...',
      loadingGoalData: 'Chargement des données de l\'objectif...',
      updating: 'Mise à jour...',
      goalNotFound: 'Objectif non trouvé',
      taskCreated: 'Tâche créée avec succès',
      taskUpdated: 'Tâche mise à jour avec succès',
      taskDeleted: 'Tâche supprimée avec succès',
    },
    nlp: {
      title: 'Objectif Bien Formé (PNL)',
      subtitle: 'Répondez à ces questions pour clarifier et renforcer votre objectif',
      questions: {
        positive: 'Formulez votre objectif positivement',
        specific: 'Rendez-le précis et contextuel',
        evidence: 'Comment saurez-vous que c\'est atteint ? (preuves)',
        resources: 'Quelles ressources avez-vous/besoin ?',
        obstacles: 'Quels obstacles pourraient survenir ? Comment les surmonter ?',
        ecology: 'Qui ou quoi sera affecté ? Que devrez-vous abandonner ?',
        timeline: 'Quand, où, avec qui cela se fera-t-il ?',
        firstStep: 'Quelle est votre première étape immédiate ?',
      },
      hints: {
        positive: 'Concentrez-vous sur ce que vous voulez atteindre, pas sur ce que vous voulez éviter',
        specific: 'Incluez des détails spécifiques comme le lieu, le temps et les personnes impliquées',
        evidence: 'Décrivez des résultats mesurables ou des signes observables de succès',
        resources: 'Listez les compétences, outils, personnes ou temps que vous avez ou dont vous avez besoin',
        obstacles: 'Pensez aux défis potentiels et à vos stratégies de réponse',
        ecology: 'Réfléchissez à la façon dont cet objectif affectera votre vie, vos relations et vos engagements. Que devrez-vous sacrifier ou changer ?',
        timeline: 'Soyez précis sur quand et où cela se produira',
        firstStep: 'Identifiez la toute prochaine action que vous pouvez entreprendre',
      },
    },
  },
};
