/**
 * Monitoring and Logging Service
 * Provides comprehensive monitoring, logging, and analytics for the messaging system
 */

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  component: string;
  userId?: string;
  roomId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface Metrics {
  messagesSent: number;
  messagesReceived: number;
  connectionsActive: number;
  errorsCount: number;
  averageResponseTime: number;
  uptime: number;
}

export interface PerformanceMetrics {
  messageSendTime: number;
  messageReceiveTime: number;
  connectionTime: number;
  renderTime: number;
  memoryUsage: number;
}

export class MonitoringService {
  private logs: LogEntry[] = [];
  private metrics: Metrics;
  private performanceMetrics: PerformanceMetrics;
  private startTime: Date;
  private maxLogs = 1000;
  private isEnabled: boolean = true;

  constructor() {
    this.startTime = new Date();
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      connectionsActive: 0,
      errorsCount: 0,
      averageResponseTime: 0,
      uptime: 0
    };
    this.performanceMetrics = {
      messageSendTime: 0,
      messageReceiveTime: 0,
      connectionTime: 0,
      renderTime: 0,
      memoryUsage: 0
    };

    this.startPeriodicUpdates();
  }

  /**
   * Log a message
   */
  log(
    level: LogEntry['level'],
    message: string,
    component: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      component,
      metadata
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Update metrics
    if (level === 'error') {
      this.metrics.errorsCount++;
    }

    // Console logging
    this.logToConsole(logEntry);
  }

  /**
   * Log debug message
   */
  debug(message: string, component: string, metadata?: Record<string, any>): void {
    this.log('debug', message, component, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, component: string, metadata?: Record<string, any>): void {
    this.log('info', message, component, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, component: string, metadata?: Record<string, any>): void {
    this.log('warn', message, component, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, component: string, metadata?: Record<string, any>): void {
    this.log('error', message, component, metadata);
  }

  /**
   * Track message sent
   */
  trackMessageSent(userId: string, roomId: string, messageLength: number): void {
    this.metrics.messagesSent++;
    this.info('Message sent', 'messaging', {
      userId,
      roomId,
      messageLength
    });
  }

  /**
   * Track message received
   */
  trackMessageReceived(userId: string, roomId: string, messageLength: number): void {
    this.metrics.messagesReceived++;
    this.info('Message received', 'messaging', {
      userId,
      roomId,
      messageLength
    });
  }

  /**
   * Track connection established
   */
  trackConnectionEstablished(userId: string, roomId: string, connectionTime: number): void {
    this.metrics.connectionsActive++;
    this.performanceMetrics.connectionTime = connectionTime;
    this.info('Connection established', 'websocket', {
      userId,
      roomId,
      connectionTime
    });
  }

  /**
   * Track connection lost
   */
  trackConnectionLost(userId: string, roomId: string, reason: string): void {
    this.metrics.connectionsActive = Math.max(0, this.metrics.connectionsActive - 1);
    this.warn('Connection lost', 'websocket', {
      userId,
      roomId,
      reason
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: keyof PerformanceMetrics, value: number): void {
    this.performanceMetrics[metric] = value;
    this.debug('Performance metric updated', 'performance', {
      metric,
      value
    });
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId: string, activity: string, metadata?: Record<string, any>): void {
    this.info('User activity', 'user', {
      userId,
      activity,
      ...metadata
    });
  }

  /**
   * Track room activity
   */
  trackRoomActivity(roomId: string, activity: string, metadata?: Record<string, any>): void {
    this.info('Room activity', 'room', {
      roomId,
      activity,
      ...metadata
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metrics {
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    return { ...this.metrics };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by component
   */
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  /**
   * Get error logs
   */
  getErrorLogs(): LogEntry[] {
    return this.getLogsByLevel('error');
  }

  /**
   * Get warning logs
   */
  getWarningLogs(): LogEntry[] {
    return this.getLogsByLevel('warn');
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: Metrics;
  } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check error rate
    const errorRate = this.metrics.errorsCount / Math.max(this.metrics.messagesSent, 1);
    if (errorRate > 0.1) {
      issues.push('High error rate detected');
      status = 'warning';
    }

    // Check connection count
    if (this.metrics.connectionsActive === 0 && this.metrics.messagesSent > 0) {
      issues.push('No active connections');
      status = 'warning';
    }

    // Check memory usage
    if (this.performanceMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      issues.push('High memory usage');
      status = 'warning';
    }

    // Check for critical errors
    const recentErrors = this.getErrorLogs().filter(
      log => Date.now() - log.timestamp.getTime() < 60000 // Last minute
    );
    if (recentErrors.length > 10) {
      issues.push('Too many errors in the last minute');
      status = 'critical';
    }

    return {
      status,
      issues,
      metrics: this.getMetrics()
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: string;
    metrics: Metrics;
    performance: PerformanceMetrics;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const performance = this.getPerformanceMetrics();
    const recommendations: string[] = [];

    // Analyze performance and provide recommendations
    if (performance.messageSendTime > 1000) {
      recommendations.push('Message send time is high, consider optimizing network requests');
    }

    if (performance.connectionTime > 5000) {
      recommendations.push('Connection time is high, check network connectivity');
    }

    if (performance.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Memory usage is high, consider implementing memory cleanup');
    }

    if (metrics.averageResponseTime > 2000) {
      recommendations.push('Average response time is high, consider optimizing backend');
    }

    const summary = `Messaging system performance report:
- Messages sent: ${metrics.messagesSent}
- Messages received: ${metrics.messagesReceived}
- Active connections: ${metrics.connectionsActive}
- Errors: ${metrics.errorsCount}
- Uptime: ${Math.round(metrics.uptime / 1000)}s
- Average response time: ${metrics.averageResponseTime}ms`;

    return {
      summary,
      metrics,
      performance,
      recommendations
    };
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set maximum number of logs to keep
   */
  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
  }

  // Private methods

  private logToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const message = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.component}] ${logEntry.message}`;

    switch (logEntry.level) {
      case 'debug':
        console.debug(message, logEntry.metadata);
        break;
      case 'info':
        console.info(message, logEntry.metadata);
        break;
      case 'warn':
        console.warn(message, logEntry.metadata);
        break;
      case 'error':
        console.error(message, logEntry.metadata, logEntry.stack);
        break;
    }
  }

  private startPeriodicUpdates(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  private updateMetrics(): void {
    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime.getTime();

    // Update memory usage
    if ('memory' in performance) {
      this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // Calculate average response time
    const recentLogs = this.logs.filter(
      log => Date.now() - log.timestamp.getTime() < 60000 // Last minute
    );
    const responseTimes = recentLogs
      .filter(log => log.metadata?.responseTime)
      .map(log => log.metadata.responseTime);
    
    if (responseTimes.length > 0) {
      this.metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
  }
}

// Singleton instance
export const monitoring = new MonitoringService();
