/**
 * AppSync-based chat interface component
 * Uses GraphQL subscriptions for real-time messaging
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAppSyncMessaging } from '../../hooks/useAppSyncMessaging';
import { Message, MessageSendResult } from '../../types/messaging';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { ConnectionStatus } from './ConnectionStatus';
import { TypingIndicator } from './TypingIndicator';
import ErrorBoundary from '../ui/ErrorBoundary';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface AppSyncChatInterfaceProps {
  roomId: string;
  userId: string;
  roomName?: string;
  roomType?: 'general' | 'guild';
  className?: string;
  onMessageSent?: (message: Message) => void;
  onError?: (error: string) => void;
}

export function AppSyncChatInterface({
  roomId,
  userId,
  roomName,
  roomType = 'general',
  className = '',
  onMessageSent,
  onError
}: AppSyncChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageType, setMessageType] = useState<string>('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    isConnected,
    error,
    hasMore,
    typingUsers,
    rateLimitInfo,
    connectionStatus,
    sendMessage,
    loadMessages,
    loadMoreMessages,
    clearMessages,
    connect,
    disconnect,
    retry,
    currentRoom,
    roomInfo
  } = useAppSyncMessaging(roomId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle error reporting
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle message sending
  const handleSendMessage = async (content: string, type: string = 'text') => {
    if (!content.trim() || !isConnected) return;

    try {
      const result: MessageSendResult = await sendMessage(content, type);
      
      if (result.success && result.message) {
        setInputValue('');
        setIsTyping(false);
        
        if (onMessageSent) {
          onMessageSent(result.message);
        }
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to send message');
      }
    }
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsTyping(value.length > 0);
  };

  // Handle input submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSendMessage(inputValue.trim(), messageType);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle retry connection
  const handleRetry = () => {
    retry();
  };

  // Handle clear messages
  const handleClearMessages = () => {
    clearMessages();
  };

  // Handle load more messages
  const handleLoadMore = () => {
    loadMoreMessages();
  };

  // Render loading state
  if (isLoading && messages.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Chat interface error</div>}>
      <div className={`flex flex-col h-full ${className}`}>
        {/* Chat Header */}
        <ChatHeader
          roomName={roomName || roomInfo.name}
          roomType={roomType}
          memberCount={roomInfo.memberCount}
          isActive={roomInfo.isActive}
          onClearMessages={handleClearMessages}
        />

        {/* Connection Status */}
        <ConnectionStatus
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          error={error}
          onRetry={handleRetry}
        />

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4">
          {hasMore && (
            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Load More Messages
              </Button>
            </div>
          )}

          <MessageList
            messages={messages}
            userId={userId}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />

          {/* Error Display */}
          {error && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Rate Limit Warning */}
          {rateLimitInfo && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Rate limit reached. Please wait {rateLimitInfo.resetTime} seconds.
              </AlertDescription>
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <MessageInput
            value={inputValue}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || !!rateLimitInfo}
            placeholder={
              !isConnected 
                ? "Connecting to chat..." 
                : rateLimitInfo 
                  ? "Rate limited. Please wait..." 
                  : "Type a message..."
            }
            messageType={messageType}
            onMessageTypeChange={setMessageType}
            ref={inputRef}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
