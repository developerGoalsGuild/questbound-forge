export type Language = 'en' | 'es' | 'fr';

export interface GoalCreationTranslations {
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
  actions: {
    createGoal: string;
    cancel: string;
    reset: string;
    generateImage: string;
    suggestImprovements: string;
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
    nlpAnswerRequired: string;
    nlpAnswerMinLength: string;
  };
  messages: {
    createSuccess: string;
    createError: string;
    loading: string;
    imageGenerated: string;
    imageError: string;
    suggestionsGenerated: string;
    suggestionsError: string;
  };
  hints: {
    title: string;
    description: string;
    deadline: string;
    category: string;
  };
}

export const goalCreationTranslations: Record<Language, GoalCreationTranslations> = {
  en: {
    title: 'Create New Goal',
    subtitle: 'Set up your goal with well-formed outcome questions',
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
    nlp: {
      title: 'Well-formed Outcome (NLP)',
      subtitle: 'Answer these questions to clarify and strengthen your goal',
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
      hints: {
        positive: 'Focus on what you want to achieve, not what you want to avoid',
        specific: 'Include specific details like location, time, and people involved',
        evidence: 'Describe measurable outcomes or observable signs of success',
        resources: 'List skills, tools, people, or time you have or need',
        obstacles: 'Think about potential challenges and your response strategies',
        ecology: 'Consider the impact on yourself and others around you',
        timeline: 'Be specific about when and where this will happen',
        firstStep: 'Identify the very next action you can take',
      },
    },
    actions: {
      createGoal: 'Create Goal',
      cancel: 'Cancel',
      reset: 'Reset Form',
      generateImage: 'Generate Inspiration Image',
      suggestImprovements: 'Get AI Suggestions',
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
      nlpAnswerRequired: 'This question is required',
      nlpAnswerMinLength: 'Answer must be at least 10 characters',
    },
    messages: {
      createSuccess: 'Goal created successfully!',
      createError: 'Failed to create goal',
      loading: 'Creating goal...',
      imageGenerated: 'Inspiration image generated',
      imageError: 'Failed to generate image',
      suggestionsGenerated: 'AI suggestions generated',
      suggestionsError: 'Failed to generate suggestions',
    },
    hints: {
      title: 'Give your goal a short, action-focused name',
      description: 'Share the motivation and desired outcome',
      deadline: 'Pick a target date to finish your goal',
      category: 'Choose a category that best fits your goal',
    },
  },
  es: {
    title: 'Crear Nuevo Objetivo',
    subtitle: 'Configura tu objetivo con preguntas de resultado bien formado',
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
    nlp: {
      title: 'Resultado Bien Formado (PNL)',
      subtitle: 'Responde estas preguntas para clarificar y fortalecer tu objetivo',
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
      hints: {
        positive: 'Enfócate en lo que quieres lograr, no en lo que quieres evitar',
        specific: 'Incluye detalles específicos como ubicación, tiempo y personas involucradas',
        evidence: 'Describe resultados medibles o señales observables de éxito',
        resources: 'Enumera habilidades, herramientas, personas o tiempo que tienes o necesitas',
        obstacles: 'Piensa en desafíos potenciales y tus estrategias de respuesta',
        ecology: 'Considera el impacto en ti mismo y en otros a tu alrededor',
        timeline: 'Sé específico sobre cuándo y dónde ocurrirá esto',
        firstStep: 'Identifica la próxima acción inmediata que puedes tomar',
      },
    },
    actions: {
      createGoal: 'Crear Objetivo',
      cancel: 'Cancelar',
      reset: 'Restablecer Formulario',
      generateImage: 'Generar Imagen de Inspiración',
      suggestImprovements: 'Obtener Sugerencias de IA',
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
      nlpAnswerRequired: 'Esta pregunta es obligatoria',
      nlpAnswerMinLength: 'La respuesta debe tener al menos 10 caracteres',
    },
    messages: {
      createSuccess: '¡Objetivo creado exitosamente!',
      createError: 'Error al crear objetivo',
      loading: 'Creando objetivo...',
      imageGenerated: 'Imagen de inspiración generada',
      imageError: 'Error al generar imagen',
      suggestionsGenerated: 'Sugerencias de IA generadas',
      suggestionsError: 'Error al generar sugerencias',
    },
    hints: {
      title: 'Dale a tu objetivo un nombre corto y orientado a la acción',
      description: 'Comparte la motivación y el resultado deseado',
      deadline: 'Elige una fecha objetivo para terminar tu objetivo',
      category: 'Elige una categoría que se ajuste mejor a tu objetivo',
    },
  },
  fr: {
    title: 'Créer un Nouvel Objectif',
    subtitle: 'Configurez votre objectif avec des questions de résultat bien formé',
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
    nlp: {
      title: 'Objectif Bien Formé (PNL)',
      subtitle: 'Répondez à ces questions pour clarifier et renforcer votre objectif',
      questions: {
        positive: 'Formulez votre objectif positivement',
        specific: 'Rendez-le précis et contextuel',
        evidence: 'Comment saurez-vous que c\'est atteint ? (preuves)',
        resources: 'Quelles ressources avez-vous/besoin ?',
        obstacles: 'Quels obstacles pourraient survenir ? Comment les surmonter ?',
        ecology: 'Est-ce écologique pour vous et les autres ?',
        timeline: 'Quand, où, avec qui cela se fera-t-il ?',
        firstStep: 'Quelle est votre première étape immédiate ?',
      },
      hints: {
        positive: 'Concentrez-vous sur ce que vous voulez atteindre, pas sur ce que vous voulez éviter',
        specific: 'Incluez des détails spécifiques comme le lieu, le temps et les personnes impliquées',
        evidence: 'Décrivez des résultats mesurables ou des signes observables de succès',
        resources: 'Listez les compétences, outils, personnes ou temps que vous avez ou dont vous avez besoin',
        obstacles: 'Pensez aux défis potentiels et à vos stratégies de réponse',
        ecology: 'Considérez l\'impact sur vous-même et sur les autres autour de vous',
        timeline: 'Soyez précis sur quand et où cela se produira',
        firstStep: 'Identifiez la toute prochaine action que vous pouvez entreprendre',
      },
    },
    actions: {
      createGoal: 'Créer l\'Objectif',
      cancel: 'Annuler',
      reset: 'Réinitialiser le Formulaire',
      generateImage: 'Générer une Image d\'Inspiration',
      suggestImprovements: 'Obtenir des Suggestions IA',
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
      nlpAnswerRequired: 'Cette question est requise',
      nlpAnswerMinLength: 'La réponse doit contenir au moins 10 caractères',
    },
    messages: {
      createSuccess: 'Objectif créé avec succès !',
      createError: 'Échec de la création de l\'objectif',
      loading: 'Création de l\'objectif...',
      imageGenerated: 'Image d\'inspiration générée',
      imageError: 'Échec de la génération de l\'image',
      suggestionsGenerated: 'Suggestions IA générées',
      suggestionsError: 'Échec de la génération des suggestions',
    },
    hints: {
      title: 'Donnez à votre objectif un nom court et orienté vers l\'action',
      description: 'Partagez la motivation et le résultat souhaité',
      deadline: 'Choisissez une date cible pour terminer votre objectif',
      category: 'Choisissez une catégorie qui correspond le mieux à votre objectif',
    },
  },
};
