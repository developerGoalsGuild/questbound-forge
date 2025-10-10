import { authFetch, graphqlRaw } from './api';
import { getAccessToken, getApiBase } from '@/lib/utils';
import type { 
  Quest, 
  QuestCreateInput, 
  QuestUpdateInput, 
  QuestCancelInput 
} from '@/models/quest';
import { 
  QuestCreateInputSchema, 
  QuestUpdateInputSchema, 
  QuestCancelInputSchema 
} from '@/models/quest';
import { logger } from './logger';
import { reportError } from './error-reporter';

// ============================================================================
// Phase 1: Core API Service Structure
// ============================================================================

/**
 * Quest API service functions following established patterns from apiGoal.ts and apiHeader.ts
 * Provides comprehensive quest operations with error handling, authentication, and logging
 */

// ============================================================================
// GraphQL Operations (Reads)
// ============================================================================

/**
 * GraphQL query for fetching user's quests
 */
const MY_QUESTS = /* GraphQL */ `
  query MyQuests {
    myQuests {
      id
      userId
      title
      description
      difficulty
      rewardXp
      status
      category
      tags
      privacy
      deadline
      createdAt
      updatedAt
      startedAt
      kind
      linkedGoalIds
      linkedTaskIds
      dependsOnQuestIds
      targetCount
      countScope
      periodDays
    }
  }
`;

/**
 * Load user's quests with optional goalId filtering
 * 
 * @param goalId - Optional goal ID to filter quests
 * @returns Promise<Quest[]> - Array of quest objects
 * 
 * @example
 * ```typescript
 * // Load all quests
 * const quests = await loadQuests();
 * 
 * // Load quests for specific goal
 * const goalQuests = await loadQuests('goal-123');
 * ```
 */
export async function loadQuests(goalId?: string): Promise<Quest[]> {
  const operation = 'loadQuests';
  logger.info('Loading quests', { operation, goalId });
  const startTime = Date.now();
  try {
    // Note: Backend doesn't support goalId filtering, so we always load all quests
    // Client-side filtering is handled by useGoalQuests hook
    const data = await graphqlRaw<{ myQuests: Quest[] }>(MY_QUESTS, {});
    const quests = data?.myQuests ?? [];

    const duration = Date.now() - startTime;
    logger.info(`Loaded ${quests.length} quests successfully`, {
      operation,
      goalId,
      count: quests.length,
      duration,
    });

    return quests;
  } catch (error: any) {
    logger.error('Failed to load quests', {
      operation,
      goalId,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    });
    throw new Error(error?.message || 'Failed to load quests');
  }
}

/**
 * Load a single quest by ID
 * 
 * @param questId - Quest ID to load
 * @returns Promise<Quest> - Quest object
 * 
 * @example
 * ```typescript
 * const quest = await loadQuest('quest-123');
 * ```
 */
export async function loadQuest(questId: string): Promise<Quest> {
  const operation = 'loadQuest';
  logger.info('Loading quest', { operation, questId });
  const startTime = Date.now();
  try {
    const data = await graphqlRaw<{ myQuests: Quest[] }>(MY_QUESTS, {});
    const quests = data?.myQuests ?? [];
    const quest = quests.find(q => q.id === questId);
    
    if (!quest) {
      throw new Error(`Quest with ID ${questId} not found`);
    }
    
    const duration = Date.now() - startTime;
    logger.info('Quest loaded successfully', { operation, questId, duration });
    return quest;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Failed to load quest', {
      operation,
      questId,
      error: error?.message || error,
      duration,
      timestamp: new Date().toISOString()
    });
    throw new Error(error?.message || 'Failed to load quest');
  }
}

// ============================================================================
// REST Operations (Writes)
// ============================================================================

/**
 * Create a new quest (creates as draft)
 * 
 * @param payload - Quest creation input
 * @returns Promise<Quest> - Created quest object
 * 
 * @example
 * ```typescript
 * const quest = await createQuest({
 *   title: 'Complete daily workout',
 *   category: 'Health',
 *   difficulty: 'medium',
 *   rewardXp: 100
 * });
 * ```
 */
