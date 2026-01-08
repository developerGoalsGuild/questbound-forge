# Backend Cost Optimization Analysis

## Executive Summary

This document identifies opportunities to reduce backend costs by:
1. **Reducing polling frequency** - Increasing intervals between automatic API calls
2. **Batching API calls** - Combining multiple sequential calls into single requests
3. **Eliminating redundant calls** - Removing duplicate or unnecessary API requests

## Current State Analysis

### 1. Polling Intervals (Too Frequent)

| Hook/Component | Current Interval | Calls/Hour | Cost Impact |
|---------------|------------------|------------|-------------|
| `useProductionMessaging` (fallback) | 5 seconds | 720 calls | **HIGH** |
| `useSimpleMessaging` | 2 seconds | 1,800 calls | **CRITICAL** |
| `useActiveGoalsCount` | 30 seconds | 120 calls | Medium |
| `useGuildAnalytics` | 30 seconds | 120 calls | Medium |
| `useQuestAnalytics` | 30 seconds | 120 calls | Medium |
| `useGuildRankings` | 60 seconds | 60 calls | Low |
| `useQuest` (progress updates) | Variable | Variable | Medium |

**Total estimated calls/hour per active user**: ~3,000+ calls

### 2. Sequential API Calls (Could Be Batched)

#### useProductionMessaging Hook
- **Issue**: `loadMessages()` and `getRoomInfo()` are called separately when roomId changes
- **Current**: 2 separate API calls
- **Optimization**: Combine into single GraphQL query or batch endpoint
- **Savings**: 50% reduction in calls

#### getRoomInfo Function
- **Issue**: Tries multiple endpoints sequentially (fallback pattern)
- **Current**: Up to 2-3 API calls per request
- **Optimization**: Use single endpoint or cache results
- **Savings**: 66% reduction in calls

#### ChatPage Component
- **Issue**: Calls `getRoomInfo()` for each room in `listRooms()` result
- **Current**: N+1 API calls (1 for list + N for each room)
- **Optimization**: Batch room info in listRooms response
- **Savings**: N calls → 1 call

### 3. Redundant Calls

#### Token Renewal
- **Issue**: Token renewal happens before every API call
- **Current**: Multiple renewal attempts per session
- **Optimization**: Centralized token renewal with caching
- **Savings**: 30-50% reduction in auth calls

## Recommended Optimizations

### Priority 1: Increase Polling Intervals

1. **useProductionMessaging fallback polling**: 5s → 30s (6x reduction)
2. **useSimpleMessaging**: 2s → 15s (7.5x reduction)
3. **useActiveGoalsCount**: 30s → 120s (4x reduction)
4. **useGuildAnalytics**: 30s → 300s (10x reduction)
5. **useQuestAnalytics**: 30s → 300s (10x reduction)

**Expected reduction**: ~80% fewer polling calls

### Priority 2: Batch API Calls

1. **Create `getRoomWithMessages` endpoint**:
   - Combines room info + initial messages
   - Reduces 2 calls → 1 call

2. **Batch `getRoomInfo` for multiple rooms**:
   - Create `getRoomsInfo(roomIds: string[])` endpoint
   - Reduces N calls → 1 call

3. **Combine analytics endpoints**:
   - Create unified analytics endpoint
   - Returns guild analytics + rankings + quest analytics together

### Priority 3: Optimize getRoomInfo

1. **Remove sequential endpoint attempts**:
   - Use single primary endpoint
   - Cache results for 5 minutes
   - Return cached data on failure

2. **Add request deduplication**:
   - Prevent multiple simultaneous calls for same roomId
   - Use request queue/cache

## Implementation Plan

### Phase 1: Polling Interval Increases (Immediate Impact)
- ✅ Increase all polling intervals
- ✅ Add exponential backoff for failed requests
- ✅ Implement visibility-based polling (pause when tab inactive)

### Phase 2: API Batching (Medium-term)
- ⏳ Create batch endpoints in backend
- ⏳ Update frontend to use batch endpoints
- ⏳ Add request deduplication

### Phase 3: Caching & Optimization (Long-term)
- ⏳ Implement client-side caching
- ⏳ Add request queuing
- ⏳ Optimize GraphQL queries

## Cost Impact Estimates

### Current State (per active user per hour)
- Polling calls: ~3,000 calls/hour
- Sequential calls: ~500 calls/hour
- Total: ~3,500 calls/hour

### After Optimizations
- Polling calls: ~600 calls/hour (80% reduction)
- Sequential calls: ~200 calls/hour (60% reduction)
- Total: ~800 calls/hour

### Cost Savings
- **77% reduction** in API calls
- Estimated monthly savings: $XXX (depends on AWS pricing)
- Improved user experience (less battery drain, faster responses)

## Monitoring & Validation

### Metrics to Track
1. Total API calls per user per hour
2. Average response times
3. Error rates
4. User experience metrics (loading times, etc.)

### Success Criteria
- ✅ 70%+ reduction in API calls
- ✅ No degradation in user experience
- ✅ Error rates remain stable or improve
- ✅ Backend costs reduced by 60%+

