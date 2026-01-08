# Task 4 - Enhanced Logging, Monitoring, and Debugging - Detailed Implementation Plan

## Overview
This document provides a detailed plan for implementing enhanced logging, monitoring, and debugging capabilities within the frontend API service layer, specifically targeting `frontend/src/lib/apiQuest.ts`. The goal is to build upon the existing robust error handling and logging framework to provide deeper insights into application behavior, improve debugging efficiency, and establish a foundation for proactive performance and error monitoring.

This plan is designed to be executed without introducing any breaking changes to the existing API functions.

## Current State Analysis
- ✅ `apiQuest.ts` contains structured error handling via `handleQuestApiError`.
- ✅ Basic logging is implemented using `console.info` for success and `console.error` for failures.
- ✅ Retry logic for network errors is in place with `withRetry`.
- ✅ Some performance timing is captured for failed requests.
- ❌ Logging is not centralized or standardized.
- ❌ No easy way to enable verbose debug logging for troubleshooting.
- ❌ Performance metrics are not consistently captured for all operations (e.g., successful ones).
- ❌ Errors are logged to the console but not aggregated in an external monitoring service.

## Implementation Strategy

### Phase 1: Create a Centralized Logger Utility (Task 4.1)

This phase focuses on creating a reusable logger utility to standardize log messages and levels across the application.

#### 1.1 Create `logger.ts`
**File**: `frontend/src/lib/logger.ts`

**Purpose**: To abstract logging logic, allowing for consistent formatting, log levels, and future integration with external services.

**Structure**:
```typescript
// frontend/src/lib/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  operation?: string;
  requestId?: string;
  [key: string]: any;
}

// Set the default log level. This can be dynamically changed.
let currentLogLevel: LogLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (level < currentLogLevel) {
    return;
  }

  const timestamp = new Date().toISOString();
  const levelString = LogLevel[level];
  
  const logEntry = {
    timestamp,
    level: levelString,
    message,
    ...context,
  };

  const consoleMethod = {
    [LogLevel.DEBUG]: console.debug,
    [LogLevel.INFO]: console.info,
    [LogLevel.WARN]: console.warn,
    [LogLevel.ERROR]: console.error,
  }[level];

  consoleMethod(`[${levelString}] ${message}`, logEntry);
}

export const logger = {
  debug: (message: string, context?: LogContext) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: LogContext) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: LogContext) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: LogContext) => log(LogLevel.ERROR, message, context),
  setLevel: (level: LogLevel) => {
    currentLogLevel = level;
    console.info(`Log level set to: ${LogLevel[level]}`);
  },
};
```

#### 1.2 Update `apiQuest.ts` to Use the New Logger
Refactor all `console.info`, `console.warn`, and `console.error` calls in `frontend/src/lib/apiQuest.ts` to use the new `logger` utility.

**Example Refactor in `loadQuests`**:
```typescript
// Before
// console.info('[Quest API] Loading quests', { goalId });
// ...
// console.info('[Quest API] Loaded quests successfully', { count: quests.length, goalId });
// ...
// console.error('[Quest API] Failed to load quests:', { error: error?.message || error, /*...*/ });

// After
import { logger } from './logger';
// ...
export async function loadQuests(goalId?: string): Promise<Quest[]> {
  const operation = 'loadQuests';
  logger.info('Loading quests', { operation, goalId });
  try {
    // ...
    logger.info(`Loaded ${quests.length} quests successfully`, {
      operation,
      goalId,
      count: quests.length,
    });
    return quests;
  } catch (error: any) {
    logger.error('Failed to load quests', {
      operation,
      goalId,
      error: error?.message || error,
    });
    throw new Error(error?.message || 'Failed to load quests');
  }
}
```
Apply this pattern to all functions in `apiQuest.ts`.

---

### Phase 2: Enhance Debug Information (Task 4.2)

This phase introduces a "debug mode" for verbose logging during development and troubleshooting.

#### 2.1 Add Debug Mode Toggle
In `logger.ts`, we can add a function to enable debug logging based on a `localStorage` flag.

