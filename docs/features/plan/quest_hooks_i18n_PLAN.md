## Quest Hooks & i18n – Technical Plan

Brief
- Implement React hooks for quest operations on the frontend and introduce a single-file quest i18n module. No backend changes required. Follow existing API contracts and i18n aggregator patterns.

Relevant files/functions
- Frontend models: `frontend/src/models/quest.ts` (types, Zod schemas already defined)
- API layer: `frontend/src/lib/apiQuest.ts` (loadQuests, createQuest, startQuest, editQuest, cancelQuest, failQuest, deleteQuest)
- i18n aggregator: `frontend/src/i18n/translations.ts`
- New: `frontend/src/hooks/useQuest.ts` (custom hooks)
- New: `frontend/src/i18n/quest.ts` (single module for en/es/fr quest translations)

Plan
1) Hooks (data layer wrapper)
- Create `frontend/src/hooks/useQuest.ts` exporting:
  - `useQuests(goalId?: string)` → fetches via `loadQuests` and exposes `{ quests, isLoading, error, refresh }`.
  - `useQuestCreate()` → wraps `createQuest` with client-side validation; returns `{ create, isCreating, validationErrors, error, resetErrors }`.
  - `useQuestStart()` → wraps `startQuest`; `{ start, isStarting, error }`.
  - `useQuestEdit()` → wraps `editQuest`; `{ edit, isEditing, validationErrors, error }`.
  - `useQuestCancel()` → wraps `cancelQuest`; `{ cancel, isCancelling, error }`.
  - `useQuestFail()` → wraps `failQuest`; `{ fail, isFailing, error }`.
  - `useQuestDelete()` → wraps `deleteQuest`; `{ remove, isDeleting, error }`.
- Common patterns:
  - Central `loadingStates` and `setLoading(key, boolean)`.
  - Optimistic updates with rollback.
  - Optional `{ notify?: boolean }` parameter (default true) to show success/error toasts using i18n `quest.messages.*` keys.
  - Accessibility: on validation errors, announce via ARIA live region and focus first error.

2) i18n module
- Create `frontend/src/i18n/quest.ts`:
  - `export interface QuestTranslations` per the structure already documented in 22.4.
  - `export const questTranslations: Record<Language, QuestTranslations> = { en, es, fr }` with minimal initial content to support hooks’ default toasts and common labels.
- Update `frontend/src/i18n/translations.ts`:
  - `import type { QuestTranslations } from './quest'`
  - `import { questTranslations } from './quest'`
  - Extend `Translations` type with `quest: QuestTranslations`
  - Add `quest: questTranslations.en/es/fr` to language objects.

3) Algorithms/flows
- Hooks call API layer promises.
- On success: update local state (optimistic confirm), show toast if `notify !== false`.
- On error: rollback optimistic state, map API error to friendly message via existing error handler; show toast if `notify !== false`.

4) Tests
- Unit tests (Vitest) for each hook:
  - Success path updates state and triggers toast.
  - Validation error path yields field errors; focus/announcement called.
  - Network/permission error paths log and surface i18n error, toast shown.
  - `{ notify: false }` suppresses toast.
- i18n parity test to ensure all keys exist in en/es/fr.

5) File changes summary
- Add: `frontend/src/hooks/useQuest.ts`
- Add: `frontend/src/i18n/quest.ts`
- Update: `frontend/src/i18n/translations.ts` to include `quest` block
- Tests under `frontend/src/hooks/__tests__/useQuest.test.ts`

No code
- This document intentionally contains no code; implementation will follow these references.
