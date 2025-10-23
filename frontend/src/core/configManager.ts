/**
 * Configuration Management System
 * Centralized configuration with validation, hot reloading, and environment support
 */

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    validation?: (value: any) => boolean;
    description?: string;
  };
}

export interface ConfigSource {
  name: string;
  priority: number;
  load(): Promise<Record<string, any>>;
  save?(config: Record<string, any>): Promise<void>;
  watch?(callback: (config: Record<string, any>) => void): void;
}

export interface ConfigManagerOptions {
  schema: ConfigSchema;
  sources: ConfigSource[];
  enableHotReload: boolean;
  enableValidation: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
}

export class ConfigManager {
  private config: Record<string, any> = {};
  private schema: ConfigSchema;
  private sources: ConfigSource[];
  private options: ConfigManagerOptions;
  private watchers: Array<() => void> = [];
  private cache: Map<string, { value: any; timestamp: number }> = new Map();
  private listeners: Array<(config: Record<string, any>) => void> = [];

  constructor(options: ConfigManagerOptions) {
    this.schema = options.schema;
    this.sources = options.sources.sort((a, b) => a.priority - b.priority);
    this.options = {
      enableHotReload: true,
      enableValidation: true,
      enableCaching: true,
      cacheTimeout: 300000, // 5 minutes
      ...options
    };
  }

  /**
   * Load configuration from all sources
   */
  async load(): Promise<void> {
    const mergedConfig: Record<string, any> = {};

    // Load from all sources in priority order
    for (const source of this.sources) {
      try {
        const sourceConfig = await source.load();
        Object.assign(mergedConfig, sourceConfig);
        console.log(`Configuration loaded from source: ${source.name}`);
      } catch (error) {
        console.error(`Failed to load configuration from source ${source.name}:`, error);
      }
    }

    // Apply defaults
    this.applyDefaults(mergedConfig);

    // Validate configuration
    if (this.options.enableValidation) {
      this.validateConfig(mergedConfig);
    }

    this.config = mergedConfig;
    this.notifyListeners();
  }

  /**
   * Get a configuration value
   */
  get<T = any>(key: string, defaultValue?: T): T {
    // Check cache first
    if (this.options.enableCaching) {
      const cached = this.getCached(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    const value = this.getNestedValue(this.config, key);
    
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Configuration key '${key}' not found`);
    }

    // Cache the value
    if (this.options.enableCaching) {
      this.setCached(key, value);
    }

    return value;
  }

  /**
   * Set a configuration value
   */
  set(key: string, value: any): void {
    this.setNestedValue(this.config, key, value);
    this.notifyListeners();
  }

  /**
   * Get all configuration
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Update multiple configuration values
   */
  update(updates: Record<string, any>): void {
    Object.assign(this.config, updates);
    this.notifyListeners();
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = {};
    this.applyDefaults(this.config);
    this.notifyListeners();
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(callback: (config: Record<string, any>) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Start watching for configuration changes
   */
  startWatching(): void {
    if (!this.options.enableHotReload) {
      return;
    }

    for (const source of this.sources) {
      if (source.watch) {
        const unwatch = source.watch((newConfig) => {
          this.handleConfigChange(newConfig);
        });
        this.watchers.push(unwatch);
      }
    }
  }

  /**
   * Stop watching for configuration changes
   */
  stopWatching(): void {
    this.watchers.forEach(unwatch => unwatch());
    this.watchers = [];
  }

  /**
   * Save configuration to all writable sources
   */
  async save(): Promise<void> {
    for (const source of this.sources) {
      if (source.save) {
        try {
          await source.save(this.config);
          console.log(`Configuration saved to source: ${source.name}`);
        } catch (error) {
          console.error(`Failed to save configuration to source ${source.name}:`, error);
        }
      }
    }
  }

  /**
   * Validate configuration against schema
   */
  validate(): boolean {
    try {
      this.validateConfig(this.config);
      return true;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get configuration schema
   */
  getSchema(): ConfigSchema {
    return { ...this.schema };
  }

  /**
   * Add a new configuration source
   */
  addSource(source: ConfigSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a configuration source
   */
  removeSource(sourceName: string): boolean {
    const index = this.sources.findIndex(s => s.name === sourceName);
    if (index !== -1) {
      this.sources.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose of the configuration manager
   */
  dispose(): void {
    this.stopWatching();
    this.listeners = [];
    this.cache.clear();
  }

  // Private methods

  private applyDefaults(config: Record<string, any>): void {
    for (const [key, schema] of Object.entries(this.schema)) {
      if (schema.default !== undefined && config[key] === undefined) {
        config[key] = schema.default;
      }
    }
  }

  private validateConfig(config: Record<string, any>): void {
    for (const [key, schema] of Object.entries(this.schema)) {
      const value = config[key];

      // Check required fields
      if (schema.required && value === undefined) {
        throw new Error(`Required configuration key '${key}' is missing`);
      }

      // Skip validation if value is undefined and not required
      if (value === undefined) {
        continue;
      }

      // Check type
      if (!this.checkType(value, schema.type)) {
        throw new Error(`Configuration key '${key}' has invalid type. Expected ${schema.type}, got ${typeof value}`);
      }

      // Run custom validation
      if (schema.validation && !schema.validation(value)) {
        throw new Error(`Configuration key '${key}' failed validation`);
      }
    }
  }

  private checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.options.cacheTimeout) {
      return cached.value;
    }
    this.cache.delete(key);
    return undefined;
  }

  private setCached(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  private handleConfigChange(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Configuration listener error:', error);
      }
    });
  }
}

// Built-in configuration sources
export class EnvironmentConfigSource implements ConfigSource {
  name = 'environment';
  priority = 1;

  async load(): Promise<Record<string, any>> {
    const config: Record<string, any> = {};
    
    // Load from environment variables
    for (const [key, value] of Object.entries(import.meta.env)) {
      if (key.startsWith('VITE_')) {
        const configKey = key.replace('VITE_', '').toLowerCase();
        config[configKey] = this.parseValue(value);
      }
    }

    return config;
  }

  private parseValue(value: string): any {
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // Return as string
      return value;
    }
  }
}

export class LocalStorageConfigSource implements ConfigSource {
  name = 'localStorage';
  priority = 2;
  private key: string;

  constructor(key: string = 'app_config') {
    this.key = key;
  }

  async load(): Promise<Record<string, any>> {
    try {
      const stored = localStorage.getItem(this.key);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  async save(config: Record<string, any>): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(config));
  }
}

export class RemoteConfigSource implements ConfigSource {
  name = 'remote';
  priority = 3;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async load(): Promise<Record<string, any>> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to load remote configuration:', error);
      return {};
    }
  }
}
