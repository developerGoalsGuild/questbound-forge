/**
 * Dependency Injection Container
 * Provides service registration, resolution, and lifecycle management
 */

export interface ServiceDefinition<T = any> {
  factory: () => T;
  singleton?: boolean;
  dependencies?: string[];
  lifecycle?: 'singleton' | 'transient' | 'scoped';
}

export interface ServiceMetadata {
  name: string;
  type: string;
  dependencies: string[];
  lifecycle: 'singleton' | 'transient' | 'scoped';
  instance?: any;
  created: Date;
}

export class ServiceContainer {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();
  private metadata = new Map<string, ServiceMetadata>();
  private scopedInstances = new Map<string, Map<string, any>>();
  private currentScope: string | null = null;

  /**
   * Register a service
   */
  register<T>(
    name: string,
    factory: () => T,
    options: {
      singleton?: boolean;
      dependencies?: string[];
      lifecycle?: 'singleton' | 'transient' | 'scoped';
    } = {}
  ): void {
    const serviceDefinition: ServiceDefinition<T> = {
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies ?? [],
      lifecycle: options.lifecycle ?? 'singleton'
    };

    this.services.set(name, serviceDefinition);
    this.metadata.set(name, {
      name,
      type: typeof factory(),
      dependencies: serviceDefinition.dependencies,
      lifecycle: serviceDefinition.lifecycle,
      created: new Date()
    });
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(name: string, factory: () => T, dependencies: string[] = []): void {
    this.register(name, factory, { singleton: true, dependencies, lifecycle: 'singleton' });
  }

  /**
   * Register a transient service
   */
  registerTransient<T>(name: string, factory: () => T, dependencies: string[] = []): void {
    this.register(name, factory, { singleton: false, dependencies, lifecycle: 'transient' });
  }

  /**
   * Register a scoped service
   */
  registerScoped<T>(name: string, factory: () => T, dependencies: string[] = []): void {
    this.register(name, factory, { singleton: false, dependencies, lifecycle: 'scoped' });
  }

  /**
   * Resolve a service
   */
  resolve<T>(name: string): T {
    const serviceDefinition = this.services.get(name);
    if (!serviceDefinition) {
      throw new Error(`Service '${name}' not registered`);
    }

    // Handle different lifecycles
    switch (serviceDefinition.lifecycle) {
      case 'singleton':
        return this.resolveSingleton<T>(name);
      case 'transient':
        return this.resolveTransient<T>(name);
      case 'scoped':
        return this.resolveScoped<T>(name);
      default:
        throw new Error(`Unknown lifecycle: ${serviceDefinition.lifecycle}`);
    }
  }

  /**
   * Resolve multiple services
   */
  resolveMany<T>(names: string[]): T[] {
    return names.map(name => this.resolve<T>(name));
  }

  /**
   * Check if a service is registered
   */
  isRegistered(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get service metadata
   */
  getMetadata(name: string): ServiceMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * Get all registered services
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Create a new scope
   */
  createScope(scopeId: string): void {
    this.currentScope = scopeId;
    this.scopedInstances.set(scopeId, new Map());
  }

  /**
   * End current scope
   */
  endScope(): void {
    if (this.currentScope) {
      this.scopedInstances.delete(this.currentScope);
      this.currentScope = null;
    }
  }

  /**
   * Clear all instances (useful for testing)
   */
  clear(): void {
    this.instances.clear();
    this.scopedInstances.clear();
    this.currentScope = null;
  }

  /**
   * Dispose of a service
   */
  dispose(name: string): void {
    const instance = this.instances.get(name);
    if (instance && typeof instance.dispose === 'function') {
      instance.dispose();
    }
    this.instances.delete(name);
  }

  /**
   * Dispose of all services
   */
  disposeAll(): void {
    for (const [name, instance] of this.instances) {
      if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
    }
    this.instances.clear();
    this.scopedInstances.clear();
  }

  // Private methods

  private resolveSingleton<T>(name: string): T {
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const instance = this.createInstance<T>(name);
    this.instances.set(name, instance);
    return instance;
  }

  private resolveTransient<T>(name: string): T {
    return this.createInstance<T>(name);
  }

  private resolveScoped<T>(name: string): T {
    if (!this.currentScope) {
      throw new Error('No active scope for scoped service');
    }

    const scopeInstances = this.scopedInstances.get(this.currentScope);
    if (!scopeInstances) {
      throw new Error('Scope not found');
    }

    if (scopeInstances.has(name)) {
      return scopeInstances.get(name);
    }

    const instance = this.createInstance<T>(name);
    scopeInstances.set(name, instance);
    return instance;
  }

  private createInstance<T>(name: string): T {
    const serviceDefinition = this.services.get(name);
    if (!serviceDefinition) {
      throw new Error(`Service '${name}' not registered`);
    }

    // Resolve dependencies
    const dependencies = serviceDefinition.dependencies.map(depName => this.resolve(depName));
    
    // Create instance with dependencies
    const instance = serviceDefinition.factory.apply(null, dependencies);
    
    // Initialize if method exists
    if (instance && typeof instance.initialize === 'function') {
      instance.initialize();
    }

    return instance;
  }
}

// Global container instance
export const container = new ServiceContainer();
