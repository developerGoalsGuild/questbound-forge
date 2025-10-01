export type Language = 'en' | 'es' | 'fr';

export interface ProfileTranslations {
  title: string;
  subtitle: string;
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


