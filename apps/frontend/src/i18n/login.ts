export type Language = 'en' | 'es' | 'fr';

export interface LoginTranslations {
  title: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  forgotPassword: string;
  forgotPasswordTitle: string;
  forgotPasswordDescription: string;
  resetPasswordTitle: string;
  resetPasswordDescription: string;
  emailNotConfirmed: string;
  resetLinkSent: string;
  passwordResetSuccess: string;
  invalidResetToken: string;
  expiredResetToken: string;
  submitResetRequest: string;
  submitReset: string;
  backToLogin: string;
  goToLogin: string;
  requestNewReset: string;
  orContinueWith: string;
  createAccount: string;
  confirmEmailTitle: string;
  confirmingEmail: string;
  emailConfirmed: string;
  redirectingToLogin: string;
  invalidToken: string;
  signUp: string;
  resendEmailLabel: string;
  resendEmailPlaceholder: string;
  resendConfirmation: string;
  resendHelp: string;
  resendSuccess: string;
  resendFailed: string;
  messages: { 
    loginFailed: string;
    invalidCredentials: string;
    emailNotConfirmed: string;
    accountLocked: string;
    passwordChangeRequired: string;
    unableToProcess: string;
    resetRequestFailed?: string;
    resetFailed?: string;
    invalidToken?: string;
    emailConfirmed?: string;
  };
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
    forgotPasswordTitle: 'Forgot Password',
    forgotPasswordDescription: 'Enter your email address and we\'ll send you a link to reset your password.',
    resetPasswordTitle: 'Reset Password',
    resetPasswordDescription: 'Enter your new password below.',
    emailNotConfirmed: 'Email not confirmed. Please confirm your email before requesting a password reset.',
    resetLinkSent: 'If the account exists and email is confirmed, a reset link will be sent.',
    passwordResetSuccess: 'Password reset successfully. Please log in with your new password.',
    invalidResetToken: 'Invalid or missing reset token',
    expiredResetToken: 'Reset token has expired. Please request a new password reset.',
    submitResetRequest: 'Send Reset Link',
    submitReset: 'Reset Password',
    backToLogin: 'Back to login',
    goToLogin: 'Go to login',
    requestNewReset: 'Request a new password reset',
    orContinueWith: 'or continue with',
    createAccount: 'Create account',
    confirmEmailTitle: 'Confirm Your Email',
    confirmingEmail: 'Confirming your email address...',
    emailConfirmed: 'Email confirmed successfully! You can now log in.',
    redirectingToLogin: 'Redirecting to login page...',
    invalidToken: 'Invalid confirmation link. Please check your email and try again.',
    signUp: 'Sign up',
    resendEmailLabel: 'Email Address',
    resendEmailPlaceholder: 'you@example.com',
    resendConfirmation: 'Resend confirmation email',
    resendHelp: 'Didn\'t receive the email? Enter your address to resend the confirmation link.',
    resendSuccess: 'If the account exists, a confirmation email has been sent.',
    resendFailed: 'Failed to resend confirmation email. Please try again.',
    messages: { 
      loginFailed: 'Login failed',
      invalidCredentials: 'Invalid credentials',
      emailNotConfirmed: 'Email not confirmed. Please confirm your email before logging in.',
      accountLocked: 'Account temporarily locked due to failed attempts',
      passwordChangeRequired: 'Password change required',
      unableToProcess: 'Unable to process login',
      resetRequestFailed: 'Failed to request password reset',
      resetFailed: 'Failed to reset password',
      invalidToken: 'Invalid confirmation link. Please check your email and try again.',
      emailConfirmed: 'Email confirmed successfully! You can now log in.',
    },
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
    forgotPasswordTitle: 'Olvidé mi contraseña',
    forgotPasswordDescription: 'Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.',
    resetPasswordTitle: 'Restablecer contraseña',
    resetPasswordDescription: 'Ingresa tu nueva contraseña a continuación.',
    emailNotConfirmed: 'Correo electrónico no confirmado. Por favor confirma tu correo antes de solicitar un restablecimiento de contraseña.',
    resetLinkSent: 'Si la cuenta existe y el correo está confirmado, se enviará un enlace de restablecimiento.',
    passwordResetSuccess: 'Contraseña restablecida exitosamente. Por favor inicia sesión con tu nueva contraseña.',
    invalidResetToken: 'Token de restablecimiento inválido o faltante',
    expiredResetToken: 'El token de restablecimiento ha expirado. Por favor solicita un nuevo restablecimiento de contraseña.',
    submitResetRequest: 'Enviar enlace de restablecimiento',
    submitReset: 'Restablecer contraseña',
    backToLogin: 'Volver al inicio de sesión',
    goToLogin: 'Ir al inicio de sesión',
    requestNewReset: 'Solicitar un nuevo restablecimiento de contraseña',
    orContinueWith: 'o continuar con',
    createAccount: 'Crear cuenta',
    confirmEmailTitle: 'Confirma tu correo electrónico',
    confirmingEmail: 'Confirmando tu dirección de correo electrónico...',
    emailConfirmed: '¡Correo electrónico confirmado exitosamente! Ahora puedes iniciar sesión.',
    redirectingToLogin: 'Redirigiendo a la página de inicio de sesión...',
    invalidToken: 'Enlace de confirmación inválido. Por favor verifica tu correo e intenta nuevamente.',
    signUp: 'Registrarse',
    resendEmailLabel: 'Correo electrónico',
    resendEmailPlaceholder: 'tu@ejemplo.com',
    resendConfirmation: 'Reenviar correo de confirmación',
    resendHelp: '¿No recibiste el correo? Ingresa tu dirección para reenviar el enlace de confirmación.',
    resendSuccess: 'Si la cuenta existe, se ha enviado un correo de confirmación.',
    resendFailed: 'No se pudo reenviar el correo de confirmación. Intenta nuevamente.',
    messages: { 
      loginFailed: 'Error al iniciar sesión',
      invalidCredentials: 'Credenciales inválidas',
      emailNotConfirmed: 'Correo electrónico no confirmado. Por favor confirma tu correo antes de iniciar sesión.',
      accountLocked: 'Cuenta temporalmente bloqueada debido a intentos fallidos',
      passwordChangeRequired: 'Se requiere cambio de contraseña',
      unableToProcess: 'No se pudo procesar el inicio de sesión',
      resetRequestFailed: 'Error al solicitar restablecimiento de contraseña',
      resetFailed: 'Error al restablecer contraseña',
      invalidToken: 'Enlace de confirmación inválido. Por favor verifica tu correo e intenta nuevamente.',
      emailConfirmed: '¡Correo electrónico confirmado exitosamente! Ahora puedes iniciar sesión.',
    },
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
    forgotPasswordTitle: 'Mot de passe oublié',
    forgotPasswordDescription: 'Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
    resetPasswordTitle: 'Réinitialiser le mot de passe',
    resetPasswordDescription: 'Entrez votre nouveau mot de passe ci-dessous.',
    emailNotConfirmed: 'E-mail non confirmé. Veuillez confirmer votre e-mail avant de demander une réinitialisation de mot de passe.',
    resetLinkSent: 'Si le compte existe et que l\'e-mail est confirmé, un lien de réinitialisation sera envoyé.',
    passwordResetSuccess: 'Mot de passe réinitialisé avec succès. Veuillez vous connecter avec votre nouveau mot de passe.',
    invalidResetToken: 'Jeton de réinitialisation invalide ou manquant',
    expiredResetToken: 'Le jeton de réinitialisation a expiré. Veuillez demander une nouvelle réinitialisation de mot de passe.',
    submitResetRequest: 'Envoyer le lien de réinitialisation',
    submitReset: 'Réinitialiser le mot de passe',
    backToLogin: 'Retour à la connexion',
    goToLogin: 'Aller à la connexion',
    requestNewReset: 'Demander une nouvelle réinitialisation de mot de passe',
    orContinueWith: 'ou continuer avec',
    createAccount: 'Créer un compte',
    confirmEmailTitle: 'Confirmez votre e-mail',
    confirmingEmail: 'Confirmation de votre adresse e-mail...',
    emailConfirmed: 'E-mail confirmé avec succès ! Vous pouvez maintenant vous connecter.',
    redirectingToLogin: 'Redirection vers la page de connexion...',
    invalidToken: 'Lien de confirmation invalide. Veuillez vérifier votre e-mail et réessayer.',
    signUp: 'S\'inscrire',
    resendEmailLabel: 'Adresse e-mail',
    resendEmailPlaceholder: 'vous@exemple.com',
    resendConfirmation: 'Renvoyer l’e-mail de confirmation',
    resendHelp: 'Vous n’avez pas reçu l’e-mail ? Saisissez votre adresse pour renvoyer le lien de confirmation.',
    resendSuccess: 'Si le compte existe, un e-mail de confirmation a été envoyé.',
    resendFailed: 'Impossible de renvoyer l’e-mail de confirmation. Veuillez réessayer.',
    messages: { 
      loginFailed: 'Échec de la connexion',
      invalidCredentials: 'Identifiants invalides',
      emailNotConfirmed: 'E-mail non confirmé. Veuillez confirmer votre e-mail avant de vous connecter.',
      accountLocked: 'Compte temporairement verrouillé en raison de tentatives échouées',
      passwordChangeRequired: 'Changement de mot de passe requis',
      unableToProcess: 'Impossible de traiter la connexion',
      resetRequestFailed: 'Échec de la demande de réinitialisation du mot de passe',
      resetFailed: 'Échec de la réinitialisation du mot de passe',
      invalidToken: 'Lien de confirmation invalide. Veuillez vérifier votre e-mail et réessayer.',
      emailConfirmed: 'E-mail confirmé avec succès ! Vous pouvez maintenant vous connecter.',
    },
    validation: {
      requiredEmail: "L'e-mail est requis",
      invalidEmail: 'Veuillez saisir une adresse e-mail valide',
      requiredPassword: 'Mot de passe requis',
    },
  },
};
