# Guild Enhancements Test Plan

## Overview

This test plan covers the recent guild enhancements including:
1. Auto-calculated quest rewards for guild quests
2. Removal of goal references from guild-only quests
3. Updated guild rankings, details, and analytics dashboard
4. Localization improvements

**Version:** 1.0  
**Date:** 2024  
**Status:** Ready for Testing

---

## Test Scope

### Features Under Test

✅ **Auto-Calculated Quest Rewards**
- Backend reward calculation logic
- Frontend display of auto-calculated XP
- Reward calculation based on scope, period, and difficulty

✅ **Guild Quest Forms**
- Create guild quest form (quantitative and percentual)
- Edit guild quest form
- Validation and error handling
- Removal of goal-related fields and options

✅ **Guild Display Components**
- Guild rankings (removed goal references)
- Guild details page (removed goal stats)
- Guild analytics dashboard (removed goal metrics)

✅ **Localization**
- English (EN)
- Spanish (ES)
- French (FR)
- Form labels and tooltips
- Error messages

---

## Test Environment Setup

### Prerequisites
- Backend services running (guild-service, quest-service)
- Frontend application running
- Test database with sample guild data
- Test users with different roles (owner, moderator, member)

### Test Data
- At least 3 test guilds
- Guild owner, moderator, and member accounts
- Sample quests (quantitative and percentual)
- Sample user goals and tasks (for linked quests)

---

## Test Cases

### 1. Auto-Calculated Quest Rewards

#### 1.1 Backend Reward Calculation

**Test ID:** `GUILD-REWARD-001`  
**Priority:** High  
**Type:** Unit Test

**Description:** Verify reward calculation logic for guild quests

**Test Steps:**
1. Create quantitative guild quest with:
   - countScope: "tasks"
   - targetCount: 10
   - periodDays: 7
   - difficulty: "medium"
2. Verify `calculate_guild_quest_reward` returns correct XP
3. Create percentual guild quest with:
   - percentualType: "member_completion"
   - targetPercentage: 80
   - difficulty: "hard"
4. Verify reward calculation includes all factors

**Expected Results:**
- Reward XP is calculated automatically
- Calculation includes: base XP, scope multiplier, period multiplier, difficulty multiplier
- Reward falls within valid range (50-10000 XP)

**Files to Test:**
- `backend/services/guild-service/app/utils/reward_calculator.py`
- `backend/services/guild-service/tests/test_reward_calculator.py`

---

**Test ID:** `GUILD-REWARD-002`  
**Priority:** High  
**Type:** Unit Test

**Description:** Test reward calculation edge cases

**Test Steps:**
1. Test with minimal values (targetCount: 1, periodDays: 1)
2. Test with maximum values (targetCount: 1000, periodDays: 365)
3. Test with all difficulty levels (easy, medium, hard)
4. Test with different countScope values (tasks, guild_quest)
5. Test with different percentualType values

**Expected Results:**
- All edge cases calculate valid rewards
- No errors or exceptions
- Rewards stay within bounds

---

#### 1.2 Frontend Reward Display

**Test ID:** `GUILD-REWARD-003`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify auto-calculated XP displays in create form

**Test Steps:**
1. Navigate to guild quest creation form
2. Fill in quest details (title, category, type)
3. Select quantitative quest type
4. Fill in targetCount, countScope, periodDays
5. Select difficulty level
6. Verify XP reward is displayed (read-only, shows "Auto-calculated")
7. Submit form and verify backend receives calculated reward

**Expected Results:**
- XP reward field shows "Auto-calculated XP" or similar
- Field is read-only (not editable)
- Calculated value matches backend calculation
- Tooltip explains auto-calculation

**Files to Test:**
- `frontend/src/components/guilds/CreateGuildQuestForm.tsx`
- `frontend/src/i18n/guild.ts`

---

**Test ID:** `GUILD-REWARD-004`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify reward display in edit form

**Test Steps:**
1. Navigate to existing draft guild quest edit form
2. Verify quest's rewardXp is displayed
3. Verify display shows "Calculated automatically" message
4. Verify field is read-only
5. Modify quest parameters (targetCount, difficulty)
6. Save and verify new reward is recalculated

**Expected Results:**
- Existing quest shows its calculated rewardXp
- Message indicates it's auto-calculated
- Field cannot be edited directly
- Updating quest parameters recalculates reward

