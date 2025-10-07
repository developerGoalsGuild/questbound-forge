import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface HeaderPerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  errorRate: number;
  lastUpdated: Date | null;
  totalRenders: number;
  averageRenderTime: number;
}

export interface HeaderPerformanceOptions {
  enableLogging?: boolean;
  logThreshold?: number; // Log only if render time exceeds this threshold (ms)
  trackApiCalls?: boolean;
  trackErrors?: boolean;
}

/**
 * Hook for monitoring header component performance
 */
export function useHeaderPerformance(options: HeaderPerformanceOptions = {}) {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    logThreshold = 16, // 16ms threshold for 60fps
    trackApiCalls = true,
    trackErrors = true,
  } = options;

  const [metrics, setMetrics] = useState<HeaderPerformanceMetrics>({
    renderTime: 0,
    apiResponseTime: 0,
    errorRate: 0,
    lastUpdated: null,
    totalRenders: 0,
    averageRenderTime: 0,
  });

  const renderTimes = useRef<number[]>([]);
  const apiCallTimes = useRef<number[]>([]);
  const errorCount = useRef(0);
  const totalOperations = useRef(0);

  // Measure render time
  const measureRender = useCallback((startTime: number) => {
    const renderTime = performance.now() - startTime;
    renderTimes.current.push(renderTime);
    
    // Keep only last 50 render times for average calculation
    if (renderTimes.current.length > 50) {
      renderTimes.current = renderTimes.current.slice(-50);
    }

    const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

    setMetrics(prev => ({
      ...prev,
      renderTime,
      averageRenderTime,
      totalRenders: prev.totalRenders + 1,
      lastUpdated: new Date(),
    }));

    // Log performance issues in development
    if (enableLogging && renderTime > logThreshold) {
      logger.warn(`Slow header render detected`, {
          component: 'UserHeader',
          renderTime: `${renderTime.toFixed(2)}ms`,
          threshold: `${logThreshold}ms`,
      });
    }
  }, [enableLogging, logThreshold]);

  // Measure API call response time
  const measureApiCall = useCallback((startTime: number) => {
    if (!trackApiCalls) return;

    const responseTime = performance.now() - startTime;
    apiCallTimes.current.push(responseTime);
    
    // Keep only last 20 API call times
    if (apiCallTimes.current.length > 20) {
      apiCallTimes.current = apiCallTimes.current.slice(-20);
    }

    const averageApiTime = apiCallTimes.current.reduce((a, b) => a + b, 0) / apiCallTimes.current.length;

    setMetrics(prev => ({
      ...prev,
      apiResponseTime: averageApiTime,
      lastUpdated: new Date(),
    }));

    if (enableLogging) {
      logger.debug(`Header API call completed`, {
          responseTime: `${responseTime.toFixed(2)}ms`
      });
    }
  }, [trackApiCalls, enableLogging]);

  // Track errors
  const trackError = useCallback(() => {
    if (!trackErrors) return;

    errorCount.current += 1;
    totalOperations.current += 1;

    const errorRate = (errorCount.current / totalOperations.current) * 100;

    setMetrics(prev => ({
      ...prev,
      errorRate,
      lastUpdated: new Date(),
    }));

    if (enableLogging) {
      logger.warn('Header error tracked', {
          errorRate: `${errorRate.toFixed(2)}%`
      });
    }
  }, [trackErrors, enableLogging]);

  // Track successful operations
  const trackSuccess = useCallback(() => {
    totalOperations.current += 1;

    const errorRate = (errorCount.current / totalOperations.current) * 100;

    setMetrics(prev => ({
      ...prev,
      errorRate,
      lastUpdated: new Date(),
    }));
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    renderTimes.current = [];
    apiCallTimes.current = [];
    errorCount.current = 0;
    totalOperations.current = 0;

    setMetrics({
      renderTime: 0,
      apiResponseTime: 0,
      errorRate: 0,
      lastUpdated: new Date(),
      totalRenders: 0,
      averageRenderTime: 0,
    });

    if (enableLogging) {
      logger.info('Header performance metrics reset');
    }
  }, [enableLogging]);

  // Performance warning effect
  useEffect(() => {
    if (metrics.averageRenderTime > 50) { // 50ms average is concerning
      logger.warn('High average render time for header', {
          averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`
      });
    }

    if (metrics.errorRate > 10) { // 10% error rate is concerning
      logger.warn('High error rate for header', {
          errorRate: `${metrics.errorRate.toFixed(2)}%`
      });
    }
  }, [metrics.averageRenderTime, metrics.errorRate]);

  return {
    metrics,
    measureRender,
    measureApiCall,
    trackError,
    trackSuccess,
    resetMetrics,
  };
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string, options: HeaderPerformanceOptions = {}) {
  const { measureRender } = useHeaderPerformance(options);
  const renderStartTime = useRef<number | null>(null);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current !== null) {
      measureRender(renderStartTime.current);
      renderStartTime.current = null;
    }
  }, [measureRender]);

  return { startRender, endRender };
}

/**
 * Hook for measuring API call performance
 */
export function useApiPerformance(options: HeaderPerformanceOptions = {}) {
  const { measureApiCall, trackError, trackSuccess } = useHeaderPerformance(options);

  const measureApiCallWrapper = useCallback(async <T>(
    apiCall: () => Promise<T>,
    callName?: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      measureApiCall(startTime);
      trackSuccess();
      return result;
    } catch (error) {
      measureApiCall(startTime);
      trackError();
      throw error;
    }
  }, [measureApiCall, trackError, trackSuccess]);

  return { measureApiCall: measureApiCallWrapper };
}

export default useHeaderPerformance;
