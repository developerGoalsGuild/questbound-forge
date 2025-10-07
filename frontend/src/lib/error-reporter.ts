// frontend/src/lib/error-reporter.ts
import { logger } from './logger';
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
    return;
  } 
  
  // In development, we just log it to the console with more details.
  const enhancedContext = { ...context };

  // This is a special check for our custom API error to extract more details
  if ('details' in error && typeof (error as any).details === 'object') {
    const details = (error as any).details as Partial<QuestApiError>;
    if (details.status) enhancedContext.status = details.status;
    if (details.statusText) enhancedContext.statusText = details.statusText;
    if (details.errorBody?.errors) enhancedContext.apiErrors = details.errorBody.errors;
    if (details.requestId) enhancedContext.requestId = details.requestId;
  }
  
  const report = {
    error,
    context: enhancedContext,
  };

  logger.error('--- DEV: Error Report ---', report);
}

export function setUserContext(userId?: string) {
  if (ErrorTracker) {
    ErrorTracker.setUser({ id: userId });
  }
}
