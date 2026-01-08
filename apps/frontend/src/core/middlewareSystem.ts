/**
 * Middleware System
 * Cross-cutting concerns for messaging system (logging, analytics, caching, etc.)
 */

export interface MiddlewareContext {
  action: string;
  payload: any;
  metadata: Record<string, any>;
  timestamp: Date;
  userId?: string;
  roomId?: string;
}

export interface MiddlewareResult {
  success: boolean;
  data?: any;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface Middleware {
  name: string;
  priority: number;
  before?: (context: MiddlewareContext) => Promise<MiddlewareContext> | MiddlewareContext;
  after?: (context: MiddlewareContext, result: MiddlewareResult) => Promise<MiddlewareResult> | MiddlewareResult;
  error?: (context: MiddlewareContext, error: Error) => Promise<MiddlewareResult> | MiddlewareResult;
}

export interface MiddlewarePipeline {
  execute<T>(
    action: string,
    payload: any,
    handler: (context: MiddlewareContext) => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T>;
}

export class MiddlewareManager implements MiddlewarePipeline {
  private middlewares: Middleware[] = [];
  private isEnabled = true;

  /**
   * Register a middleware
   */
  register(middleware: Middleware): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Unregister a middleware
   */
  unregister(name: string): boolean {
    const index = this.middlewares.findIndex(m => m.name === name);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Execute middleware pipeline
   */
  async execute<T>(
    action: string,
    payload: any,
    handler: (context: MiddlewareContext) => Promise<T> | T,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    if (!this.isEnabled) {
      return handler(this.createContext(action, payload, metadata));
    }

    let context = this.createContext(action, payload, metadata);
    let result: MiddlewareResult;

    try {
      // Execute before middlewares
      for (const middleware of this.middlewares) {
        if (middleware.before) {
          context = await middleware.before(context);
        }
      }

      // Execute main handler
      const data = await handler(context);
      result = { success: true, data };

      // Execute after middlewares
      for (const middleware of this.middlewares) {
        if (middleware.after) {
          result = await middleware.after(context, result);
        }
      }

      return result.data as T;

    } catch (error) {
      result = { success: false, error: error as Error };

      // Execute error middlewares
      for (const middleware of this.middlewares) {
        if (middleware.error) {
          result = await middleware.error(context, error as Error);
        }
      }

      throw result.error || error;
    }
  }

  /**
   * Enable/disable middleware
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered middlewares
   */
  getMiddlewares(): Middleware[] {
    return [...this.middlewares];
  }

  /**
   * Clear all middlewares
   */
  clear(): void {
    this.middlewares = [];
  }

  private createContext(action: string, payload: any, metadata: Record<string, any>): MiddlewareContext {
    return {
      action,
      payload,
      metadata,
      timestamp: new Date(),
      userId: metadata.userId,
      roomId: metadata.roomId
    };
  }
}

// Built-in middlewares

export class LoggingMiddleware implements Middleware {
  name = 'logging';
  priority = 1;

  constructor(private config: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logActions: string[];
    logPayload: boolean;
  } = {
    logLevel: 'info',
    logActions: ['*'],
    logPayload: false
  }) {}

  async before(context: MiddlewareContext): Promise<MiddlewareContext> {
    if (this.shouldLog(context.action)) {
      console.log(`[${this.config.logLevel.toUpperCase()}] Action started: ${context.action}`, {
        payload: this.config.logPayload ? context.payload : '[hidden]',
        metadata: context.metadata,
        timestamp: context.timestamp
      });
    }
    return context;
  }

  async after(context: MiddlewareContext, result: MiddlewareResult): Promise<MiddlewareResult> {
    if (this.shouldLog(context.action)) {
      console.log(`[${this.config.logLevel.toUpperCase()}] Action completed: ${context.action}`, {
        success: result.success,
        error: result.error?.message,
        duration: Date.now() - context.timestamp.getTime()
      });
    }
    return result;
  }

  async error(context: MiddlewareContext, error: Error): Promise<MiddlewareResult> {
    if (this.shouldLog(context.action)) {
      console.error(`[ERROR] Action failed: ${context.action}`, {
        error: error.message,
        stack: error.stack,
        payload: this.config.logPayload ? context.payload : '[hidden]'
      });
    }
    return { success: false, error };
  }

  private shouldLog(action: string): boolean {
    return this.config.logActions.includes('*') || this.config.logActions.includes(action);
  }
}

export class AnalyticsMiddleware implements Middleware {
  name = 'analytics';
  priority = 2;

  constructor(private config: {
    trackActions: string[];
    enableMetrics: boolean;
    customProperties?: (context: MiddlewareContext) => Record<string, any>;
  } = {
    trackActions: ['*'],
    enableMetrics: true
  }) {}

  async before(context: MiddlewareContext): Promise<MiddlewareContext> {
    if (this.shouldTrack(context.action)) {
      this.trackEvent('action_started', context);
    }
    return context;
  }

  async after(context: MiddlewareContext, result: MiddlewareResult): Promise<MiddlewareResult> {
    if (this.shouldTrack(context.action)) {
      this.trackEvent('action_completed', context, {
        success: result.success,
        duration: Date.now() - context.timestamp.getTime()
      });
    }
    return result;
  }

