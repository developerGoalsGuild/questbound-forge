/**
 * Production messaging hook with database persistence
 * Uses GraphQL and REST APIs for real-time messaging with database storage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import '../config/amplifyClient';
import { 
  Message, 
  MessagingState, 
  UseMessagingReturn, 
  MessageFilters, 
  TypingUser,
  RateLimitInfo,
  MessageSendResult,
  RoomInfo,
  MessageReplyContext
} from '../types/messaging';
import { 
  fetchMessages, 
  sendMessage as apiSendMessage,
  getRoomInfo,
  getMessagingHealth,
  joinRoom,
  leaveRoom
} from '../lib/api/messaging';
import { getTokenExpiry, renewToken } from '../lib/utils';

// GraphQL subscription for real-time messages
const ON_MESSAGE_SUBSCRIPTION = `
  subscription OnMessage($roomId: ID!) {
    onMessage(roomId: $roomId) {
      id
      text
      roomId
      senderId
      senderNickname
      ts
      replyToId
    }
  }
`;

// GraphQL mutation for sending messages
const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($roomId: ID!, $text: String!, $senderNickname: String, $replyToId: ID) {
    sendMessage(roomId: $roomId, text: $text, senderNickname: $senderNickname, replyToId: $replyToId) {
      id
      text
      roomId
      senderId
      senderNickname
      ts
      replyToId
      reactions {
        shortcode
        unicode
        count
        viewerHasReacted
      }
      emojiMetadata {
        shortcodes
        unicodeCount
      }
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
      senderNickname
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
`;

const coerceTimestamp = (value: any): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now();
};

const DEFAULT_REPLY_PLACEHOLDER = 'Original message unavailable';

const normalizeMessageRecord = (raw: any, roomId: string): Message => {
  const timestamp = coerceTimestamp(raw?.ts);
  const rawSenderId = raw?.senderId ?? raw?.userId ?? raw?.sender_id ?? raw?.senderID;
  const senderId = rawSenderId ? String(rawSenderId) : 'UNKNOWN';
  const senderNickname =
    raw?.senderNickname ??
    raw?.sender_nickname ??
    raw?.senderName ??
    raw?.sender_name ??
    undefined;
  const replyToRaw = raw?.replyToId ?? raw?.reply_to_id ?? raw?.reply_to ?? undefined;

  const message: Message = {
    id: String(raw?.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
    roomId: raw?.roomId ? String(raw.roomId) : roomId,
    senderId,
    senderNickname: senderNickname ? String(senderNickname) : undefined,
    text: typeof raw?.text === 'string' ? raw.text : '',
    ts: timestamp,
    type: raw?.type === 'broadcast' || raw?.type === 'system' ? raw.type : 'message',
    roomType: roomId.startsWith('GUILD#') ? 'guild' : 'general',
    createdAt: new Date(timestamp).toISOString(),
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? undefined,
    emojiMetadata: raw?.emojiMetadata,
    reactions: raw?.reactions,
    replyToId: replyToRaw ? String(replyToRaw) : undefined,
    replyTo: null,
  };

  return message;
};

const enrichMessageWithReply = (
  message: Message,
  lookup: Map<string, Message>
): Message => {
  if (!message.replyToId) {
    if (message.replyTo == null) {
      return { ...message, replyTo: null };
    }
    return message;
  }

  const parent = lookup.get(message.replyToId);
  if (parent) {
    const reply: MessageReplyContext = {
      id: parent.id,
      text: parent.text,
      senderId: parent.senderId,
      senderNickname: parent.senderNickname,
    };

    const existing = message.replyTo;
    if (
      existing &&
      !existing.isFallback &&
      existing.id === reply.id &&
      existing.text === reply.text &&
      existing.senderId === reply.senderId &&
      existing.senderNickname === reply.senderNickname
    ) {
      return message;
    }

    return { ...message, replyTo: reply };
  }

  // Preserve any reply info already populated (e.g., server-provided preview)
  if (message.replyTo && !message.replyTo.isFallback) {
    return message;
  }

  const fallback: MessageReplyContext = {
    id: message.replyToId,
    text: message.replyTo?.text || DEFAULT_REPLY_PLACEHOLDER,
    senderId: message.replyTo?.senderId,
    senderNickname: message.replyTo?.senderNickname,
    isFallback: true,
  };

  if (
    message.replyTo?.isFallback &&
    message.replyTo.text === fallback.text &&
    message.replyTo.senderNickname === fallback.senderNickname
  ) {
    return message;
  }

  return { ...message, replyTo: fallback };
};

const enrichMessagesWithReply = (
  messages: Message[],
  existing: Message[] = []
): Message[] => {
  const lookup = new Map<string, Message>();
  existing.forEach(msg => lookup.set(msg.id, msg));

  return messages.map(msg => {
    const enriched = enrichMessageWithReply(msg, lookup);
    lookup.set(enriched.id, enriched);
    return enriched;
  });
};

export function useProductionMessaging(roomId: string): UseMessagingReturn {
  const [state, setState] = useState<MessagingState>({
    messages: [],
    isLoading: false,
    isConnected: false,
    error: null,
    hasMore: true,
    nextToken: null,
    typingUsers: [],
    rateLimitInfo: null,
    connectionStatus: 'disconnected',
    hasError: false,
    activeConnections: 0
  });
  
  // Room info state
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [roomInfoLoading, setRoomInfoLoading] = useState(true);

  // Helper to get auth token
  const getAuthToken = useCallback(() => {
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
  }, []);

  // Derive sender nickname from local sources (no lookups)
  const deriveSenderNickname = useCallback((): string | null => {
    // 1) Local profile cache
    try {
      const profileRaw = localStorage.getItem('profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : null;
      if (profile?.nickname) return String(profile.nickname);
      if (profile?.fullName) return String(profile.fullName);
    } catch {}

    // 2) JWT claims (id_token preferred, then access_token)
    const decodeJwt = (tok?: string | null) => {
      if (!tok || tok.split('.').length < 2) return null;
      try {
        const b64 = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = JSON.parse(atob(b64));
        return json || null;
      } catch { return null; }
    };

    try {
      const authRaw = localStorage.getItem('auth');
      const auth = authRaw ? JSON.parse(authRaw) : null;
      const idTok = auth?.id_token as string | undefined;
      const accTok = auth?.access_token as string | undefined;
      const idClaims = decodeJwt(idTok);
      const accClaims = decodeJwt(accTok);
      const claims = idClaims || accClaims || {};
      const emailName = (claims.email || '').split('@')[0] || null;
      const candidate = claims.nickname || claims.preferred_username || claims.name || claims.given_name || emailName;
      if (candidate) return String(candidate);
    } catch {}

    // 3) Fallback to auth.user structure if present
    try {
      const authRaw = localStorage.getItem('auth');
      const auth = authRaw ? JSON.parse(authRaw) : null;
      const emailName = (auth?.user?.email || '').split('@')[0] || null;
      const candidate = auth?.user?.nickname || auth?.user?.fullName || emailName;
      if (candidate) return String(candidate);
    } catch {}

    return 'Unknown';
  }, []);
  
  const subscriptionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const gqlClientRef = useRef<any>(null);
  const subscriptionClientRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const getGqlClient = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('NO_TOKEN');
    }
    if (!gqlClientRef.current) {
      // Create client without authToken in config - we'll pass it per request
      gqlClientRef.current = generateClient({
        authMode: 'lambda'
      });
    }
    return gqlClientRef.current;
  }, [getAuthToken]);

  const getSubscriptionClient = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('NO_TOKEN');
    }
    if (!subscriptionClientRef.current) {
      // Create client without authToken in config - we'll pass it per request
      subscriptionClientRef.current = generateClient({
        authMode: 'lambda'
      });
    }
    return subscriptionClientRef.current;
  }, [getAuthToken]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messagesLoadedRef = useRef(false);
  const loadMessagesRef = useRef<(limit?: number, after?: string) => Promise<void>>();
  const connectRef = useRef<() => Promise<void>>();
  const disconnectRef = useRef<() => void>();

  // Load messages from database
  const loadMessages = useCallback(async (limit: number = 50, after?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const currentToken = getAuthToken();
      if (!currentToken) {
        console.warn('useProductionMessaging: loadMessages skipped until auth token is set');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Only renew token if user is authenticated (reduces unnecessary API calls)
      let token = getAuthToken();
      if (token) {
        const exp = getTokenExpiry();
        if (exp && exp * 1000 < Date.now() + 15000) {
          try {
            await renewToken();
            token = getAuthToken(); // Get fresh token after renewal
          } catch (e) {
            console.error('Token renew failed before loadMessages', e);
          }
        }
      }
      const endpoint = 'https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql';
      // Convert after to number properly - handle both string and number types
      let afterValue: number | undefined = undefined;
      if (after) {
        if (typeof after === 'string') {
          const parsed = parseInt(after, 10);
          afterValue = isNaN(parsed) ? undefined : parsed;
        } else if (typeof after === 'number') {
          afterValue = after;
        }
      }
      const messagesPayload = {
        query: GET_MESSAGES_QUERY,
        variables: {
          roomId,
          limit,
          after: afterValue
        }
      };
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messagesPayload)
      });

      if (response.status === 401) {
        // Only attempt token renewal if user is authenticated (reduces unnecessary API calls)
        if (token) {
          try {
            await renewToken();
            token = getAuthToken(); // Get fresh token after renewal
          } catch {}
        } else {
          token = getAuthToken(); // Try to get token if we don't have one
        }
        const retryPayload = {
          query: GET_MESSAGES_QUERY,
          variables: { roomId, limit, after: afterValue }
        };

        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(retryPayload)
        });
      }

      const result: any = await response.json();
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      const messages = result.data?.messages || [];

      const normalized = messages.map((msg: any) => normalizeMessageRecord(msg, roomId)).reverse();

      setState(prev => {
        // If loading more (after parameter exists), prepend older messages
        // Otherwise, replace all messages (initial load)
        const isLoadMore = !!after;
        let mergedMessages: Message[];
        
        if (isLoadMore) {
          // Prepend older messages to existing ones
          const enriched = enrichMessagesWithReply(normalized, prev.messages);
          // Merge with existing messages, avoiding duplicates
          const existingIds = new Set(prev.messages.map(m => m.id));
          const newMessages = enriched.filter(m => !existingIds.has(m.id));
          mergedMessages = [...newMessages, ...prev.messages];
        } else {
          // Initial load - replace all messages
          const enriched = enrichMessagesWithReply(normalized, []);
          mergedMessages = enriched;
        }
        
        return {
          ...prev,
          messages: mergedMessages,
          isLoading: false,
          hasMore: messages.length === limit,
          nextToken: messages.length > 0 ? messages[messages.length - 1].ts.toString() : null,
          error: null
        };
      });
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      console.error('Error data:', error?.data);
      console.error('Error errors:', error?.errors);
      
      // Provide user-friendly error message for Lambda errors
      let errorMessage = error?.errors?.[0]?.message || error?.message || 'Failed to load messages';
      if (errorMessage.includes('lambda_function') || errorMessage.includes('No module named')) {
        errorMessage = 'The messaging service is temporarily unavailable. Please try again later.';
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [roomId, getAuthToken, getTokenExpiry, renewToken]);

  const connect = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      return;
    }

    const client = getSubscriptionClient();

    const subscribe = async () => {
      const initialToken = getAuthToken();
      if (!initialToken) {
        throw new Error('NO_TOKEN');
      }
      const initialBearer =
        initialToken.startsWith('Bearer ') ? initialToken : `Bearer ${initialToken}`;

      const subscription = client.graphql(
        {
          query: ON_MESSAGE_SUBSCRIPTION,
          variables: { roomId },
          authMode: 'lambda',
          authToken: initialBearer,
        },
        async () => {
          const latestToken = getAuthToken();
          if (!latestToken) {
            return {};
          }
          const bearer =
            latestToken.startsWith('Bearer ') ? latestToken : `Bearer ${latestToken}`;
          return { Authorization: bearer };
        },
      ).subscribe({
        next: ({ data }: any) => {
          const m = data?.onMessage;
          if (!m) return;
          const normalized = normalizeMessageRecord(m, roomId);
          setState(prev => {
            const exists = prev.messages.some(msg => msg.id === normalized.id);
            if (exists) return prev;
            const [enriched] = enrichMessagesWithReply([normalized], prev.messages);
            return { ...prev, messages: [...prev.messages, enriched] };
          });
        },
        error: async (err: any) => {
          // Clean up failed subscription
          if (subscriptionRef.current) {
            try {
              subscriptionRef.current.unsubscribe();
            } catch {
              // Silently ignore unsubscribe errors
            }
            subscriptionRef.current = null;
          }

          // Fallback to polling if subscription fails (increased interval to reduce backend costs)
          if (!pollRef.current) {
            pollRef.current = setInterval(() => {
              loadMessagesRef.current?.(50);
            }, 30000); // Increased from 5s to 30s to reduce API calls by 83%
          }
          
          // Set error state, not connected!
          setState(prev => ({ 
            ...prev, 
            isConnected: false,
            connectionStatus: 'error',
            error: err?.message || err?.errors?.[0]?.message || 'Subscription error'
          }));
          
          // Attempt reconnection after delay
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000); // Max 30s delay
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current = 0; // Reset on successful reconnect
              connectRef.current?.();
            }, delay);
          }
        },
        complete: () => {
          subscriptionRef.current = null;
          setState(prev => ({ 
            ...prev, 
            isConnected: false,
            connectionStatus: 'disconnected'
          }));
          
          // Attempt reconnection if not intentional disconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current = 0;
              connectRef.current?.();
            }, delay);
          }
        }
      });

      subscriptionRef.current = subscription;
    };

    try {
      // Prevent duplicate connections
      if (subscriptionRef.current) {
        return;
      }
      
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
      await subscribe();
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected',
        error: null
      }));
    } catch (error) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          loadMessagesRef.current?.(50);
        }, 30000); // Increased from 5s to 30s to reduce API calls by 83%
      }
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, [roomId, getAuthToken, getSubscriptionClient]); // Removed loadMessages to prevent circular dependency

  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
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

  // Keep refs in sync with latest functions to avoid dependency issues
  useEffect(() => {
    loadMessagesRef.current = loadMessages;
    connectRef.current = connect;
    disconnectRef.current = disconnect;
  }, [loadMessages, connect, disconnect]);

  // Send message via AppSync
  const sendMessage = useCallback(async (content: string, messageType: string = 'text', replyToId?: string): Promise<MessageSendResult> => {
    try {
      // Ensure token is fresh (only if user is authenticated - reduces unnecessary API calls)
      let token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const exp = getTokenExpiry();
      if (exp && exp * 1000 < Date.now() + 15000) {
        try { await renewToken(); } catch {}
      }

      // Get fresh token after potential renewal
      token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const endpoint = 'https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql';

      const sendPayload = {
        query: SEND_MESSAGE_MUTATION,
        variables: {
          roomId,
          text: content,
          senderNickname: deriveSenderNickname(),
          replyToId: replyToId || null
        }
      };

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sendPayload)
      });
      if (response.status === 401) {
        // Only attempt token renewal if user is authenticated (reduces unnecessary API calls)
        const currentToken = getAuthToken();
        if (currentToken) {
          try { await renewToken(); } catch {}
        }
        token = getAuthToken();
        const retrySendPayload = {
          query: SEND_MESSAGE_MUTATION,
          variables: { roomId, text: content, senderNickname: deriveSenderNickname(), replyToId: replyToId || null }
        };

        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(retrySendPayload)
        });
      }
      
      const result: any = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors.map((e: any) => e.message).join('; ');
        throw new Error(errorMessage);
      }

      const message = result.data?.sendMessage;
      if (message) {
        const normalized = normalizeMessageRecord(message, roomId);

        setState(prev => {
          const [enriched] = enrichMessagesWithReply([normalized], prev.messages);
          return {
            ...prev,
            messages: [...prev.messages, enriched]
          };
        });

        return {
          success: true,
          messageId: normalized.id,
          rateLimitInfo: null
        };
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        rateLimitInfo: null
      };
    }
  }, [roomId]); // Remove client from dependencies to prevent infinite loop

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
  }, [connect, disconnect]);

  // Auto-connect on mount
  const connectingRef = useRef(false);
  const lastRoomIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Only connect if roomId actually changed
    if (roomId && roomId !== lastRoomIdRef.current && !connectingRef.current && connectRef.current) {
      lastRoomIdRef.current = roomId;
      connectingRef.current = true;
      messagesLoadedRef.current = false; // Reset when room changes
      connectRef.current().finally(() => {
        connectingRef.current = false;
      });
      // Notify presence via HTTP
      joinRoom(roomId);
    }

    return () => {
      connectingRef.current = false;
      if (roomId) {
        leaveRoom(roomId);
      }
      disconnectRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only depend on roomId to prevent infinite loops

  // Reinitialize subscriptions when auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      gqlClientRef.current = null;
      subscriptionClientRef.current = null;
      reconnectAttempts.current = 0;
      messagesLoadedRef.current = false;
      connectRef.current?.();
    };
    window.addEventListener('auth:change', handleAuthChange);
    return () => {
      window.removeEventListener('auth:change', handleAuthChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once

  // Function to refresh room info (can be called externally)
  const refreshRoomInfoRef = useRef<(() => Promise<void>) | null>(null);
  
  // Combined effect: Load messages and room info together when roomId changes (reduces API calls)
  // Messages are loaded via GraphQL query, not subscription, so connection status doesn't matter
  const loadingMessagesRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    
    // Only proceed if we have auth token and haven't loaded messages yet
    if (!token || messagesLoadedRef.current || loadingMessagesRef.current) {
      return;
    }
    
    // Combined fetch: Load messages and room info in parallel to reduce API calls
    const combinedFetch = async () => {
      messagesLoadedRef.current = true;
      loadingMessagesRef.current = true;
      setRoomInfoLoading(true);
      
      try {
        // Fetch both in parallel - getRoomInfo uses caching so this is efficient
        const [messagesResult, roomInfoResult] = await Promise.allSettled([
          loadMessagesRef.current?.(50),
          getRoomInfo(roomId)
        ]);
        
        if (cancelled) return;
        
        // Handle room info result
        if (roomInfoResult.status === 'fulfilled') {
          setRoomInfo(roomInfoResult.value);
          setRoomInfoLoading(false);
        } else {
          // Set default room info on error
          const defaultInfo = roomId.startsWith('GUILD#') ? {
            guildId: roomId,
            guildName: roomId.replace('GUILD#', ''),
            memberCount: 0,
            isMember: true,
            permissions: []
          } : {
            roomId: roomId,
            roomName: roomId.replace('ROOM-', '').replace(/-/g, ' '),
            description: '',
            isPublic: true,
            allowReactions: true,
            memberCount: 0
          } as RoomInfo;
          setRoomInfo(defaultInfo);
          setRoomInfoLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRoomInfoLoading(false);
        }
      } finally {
        if (!cancelled) {
          loadingMessagesRef.current = false;
        }
      }
    };
    
    combinedFetch();
    refreshRoomInfoRef.current = async () => {
      // Refresh room info only (messages refresh separately)
      try {
        const info = await getRoomInfo(roomId);
        if (!cancelled) {
          setRoomInfo(info);
        }
      } catch {
        // Silently ignore refresh errors
      }
    };
    
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only depend on roomId to reload when room changes
  
  // Listen for room settings update events to refresh room info
  useEffect(() => {
    const handleRoomSettingsUpdated = async () => {
      if (refreshRoomInfoRef.current) {
        await refreshRoomInfoRef.current();
      }
    };
    
    window.addEventListener('room:settingsUpdated', handleRoomSettingsUpdated);
    return () => {
      window.removeEventListener('room:settingsUpdated', handleRoomSettingsUpdated);
    };
  }, []);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Only cleanup on component unmount, not on every render
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (e) {
          console.warn('Error unsubscribing on cleanup:', e);
        }
        subscriptionRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Don't set state on cleanup - component is unmounting anyway
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run cleanup on unmount - don't disconnect on every render

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    hasError: !!state.error,
    errorMessage: state.error || undefined,
    connectionStatus: state.connectionStatus,
    hasMore: state.hasMore,
    typingUsers: state.typingUsers,
    rateLimitInfo: state.rateLimitInfo,
    activeConnections: 0, // TODO: Implement connection counting

    // Actions
    sendMessage: async (text: string, replyToId?: string) => {
      const result = await sendMessage(text, 'text', replyToId);
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        rateLimitInfo: result.rateLimitInfo
      };
    },
    loadMessages: async (filters?: MessageFilters) => {
      await loadMessages(filters?.limit || 50, filters?.after?.toString());
    },
    loadMoreMessages, // Add missing export
    connect: async (roomId: string) => {
      await connect();
    },
    disconnect,
    clearMessages,
    retry,
    startTyping: () => {}, // TODO: Implement typing indicators
    stopTyping: () => {}, // TODO: Implement typing indicators

        // Room info
        currentRoom: roomId,
        roomInfo: roomInfo || (roomId.startsWith('GUILD#') ? {
          guildId: roomId,
          guildName: roomId.replace('GUILD#', ''),
          memberCount: 0,
          isMember: true,
          permissions: []
        } : {
          roomId: roomId,
          roomName: roomId.replace('ROOM-', '').replace(/-/g, ' '),
          description: '',
          isPublic: true,
          memberCount: 0
        }) as RoomInfo
  };
}