**File**: `frontend/src/lib/logger.ts` (additions)
```typescript
// ... inside logger.ts

// Call this from your main App component or a debug utility
export function initializeDebugMode() {
  if (typeof window !== 'undefined' && window.localStorage.getItem('debug') === 'true') {
    logger.setLevel(LogLevel.DEBUG);
  }
}
```

#### 2.2 Add Verbose Debug Logs in `apiQuest.ts`
Add `logger.debug` calls at the start and end of functions, and to log detailed payloads.

**Example in `createQuest`**:
```typescript
// frontend/src/lib/apiQuest.ts
export async function createQuest(payload: QuestCreateInput): Promise<Quest> {
  const operation = 'createQuest';
  logger.debug('Entering createQuest', { operation, inputPayload: payload });

  // ... existing code ...
  
  // Inside withRetry, before authFetch
  logger.debug('Sending request to API', {
    operation,
    url: '/quests/createQuest',
    method: 'POST',
    body: validatedPayload
  });

  // ... after getting a successful response
  logger.debug('Received successful API response', {
    operation,
    questData
  });

  // ...
}
```

---

### Phase 3: Consistent Performance Monitoring (Task 4.3)

This phase ensures that performance metrics (API call duration) are captured for all requests, not just failed ones.

#### 3.1 Modify API functions to capture duration
Every REST operation in `apiQuest.ts` already has a `startTime`. We just need to ensure it's logged on success as well.

**Example in `createQuest`**:
```typescript
// frontend/src/lib/apiQuest.ts (inside withRetry)
const startTime = Date.now();
// ...
// ... after successful response
const duration = Date.now() - startTime;
logger.info('Quest created successfully', {
  operation: 'createQuest',
  questId: quest.id,
  duration, // <-- Add this
  requestId,
});
```
Apply this to all REST operations.

#### 3.2 Add timing for GraphQL operations
Wrap `graphqlRaw` calls to measure their duration.

**Example in `loadQuests`**:
```typescript
// frontend/src/lib/apiQuest.ts
export async function loadQuests(goalId?: string): Promise<Quest[]> {
  const operation = 'loadQuests';
  logger.info('Loading quests', { operation, goalId });
  const startTime = Date.now(); // <-- Add start time
  try {
    const data = await graphqlRaw<{ myQuests: Quest[] }>(MY_QUESTS, { goalId });
    const quests = data?.myQuests ?? [];
    
    const duration = Date.now() - startTime; // <-- Calculate duration
    logger.info(`Loaded ${quests.length} quests successfully`, {
      operation,
      goalId,
      count: quests.length,
      duration, // <-- Log duration
    });
    
    return quests;
  }
  //...
}
```

---

### Phase 4: Error Tracking and Reporting Integration (Task 4.4)

This phase involves integrating a third-party error tracking service. We'll use a placeholder for the actual SDK.

#### 4.1 Create an Error Reporting Service
**File**: `frontend/src/lib/error-reporter.ts`
```typescript
// frontend/src/lib/error-reporter.ts
import { QuestApiError } from './apiQuest';

// This is a placeholder for a real error tracking service like Sentry, LogRocket, etc.
interface ErrorTrackingSDK {
  captureException(error: Error, context: Record<string, any>): void;
  setUser(user: { id?: string }): void;
}

// Replace with actual SDK initialization
const ErrorTracker: ErrorTrackingSDK | null = {
  captureException: (error, context) => {
    console.log('--- ERROR SENT TO EXTERNAL SERVICE ---');
    console.log('Error:', error);
    console.log('Context:', context);
    console.log('------------------------------------');
  },
  setUser: (user) => {
    console.log(`Error Tracking User Set: ${user.id}`);
  }
};

export function reportError(error: Error, context: Record<string, any>) {
  if (import.meta.env.PROD && ErrorTracker) {
    ErrorTracker.captureException(error, context);
  } else {
    // In development, we just log it to the console for visibility
    console.warn('[Error Reporter] In dev mode, not sending to external service.', { error, context });
  }
}

export function setUserContext(userId?: string) {
  if (ErrorTracker) {
    ErrorTracker.setUser({ id: userId });
  }
}
```

