/**
 * Service Discovery and Health Check System
 * Manages service endpoints, health monitoring, and failover
 */

export interface ServiceEndpoint {
  id: string;
  name: string;
  url: string;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  metadata: Record<string, any>;
}

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retries: number;
  endpoints: string[];
  enableAutoFailover: boolean;
  enableLoadBalancing: boolean;
}

export interface ServiceRegistry {
  register(service: ServiceEndpoint): void;
  unregister(serviceId: string): void;
  getService(serviceId: string): ServiceEndpoint | undefined;
  getHealthyServices(serviceName: string): ServiceEndpoint[];
  getAllServices(): ServiceEndpoint[];
  updateHealth(serviceId: string, health: ServiceEndpoint['health']): void;
}

export interface LoadBalancer {
  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint;
  getStrategy(): string;
  updateStrategy(strategy: string): void;
}

export class ServiceDiscovery implements ServiceRegistry {
  private services = new Map<string, ServiceEndpoint>();
  private healthChecks = new Map<string, NodeJS.Timeout>();
  private config: HealthCheckConfig;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
      endpoints: [],
      enableAutoFailover: true,
      enableLoadBalancing: true,
      ...config
    };
  }

  /**
   * Register a service
   */
  register(service: ServiceEndpoint): void {
    this.services.set(service.id, service);
    this.startHealthCheck(service.id);
    console.log(`Service registered: ${service.name} (${service.id})`);
  }

  /**
   * Unregister a service
   */
  unregister(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (service) {
      this.stopHealthCheck(serviceId);
      this.services.delete(serviceId);
      console.log(`Service unregistered: ${service.name} (${serviceId})`);
    }
  }

  /**
   * Get a service by ID
   */
  getService(serviceId: string): ServiceEndpoint | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get healthy services by name
   */
  getHealthyServices(serviceName: string): ServiceEndpoint[] {
    return Array.from(this.services.values())
      .filter(service => service.name === serviceName && service.health === 'healthy');
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values());
  }

  /**
   * Update service health
   */
  updateHealth(serviceId: string, health: ServiceEndpoint['health']): void {
    const service = this.services.get(serviceId);
    if (service) {
      service.health = health;
      service.lastCheck = new Date();
      console.log(`Service health updated: ${service.name} is ${health}`);
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    unknownServices: number;
    servicesByName: Record<string, number>;
  } {
    const allServices = this.getAllServices();
    const healthy = allServices.filter(s => s.health === 'healthy');
    const unhealthy = allServices.filter(s => s.health === 'unhealthy');
    const unknown = allServices.filter(s => s.health === 'unknown');

    const servicesByName: Record<string, number> = {};
    for (const service of allServices) {
      servicesByName[service.name] = (servicesByName[service.name] || 0) + 1;
    }

    return {
      totalServices: allServices.length,
      healthyServices: healthy.length,
      unhealthyServices: unhealthy.length,
      unknownServices: unknown.length,
      servicesByName
    };
  }

  /**
   * Start health checking for all services
   */
  startHealthChecking(): void {
    for (const serviceId of this.services.keys()) {
      this.startHealthCheck(serviceId);
    }
  }

  /**
   * Stop health checking for all services
   */
  stopHealthChecking(): void {
    for (const timeout of this.healthChecks.values()) {
      clearInterval(timeout);
    }
    this.healthChecks.clear();
  }

  /**
   * Dispose of the service discovery
   */
  dispose(): void {
    this.stopHealthChecking();
    this.services.clear();
  }

  // Private methods

  private startHealthCheck(serviceId: string): void {
    if (this.healthChecks.has(serviceId)) {
      return;
    }

    const interval = setInterval(async () => {
      await this.performHealthCheck(serviceId);
    }, this.config.interval);

    this.healthChecks.set(serviceId, interval);
  }

  private stopHealthCheck(serviceId: string): void {
    const timeout = this.healthChecks.get(serviceId);
    if (timeout) {
      clearInterval(timeout);
      this.healthChecks.delete(serviceId);
    }
  }

  private async performHealthCheck(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) return;

    try {
      const startTime = Date.now();
      const response = await fetch(`${service.url}/health`, {
        method: 'GET',
        timeout: this.config.timeout
      });

      const responseTime = Date.now() - startTime;
      service.responseTime = responseTime;

      if (response.ok) {
        this.updateHealth(serviceId, 'healthy');
      } else {
        this.updateHealth(serviceId, 'unhealthy');
      }
    } catch (error) {
      this.updateHealth(serviceId, 'unhealthy');
      console.warn(`Health check failed for ${service.name}:`, error);
    }
  }
}

