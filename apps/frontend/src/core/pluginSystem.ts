/**
 * Plugin System - Extensible architecture for messaging system
 * Allows adding new features without modifying core code
 */

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  initialize?(context: PluginContext): void | Promise<void>;
  dispose?(): void | Promise<void>;
  onMessage?(message: any): any;
  onError?(error: Error, context: any): void;
  onEvent?(event: any): void;
}

export interface PluginContext {
  container: any;
  eventBus: any;
  config: any;
  logger: any;
  services: Record<string, any>;
}

export interface PluginConfig {
  enabled: boolean;
  settings: Record<string, any>;
  priority: number;
}

export interface PluginManagerConfig {
  autoLoad: boolean;
  pluginDirectory: string;
  enableHotReload: boolean;
  maxPlugins: number;
}

export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private pluginConfigs = new Map<string, PluginConfig>();
  private context: PluginContext;
  private config: PluginManagerConfig;
  private isInitialized = false;

  constructor(
    context: PluginContext,
    config: Partial<PluginManagerConfig> = {}
  ) {
    this.context = context;
    this.config = {
      autoLoad: true,
      pluginDirectory: '/plugins',
      enableHotReload: false,
      maxPlugins: 50,
      ...config
    };
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin, config: Partial<PluginConfig> = {}): boolean {
    if (this.plugins.size >= this.config.maxPlugins) {
      console.warn('Maximum number of plugins reached');
      return false;
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          console.error(`Plugin ${plugin.name} requires dependency ${dep} which is not registered`);
          return false;
        }
      }
    }

    this.plugins.set(plugin.name, plugin);
    this.pluginConfigs.set(plugin.name, {
      enabled: true,
      settings: {},
      priority: 0,
      ...config
    });

    console.log(`Plugin registered: ${plugin.name} v${plugin.version}`);
    return true;
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    // Check if other plugins depend on this one
    for (const [name, p] of this.plugins) {
      if (p.dependencies?.includes(pluginName)) {
        console.error(`Cannot unregister ${pluginName}: ${name} depends on it`);
        return false;
      }
    }

    // Dispose plugin
    if (plugin.dispose) {
      try {
        plugin.dispose();
      } catch (error) {
        console.error(`Error disposing plugin ${pluginName}:`, error);
      }
    }

    this.plugins.delete(pluginName);
    this.pluginConfigs.delete(pluginName);
    console.log(`Plugin unregistered: ${pluginName}`);
    return true;
  }

  /**
   * Initialize all plugins
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const sortedPlugins = this.getSortedPlugins();
    
    for (const plugin of sortedPlugins) {
      const pluginConfig = this.pluginConfigs.get(plugin.name);
      if (!pluginConfig?.enabled) {
        continue;
      }

      try {
        if (plugin.initialize) {
          await plugin.initialize(this.context);
        }
        console.log(`Plugin initialized: ${plugin.name}`);
      } catch (error) {
        console.error(`Failed to initialize plugin ${plugin.name}:`, error);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Plugin[] {
    return this.getAllPlugins().filter(plugin => {
      const config = this.pluginConfigs.get(plugin.name);
      return config?.enabled;
    });
  }

  /**
   * Enable a plugin
   */
  enablePlugin(name: string): boolean {
    const config = this.pluginConfigs.get(name);
    if (!config) {
      return false;
    }

    config.enabled = true;
    return true;
  }

  /**
   * Disable a plugin
   */
  disablePlugin(name: string): boolean {
    const config = this.pluginConfigs.get(name);
    if (!config) {
      return false;
    }

    config.enabled = false;
    return true;
  }

  /**
   * Update plugin configuration
   */
  updatePluginConfig(name: string, config: Partial<PluginConfig>): boolean {
    const existingConfig = this.pluginConfigs.get(name);
    if (!existingConfig) {
      return false;
    }

    Object.assign(existingConfig, config);
    return true;
  }

  /**
   * Process message through plugins
   */
  processMessage(message: any): any {
    let processedMessage = message;
    
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onMessage) {
        try {
          processedMessage = plugin.onMessage(processedMessage);
        } catch (error) {
          console.error(`Plugin ${plugin.name} error processing message:`, error);
        }
      }
    }

    return processedMessage;
  }

  /**
   * Handle error through plugins
   */
  handleError(error: Error, context: any): void {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onError) {
        try {
          plugin.onError(error, context);
        } catch (pluginError) {
          console.error(`Plugin ${plugin.name} error handling error:`, pluginError);
        }
      }
    }
  }

  /**
   * Handle event through plugins
   */
  handleEvent(event: any): void {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onEvent) {
        try {
          plugin.onEvent(event);
        } catch (error) {
          console.error(`Plugin ${plugin.name} error handling event:`, error);
        }
      }
    }
  }

  /**
   * Get plugin statistics
   */
  getStats(): {
    totalPlugins: number;
    enabledPlugins: number;
    disabledPlugins: number;
    pluginNames: string[];
  } {
    const allPlugins = this.getAllPlugins();
    const enabledPlugins = this.getEnabledPlugins();

    return {
      totalPlugins: allPlugins.length,
      enabledPlugins: enabledPlugins.length,
      disabledPlugins: allPlugins.length - enabledPlugins.length,
      pluginNames: allPlugins.map(p => p.name)
    };
  }

  /**
   * Dispose all plugins
   */
  async dispose(): Promise<void> {
    for (const plugin of this.getAllPlugins()) {
      if (plugin.dispose) {
        try {
          await plugin.dispose();
        } catch (error) {
          console.error(`Error disposing plugin ${plugin.name}:`, error);
        }
      }
    }

    this.plugins.clear();
    this.pluginConfigs.clear();
    this.isInitialized = false;
  }

  // Private methods

  private getSortedPlugins(): Plugin[] {
    const plugins = Array.from(this.plugins.values());
    
    // Sort by priority (higher priority first)
    return plugins.sort((a, b) => {
      const configA = this.pluginConfigs.get(a.name);
      const configB = this.pluginConfigs.get(b.name);
      return (configB?.priority ?? 0) - (configA?.priority ?? 0);
    });
  }
}

// Example plugins
export class MessageEncryptionPlugin implements Plugin {
  name = 'message-encryption';
  version = '1.0.0';
  description = 'Encrypts messages for security';

  onMessage(message: any): any {
    // Encrypt message content
    if (message.text) {
      message.text = this.encrypt(message.text);
      message.encrypted = true;
    }
    return message;
  }

  private encrypt(text: string): string {
    // Simple encryption (in production, use proper encryption)
    return btoa(text);
  }
}

export class MessageAnalyticsPlugin implements Plugin {
  name = 'message-analytics';
  version = '1.0.0';
  description = 'Tracks message analytics';

  onMessage(message: any): any {
    // Track message metrics
    console.log('Message analytics:', {
      messageId: message.id,
      timestamp: message.ts,
      length: message.text?.length || 0
    });
    return message;
  }
}

export class MessageValidationPlugin implements Plugin {
  name = 'message-validation';
  version = '1.0.0';
  description = 'Validates message content';

  onMessage(message: any): any {
    // Validate message
    if (!message.text || message.text.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    return message;
  }
}
