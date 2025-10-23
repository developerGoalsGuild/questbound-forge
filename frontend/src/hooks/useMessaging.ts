/**
 * Custom hook for messaging functionality
 * Manages WebSocket connections, message state, and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Message, 
  MessagingState, 
  UseMessagingReturn, 
  MessageFilters, 
  WebSocketMessage,
  TypingUser,
  RateLimitInfo,
  MessageSendResult
} from '../types/messaging';
import { 
  fetchMessages, 
  sendMessage as apiSendMessage, 
  getWebSocketUrl,
  isGuildRoom,
  formatMessageTimestamp,
  isOwnMessage,
  shouldGroupWithPrevious
} from '../lib/api/messaging';

interface UseMessagingOptions {
  roomId: string;
  userId: string;
  autoConnect?: boolean;
  maxMessages?: number;
  enableTypingIndicators?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useMessaging({
  roomId,
  userId,
  autoConnect = true,
  maxMessages = 100,
  enableTypingIndicators = true,
  reconnectAttempts = 5,
  reconnectDelay = 3000
}: UseMessagingOptions): UseMessagingReturn {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [activeConnections, setActiveConnections] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>();

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastMessageTimestampRef = useRef<number>();

  // Load messages from API
  const loadMessages = useCallback(async (filters: MessageFilters = {}) => {
    if (!roomId) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(undefined);

    try {
      const { messages: newMessages, pagination } = await fetchMessages(roomId, {
        ...filters,
        limit: maxMessages
      });

      // Sort messages by timestamp (oldest first)
      const sortedMessages = newMessages.sort((a, b) => a.ts - b.ts);
      
      setMessages(sortedMessages);
      lastMessageTimestampRef.current = sortedMessages[sortedMessages.length - 1]?.ts;
      
      console.log(`Loaded ${sortedMessages.length} messages for room ${roomId}`);
    } catch (error) {
      console.error('Error loading messages:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, maxMessages]);

  // Send message
  const sendMessage = useCallback(async (text: string): Promise<MessageSendResult> => {
    if (!roomId || !text.trim()) {
      return { success: false, error: 'Invalid room or message' };
    }

    try {
      // Send via API first
      const message = await apiSendMessage(roomId, text.trim());
      
      // Add to local state immediately for optimistic update
      setMessages(prev => [...prev, message]);
      
      // Send via WebSocket for real-time delivery
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const wsMessage: WebSocketMessage = {
          type: 'message',
          text: text.trim(),
          roomId,
          senderId: userId,
          timestamp: new Date().toISOString()
        };
        wsRef.current.send(JSON.stringify(wsMessage));
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      
      // Check if it's a rate limit error
      if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
        setRateLimitInfo({
          limit: 30,
          remaining: 0,
          resetTime: Date.now() + 60000,
          isLimited: true
        });
      }
      
      return { success: false, error: errorMessage };
    }
  }, [roomId, userId]);

  // WebSocket connection management
  const connect = useCallback(async (targetRoomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      disconnect();
    }

    setConnectionStatus('connecting');
    setHasError(false);
    setErrorMessage(undefined);

    try {
      const wsUrl = getWebSocketUrl(targetRoomId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`Connected to room ${targetRoomId}`);
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`Disconnected from room ${targetRoomId}:`, event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt reconnection if not a manual disconnect
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${reconnectAttempts}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(targetRoomId);
          }, reconnectDelay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setHasError(true);
        setErrorMessage('WebSocket connection error');
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('error');
      setHasError(true);
      setErrorMessage('Failed to connect to messaging service');
    }
  }, [reconnectAttempts, reconnectDelay]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'message':
        if (data.id && data.roomId && data.senderId && data.text && data.timestamp) {
          const message: Message = {
            id: data.id,
            roomId: data.roomId,
            senderId: data.senderId,
            text: data.text,
            ts: new Date(data.timestamp).getTime(),
            type: 'message'
          };
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            
            // Add message and maintain sort order
            const newMessages = [...prev, message].sort((a, b) => a.ts - b.ts);
            
            // Limit messages to maxMessages
            if (newMessages.length > maxMessages) {
              return newMessages.slice(-maxMessages);
            }
            
            return newMessages;
          });
        }
        break;
        
      case 'error':
        setHasError(true);
        setErrorMessage(data.message || 'Unknown error');
        break;
        
      case 'rate_limit':
        setRateLimitInfo({
          limit: 30,
          remaining: 0,
          resetTime: Date.now() + 60000,
          isLimited: true
        });
        break;
        
      case 'connection':
        if (data.data?.active_connections) {
          setActiveConnections(data.data.active_connections);
        }
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [maxMessages]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!enableTypingIndicators || !wsRef.current) return;
    
    const typingMessage: WebSocketMessage = {
      type: 'typing_started',
      data: { userId, timestamp: Date.now() }
    };
    wsRef.current.send(JSON.stringify(typingMessage));
    
    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [userId, enableTypingIndicators]);

  const stopTyping = useCallback(() => {
    if (!enableTypingIndicators || !wsRef.current) return;
    
    const typingMessage: WebSocketMessage = {
      type: 'typing_stopped',
      data: { userId }
    };
    wsRef.current.send(JSON.stringify(typingMessage));
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [userId, enableTypingIndicators]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setHasError(false);
    setErrorMessage(undefined);
  }, []);

  // Retry connection
  const retryConnection = useCallback(() => {
    if (roomId) {
      disconnect();
      setTimeout(() => connect(roomId), 1000);
    }
  }, [roomId, connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && roomId) {
      loadMessages();
      connect(roomId);
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, roomId, loadMessages, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [disconnect]);

  return {
    // State
    messages,
    isLoading,
    hasError,
    errorMessage,
    isConnected,
    connectionStatus,
    
    // Actions
    sendMessage,
    loadMessages,
    connect,
    disconnect,
    clearMessages,
    retryConnection,
    
    // Typing indicators
    startTyping,
    stopTyping,
    typingUsers,
    
    // Connection info
    activeConnections,
    rateLimitInfo
  };
}
