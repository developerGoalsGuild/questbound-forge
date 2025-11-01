/**
 * Production chat interface component
 * Uses database persistence for real-time messaging
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProductionMessaging } from '../../hooks/useProductionMessaging';
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

interface ProductionChatInterfaceProps {
  roomId: string;
  userId: string;
  roomName?: string;
  roomType?: 'general' | 'guild';
  className?: string;
  onMessageSent?: (message: Message) => void;
  onError?: (error: string) => void;
  onStatsUpdate?: (roomId: string, stats: { messageCount: number; distinctSenders: number }) => void;
}

export function ProductionChatInterface({
  roomId,
  userId,
  roomName,
  roomType = 'general',
  className = '',
  onMessageSent,
  onError,
  onStatsUpdate
}: ProductionChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const hasInitiallyScrolledRef = useRef(false);

  const scrollToBottom = (smooth: boolean = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Force scroll to absolute maximum - use a very large number to ensure we hit the bottom
    const maxScroll = Math.max(
      container.scrollHeight - container.clientHeight,
      container.scrollHeight,
      999999 // Fallback very large number
    );
    
    // Always use direct assignment for instant, reliable scrolling
    container.scrollTop = maxScroll;
    
    // Double-check after a micro-delay to ensure we're truly at bottom
    requestAnimationFrame(() => {
      if (container && container.scrollTop < container.scrollHeight - container.clientHeight) {
        container.scrollTop = container.scrollHeight;
      }
    });
  };

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
  } = useProductionMessaging(roomId);

  // Report message count changes up to parent for UI badges
  useEffect(() => {
    if (!onStatsUpdate) return;
    try {
      const distinct = new Set(messages.map(m => m.senderId)).size;
      onStatsUpdate(roomId, { messageCount: messages.length, distinctSenders: distinct });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, roomId]); // Only depend on length and roomId, not the callback

  // Auto-scroll to bottom when new messages arrive (debounced to prevent flickering)
  useEffect(() => {
    if (messages.length === 0) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Use requestAnimationFrame to batch scroll updates and prevent flickering
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Check current scroll position to determine if we should auto-scroll
        const container = scrollContainerRef.current;
        if (!container) return;
        
        const threshold = 120;
        const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
        
        // On initial load, always scroll to bottom
        const isInitialLoad = !hasInitiallyScrolledRef.current;
        const shouldStickToBottom = isInitialLoad || distanceFromBottom <= threshold || stickToBottomRef.current;
        
        if (shouldStickToBottom) {
          // Force scroll to absolute bottom with overscroll technique
          const maxScroll = container.scrollHeight;
          // Overscroll first to force browser to reach bottom
          container.scrollTop = maxScroll + 1000;
          // Then set to actual position
          container.scrollTop = maxScroll;
          
          // Double-check we're at bottom after a frame
          requestAnimationFrame(() => {
            if (container && container.scrollTop < maxScroll - container.clientHeight - 5) {
              container.scrollTop = maxScroll;
            }
          });
          
          hasInitiallyScrolledRef.current = true;
          stickToBottomRef.current = true;
        }
      });
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [messages.length]); // Only depend on length to reduce re-renders
  
  // Reset initial scroll flag when room changes or messages are cleared
  useEffect(() => {
    hasInitiallyScrolledRef.current = false;
    stickToBottomRef.current = true;
    return () => {
      // Cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Reset when room changes
  
  // Scroll to bottom when messages finish loading initially
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !hasInitiallyScrolledRef.current) {
      // Use multiple attempts to ensure we scroll to bottom
      const attemptScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return false;
        
        // Multiple scroll attempts to ensure we reach the bottom
        container.scrollTop = container.scrollHeight;
        
        // Check if we actually reached the bottom
        const isAtBottom = Math.abs(
          container.scrollHeight - container.clientHeight - container.scrollTop
        ) < 2; // Allow 2px tolerance
        
        if (!isAtBottom) {
          // Try again with a slightly larger value
          container.scrollTop = container.scrollHeight + 100; // Add extra to force bottom
          container.scrollTop = container.scrollHeight; // Then set to actual height
        }
        
        return isAtBottom;
      };
      
      // First attempt immediately
      let scrolled = attemptScroll();
      
      // Retry after DOM settles
      const timeoutId1 = setTimeout(() => {
        if (!scrolled) {
          scrolled = attemptScroll();
        }
        
        // Final check and retry
        const timeoutId2 = setTimeout(() => {
          attemptScroll();
          hasInitiallyScrolledRef.current = true;
          stickToBottomRef.current = true;
        }, 100);
        
        return () => clearTimeout(timeoutId2);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId1);
        if (!hasInitiallyScrolledRef.current) {
          hasInitiallyScrolledRef.current = true;
          stickToBottomRef.current = true;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, messages.length]); // Scroll when loading completes with messages

  // Handle error reporting
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle message sending
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !isConnected) return;

    try {
      const result: MessageSendResult = await sendMessage(content, 'text');
      
      if (result.success) {
        // Message was successfully sent; scroll to bottom after DOM updates
        console.log('Message sent successfully:', result.messageId);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom(false);
          });
        });
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

  // Handle retry connection
  const handleRetry = () => {
    retry();
  };

  // Handle clear messages
  const handleClearMessages = () => {
    clearMessages();
  };

  // Handle load more messages
  const handleLoadMore = async () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const previousHeight = container.scrollHeight;
    const previousScrollTop = container.scrollTop;
    
    // Temporarily disable stick-to-bottom during load
    stickToBottomRef.current = false;

    try {
      await loadMoreMessages();
    } finally {
      // Restore scroll position after loading
      requestAnimationFrame(() => {
        const updatedContainer = scrollContainerRef.current;
        if (!updatedContainer) return;
        
        const heightDelta = updatedContainer.scrollHeight - previousHeight;
        if (heightDelta > 0) {
          updatedContainer.scrollTop = previousScrollTop + heightDelta;
        }
      });
    }
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
          roomId={roomId}
          roomName={roomName || roomInfo.name}
          roomType={roomType}
          isConnected={isConnected}
          activeConnections={roomInfo.memberCount}
          onRetry={handleRetry}
        />

        {/* Connection Status */}
        <ConnectionStatus
          status={connectionStatus}
          hasError={!!error}
          errorMessage={error}
          onRetry={handleRetry}
        />

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        {/* Messages List */}
        <div 
          className="flex-1 overflow-y-auto p-4" 
          style={{ 
            minHeight: 0, 
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}
          ref={scrollContainerRef}
          onScroll={(event) => {
            const target = event.currentTarget;
            const threshold = 120;
            const distanceFromBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);
            stickToBottomRef.current = distanceFromBottom <= threshold;
          }}
        >
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
            currentUserId={userId}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            disableAutoScroll={true}
          />
          
          {/* Scroll anchor - used to scroll to bottom */}
          <div ref={messagesEndRef} style={{ height: 1 }} />

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
            onSendMessage={handleSendMessage}
            disabled={!isConnected || !!rateLimitInfo}
            placeholder={
              !isConnected 
                ? "Connecting to chat..." 
                : rateLimitInfo 
                  ? "Rate limited. Please wait..." 
                  : "Type a message..."
            }
            rateLimitInfo={rateLimitInfo}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
