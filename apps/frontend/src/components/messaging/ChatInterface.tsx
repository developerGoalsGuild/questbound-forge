/**
 * Main chat interface component
 * Provides the complete messaging UI with message list, input, and controls
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useMessaging } from '../../hooks/useMessaging';
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

interface ChatInterfaceProps {
  roomId: string;
  userId: string;
  roomName?: string;
  roomType?: 'general' | 'guild';
  className?: string;
  onMessageSent?: (message: Message) => void;
  onError?: (error: string) => void;
}

export function ChatInterface({
  roomId,
  userId,
  roomName,
  roomType = 'general',
  className = '',
  onMessageSent,
  onError
}: ChatInterfaceProps) {
  const { t } = useTranslation();
  const chatT = (t as any)?.chat;
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    hasError,
    errorMessage,
    isConnected,
    connectionStatus,
    sendMessage,
    loadMessages,
    retryConnection,
    startTyping,
    stopTyping,
    typingUsers,
    activeConnections,
    rateLimitInfo
  } = useMessaging({
    roomId,
    userId,
    autoConnect: true,
    maxMessages: 100,
    enableTypingIndicators: true
  });

  // Handle message sending
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      const result: MessageSendResult = await sendMessage(text.trim());
      
      if (result.success && result.messageId) {
        onMessageSent?.(messages[messages.length - 1]);
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
      onError?.(errorMsg);
    }
  };

  // Handle typing
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scroll to show/hide scroll button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load more messages when scrolling to top
  const handleScrollToTop = async () => {
    if (messages.length > 0) {
      const oldestMessage = messages[0];
      await loadMessages({ before: oldestMessage.ts, limit: 50 });
    }
  };

  // Handle retry connection
  const handleRetry = () => {
    retryConnection();
  };

  return (
    <ErrorBoundary fallback={<ChatErrorFallback onRetry={handleRetry} />}>
      <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
        {/* Chat Header */}
        <ChatHeader
          roomId={roomId}
          roomName={roomName}
          roomType={roomType}
          isConnected={isConnected}
          activeConnections={activeConnections}
          onRetry={handleRetry}
        />

        {/* Connection Status */}
        <ConnectionStatus
          status={connectionStatus}
          hasError={hasError}
          errorMessage={errorMessage}
          rateLimitInfo={rateLimitInfo}
          onRetry={handleRetry}
        />

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {isLoading && messages.length === 0 ? (
            <div className="flex-1 p-4" aria-live="polite">
              <span className="sr-only">{chatT?.messages?.loading || 'Loading messages...'}</span>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={handleScroll}
            >
              <MessageList
                messages={messages}
                currentUserId={userId}
                onLoadMore={handleScrollToTop}
                hasMore={messages.length >= 50}
                disableAutoScroll={true}
              />
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <TypingIndicator users={typingUsers} />
              )}
              
              {/* Scroll to bottom button */}
              {showScrollButton && (
                <div className="fixed bottom-20 right-4 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={scrollToBottom}
                    className="rounded-full shadow-lg"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={!isConnected || hasError}
            placeholder={
              !isConnected 
                ? (chatT?.input?.connectingPlaceholder || "Connecting to chat...")
                : hasError 
                ? (chatT?.input?.errorPlaceholder || "Connection error")
                : (chatT?.input?.messagePlaceholder || 'Message {room}...').replace('{room}', roomName || roomId)
            }
            rateLimitInfo={rateLimitInfo}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Error fallback component
function ChatErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const chatT = (t as any)?.chat?.messages;
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {chatT?.chatError || 'Chat Error'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {chatT?.chatErrorDesc || 'Something went wrong with the chat. Please try again.'}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        {chatT?.retry || 'Retry'}
      </Button>
    </div>
  );
}
