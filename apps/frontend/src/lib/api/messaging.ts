/**
 * API integration for the messaging service
 * Handles GraphQL queries/mutations and REST API calls
 */

import { Message, MessageFilters, PaginationInfo, RoomInfo, ConnectionStats, RateLimitInfo, Reaction, ReactionResponse } from '../../types/messaging';
import { getApiBase } from '@/lib/utils';

// GraphQL queries and mutations
export const MESSAGING_QUERIES = {
  GET_MESSAGES: `
    query GetMessages($roomId: ID!, $after: AWSTimestamp, $limit: Int) {
      messages(roomId: $roomId, after: $after, limit: $limit) {
        id
        roomId
        senderId
        senderNickname
        text
        ts
        replyToId
        reactions {
          shortcode
          unicode
          count
          viewerHasReacted
        }
      }
    }
  `,
  
  SEND_MESSAGE: `
    mutation SendMessage($roomId: ID!, $text: String!) {
      sendMessage(roomId: $roomId, text: $text) {
        id
        roomId
        senderId
        senderNickname
        text
        ts
        replyToId
      }
    }
  `,
  
  SUBSCRIBE_MESSAGES: `
    subscription OnMessage($roomId: ID!) {
      onMessage(roomId: $roomId) {
        id
        roomId
        senderId
        senderNickname
        text
        ts
        replyToId
        emojiMetadata {
          shortcodes
          unicodeCount
        }
        reactions {
          shortcode
          unicode
          count
          viewerHasReacted
        }
      }
    }
  `,
  
  GET_REACTIONS: `
    query GetReactions($messageId: ID!) {
      reactions(messageId: $messageId) {
        shortcode
        unicode
        count
        viewerHasReacted
      }
    }
  `,
  
  ADD_REACTION: `
    mutation AddReaction($messageId: ID!, $shortcode: String!, $unicode: String!) {
      addReaction(messageId: $messageId, shortcode: $shortcode, unicode: $unicode) {
        messageId
        shortcode
        unicode
        count
        added
        removed
      }
    }
  `,
  
  REMOVE_REACTION: `
    mutation RemoveReaction($messageId: ID!, $shortcode: String!) {
      removeReaction(messageId: $messageId, shortcode: $shortcode) {
        messageId
        shortcode
        unicode
        count
        added
        removed
      }
    }
  `,

  SUBSCRIBE_REACTIONS: `
    subscription OnReaction($messageId: ID!) {
      onReaction(messageId: $messageId) {
        messageId
        shortcode
        unicode
        count
        added
        removed
      }
    }
  `
};

// REST API endpoints
const MESSAGING_SERVICE_URL = import.meta.env.VITE_MESSAGING_SERVICE_URL || 'http://localhost:8000';
const API_GATEWAY_URL = import.meta.env.DEV
  ? getApiBase() // dev proxy to avoid CORS
  : (import.meta.env.VITE_API_GATEWAY_URL || 'https://api.goalsguild.com');
const API_GATEWAY_KEY = import.meta.env.VITE_API_GATEWAY_KEY || '';

// AppSync GraphQL endpoint
const APPSYNC_ENDPOINT = import.meta.env.VITE_APPSYNC_ENDPOINT || 
  'https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql';

/**
 * Get authentication headers for API requests
 */
function getAuthHeaders(): HeadersInit {
  // Prefer token from localStorage.auth
  let token: string | null = null;
  try {
    const raw = localStorage.getItem('auth');
    if (raw) {
      const auth = JSON.parse(raw);
      token = auth?.access_token || auth?.id_token || null;
    }
  } catch {}
  if (!token) {
    token = localStorage.getItem('authToken');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-api-key': API_GATEWAY_KEY,
  };
}

