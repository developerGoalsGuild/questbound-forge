/**
 * Performance Optimization Service
 * Provides performance monitoring, optimization, and caching for the messaging system
 */

export interface PerformanceConfig {
  enableCaching: boolean;
  cacheSize: number;
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableDebouncing: boolean;
  debounceDelay: number;
  enableCompression: boolean;
  enableImageOptimization: boolean;
  maxImageSize: number;
  enablePrefetching: boolean;
  prefetchDelay: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkLatency: number;
  messageProcessingTime: number;
  uiResponsiveness: number;
}

export class PerformanceOptimizationService {
  private config: PerformanceConfig;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private renderTimes: number[] = [];
  private networkLatencies: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableCaching: true,
      cacheSize: 100,
      enableVirtualization: true,
      enableLazyLoading: true,
      enableDebouncing: true,
      debounceDelay: 300,
      enableCompression: true,
      enableImageOptimization: true,
      maxImageSize: 1024 * 1024, // 1MB
      enablePrefetching: true,
      prefetchDelay: 1000,
      ...config
    };

    this.performanceMetrics = {
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      networkLatency: 0,
      messageProcessingTime: 0,
      uiResponsiveness: 0
    };

    this.startPerformanceMonitoring();
  }

  /**
   * Cache data with TTL
   */
  setCache<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    if (!this.config.enableCaching) return;

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  /**
   * Get cached data
   */
  getCache<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      this.cacheMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.cacheMisses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.cacheHits++;
    
    // Update cache hit rate
    this.updateCacheHitRate();

    return entry.data as T;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.updateCacheHitRate();
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = this.config.debounceDelay
  ): (...args: Parameters<T>) => void {
    if (!this.config.enableDebouncing) return func;

    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Optimize message rendering with virtualization
   */
  optimizeMessageRendering(
    messages: any[],
    containerHeight: number,
    itemHeight: number
  ): {
    visibleMessages: any[];
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetY: number;
  } {
    if (!this.config.enableVirtualization || messages.length === 0) {
      return {
        visibleMessages: messages,
        startIndex: 0,
        endIndex: messages.length - 1,
        totalHeight: messages.length * itemHeight,
        offsetY: 0
      };
    }

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const buffer = Math.ceil(visibleCount / 2);
    
    // This would be calculated based on scroll position
    const startIndex = 0; // Would be calculated from scroll position
    const endIndex = Math.min(startIndex + visibleCount + buffer, messages.length - 1);
    
    const visibleMessages = messages.slice(startIndex, endIndex + 1);
    const totalHeight = messages.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return {
      visibleMessages,
      startIndex,
      endIndex,
      totalHeight,
      offsetY
    };
  }

  /**
   * Lazy load images
   */
  lazyLoadImage(
    src: string,
    placeholder: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA2VjE4TTYgMTJIMTgiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.config.enableLazyLoading) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  /**
   * Optimize image size and format
   */
  optimizeImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.config.enableImageOptimization) {
        resolve(file);
        return;
      }

      if (file.size > this.config.maxImageSize) {
        reject(new Error('Image too large'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          'image/jpeg',
          0.8 // Quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Prefetch data
   */
  prefetchData<T>(key: string, fetcher: () => Promise<T>): void {
    if (!this.config.enablePrefetching) return;

    setTimeout(async () => {
      try {
        const data = await fetcher();
        this.setCache(key, data);
      } catch (error) {
        console.warn('Prefetch failed:', error);
      }
    }, this.config.prefetchDelay);
  }

  /**
   * Measure render time
   */
  measureRenderTime(componentName: string, renderFn: () => void): void {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    const renderTime = end - start;
    this.renderTimes.push(renderTime);
    
    // Keep only last 100 measurements
    if (this.renderTimes.length > 100) {
      this.renderTimes = this.renderTimes.slice(-100);
    }
    
    this.performanceMetrics.renderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
  }

  /**
   * Measure network latency
   */
  measureNetworkLatency(url: string): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      
      fetch(url, { method: 'HEAD' })
        .then(() => {
          const end = performance.now();
          const latency = end - start;
          
          this.networkLatencies.push(latency);
          
          // Keep only last 50 measurements
          if (this.networkLatencies.length > 50) {
            this.networkLatencies = this.networkLatencies.slice(-50);
          }
          
          this.performanceMetrics.networkLatency = this.networkLatencies.reduce((a, b) => a + b, 0) / this.networkLatencies.length;
          
          resolve(latency);
        })
        .catch(() => {
          resolve(0);
        });
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    // Update memory usage
    if ('memory' in performance) {
      this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    return { ...this.performanceMetrics };
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getPerformanceMetrics();

    if (metrics.renderTime > 16) { // 60fps = 16ms per frame
      recommendations.push('Render time is high, consider optimizing component rendering');
    }

    if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Memory usage is high, consider implementing memory cleanup');
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low, consider improving caching strategy');
    }

    if (metrics.networkLatency > 1000) { // 1 second
      recommendations.push('Network latency is high, consider optimizing network requests');
    }

    if (metrics.messageProcessingTime > 100) { // 100ms
      recommendations.push('Message processing time is high, consider optimizing message handling');
    }

    return recommendations;
  }

  /**
   * Optimize message list for large datasets
   */
  optimizeMessageList(messages: any[], maxVisible: number = 50): {
    visibleMessages: any[];
    hasMore: boolean;
    totalCount: number;
  } {
    if (messages.length <= maxVisible) {
      return {
        visibleMessages: messages,
        hasMore: false,
        totalCount: messages.length
      };
    }

    return {
      visibleMessages: messages.slice(-maxVisible),
      hasMore: true,
      totalCount: messages.length
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: Date.now() - entry.timestamp
    }));

    return {
      size: this.cache.size,
      hitRate: this.performanceMetrics.cacheHitRate,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      entries
    };
  }

  // Private methods

  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses;
    this.performanceMetrics.cacheHitRate = total > 0 ? this.cacheHits / total : 0;
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 5000); // Update every 5 seconds
  }

  private updatePerformanceMetrics(): void {
    // Update memory usage
    if ('memory' in performance) {
      this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // Update cache hit rate
    this.updateCacheHitRate();

    // Update UI responsiveness (simplified)
    this.performanceMetrics.uiResponsiveness = this.calculateUIResponsiveness();
  }

  private calculateUIResponsiveness(): number {
    // Simplified responsiveness calculation
    // In a real implementation, this would measure actual UI responsiveness
    const renderTime = this.performanceMetrics.renderTime;
    const memoryUsage = this.performanceMetrics.memoryUsage;
    
    // Lower values = better responsiveness
    const responsiveness = Math.max(0, 100 - (renderTime / 10) - (memoryUsage / (1024 * 1024)));
    return Math.min(100, Math.max(0, responsiveness));
  }
}

// Singleton instance
export const performanceOptimization = new PerformanceOptimizationService();
