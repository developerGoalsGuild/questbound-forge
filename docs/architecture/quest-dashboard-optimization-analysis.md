# Quest Dashboard Optimization Analysis

## Issues Found

### 1. QuestAnalyticsDashboard - Override Refresh Interval ⚠️
**Location**: `frontend/src/components/quests/analytics/QuestAnalyticsDashboard.tsx:37`
- Component passes `refreshInterval: 60000` (1 minute) which overrides the optimized default of 300000 (5 minutes)
- Analytics refreshes every minute even when collapsed
- **Impact**: 5x more API calls than necessary

### 2. QuestAnalyticsDashboard - Auto-refresh When Collapsed ⚠️
**Location**: `frontend/src/components/quests/analytics/QuestAnalyticsDashboard.tsx:36`
- `autoRefresh: true` is always enabled, even when analytics panel is collapsed
- Should only refresh when `isAnalyticsExpanded` is true
- **Impact**: Unnecessary API calls when user hasn't expanded analytics

### 3. QuestDashboard - Multiple Refresh Calls After Actions ⚠️
**Location**: `frontend/src/pages/quests/QuestDashboard.tsx`
- After each action (start, cancel, fail, delete), `refresh()` is called immediately
- If user performs multiple actions quickly, multiple refresh calls are made
- **Impact**: Could be debounced/batched

### 4. QuestList - Duplicate Hook Usage ⚠️
**Location**: `frontend/src/components/quests/QuestList.tsx:45`
- Component uses `useQuests()` hook even when quests are passed as props
- This causes duplicate API calls if parent already fetched quests
- **Impact**: Unnecessary duplicate API calls

### 5. useQuestProgress - Real-time Updates Interval ⚠️
**Location**: `frontend/src/hooks/useQuest.ts:792`
- Has `setInterval` for real-time progress updates
- Default `updateInterval` not specified, could be too frequent
- **Impact**: Potential excessive API calls for progress updates

## Recommended Optimizations

### Priority 1: Fix QuestAnalyticsDashboard Refresh Interval
- Remove hardcoded `refreshInterval: 60000` 
- Use default from hook (300000 = 5 minutes)
- Only enable auto-refresh when analytics panel is expanded

### Priority 2: Conditional Analytics Refresh
- Only enable `autoRefresh` when `isAnalyticsExpanded` is true
- Pause refresh when panel is collapsed

### Priority 3: Debounce Quest Refresh Calls
- Debounce refresh calls after actions
- Batch multiple refresh requests within short time window

### Priority 4: Fix QuestList Duplicate Calls
- Only use `useQuests()` hook if quests are not provided as props
- Prevent duplicate API calls

### Priority 5: Optimize Quest Progress Updates
- Increase default `updateInterval` for progress updates
- Only enable real-time updates when quest is active/in-progress

