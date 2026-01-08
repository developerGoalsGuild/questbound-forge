/**
 * Improved Messaging Service
 * Integrates all architectural improvements for production-ready messaging
 */

import { container } from './container';
import { eventBus } from './eventBus';
import { PluginManager } from './pluginSystem';
import { ConfigManager, EnvironmentConfigSource, LocalStorageConfigSource } from './configManager';
import { useMessagingStore } from './stateManager';
import { middlewareManager } from './middlewareSystem';
import { circuitBreakerManager } from './circuitBreaker';
import { serviceDiscovery, serviceClient } from './serviceDiscovery';
import { RepositoryFactory, MemoryDataSource, LocalStorageDataSource, ApiDataSource } from './dataAccess';
import { logger, createComponentLogger } from './logging';
import { Message, MessagingState, UseMessagingReturn } from '../types/messaging';

export interface ImprovedMessagingConfig {
  enablePlugins: boolean;
  enableMiddleware: boolean;
  enableCircuitBreaker: boolean;
  enableServiceDiscovery: boolean;
  enableTracing: boolean;
  enableMetrics: boolean;
  enableCaching: boolean;
  enablePersistence: boolean;
}

export class ImprovedMessagingService {
  private config: ImprovedMessagingConfig;
  private configManager: ConfigManager;
  private pluginManager: PluginManager;
  private componentLogger: any;
  private isInitialized = false;

  constructor(config: Partial<ImprovedMessagingConfig> = {}) {
    this.config = {
      enablePlugins: true,
      enableMiddleware: true,
      enableCircuitBreaker: true,
      enableServiceDiscovery: true,
      enableTracing: true,
      enableMetrics: true,
      enableCaching: true,
      enablePersistence: true,
      ...config
    };

    this.componentLogger = createComponentLogger('messaging-service', 'initialization');
    this.setupArchitecture();
  }

