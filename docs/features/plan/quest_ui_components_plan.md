# Plan: Implementing Quest UI Components (Tasks 4.1 - 4.5)

## 1. Introduction

This document outlines a detailed plan for a junior developer to implement the core UI components for the "Quests" feature, as specified in `docs/features/plan/22.4-create-user-quests-related-to-goal.md`. The tasks covered are 4.1 through 4.5, which constitute "Phase 4: Core UI Components".

The primary goal is to build these components in a way that is robust, accessible, localized, and doesn't break any existing functionality. We will proceed by first creating mock data and services to allow for independent UI development.

## 2. Prerequisites & Initial Setup

The UI components depend on data models, API hooks, and translation files that are part of Phase 2 and 3. To unblock development, we will start by creating mock versions of these dependencies.

**Action Item:** Before starting the component work, create the following mock files:

1.  **Mock Data (`frontend/src/lib/mocks/quests.ts`):**
    *   Create a file to export mock `Quest` objects. Include quests with different statuses (`draft`, `active`, `completed`, `cancelled`, `failed`), types (`linked`, `quantitative`), and difficulties. This will be used to build and test the UI components without a real backend.
    *   Refer to `frontend/src/models/quest.ts` for the `Quest` interface. If it doesn't exist, create a temporary version based on the feature document.

2.  **Mock Hooks (`frontend/src/hooks/useQuest.mock.ts`):**
    *   Create a mock version of `useQuest.ts`.
    *   Implement mock hooks like `useQuests`, `useQuest`, etc., that return the mock data from the previous step. They should also simulate loading and error states.

3.  **Mock Translations (`frontend/src/i18n/quest/en.mock.ts`):**
    *   Create a temporary English translation file for quests. You can fill it with placeholder text initially, following the structure defined in `QuestTranslations` interface in the feature document.

## 3. Detailed Task Breakdown

### Task 4.1: `QuestCard.tsx`

**Objective:** Create a reusable card component to display a summary of a single quest.

**File Location:** `frontend/src/components/quests/QuestCard.tsx` (create a new `quests` folder).

**Steps:**

1.  **Component Signature:**
    *   The component should accept a `quest: Quest` object as a prop.
    *   It should also accept props for actions, e.g., `onViewDetails: (id: string) => void`, `onStart: (id: string) => void`, etc.
2.  **UI Structure (using Shadcn UI & Tailwind CSS):**
    *   Use the `Card` component as the main container.
    *   `CardHeader`: Should contain the `quest.title` and a `Badge` to show the `quest.status`. The badge color should change based on the status (e.g., blue for `active`, green for `completed`, gray for `draft`).
    *   `CardContent`: Display key information like `difficulty`, `rewardXp`, and `category`. Use icons from `lucide-react` to make it visually appealing.
    *   `CardFooter`: This section will contain action buttons.
3.  **Dynamic Content:**
    *   **Status Badge:** The color and text of the badge must reflect the `quest.status`.
    *   **Progress:** For `linked` quests, show "X/Y tasks completed". For `quantitative` quests, display a `Progress` bar component.
4.  **Action Buttons:**
    *   Conditionally render buttons based on `quest.status`:
        *   `draft`: "Edit", "Start", "Delete"
        *   `active`: "Cancel", "Fail", "View Details"
        *   `completed`/`cancelled`/`failed`: "View Details"
    *   These buttons should trigger the handler functions passed in as props.
5.  **Localization:**
    *   Use the `useTranslation` hook to get quest-related translations. For now, use the mock translation file.
    *   All static text (like labels "Difficulty", "XP", etc.) and status names must be translated. E.g., `t('questCard.status.active')`.
6.  **Accessibility:**
    *   Ensure the card is navigable with a keyboard.
    *   Action buttons should have clear, accessible labels.
    *   Use proper heading tags for the title.
7.  **Testing:**
    *   **File Location:** `frontend/src/components/quests/__tests__/QuestCard.test.tsx`
    *   Write unit tests using Vitest and React Testing Library.
    *   **Test Cases:**
        *   Render the component with different quest statuses (`draft`, `active`, `completed`, etc.) and verify that the correct information and action buttons are displayed.
        *   Simulate clicks on action buttons and ensure the correct prop handlers are called.
        *   Test rendering for both `linked` and `quantitative` quest kinds.
    *   **Coverage:** Aim for at least 90% test coverage for the component.

### Task 4.2: `QuestList.tsx`

**Objective:** Display a list of quests using the `QuestCard` component, with filtering and sorting capabilities.

**File Location:** `frontend/src/components/quests/QuestList.tsx`

**Steps:**

1.  **Component Signature:**
    *   This component will not take quests as props directly. It will use the (mocked) `useQuests` hook to fetch the data.
