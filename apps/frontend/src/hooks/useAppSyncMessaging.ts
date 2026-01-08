/**
 * Custom hook for AppSync-based messaging functionality
 * Uses GraphQL subscriptions for real-time messaging instead of WebSocket
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
import { 
  fetchMessages, 
  sendMessage as apiSendMessage
} from '../lib/api/messaging';
import { generateClient } from 'aws-amplify/api';
import { GraphQLSubscription } from '@aws-amplify/api-graphql';

// GraphQL subscription for real-time messages
const ON_MESSAGE_SUBSCRIPTION = `
  subscription OnMessage($roomId: ID!) {
    onMessage(roomId: $roomId) {
      id
      text
      roomId
      senderId
      ts
      type
      roomType
      createdAt
    }
  }
`;

// GraphQL mutation for sending messages
const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($roomId: ID!, $text: String!) {
    sendMessage(roomId: $roomId, text: $text) {
      id
      text
      roomId
      senderId
      ts
      type
      roomType
      createdAt
    }
  }
`;

// GraphQL query for fetching messages
const GET_MESSAGES_QUERY = `
  query GetMessages($roomId: ID!, $after: AWSTimestamp, $limit: Int) {
    messages(roomId: $roomId, after: $after, limit: $limit) {
      id
      text
      roomId
      senderId
      ts
      type
      roomType
      createdAt
      reactions {
        shortcode
        unicode
        count
        viewerHasReacted
      }
    }
  }
`;

export function useAppSyncMessaging(roomId: string): UseMessagingReturn {
  const [state, setState] = useState<MessagingState>({
    messages: [],
    isLoading: false,
    isConnected: false,
    error: null,
    hasMore: true,
    nextToken: null,
    typingUsers: [],
    rateLimitInfo: null,
    connectionStatus: 'disconnected'
  });

  // Configure AppSync client with proper authentication
  const client = generateClient({
    authMode: 'lambda',
    authToken: () => {
      const authData = localStorage.getItem('auth');
      if (authData) {
        try {
          const auth = JSON.parse(authData);
          return auth.access_token;
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }
      return null;
    }
  });
  const subscriptionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messagesLoadedRef = useRef(false);

  // Connect to AppSync subscription
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

      // Subscribe to messages for this room
      subscriptionRef.current = client.graphql({
        query: ON_MESSAGE_SUBSCRIPTION,
        variables: { roomId }
      }).subscribe({
        next: (data: any) => {
          const message = data.data?.onMessage;
          if (message) {
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, message],
              isConnected: true,
              connectionStatus: 'connected',
              error: null
            }));
          }
        },
        error: (error: any) => {
          console.error('AppSync subscription error:', error);
          setState(prev => ({
            ...prev,
            isConnected: false,
            connectionStatus: 'error',
            error: error.message || 'Subscription error'
          }));
          
          // Attempt reconnection
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        }
      });

      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected',
        error: null
      }));
      
    } catch (error) {
      console.error('Failed to connect to AppSync:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, [roomId, client]);

  // Disconnect from subscription
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
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

  // Load messages from AppSync
  const loadMessages = useCallback(async (limit: number = 50, after?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await client.graphql({
        query: GET_MESSAGES_QUERY,
        variables: { 
          roomId, 
          limit,
          after: after ? parseInt(after) : undefined
        }
      });

      const messages = result.data?.messages || [];

      setState(prev => ({
        ...prev,
        messages: messages.reverse(), // Show oldest first
        isLoading: false,
        hasMore: messages.length === limit,
        nextToken: messages.length > 0 ? messages[messages.length - 1].ts.toString() : null,
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
  }, [roomId, client]);

  // Send message via AppSync
  const sendMessage = useCallback(async (content: string, messageType: string = 'text'): Promise<MessageSendResult> => {
    try {
      const result = await client.graphql({
        query: SEND_MESSAGE_MUTATION,
        variables: {
          roomId,
          text: content
        }
      });

      const message = result.data?.sendMessage;
      if (message) {
        // Message will be received via subscription
        return {
          success: true,
          message,
          rateLimitInfo: null
        };
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        rateLimitInfo: null
      };
    }
  }, [roomId, client]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    setState(prev => {
      if (!prev.hasMore || prev.isLoading) return prev;
      
      // Use the current nextToken from state
      const currentNextToken = prev.nextToken;
      
      // Call loadMessages with the current nextToken
      loadMessages(50, currentNextToken || undefined);
      
      return prev;
    });
  }, [roomId, loadMessages]);

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
      messagesLoadedRef.current = false; // Reset when room changes
      connect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  // Load messages once when connected
  useEffect(() => {
    if (state.isConnected && !messagesLoadedRef.current) {
      messagesLoadedRef.current = true;
      loadMessages();
    }
  }, [state.isConnected, loadMessages]);

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
