/**
 * Performance monitoring utilities for tracking Core Web Vitals and other metrics
 */

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  tti: number; // Time to Interactive
  tbt: number; // Total Blocking Time
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  score: number;
  recommendations: string[];
  timestamp: number;
}

/**
 * Measures Core Web Vitals using the Performance Observer API
 */
export const measureCoreWebVitals = (): Promise<PerformanceMetrics> => {
  return new Promise((resolve) => {
    const metrics: Partial<PerformanceMetrics> = {};
    let resolved = false;

    // Measure FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Measure LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metrics.lcp = lastEntry.startTime;
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      metrics.cls = clsValue;
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Measure FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fidEntry = entries[0] as any;
      if (fidEntry) {
        metrics.fid = fidEntry.processingStart - fidEntry.startTime;
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Measure TTI (Time to Interactive) - simplified
    const ttiObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const longTask = entries.find(entry => entry.duration > 50);
      if (longTask) {
        metrics.tti = longTask.startTime + longTask.duration;
      }
    });
    ttiObserver.observe({ entryTypes: ['longtask'] });

    // Resolve after a timeout to ensure we capture all metrics
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          fcp: metrics.fcp || 0,
          lcp: metrics.lcp || 0,
          fid: metrics.fid || 0,
          cls: metrics.cls || 0,
          tti: metrics.tti || 0,
          tbt: 0, // Would need more complex calculation
        });
      }
    }, 5000);
  });
};

/**
 * Generates performance recommendations based on metrics
 */
export const generatePerformanceRecommendations = (metrics: PerformanceMetrics): string[] => {
  const recommendations: string[] = [];

  if (metrics.fcp > 1800) {
    recommendations.push('First Contentful Paint is slow. Consider optimizing critical rendering path.');
  }

  if (metrics.lcp > 2500) {
    recommendations.push('Largest Contentful Paint is slow. Optimize images and critical resources.');
  }

  if (metrics.fid > 100) {
    recommendations.push('First Input Delay is high. Reduce JavaScript execution time.');
  }

  if (metrics.cls > 0.1) {
    recommendations.push('Cumulative Layout Shift is high. Ensure stable layout during loading.');
  }

  if (metrics.tti > 3800) {
    recommendations.push('Time to Interactive is slow. Consider code splitting and lazy loading.');
  }

  return recommendations;
};

/**
 * Calculates a performance score based on Core Web Vitals
 */
export const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
  let score = 100;

  // FCP scoring (0-100)
  if (metrics.fcp > 3000) score -= 30;
  else if (metrics.fcp > 1800) score -= 15;

  // LCP scoring (0-100)
  if (metrics.lcp > 4000) score -= 30;
  else if (metrics.lcp > 2500) score -= 15;

  // FID scoring (0-100)
  if (metrics.fid > 300) score -= 20;
  else if (metrics.fid > 100) score -= 10;

  // CLS scoring (0-100)
  if (metrics.cls > 0.25) score -= 20;
  else if (metrics.cls > 0.1) score -= 10;

  return Math.max(0, score);
};

/**
 * Generates a comprehensive performance report
 */
export const generatePerformanceReport = async (): Promise<PerformanceReport> => {
  const metrics = await measureCoreWebVitals();
  const score = calculatePerformanceScore(metrics);
  const recommendations = generatePerformanceRecommendations(metrics);

  return {
    metrics,
    score,
    recommendations,
    timestamp: Date.now(),
  };
};