function getAppSyncHeaders(): HeadersInit {
  let token: string | null = null;
  try {
    const raw = localStorage.getItem('auth');
    if (raw) {
      const auth = JSON.parse(raw);
      token = auth?.access_token || auth?.id_token || null;
    }
  } catch {}
  if (!token) {
    token = localStorage.getItem('authToken');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token ?? ''}`
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
  // URL-encode the roomId to handle special characters like # (GUILD#guild_id format)
  const encodedRoomId = encodeURIComponent(roomId);
  return `${messagingServiceUrl}/ws/rooms/${encodedRoomId}?token=${token}`;
}

/**
 * Fetch messages from a room using GraphQL
 */
export async function fetchMessages(
  roomId: string, 
  filters: MessageFilters = {}
): Promise<{ messages: Message[]; pagination: PaginationInfo }> {
  try {
    // Use AppSync endpoint directly (not API Gateway) for GraphQL queries
    const response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: getAppSyncHeaders(),
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
        url: APPSYNC_ENDPOINT,
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
    // Use AppSync endpoint directly (not API Gateway) for GraphQL mutations
    const response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: getAppSyncHeaders(),
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
        url: APPSYNC_ENDPOINT,
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

// Cache for room info to reduce redundant API calls
const roomInfoCache = new Map<string, { data: RoomInfo; timestamp: number }>();
const ROOM_INFO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const roomInfoRequestQueue = new Map<string, Promise<RoomInfo>>(); // Deduplicate concurrent requests

/**
 * Get room information (optimized to reduce backend calls)
 * - Uses caching to avoid redundant requests
 * - Deduplicates concurrent requests for the same room
 * - Uses single primary endpoint instead of sequential fallbacks
 */
export async function getRoomInfo(roomId: string): Promise<RoomInfo> {
  // Check cache first
  const cached = roomInfoCache.get(roomId);
  if (cached && Date.now() - cached.timestamp < ROOM_INFO_CACHE_TTL) {
    return cached.data;
  }

  // Deduplicate concurrent requests
  const existingRequest = roomInfoRequestQueue.get(roomId);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f8e839-594c-4f2f-bd8e-7a680ff1bc2e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messaging.ts:295',message:'getRoomInfo entry',data:{roomId,apiGatewayUrl:API_GATEWAY_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Use single primary endpoint to reduce API calls (removed sequential fallback pattern)
      const encodedRoomId = encodeURIComponent(roomId);
      const url = `${API_GATEWAY_URL}/messaging/rooms/${encodedRoomId}`;
      
      const headers = getAuthHeaders();
      const response = await fetch(url, { method: 'GET', headers });
      
      if (response.ok) {
        const data = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f8e839-594c-4f2f-bd8e-7a680ff1bc2e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messaging.ts:312',message:'getRoomInfo response data',data:{roomId,dataKeys:Object.keys(data),hasId:!!data.id,hasGuildId:!!data.guildId,dataName:data.name,dataRoomName:data.roomName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // Normalize the response to match RoomInfo type
        console.log('Raw API response:', data);
        console.log('Raw API response data.name:', data.name);
        console.log('Raw API response data.roomName:', data.roomName);
        
        let roomInfo: RoomInfo;
        
        // Check for guild room FIRST based on roomId prefix
        if (roomId.startsWith('GUILD#') || data.guildId) {
          const extractedGuildId = data.guildId || roomId.replace('GUILD#', '');
          let guildName = data.guildName;
          if (!guildName && data.name) {
            const nameStr = String(data.name).trim();
            const isFormattedName = nameStr.startsWith('Guild#') || 
                                   nameStr.toLowerCase().startsWith('guild_') ||
                                   nameStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            if (!isFormattedName && nameStr.length > 0) {
              guildName = nameStr;
            }
          }
          guildName = guildName || extractedGuildId;
          
          roomInfo = {
            guildId: extractedGuildId,
            guildName: guildName,
            memberCount: data.member_count || data.memberCount || 0,
            isMember: data.isMember !== undefined ? data.isMember : true,
            permissions: data.permissions || [],
          };
        } else if (data.id && !data.guildId) {
          const nameValue = (data.name && String(data.name).trim()) || (data.roomName && String(data.roomName).trim());
          console.log('Extracted nameValue:', nameValue);
          roomInfo = {
            roomId: data.id,
            roomName: nameValue || data.id.replace('ROOM-', '').replace(/-/g, ' '),
            description: data.description || '',
            isPublic: data.is_public !== undefined ? data.is_public : (data.isPublic !== undefined ? data.isPublic : true),
            memberCount: data.member_count || data.memberCount || 0,
            allowFileUploads: data.allow_file_uploads !== undefined ? data.allow_file_uploads : (data.allowFileUploads !== undefined ? data.allowFileUploads : false),
            allowReactions: (() => {
              const value = data.allow_reactions !== undefined ? data.allow_reactions : (data.allowReactions !== undefined ? data.allowReactions : true);
              console.log('Normalizing allowReactions:', { 
                allow_reactions: data.allow_reactions, 
                allowReactions: data.allowReactions, 
                normalized: value,
                type: typeof value 
              });
              return value;
            })(),
            maxMessageLength: data.max_message_length || data.maxMessageLength || 2000,
          } as RoomInfo;
        } else {
          roomInfo = data;
        }
        
        // Cache the result
        roomInfoCache.set(roomId, { data: roomInfo, timestamp: Date.now() });
        
        return roomInfo;
      } else {
        // If primary endpoint fails, return cached data if available (even if expired)
        if (cached) {
          console.warn(`Primary endpoint failed for room ${roomId}, using cached data`);
          return cached.data;
        }
        throw new Error(`Failed to get room info: ${response.status} ${response.statusText}`);
      }
    } finally {
      // Remove from request queue
      roomInfoRequestQueue.delete(roomId);
    }
  })();

  roomInfoRequestQueue.set(roomId, requestPromise);
  return requestPromise;
}

/**
 * List available chat rooms from the messaging service
 * Note: Room details should be fetched via getRoomInfo when needed to avoid N+1 queries
 */
export async function listRooms(): Promise<Array<{ id: string; name: string; type: 'general' | 'guild'; description?: string; memberCount?: number; isActive?: boolean }>> {
  try {
    // Call via API Gateway to avoid Lambda Function URL CORS
    const response = await fetch(`${API_GATEWAY_URL}/messaging/rooms`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({} as any));
      const msg = body?.detail || response.statusText || 'Failed to list rooms';
      throw new Error(msg);
    }
    const data = await response.json();
    return (data?.rooms || []) as Array<{ id: string; name: string; type: 'general' | 'guild'; description?: string; memberCount?: number; isActive?: boolean }>;
  } catch (e) {
    console.error('Error listing rooms:', e);
    return [];
  }
}

/**
 * Batch fetch room info for multiple rooms (reduces API calls)
 * This is more efficient than calling getRoomInfo individually for each room
 */
export async function getRoomsInfo(roomIds: string[]): Promise<Map<string, RoomInfo>> {
  const results = new Map<string, RoomInfo>();
  
  // Use Promise.allSettled to fetch all rooms in parallel
  // This reduces total time compared to sequential calls
  const promises = roomIds.map(async (roomId) => {
    try {
      const info = await getRoomInfo(roomId);
      return { roomId, info };
    } catch (error) {
      console.error(`Failed to fetch info for room ${roomId}:`, error);
      return { roomId, info: null };
    }
  });
  
  const settled = await Promise.allSettled(promises);
  settled.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.info) {
      results.set(result.value.roomId, result.value.info);
    }
  });
  
  return results;
}

/**
 * Join a room (HTTP presence)
 */
export async function joinRoom(roomId: string): Promise<boolean> {
  try {
    // URL-encode the roomId to handle special characters like # (GUILD#guild_id format)
    const encodedRoomId = encodeURIComponent(roomId);
    const res = await fetch(`${API_GATEWAY_URL}/messaging/rooms/${encodedRoomId}/join`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.ok;
  } catch (e) {
    console.error('joinRoom failed', e);
    return false;
  }
}

/**
 * Leave a room (HTTP presence)
 */
export async function leaveRoom(roomId: string): Promise<boolean> {
  try {
    // URL-encode the roomId to handle special characters like # (GUILD#guild_id format)
    const encodedRoomId = encodeURIComponent(roomId);
    const res = await fetch(`${API_GATEWAY_URL}/messaging/rooms/${encodedRoomId}/leave`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.ok;
  } catch (e) {
    console.error('leaveRoom failed', e);
    return false;
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

export async function getReactions(messageId: string): Promise<Reaction[]> {
  try {
    const response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: getAppSyncHeaders(),
      body: JSON.stringify({
        query: MESSAGING_QUERIES.GET_REACTIONS,
        variables: { messageId }
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch reactions';
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url: APPSYNC_ENDPOINT,
        input: { messageId },
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const data = await response.json();
    if (data.errors?.length) {
      throw new Error(data.errors[0].message);
    }

    return data.data?.reactions ?? [];
  } catch (error) {
    console.error('Error fetching reactions:', error);
    throw error;
  }
}

export async function addReaction(messageId: string, shortcode: string, unicode: string): Promise<ReactionResponse> {
  try {
    const response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: getAppSyncHeaders(),
      body: JSON.stringify({
        query: MESSAGING_QUERIES.ADD_REACTION,
        variables: { messageId, shortcode, unicode }
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to add reaction';
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url: APPSYNC_ENDPOINT,
        input: { messageId, shortcode, unicode },
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const data = await response.json();
    if (data.errors?.length) {
      throw new Error(data.errors[0].message);
    }

    const payload = data.data?.addReaction;
    if (!payload) {
      throw new Error('Missing addReaction payload');
    }

    return {
      messageId: payload.messageId ?? messageId,
      shortcode: payload.shortcode,
      unicode: payload.unicode,
      count: payload.count,
      added: payload.added,
      removed: payload.removed
    };
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

export async function removeReaction(messageId: string, shortcode: string): Promise<ReactionResponse> {
  try {
    const response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: getAppSyncHeaders(),
      body: JSON.stringify({
        query: MESSAGING_QUERIES.REMOVE_REACTION,
        variables: { messageId, shortcode }
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to remove reaction';
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url: APPSYNC_ENDPOINT,
        input: { messageId, shortcode },
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const data = await response.json();
    if (data.errors?.length) {
      throw new Error(data.errors[0].message);
    }

    const payload = data.data?.removeReaction;
    if (!payload) {
      throw new Error('Missing removeReaction payload');
    }

    return {
      messageId: payload.messageId ?? messageId,
      shortcode: payload.shortcode,
      unicode: payload.unicode,
      count: payload.count,
      added: payload.added,
      removed: payload.removed
    };
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
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

/**
 * Get room members
 */
export interface RoomMember {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  joinedAt?: string;
  role?: 'owner' | 'moderator' | 'member';
}

export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  try {
    // Try multiple endpoints for getting room members
    const tryEndpoints = [
      `${API_GATEWAY_URL}/messaging/rooms/${roomId}/members`,
      `${API_GATEWAY_URL}/messaging/rooms/${roomId}/users`,
    ];
    
    let lastError: any = null;
    for (const url of tryEndpoints) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          // Handle different response formats
          if (Array.isArray(data)) {
            return data;
          } else if (data.members && Array.isArray(data.members)) {
            return data.members;
          } else if (data.users && Array.isArray(data.users)) {
            return data.users;
          }
          return [];
        }
        
        // If 404, try next endpoint; otherwise throw
        if (response.status === 404) {
          continue;
        }
        
        lastError = new Error(`Failed to get room members from ${url}: ${response.status} ${response.statusText}`);
      } catch (e) {
        lastError = e;
      }
    }
    
    // If all endpoints failed, try to get members from room info
    try {
      const roomInfo = await getRoomInfo(roomId);
      if ('memberCount' in roomInfo && roomInfo.memberCount > 0) {
        // Return empty array if we can't get detailed member info
        // In a real implementation, this would fetch from the guild service for guild rooms
        console.warn('Room member details not available, but room has members');
        return [];
      }
    } catch (e) {
      // Ignore room info errors
    }
    
    // If no specific member endpoint works, return empty array (no error)
    console.warn('Room members endpoint not available, returning empty list');
    return [];
  } catch (error) {
    console.error('Error getting room members:', error);
    // Return empty array instead of throwing to allow UI to still render
    return [];
  }
}

/**
 * Update room settings
 */
export interface RoomSettingsUpdate {
  name?: string;
  description?: string;
  isPublic?: boolean;
  allowFileUploads?: boolean;
  allowReactions?: boolean;
  maxMessageLength?: number;
}

export async function updateRoomSettings(
  roomId: string,
  settings: RoomSettingsUpdate
): Promise<void> {
  try {
    // URL encode the roomId to handle special characters like #
    const encodedRoomId = encodeURIComponent(roomId);
    const response = await fetch(`${API_GATEWAY_URL}/messaging/rooms/${encodedRoomId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to update room settings';
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        url: `${API_GATEWAY_URL}/messaging/rooms/${roomId}`,
        input: { roomId, settings },
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    // Settings updated successfully
    return;
  } catch (error) {
    console.error('Error updating room settings:', error);
    throw error;
  }
}