2.  **State Management:**
    *   Use `useState` to manage filters (status, difficulty, etc.) and sorting options.
    *   The `useQuests` hook will provide `quests`, `isLoading`, and `error` states.
3.  **UI Structure:**
    *   **Filters:** Add `Select` and `Input` components at the top for filtering by status, difficulty, and searching by title.
    *   **Quest Grid/List:** Map over the `quests` array and render a `QuestCard` for each quest. Use a responsive grid layout (e.g., `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).
4.  **Data Handling Logic:**
    *   Implement client-side filtering and sorting based on the state from step 2.
    *   **Loading State:** While `isLoading` is true, display a grid of `Skeleton` components that mimic the `QuestCard` layout.
    *   **Empty State:** If `quests` is empty after fetching, display a user-friendly message with a call-to-action button to create a new quest.
    *   **Error State:** If `error` is not null, display an error message with a "Retry" button.
5.  **Pagination:**
    *   For now, implement simple client-side pagination if the mock quest list is large. A "Load More" button or a simple page number component at the bottom would suffice. The full backend pagination can be integrated later.
6.  **Localization:**
    *   All labels for filters, buttons, and messages (empty/error state) must be translated.
7.  **Testing:**
    *   **File Location:** `frontend/src/components/quests/__tests__/QuestList.test.tsx`
    *   **Test Cases:**
        *   Mock the `useQuests` hook to test the component's behavior in `loading`, `error`, and `empty` states.
        *   Test client-side filtering and sorting logic.
        *   Verify that the correct number of `QuestCard` components are rendered.
    *   **Coverage:** Aim for at least 90% test coverage.

### Tasks 4.3 & 4.4: `QuestCreateForm.tsx` (Multi-Step Wizard)

**Objective:** Create a multi-step form (wizard) for creating a new quest.

**File Location:** `frontend/src/components/quests/QuestCreateForm.tsx`

**This is a complex component. Break it down into smaller, manageable sub-components for each step.**

**Steps:**

1.  **Main Component (`QuestCreateForm.tsx`):**
    *   This will manage the overall state of the wizard, including the current step and the form data across all steps.
    *   Use `react-hook-form` to manage form state and validation. The `useForm` hook should be initialized here.
    *   Render the correct step component based on the current step state.
    *   Render "Next", "Back", and "Submit" buttons.
2.  **Validation:**
    *   Use `zod` to create validation schemas for each step of the form. The feature document has detailed validation rules.
    *   Use `@hookform/resolvers/zod` to connect Zod with `react-hook-form`.
3.  **Sub-Component: `Step1_BasicInfo.tsx`:**
    *   **Fields:** `title`, `description`, `category` (`Select`), `difficulty` (`Select`), `rewardXp` (`Input type="number"`), `deadline` (`DatePicker`).
    *   Use `react-hook-form`'s `useFormContext` or pass `register`, `control`, `errors` down as props.
    *   Display validation errors next to each field.
4.  **Sub-Component: `Step2_QuestType.tsx`:**
    *   A simple component with two large, selectable cards for "Linked" and "Quantitative" quest types. This will update the `kind` field in the form state.
5.  **Sub-Component: `Step3_Configuration.tsx`:**
    *   Conditionally render one of two forms based on the `kind` selected in Step 2.
    *   **Linked Form:**
        *   Multi-select components to choose `linkedGoalIds` and `linkedTaskIds`. You'll need to fetch (or mock) the user's goals and tasks.
    *   **Quantitative Form:**
        *   Fields for `targetCount`, `countScope` (`Select`), `startAt` (`DatePicker`), `periodSeconds`.
6.  **Sub-Component: `Step4_Preview.tsx`:**
    *   Display a read-only summary of all the data entered in the previous steps.
    *   This is the final confirmation step before submitting.
7.  **Submission:**
    *   The "Submit" button in the main component will call the `createQuest` function from the `useQuestCreate` hook.
    *   Handle loading and error states during submission. On success, close the form/modal and show a success toast.
8.  **Localization:** All labels, placeholders, validation messages, and button texts need to be translated.
9.  **Testing:**
    *   **File Location:** `frontend/src/components/quests/__tests__/QuestCreateForm.test.tsx`
    *   **Test Cases:**
        *   Test each step of the wizard individually.
        *   Verify that form validation (using `react-hook-form` and `zod`) works correctly for each field.
        *   Test the conditional logic for showing `linked` vs. `quantitative` fields.
        *   Simulate form submission and test success and error handling.
    *   **Coverage:** Aim for at least 90% test coverage for the entire form flow.

### Task 4.5: `QuestDetails.tsx`

**Objective:** A detailed view of a single quest.

**File Location:** `frontend/src/components/quests/QuestDetails.tsx`

**Steps:**

1.  **Data Fetching:**
    *   The component will likely be used on a page that receives a quest ID from the URL.
    *   Use the `useQuest(id)` hook to fetch the details for that specific quest.
    *   Handle loading, error, and not-found states.
2.  **UI Structure:**
    *   Use a two-column layout on larger screens.
    *   **Left Column (Main Details):**
        *   Quest Title (large heading).
        *   Status Badge.
        *   Description.
        *   Progress visualization (similar to the card, but larger and more detailed).
        *   A section for linked items (goals/tasks) with links to their respective detail pages.
    *   **Right Column (Metadata):**
        *   A `Card` component with key-value pairs for: `Difficulty`, `Category`, `Reward XP`, `Deadline`, `Created At`.
    *   **Actions:** Place action buttons (e.g., "Cancel Quest") prominently.
3.  **Localization:** Ensure all static text and labels are translated.
4.  **Accessibility:**
    *   Use proper heading structure (`h1` for title, etc.).
    *   Ensure all interactive elements are keyboard accessible.
5.  **Testing:**
    *   **File Location:** `frontend/src/components/quests/__tests__/QuestDetails.test.tsx`
    *   **Test Cases:**
        *   Mock the `useQuest` hook to test the component's behavior in `loading` and `error` states.
        *   Render the component with a mock quest object and verify all details are displayed correctly.
        *   Test that the correct action buttons are shown based on the quest status.
    *   **Coverage:** Aim for at least 90% test coverage.

## 4. Definition of Done (DoD) - Completion Checklist

### General (Applies to all components)
- [ ] **No Regressions:** The new components do not break any existing functionality.
- [ ] **Code Quality:** Code adheres to the project's style guide and best practices (DRY, SOLID).
- [ ] **File Structure:** Components are created in the correct directories (`frontend/src/components/quests/`).

### Functionality
- [ ] **`QuestCard.tsx`:**
    - [ ] Displays all required quest data correctly.
    - [ ] Badge color and text change based on quest status.
    - [ ] Action buttons are correctly displayed based on quest status and are functional (trigger props).
- [ ] **`QuestList.tsx`:**
    - [ ] Fetches and displays a list of quests.
    - [ ] Loading, empty, and error states are handled correctly.
    - [ ] Filtering and sorting functionality works as expected.
- [ ] **`QuestCreateForm.tsx`:**
    - [ ] Multi-step wizard flow is implemented correctly.
    - [ ] Step 1 (Basic Info) is complete with validation.
    - [ ] Step 2 (Type) updates form state.
    - [ ] Step 3 (Config) shows correct fields for `linked`/`quantitative`.
    - [ ] Step 4 (Preview) shows an accurate summary.
    - [ ] Form submission works and handles success/error states.
    - [ ] Validation is implemented for all fields as per the spec.
- [ ] **`QuestDetails.tsx`:**
    - [ ] Fetches and displays detailed information for a single quest.
    - [ ] Handles loading and error states for data fetching.
    - [ ] Progress is visualized correctly.
    - [ ] Action buttons are present and functional.

### User Experience (UX) & UI
- [ ] **Responsiveness:** All components are fully responsive and look good on mobile, tablet, and desktop screens.
- [ ] **Visual Consistency:** Components use the existing Shadcn UI theme and style, matching the application's look and feel.
- [ ] **Clarity:** All information is presented clearly and is easy to understand.

### Localization (i18n)
- [ ] All user-facing strings (labels, buttons, messages, etc.) are implemented using the `useTranslation` hook.
- [ ] The feature is tested with English, Spanish, and French translations (using mock data).

### Accessibility (a11y)
- [ ] **Keyboard Navigation:** All interactive elements are reachable and operable via the keyboard in a logical order.
- [ ] **Screen Reader Support:** Proper ARIA attributes (`aria-label`, `aria-invalid`, etc.) are used, especially on forms and controls.
- [ ] **Focus Management:** Focus is managed correctly, especially in the creation form/modal.
- [ ] **Semantic HTML:** Correct HTML tags (`h1`, `label`, `button`, etc.) are used.

### Testing
- [ ] **New Component Tests (>90% Coverage):** Each new component has a corresponding test file (e.g., `QuestCard.test.tsx`) with unit tests achieving at least 90% code coverage.
- [ ] **Updated Component Tests (>90% Coverage):** Any existing component that is modified during this implementation must also have its test coverage increased to at least 90%.
- [ ] **Test Scenarios:** Tests cover different states:
    - [ ] Rendering with various props (e.g., `QuestCard` with different statuses).
    - [ ] User interactions (e.g., clicking buttons, filling out forms).
    - [ ] Loading, empty, and error states.

### Documentation
- [ ] **Code Comments:** Complex logic is documented with comments.
- [ ] **Component Props:** Props for each component are documented using JSDoc.