#### 4.2 Integrate Error Reporter in `handleQuestApiError`
In `apiQuest.ts`, call the `reportError` function when an error is handled.

**File**: `frontend/src/lib/apiQuest.ts`
```typescript
// ... at top of apiQuest.ts
import { reportError } from './error-reporter';

// ... inside handleQuestApiError
async function handleQuestApiError(
  // ... parameters
): Promise<never> {
  // ... existing code to build errorInfo object

  // Log to console (as before)
  logger.error('API Error occurred', errorInfo);
  
  // Report to external service
  const errorMessage = `${message} (Request ID: ${requestId})`;
  const error = new Error(errorMessage);
  reportError(error, errorInfo); // <-- New integration call

  throw error; // Throw the new error object
}
```

---

### Phase 5: Centralized Logging Service Integration (Proposed Task 4.5)

For production environments, sending client-side logs to a centralized service (like Datadog, Logtail, AWS CloudWatch) is crucial for observability.

#### 5.1 Enhance Logger to Send Logs Externally
Modify `logger.ts` to push logs to a centralized service in production.

**File**: `frontend/src/lib/logger.ts` (conceptual)
```typescript
// This is a conceptual example. The implementation depends on the chosen logging service.
function sendLogToService(logEntry: Record<string, any>) {
  // In a real scenario, you would use the service's SDK
  // For example:
  // datadogLogs.logger.info(logEntry.message, logEntry);
  if (import.meta.env.PROD) {
    // Fictional endpoint
    fetch('https://logs.my-service.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
      keepalive: true // Ensures the request is sent even if the user navigates away
    }).catch(() => { /* Fail silently */ });
  }
}

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  // ... existing logging to console
  
  // Additionally, send to external service
  sendLogToService(logEntry);
}
```

---

## Definition of Done (Completion Checklist)

### Phase 1: Centralized Logger Utility
- [ ] **1.1** `frontend/src/lib/logger.ts` file is created.
- [ ] **1.2** Logger utility with `debug`, `info`, `warn`, `error` methods is implemented.
- [ ] **1.3** Log levels (`LogLevel` enum) are defined and used.
- [ ] **1.4** All `console.log`, `console.info`, `console.warn`, and `console.error` calls in `frontend/src/lib/apiQuest.ts` are replaced with the new `logger` service.
- [ ] **1.5** Log messages in `apiQuest.ts` include an `operation` name for context.

### Phase 2: Enhance Debug Information
- [ ] **2.1** A mechanism to enable "debug mode" (e.g., via `localStorage`) is implemented in `logger.ts`.
- [ ] **2.2** `logger.debug` calls are added to `apiQuest.ts` to log function entry/exit and important payloads.
- [ ] **2.3** Verify that debug logs only appear when debug mode is enabled.

### Phase 3: Consistent Performance Monitoring
- [ ] **3.1** All successful REST operations in `apiQuest.ts` now log their `duration`.
- [ ] **3.2** `loadQuests` (GraphQL) now logs its `duration` on success.
- [ ] **3.3** The `duration` is a number representing milliseconds.

### Phase 4: Error Tracking and Reporting
- [ ] **4.1** `frontend/src/lib/error-reporter.ts` file is created with placeholder functions.
- [ ] **4.2** `handleQuestApiError` in `apiQuest.ts` is updated to call `reportError`.
- [ ] **4.3** The rich `errorInfo` object is passed as context to the error reporter.
- [ ] **4.4** The application continues to function correctly, and errors are still thrown as expected.

### Phase 5: Centralized Logging Service Integration (Optional)
- [ ] **5.1** The `logger.ts` is updated with a (potentially placeholder) function to send logs to an external service.
- [ ] **5.2** This functionality is guarded and should only run in the production environment.

### Final Validation
- [ ] **V1** The application runs without any new console errors (other than the intended logs).
- [ ] **V2** All existing functionality in `apiQuest.ts` works as before.
- [ ] **V3** Automated tests (if any) for `apiQuest.ts` are updated and passing.
- [ ] **V4** A code review has been conducted on the new `logger.ts`, `error-reporter.ts`, and the changes in `apiQuest.ts`.