**Files to Test:**
- `frontend/src/components/guilds/EditGuildQuestForm.tsx`

---

### 2. Goal References Removal

#### 2.1 Guild Quest Creation Form

**Test ID:** `GUILD-GOAL-REMOVAL-001`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify quantitative quest form has no goal references

**Test Steps:**
1. Navigate to create guild quest form
2. Select "Quantitative" quest type
3. Verify countScope dropdown options:
   - ✅ "User Goals (from members)" - should be present
   - ✅ "Tasks" - should be present
   - ✅ "Guild Quests" - should be present
   - ❌ "Goals" alone - should NOT be present
4. Verify labels clarify "User Goals (from members)"
5. Check tooltips mention user goals from members

**Expected Results:**
- Only "User Goals (from members)" option exists (not just "Goals")
- Labels are clear about source (user goals from members)
- No references to guild-level goals

**Files to Test:**
- `frontend/src/components/guilds/CreateGuildQuestForm.tsx`
- `frontend/src/i18n/guild.ts`

---

**Test ID:** `GUILD-GOAL-REMOVAL-002`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify percentual quest form has no goal references

**Test Steps:**
1. Navigate to create guild quest form
2. Select "Percentual" quest type
3. Select "Goal/Task Completion" percentualType
4. Verify linkedGoalIds field label shows "Linked User Goal IDs (from guild members)"
5. Verify percentualCountScope options:
   - ✅ "User Goals (from members)"
   - ✅ "Tasks"
   - ✅ "Both"
6. Verify no standalone "Goals" option
7. Check localization in all languages (EN, ES, FR)

**Expected Results:**
- Labels clarify these are user goals from members
- No references to guild-level goals
- All translations are accurate

---

#### 2.2 Backend Validation

**Test ID:** `GUILD-GOAL-REMOVAL-003`  
**Priority:** High  
**Type:** Unit Test

**Description:** Verify backend accepts user goals but not guild goals

**Test Steps:**
1. Create quantitative quest with countScope: "goals" (user goals)
2. Verify quest is created successfully
3. Create percentual quest with linkedGoalIds (user goal IDs)
4. Verify quest is created successfully
5. Attempt to create quest referencing non-existent guild goals
6. Verify appropriate error handling

**Expected Results:**
- Backend accepts user goal references
- Backend validates goal IDs belong to guild members
- Appropriate error messages for invalid references

**Files to Test:**
- `backend/services/guild-service/app/db/guild_db.py`
- `backend/services/guild-service/app/models/guild.py`

---

#### 2.3 Guild Rankings Display

**Test ID:** `GUILD-GOAL-REMOVAL-004`  
**Priority:** Medium  
**Type:** Integration Test

**Description:** Verify guild rankings show no goal metrics

**Test Steps:**
1. Navigate to guild rankings page
2. Verify stats overview shows:
   - ✅ Total Guilds
   - ✅ Total Members
   - ✅ Total Score
   - ✅ Avg Activity
   - ❌ Total Goals (should NOT appear)
3. Verify ranking cards show:
   - ✅ Members count
   - ✅ Quests count
   - ✅ Score
   - ❌ Goals count (should NOT appear)
4. Verify sorting options don't include goals

**Expected Results:**
- No goal-related metrics displayed
- Stats grid shows only members and quests
- All calculations exclude goal metrics

**Files to Test:**
- `frontend/src/components/guilds/GuildRankingList.tsx`
- `frontend/src/components/guilds/GuildRankingCard.tsx`
- `frontend/src/pages/guilds/GuildRankings.tsx`

---

#### 2.4 Guild Details Page

**Test ID:** `GUILD-GOAL-REMOVAL-005`  
**Priority:** Medium  
**Type:** Integration Test

**Description:** Verify guild details page shows no goal stats

**Test Steps:**
1. Navigate to a guild details page
2. Verify header stats show:
   - ✅ Members count
   - ✅ Quests count
   - ❌ Goals count (should NOT appear)
3. Verify stats grid is 2 columns (not 3)
4. Check all tabs for goal references

**Expected Results:**
- Stats section shows only Members and Quests
- Grid layout is 2 columns
- No goal-related UI elements

**Files to Test:**
- `frontend/src/components/guilds/GuildDetails.tsx`