// Load balancing strategies
export class RoundRobinLoadBalancer implements LoadBalancer {
  private currentIndex = 0;
  private strategy = 'round-robin';

  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    if (endpoints.length === 0) {
      throw new Error('No endpoints available');
    }

    const endpoint = endpoints[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % endpoints.length;
    return endpoint;
  }

  getStrategy(): string {
    return this.strategy;
  }

  updateStrategy(strategy: string): void {
    this.strategy = strategy;
  }
}

export class RandomLoadBalancer implements LoadBalancer {
  private strategy = 'random';

  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    if (endpoints.length === 0) {
      throw new Error('No endpoints available');
    }

    const index = Math.floor(Math.random() * endpoints.length);
    return endpoints[index];
  }

  getStrategy(): string {
    return this.strategy;
  }

  updateStrategy(strategy: string): void {
    this.strategy = strategy;
  }
}

export class WeightedLoadBalancer implements LoadBalancer {
  private strategy = 'weighted';

  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    if (endpoints.length === 0) {
      throw new Error('No endpoints available');
    }

    // Sort by response time (lower is better)
    const sortedEndpoints = endpoints.sort((a, b) => a.responseTime - b.responseTime);
    
    // Weight based on response time (lower response time = higher weight)
    const weights = sortedEndpoints.map(endpoint => 
      Math.max(1, 1000 / Math.max(endpoint.responseTime, 1))
    );

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < sortedEndpoints.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return sortedEndpoints[i];
      }
    }

    return sortedEndpoints[0];
  }

  getStrategy(): string {
    return this.strategy;
  }

  updateStrategy(strategy: string): void {
    this.strategy = strategy;
  }
}

// Service client with automatic failover
export class ServiceClient {
  private serviceDiscovery: ServiceDiscovery;
  private loadBalancer: LoadBalancer;
  private circuitBreakers = new Map<string, any>();

  constructor(
    serviceDiscovery: ServiceDiscovery,
    loadBalancer: LoadBalancer = new RoundRobinLoadBalancer()
  ) {
    this.serviceDiscovery = serviceDiscovery;
    this.loadBalancer = loadBalancer;
  }

  /**
   * Make a request to a service with automatic failover
   */
  async request<T>(
    serviceName: string,
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const healthyServices = this.serviceDiscovery.getHealthyServices(serviceName);
    
    if (healthyServices.length === 0) {
      throw new Error(`No healthy services available for ${serviceName}`);
    }

    let lastError: Error | null = null;

    for (const service of healthyServices) {
      try {
        const url = `${service.url}${path}`;
        const response = await fetch(url, {
          ...options,
          timeout: 10000
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Request failed for ${service.name}:`, error);
        
        // Mark service as unhealthy
        this.serviceDiscovery.updateHealth(service.id, 'unhealthy');
      }
    }

    throw lastError || new Error(`All services failed for ${serviceName}`);
  }

  /**
   * Get service endpoint with load balancing
   */
  getEndpoint(serviceName: string): ServiceEndpoint {
    const healthyServices = this.serviceDiscovery.getHealthyServices(serviceName);
    return this.loadBalancer.selectEndpoint(healthyServices);
  }

  /**
   * Update load balancer strategy
   */
  updateLoadBalancerStrategy(strategy: string): void {
    this.loadBalancer.updateStrategy(strategy);
  }
}

// Global service discovery
export const serviceDiscovery = new ServiceDiscovery();
export const serviceClient = new ServiceClient(serviceDiscovery);
