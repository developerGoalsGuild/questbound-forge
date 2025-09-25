export type Language = 'en' | 'es' | 'fr';

export interface SignupTranslations {
  local: {
    title: string;
    email: string;
    fullName: string;
    birthDate: string;
    nickname: string;
    pronouns: string;
    bio: string;
    country: string;
    gender: string;
    selectPronouns: string;
    selectCountry: string;
    password: string;
    confirmPassword: string;
    submit: string;
    successMessage: string;
    successConfirmMessage: string;
    errorMessage: string;
    options: {
      pronouns: {
        sheHer: string;
        heHim: string;
        theyThem: string;
        sheThey: string;
        heThey: string;
      };
      genders: {
        female: string;
        male: string;
        nonBinary: string;
        transgender: string;
      };
      common: {
        other: string;
        preferNot: string;
      };
    };
    validation: {
      required: string;
      invalidEmail: string;
      passwordMismatch: string;
      passwordMinLength: string;
      invalidDate: string;
      birthDateTooRecent: string;
      bioMaxLength: string;
      invalidCountry: string;
      emailTaken: string;
      emailAvailable: string;
      nicknameAvailable: string;
      nicknameTaken: string;
      passwordLower: string;
      passwordUpper: string;
      passwordDigit: string;
      passwordSpecial: string;
    };
  };
}

export const signupTranslations: Record<Language, SignupTranslations> = {
  en: {
    local: {
      title: 'User Sign-Up',
      email: 'Email Address',
      fullName: 'Full Name',
      birthDate: 'Date of Birth',
      nickname: 'Nickname',
      pronouns: 'Pronouns',
      bio: 'Bio',
      country: 'Country',
      gender: 'Gender',
      selectPronouns: 'Select pronouns',
      selectCountry: 'Select your country',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      submit: 'Create Account',
      successMessage: 'Account created!',
      successConfirmMessage: 'Account created! Please check your email to confirm your address.',
      errorMessage: 'Failed to create account. Please try again.',
      options: {
        pronouns: {
          sheHer: 'She/Her',
          heHim: 'He/Him',
          theyThem: 'They/Them',
          sheThey: 'She/They',
          heThey: 'He/They',
        },
        genders: {
          female: 'Female',
          male: 'Male',
          nonBinary: 'Non-binary',
          transgender: 'Transgender',
        },
        common: {
          other: 'Other',
          preferNot: 'Prefer not to say',
        },
      },
      validation: {
        required: 'This field is required',
        invalidEmail: 'Please enter a valid email address',
        passwordMismatch: 'Passwords do not match',
        passwordMinLength: 'Password must be at least 8 characters',
        invalidDate: 'Please enter a valid date (YYYY-MM-DD)',
        birthDateTooRecent: 'Birth date cannot be later than today minus 1 year',
        bioMaxLength: 'Bio must be 200 characters or fewer',
        invalidCountry: 'Please choose a country from the list',
        emailTaken: 'This email is already in use',
        emailAvailable: 'Available',
        nicknameAvailable: 'Available',
        nicknameTaken: 'This nickname is already in use',
        passwordLower: 'Must include a lowercase letter',
        passwordUpper: 'Must include an uppercase letter',
        passwordDigit: 'Must include a digit',
        passwordSpecial: 'Must include a special character',
      },
    },
  },
  es: {
    local: {
      title: 'Registro de usuario',
      email: 'Correo electrónico',
      fullName: 'Nombre completo',
      birthDate: 'Fecha de nacimiento',
      nickname: 'Apodo',
      pronouns: 'Pronombres',
      bio: 'Bio',
      country: 'País',
      gender: 'Género',
      selectPronouns: 'Selecciona tus pronombres',
      selectCountry: 'Selecciona tu país',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      submit: 'Crear cuenta',
      successMessage: '¡Cuenta creada!',
      successConfirmMessage: '¡Cuenta creada! Revisa tu correo para confirmar tu dirección.',
      errorMessage: 'Error al crear la cuenta. Inténtalo de nuevo.',
      options: {
        pronouns: {
          sheHer: 'Ella',
          heHim: 'Él',
          theyThem: 'Elle',
          sheThey: 'Ella/Elle',
          heThey: 'Él/Elle',
        },
        genders: {
          female: 'Femenino',
          male: 'Masculino',
          nonBinary: 'No binario',
          transgender: 'Transgénero',
        },
        common: {
          other: 'Otro',
          preferNot: 'Prefiero no decir',
        },
      },
      validation: {
        required: 'Este campo es obligatorio',
        invalidEmail: 'Introduce un correo válido',
        passwordMismatch: 'Las contraseñas no coinciden',
        passwordMinLength: 'Mínimo 8 caracteres',
        invalidDate: 'Introduce una fecha válida (AAAA-MM-DD)',
        birthDateTooRecent: 'No puede ser mayor que hoy - 1 año',
        bioMaxLength: 'Máximo 200 caracteres',
        invalidCountry: 'Elige un país de la lista',
        emailTaken: 'Este correo ya está en uso',
        emailAvailable: 'Disponible',
        nicknameAvailable: 'Disponible',
        nicknameTaken: 'Este apodo ya está en uso',
        passwordLower: 'Debe incluir una minúscula',
        passwordUpper: 'Debe incluir una mayúscula',
        passwordDigit: 'Debe incluir un dígito',
        passwordSpecial: 'Debe incluir un carácter especial',
      },
    },
  },
  fr: {
    local: {
      title: 'Inscription locale',
      email: 'Adresse e-mail',
      fullName: 'Nom complet',
      birthDate: 'Date de naissance',
      nickname: 'Pseudo',
      pronouns: 'Pronoms',
      bio: 'Bio',
      country: 'Pays',
      gender: 'Genre',
      selectPronouns: 'Sélectionnez vos pronoms',
      selectCountry: 'Sélectionnez votre pays',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      submit: 'Créer un compte',
      successMessage: 'Compte créé !',
      successConfirmMessage: 'Compte créé ! Vérifiez votre e-mail pour confirmer.',
      errorMessage: 'Échec de la création du compte. Veuillez réessayer.',
      options: {
        pronouns: {
          sheHer: 'Elle',
          heHim: 'Il/Lui',
          theyThem: 'Iel',
          sheThey: 'Elle/Iel',
          heThey: 'Il/Iel',
        },
        genders: {
          female: 'Femme',
          male: 'Homme',
          nonBinary: 'Non-binaire',
          transgender: 'Transgenre',
        },
        common: {
          other: 'Autre',
          preferNot: 'Préférer ne pas répondre',
        },
      },
      validation: {
        required: 'Ce champ est requis',
        invalidEmail: 'Adresse e-mail invalide',
        passwordMismatch: 'Les mots de passe ne correspondent pas',
        passwordMinLength: 'Minimum 8 caractères',
        invalidDate: 'Date invalide (AAAA-MM-JJ)',
        birthDateTooRecent: "Ne peut pas être postérieure à (aujourd'hui - 1 an)",
        bioMaxLength: 'La biographie doit comporter 200 caractères ou moins',
        invalidCountry: 'Choisissez un pays dans la liste',
        emailTaken: 'Cet e-mail est déjà utilisé',
        emailAvailable: 'Disponible',
        nicknameAvailable: 'Disponible',
        nicknameTaken: 'Ce pseudo est déjà utilisé',
        passwordLower: 'Doit inclure une minuscule',
        passwordUpper: 'Doit inclure une majuscule',
        passwordDigit: 'Doit inclure un chiffre',
        passwordSpecial: 'Doit inclure un caractère spécial',
      },
    },
  },
};
