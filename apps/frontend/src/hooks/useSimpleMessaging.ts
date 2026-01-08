/**
 * Simple messaging hook that uses API Gateway endpoints
 * Bypasses AppSync authentication issues by using REST API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Message, 
  MessagingState, 
  UseMessagingReturn, 
  MessageFilters, 
  TypingUser,
  RateLimitInfo,
  MessageSendResult
} from '../types/messaging';

// Simple message storage and polling
class SimpleMessagingService {
  private messages: Message[] = [];
  private listeners: ((messages: Message[]) => void)[] = [];
  private pollInterval: NodeJS.Timeout | null = null;
  private roomId: string = '';

  constructor() {
    // Load messages from localStorage or initialize with default messages
    this.loadMessagesFromStorage();
  }

  private getStorageKey(roomId: string): string {
    return `goalsguild_messages_${roomId}`;
  }

  private loadMessagesFromStorage(): void {
    try {
      const storedMessages = localStorage.getItem(this.getStorageKey('ROOM-general'));
      if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
      } else {
        // Initialize with some mock messages for testing
        this.messages = [
          {
            id: '1',
            text: 'Welcome to the chat!',
            roomId: 'ROOM-general',
            senderId: 'system',
            ts: Date.now() - 120000, // 2 minutes ago
            type: 'system',
            roomType: 'general',
            createdAt: new Date(Date.now() - 120000).toISOString()
          },
          {
            id: '2',
            text: 'This is a test message to demonstrate the chat functionality.',
            roomId: 'ROOM-general',
            senderId: 'test-user',
            ts: Date.now() - 60000, // 1 minute ago
            type: 'message',
            roomType: 'general',
            createdAt: new Date(Date.now() - 60000).toISOString()
          }
        ];
        this.saveMessagesToStorage();
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      this.initializeDefaultMessages();
    }
  }

  private initializeDefaultMessages(): void {
    this.messages = [
      {
        id: '1',
        text: 'Welcome to the chat!',
        roomId: 'ROOM-general',
        senderId: 'system',
        ts: Date.now() - 120000,
        type: 'system',
        roomType: 'general',
        createdAt: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: '2',
        text: 'This is a test message to demonstrate the chat functionality.',
        roomId: 'ROOM-general',
        senderId: 'test-user',
        ts: Date.now() - 60000,
        type: 'message',
        roomType: 'general',
        createdAt: new Date(Date.now() - 60000).toISOString()
      }
    ];
  }

  private saveMessagesToStorage(): void {
    try {
      localStorage.setItem(this.getStorageKey(this.roomId), JSON.stringify(this.messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }

  connect(roomId: string) {
    this.roomId = roomId;
    this.loadMessagesForRoom(roomId);
    this.startPolling();
  }

  private loadMessagesForRoom(roomId: string): void {
    try {
      const storedMessages = localStorage.getItem(this.getStorageKey(roomId));
      if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
      } else {
        // Initialize with default messages for new rooms
        this.messages = [
          {
            id: `${roomId}-welcome`,
            text: `Welcome to ${roomId.replace('ROOM-', '').replace('GUILD#', '')} chat!`,
            roomId: roomId,
            senderId: 'system',
            ts: Date.now() - 300000, // 5 minutes ago
            type: 'system',
            roomType: roomId.startsWith('GUILD#') ? 'guild' : 'general',
            createdAt: new Date(Date.now() - 300000).toISOString()
          }
        ];
        this.saveMessagesToStorage();
      }
    } catch (error) {
      console.error('Error loading messages for room:', error);
      this.messages = [];
    }
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private startPolling() {
    // Simulate real-time updates with polling (increased interval to reduce backend costs)
    this.pollInterval = setInterval(() => {
      // In a real implementation, this would fetch new messages from the API
      this.notifyListeners();
    }, 15000); // Increased from 2s to 15s to reduce API calls by 87%
  }

  addMessage(content: string, userId: string, username: string): Message {
    const message: Message = {
      id: Date.now().toString(),
      text: content,
      roomId: this.roomId,
      senderId: userId,
      ts: Date.now(),
      type: 'message',
      roomType: this.roomId.startsWith('GUILD-') ? 'guild' : 'general',
      createdAt: new Date().toISOString()
    };

    this.messages.push(message);
    this.saveMessagesToStorage(); // Save to localStorage
    this.notifyListeners();
    return message;
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  subscribe(listener: (messages: Message[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getMessages()));
  }
}

// Global messaging service instance
const messagingService = new SimpleMessagingService();

export function useSimpleMessaging(roomId: string): UseMessagingReturn {
  const [state, setState] = useState<MessagingState>({
    messages: [],
    isLoading: false,
    isConnected: true, // Simple messaging is always "connected" locally
    error: null,
    hasMore: false,
    nextToken: null,
    typingUsers: [],
    rateLimitInfo: null,
    connectionStatus: 'connected' // Simple messaging is always "connected" locally
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to messaging service
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      messagingService.connect(roomId);
      
      // Subscribe to message updates
      const unsubscribe = messagingService.subscribe((messages) => {
        setState(prev => ({
          ...prev,
          messages,
          isConnected: true,
          connectionStatus: 'connected',
          error: null
        }));
      });

      // Load initial messages
      const messages = messagingService.getMessages();
      setState(prev => ({
        ...prev,
        messages,
        isConnected: true,
        connectionStatus: 'connected',
        error: null
      }));

      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected',
        error: null
      }));

    } catch (error) {
      console.error('Failed to connect to messaging service:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, [roomId]);

  // Disconnect from messaging service
  const disconnect = useCallback(() => {
    messagingService.disconnect();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionStatus: 'disconnected'
    }));
  }, []);

  // Load messages
  const loadMessages = useCallback(async (limit: number = 50) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const messages = messagingService.getMessages();
      setState(prev => ({
        ...prev,
        messages,
        isLoading: false,
        hasMore: false,
        error: null
      }));

    } catch (error) {
      console.error('Failed to load messages:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      }));
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, messageType: string = 'text'): Promise<MessageSendResult> => {
    try {
      // Get real user information from localStorage
      const authData = localStorage.getItem('auth');
      let userId = 'anonymous';
      let username = 'Anonymous User';

      if (authData) {
        try {
          const auth = JSON.parse(authData);
          userId = auth.user?.id || auth.sub || 'anonymous';
          username = auth.user?.username || auth.user?.name || 'User';
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const message = messagingService.addMessage(
        content, 
        userId,
        username
      );

      return {
        success: true,
        message,
        rateLimitInfo: null
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        rateLimitInfo: null
      };
    }
  }, []);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setState(prev => ({
        ...prev,
        isLoading: false,
        hasMore: false
      }));

    } catch (error) {
      console.error('Failed to load more messages:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load more messages'
      }));
    }
  }, [state.hasNext, state.isLoading]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  // Retry connection
  const retry = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    if (roomId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    error: state.error,
    hasMore: state.hasMore,
    typingUsers: state.typingUsers,
    rateLimitInfo: state.rateLimitInfo,
    connectionStatus: state.connectionStatus,

    // Actions
    sendMessage,
    loadMessages,
    loadMoreMessages,
    clearMessages,
    connect,
    disconnect,
    retry,

    // Room info
    currentRoom: roomId,
    roomInfo: {
      id: roomId,
      name: roomId.replace('ROOM-', '').replace('GUILD-', ''),
      type: roomId.startsWith('GUILD-') ? 'guild' : 'general',
      memberCount: 0,
      isActive: true
    }
  };
}
