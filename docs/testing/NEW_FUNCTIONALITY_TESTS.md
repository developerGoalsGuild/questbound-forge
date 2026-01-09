# Tests for New Landing Page Functionalities

This document summarizes the test files created for the new landing page functionalities.

## Frontend Tests

### Component Tests

#### 1. ProblemRecognition Component
**File**: `apps/frontend/src/components/sections/__tests__/ProblemRecognition.test.tsx`
- Tests rendering of problem recognition section
- Tests all 6 problem scenarios
- Tests scenario icons and descriptions
- Tests closing message
- Tests accessibility attributes
- Tests grid layout and styling

#### 2. Empathy Component
**File**: `apps/frontend/src/components/sections/__tests__/Empathy.test.tsx`
- Tests rendering of empathy section
- Tests empathy message paragraphs
- Tests animated statistics (92%, 78%, 3x)
- Tests statistic labels
- Tests accessibility attributes

#### 3. SolutionIntro Component
**File**: `apps/frontend/src/components/sections/__tests__/SolutionIntro.test.tsx`
- Tests rendering of solution intro section
- Tests title and subtitle
- Tests solution paragraphs
- Tests accessibility attributes

#### 4. HowItWorks Component
**File**: `apps/frontend/src/components/sections/__tests__/HowItWorks.test.tsx`
- Tests rendering of how it works section
- Tests all 6 steps
- Tests step numbers and icons
- Tests step descriptions
- Tests accessibility attributes
- Tests grid layout

#### 5. FeatureCarousel Component
**File**: `apps/frontend/src/components/sections/__tests__/FeatureCarousel.test.tsx`
- Tests rendering of carousel section
- Tests all 4 carousel slides
- Tests navigation buttons (previous/next)
- Tests progress bar
- Tests indicators
- Tests auto-play toggle
- Tests slide tags
- Tests accessibility attributes
- Tests keyboard navigation

#### 6. DevelopmentNotice Component
**File**: `apps/frontend/src/components/sections/__tests__/DevelopmentNotice.test.tsx`
- Tests rendering of development notice section
- Tests notice title and message
- Tests icon rendering
- Tests accessibility attributes

#### 7. WaitlistForm Component
**File**: `apps/frontend/src/components/forms/__tests__/WaitlistForm.test.tsx`
- Tests form rendering
- Tests email input validation
- Tests form submission with valid email
- Tests loading state during submission
- Tests API error handling
- Tests error clearing when user types
- Tests ARIA live region
- Tests accessibility attributes
- Tests network error recovery

### Hook Tests

#### 8. useCarousel Hook
**File**: `apps/frontend/src/hooks/__tests__/useCarousel.test.ts`
- Tests initialization with first slide
- Tests next/previous slide navigation
- Tests wrapping around slides
- Tests going to specific slide
- Tests invalid slide index handling
- Tests auto-play toggle
- Tests pause/start auto-play
- Tests auto-advance when playing
- Tests pause when page is hidden
- Tests resume when page becomes visible

#### 9. useOnlineStatus Hook
**File**: `apps/frontend/src/hooks/__tests__/useOnlineStatus.test.ts`
- Tests online status detection
- Tests offline status detection
- Tests online event handling
- Tests offline event handling
- Tests event listener cleanup

### API Tests

#### 10. Waitlist and Newsletter API
**File**: `apps/frontend/src/lib/__tests__/api-waitlist.test.ts`
- Tests `subscribeToWaitlist` function
  - Sends correct request with API key
  - Handles API errors
  - Handles network errors
  - Validates API base URL configuration
  - Validates API key configuration
- Tests `subscribeToNewsletter` function
  - Sends correct request with API key
  - Uses default source when not provided
  - Handles API errors
  - Logs error details

## Backend Tests

### Waitlist and Newsletter Endpoints
**File**: `backend/services/user-service/tests/test_waitlist_newsletter.py`

#### Waitlist Tests
- `test_waitlist_subscribe_success`: Tests successful waitlist subscription
- `test_waitlist_subscribe_duplicate`: Tests duplicate subscription handling
- `test_waitlist_subscribe_missing_api_key`: Tests API key validation
- `test_waitlist_subscribe_invalid_email`: Tests email validation
- `test_waitlist_subscribe_cors_preflight`: Tests CORS preflight handling
- `test_waitlist_stored_in_dynamodb`: Tests DynamoDB storage

#### Newsletter Tests
- `test_newsletter_subscribe_success`: Tests successful newsletter subscription
- `test_newsletter_subscribe_default_source`: Tests default source handling
- `test_newsletter_subscribe_duplicate`: Tests duplicate subscription handling
- `test_newsletter_subscribe_missing_api_key`: Tests API key validation
- `test_newsletter_subscribe_invalid_email`: Tests email validation
- `test_newsletter_subscribe_cors_preflight`: Tests CORS preflight handling
- `test_newsletter_stored_in_dynamodb`: Tests DynamoDB storage

## Running the Tests

### Frontend Tests
```bash
cd apps/frontend
npm test
```

To run specific test files:
```bash
npm test -- ProblemRecognition
npm test -- WaitlistForm
npm test -- useCarousel
```

### Backend Tests
```bash
cd backend/services/user-service
pytest tests/test_waitlist_newsletter.py -v
```

## Test Coverage

The tests cover:
- ✅ Component rendering and structure
- ✅ User interactions (form submission, button clicks, navigation)
- ✅ API integration (success and error cases)
- ✅ Form validation
- ✅ Accessibility (ARIA attributes, keyboard navigation)
- ✅ Loading states
- ✅ Error handling and recovery
- ✅ Edge cases (duplicate subscriptions, invalid inputs)
- ✅ DynamoDB storage verification

## Notes

- All tests use Vitest for frontend testing
- Backend tests use pytest with moto for AWS mocking
- Tests follow the project's testing patterns and conventions
- IntersectionObserver is properly mocked for components that use it
- API functions are tested with proper error handling scenarios
