export type Language = 'en' | 'es' | 'fr';

export interface ProfileTranslations {
  title: string;
  subtitle: string;
  edit: {
    tabs: {
      basic: string;
      notifications: string;
      subscription: string;
    };
    formFixErrors: string;
    addTagPlaceholder: string;
    tagsHelp: string;
    removeTagAria: string;
    languages: { en: string; es: string; fr: string };
    loadError: string;
    validation: {
      tagFormat: string;
      tagDuplicate: string;
    };
  };
  view: {
    editProfile: string;
    basicInformation: string;
    email: string;
    nickname: string;
    birthDate: string;
    language: string;
    locationIdentity: string;
    country: string;
    gender: string;
    pronouns: string;
    provider: string;
    about: string;
    bio: string;
    tags: string;
    accountInformation: string;
    tier: string;
    memberSince: string;
    lastUpdated: string;
    backToDashboard: string;
    profileNotFound: string;
    tryAgain: string;
    statusVerified: string;
    statusEmailNotVerified: string;
    adventurer: string;
    roles: { user: string; partner: string; patron: string };
    languages: { en: string; es: string; fr: string };
    tabs?: { basic: string; notifications: string; subscription: string };
    enabled?: string;
    disabled?: string;
    noNotificationPreferences?: string;
  };
  basicInfo: {
    title: string;
    fullName: { label: string; placeholder: string };
    nickname: { label: string; placeholder: string; help: string };
    birthDate: { label: string; placeholder: string };
  };
  location: {
    title: string;
    country: { label: string; placeholder: string };
    language: { label: string };
  };
  identity: {
    title: string;
    gender: { label: string; placeholder: string };
    pronouns: { label: string; placeholder: string };
  };
  about: {
    title: string;
    bio: { label: string; placeholder: string; help: string };
    tags: { label: string; placeholder: string; help: string };
  };
  actions: {
    save: string;
    cancel: string;
    reset: string;
    goToSignUp: string;
  };
  validation: {
    required: string;
    nicknameTaken: string;
    invalidFormat: string;
    tooLong: string;
  };
  messages: {
    saveSuccess: string;
    saveError: string;
    loading: string;
    profileNotFound: string;
  };
}