---

#### 2.5 Guild Analytics Dashboard

**Test ID:** `GUILD-GOAL-REMOVAL-006`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify analytics dashboard shows no goal metrics

**Test Steps:**
1. Navigate to guild details → Analytics tab
2. Verify primary metrics show:
   - ✅ Members
   - ✅ Quests
   - ❌ Goals (should NOT appear)
3. Verify progress indicators show:
   - ✅ Member Activity Rate
   - ✅ Quest Completion Rate
   - ❌ Goal Completion Rate (should NOT appear)
4. Verify weekly summary shows:
   - ✅ New Members
   - ✅ Quests Completed
   - ✅ Activity Score
   - ❌ Goals Created (should NOT appear)
5. Verify member leaderboard shows:
   - ✅ Quests Completed
   - ✅ Total XP
   - ✅ Activity Score
   - ❌ Goals Completed (should NOT appear)

**Expected Results:**
- All goal-related metrics removed
- Grid layouts adjusted (3 columns → 2, 4 columns → 3)
- Member leaderboard excludes goals completed
- All data displays correctly (not all zeros)

**Files to Test:**
- `frontend/src/components/guilds/GuildAnalyticsCard.tsx`
- `frontend/src/lib/api/guild.ts` (getGuildAnalytics)
- `frontend/src/hooks/useGuildAnalytics.ts`

---

### 3. Localization

#### 3.1 English (EN) Translations

**Test ID:** `GUILD-LOCALE-001`  
**Priority:** Medium  
**Type:** Manual Test

**Description:** Verify all English translations are correct

**Test Steps:**
1. Set language to English
2. Navigate through guild quest forms
3. Verify labels:
   - "User Goals (from members)"
   - "Linked User Goal IDs (comma-separated, from guild members)"
4. Verify tooltips and help text
5. Verify error messages

**Expected Results:**
- All text is in English
- Labels clarify user goals vs guild goals
- No missing translations

---

#### 3.2 Spanish (ES) Translations

**Test ID:** `GUILD-LOCALE-002`  
**Priority:** Medium  
**Type:** Manual Test

**Description:** Verify all Spanish translations are correct

**Test Steps:**
1. Set language to Spanish
2. Navigate through guild quest forms
3. Verify labels:
   - "Objetivos de Usuario (de miembros)"
   - "IDs de Objetivos de Usuario Vinculados"
4. Verify all form fields are translated
5. Verify analytics dashboard labels

**Expected Results:**
- All text is in Spanish
- Translations are accurate
- No English text mixed in

---

#### 3.3 French (FR) Translations

**Test ID:** `GUILD-LOCALE-003`  
**Priority:** Medium  
**Type:** Manual Test

**Description:** Verify all French translations are correct

**Test Steps:**
1. Set language to French
2. Navigate through guild quest forms
3. Verify labels:
   - "Objectifs d'Utilisateur (des membres)"
   - "IDs d'Objectifs d'Utilisateur Liés"
4. Verify all form fields are translated
5. Verify analytics dashboard labels

**Expected Results:**
- All text is in French
- Translations are accurate
- No missing translations

---

### 4. API Integration

#### 4.1 Guild Quest Creation API

**Test ID:** `GUILD-API-001`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify guild quest creation API without goal fields

**Test Steps:**
1. Call POST `/guilds/{guild_id}/quests` with:
   ```json
   {
     "title": "Test Quest",
     "kind": "quantitative",
     "countScope": "tasks",
     "targetCount": 10,
     "difficulty": "medium"
   }
   ```
2. Verify response includes auto-calculated `rewardXp`
3. Verify quest is created without goal references
4. Verify quest appears in guild quests list

**Expected Results:**
- Quest created successfully
- Reward XP is calculated and included
- No goal-related fields in response (unless user goals)
- Quest visible in list

---

#### 4.2 Guild Quest Update API

**Test ID:** `GUILD-API-002`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify guild quest update API

**Test Steps:**
1. Create a draft guild quest
2. Update quest with modified parameters
3. Verify reward XP is recalculated
4. Verify only draft quests can be updated

**Expected Results:**
- Draft quests can be updated
- Reward XP recalculates on update
- Active/archived quests cannot be updated

---

#### 4.3 Guild Analytics API

