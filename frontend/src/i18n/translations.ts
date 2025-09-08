// Project translations
export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  nav: {
    home: string; features: string; community: string; pricing: string; contact: string;
    login: string; signup: string; dashboard: string; logout: string;
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
      login: 'Sign In', signup: 'Join Guild', dashboard: 'Dashboard', logout: 'Sign Out',
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
    signup: {
      title: 'User Sign-Up',
      email: 'Email Address', fullName: 'Full Name', birthDate: 'Date of Birth',
      nickname: 'Nickname', pronouns: 'Pronouns', bio: 'Bio', country: 'Country', gender: 'Gender',
      selectCountry: 'Select your country', password: 'Password', confirmPassword: 'Confirm Password',
      submit: 'Create Account',
      successMessage: 'Account created! Please check your email to confirm your address.',
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
      },
    },
    common: { loading: 'Loading...', error: 'An error occurred', success: 'Success!', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', view: 'View', close: 'Close' },
  },
  es: {
    nav: {
      home: 'Inicio', features: 'Características', community: 'Comunidad', pricing: 'Precios', contact: 'Contacto',
      login: 'Iniciar Sesión', signup: 'Unirse al Gremio', dashboard: 'Panel', logout: 'Cerrar Sesión',
    },
    hero: {
      title: 'Únete en Propósito, Logra Juntos',
      subtitle: 'Una comunidad inspirada en lo medieval donde las metas se vuelven misiones.',
      ctaPrimary: 'Comienza tu Misión', ctaSecondary: 'Explorar Características',
    },
    features: {
      title: 'Características del Gremio', subtitle: 'Herramientas para lograr grandeza juntos.',
      goalTracking: { title: 'Gestión de Misiones', description: 'Establece, rastrea y logra metas.' },
      community: { title: 'Comunidad del Gremio', description: 'Conecta, comparte y apoya.' },
      gamification: { title: 'Honor y Logros', description: 'Gana insignias y celebra hitos.' },
      patronage: { title: 'Patrocinio Noble', description: 'Apoya y desbloquea beneficios.' },
    },
    dashboard: {
      user: { title: 'Salón del Aventurero', welcome: '¡Bienvenido!', goals: 'Misiones Activas', progress: 'Resumen', community: 'Actividades del Gremio', achievements: 'Honores Ganados' },
      partner: { title: 'Cuartos del Mercader', services: 'Tus Servicios', analytics: 'Análisis de Negocio', engagement: 'Participación de Usuarios', revenue: 'Ingresos' },
      patron: { title: 'Corte del Noble', contributions: 'Tu Patrocinio', impact: 'Impacto en la Comunidad', benefits: 'Beneficios Exclusivos', community: 'Comunidad de Patrones' },
    },
    signup: {
      local: {
        title: 'Registro de Usuario Local',
        email: 'Correo Electrónico', fullName: 'Nombre Completo', birthDate: 'Fecha de Nacimiento',
        nickname: 'Apodo', pronouns: 'Pronombres', bio: 'Biografía', country: 'País', gender: 'Género',
        selectCountry: 'Selecciona tu país', password: 'Contraseña', confirmPassword: 'Confirmar Contraseña',
        submit: 'Crear Cuenta',
        successMessage: '¡Cuenta creada! Revisa tu correo para confirmar tu dirección.',
        errorMessage: 'Error al crear la cuenta. Inténtalo de nuevo.',
        options: {
          pronouns: { sheHer: 'Ella', heHim: 'Él', theyThem: 'Elle', sheThey: 'Ella/Elle', heThey: 'Él/Elle' },
          genders: { female: 'Mujer', male: 'Hombre', nonBinary: 'No binario', transgender: 'Transgénero' },
          common: { other: 'Otro', preferNot: 'Prefiero no decir' },
        },
        validation: {
          required: 'Este campo es obligatorio', invalidEmail: 'Introduce un correo válido',
          passwordMismatch: 'Las contraseñas no coinciden', passwordMinLength: 'Mínimo 8 caracteres',
          invalidDate: 'Fecha inválida (AAAA-MM-DD)', birthDateTooRecent: 'No puede ser posterior a hoy menos 1 año',
          bioMaxLength: 'Máximo 200 caracteres', invalidCountry: 'Elige un país de la lista',
          emailTaken: 'Este correo ya está en uso', emailAvailable: 'Disponible', nicknameAvailable: 'Disponible', nicknameTaken: 'Este apodo ya está en uso',
        },
      },
    },
    common: { loading: 'Cargando...', error: 'Ocurrió un error', success: '¡Éxito!', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', view: 'Ver', close: 'Cerrar' },
  },
  fr: {
    nav: {
      home: 'Accueil', features: 'Fonctionnalités', community: 'Communauté', pricing: 'Tarifs', contact: 'Contact',
      login: 'Se connecter', signup: 'Rejoindre la Guilde', dashboard: 'Tableau de bord', logout: 'Se déconnecter',
    },
    hero: {
      title: 'Unis dans le but, réussissez ensemble',
      subtitle: 'Une communauté d’inspiration médiévale où les objectifs deviennent des quêtes.',
      ctaPrimary: 'Commencer la quête', ctaSecondary: 'Découvrir',
    },
    features: {
      title: 'Fonctionnalités de la Guilde', subtitle: 'Des outils puissants pour réussir ensemble.',
      goalTracking: { title: 'Gestion des Quêtes', description: 'Définir, suivre, atteindre.' },
      community: { title: 'Communauté de la Guilde', description: 'Se connecter, partager, soutenir.' },
      gamification: { title: 'Honneurs & Succès', description: 'Gagner des badges et célébrer.' },
      patronage: { title: 'Mécénat', description: 'Soutenir et débloquer des avantages.' },
    },
    dashboard: {
      user: { title: "Salle de l’Aventurier", welcome: 'Bon retour !', goals: 'Quêtes actives', progress: 'Aperçu', community: 'Activités de la Guilde', achievements: 'Honneurs' },
      partner: { title: 'Quartiers du Marchand', services: 'Vos services', analytics: 'Analyses', engagement: 'Engagement', revenue: 'Revenus' },
      patron: { title: 'Cour du Noble', contributions: 'Votre mécénat', impact: 'Impact communautaire', benefits: 'Avantages exclusifs', community: 'Communauté des mécènes' },
    },
    signup: {
      local: {
        title: 'Inscription locale',
        email: 'Adresse e-mail', fullName: 'Nom complet', birthDate: 'Date de naissance',
        nickname: 'Pseudo', pronouns: 'Pronoms', bio: 'Bio', country: 'Pays', gender: 'Genre',
        selectCountry: 'Sélectionnez votre pays', password: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe',
        submit: 'Créer un compte',
        successMessage: 'Compte créé ! Vérifiez votre e-mail pour confirmer votre adresse.',
        errorMessage: "Échec de la création du compte. Veuillez réessayer.",
        options: {
          pronouns: { sheHer: 'Elle', heHim: 'Il/Lui', theyThem: 'Iel', sheThey: 'Elle/Iel', heThey: 'Il/Iel' },
          genders: { female: 'Femme', male: 'Homme', nonBinary: 'Non-binaire', transgender: 'Transgenre' },
          common: { other: 'Autre', preferNot: 'Préférer ne pas répondre' },
        },
        validation: {
          required: 'Ce champ est requis', invalidEmail: 'Adresse e-mail invalide',
          passwordMismatch: 'Les mots de passe ne correspondent pas', passwordMinLength: 'Minimum 8 caractères',
          invalidDate: 'Date invalide (AAAA-MM-JJ)', birthDateTooRecent: 'Ne peut pas être postérieure à (aujourd’hui - 1 an)',
          bioMaxLength: 'Bio = 200 caractères', invalidCountry: 'Choisissez un pays dans la liste',
          emailTaken: 'Cet e-mail est déjà utilisé', emailAvailable: 'Disponible', nicknameAvailable: 'Disponible', nicknameTaken: 'Ce pseudo est déjà utilisé',
        },
      },
    },
    common: { loading: 'Chargement…', error: 'Une erreur est survenue', success: 'Succès !', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', view: 'Voir', close: 'Fermer' },
  },
};