  async error(context: MiddlewareContext, error: Error): Promise<MiddlewareResult> {
    if (this.shouldTrack(context.action)) {
      this.trackEvent('action_failed', context, {
        error: error.message,
        errorType: error.constructor.name
      });
    }
    return { success: false, error };
  }

  private shouldTrack(action: string): boolean {
    return this.config.trackActions.includes('*') || this.config.trackActions.includes(action);
  }

  private trackEvent(eventName: string, context: MiddlewareContext, properties: Record<string, any> = {}): void {
    const eventProperties = {
      action: context.action,
      userId: context.userId,
      roomId: context.roomId,
      timestamp: context.timestamp,
      ...properties,
      ...(this.config.customProperties ? this.config.customProperties(context) : {})
    };

    console.log(`[Analytics] ${eventName}:`, eventProperties);
    // Here you would send to your analytics service
  }
}

export class CachingMiddleware implements Middleware {
  name = 'caching';
  priority = 3;

  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(private config: {
    ttl: number;
    maxSize: number;
    cacheActions: string[];
  } = {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    cacheActions: ['get_messages', 'get_room_info']
  }) {}

  async before(context: MiddlewareContext): Promise<MiddlewareContext> {
    if (this.shouldCache(context.action)) {
      const cacheKey = this.getCacheKey(context);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        // Return cached result
        context.metadata.cached = true;
        context.metadata.cachedData = cached.data;
      }
    }
    return context;
  }

  async after(context: MiddlewareContext, result: MiddlewareResult): Promise<MiddlewareResult> {
    if (this.shouldCache(context.action) && result.success && !context.metadata.cached) {
      const cacheKey = this.getCacheKey(context);
      this.setCache(cacheKey, result.data);
    }
    return result;
  }

  private shouldCache(action: string): boolean {
    return this.config.cacheActions.includes('*') || this.config.cacheActions.includes(action);
  }

  private getCacheKey(context: MiddlewareContext): string {
    return `${context.action}_${JSON.stringify(context.payload)}`;
  }

  private setCache(key: string, data: any): void {
    // Implement LRU eviction
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.ttl
    });
  }
}

export class ValidationMiddleware implements Middleware {
  name = 'validation';
  priority = 4;

  constructor(private validators: Record<string, (payload: any) => boolean> = {}) {}

  async before(context: MiddlewareContext): Promise<MiddlewareContext> {
    const validator = this.validators[context.action];
    if (validator && !validator(context.payload)) {
      throw new Error(`Validation failed for action: ${context.action}`);
    }
    return context;
  }
}

export class RateLimitMiddleware implements Middleware {
  name = 'rate_limit';
  priority = 5;

  private requests = new Map<string, number[]>();

  constructor(private config: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (context: MiddlewareContext) => string;
  } = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    keyGenerator: (context) => context.userId || 'anonymous'
  }) {}

  async before(context: MiddlewareContext): Promise<MiddlewareContext> {
    const key = this.config.keyGenerator!(context);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.config.maxRequests) {
      throw new Error(`Rate limit exceeded for user: ${key}`);
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return context;
  }
}

export class CircuitBreakerMiddleware implements Middleware {
  name = 'circuit_breaker';
  priority = 6;

  private states = new Map<string, {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailure: number;
    nextAttempt: number;
  }>();

  constructor(private config: {
    failureThreshold: number;
    recoveryTimeout: number;
    keyGenerator?: (context: MiddlewareContext) => string;
  } = {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    keyGenerator: (context) => context.action
  }) {}

  async before(context: MiddlewareContext): Promise<MiddlewareContext> {
    const key = this.config.keyGenerator!(context);
    const circuitState = this.states.get(key) || {
      state: 'closed',
      failures: 0,
      lastFailure: 0,
      nextAttempt: 0
    };

    if (circuitState.state === 'open') {
      if (Date.now() < circuitState.nextAttempt) {
        throw new Error(`Circuit breaker is open for: ${key}`);
      }
      circuitState.state = 'half-open';
    }

    return context;
  }

  async after(context: MiddlewareContext, result: MiddlewareResult): Promise<MiddlewareResult> {
    const key = this.config.keyGenerator!(context);
    const circuitState = this.states.get(key)!;

    if (result.success) {
      circuitState.state = 'closed';
      circuitState.failures = 0;
    } else {
      circuitState.failures++;
      circuitState.lastFailure = Date.now();
      
      if (circuitState.failures >= this.config.failureThreshold) {
        circuitState.state = 'open';
        circuitState.nextAttempt = Date.now() + this.config.recoveryTimeout;
      }
    }

    this.states.set(key, circuitState);
    return result;
  }
}

// Global middleware manager
export const middlewareManager = new MiddlewareManager();

// Register default middlewares
middlewareManager.register(new LoggingMiddleware());
middlewareManager.register(new AnalyticsMiddleware());
middlewareManager.register(new CachingMiddleware());
middlewareManager.register(new ValidationMiddleware());
middlewareManager.register(new RateLimitMiddleware());
middlewareManager.register(new CircuitBreakerMiddleware());
