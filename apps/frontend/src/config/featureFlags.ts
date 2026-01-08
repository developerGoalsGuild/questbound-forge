// Centralized feature flags for the frontend
// Toggle via Vite env vars (VITE_*)

export const emailConfirmationEnabled: boolean =
  (import.meta as any).env?.VITE_ENABLE_EMAIL_CONFIRMATION === 'true';