**Test ID:** `GUILD-API-003`  
**Priority:** High  
**Type:** Integration Test

**Description:** Verify guild analytics API returns correct data

**Test Steps:**
1. Call GET `/guilds/{guild_id}/analytics`
2. Verify response structure:
   - ✅ totalMembers
   - ✅ activeMembers
   - ✅ totalQuests
   - ✅ completedQuests
   - ❌ totalGoals (should NOT be present)
   - ❌ completedGoals (should NOT be present)
3. Verify memberLeaderboard data:
   - ✅ questsCompleted
   - ✅ activityScore
   - ✅ totalXp
   - ❌ goalsCompleted (should NOT be present)
4. Verify data is not all zeros

**Expected Results:**
- API returns correct data structure
- No goal-related fields in response
- Data values are actual numbers (not all zeros)
- Member leaderboard has correct structure

---

### 5. Error Handling

#### 5.1 Invalid Quest Parameters

**Test ID:** `GUILD-ERROR-001`  
**Priority:** Medium  
**Type:** Integration Test

**Description:** Verify error handling for invalid quest parameters

**Test Steps:**
1. Attempt to create quest with invalid countScope
2. Attempt to create quest with missing required fields
3. Attempt to create quest with invalid targetCount (negative)
4. Verify appropriate error messages

**Expected Results:**
- Clear error messages displayed
- Validation prevents invalid submissions
- User-friendly error messages

---

#### 5.2 Network Error Handling

**Test ID:** `GUILD-ERROR-002`  
**Priority:** Medium  
**Type:** Integration Test

**Description:** Verify error handling for network failures

**Test Steps:**
1. Simulate network failure during quest creation
2. Simulate network failure during analytics fetch
3. Verify error messages are displayed
4. Verify retry mechanisms work
5. Verify user can recover from errors

**Expected Results:**
- Network errors are caught and displayed
- User can retry failed operations
- Error messages are clear and actionable

---

#### 5.3 Missing Data Handling

**Test ID:** `GUILD-ERROR-003`  
**Priority:** Medium  
**Type:** Integration Test

**Description:** Verify handling of missing or null data

**Test Steps:**
1. Test with guild that has no quests
2. Test with guild that has no members
3. Test analytics with missing fields
4. Verify graceful degradation

**Expected Results:**
- Empty states display correctly
- Missing data doesn't cause crashes
- Default values are used appropriately

---

### 6. Performance Testing

#### 6.1 Quest Creation Performance

**Test ID:** `GUILD-PERF-001`  
**Priority:** Low  
**Type:** Performance Test

**Description:** Verify quest creation is fast

**Test Steps:**
1. Measure time to create 10 guild quests
2. Verify response time < 2 seconds per quest
3. Test with concurrent quest creations

**Expected Results:**
- Quest creation completes quickly
- No performance degradation with multiple quests

---

#### 6.2 Analytics Loading Performance

**Test ID:** `GUILD-PERF-002`  
**Priority:** Low  
**Type:** Performance Test

**Description:** Verify analytics dashboard loads quickly

**Test Steps:**
1. Measure time to load analytics data
2. Verify dashboard renders < 3 seconds
3. Test with guilds with many members

**Expected Results:**
- Analytics load quickly
- No lag when rendering dashboard

---

### 7. Accessibility Testing

#### 7.1 Screen Reader Compatibility

**Test ID:** `GUILD-A11Y-001`  
**Priority:** Medium  
**Type:** Accessibility Test

**Description:** Verify screen reader compatibility

**Test Steps:**
1. Use screen reader (NVDA/JAWS) to navigate forms
2. Verify all form fields are announced
3. Verify error messages are announced
4. Verify labels are associated with inputs
5. Verify ARIA attributes are correct

**Expected Results:**
- All interactive elements are accessible
- Screen reader announces all content
- Form validation errors are announced

---

#### 7.2 Keyboard Navigation

**Test ID:** `GUILD-A11Y-002`  
**Priority:** Medium  
**Type:** Accessibility Test

**Description:** Verify keyboard navigation works

**Test Steps:**
1. Navigate entire form using only keyboard
2. Verify all interactive elements are reachable
3. Verify focus indicators are visible
4. Verify tab order is logical

**Expected Results:**
- All functionality accessible via keyboard
- Focus indicators are clear
- Tab order is intuitive

---

## Test Execution

