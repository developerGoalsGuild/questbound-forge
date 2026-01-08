# Quest Dashboard, Goal Integration & Filters Implementation Plan

## Feature Description
Implement Tasks 5.1-5.3 from the Quest feature: create a comprehensive quest dashboard with two tabs (My Quests + Following), integrate quests into goal detail pages showing linked quests with create button, and build a dedicated QuestFilters component with search/sort/persistence. All components must be mobile-first, include screen reader and keyboard navigation, and maintain existing functionality.

## Phase 1: Quest Dashboard Foundation

### Task 5.1.1 - Create Quest Dashboard Page (`frontend/src/pages/QuestDashboard.tsx`)
- **File**: `frontend/src/pages/QuestDashboard.tsx`
- **Dependencies**: `useQuests` hook, `useTranslation` hook, existing quest models
- **Components to create**:
  - `QuestStatisticsCard` - displays quest counts by status, XP earned, success rate
  - `QuestStreakDisplay` - shows current daily/weekly streaks
  - `QuestQuickActions` - buttons for create quest, view all quests, join challenges
  - `QuestRecentActivity` - list of recent quest status changes
  - `QuestTabs` - switches between "My Quests" and "Following" tabs
- **Data flow**: Load user's quests + following quests, calculate statistics, display in responsive grid layout
- **Navigation**: Add route `/quests/dashboard` in `App.tsx`, update sidebar menu and quest list page links

### Task 5.1.2 - Statistics Calculation Logic
- **File**: `frontend/src/lib/questStatistics.ts`
- **Algorithm steps**:
  1. Load quest data using `useQuests` hook for both owned and following quests
  2. Group quests by status using array reduce operations
  3. Calculate XP earned by summing `rewardXp` for completed quests + bonuses
  4. Calculate success rate as (completed quests / total active quests) * 100
  5. Determine current streaks by analyzing quest completion timestamps
  6. Cache calculations using `useMemo` with quest data as dependencies
- **Performance**: Implement caching with `useMemo`, lazy load statistics on tab switch

### Task 5.1.3 - Following Quests Data Loading
- **File**: `frontend/src/lib/apiQuestFollowing.ts`
- **Implementation**: Extend existing GraphQL queries to fetch quests from followed users
- **Security**: Ensure proper authorization headers, validate user relationships
- **Caching**: Implement React Query caching for followed user quests

## Phase 2: Goal Integration

### Task 5.2.1 - Goal Details Quest Section
- **File**: `frontend/src/pages/goals/GoalDetails.tsx` (modify existing)
- **Changes**:
  - Add new section below tasks section showing linked quests
  - Use `useQuests({ goalId: currentGoalId })` to filter quests
  - Display quest cards in compact format with status indicators
  - Add "Create Quest from this Goal" button
- **Data flow**: Pass goalId to quest hook, filter and display matching quests
- **UI**: Add collapsible section with quest count badge

### Task 5.2.2 - Quest Creation from Goal Context
- **File**: `frontend/src/pages/goals/GoalDetails.tsx` (modify existing)
- **Logic**: When create button clicked, navigate to `/quests/create?goalId=${goalId}`
- **File**: `frontend/src/pages/quests/QuestCreate.tsx` (modify existing)
- **Changes**: Check URL params for `goalId`, pre-populate linked goals field if present
- **Validation**: Ensure goal ownership and permissions before pre-population

## Phase 3: Quest Filters Component

### Task 5.3.1 - QuestFilters Component
- **File**: `frontend/src/components/quests/QuestFilters.tsx` (new)
- **Features**:
  - Status filter dropdown (all statuses)
  - Difficulty filter dropdown
  - Category filter dropdown
  - Search input field (debounced 300ms)
  - Sort dropdown (date, difficulty, progress, XP)
  - Clear filters button
- **State management**: Local state with localStorage persistence
- **Integration**: Accept `onFiltersChange` callback prop to communicate with parent

### Task 5.3.2 - QuestList Integration
- **File**: `frontend/src/components/quests/QuestList.tsx` (modify existing)
- **Changes**:
  - Import and render `QuestFilters` component above quest list
  - Update filter logic to merge existing filters with new component
  - Implement search algorithm across titles, descriptions, tags, linked goal/task names
  - Add sort functionality with multiple criteria
- **Search algorithm**:
  1. Normalize search term to lowercase
  2. Search quest title, description, tags array
  3. For linked quests: search linked goal/task names (requires additional API calls)
  4. Return filtered quests array with search highlights

### Task 5.3.3 - Filter Persistence
- **File**: `frontend/src/hooks/useQuestFilters.ts` (new)
- **Implementation**: Custom hook managing filter state with localStorage
- **Features**: Load/save filters on mount/unmount, validate filter values
- **Integration**: Use in both QuestList and QuestDashboard components

## Phase 4: Performance & Accessibility

### Task 4.1 - Performance Optimizations
- **Lazy loading**: Implement `React.lazy` for quest dashboard and filter components
- **Caching**: Add React Query caching for quest statistics and following quests
- **Debounced operations**: 300ms debounce for search/filter inputs using existing `useDebouncedValidation`

### Task 4.2 - Accessibility Implementation
- **Screen reader support**: Add `aria-live` regions for dynamic statistics updates
- **Keyboard navigation**: Ensure tab order flows logically through all interactive elements
- **Focus management**: Implement focus trapping in modal dialogs
- **Announcements**: Use existing announcement system for status changes

## Phase 5: Testing & Integration

### Unit Tests (90% coverage target)
- **Files**: Create `__tests__/` for all new components and hooks
- **Coverage areas**:
  - QuestDashboard component rendering and tab switching
  - Statistics calculation logic edge cases
  - QuestFilters state management and persistence
  - Goal integration quest display logic
  - Search and sort algorithms

### Integration Tests
- **File**: `tests/integration/quest-dashboard-integration.js`
- **Scenarios**:
  - Dashboard loads user's quests and following quests
  - Statistics update when quests change status
  - Goal detail page shows correct linked quests
  - Quest creation from goal context pre-populates correctly
  - Filters persist across page refreshes

### E2E Test Automation
- **File**: `tests/seleniumGridTests/quest-dashboard-e2e.js`
- **PowerShell script**: `scripts/run-quest-dashboard-tests.ps1`
- **Scenarios**:
  - User navigates to dashboard, sees statistics and recent activity
  - User switches between My Quests and Following tabs
  - User creates quest from goal detail page
  - User applies filters and searches quests
  - User verifies mobile responsiveness

### Backend Integration Tests
- **File**: `backend/services/quest-service/tests/test_quest_filters.py`
- **Coverage**: Validate goal-based quest filtering, following quest queries
- **Terraform**: Update `backend/infra/terraform2/` with any new Lambda permissions for following quest queries

## Implementation Order
1. Quest Dashboard foundation (statistics, tabs, quick actions)
2. Goal integration (display linked quests, create from goal)
3. Quest filters (component, persistence, search/sort logic)
4. Performance optimizations and accessibility
5. Comprehensive testing and validation

## Risk Mitigation
- **Existing functionality**: All changes preserve existing quest operations and UI
- **Incremental rollout**: Each component can be deployed independently
- **Fallback handling**: Mock data for following quests if backend not ready
- **Performance monitoring**: Add metrics for new components load times
- **User feedback**: Include feature flags for gradual rollout

## Success Criteria
- Quest dashboard loads within 2 seconds with accurate statistics
- Goal detail pages show linked quests without performance impact
- Quest filters work across all search/sort combinations with <100ms response
- All components are fully accessible and mobile-responsive
- 90% test coverage maintained across new and modified code
- No regressions in existing quest functionality