export async function createQuest(payload: QuestCreateInput): Promise<Quest> {
  const operation = 'createQuest';
  logger.debug('Entering createQuest', { operation, inputPayload: payload });
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to create a quest.');
  }

  // Validate input before API call
  let validatedPayload: QuestCreateInput;
  try {
    validatedPayload = QuestCreateInputSchema.parse(payload) as QuestCreateInput;
  } catch (error: any) {
    logger.error('Input validation failed', { operation, error });
    throw new Error(error?.issues?.[0]?.message || 'Invalid quest data');
  }

  logger.info('Creating quest', { operation, payload: validatedPayload });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    logger.debug('Sending request to API', {
        operation,
        url: '/quests/createQuest',
        method: 'POST',
        requestId,
        retryCount,
        body: validatedPayload
    });

    const response = await authFetch('/quests/createQuest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
        'x-request-id': requestId,
        'x-client-version': getClientVersion(),
      },
      body: JSON.stringify(validatedPayload)
    });

    if (!response.ok) {
      await handleQuestApiError(
        response, 
        '/quests/createQuest', 
        payload, 
        'createQuest',
        undefined,
        validatedPayload.linkedGoalIds?.[0],
        retryCount,
        startTime
      );
    }

    const questData = await response.json();
    logger.debug('Received successful API response', { operation, questData });
    const quest = validateQuestResponse(questData);
    const duration = Date.now() - startTime;
    logger.info('Quest created successfully', { 
      operation,
      questId: quest.id,
      duration,
      requestId
    });
    
    return quest;
  });
}

/**
 * Start a quest (draft → active)
 * 
 * @param questId - Quest ID to start
 * @returns Promise<Quest> - Updated quest object
 * 
 * @example
 * ```typescript
 * const quest = await startQuest('quest-123');
 * ```
 */
export async function startQuest(questId: string): Promise<Quest> {
  const operation = 'startQuest';
  logger.debug('Entering startQuest', { operation, questId });
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to start a quest.');
  }

  logger.info('Starting quest', { operation, questId });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    logger.debug('Sending request to API', {
        operation,
        url: `/quests/quests/${questId}/start`,
        method: 'POST',
        requestId,
        retryCount,
    });
    
    const response = await authFetch(`/quests/quests/${questId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
        'x-request-id': requestId,
        'x-client-version': getClientVersion(),
      }
    });

    if (!response.ok) {
      await handleQuestApiError(
        response, 
        `/quests/quests/${questId}/start`, 
        { questId }, 
        'startQuest',
        questId,
        undefined,
        retryCount,
        startTime
      );
    }

    const questData = await response.json();
    logger.debug('Received successful API response', { operation, questData });
    const quest = validateQuestResponse(questData);
    const duration = Date.now() - startTime;
    logger.info('Quest started successfully', { 
      operation,
      questId,
      duration,
      requestId
    });
    
    return quest;
  });
}

/**
 * Edit a quest (draft only)
 * 
 * @param questId - Quest ID to edit
 * @param payload - Quest update input
 * @returns Promise<Quest> - Updated quest object
 * 
 * @example
 * ```typescript
 * const quest = await editQuest('quest-123', {
 *   title: 'Updated quest title',
 *   description: 'New description'
 * });
 * ```
 */
export async function editQuest(questId: string, payload: QuestUpdateInput): Promise<Quest> {
  const operation = 'editQuest';
  logger.debug('Entering editQuest', { operation, questId, payload });
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to edit a quest.');
  }

  // Validate input before API call
  let validatedPayload: QuestUpdateInput;
  try {
    validatedPayload = QuestUpdateInputSchema.parse(payload);
  } catch (error: any) {
    logger.error('Input validation failed', { operation, error });
    throw new Error(error?.issues?.[0]?.message || 'Invalid quest update data');
  }

  logger.info('Editing quest', { operation, questId, payload: validatedPayload });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    logger.debug('Sending request to API', {
        operation,
        url: `/quests/quests/${questId}`,
        method: 'PUT',
        requestId,
        retryCount,
        body: validatedPayload
    });

    const response = await authFetch(`/quests/quests/${questId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
        'x-request-id': requestId,
        'x-client-version': getClientVersion(),
      },
      body: JSON.stringify(validatedPayload)
    });

    if (!response.ok) {
      await handleQuestApiError(
        response, 
        `/quests/quests/${questId}`, 
        { questId, payload }, 
        'editQuest',
        questId,
        undefined,
        retryCount,
        startTime
      );
    }

    const questData = await response.json();
    logger.debug('Received successful API response', { operation, questData });
    const quest = validateQuestResponse(questData);
    const duration = Date.now() - startTime;
    logger.info('Quest edited successfully', { 
      operation,
      questId,
      duration,
      requestId
    });
    
    return quest;
  });
}

