/**
 * Comprehensive Logging and Tracing System
 * Provides structured logging, tracing, and observability
 */

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: Date;
  context: LogContext;
  metadata?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
}

export interface LogContext {
  component: string;
  action: string;
  userId?: string;
  roomId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
}

export interface TraceSpan {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'started' | 'completed' | 'failed';
  metadata: Record<string, any>;
  parentId?: string;
  children: string[];
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  enableConsole: boolean;
  enableRemote: boolean;
  enableTracing: boolean;
  enableMetrics: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  maxEntries: number;
}

export class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private traces = new Map<string, TraceSpan>();
  private currentTraceId?: string;
  private currentSpanId?: string;
  private flushTimer?: NodeJS.Timeout;
  private metrics = {
    totalLogs: 0,
    logsByLevel: {} as Record<string, number>,
    totalTraces: 0,
    activeSpans: 0
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableRemote: false,
      enableTracing: true,
      enableMetrics: true,
      batchSize: 100,
      flushInterval: 5000,
      maxEntries: 10000,
      ...config
    };

    this.startFlushTimer();
  }

  /**
   * Log a message
   */
  log(
    level: LogEntry['level'],
    message: string,
    context: LogContext,
    metadata?: Record<string, any>
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      metadata,
      traceId: this.currentTraceId,
      spanId: this.currentSpanId
    };

    this.entries.push(entry);
    this.updateMetrics(level);

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableRemote && this.entries.length >= this.config.batchSize) {
      this.flush();
    }

    // Trim entries if too many
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }
  }

  /**
   * Debug logging
   */
  debug(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('debug', message, context, metadata);
  }

  /**
   * Info logging
   */
  info(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('info', message, context, metadata);
  }

  /**
   * Warning logging
   */
  warn(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('warn', message, context, metadata);
  }

  /**
   * Error logging
   */
  error(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('error', message, context, metadata);
  }

  /**
   * Fatal logging
   */
  fatal(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('fatal', message, context, metadata);
  }

  /**
   * Start a trace
   */
  startTrace(name: string, metadata: Record<string, any> = {}): string {
    if (!this.config.enableTracing) return '';

    const traceId = this.generateId();
    const spanId = this.generateId();
    
    this.currentTraceId = traceId;
    this.currentSpanId = spanId;

    const span: TraceSpan = {
      id: spanId,
      name,
      startTime: new Date(),
      status: 'started',
      metadata,
      children: []
    };

    this.traces.set(spanId, span);
    this.metrics.totalTraces++;
    this.metrics.activeSpans++;

    this.debug(`Trace started: ${name}`, {
      component: 'tracing',
      action: 'start_trace'
    }, { traceId, spanId });

    return spanId;
  }

  /**
   * End a trace
   */
  endTrace(spanId: string, status: 'completed' | 'failed' = 'completed'): void {
    if (!this.config.enableTracing) return;

    const span = this.traces.get(spanId);
    if (!span) return;

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    this.metrics.activeSpans--;

    this.debug(`Trace ended: ${span.name}`, {
      component: 'tracing',
      action: 'end_trace'
    }, { 
      spanId, 
      duration: span.duration, 
      status 
    });
  }

  /**
   * Create a child span
   */
  createChildSpan(name: string, parentSpanId: string, metadata: Record<string, any> = {}): string {
    if (!this.config.enableTracing) return '';

    const spanId = this.generateId();
    const parentSpan = this.traces.get(parentSpanId);
    
    if (parentSpan) {
      parentSpan.children.push(spanId);
    }

    const span: TraceSpan = {
      id: spanId,
      name,
      startTime: new Date(),
      status: 'started',
      metadata,
      parentId: parentSpanId,
      children: []
    };

    this.traces.set(spanId, span);
    this.metrics.activeSpans++;

    return spanId;
  }

  /**
   * Get trace information
   */
  getTrace(spanId: string): TraceSpan | undefined {
    return this.traces.get(spanId);
  }

  /**
   * Get all traces
   */
  getAllTraces(): TraceSpan[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get active traces
   */
  getActiveTraces(): TraceSpan[] {
    return Array.from(this.traces.values()).filter(span => span.status === 'started');
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  /**
   * Get logs by context
   */
  getLogsByContext(context: Partial<LogContext>): LogEntry[] {
    return this.entries.filter(entry => {
      return Object.entries(context).every(([key, value]) => 
        entry.context[key as keyof LogContext] === value
      );
    });
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.entries.slice(-count);
  }

  /**
   * Get metrics
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  /**
   * Export logs
   */
  exportLogs(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Export traces
   */
  exportTraces(): string {
    return JSON.stringify(Array.from(this.traces.values()), null, 2);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.entries = [];
  }

  /**
   * Clear traces
   */
  clearTraces(): void {
    this.traces.clear();
    this.metrics.totalTraces = 0;
    this.metrics.activeSpans = 0;
  }

  /**
   * Flush logs to remote endpoint
   */
  async flush(): Promise<void> {
    if (!this.config.enableRemote || this.entries.length === 0) return;

    try {
      const logsToSend = this.entries.splice(0, this.config.batchSize);
      
      if (this.config.remoteEndpoint) {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logsToSend)
        });
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Dispose of the logger
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }

  // Private methods

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const context = `${entry.context.component}:${entry.context.action}`;
    const message = `[${timestamp}] [${entry.level.toUpperCase()}] [${context}] ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.metadata);
        break;
      case 'info':
        console.info(message, entry.metadata);
        break;
      case 'warn':
        console.warn(message, entry.metadata);
        break;
      case 'error':
      case 'fatal':
        console.error(message, entry.metadata);
        break;
    }
  }

  private updateMetrics(level: LogEntry['level']): void {
    this.metrics.totalLogs++;
    this.metrics.logsByLevel[level] = (this.metrics.logsByLevel[level] || 0) + 1;
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Structured logger for specific components
export class ComponentLogger {
  private logger: Logger;
  private context: LogContext;

  constructor(logger: Logger, context: LogContext) {
    this.logger = logger;
    this.context = context;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, this.context, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, this.context, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, this.context, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.logger.error(message, this.context, metadata);
  }

  fatal(message: string, metadata?: Record<string, any>): void {
    this.logger.fatal(message, this.context, metadata);
  }

  startTrace(name: string, metadata?: Record<string, any>): string {
    return this.logger.startTrace(name, { ...metadata, ...this.context });
  }

  endTrace(spanId: string, status?: 'completed' | 'failed'): void {
    this.logger.endTrace(spanId, status);
  }
}

// Global logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableRemote: false,
  enableTracing: true,
  enableMetrics: true
});

// Helper function to create component loggers
export const createComponentLogger = (component: string, action: string, context: Partial<LogContext> = {}): ComponentLogger => {
  return new ComponentLogger(logger, {
    component,
    action,
    ...context
  });
};
