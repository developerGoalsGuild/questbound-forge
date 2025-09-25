export type Language = 'en' | 'es' | 'fr';

export interface GoalsTranslations {
  title: string;
  fields: { title: string; description: string; deadline: string };
  hints: {
    iconLabel: string;
    fields: { title: string; description: string; deadline: string };
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
    filters: { search: string; status: string };
    tasks: { title: string; dueAt: string };
  };
  section: { nlpTitle: string; nlpSubtitle: string };
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
  actions: {
    createGoal: string;
    generateImage: string;
    suggestImprovements: string;
    refresh: string;
  };
  inspiration: { title: string };
  suggestions: { title: string };
  list: {
    myGoals: string;
    newGoal: string;
    tasks: string;
    viewTasks: string;
    noGoals: string;
    noTasks: string;
    createTask: string;
    taskTitle: string;
    taskCreated: string;
    taskDueAtLabel: string;
    searchLabel: string;
    search: string;
    allStatuses: string;
    statusFilterLabel: string;
    statusActive: string;
    statusPaused: string;
    statusCompleted: string;
    statusArchived: string;
    showMore: string;
    columns: {
      title: string;
      deadline: string;
      status: string;
      tags: string;
      actions: string;
    };
  };
  modal: {
    createTaskTitle: string;
  };
  modals: {
    viewTask: {
      title: string;
    };
  };
  placeholders: {
    taskTags: string;
  };
  paginationLabel: string;
  paginationFirst: string;
  paginationPrevious: string;
  paginationPage: string;
  paginationOf: string;
  paginationNext: string;
  paginationLast: string;
  planTaskTitle: string;
  messages: {
    created: string;
    aiImageFailed: string;
    aiSuggestFailed: string;
  };
  validation: {
    titleRequired: string;
    deadlineRequired: string;
  };
  modals: {
    createTask: {
      title: string;
      descriptionLabel: string;
      dueDateLabel: string;
      submitButton: string;
      cancelButton: string;
      validation: {
        titleRequired: string;
        dueDateRequired: string;
        dueDateInvalid: string;
      };
    };
    viewTask: {
      title: string;
      descriptionLabel: string;
      dueDateLabel: string;
      statusLabel: string;
      closeButton: string;
      editButton: string;
      deleteButton: string;
    };
  };
}

