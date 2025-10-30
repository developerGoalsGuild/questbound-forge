/**
 * TypeScript types for the messaging system
 */

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderNickname?: string;
  text: string;
  ts: number;
  type?: 'message' | 'broadcast' | 'system';
  roomType?: 'general' | 'guild';
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageInput {
  text: string;
  messageType?: 'text' | 'image' | 'file';
}

export interface Room {
  id: string;
  name: string;
  type: 'general' | 'guild';
  description?: string;
  memberCount?: number;
  lastMessage?: Message;
  isActive?: boolean;
}

export interface ConnectionInfo {
  roomId: string;
  userId: string;
  connectedAt: string;
  isOnline: boolean;
}

export interface MessagingState {
  messages: Message[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  activeConnections: number;
  lastMessageTimestamp?: number;
  hasMore: boolean;
  nextToken: string | null;
  typingUsers: TypingUser[];
  rateLimitInfo: RateLimitInfo | null;
  error: string | null;
}

export interface WebSocketMessage {
  type: 'message' | 'error' | 'system' | 'connection' | 'rate_limit';
  id?: string;
  roomId?: string;
  senderId?: string;
  text?: string;
  timestamp?: string;
  message?: string;
  data?: any;
}

export interface MessagingConfig {
  maxMessagesPerMinute: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  messageRetentionDays: number;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
}

export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

export interface TypingState {
  users: TypingUser[];
  isTyping: boolean;
}

export interface MessageFilters {
  roomId?: string;
  after?: number;
  before?: number;
  limit?: number;
  senderId?: string;
  messageType?: string;
}

export interface PaginationInfo {
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

export interface MessagingError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
}

export interface GuildRoomInfo {
  guildId: string;
  guildName: string;
  memberCount: number;
  isMember: boolean;
  permissions: string[];
}

export interface GeneralRoomInfo {
  roomId: string;
  roomName: string;
  description?: string;
  isPublic: boolean;
  memberCount: number;
}

export type RoomInfo = GuildRoomInfo | GeneralRoomInfo;

export interface MessagingServiceConfig {
  websocketUrl: string;
  apiUrl: string;
  jwtToken: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

export interface MessageSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rateLimitInfo?: RateLimitInfo;
}

export interface ConnectionStats {
  activeConnections: number;
  activeRooms: number;
  messagesPerMinute: number;
  uptime: number;
}

// Event types for messaging system
export type MessagingEvent = 
  | { type: 'MESSAGE_RECEIVED'; payload: Message }
  | { type: 'MESSAGE_SENT'; payload: Message }
  | { type: 'CONNECTION_ESTABLISHED'; payload: { roomId: string } }
  | { type: 'CONNECTION_LOST'; payload: { roomId: string; reason: string } }
  | { type: 'RATE_LIMIT_EXCEEDED'; payload: RateLimitInfo }
  | { type: 'TYPING_STARTED'; payload: { userId: string; username: string } }
  | { type: 'TYPING_STOPPED'; payload: { userId: string } }
  | { type: 'ERROR_OCCURRED'; payload: MessagingError }
  | { type: 'MESSAGES_LOADED'; payload: { messages: Message[]; hasMore: boolean } };

// Hook return types
export interface UseMessagingReturn {
  // State
  messages: Message[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  hasMore: boolean;
  
  // Actions
  sendMessage: (text: string) => Promise<MessageSendResult>;
  loadMessages: (filters?: MessageFilters) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  connect: (roomId: string) => Promise<void>;
  disconnect: () => void;
  clearMessages: () => void;
  retry: () => void;
  
  // Typing indicators
  startTyping: () => void;
  stopTyping: () => void;
  typingUsers: TypingUser[];
  
  // Connection info
  activeConnections: number;
  rateLimitInfo?: RateLimitInfo | null;
  currentRoom: string;
  roomInfo: RoomInfo;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: WebSocketMessage) => Promise<void>;
  connect: (roomId: string) => Promise<void>;
  disconnect: () => void;
  lastError?: string;
}