/**
 * Cancel a quest (active → cancelled)
 * 
 * @param questId - Quest ID to cancel
 * @param payload - Optional cancellation reason
 * @returns Promise<Quest> - Updated quest object
 * 
 * @example
 * ```typescript
 * const quest = await cancelQuest('quest-123', { reason: 'No longer needed' });
 * ```
 */
export async function cancelQuest(questId: string, payload?: QuestCancelInput): Promise<Quest> {
  const operation = 'cancelQuest';
  logger.debug('Entering cancelQuest', { operation, questId, payload });
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to cancel a quest.');
  }

  // Validate input before API call
  let validatedPayload: QuestCancelInput = {};
  if (payload) {
    try {
      validatedPayload = QuestCancelInputSchema.parse(payload);
    } catch (error: any) {
      logger.error('Input validation failed', { operation, error });
      throw new Error(error?.issues?.[0]?.message || 'Invalid quest cancellation data');
    }
  }

  logger.info('Cancelling quest', { operation, questId, payload: validatedPayload });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    logger.debug('Sending request to API', {
        operation,
        url: `/quests/quests/${questId}/cancel`,
        method: 'POST',
        requestId,
        retryCount,
        body: validatedPayload
    });
    
    const response = await authFetch(`/quests/quests/${questId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
        'x-request-id': requestId,
        'x-client-version': getClientVersion(),
      },
      body: JSON.stringify(validatedPayload)
    });

    if (!response.ok) {
      await handleQuestApiError(
        response, 
        `/quests/quests/${questId}/cancel`, 
        { questId, payload }, 
        'cancelQuest',
        questId,
        undefined,
        retryCount,
        startTime
      );
    }

    const questData = await response.json();
    logger.debug('Received successful API response', { operation, questData });
    const quest = validateQuestResponse(questData);
    const duration = Date.now() - startTime;
    logger.info('Quest cancelled successfully', { 
      operation,
      questId,
      duration,
      requestId
    });
    
    return quest;
  });
}

/**
 * Mark a quest as failed (active → failed)
 * 
 * @param questId - Quest ID to mark as failed
 * @returns Promise<Quest> - Updated quest object
 * 
 * @example
 * ```typescript
 * const quest = await failQuest('quest-123');
 * ```
 */
export async function failQuest(questId: string): Promise<Quest> {
  const operation = 'failQuest';
  logger.debug('Entering failQuest', { operation, questId });
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to mark a quest as failed.');
  }

  logger.info('Marking quest as failed', { operation, questId });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    logger.debug('Sending request to API', {
        operation,
        url: `/quests/quests/${questId}/fail`,
        method: 'POST',
        requestId,
        retryCount,
    });
    
    const response = await authFetch(`/quests/quests/${questId}/fail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
        'x-request-id': requestId,
        'x-client-version': getClientVersion(),
      }
    });

    if (!response.ok) {
      await handleQuestApiError(
        response, 
        `/quests/quests/${questId}/fail`, 
        { questId }, 
        'failQuest',
        questId,
        undefined,
        retryCount,
        startTime
      );
    }

    const questData = await response.json();
    logger.debug('Received successful API response', { operation, questData });
    const quest = validateQuestResponse(questData);
    const duration = Date.now() - startTime;
    logger.info('Quest marked as failed successfully', { 
      operation,
      questId,
      duration,
      requestId
    });
    
    return quest;
  });
}

/**
 * Delete a quest (admin-only for active+ quests)
 * 
 * @param questId - Quest ID to delete
 * @returns Promise<void>
 * 
 * @example
 * ```typescript
 * await deleteQuest('quest-123');
 * ```
 */
export async function deleteQuest(questId: string): Promise<void> {
  const operation = 'deleteQuest';
  logger.debug('Entering deleteQuest', { operation, questId });
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to delete a quest.');
  }

  logger.info('Deleting quest', { operation, questId });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    logger.debug('Sending request to API', {
        operation,
        url: `/quests/quests/${questId}`,
        method: 'DELETE',
        requestId,
        retryCount,
    });
    
    const response = await authFetch(`/quests/quests/${questId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
        'x-request-id': requestId,
        'x-client-version': getClientVersion(),
      }
    });

    if (!response.ok) {
      await handleQuestApiError(
        response, 
        `/quests/quests/${questId}`, 
        { questId }, 
        'deleteQuest',
        questId,
        undefined,
        retryCount,
        startTime
      );
    }

    const duration = Date.now() - startTime;
    logger.info('Quest deleted successfully', { 
      operation,
      questId,
      duration,
      requestId
    });
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get client version for request tracking
 */
function getClientVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
}

/**
 * Validate quest response data
 */
function validateQuestResponse(data: any): Quest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid quest response: expected object');
  }

  const requiredFields = ['id', 'userId', 'title', 'status', 'category', 'difficulty', 'rewardXp'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Invalid quest response: missing required field '${field}'`);
    }
  }

  return data as Quest;
}

