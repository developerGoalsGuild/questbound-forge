Goals (Quests) Page – Design, Setup, and Testing

Overview
- Role-gated page for authenticated users with role `user` to create and manage personal goals (quests).
- Goal creation includes a mandatory deadline and a guided “Well‑formed Outcome (NLP)” question set.
- AI integration provides an inspirational image and actionable improvement suggestions.
- Backend access control enforced via AppSync resolvers (identity.sub) and route guard.

Key Files
- Frontend
  - `frontend/src/pages/goals/Goals.tsx` – UI with form, NLP questions, AI actions, create-goal and add-task wiring.
  - `frontend/src/lib/auth.tsx` – `RoleRoute` guard for role‑based access.
  - `frontend/src/graphql/{mutations,queries}.ts` – `CREATE_GOAL`, `ADD_TASK`, `MY_GOALS`, `MY_TASKS`.
  - `frontend/src/pages/goals/questions.ts` – NLP question keys/order.
  - `frontend/src/i18n/translations.ts` – i18n strings for goals page (en/es/fr).
  - Tests: `frontend/src/pages/goals/__tests__/Goals.test.tsx`.

- Backend (AppSync)
  - `backend/infra/terraform/graphql/schema.graphql` – adds `deadline: AWSTimestamp` to `Goal` and `GoalInput`.
  - `backend/infra/terraform/resolvers/createGoal.js` – enforces `deadline` and stores/returns it.
  - `backend/infra/terraform/resolvers/{getGoals,myGoals}.js` – return `deadline` field.
  - Tests updated in `backend/infra/terraform/resolvers/__tests__` for `deadline` and validation.

- Backend (Quest Service – AI)
  - `backend/services/quest-service/app/main.py` – `POST /ai/inspiration-image` and `POST /ai/suggest-improvements`.
    - Fallback implementation: deterministic picsum image; heuristic suggestions.
    - If you supply an AI key (e.g., `OPENAI_API_KEY`), you can replace these with provider calls.

Routing & Access Control
- Route: `/goals` added in `frontend/src/App.tsx`.
- Client-side: `RoleRoute allow=["user"]` ensures only users with role `user` (or Cognito group) can access.
- Server-side: AppSync resolvers enforce `ctx.identity.sub` equality for create/read, preventing cross‑user access.

Goal Creation Flow
1) User fills Title, Description, Deadline (required) and NLP questions.
2) `createGoal` mutation is called with `deadline` (epoch seconds).
3) If NLP answers are provided, a planning task is created via `addTask` with `nlpPlan` set to answers.

AI Integration
- Image: `POST /ai/inspiration-image` with `{ text, lang }` returns `{ imageUrl }`.
- Suggestions: `POST /ai/suggest-improvements` with `{ text, lang }` returns `{ suggestions: string[] }`.
- Configure API base URL via `frontend/.env` variable `VITE_API_BASE_URL` pointing to quest‑service gateway URL.

Environment Variables
- Frontend
  - `VITE_API_BASE_URL` – Base URL for quest‑service (and existing user‑service) behind API Gateway.
  - `VITE_API_GATEWAY_KEY` – API key if required by your gateway.

- Backend (Quest Service)
  - `OPENAI_API_KEY` (optional) – If you wire a real model provider.
  - `QUESTS_TABLE` (not used by AI; exists for future quest APIs).

Testing
- Frontend
  - Run: `cd frontend && npm test` (or your existing test command).
  - Test file: `frontend/src/pages/goals/__tests__/Goals.test.tsx` covers validation, i18n, AI interactions.

- Backend AppSync resolvers
  - From `backend/infra/terraform`, run existing resolver tests (see project scripts). We updated tests for the new `deadline` field and validation.

Security Notes
- Do not expose raw AI keys in the frontend. Calls go through backend endpoints.
- AppSync resolvers validate `identity.sub` for create/read to prevent access to other users’ data.
- Client guard prevents casual navigation to `/goals` by non‑user roles; server is the ultimate enforcement.

Future Enhancements
- Replace placeholder AI with a real provider call.
- Add goal edit/update and secure mutations for modifying existing goals and tasks.
- Persist and visualize AI image & suggestions alongside the goal.

