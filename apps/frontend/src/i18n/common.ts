export type Language = 'en' | 'es' | 'fr';

export interface CommonTranslations {
  loading: string;
  error: string;
  success: string;
  save: string;
  saving: string;
  cancel: string;
  delete: string;
  deleting: string;
  edit: string;
  editing: string;
  view: string;
  close: string;
  back: string;
  ascending: string;
  descending: string;
  optional: string;
  characters: string;
  resourceTypes: {
    goal: string;
    quest: string;
    task: string;
  };
  breadcrumb: {
    dashboard: string;
    quests: string;
    quest: string;
    create: string;
    edit: string;
    view: string;
    profile: string;
    editProfile: string;
    goals: string;
    goalsList: string;
    createGoal: string;
    editGoal: string;
    goalDetails: string;
    changePassword: string;
    guilds: string;
    chat: string;
    subscription: string;
    page: string;
  };
  footer: {
    sections: {
      product: string;
      company: string;
      support: string;
    };
    links: {
      pricing: string;
      community: string;
      apiDocumentation: string;
      aboutUs: string;
      blog: string;
      careers: string;
      helpCenter: string;
      privacyPolicy: string;
      termsOfService: string;
      status: string;
    };
    description: string;
    madeWith: string;
    forAdventurers: string;
    newsletter: {
      title: string;
      subtitle: string;
      placeholder: string;
      button: string;
      submitting?: string;
      subscribed?: string;
      success?: string;
      error?: string;
      emailLabel?: string;
      emailRequired?: string;
      emailInvalid?: string;
      redirecting?: string;
    };
    copyright: string;
  };
}