export const profileTranslations: Record<Language, ProfileTranslations> = {
  en: {
    title: 'Edit Profile',
    subtitle: 'Update your personal information',
    edit: {
      tabs: {
        basic: 'Basic Info',
        notifications: 'Notifications',
        subscription: 'Subscription',
      },
      formFixErrors: 'Please fix the form errors before saving',
      addTagPlaceholder: 'Add tag and press Enter',
      tagsHelp: 'Type a tag and press Enter to add it. Up to 10 tags allowed.',
      removeTagAria: 'Remove tag',
      languages: { en: 'English', es: 'Spanish', fr: 'French' },
      loadError: 'Failed to load profile',
      validation: {
        tagFormat: 'Tags can only contain letters, numbers, hyphens, and underscores',
        tagDuplicate: 'Duplicate tags are not allowed',
      },
    },
    view: {
      editProfile: 'Edit Profile',
      basicInformation: 'Basic Information',
      email: 'Email',
      nickname: 'Nickname',
      birthDate: 'Birth Date',
      language: 'Language',
      locationIdentity: 'Location & Identity',
      country: 'Country',
      gender: 'Gender',
      pronouns: 'Pronouns',
      provider: 'Provider',
      about: 'About',
      bio: 'Bio',
      tags: 'Tags',
      accountInformation: 'Account Information',
      tier: 'Tier',
      memberSince: 'Member Since',
      lastUpdated: 'Last Updated',
      backToDashboard: 'Back to Dashboard',
      profileNotFound: 'Profile not found. Please try refreshing the page.',
      tryAgain: 'Try Again',
      statusVerified: 'Verified',
      statusEmailNotVerified: 'Email Not Verified',
      adventurer: 'Adventurer',
      roles: { user: 'User', partner: 'Partner', patron: 'Patron' },
      languages: { en: 'English', es: 'Spanish', fr: 'French' },
      tabs: { basic: 'Basic Info', notifications: 'Notifications', subscription: 'Subscription' },
      enabled: 'Enabled',
      disabled: 'Disabled',
      noNotificationPreferences: 'No notification preferences set. Edit your profile to configure notifications.',
    },
    basicInfo: {
      title: 'Basic Information',
      fullName: { label: 'Full name', placeholder: 'Your full name' },
      nickname: { label: 'Nickname', placeholder: 'Unique handle', help: 'Must be unique. Letters, numbers, underscore.' },
      birthDate: { label: 'Birth date', placeholder: 'YYYY-MM-DD' },
    },
    location: {
      title: 'Location & Language',
      country: { label: 'Country', placeholder: 'Select a country' },
      language: { label: 'Language' },
    },
    identity: {
      title: 'Identity',
      gender: { label: 'Gender', placeholder: 'Optional' },
      pronouns: { label: 'Pronouns', placeholder: 'Optional' },
    },
    about: {
      title: 'About',
      bio: { label: 'Bio', placeholder: 'Tell us about yourself', help: 'Max 500 characters' },
      tags: { label: 'Tags', placeholder: 'Comma-separated (e.g., fitness, coding)', help: 'Up to 10 tags' },
    },
    actions: { save: 'Save', cancel: 'Cancel', reset: 'Reset', goToSignUp: 'Go to Sign Up' },
    validation: {
      required: 'This field is required',
      nicknameTaken: 'This nickname is already taken',
      invalidFormat: 'Invalid format',
      tooLong: 'Too long',
    },
    messages: {
      saveSuccess: 'Profile updated successfully',
      saveError: 'Failed to update profile',
      loading: 'Loading profile...',
      profileNotFound: 'No profile found. Please sign up first to create your profile.'
    },
  },
  es: {
    title: 'Editar perfil',
    subtitle: 'Actualiza tu información personal',
    edit: {
      tabs: {
        basic: 'Información básica',
        notifications: 'Notificaciones',
        subscription: 'Suscripción',
      },
      formFixErrors: 'Por favor corrige los errores antes de guardar',
      addTagPlaceholder: 'Agrega una etiqueta y presiona Enter',
      tagsHelp: 'Escribe una etiqueta y presiona Enter para agregarla. Máximo 10 etiquetas.',
      removeTagAria: 'Eliminar etiqueta',
      languages: { en: 'Inglés', es: 'Español', fr: 'Francés' },
      loadError: 'No se pudo cargar el perfil',
      validation: {
        tagFormat: 'Las etiquetas solo pueden contener letras, números, guiones y guiones bajos',
        tagDuplicate: 'No se permiten etiquetas duplicadas',
      },
    },
    view: {
      editProfile: 'Editar perfil',
      basicInformation: 'Información básica',
      email: 'Correo electrónico',
      nickname: 'Apodo',
      birthDate: 'Fecha de nacimiento',
      language: 'Idioma',
      locationIdentity: 'Ubicación e identidad',
      country: 'País',
      gender: 'Género',
      pronouns: 'Pronombres',
      provider: 'Proveedor',
      about: 'Acerca de ti',
      bio: 'Biografía',
      tags: 'Etiquetas',
      accountInformation: 'Información de la cuenta',
      tier: 'Nivel',
      memberSince: 'Miembro desde',
      lastUpdated: 'Última actualización',
      backToDashboard: 'Volver al panel',
      profileNotFound: 'No se encontró el perfil. Por favor recarga la página.',
      tryAgain: 'Reintentar',
      statusVerified: 'Verificado',
      statusEmailNotVerified: 'Correo no verificado',
      adventurer: 'Aventurero',
      roles: { user: 'Usuario', partner: 'Socio', patron: 'Patrón' },
      languages: { en: 'Inglés', es: 'Español', fr: 'Francés' },
      tabs: { basic: 'Información básica', notifications: 'Notificaciones', subscription: 'Suscripción' },
      enabled: 'Habilitado',
      disabled: 'Deshabilitado',
      noNotificationPreferences: 'No se han configurado preferencias de notificación. Edita tu perfil para configurar las notificaciones.',
    },
    basicInfo: {
      title: 'Información básica',
      fullName: { label: 'Nombre completo', placeholder: 'Tu nombre completo' },
      nickname: { label: 'Apodo', placeholder: 'Nombre único', help: 'Debe ser único. Letras, números, guion bajo.' },
      birthDate: { label: 'Fecha de nacimiento', placeholder: 'AAAA-MM-DD' },
    },
    location: {
      title: 'Ubicación e idioma',
      country: { label: 'País', placeholder: 'Selecciona un país' },
      language: { label: 'Idioma' },
    },
    identity: {
      title: 'Identidad',
      gender: { label: 'Género', placeholder: 'Opcional' },
      pronouns: { label: 'Pronombres', placeholder: 'Opcional' },
    },
    about: {
      title: 'Acerca de ti',
      bio: { label: 'Biografía', placeholder: 'Cuéntanos sobre ti', help: 'Máximo 500 caracteres' },
      tags: { label: 'Etiquetas', placeholder: 'Separadas por comas', help: 'Hasta 10 etiquetas' },
    },
    actions: { save: 'Guardar', cancel: 'Cancelar', reset: 'Restablecer', goToSignUp: 'Ir a Registro' },
    validation: {
      required: 'Este campo es obligatorio',
      nicknameTaken: 'Este apodo ya está en uso',
      invalidFormat: 'Formato inválido',
      tooLong: 'Demasiado largo',
    },
    messages: {
      saveSuccess: 'Perfil actualizado correctamente',
      saveError: 'No se pudo actualizar el perfil',
      loading: 'Cargando perfil...',
      profileNotFound: 'No se encontró perfil. Por favor regístrate primero para crear tu perfil.'
    },
  },
  fr: {
    title: 'Modifier le profil',
    subtitle: 'Mettez à jour vos informations personnelles',
    edit: {
      tabs: {
        basic: 'Informations de base',
        notifications: 'Notifications',
        subscription: 'Abonnement',
      },
      formFixErrors: 'Veuillez corriger les erreurs avant d’enregistrer',
      addTagPlaceholder: 'Ajoutez un tag et appuyez sur Entrée',
      tagsHelp: 'Saisissez un tag et appuyez sur Entrée pour l’ajouter. Jusqu’à 10 tags.',
      removeTagAria: 'Supprimer le tag',
      languages: { en: 'Anglais', es: 'Espagnol', fr: 'Français' },
      loadError: 'Échec du chargement du profil',
      validation: {
        tagFormat: 'Les tags ne peuvent contenir que des lettres, chiffres, tirets et underscores',
        tagDuplicate: 'Les tags en double ne sont pas autorisés',
      },
    },
    view: {
      editProfile: 'Modifier le profil',
      basicInformation: 'Informations de base',
      email: 'E-mail',
      nickname: 'Surnom',
      birthDate: 'Date de naissance',
      language: 'Langue',
      locationIdentity: 'Lieu et identité',
      country: 'Pays',
      gender: 'Genre',
      pronouns: 'Pronoms',
      provider: 'Fournisseur',
      about: 'À propos',
      bio: 'Bio',
      tags: 'Tags',
      accountInformation: 'Informations du compte',
      tier: 'Niveau',
      memberSince: 'Membre depuis',
      lastUpdated: 'Dernière mise à jour',
      backToDashboard: 'Retour au tableau de bord',
      profileNotFound: 'Profil introuvable. Veuillez actualiser la page.',
      tryAgain: 'Réessayer',
      statusVerified: 'Vérifié',
      statusEmailNotVerified: 'E-mail non vérifié',
      adventurer: 'Aventurier',
      roles: { user: 'Utilisateur', partner: 'Partenaire', patron: 'Mécène' },
      languages: { en: 'Anglais', es: 'Espagnol', fr: 'Français' },
      tabs: { basic: 'Informations de base', notifications: 'Notifications', subscription: 'Abonnement' },
      enabled: 'Activé',
      disabled: 'Désactivé',
      noNotificationPreferences: 'Aucune préférence de notification définie. Modifiez votre profil pour configurer les notifications.',
    },
    basicInfo: {
      title: 'Informations de base',
      fullName: { label: 'Nom complet', placeholder: 'Votre nom complet' },
      nickname: { label: 'Surnom', placeholder: 'Identifiant unique', help: 'Doit être unique. Lettres, chiffres, souligné.' },
      birthDate: { label: 'Date de naissance', placeholder: 'AAAA-MM-JJ' },
    },
    location: {
      title: 'Lieu et langue',
      country: { label: 'Pays', placeholder: 'Sélectionnez un pays' },
      language: { label: 'Langue' },
    },
    identity: {
      title: 'Identité',
      gender: { label: 'Genre', placeholder: 'Optionnel' },
      pronouns: { label: 'Pronoms', placeholder: 'Optionnel' },
    },
    about: {
      title: 'À propos',
      bio: { label: 'Bio', placeholder: 'Parlez-nous de vous', help: '500 caractères max' },
      tags: { label: 'Tags', placeholder: 'Séparés par des virgules', help: 'Jusqu’à 10 tags' },
    },
    actions: { save: 'Enregistrer', cancel: 'Annuler', reset: 'Réinitialiser', goToSignUp: 'Aller à l\'Inscription' },
    validation: {
      required: 'Ce champ est requis',
      nicknameTaken: 'Ce surnom est déjà pris',
      invalidFormat: 'Format invalide',
      tooLong: 'Trop long',
    },
    messages: {
      saveSuccess: 'Profil mis à jour avec succès',
      saveError: 'Échec de la mise à jour du profil',
      loading: 'Chargement du profil...',
      profileNotFound: 'Aucun profil trouvé. Veuillez vous inscrire d\'abord pour créer votre profil.'
    },
  },
};


