export type Language = 'en' | 'es' | 'fr';

export interface LoginTranslations {
  title: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  forgotPassword: string;
  orContinueWith: string;
  messages: { loginFailed: string };
  validation: {
    requiredEmail: string;
    invalidEmail: string;
    requiredPassword: string;
  };
}

export const loginTranslations: Record<Language, LoginTranslations> = {
  en: {
    title: 'Sign In',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '********',
    submit: 'Sign In',
    forgotPassword: 'Forgot password?',
    orContinueWith: 'or continue with',
    messages: { loginFailed: 'Login failed' },
    validation: {
      requiredEmail: 'Email is required',
      invalidEmail: 'Please enter a valid email address',
      requiredPassword: 'Password is required',
    },
  },
  es: {
    title: 'Iniciar sesión',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@ejemplo.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: '********',
    submit: 'Iniciar sesión',
    forgotPassword: '¿Olvidaste tu contraseña?',
    orContinueWith: 'o continuar con',
    messages: { loginFailed: 'Error al iniciar sesión' },
    validation: {
      requiredEmail: 'El correo electrónico es obligatorio',
      invalidEmail: 'Introduce un correo válido',
      requiredPassword: 'La contraseña es obligatoria',
    },
  },
  fr: {
    title: 'Se connecter',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'vous@exemple.com',
    passwordLabel: 'Mot de passe',
    passwordPlaceholder: '********',
    submit: 'Se connecter',
    forgotPassword: 'Mot de passe oublié ?',
    orContinueWith: 'ou continuer avec',
    messages: { loginFailed: 'Échec de la connexion' },
    validation: {
      requiredEmail: "L'e-mail est requis",
      invalidEmail: 'Veuillez saisir une adresse e-mail valide',
      requiredPassword: 'Mot de passe requis',
    },
  },
};
