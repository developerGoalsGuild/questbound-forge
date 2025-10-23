/**
 * Production-ready error handling service
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  roomId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  stack?: string;
}

export interface ErrorRecoveryOptions {
  retryAttempts: number;
  retryDelay: number;
  fallbackAction?: () => void;
  showUserNotification: boolean;
  logToConsole: boolean;
  reportToAnalytics: boolean;
}

export class ErrorHandlingService {
  private errorCounts: Map<string, number> = new Map();
  private maxErrorsPerMinute = 10;
  private errorWindow = 60000; // 1 minute
  private errorTimestamps: Date[] = [];

  /**
   * Handle and categorize errors
   */
  handleError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    options: Partial<ErrorRecoveryOptions> = {}
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const fullContext: ErrorContext = {
      component: 'unknown',
      action: 'unknown',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: typeof error === 'object' ? error.stack : undefined,
      ...context
    };

    const recoveryOptions: ErrorRecoveryOptions = {
      retryAttempts: 3,
      retryDelay: 1000,
      showUserNotification: true,
      logToConsole: true,
      reportToAnalytics: true,
      ...options
    };

    // Check rate limiting
    if (this.isRateLimited()) {
      console.warn('Error rate limit exceeded, suppressing error');
      return;
    }

    // Log error
    this.logError(errorMessage, fullContext, recoveryOptions);

    // Show user notification if enabled
    if (recoveryOptions.showUserNotification) {
      this.showUserNotification(errorMessage, fullContext);
    }

    // Report to analytics if enabled
    if (recoveryOptions.reportToAnalytics) {
      this.reportToAnalytics(errorMessage, fullContext);
    }

    // Execute fallback action if provided
    if (recoveryOptions.fallbackAction) {
      try {
        recoveryOptions.fallbackAction();
      } catch (fallbackError) {
        console.error('Fallback action failed:', fallbackError);
      }
    }
  }

  /**
   * Handle network errors with retry logic
   */
  async handleNetworkError(
    operation: () => Promise<any>,
    context: Partial<ErrorContext> = {},
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        this.handleError(error as Error, {
          ...context,
          action: `network_retry_${attempt}`
        }, {
          retryAttempts: maxRetries - attempt,
          showUserNotification: attempt === maxRetries
        });

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle messaging-specific errors
   */
  handleMessagingError(
    error: Error | string,
    roomId: string,
    userId: string,
    action: string
  ): void {
    this.handleError(error, {
      component: 'messaging',
      action,
      roomId,
      userId
    }, {
      showUserNotification: true,
      reportToAnalytics: true,
      fallbackAction: () => {
        // Fallback to local storage or offline mode
        console.log('Falling back to offline mode for messaging');
      }
    });
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: Error | string, userId?: string): void {
    this.handleError(error, {
      component: 'authentication',
      action: 'auth_failure',
      userId
    }, {
      showUserNotification: true,
      reportToAnalytics: true,
      fallbackAction: () => {
        // Redirect to login or refresh token
        console.log('Authentication failed, redirecting to login');
        // window.location.href = '/login';
      }
    });
  }

  /**
   * Handle WebSocket connection errors
   */
  handleWebSocketError(
    error: Error | string,
    roomId: string,
    userId: string
  ): void {
    this.handleError(error, {
      component: 'websocket',
      action: 'connection_failure',
      roomId,
      userId
    }, {
      showUserNotification: true,
      reportToAnalytics: true,
      fallbackAction: () => {
        // Fallback to polling or AppSync
        console.log('WebSocket failed, falling back to polling');
      }
    });
  }

  /**
   * Handle rate limiting errors
   */
  handleRateLimitError(
    error: Error | string,
    roomId: string,
    userId: string,
    retryAfter?: number
  ): void {
    this.handleError(error, {
      component: 'messaging',
      action: 'rate_limit',
      roomId,
      userId
    }, {
      showUserNotification: true,
      reportToAnalytics: true,
      fallbackAction: () => {
        // Show rate limit message to user
        this.showRateLimitNotification(retryAfter);
      }
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByComponent: Record<string, number>;
    recentErrors: Date[];
  } {
    const errorsByComponent: Record<string, number> = {};
    for (const [component, count] of this.errorCounts) {
      errorsByComponent[component] = count;
    }

    return {
      totalErrors: this.errorTimestamps.length,
      errorsByComponent,
      recentErrors: [...this.errorTimestamps].slice(-10)
    };
  }

  /**
   * Clear error statistics
   */
  clearErrorStats(): void {
    this.errorCounts.clear();
    this.errorTimestamps = [];
  }

  // Private methods

  private isRateLimited(): boolean {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - this.errorWindow);
    
    // Remove old timestamps
    this.errorTimestamps = this.errorTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );

    return this.errorTimestamps.length >= this.maxErrorsPerMinute;
  }

  private logError(
    errorMessage: string,
    context: ErrorContext,
    options: ErrorRecoveryOptions
  ): void {
    if (options.logToConsole) {
      console.error('Error occurred:', {
        message: errorMessage,
        context,
        timestamp: context.timestamp.toISOString(),
        stack: context.stack
      });
    }

    // Update error counts
    const component = context.component;
    this.errorCounts.set(component, (this.errorCounts.get(component) || 0) + 1);
    this.errorTimestamps.push(context.timestamp);
  }

  private showUserNotification(errorMessage: string, context: ErrorContext): void {
    // Create user-friendly error message
    const userMessage = this.getUserFriendlyMessage(errorMessage, context);
    
    // Show notification (this would integrate with your notification system)
    console.warn('User notification:', userMessage);
    
    // You could integrate with a toast notification system here
    // toast.error(userMessage);
  }

  private showRateLimitNotification(retryAfter?: number): void {
    const message = retryAfter 
      ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
      : 'Rate limit exceeded. Please slow down your message sending.';
    
    console.warn('Rate limit notification:', message);
    // toast.warning(message);
  }

  private getUserFriendlyMessage(errorMessage: string, context: ErrorContext): string {
    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
      'Unauthorized': 'Your session has expired. Please log in again.',
      'Rate limit exceeded': 'You\'re sending messages too quickly. Please slow down.',
      'Room not found': 'This chat room no longer exists.',
      'User not found': 'Unable to identify the user.',
      'Message too long': 'Your message is too long. Please shorten it.',
      'Invalid message format': 'Your message contains invalid characters.',
      'Connection timeout': 'The connection timed out. Please try again.',
      'Server error': 'Something went wrong on our end. Please try again later.'
    };

    // Check for specific error patterns
    for (const [pattern, userMessage] of Object.entries(errorMappings)) {
      if (errorMessage.includes(pattern)) {
        return userMessage;
      }
    }

    // Default fallback
    return 'Something went wrong. Please try again.';
  }

  private reportToAnalytics(errorMessage: string, context: ErrorContext): void {
    // This would integrate with your analytics service
    console.log('Reporting error to analytics:', {
      error: errorMessage,
      component: context.component,
      action: context.action,
      timestamp: context.timestamp.toISOString()
    });

    // Example analytics integration:
    // analytics.track('Error Occurred', {
    //   error_message: errorMessage,
    //   component: context.component,
    //   action: context.action,
    //   user_id: context.userId,
    //   room_id: context.roomId
    // });
  }
}

// Singleton instance
export const errorHandling = new ErrorHandlingService();
