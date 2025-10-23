/**
 * API integration for the messaging service
 * Handles GraphQL queries/mutations and REST API calls
 */

import { Message, MessageFilters, PaginationInfo, RoomInfo, ConnectionStats, RateLimitInfo } from '../../types/messaging';

// GraphQL queries and mutations
export const MESSAGING_QUERIES = {
  GET_MESSAGES: `
    query GetMessages($roomId: ID!, $after: AWSTimestamp, $limit: Int) {
      messages(roomId: $roomId, after: $after, limit: $limit) {
        id
        roomId
        senderId
        text
        ts
      }
    }
  `,
  
  SEND_MESSAGE: `
    mutation SendMessage($roomId: ID!, $text: String!) {
      sendMessage(roomId: $roomId, text: $text) {
        id
        roomId
        senderId
        text
        ts
      }
    }
  `,
  
  SUBSCRIBE_MESSAGES: `
    subscription OnMessage($roomId: ID!) {
      onMessage(roomId: $roomId) {
        id
        roomId
        senderId
        text
        ts
      }
    }
  `
};

// REST API endpoints
const MESSAGING_SERVICE_URL = import.meta.env.VITE_MESSAGING_SERVICE_URL || 'http://localhost:8000';
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.goalsguild.com';
const API_GATEWAY_KEY = import.meta.env.VITE_API_GATEWAY_KEY || '';

/**
 * Get authentication headers for API requests
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-api-key': API_GATEWAY_KEY,
  };
}

/**
 * Get WebSocket URL for messaging service
 */
export function getWebSocketUrl(roomId: string): string {
  // Get the authentication token from localStorage
  const authData = localStorage.getItem('auth');
  let token = null;
  
  if (authData) {
    try {
      const auth = JSON.parse(authData);
      token = auth.access_token;
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }
  
  const messagingServiceUrl = import.meta.env.VITE_MESSAGING_SERVICE_URL || 'ws://localhost:8000';
  return `${messagingServiceUrl}/ws/rooms/${roomId}?token=${token}`;
}

/**
 * Fetch messages from a room using GraphQL
 */
export async function fetchMessages(
  roomId: string, 
  filters: MessageFilters = {}
): Promise<{ messages: Message[]; pagination: PaginationInfo }> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/graphql`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query: MESSAGING_QUERIES.GET_MESSAGES,
        variables: {
          roomId,
          after: filters.after,
          limit: filters.limit || 50
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch messages';
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url: `${API_GATEWAY_URL}/graphql`,
        input: { roomId, filters },
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return {
      messages: data.data.messages || [],
      pagination: {
        hasMore: (data.data.messages || []).length === (filters.limit || 50),
        totalCount: (data.data.messages || []).length
      }
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Send a message using GraphQL mutation
 */
export async function sendMessage(roomId: string, text: string): Promise<Message> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/graphql`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query: MESSAGING_QUERIES.SEND_MESSAGE,
        variables: { roomId, text }
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to send message';
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url: `${API_GATEWAY_URL}/graphql`,
        input: { roomId, text },
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.sendMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get room information
 */
export async function getRoomInfo(roomId: string): Promise<RoomInfo> {
  try {
    const response = await fetch(`${MESSAGING_SERVICE_URL}/rooms/${roomId}/connections`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get room info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting room info:', error);
    throw error;
  }
}

/**
 * Get user connection information
 */
export async function getUserConnections(userId: string): Promise<{ active_connections: number }> {
  try {
    const response = await fetch(`${MESSAGING_SERVICE_URL}/users/${userId}/connections`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get user connections: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user connections:', error);
    throw error;
  }
}

/**
 * Broadcast a message to a room (REST API)
 */
export async function broadcastMessage(
  roomId: string, 
  text: string, 
  messageType: string = 'text'
): Promise<{ status: string; message_id: string }> {
  try {
    const response = await fetch(`${MESSAGING_SERVICE_URL}/rooms/${roomId}/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        text,
        message_type: messageType
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please slow down.');
      }
      throw new Error(`Failed to broadcast message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error broadcasting message:', error);
    throw error;
  }
}

/**
 * Get messaging service health status
 */
export async function getMessagingHealth(): Promise<ConnectionStats> {
  try {
    const response = await fetch(`${MESSAGING_SERVICE_URL}/health`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to get health status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting health status:', error);
    throw error;
  }
}

/**
 * Validate guild membership for guild rooms
 */
export async function validateGuildMembership(userId: string, guildId: string): Promise<boolean> {
  try {
    // This would typically call the guild service
    // For now, we'll assume the user is a member if they have a valid token
    const token = localStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    console.error('Error validating guild membership:', error);
    return false;
  }
}

/**
 * Get rate limit information
 */
export async function getRateLimitInfo(): Promise<RateLimitInfo> {
  try {
    // This would be implemented based on the messaging service response
    // For now, return default values
    return {
      limit: 30,
      remaining: 30,
      resetTime: Date.now() + 60000, // 1 minute from now
      isLimited: false
    };
  } catch (error) {
    console.error('Error getting rate limit info:', error);
    return {
      limit: 30,
      remaining: 0,
      resetTime: Date.now() + 60000,
      isLimited: true
    };
  }
}

/**
 * Utility function to check if a room is a guild room
 */
export function isGuildRoom(roomId: string): boolean {
  return roomId.startsWith('GUILD#');
}

/**
 * Utility function to get room display name
 */
export function getRoomDisplayName(roomId: string): string {
  if (isGuildRoom(roomId)) {
    return roomId.replace('GUILD#', 'Guild: ');
  }
  return `Room: ${roomId}`;
}

/**
 * Utility function to format message timestamp
 */
export function formatMessageTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Utility function to check if message is from current user
 */
export function isOwnMessage(message: Message, currentUserId: string): boolean {
  return message.senderId === currentUserId;
}

/**
 * Utility function to group consecutive messages from same sender
 */
export function shouldGroupWithPrevious(
  currentMessage: Message, 
  previousMessage: Message | null,
  currentUserId: string
): boolean {
  if (!previousMessage) return false;
  
  const timeDiff = currentMessage.ts - previousMessage.ts;
  const isSameSender = currentMessage.senderId === previousMessage.senderId;
  const isWithinTimeWindow = timeDiff < 300000; // 5 minutes
  
  return isSameSender && isWithinTimeWindow;
}