### Test Phases

#### Phase 1: Unit Tests (Backend)
- Run all reward calculator unit tests
- Run guild DB operation tests
- Run model validation tests
- **Target:** 90%+ code coverage

#### Phase 2: Unit Tests (Frontend)
- Run component tests
- Run hook tests
- Run API client tests
- **Target:** 80%+ code coverage

#### Phase 3: Integration Tests
- Test complete quest creation flow
- Test analytics data flow
- Test form validation
- **Target:** All critical paths covered

#### Phase 4: E2E Tests
- Test complete user journeys
- Test cross-browser compatibility
- Test accessibility
- **Target:** All user flows validated

---

## Test Data Requirements

### Test Guilds
- At least 3 guilds with different configurations
- Guild with owner, moderator, and members
- Guild with active quests
- Guild with completed quests

### Test Users
- Guild owner account
- Guild moderator account
- Guild member account
- Non-member account (for permission testing)

### Test Quests
- Quantitative quests (tasks, guild_quest scopes)
- Percentual quests (member_completion, goal_task_completion)
- Draft quests
- Active quests
- Completed quests

---

## Regression Testing

### Areas to Verify Still Work
- ✅ Existing guild quest functionality
- ✅ Guild member management
- ✅ Guild comments system
- ✅ Guild rankings calculation
- ✅ User quest functionality (unchanged)
- ✅ User goal functionality (unchanged)

---

## Test Results Tracking

### Test Execution Log

| Test ID | Status | Executed By | Date | Notes |
|---------|--------|-------------|------|-------|
| GUILD-REWARD-001 | ⬜ | | | |
| GUILD-REWARD-002 | ⬜ | | | |
| GUILD-REWARD-003 | ⬜ | | | |
| GUILD-REWARD-004 | ⬜ | | | |
| GUILD-GOAL-REMOVAL-001 | ⬜ | | | |
| GUILD-GOAL-REMOVAL-002 | ⬜ | | | |
| GUILD-GOAL-REMOVAL-003 | ⬜ | | | |
| GUILD-GOAL-REMOVAL-004 | ⬜ | | | |
| GUILD-GOAL-REMOVAL-005 | ⬜ | | | |
| GUILD-GOAL-REMOVAL-006 | ⬜ | | | |
| GUILD-LOCALE-001 | ⬜ | | | |
| GUILD-LOCALE-002 | ⬜ | | | |
| GUILD-LOCALE-003 | ⬜ | | | |
| GUILD-API-001 | ⬜ | | | |
| GUILD-API-002 | ⬜ | | | |
| GUILD-API-003 | ⬜ | | | |

**Legend:**
- ✅ Pass
- ❌ Fail
- ⬜ Not Tested
- ⚠️ Blocked
- 🔄 Retest

---

## Known Issues & Limitations

### Current Limitations
- Some analytics fields default to 0 (newMembersThisWeek, questsCompletedThisWeek) - backend not yet implemented
- Reward calculation may need tuning based on user feedback

### Future Enhancements
- Real-time reward calculation preview in form
- Historical reward tracking
- Reward calculation explanation tooltip

---

## Sign-Off

### Test Completion Criteria
- [ ] All high-priority tests passed
- [ ] All critical bugs fixed
- [ ] Code coverage targets met
- [ ] Accessibility requirements met
- [ ] Performance benchmarks met
- [ ] Localization verified in all languages

### Approval
- **Test Lead:** _________________ Date: _______
- **Development Lead:** _________________ Date: _______
- **Product Owner:** _________________ Date: _______

---

## Appendix

### Test Environment Details
- **Backend URL:** `http://localhost:8000`
- **Frontend URL:** `http://localhost:5173`
- **Database:** DynamoDB Local
- **Browser:** Chrome, Firefox, Safari (latest versions)

### Test Tools
- **Unit Tests:** pytest (backend), Jest (frontend)
- **E2E Tests:** Selenium/Playwright
- **API Testing:** Postman/Insomnia
- **Accessibility:** WAVE, axe DevTools

### Related Documents
- [Guild Quest Design Document](../features/plan/GUILD_QUEST_DESIGN.md)
- [Reward Calculator Implementation](../../backend/services/guild-service/app/utils/reward_calculator.py)
- [Frontend Guild Components](../../frontend/src/components/guilds/)

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team