  /**
   * Initialize the messaging service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.componentLogger.info('Initializing improved messaging service');

    try {
      // Initialize configuration
      await this.configManager.load();
      this.componentLogger.info('Configuration loaded');

      // Initialize plugins
      if (this.config.enablePlugins) {
        await this.pluginManager.initialize();
        this.componentLogger.info('Plugins initialized');
      }

      // Initialize service discovery
      if (this.config.enableServiceDiscovery) {
        await this.initializeServiceDiscovery();
        this.componentLogger.info('Service discovery initialized');
      }

      // Register services in container
      this.registerServices();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.componentLogger.info('Messaging service initialized successfully');

    } catch (error) {
      this.componentLogger.error('Failed to initialize messaging service', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Send a message with full architectural support
   */
  async sendMessage(
    roomId: string,
    content: string,
    userId: string,
    messageType: string = 'text'
  ): Promise<Message> {
    const traceId = this.componentLogger.startTrace('send_message', { roomId, userId, messageType });

    try {
      // Execute through middleware pipeline
      const result = await middlewareManager.execute(
        'send_message',
        { roomId, content, userId, messageType },
        async (context) => {
          // Process through plugins
          let processedContent = content;
          if (this.config.enablePlugins) {
            processedContent = this.pluginManager.processMessage({ content, type: messageType });
          }

          // Create message
          const message: Message = {
            id: this.generateId(),
            text: processedContent,
            roomId,
            senderId: userId,
            ts: Date.now(),
            type: 'message',
            roomType: roomId.startsWith('GUILD-') ? 'guild' : 'general',
            createdAt: new Date().toISOString()
          };

          // Store in state
          useMessagingStore.getState().addMessage(roomId, message);

          // Publish event
          await eventBus.publish('message_sent', message, {
            source: 'messaging-service',
            correlationId: traceId
          });

          return message;
        },
        { userId, roomId }
      );

      this.componentLogger.endTrace(traceId, 'completed');
      return result;

    } catch (error) {
      this.componentLogger.endTrace(traceId, 'failed');
      this.componentLogger.error('Failed to send message', { 
        roomId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Load messages with architectural support
   */
  async loadMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const traceId = this.componentLogger.startTrace('load_messages', { roomId, limit, offset });

    try {
      const result = await middlewareManager.execute(
        'load_messages',
        { roomId, limit, offset },
        async (context) => {
          // Get from state first
          const stateMessages = useMessagingStore.getState().messages[roomId] || [];
          
          if (stateMessages.length >= limit) {
            return stateMessages.slice(-limit);
          }

          // Load from repository if needed
          const repository = container.resolve('messageRepository');
          const messages = await repository.findAll({ roomId });

          // Update state
          useMessagingStore.getState().setMessages(roomId, messages);

          return messages.slice(-limit);
        },
        { roomId }
      );

      this.componentLogger.endTrace(traceId, 'completed');
      return result;

    } catch (error) {
      this.componentLogger.endTrace(traceId, 'failed');
      this.componentLogger.error('Failed to load messages', { 
        roomId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Connect to a room with full architectural support
   */
  async connectToRoom(roomId: string, userId: string): Promise<void> {
    const traceId = this.componentLogger.startTrace('connect_to_room', { roomId, userId });

    try {
      await middlewareManager.execute(
        'connect_to_room',
        { roomId, userId },
        async (context) => {
          // Update connection state
          useMessagingStore.getState().setConnection(roomId, true);

          // Subscribe to room events
          await eventBus.publish('room_connected', { roomId, userId }, {
            source: 'messaging-service',
            correlationId: traceId
          });

          // Load room messages
          await this.loadMessages(roomId);
        },
        { userId, roomId }
      );

      this.componentLogger.endTrace(traceId, 'completed');

    } catch (error) {
      this.componentLogger.endTrace(traceId, 'failed');
      this.componentLogger.error('Failed to connect to room', { 
        roomId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Disconnect from a room
   */
  async disconnectFromRoom(roomId: string, userId: string): Promise<void> {
    const traceId = this.componentLogger.startTrace('disconnect_from_room', { roomId, userId });

    try {
      await middlewareManager.execute(
        'disconnect_from_room',
        { roomId, userId },
        async (context) => {
          // Update connection state
          useMessagingStore.getState().setConnection(roomId, false);

          // Publish disconnect event
          await eventBus.publish('room_disconnected', { roomId, userId }, {
            source: 'messaging-service',
            correlationId: traceId
          });
        },
        { userId, roomId }
      );

      this.componentLogger.endTrace(traceId, 'completed');

    } catch (error) {
      this.componentLogger.endTrace(traceId, 'failed');
      this.componentLogger.error('Failed to disconnect from room', { 
        roomId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
    metrics: any;
  } {
    const services: Record<string, any> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check configuration
    services.configuration = {
      status: this.configManager.validate() ? 'healthy' : 'unhealthy',
      loaded: true
    };

    // Check plugins
    if (this.config.enablePlugins) {
      const pluginStats = this.pluginManager.getStats();
      services.plugins = {
        status: pluginStats.enabledPlugins > 0 ? 'healthy' : 'degraded',
        total: pluginStats.totalPlugins,
        enabled: pluginStats.enabledPlugins
      };
    }

    // Check service discovery
    if (this.config.enableServiceDiscovery) {
      const serviceStats = serviceDiscovery.getStats();
      services.serviceDiscovery = {
        status: serviceStats.healthyServices > 0 ? 'healthy' : 'unhealthy',
        total: serviceStats.totalServices,
        healthy: serviceStats.healthyServices
      };
    }

    // Check circuit breakers
    if (this.config.enableCircuitBreaker) {
      const circuitBreakerMetrics = circuitBreakerManager.getAllMetrics();
      services.circuitBreakers = {
        status: Object.values(circuitBreakerMetrics).every(cb => cb.state === 'closed') ? 'healthy' : 'degraded',
        metrics: circuitBreakerMetrics
      };
    }

    // Determine overall status
    const serviceStatuses = Object.values(services).map((s: any) => s.status);
    if (serviceStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services,
      metrics: {
        logger: logger.getMetrics(),
        eventBus: eventBus.getMetrics(),
        middleware: middlewareManager.getMiddlewares().length
      }
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): any {
    return {
      logger: logger.getMetrics(),
      eventBus: eventBus.getMetrics(),
      plugins: this.config.enablePlugins ? this.pluginManager.getStats() : null,
      serviceDiscovery: this.config.enableServiceDiscovery ? serviceDiscovery.getStats() : null,
      circuitBreakers: this.config.enableCircuitBreaker ? circuitBreakerManager.getAllMetrics() : null,
      middleware: middlewareManager.getMiddlewares().length,
      state: useMessagingStore.getState()
    };
  }

  /**
   * Dispose of the service
   */
  async dispose(): Promise<void> {
    this.componentLogger.info('Disposing messaging service');

    try {
      // Dispose plugins
      if (this.config.enablePlugins) {
        await this.pluginManager.dispose();
      }

      // Dispose service discovery
      if (this.config.enableServiceDiscovery) {
        serviceDiscovery.dispose();
      }

      // Dispose circuit breakers
      if (this.config.enableCircuitBreaker) {
        circuitBreakerManager.disposeAll();
      }

      // Dispose logger
      logger.dispose();

      this.isInitialized = false;
      this.componentLogger.info('Messaging service disposed');

    } catch (error) {
      this.componentLogger.error('Error disposing messaging service', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Private methods

  private setupArchitecture(): void {
    // Setup configuration manager
    this.configManager = new ConfigManager({
      schema: this.getConfigSchema(),
      sources: [
        new EnvironmentConfigSource(),
        new LocalStorageConfigSource('messaging-config')
      ]
    });

    // Setup plugin manager
    this.pluginManager = new PluginManager({
      container,
      eventBus,
      config: this.configManager,
      logger,
      services: {}
    });
  }

  private getConfigSchema(): any {
    return {
      messaging: {
        type: 'object',
        required: true,
        default: {}
      },
      plugins: {
        type: 'object',
        required: false,
        default: {}
      },
      middleware: {
        type: 'object',
        required: false,
        default: {}
      }
    };
  }

  private registerServices(): void {
    // Register data sources
    container.registerSingleton('memoryDataSource', () => new MemoryDataSource());
    container.registerSingleton('localStorageDataSource', () => new LocalStorageDataSource());
    container.registerSingleton('apiDataSource', () => new ApiDataSource('/api'));

    // Register repositories
    container.registerSingleton('messageRepository', () => {
      const dataSource = container.resolve('localStorageDataSource');
      return RepositoryFactory.createLocalStorage(dataSource, 'messages');
    });

    // Register other services
    container.registerSingleton('eventBus', () => eventBus);
    container.registerSingleton('logger', () => logger);
    container.registerSingleton('configManager', () => this.configManager);
    container.registerSingleton('pluginManager', () => this.pluginManager);
  }

  private setupEventListeners(): void {
    // Listen for message events
    eventBus.subscribe('message_sent', (event) => {
      this.componentLogger.debug('Message sent event received', { messageId: event.payload.id });
    });

    // Listen for connection events
    eventBus.subscribe('room_connected', (event) => {
      this.componentLogger.debug('Room connected event received', { roomId: event.payload.roomId });
    });

    // Listen for error events
    eventBus.subscribe('error_occurred', (event) => {
      this.componentLogger.error('Error event received', { error: event.payload });
    });
  }

  private async initializeServiceDiscovery(): Promise<void> {
    // Register messaging service endpoints
    serviceDiscovery.register({
      id: 'messaging-service-1',
      name: 'messaging-service',
      url: 'https://api.example.com/messaging',
      health: 'unknown',
      lastCheck: new Date(),
      responseTime: 0,
      metadata: { version: '1.0.0' }
    });

    // Start health checking
    serviceDiscovery.startHealthChecking();
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global improved messaging service instance
export const improvedMessagingService = new ImprovedMessagingService();
