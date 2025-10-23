/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and provides automatic recovery
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
  enableMetrics: boolean;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  successes: number;
  lastFailure: number;
  nextAttempt: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

export interface CircuitBreakerMetrics {
  state: string;
  failureRate: number;
  successRate: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  uptime: number;
  lastFailure?: Date;
}

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private startTime: Date;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      halfOpenMaxCalls: 3,
      enableMetrics: true,
      ...config
    };

    this.state = {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailure: 0,
      nextAttempt: 0,
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0
    };

    this.startTime = new Date();
    this.startMonitoring();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T> | T,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    this.state.totalCalls++;

    // Check if circuit breaker should allow the call
    if (!this.canExecute()) {
      if (fallback) {
        return await fallback();
      }
      throw new Error(`Circuit breaker is ${this.state.state}`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if the circuit breaker can execute
   */
  canExecute(): boolean {
    const now = Date.now();

    switch (this.state.state) {
      case 'closed':
        return true;

      case 'open':
        if (now >= this.state.nextAttempt) {
          this.state.state = 'half-open';
          this.state.failures = 0;
          this.state.successes = 0;
          return true;
        }
        return false;

      case 'half-open':
        return this.state.successes < this.config.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Get metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const now = Date.now();
    const uptime = now - this.startTime.getTime();
    const totalCalls = this.state.totalCalls;
    const totalFailures = this.state.totalFailures;
    const totalSuccesses = this.state.totalSuccesses;

    return {
      state: this.state.state,
      failureRate: totalCalls > 0 ? (totalFailures / totalCalls) * 100 : 0,
      successRate: totalCalls > 0 ? (totalSuccesses / totalCalls) * 100 : 0,
      totalCalls,
      totalFailures,
      totalSuccesses,
      uptime,
      lastFailure: this.state.lastFailure > 0 ? new Date(this.state.lastFailure) : undefined
    };
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailure: 0,
      nextAttempt: 0,
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0
    };
    this.startTime = new Date();
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    this.state.state = 'open';
    this.state.nextAttempt = Date.now() + this.config.recoveryTimeout;
  }

  /**
   * Manually close the circuit breaker
   */
  close(): void {
    this.state.state = 'closed';
    this.state.failures = 0;
    this.state.successes = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Dispose of the circuit breaker
   */
  dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  // Private methods

  private onSuccess(): void {
    this.state.successes++;
    this.state.totalSuccesses++;

    if (this.state.state === 'half-open') {
      // If we're in half-open state and getting successes, close the circuit
      if (this.state.successes >= this.config.halfOpenMaxCalls) {
        this.state.state = 'closed';
        this.state.failures = 0;
        this.state.successes = 0;
      }
    } else if (this.state.state === 'closed') {
      // Reset failure count on success
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.totalFailures++;
    this.state.lastFailure = Date.now();

    if (this.state.state === 'closed') {
      // Check if we should open the circuit
      if (this.state.failures >= this.config.failureThreshold) {
        this.state.state = 'open';
        this.state.nextAttempt = Date.now() + this.config.recoveryTimeout;
      }
    } else if (this.state.state === 'half-open') {
      // If we fail in half-open state, go back to open
      this.state.state = 'open';
      this.state.nextAttempt = Date.now() + this.config.recoveryTimeout;
    }
  }

  private startMonitoring(): void {
    if (!this.config.enableMetrics) return;

    this.monitoringInterval = setInterval(() => {
      this.logMetrics();
    }, this.config.monitoringPeriod);
  }

  private logMetrics(): void {
    const metrics = this.getMetrics();
    console.log('[CircuitBreaker] Metrics:', {
      state: metrics.state,
      failureRate: `${metrics.failureRate.toFixed(2)}%`,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      totalCalls: metrics.totalCalls,
      uptime: `${Math.round(metrics.uptime / 1000)}s`
    });
  }
}

// Circuit breaker manager for multiple services
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig: Partial<CircuitBreakerConfig> = {}) {
    this.defaultConfig = {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
      halfOpenMaxCalls: 3,
      enableMetrics: true,
      ...defaultConfig
    };
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const breakerConfig = { ...this.defaultConfig, ...config };
      this.breakers.set(serviceName, new CircuitBreaker(breakerConfig));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Execute with circuit breaker for a specific service
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T> | T,
    fallback?: () => Promise<T> | T,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, config);
    return breaker.execute(operation, fallback);
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    for (const [name, breaker] of this.breakers) {
      states[name] = breaker.getState();
    }
    return states;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Dispose of all circuit breakers
   */
  disposeAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.dispose();
    }
    this.breakers.clear();
  }
}

// Global circuit breaker manager
export const circuitBreakerManager = new CircuitBreakerManager();
