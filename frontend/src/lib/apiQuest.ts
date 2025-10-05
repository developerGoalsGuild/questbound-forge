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
  query MyQuests($goalId: ID) {
    myQuests(goalId: $goalId) {
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
      kind
      linkedGoalIds
      linkedTaskIds
      dependsOnQuestIds
      targetCount
      countScope
      startAt
      periodSeconds
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
  try {
    console.info('[Quest API] Loading quests', { goalId });
    
    const data = await graphqlRaw<{ myQuests: Quest[] }>(MY_QUESTS, { goalId });
    const quests = data?.myQuests ?? [];
    
    console.info('[Quest API] Loaded quests successfully', { 
      count: quests.length, 
      goalId 
    });
    
    return quests;
  } catch (error: any) {
    console.error('[Quest API] Failed to load quests:', {
      error: error?.message || error,
      goalId,
      timestamp: new Date().toISOString()
    });
    throw new Error(error?.message || 'Failed to load quests');
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
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to create a quest.');
  }

  // Validate input before API call
  let validatedPayload: QuestCreateInput;
  try {
    validatedPayload = QuestCreateInputSchema.parse(payload) as QuestCreateInput;
  } catch (error: any) {
    console.error('[Quest API] Input validation failed:', error);
    throw new Error(error?.issues?.[0]?.message || 'Invalid quest data');
  }

  console.info('[Quest API] Creating quest', { payload: validatedPayload });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
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
    const quest = validateQuestResponse(questData);
    console.info('[Quest API] Quest created successfully', { 
      questId: quest.id,
      duration: Date.now() - startTime,
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
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to start a quest.');
  }

  console.info('[Quest API] Starting quest', { questId });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
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
    const quest = validateQuestResponse(questData);
    console.info('[Quest API] Quest started successfully', { 
      questId,
      duration: Date.now() - startTime,
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
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to edit a quest.');
  }

  // Validate input before API call
  let validatedPayload: QuestUpdateInput;
  try {
    validatedPayload = QuestUpdateInputSchema.parse(payload);
  } catch (error: any) {
    console.error('[Quest API] Input validation failed:', error);
    throw new Error(error?.issues?.[0]?.message || 'Invalid quest update data');
  }

  console.info('[Quest API] Editing quest', { questId, payload: validatedPayload });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
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
    const quest = validateQuestResponse(questData);
    console.info('[Quest API] Quest edited successfully', { 
      questId,
      duration: Date.now() - startTime,
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
      console.error('[Quest API] Input validation failed:', error);
      throw new Error(error?.issues?.[0]?.message || 'Invalid quest cancellation data');
    }
  }

  console.info('[Quest API] Cancelling quest', { questId, payload: validatedPayload });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
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
    const quest = validateQuestResponse(questData);
    console.info('[Quest API] Quest cancelled successfully', { 
      questId,
      duration: Date.now() - startTime,
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
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to mark a quest as failed.');
  }

  console.info('[Quest API] Marking quest as failed', { questId });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
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
    const quest = validateQuestResponse(questData);
    console.info('[Quest API] Quest marked as failed successfully', { 
      questId,
      duration: Date.now() - startTime,
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
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be signed in to delete a quest.');
  }

  console.info('[Quest API] Deleting quest', { questId });

  return withRetry(async (retryCount = 0) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
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

    console.info('[Quest API] Quest deleted successfully', { 
      questId,
      duration: Date.now() - startTime,
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
      
      console.warn(`[Quest API] Retry attempt ${attempt}/${maxRetries}`, { 
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
  console.error('[Quest API] Error occurred:', {
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
  throw new Error(errorMessage);
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
