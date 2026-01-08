# Auth Renewal Optimization - Remove Calls from Non-Logged Areas

## Summary

Removed unnecessary auth token renewal calls from non-authenticated areas to reduce backend API calls.

## Changes Made

### 1. SessionKeepAlive Component (`frontend/src/lib/session.tsx`)
**Before**: Always attempted token renewal on user interactions, even when not logged in.

**After**: Checks if user has a token before attempting renewal.
- Added `getAccessToken()` check at the start of handler
- Returns early if no token exists (user not logged in)
- **Impact**: Eliminates renewal attempts on public pages (landing, login, docs, etc.)

### 2. authFetch Function (`frontend/src/lib/api.ts`)
**Before**: Always attempted token renewal before every API call.

**After**: Only renews token if user is authenticated.
- Checks for token existence before renewal logic
- Only attempts renewal if token exists
- **Impact**: Prevents renewal calls from public API endpoints

### 3. graphqlRaw Function (`frontend/src/lib/api.ts`)
**Before**: Always attempted token renewal on 401 errors.

**After**: Only renews token if user has a current token.
- Checks for existing token before attempting renewal
- Skips renewal if no token exists
- **Impact**: Prevents renewal attempts from unauthenticated GraphQL calls

### 4. useProductionMessaging Hook (`frontend/src/hooks/useProductionMessaging.ts`)
**Before**: Attempted token renewal in multiple places without checking authentication.

**After**: Checks authentication before renewal in:
- `loadMessages()` - Only renews if token exists
- `sendMessage()` - Only renews if token exists
- 401 error handlers - Only renews if token exists
- **Impact**: Prevents renewal calls when messaging is accessed without authentication

## Public Routes (No Auth Renewal)

These routes no longer trigger auth renewal calls:
- `/` (Index/Landing page)
- `/login`
- `/signup/LocalSignUp`
- `/docs`
- `/about`
- `/blog`
- `/careers`
- `/help`
- `/status`
- `/privacy`
- `/terms`

## Impact

### Before
- Auth renewal calls attempted on **all pages**, including public pages
- Unnecessary API calls to `/auth/renew` endpoint
- Wasted backend resources

### After
- Auth renewal calls **only** on authenticated pages
- No renewal attempts when user is not logged in
- **Reduced backend API calls** for public pages

## Cost Savings

- **Public page visits**: 100% reduction in auth renewal calls
- **Unauthenticated API calls**: 100% reduction in renewal attempts
- **Overall**: Significant reduction in unnecessary `/auth/renew` endpoint calls

## Testing

To verify the changes:
1. Visit public pages (landing, login, docs) - should see no `/auth/renew` calls in network tab
2. Visit authenticated pages - should see renewal calls only when token is expiring
3. Check browser console - no errors related to missing tokens on public pages

## Files Modified

1. `frontend/src/lib/session.tsx` - Added auth check to SessionKeepAlive
2. `frontend/src/lib/api.ts` - Added auth checks to authFetch and graphqlRaw
3. `frontend/src/hooks/useProductionMessaging.ts` - Added auth checks to all renewal points

