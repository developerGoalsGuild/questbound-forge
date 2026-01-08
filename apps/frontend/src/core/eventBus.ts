/**
 * Event Bus - Event-driven architecture implementation
 * Provides pub/sub pattern for loose coupling between services
 */

export interface Event {
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface EventHandler<T = any> {
  (event: Event & { payload: T }): void | Promise<void>;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  priority: number;
  once: boolean;
  filter?: (event: Event) => boolean;
}

export interface EventBusConfig {
  maxSubscribers: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}

export class EventBus {
  private subscribers = new Map<string, EventSubscription[]>();
  private config: EventBusConfig;
  private metrics = {
    eventsPublished: 0,
    eventsHandled: 0,
    eventsFailed: 0,
    subscribersCount: 0
  };

  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      maxSubscribers: 1000,
      enableLogging: true,
      enableMetrics: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T = any>(
    eventType: string,
    handler: EventHandler<T>,
    options: {
      priority?: number;
      once?: boolean;
      filter?: (event: Event) => boolean;
    } = {}
  ): string {
    const subscriptionId = this.generateId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      priority: options.priority ?? 0,
      once: options.once ?? false,
      filter: options.filter
    };

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const eventSubscribers = this.subscribers.get(eventType)!;
    eventSubscribers.push(subscription);
    
    // Sort by priority (higher priority first)
    eventSubscribers.sort((a, b) => b.priority - a.priority);

    this.metrics.subscribersCount++;
    this.log(`Subscribed to event: ${eventType}`, { subscriptionId });

    return subscriptionId;
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscribers] of this.subscribers) {
      const index = subscribers.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscribers.splice(index, 1);
        this.metrics.subscribersCount--;
        this.log(`Unsubscribed from event: ${eventType}`, { subscriptionId });
        return true;
      }
    }
    return false;
  }

  /**
   * Publish an event
   */
  async publish(eventType: string, payload: any, metadata: {
    source?: string;
    correlationId?: string;
    metadata?: Record<string, any>;
  } = {}): Promise<void> {
    const event: Event = {
      type: eventType,
      payload,
      timestamp: new Date(),
      source: metadata.source ?? 'unknown',
      correlationId: metadata.correlationId,
      metadata: metadata.metadata
    };

    this.metrics.eventsPublished++;
    this.log(`Publishing event: ${eventType}`, { payload, source: event.source });

    const subscribers = this.subscribers.get(eventType) || [];
    const handlers = subscribers.filter(sub => {
      if (sub.filter && !sub.filter(event)) {
        return false;
      }
      return true;
    });

    // Execute handlers in priority order
    for (const subscription of handlers) {
      try {
        await this.executeHandler(subscription, event);
        
        // Remove if it's a one-time subscription
        if (subscription.once) {
          this.unsubscribe(subscription.id);
        }
      } catch (error) {
        this.metrics.eventsFailed++;
        this.log(`Handler failed for event: ${eventType}`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          subscriptionId: subscription.id 
        });
        
        if (this.config.enableRetry) {
          await this.retryHandler(subscription, event);
        }
      }
    }
  }

  /**
   * Publish multiple events
   */
  async publishMany(events: Array<{ type: string; payload: any; metadata?: any }>): Promise<void> {
    await Promise.all(events.map(event => 
      this.publish(event.type, event.payload, event.metadata)
    ));
  }

  /**
   * Wait for an event
   */
  waitFor<T = any>(
    eventType: string,
    timeout: number = 5000,
    filter?: (event: Event) => boolean
  ): Promise<Event & { payload: T }> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const subscriptionId = this.subscribe<T>(eventType, (event) => {
        clearTimeout(timeoutId);
        this.unsubscribe(subscriptionId);
        resolve(event);
      }, { once: true, filter });
    });
  }

  /**
   * Get event metrics
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  /**
   * Get subscribers for an event type
   */
  getSubscribers(eventType: string): EventSubscription[] {
    return this.subscribers.get(eventType) || [];
  }

  /**
   * Get all event types
   */
  getEventTypes(): string[] {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Clear all subscribers
   */
  clear(): void {
    this.subscribers.clear();
    this.metrics = {
      eventsPublished: 0,
      eventsHandled: 0,
      eventsFailed: 0,
      subscribersCount: 0
    };
  }

  /**
   * Enable/disable logging
   */
  setLogging(enabled: boolean): void {
    this.config.enableLogging = enabled;
  }

  /**
   * Enable/disable metrics
   */
  setMetrics(enabled: boolean): void {
    this.config.enableMetrics = enabled;
  }

  // Private methods

  private async executeHandler(subscription: EventSubscription, event: Event): Promise<void> {
    await subscription.handler(event);
    this.metrics.eventsHandled++;
  }

  private async retryHandler(subscription: EventSubscription, event: Event): Promise<void> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        await this.executeHandler(subscription, event);
        return;
      } catch (error) {
        if (attempt === this.config.maxRetries) {
          this.log(`Handler failed after ${this.config.maxRetries} retries`, {
            eventType: event.type,
            subscriptionId: subscription.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  }

  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[EventBus] ${message}`, data);
    }
  }

  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global event bus instance
export const eventBus = new EventBus();
