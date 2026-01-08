export interface SignupTranslation {
  validation?: {
    emailTaken?: string;
    nicknameTaken?: string;
  };
}

export interface FieldError {
  field: 'email' | 'nickname';
  message: string;
}

/**
 * Map a backend signup error payload (stringified in Error.message) to a
 * field-specific UI error using i18n translations when available.
 */
export function mapSignupErrorToField(err: unknown, tSignup: SignupTranslation): FieldError | null {
  let payload: any = null;
  try {
    const msg = (err as any)?.message;
    payload = typeof msg === 'string' ? JSON.parse(msg) : null;
  } catch {
    payload = null;
  }
  const detail = payload?.detail || payload;
  const code = detail?.code as string | undefined;

  if (code === 'EMAIL_TAKEN') {
    return { field: 'email', message: tSignup.validation?.emailTaken || 'Email already in use' };
  }
  if (code === 'NICKNAME_TAKEN') {
    return { field: 'nickname', message: tSignup.validation?.nicknameTaken || 'Nickname already in use' };
  }
  return null;
}