export const goalsTranslations: Record<Language, GoalsTranslations> = {
  en: {
    title: 'Create Your Quest',
    fields: { title: 'Title', description: 'Description', deadline: 'Deadline' },
    hints: {
      iconLabel: 'More information about {field}',
      fields: {
        title: 'Give your quest a short, action-focused name so it is easy to recognize later.',
        description: 'Share the motivation, desired outcome, and any context your allies should know.',
        deadline: 'Pick the target date you want to finish; you can adjust it if plans change.',
      },
      questions: {
        positive: 'Focus on the desired outcome; describe what you want to happen, not what you want to avoid.',
        specific: 'Add concrete details such as where, when, or with whom this quest takes place.',
        evidence: 'Describe the observable signs or measures that will confirm success.',
        resources: 'List the skills, people, tools, or time you already have or need to secure.',
        obstacles: 'Anticipate possible blockers and note how you will respond to each one.',
        ecology: 'Check the impact on you and others to ensure the goal fits your values and commitments.',
        timeline: 'Outline the sequence or timeframe that will carry you from start to finish.',
        firstStep: 'Decide the very next action you can take to build momentum.',
      },
      filters: {
        search: 'Filter the table by quest title or description keywords.',
        status: 'Limit the list to quests matching a specific progress state.',
      },
      tasks: {
        title: 'Describe the actionable step you plan to take next.',
        dueAt: 'Schedule when this task should be completed to stay on track.',
      },
    },
    section: {
      nlpTitle: 'Well-formed Outcome (NLP)',
      nlpSubtitle: 'Answer to clarify and strengthen your goal.',
    },
    questions: {
      positive: 'State your goal positively',
      specific: 'Make it specific and context-bound',
      evidence: 'How will you know you achieved it? (evidence)',
      resources: 'What resources do you have/need?',
      obstacles: 'What obstacles might arise? How will you overcome them?',
      ecology: 'Is this ecological for you and others?',
      timeline: 'When, where, with whom will this happen?',
      firstStep: 'What is your immediate first step?',
    },
    actions: {
      createGoal: 'Create Goal',
      generateImage: 'Inspiration Image',
      suggestImprovements: 'Improve with AI',
      refresh: 'Refresh',
    },
    inspiration: { title: 'Inspirational Image' },
    suggestions: { title: 'AI Suggestions' },
    list: {
      myGoals: 'My Quests',
      newGoal: 'New Goal',
      tasks: 'Tasks',
      viewTasks: 'View Tasks',
      noGoals: 'No goals yet.',
      noTasks: 'No tasks yet.',
      createTask: 'Create Task',
      taskTitle: 'Task title',
      taskCreated: 'Task created',
      taskDueAtLabel: 'Task due date',
      searchLabel: 'Search quests',
      search: 'Search goals',
      allStatuses: 'All',
      statusFilterLabel: 'Status',
      statusActive: 'Active',
      statusPaused: 'Paused',
      statusCompleted: 'Completed',
      statusArchived: 'Archived',
      showMore: 'Show more',
    },
    planTaskTitle: 'Planning: Well-formed Outcome',
    messages: {
      created: 'Goal created!',
      aiImageFailed: 'Could not generate image',
      aiSuggestFailed: 'Could not get suggestions',
    },
    validation: {
      titleRequired: 'Title is required',
      deadlineRequired: 'Deadline is required',
      taskTitleRequired: 'Task title is required',
      taskDueAtRequired: 'Task due date is required',
      taskDueAtInvalid: 'Invalid due date',
      taskDueAtExceedsGoalDeadline: 'Task due date cannot exceed goal deadline',
      taskTagsRequired: 'At least one tag is required',
      taskTagsInvalid: 'Tags can only contain letters, numbers, hyphens, and underscores',
      taskTagsDuplicate: 'Duplicate tags are not allowed',
      taskStatusInvalid: 'Invalid status selected',
    },
    modals: {
      createTask: {
        title: 'Create New Task',
        descriptionLabel: 'Task Description',
        dueDateLabel: 'Due Date',
        submitButton: 'Add Task',
        cancelButton: 'Cancel',
        validation: {
          titleRequired: 'Task title is required',
          dueDateRequired: 'Due date is required',
          dueDateInvalid: 'Please enter a valid due date',
        },
      },
      viewTask: {
        title: 'Task Details',
        descriptionLabel: 'Description',
        dueDateLabel: 'Due Date',
        statusLabel: 'Status',
        closeButton: 'Close',
        editButton: 'Edit',
        deleteButton: 'Delete',
      },
    },
    columns: {
      title: 'Title',
      deadline: 'Deadline',
      status: 'Status',
      tags: 'Tags',
      actions: 'Actions',
    },
    modal: {
      createTaskTitle: 'Create New Task',
    },
    modals: {
      viewTask: {
        title: 'My Tasks',
      },
    },
    placeholders: {
      taskTags: 'Add tag and press Enter',
    },
    paginationLabel: 'Pagination',
    paginationFirst: 'First Page',
    paginationPrevious: 'Previous Page',
    paginationPage: 'Page',
    paginationOf: 'of',
    paginationNext: 'Next Page',
    paginationLast: 'Last Page',
  },
  es: {
    title: 'Crea tu Misión',
    fields: { title: 'Título', description: 'Descripción', deadline: 'Fecha límite' },
    hints: {
      iconLabel: 'Más información sobre {field}',
      fields: {
        title: 'Elige un nombre breve y orientado a la acción para reconocer fácilmente la misión.',
        description: 'Explica la motivación, el resultado deseado y cualquier contexto que el equipo deba conocer.',
        deadline: 'Selecciona la fecha objetivo para terminar; podrás ajustarla si los planes cambian.',
      },
      questions: {
        positive: 'Enfócate en el resultado deseado y describe lo que quieres que ocurra, no lo que quieres evitar.',
        specific: 'Añade detalles concretos como dónde, cuándo y con quién ocurrirá esta misión.',
        evidence: 'Describe las señales observables o métricas que confirmarán el éxito.',
        resources: 'Enumera habilidades, personas, herramientas o tiempo que ya tienes o necesitas conseguir.',
        obstacles: 'Anticipa los obstáculos potenciales y anota cómo responderás.',
        ecology: 'Verifica el impacto en ti y en otros para asegurar que el objetivo respete tus valores y compromisos.',
        timeline: 'Describe la secuencia o el calendario que te llevará del inicio al final.',
        firstStep: 'Define la acción inmediata que puedes realizar para ganar impulso.',
      },
      filters: {
        search: 'Filtra la lista por palabras clave del título o la descripción de la misión.',
        status: 'Muestra solo las misiones que están en un estado específico.',
      },
      tasks: {
        title: 'Describe la próxima acción concreta que realizarás.',
        dueAt: 'Define cuándo debe completarse esta tarea para mantener el ritmo.',
      },
    },
    section: {
      nlpTitle: 'Resultado bien formado (PNL)',
      nlpSubtitle: 'Responde para clarificar y fortalecer tu objetivo.',
    },
    questions: {
      positive: 'Expresa tu objetivo en positivo',
      specific: 'Hazlo específico y con contexto',
      evidence: '¿Cómo sabrás que lo lograste? (evidencia)',
      resources: '¿Qué recursos tienes/necesitas?',
      obstacles: '¿Qué obstáculos podrían aparecer? ¿Cómo los superarás?',
      ecology: '¿Es ecológico para ti y para otros?',
      timeline: '¿Cuándo, dónde y con quién ocurrirá?',
      firstStep: '¿Cuál es tu primer paso inmediato?',
    },
    actions: {
      createGoal: 'Crear objetivo',
      generateImage: 'Imagen inspiradora',
      suggestImprovements: 'Mejorar con IA',
      refresh: 'Actualizar',
    },
    inspiration: { title: 'Imagen inspiradora' },
    suggestions: { title: 'Sugerencias de IA' },
    list: {
      myGoals: 'Mis misiones',
      newGoal: 'Nueva mision',
      tasks: 'Tareas',
      viewTasks: 'Ver tareas',
      noGoals: 'Aún no hay objetivos.',
      noTasks: 'Aún no hay tareas.',
      createTask: 'Crear tarea',
      taskTitle: 'Título de la tarea',
      taskCreated: 'Tarea creada',
      taskDueAtLabel: 'Fecha límite de la tarea',
      searchLabel: 'Buscar misiones',
      search: 'Buscar objetivos',
      allStatuses: 'Todas',
      statusFilterLabel: 'Estado',
      statusActive: 'Activa',
      statusPaused: 'Pausada',
      statusCompleted: 'Completada',
      statusArchived: 'Archivada',
      showMore: 'Mostrar más',
    },
    planTaskTitle: 'Planificación: Resultado bien formado',
    messages: {
      created: '¡Objetivo creado!',
      aiImageFailed: 'No se pudo generar la imagen',
      aiSuggestFailed: 'No se pudo obtener sugerencias',
    },
    validation: {
      titleRequired: 'El título es obligatorio',
      deadlineRequired: 'La fecha límite es obligatoria',
    },
    modals: {
      createTask: {
        title: 'Crear nueva tarea',
        descriptionLabel: 'Descripción de la tarea',
        dueDateLabel: 'Fecha límite',
        submitButton: 'Agregar tarea',
        cancelButton: 'Cancelar',
        validation: {
          titleRequired: 'El título de la tarea es obligatorio',
          dueDateRequired: 'La fecha límite es obligatoria',
          dueDateInvalid: 'Por favor ingresa una fecha válida',
        },
      },
      viewTask: {
        title: 'Detalles de la tarea',
        descriptionLabel: 'Descripción',
        dueDateLabel: 'Fecha límite',
        statusLabel: 'Estado',
        closeButton: 'Cerrar',
        editButton: 'Editar',
        deleteButton: 'Eliminar',
      },
    },
    columns: {
      title: 'Título',
      deadline: 'Fecha límite',
      status: 'Estado',
      tags: 'Etiquetas',
      actions: 'Acciones',
    },
    modal: {
      createTaskTitle: 'Crear nueva tarea',
    },
    modals: {
      viewTask: {
        title: 'Mis tareas',
      },
    },
    placeholders: {
      taskTags: 'Agregar etiqueta y presionar Enter',
    },
    paginationLabel: 'Paginación',
    paginationFirst: 'Primera página',
    paginationPrevious: 'Página anterior',
    paginationPage: 'Página',
    paginationOf: 'de',
    paginationNext: 'Página siguiente',
    paginationLast: 'Última página',
  },
  fr: {
    title: 'Crée ta Quête',
    fields: { title: 'Titre', description: 'Description', deadline: 'Échéance' },
    hints: {
      iconLabel: 'Plus d\'informations sur {field}',
      fields: {
        title: 'Choisis un nom court et orienté vers l\'action pour retrouver facilement la quête.',
        description: 'Partage la motivation, le résultat attendu et tout contexte utile à ton équipe.',
        deadline: 'Sélectionne la date visée pour terminer; tu pourras l\'ajuster si les plans évoluent.',
      },
      questions: {
        positive: 'Concentre-toi sur le résultat souhaité et décris ce que tu veux obtenir, pas ce que tu veux éviter.',
        specific: 'Ajoute des détails concrets comme où, quand et avec qui cette quête se déroulera.',
        evidence: 'Indique les signes observables ou les indicateurs qui confirmeront la réussite.',
        resources: 'Liste les compétences, personnes, outils ou le temps que tu possèdes ou dois obtenir.',
        obstacles: 'Anticipe les obstacles possibles et précise comment tu y répondras.',
        ecology: 'Vérifie l\'impact sur toi et sur les autres pour t\'assurer que l\'objectif respecte tes valeurs et engagements.',
        timeline: 'Décris la séquence ou l\'échéancier qui te mènera du départ à l\'achèvement.',
        firstStep: 'Décide de la toute première action à entreprendre pour lancer l\'élan.',
      },
      filters: {
        search: 'Filtre la liste avec des mots-clés du titre ou de la description de la quête.',
        status: 'Affiche uniquement les quêtes correspondant à un état spécifique.',
      },
      tasks: {
        title: 'Décris la prochaine action concrète que tu entreprendras.',
        dueAt: 'Planifie quand cette tâche doit être terminée pour garder le rythme.',
      },
    },
    section: {
      nlpTitle: 'Objectif bien formé (PNL)',
      nlpSubtitle: 'Réponds pour clarifier et renforcer ton objectif.',
    },
    questions: {
      positive: 'Formule ton objectif positivement',
      specific: 'Rends-le précis et contextuel',
      evidence: "Comment sauras-tu que c'est atteint ? (preuves)",
      resources: 'Quelles ressources as-tu/besoins ?',
      obstacles: 'Quels obstacles ? Comment les surmonter ?',
      ecology: 'Est-ce écologique pour toi et les autres ?',
      timeline: 'Quand, où, avec qui cela se fera ?',
      firstStep: 'Quelle est ta première étape immédiate ?',
    },
    actions: {
      createGoal: 'Créer un objectif',
      generateImage: 'Image inspirante',
      suggestImprovements: 'Améliorer avec IA',
      refresh: 'Rafraîchir',
    },
    inspiration: { title: 'Image inspirante' },
    suggestions: { title: 'Suggestions IA' },
    list: {
      myGoals: 'Mes quêtes',
      newGoal: 'quête',
      tasks: 'Tâches',
      viewTasks: 'Voir les tâches',
      noGoals: 'Aucun objectif.',
      noTasks: 'Aucune tâche.',
      createTask: 'Créer une tâche',
      taskTitle: 'Titre de la tâche',
      taskCreated: 'Tâche créée',
      taskDueAtLabel: 'Date limite de la tâche',
      searchLabel: 'Rechercher des quêtes',
      search: 'Rechercher des objectifs',
      allStatuses: 'Tous',
      statusFilterLabel: 'Statut',
      statusActive: 'Actif',
      statusPaused: 'En pause',
      statusCompleted: 'Terminé',
      statusArchived: 'Archivé',
      showMore: 'Afficher plus',
    },
    planTaskTitle: 'Planification : Objectif bien formé',
    messages: {
      created: 'Objectif créé !',
      aiImageFailed: "Échec de génération de l'image",
      aiSuggestFailed: 'Échec des suggestions',
    },
    validation: {
      titleRequired: 'Le titre est requis',
      deadlineRequired: "L'échéance est requise",
    },
    modals: {
      createTask: {
        title: 'Créer une nouvelle tâche',
        descriptionLabel: 'Description de la tâche',
        dueDateLabel: 'Date limite',
        submitButton: 'Ajouter la tâche',
        cancelButton: 'Annuler',
        validation: {
          titleRequired: 'Le titre de la tâche est requis',
          dueDateRequired: 'La date limite est requise',
          dueDateInvalid: 'Veuillez saisir une date limite valide',
        },
      },
      viewTask: {
        title: 'Détails de la tâche',
        descriptionLabel: 'Description',
        dueDateLabel: 'Date limite',
        statusLabel: 'Statut',
        closeButton: 'Fermer',
        editButton: 'Modifier',
        deleteButton: 'Supprimer',
      },
    },
    columns: {
      title: 'Titre',
      deadline: 'Échéance',
      status: 'Statut',
      tags: 'Étiquettes',
      actions: 'Actions',
    },
    modal: {
      createTaskTitle: 'Créer une nouvelle tâche',
    },
    modals: {
      viewTask: {
        title: 'Mes tâches',
      },
    },
    placeholders: {
      taskTags: 'Ajouter une étiquette et appuyer sur Entrée',
    },
    paginationLabel: 'Pagination',
    paginationFirst: 'Première page',
    paginationPrevious: 'Page précédente',
    paginationPage: 'Page',
    paginationOf: 'sur',
    paginationNext: 'Page suivante',
    paginationLast: 'Dernière page',
  }
};