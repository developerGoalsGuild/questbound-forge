/**
 * Message Persistence Service
 * Handles message storage, retrieval, and synchronization with backend
 */

import { Message, MessageFilters, PaginationInfo } from '../types/messaging';

export interface MessagePersistenceConfig {
  maxLocalMessages: number;
  syncInterval: number;
  retryAttempts: number;
  enableOfflineMode: boolean;
}

export class MessagePersistenceService {
  private config: MessagePersistenceConfig;
  private localMessages: Map<string, Message[]> = new Map();
  private syncQueue: Message[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor(config: Partial<MessagePersistenceConfig> = {}) {
    this.config = {
      maxLocalMessages: 1000,
      syncInterval: 30000, // 30 seconds
      retryAttempts: 3,
      enableOfflineMode: true,
      ...config
    };

    this.setupOnlineStatusListener();
    this.startSyncInterval();
  }

  /**
   * Store a message locally and attempt to sync with backend
   */
  async storeMessage(message: Message): Promise<void> {
    try {
      // Store locally first
      this.storeLocalMessage(message);

      // Attempt to sync with backend
      if (this.isOnline) {
        await this.syncMessageToBackend(message);
      } else {
        // Queue for later sync
        this.syncQueue.push(message);
      }
    } catch (error) {
      console.error('Failed to store message:', error);
      // Still store locally for offline access
      this.storeLocalMessage(message);
    }
  }

  /**
   * Retrieve messages for a room with pagination
   */
  async getMessages(
    roomId: string, 
    filters: MessageFilters = {}
  ): Promise<{ messages: Message[]; pagination: PaginationInfo }> {
    try {
      // Try to get from backend first
      if (this.isOnline) {
        const backendMessages = await this.fetchMessagesFromBackend(roomId, filters);
        if (backendMessages.messages.length > 0) {
          // Update local cache
          this.updateLocalMessages(roomId, backendMessages.messages);
          return backendMessages;
        }
      }

      // Fallback to local storage
      const localMessages = this.getLocalMessages(roomId, filters);
      return {
        messages: localMessages,
        pagination: {
          hasMore: localMessages.length === (filters.limit || 50),
          totalCount: localMessages.length
        }
      };
    } catch (error) {
      console.error('Failed to get messages:', error);
      // Fallback to local storage
      const localMessages = this.getLocalMessages(roomId, filters);
      return {
        messages: localMessages,
        pagination: {
          hasMore: false,
          totalCount: localMessages.length
        }
      };
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, roomId: string): Promise<void> {
    try {
      // Update locally
      this.deleteLocalMessage(messageId, roomId);

      // Sync with backend
      if (this.isOnline) {
        await this.deleteMessageFromBackend(messageId, roomId);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }

  /**
   * Update a message
   */
  async updateMessage(messageId: string, roomId: string, updates: Partial<Message>): Promise<void> {
    try {
      // Update locally
      this.updateLocalMessage(messageId, roomId, updates);

      // Sync with backend
      if (this.isOnline) {
        await this.updateMessageInBackend(messageId, roomId, updates);
      }
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  }

  /**
   * Sync all queued messages with backend
   */
  async syncQueuedMessages(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const messagesToSync = [...this.syncQueue];
    this.syncQueue = [];

    for (const message of messagesToSync) {
      try {
        await this.syncMessageToBackend(message);
      } catch (error) {
        console.error('Failed to sync message:', error);
        // Re-queue for retry
        this.syncQueue.push(message);
      }
    }
  }

  /**
   * Clear all local messages for a room
   */
  clearRoomMessages(roomId: string): void {
    this.localMessages.delete(roomId);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { isOnline: boolean; queuedMessages: number; lastSync: Date | null } {
    return {
      isOnline: this.isOnline,
      queuedMessages: this.syncQueue.length,
      lastSync: this.lastSyncTime
    };
  }

  // Private methods

  private lastSyncTime: Date | null = null;

  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncQueuedMessages();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncQueuedMessages();
      }
    }, this.config.syncInterval);
  }

  private storeLocalMessage(message: Message): void {
    const roomMessages = this.localMessages.get(message.roomId) || [];
    roomMessages.push(message);
    
    // Sort by timestamp
    roomMessages.sort((a, b) => a.ts - b.ts);
    
    // Limit local storage
    if (roomMessages.length > this.config.maxLocalMessages) {
      roomMessages.splice(0, roomMessages.length - this.config.maxLocalMessages);
    }
    
    this.localMessages.set(message.roomId, roomMessages);
  }

  private getLocalMessages(roomId: string, filters: MessageFilters): Message[] {
    const roomMessages = this.localMessages.get(roomId) || [];
    let filteredMessages = [...roomMessages];

    // Apply filters
    if (filters.after) {
      filteredMessages = filteredMessages.filter(msg => msg.ts > filters.after!);
    }
    if (filters.before) {
      filteredMessages = filteredMessages.filter(msg => msg.ts < filters.before!);
    }
    if (filters.senderId) {
      filteredMessages = filteredMessages.filter(msg => msg.senderId === filters.senderId);
    }
    if (filters.messageType) {
      filteredMessages = filteredMessages.filter(msg => msg.type === filters.messageType);
    }

    // Apply limit
    const limit = filters.limit || 50;
    if (filteredMessages.length > limit) {
      filteredMessages = filteredMessages.slice(-limit);
    }

    return filteredMessages;
  }

  private updateLocalMessages(roomId: string, messages: Message[]): void {
    this.localMessages.set(roomId, messages);
  }

  private deleteLocalMessage(messageId: string, roomId: string): void {
    const roomMessages = this.localMessages.get(roomId) || [];
    const updatedMessages = roomMessages.filter(msg => msg.id !== messageId);
    this.localMessages.set(roomId, updatedMessages);
  }

  private updateLocalMessage(messageId: string, roomId: string, updates: Partial<Message>): void {
    const roomMessages = this.localMessages.get(roomId) || [];
    const messageIndex = roomMessages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      roomMessages[messageIndex] = { ...roomMessages[messageIndex], ...updates };
      this.localMessages.set(roomId, roomMessages);
    }
  }

  private async syncMessageToBackend(message: Message): Promise<void> {
    // This would call the actual backend API
    // For now, we'll simulate the API call
    await new Promise(resolve => setTimeout(resolve, 100));
    this.lastSyncTime = new Date();
  }

  private async fetchMessagesFromBackend(
    roomId: string, 
    filters: MessageFilters
  ): Promise<{ messages: Message[]; pagination: PaginationInfo }> {
    // This would call the actual backend API
    // For now, we'll simulate the API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      messages: [],
      pagination: { hasMore: false, totalCount: 0 }
    };
  }

  private async deleteMessageFromBackend(messageId: string, roomId: string): Promise<void> {
    // This would call the actual backend API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async updateMessageInBackend(
    messageId: string, 
    roomId: string, 
    updates: Partial<Message>
  ): Promise<void> {
    // This would call the actual backend API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Singleton instance
export const messagePersistence = new MessagePersistenceService();
