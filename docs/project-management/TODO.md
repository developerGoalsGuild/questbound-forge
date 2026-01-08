Project TODOs

- Re-enable email confirmation before production:
  - Restore `confirmEmail` step in `frontend/src/pages/signup/LocalSignUp.tsx`.
  - Change user `status` back to `'email confirmation pending'` in both `LocalSignUp.tsx` and `frontend/src/lib/api.ts`.
  - Update i18n `successMessage` strings to instruct users to confirm their email.
  - Flip feature flag `VITE_ENABLE_EMAIL_CONFIRMATION=true` (see `frontend/src/config/featureFlags.ts`).
