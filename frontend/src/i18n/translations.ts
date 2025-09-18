// Project translations (UTF-8 clean)
export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  nav: {
    home: string; features: string; community: string; pricing: string; contact: string;
    login: string; signup: string; dashboard: string; goals?: string; logout: string;
  };
  login?: {
    title?: string;
    emailLabel?: string; emailPlaceholder?: string;
    passwordLabel?: string; passwordPlaceholder?: string;
    submit?: string; forgotPassword?: string; orContinueWith?: string;
    messages?: { loginFailed?: string };
    validation?: { requiredEmail?: string; invalidEmail?: string; requiredPassword?: string };
  };
  hero: { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  features: {
    title: string; subtitle: string;
    goalTracking: { title: string; description: string };
    community: { title: string; description: string };
    gamification: { title: string; description: string };
    patronage: { title: string; description: string };
  };
  dashboard: {
    user: { title: string; welcome: string; goals: string; progress: string; community: string; achievements: string };
    partner: { title: string; services: string; analytics: string; engagement: string; revenue: string };
    patron: { title: string; contributions: string; impact: string; benefits: string; community: string };
  };
  // We intentionally keep signup flexible; callers may use signup or signup.local
  signup: any;
  common: { loading: string; error: string; success: string; save: string; cancel: string; delete: string; edit: string; view: string; close: string };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home', features: 'Features', community: 'Community', pricing: 'Pricing', contact: 'Contact',
      login: 'Sign In', signup: 'Join Guild', dashboard: 'Dashboard', goals: 'Quests', logout: 'Sign Out',
    },
    login: {
      title: 'Sign In',
      emailLabel: 'Email Address', emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password', passwordPlaceholder : '********',
      submit: 'Sign In', forgotPassword: 'Forgot password?', orContinueWith: 'or continue with',
      messages: { loginFailed: 'Login failed' },
      validation: {
        requiredEmail: 'Email is required', invalidEmail: 'Please enter a valid email address', requiredPassword: 'Password is required'
      }
    },
    hero: {
      title: 'Unite in Purpose, Achieve Together',
      subtitle: 'Join a medieval-inspired community where goals become quests and progress is celebrated.',
      ctaPrimary: 'Begin Your Quest', ctaSecondary: 'Explore Features',
    },
    features: {
      title: 'Guild Features', subtitle: 'Tools that help your community achieve greatness.',
      goalTracking: { title: 'Quest Management', description: 'Set, track and achieve your goals.' },
      community: { title: 'Guild Community', description: 'Connect, share and support each other.' },
      gamification: { title: 'Honor & Achievements', description: 'Earn badges and celebrate milestones.' },
      patronage: { title: 'Noble Patronage', description: 'Support the community and unlock benefits.' },
    },
    dashboard: {
      user: { title: "Adventurer's Hall", welcome: 'Welcome back!', goals: 'Active Quests', progress: 'Progress Overview', community: 'Guild Activities', achievements: 'Earned Honors' },
      partner: { title: "Merchant's Quarters", services: 'Your Services', analytics: 'Business Analytics', engagement: 'User Engagement', revenue: 'Revenue Streams' },
      patron: { title: "Noble's Court", contributions: 'Your Patronage', impact: 'Community Impact', benefits: 'Exclusive Benefits', community: 'Patron Community' },
    },
    // Goals / Quests page
    // @ts-ignore â€“ extend loosely
    goals: {
      title: 'Create Your Quest',
      fields: { title: 'Title', description: 'Description', deadline: 'Deadline' },
      section: {
        nlpTitle: 'Well-formed Outcome (NLP)',
        nlpSubtitle: 'Answer to clarify and strengthen your goal.'
      },
      questions: {
        positive: 'State your goal positively',
        specific: 'Make it specific and context-bound',
        evidence: 'How will you know you achieved it? (evidence)',
        resources: 'What resources do you have/need?',
        obstacles: 'What obstacles might arise? How will you overcome them?',
        ecology: 'Is this ecological for you and others?',
        timeline: 'When, where, with whom will this happen?',
        firstStep: 'What is your immediate first step?'
      },
      actions: {
        createGoal: 'Create Goal',
        generateImage: 'Inspiration Image',
        suggestImprovements: 'Improve with AI',
        refresh: 'Refresh'
      },
      inspiration: { title: 'Inspirational Image' },
      suggestions: { title: 'AI Suggestions' },
      // Inline list controls and labels (filters, pagination, tasks)
      list: {
        myGoals: 'My Quests', tasks: 'Tasks', viewTasks: 'View Tasks', noGoals: 'No goals yet.', noTasks: 'No tasks yet.',
        createTask: 'Create Task', taskTitle: 'Task title', taskCreated: 'Task created',
        search: 'Search goals', allStatuses: 'All', statusActive: 'Active', statusPaused: 'Paused', statusCompleted: 'Completed', statusArchived: 'Archived',
        showMore: 'Show more'
      },
      planTaskTitle: 'Planning: Well-formed Outcome',
      messages: {
        created: 'Goal created!',
        aiImageFailed: 'Could not generate image',
        aiSuggestFailed: 'Could not get suggestions'
      },
      validation: {
        titleRequired: 'Title is required',
        deadlineRequired: 'Deadline is required'
      }
    },
    signup: {
      title: 'User Sign-Up',
      email: 'Email Address', fullName: 'Full Name', birthDate: 'Date of Birth',
      nickname: 'Nickname', pronouns: 'Pronouns', bio: 'Bio', country: 'Country', gender: 'Gender',
      selectPronouns: 'Select pronouns',
      selectCountry: 'Select your country', password: 'Password', confirmPassword: 'Confirm Password',
      submit: 'Create Account',
      successMessage: 'Account created!',
      // When email confirmation is enabled, use this success text instead.
      successConfirmMessage: 'Account created! Please check your email to confirm your address.',
      errorMessage: 'Failed to create account. Please try again.',
      options: {
        pronouns: { sheHer: 'She/Her', heHim: 'He/Him', theyThem: 'They/Them', sheThey: 'She/They', heThey: 'He/They' },
        genders: { female: 'Female', male: 'Male', nonBinary: 'Non-binary', transgender: 'Transgender' },
        common: { other: 'Other', preferNot: 'Prefer not to say' },
      },
      validation: {
        required: 'This field is required', invalidEmail: 'Please enter a valid email address',
        passwordMismatch: 'Passwords do not match', passwordMinLength: 'Password must be at least 8 characters',
        invalidDate: 'Please enter a valid date (YYYY-MM-DD)', birthDateTooRecent: 'Birth date cannot be later than today minus 1 year',
        bioMaxLength: 'Bio must be 200 characters or fewer', invalidCountry: 'Please choose a country from the list',
        emailTaken: 'This email is already in use', emailAvailable: 'Available', nicknameAvailable: 'Available', nicknameTaken: 'This nickname is already in use',
        passwordLower: 'Must include a lowercase letter', passwordUpper: 'Must include an uppercase letter', passwordDigit: 'Must include a digit', passwordSpecial: 'Must include a special character',
      },
    },
    common: { loading: 'Loading...', error: 'An error occurred', success: 'Success!', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', view: 'View', close: 'Close' },
  },
  es: {
    nav: {
      home: 'Inicio', features: 'Funciones', community: 'Comunidad', pricing: 'Precios', contact: 'Contacto',
      login: 'Iniciar sesión', signup: 'Unirse al Gremio', dashboard: 'Panel', goals: 'Misiones', logout: 'Cerrar sesión',
    },
    login: {
      title: 'Iniciar sessión',
      emailLabel: 'Correo electr?nico', emailPlaceholder: 'tu@ejemplo.com',
      passwordLabel: 'Contraseña', passwordPlaceholder: '********',
      submit: 'Iniciar sessión', forgotPassword: '¿Olvidaste tu contraseña?', orContinueWith: 'o continuar con',
      messages: { loginFailed: 'Error al iniciar sesión' },
      validation: {
        requiredEmail: 'El Correo electr?nico es obligatorio', invalidEmail: 'Introduce un correo válido', requiredPassword: 'La contraseña es obligatoria'
      }
    },
    hero: {
      title: 'Ãšnete en propósito, logremos juntos',
      subtitle: 'Una comunidad inspirada en lo medieval donde las metas se vuelven misiones.',
      ctaPrimary: 'Comienza tu misión', ctaSecondary: 'Explorar funciones',
    },
    features: {
      title: 'Funciones del Gremio', subtitle: 'Herramientas para lograr grandes cosas.',
      goalTracking: { title: 'Gestión de misiones', description: 'Define, sigue y logra tus metas.' },
      community: { title: 'Comunidad del Gremio', description: 'Conecta, comparte y apoya.' },
      gamification: { title: 'Honores y logros', description: 'Gana insignias y celebra hitos.' },
      patronage: { title: 'Mecenazgo', description: 'Apoya a la comunidad y desbloquea beneficios.' },
    },
    signup: {
      title: 'Registro de usuario',
      email: 'Correo electr?nico', fullName: 'Nombre completo', birthDate: 'Fecha de nacimiento',
      nickname: 'Apodo', pronouns: 'Pronombres', bio: 'Bio', country: 'País', gender: 'Género',
      selectPronouns: 'Selecciona tus pronombres',
      selectCountry: 'Selecciona tu país', password: 'Contraseña', confirmPassword: 'Confirmar contraseña',
      submit: 'Crear cuenta',
      successMessage: '¡Cuenta creada!',
      // Cuando la confirmación por correo esté habilitada, usa este texto.
      successConfirmMessage: '¡Cuenta creada! Revisa tu correo para confirmar tu dirección.',
      errorMessage: 'Error al crear la cuenta. Intêntalo de nuevo.',
      options: {
        pronouns: { sheHer: 'Ella', heHim: 'Él', theyThem: 'Elle', sheThey: 'Ella/Elle', heThey: 'Él/Elle' },
        genders: { female: 'Femenino', male: 'Masculino', nonBinary: 'No binario', transgender: 'Transgénero' },
        common: { other: 'Otro', preferNot: 'Prefiero no decir' },
      },
      validation: {
        required: 'Este campo es obligatorio', invalidEmail: 'Introduce un correo válido',
        passwordMismatch: 'Las contraseñas no coinciden', passwordMinLength: 'Mínimo 8 caracteres',
        invalidDate: 'Introduce una fecha válida (AAAA-MM-DD)', birthDateTooRecent: 'No puede ser mayor que hoy - 1 año',
        bioMaxLength: 'Máximo 200 caracteres', invalidCountry: 'Elige un país de la lista',
        emailTaken: 'Este correo ya está en uso', emailAvailable: 'Disponible', nicknameAvailable: 'Disponible', nicknameTaken: 'Este apodo ya está en uso',
        passwordLower: 'Debe incluir una minúscula', passwordUpper: 'Debe incluir una mayúscula', passwordDigit: 'Debe incluir un dígito', passwordSpecial: 'Debe incluir un carácter especial',
      },
    },
    dashboard: {
      user: { title: 'Sala del Aventurero', welcome: '¡Bienvenido de nuevo!', goals: 'Misiones activas', progress: 'Resumen de progreso', community: 'Actividades del gremio', achievements: 'Honores ganados' },
      partner: { title: 'Barrio del Comerciante', services: 'Tus servicios', analytics: 'Analíticas', engagement: 'Participación', revenue: 'Ingresos' },
      patron: { title: 'Corte del Noble', contributions: 'Tu mecenazgo', impact: 'Impacto', benefits: 'Beneficios', community: 'Comunidad de mecenas' },
    },
    // @ts-ignore
    goals: {
      title: 'Crea tu Misión',
      fields: { title: 'Título', description: 'Descripción', deadline: 'Fecha límite' },
      section: { nlpTitle: 'Resultado bien formado (PNL)', nlpSubtitle: 'Responde para clarificar y fortalecer tu objetivo.' },
      questions: {
        positive: 'Expresa tu objetivo en positivo',
        specific: 'Hazlo específico y con contexto',
        evidence: '¿Cómo sabrás que lo lograste? (evidencia)',
        resources: '¿Qué recursos tienes/necesitas?',
        obstacles: '¿Qué obstáculos podrían aparecer? ¿Cómo los superarás?',
        ecology: '¿Es ecológico para ti y para otros?',
        timeline: '¿Cuándo, dónde y con quién ocurrirá?',
        firstStep: '¿Cuál es tu primer paso inmediato?'
      },
      actions: { createGoal: 'Crear objetivo', generateImage: 'Imagen inspiradora', suggestImprovements: 'Mejorar con IA', refresh: 'Actualizar' },
      inspiration: { title: 'Imagen inspiradora' },
      suggestions: { title: 'Sugerencias de IA' },
      // Inline list controls and labels
      list: {
        myGoals: 'Mis misiones', tasks: 'Tareas', viewTasks: 'Ver tareas', noGoals: 'Aún no hay objetivos.', noTasks: 'Aún no hay tareas.',
        createTask: 'Crear tarea', taskTitle: 'Título de la tarea', taskCreated: 'Tarea creada',
        search: 'Buscar objetivos', allStatuses: 'Todas', statusActive: 'Activa', statusPaused: 'Pausada', statusCompleted: 'Completada', statusArchived: 'Archivada',
        showMore: 'Mostrar más'
      },
      planTaskTitle: 'Planificación: Resultado bien formado',
      messages: { created: '¡Objetivo creado!', aiImageFailed: 'No se pudo generar la imagen', aiSuggestFailed: 'No se pudo obtener sugerencias' },
      validation: { titleRequired: 'El título es obligatorio', deadlineRequired: 'La fecha límite es obligatoria' }
    },
    common: { loading: 'Cargando...', error: 'Ocurrió un error', success: '¡Éxito!', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', view: 'Ver', close: 'Cerrar' },
  },
  fr: {
    nav: {
      home: 'Accueil', features: 'Fonctionnalités', community: 'Communauté', pricing: 'Tarifs', contact: 'Contact',
      login: 'Se connecter', signup: 'Rejoindre la Guilde', dashboard: 'Tableau de bord', goals: 'Quêtes', logout: 'Se déconnecter',
    },
    login: {
      title: 'Se connecter',
      emailLabel: 'Adresse e-mail', emailPlaceholder: 'vous@exemple.com',
      passwordLabel: 'Mot de passe',passwordPlaceholder  : '********',
      submit: 'Se connecter', forgotPassword: 'Mot de passe oublié ?', orContinueWith: 'ou continuer avec',
      messages: { loginFailed: 'Échec de la connexion' },
      validation: {
        requiredEmail: "L'e-mail est requis", invalidEmail: 'Veuillez saisir une adresse e-mail valide', requiredPassword: 'Mot de passe requis'
      }
    },
    hero: {
      title: 'Unis dans le but, réussir ensemble',
      subtitle: 'Une communauté médiévale où les objectifs deviennent des quêtes.',      
      ctaPrimary: 'Commencer la quête', ctaSecondary: 'Découvrir les fonctions',
    },
    features: {
      title: 'Fonctionnalités de la Guilde', subtitle: 'Des outils pour réussir ensemble.',
      goalTracking: { title: 'Gestion des quêtes', description: 'Définir, suivre et réussir.' },
      community: { title: 'Communauté de la Guilde', description: 'Se connecter, partager, soutenir.' },
      gamification: { title: 'Honneurs & succès', description: 'Gagner des badges et célébrer.' },
      patronage: { title: 'Mécénat', description: 'Soutenir et débloquer des avantages.' },
    },
    signup: {
      local: {
        title: 'Inscription locale',
        email: 'Adresse e-mail', fullName: 'Nom complet', birthDate: 'Date de naissance',
        nickname: 'Pseudo', pronouns: 'Pronoms', bio: 'Bio', country: 'Pays', gender: 'Genre',
        selectPronouns: 'Sélectionnez vos pronoms',
        selectCountry: 'Sélectionnez votre pays', password: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe',
        submit: 'Créer un compte',
        successMessage: 'Compte créé !',
        // Lorsque la confirmation e-mail est activée, utiliser ce texte.
        successConfirmMessage: 'Compte créé ! Vérifiez votre e-mail pour confirmer.',
        errorMessage: 'Échec de la création du compte. Veuillez réessayer.',
        options: {
          pronouns: { sheHer: 'Elle', heHim: 'Il/Lui', theyThem: 'Iel', sheThey: 'Elle/Iel', heThey: 'Il/Iel' },
          genders: { female: 'Femme', male: 'Homme', nonBinary: 'Non-binaire', transgender: 'Transgenre' },
          common: { other: 'Autre', preferNot: 'Préférer ne pas répondre' },
        },
        validation: {
          required: 'Ce champ est requis', invalidEmail: 'Adresse e-mail invalide',
          passwordMismatch: 'Les mots de passe ne correspondent pas', passwordMinLength: 'Minimum 8 caractères',
          invalidDate: 'Date invalide (AAAA-MM-JJ)', birthDateTooRecent: "Ne peut pas être postérieure à (aujourd'hui - 1 an)",
          bioMaxLength: 'La biographie doit comporter 200 caractères ou moins', invalidCountry: 'Choisissez un pays dans la liste',
          emailTaken: 'Cet e-mail est déjà utilisé', emailAvailable: 'Disponible', nicknameAvailable: 'Disponible', nicknameTaken: 'Ce pseudo est déjà utilisé',
          passwordLower: 'Doit inclure une minuscule', passwordUpper: 'Doit inclure une majuscule', passwordDigit: 'Doit inclure un chiffre', passwordSpecial: 'Doit inclure un caractère spécial',
        },
      },
    },
    dashboard: {
      

      user: { title: "Salle de l'Aventurier", welcome: 'Bon retour !', goals: 'Quêtes actives', progress: 'Aperçu des progrès', community: 'Activités de la guilde', achievements: 'Honneurs' },
      partner: { title: 'Quartier du marchand', services: 'Vos services', analytics: 'Analyses', engagement: 'Engagement', revenue: 'Revenus' },
      patron: { title: 'Cour du noble', contributions: 'Votre mécénat', impact: 'Impact', benefits: 'Avantages', community: 'Communauté des mécènes' },
    },
    // @ts-ignore
    goals: {
      title: 'Crée ta Quête',
      fields: { title: 'Titre', description: 'Description', deadline: 'Échéance' },
      section: { nlpTitle: 'Objectif bien formé (PNL)', nlpSubtitle: 'Réponds pour clarifier et renforcer ton objectif.' },
      questions: {
        positive: 'Formule ton objectif positivement',
        specific: 'Rends-le précis et contextuel',
        evidence: "Comment sauras-tu que c'est atteint ? (preuves)",
        resources: 'Quelles ressources as-tu/besoins ?',
        obstacles: 'Quels obstacles ? Comment les surmonter ?',
        ecology: 'Est-ce écologique pour toi et les autres ?',
        timeline: 'Quand, où, avec qui cela se fera ?',
        firstStep: 'Quelle est ta première étape immédiate ?'
      },
      
      actions: { createGoal: 'Créer un objectif', generateImage: 'Image inspirante', suggestImprovements: 'Améliorer avec IA', refresh: 'Rafraîchir' },
      inspiration: { title: 'Image inspirante' },
      suggestions: { title: 'Suggestions IA' },
      // Inline list controls and labels
      list: {
        myGoals: 'Mes quêtes', tasks: 'Tâches', viewTasks: 'Voir les tâches', noGoals: 'Aucun objectif.', noTasks: 'Aucune tâche.',
        createTask: 'Créer une tâche', taskTitle: 'Titre de la tâche', taskCreated: 'Tâche créée',
        search: 'Rechercher des objectifs', allStatuses: 'Tous', statusActive: 'Actif', statusPaused: 'En pause', statusCompleted: 'Terminé', statusArchived: 'Archivé',
        showMore: 'Afficher plus'
      },
      planTaskTitle: 'Planification : Objectif bien formé',
      

      messages: { created: 'Objectif créé !', aiImageFailed: "Échec de génération de l'image", aiSuggestFailed: 'Échec des suggestions' },
      validation: { titleRequired: 'Le titre est requis', deadlineRequired: "L'échéance est requise" }
    },
    common: { loading: 'Chargementâ€¦', error: 'Une erreur est survenue', success: 'Succès !', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', view: 'Voir', close: 'Fermer' },
  },
};