/**
 * Retry mechanism for network errors
 */
async function withRetry<T>(
  operation: (retryCount: number) => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt - 1);
    } catch (error: any) {
      lastError = error;
      
      // Don't retry for authentication or validation errors
      if (error.message?.includes('signed in') || 
          error.message?.includes('Invalid') ||
          error.message?.includes('permission')) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      logger.warn(`Retry attempt ${attempt}/${maxRetries}`, { 
        error: error.message,
        attempt,
        maxRetries,
        nextRetryIn: delay * attempt
      });
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Quest API error interface for structured error handling
 */
export interface QuestApiError {
  status: number;
  statusText: string;
  errorBody: any;
  url: string;
  input?: any;
  timestamp: string;
  userId?: string;
  requestId?: string;
  clientVersion?: string;
  userAgent?: string;
  operation?: string;
  questId?: string;
  goalId?: string;
  retryCount?: number;
  duration?: number;
}

/**
 * Handle quest API errors with comprehensive logging
 * 
 * @param response - Failed response object
 * @param url - API endpoint URL
 * @param input - Input data that caused the error
 * @param operation - Operation name for context
 * @param questId - Quest ID if applicable
 * @param goalId - Goal ID if applicable
 * @param retryCount - Number of retry attempts
 * @param startTime - Request start time for duration calculation
 * @throws Error with user-friendly message
 */
async function handleQuestApiError(
  response: Response, 
  url: string, 
  input?: any,
  operation?: string,
  questId?: string,
  goalId?: string,
  retryCount?: number,
  startTime?: number
): Promise<never> {
  const errorBody = await response.json().catch(() => ({}));
  const duration = startTime ? Date.now() - startTime : undefined;
  
  // Extract user context
  const token = getAccessToken();
  const userId = token ? extractUserIdFromToken(token) : undefined;
  
  // Extract request ID from headers if available
  const requestId = response.headers.get('x-request-id') || 
                   response.headers.get('x-correlation-id') || 
                   generateRequestId();
  
  const errorInfo: QuestApiError = {
    status: response.status,
    statusText: response.statusText,
    errorBody,
    url,
    input,
    timestamp: new Date().toISOString(),
    userId,
    requestId,
    clientVersion: getClientVersion(),
    userAgent: navigator.userAgent,
    operation,
    questId,
    goalId,
    retryCount,
    duration
  };

  // Enhanced error logging with more context
  logger.error('API Error occurred', {
    ...errorInfo,
    // Additional debugging context
    environment: import.meta.env.MODE,
    apiBase: getApiBase(),
    responseHeaders: response.headers && typeof response.headers.entries === 'function' 
      ? Object.fromEntries(response.headers.entries())
      : {},
    stackTrace: new Error().stack,
    memoryUsage: (performance as any).memory ? {
      used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
    } : undefined
  });

  // Determine user-friendly error message
  let message = 'An unexpected error occurred';
  
  if (response.status === 401) {
    message = 'You must be signed in to perform this action';
  } else if (response.status === 403) {
    message = 'You do not have permission to perform this action';
  } else if (response.status === 404) {
    message = 'Quest not found';
  } else if (response.status === 409) {
    message = 'Quest was modified by another operation. Please refresh and try again';
  } else if (response.status >= 500) {
    message = 'Server error. Please try again later';
  } else {
    // For other errors, use the error body detail if available
    message = errorBody.detail || response.statusText || 'An unexpected error occurred';
  }

  // Add request ID to error message for support purposes
  const errorMessage = `${message} (Request ID: ${requestId})`;
  const error = new Error(errorMessage);
  reportError(error, errorInfo);
  throw error;
}

/**
 * Extract user ID from JWT token for debugging context
 */
function extractUserIdFromToken(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.user_id || payload.userId;
  } catch {
    return undefined;
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Quest API response types for type safety
 */
export type QuestApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

/**
 * Quest list response with metadata
 */
export interface QuestListResponse {
  quests: Quest[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Export all functions and types
// ============================================================================

// All functions and types are already exported individually above