export const commonTranslations: Record<Language, CommonTranslations> = {
  en: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success!',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    deleting: 'Deleting...',
    edit: 'Edit',
    editing: 'Editing...',
    view: 'View',
    close: 'Close',
    back: 'Back',
    ascending: 'Ascending',
    descending: 'Descending',
    optional: '(optional)',
    characters: 'characters',
    resourceTypes: {
      goal: 'goal',
      quest: 'quest',
      task: 'task',
    },
    breadcrumb: {
      dashboard: 'Dashboard',
      quests: 'Quests',
      quest: 'Quest',
      create: 'Create',
      edit: 'Edit',
      view: 'View',
      profile: 'Profile',
      editProfile: 'Edit Profile',
      goals: 'Goals',
      goalsList: 'Goals List',
      createGoal: 'Create Goal',
      editGoal: 'Edit Goal',
      goalDetails: 'Goal Details',
      changePassword: 'Change Password',
      guilds: 'Guilds',
      chat: 'Chat',
      subscription: 'Subscription',
      page: 'Page',
    },
    footer: {
      sections: {
        product: 'Product',
        company: 'Company',
        support: 'Support',
      },
      links: {
        pricing: 'Pricing',
        community: 'Community',
        apiDocumentation: 'API Documentation',
        aboutUs: 'About Us',
        blog: 'Blog',
        careers: 'Careers',
        helpCenter: 'Help Center',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        status: 'Status',
      },
      description: 'Join a medieval-inspired community where goals become quests, progress is celebrated, and mutual support leads to extraordinary achievements.',
      madeWith: 'Made with',
      forAdventurers: 'for adventurers worldwide',
      newsletter: {
        title: 'Join the Guild Newsletter',
        subtitle: 'Get weekly updates on community achievements and new features.',
        placeholder: 'Enter your email',
        button: 'Subscribe',
        submitting: 'Subscribing...',
        subscribed: 'Subscribed!',
        success: 'Thank you for subscribing!',
        error: 'Something went wrong. Please try again later.',
        emailLabel: 'Email address',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
        redirecting: 'Redirecting to Substack...',
      },
      copyright: '© 2024 GoalGuild. All rights reserved. Built with AWS serverless architecture.',
    },
  },
  es: {
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    success: '¡Éxito!',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    deleting: 'Eliminando...',
    edit: 'Editar',
    editing: 'Editando...',
    view: 'Ver',
    close: 'Cerrar',
    back: 'Atrás',
    ascending: 'Ascendente',
    descending: 'Descendente',
    optional: '(opcional)',
    characters: 'caracteres',
    resourceTypes: {
      goal: 'meta',
      quest: 'misión',
      task: 'tarea',
    },
    breadcrumb: {
      dashboard: 'Tablero',
      quests: 'Misiones',
      quest: 'Misión',
      create: 'Crear',
      edit: 'Editar',
      view: 'Ver',
      profile: 'Perfil',
      editProfile: 'Editar Perfil',
      goals: 'Objetivos',
      goalsList: 'Lista de Objetivos',
      createGoal: 'Crear Objetivo',
      editGoal: 'Editar Objetivo',
      goalDetails: 'Detalles del Objetivo',
      changePassword: 'Cambiar Contraseña',
      guilds: 'Gremios',
      chat: 'Chat',
      subscription: 'Suscripción',
      page: 'Página',
    },
    footer: {
      sections: {
        product: 'Producto',
        company: 'Empresa',
        support: 'Soporte',
      },
      links: {
        pricing: 'Precios',
        community: 'Comunidad',
        apiDocumentation: 'Documentación API',
        aboutUs: 'Sobre nosotros',
        blog: 'Blog',
        careers: 'Carreras',
        helpCenter: 'Centro de ayuda',
        privacyPolicy: 'Política de privacidad',
        termsOfService: 'Términos de servicio',
        status: 'Estado',
      },
      description: 'Únete a una comunidad inspirada en lo medieval donde las metas se convierten en misiones, el progreso se celebra y el apoyo mutuo lleva a logros extraordinarios.',
      madeWith: 'Hecho con',
      forAdventurers: 'para aventureros de todo el mundo',
      newsletter: {
        title: 'Únete al boletín del Gremio',
        subtitle: 'Recibe actualizaciones semanales sobre logros comunitarios y nuevas funciones.',
        placeholder: 'Ingresa tu correo',
        button: 'Suscribirse',
        submitting: 'Suscribiendo...',
        subscribed: '¡Suscrito!',
        success: '¡Gracias por suscribirte!',
        error: 'Algo salió mal. Por favor intenta de nuevo más tarde.',
        emailLabel: 'Dirección de correo electrónico',
        emailRequired: 'El correo electrónico es obligatorio',
        emailInvalid: 'Por favor ingresa una dirección de correo electrónico válida',
        redirecting: 'Redirigiendo a Substack...',
      },
      copyright: '© 2024 GoalGuild. Todos los derechos reservados. Construido con arquitectura serverless de AWS.',
    },
  },
  fr: {
    loading: 'Chargement…',
    error: 'Une erreur est survenue',
    success: 'Succès !',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    cancel: 'Annuler',
    delete: 'Supprimer',
    deleting: 'Suppression...',
    edit: 'Modifier',
    editing: 'Modification...',
    view: 'Voir',
    close: 'Fermer',
    back: 'Retour',
    ascending: 'Croissant',
    descending: 'Décroissant',
    optional: '(optionnel)',
    characters: 'caractères',
    resourceTypes: {
      goal: 'objectif',
      quest: 'quête',
      task: 'tâche',
    },
    breadcrumb: {
      dashboard: 'Tableau de bord',
      quests: 'Quêtes',
      quest: 'Quête',
      create: 'Créer',
      edit: 'Modifier',
      view: 'Voir',
      profile: 'Profil',
      editProfile: 'Modifier le Profil',
      goals: 'Objectifs',
      goalsList: 'Liste des Objectifs',
      createGoal: 'Créer un Objectif',
      editGoal: 'Modifier l\'Objectif',
      goalDetails: 'Détails de l\'Objectif',
      changePassword: 'Changer le Mot de Passe',
      guilds: 'Guildes',
      chat: 'Chat',
      subscription: 'Abonnement',
      page: 'Page',
    },
    footer: {
      sections: {
        product: 'Produit',
        company: 'Entreprise',
        support: 'Support',
      },
      links: {
        pricing: 'Tarifs',
        community: 'Communauté',
        apiDocumentation: 'Documentation API',
        aboutUs: 'À propos',
        blog: 'Blog',
        careers: 'Carrières',
        helpCenter: 'Centre d\'aide',
        privacyPolicy: 'Politique de confidentialité',
        termsOfService: 'Conditions d\'utilisation',
        status: 'Statut',
      },
      description: 'Rejoignez une communauté inspirée du Moyen Âge où les objectifs deviennent des quêtes, le progrès est célébré et le soutien mutuel conduit à des réalisations extraordinaires.',
      madeWith: 'Fait avec',
      forAdventurers: 'pour les aventuriers du monde entier',
      newsletter: {
        title: 'Rejoignez la newsletter de la Guilde',
        subtitle: 'Recevez des mises à jour hebdomadaires sur les réalisations communautaires et les nouvelles fonctionnalités.',
        placeholder: 'Entrez votre email',
        button: 'S\'abonner',
        submitting: 'Abonnement...',
        subscribed: 'Abonné!',
        success: 'Merci de vous être abonné!',
        error: 'Quelque chose s\'est mal passé. Veuillez réessayer plus tard.',
        emailLabel: 'Adresse e-mail',
        emailRequired: 'L\'e-mail est requis',
        emailInvalid: 'Veuillez entrer une adresse e-mail valide',
        redirecting: 'Redirection vers Substack...',
      },
      copyright: '© 2024 GoalGuild. Tous droits réservés. Construit avec l\'architecture serverless AWS.',
    },
  },
};
