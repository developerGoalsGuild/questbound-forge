/**
 * Production chat interface component
 * Uses database persistence for real-time messaging
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useProductionMessaging } from '../../hooks/useProductionMessaging';
import { Message, MessageSendResult, MessageReplyContext } from '../../types/messaging';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { ConnectionStatus } from './ConnectionStatus';
import { TypingIndicator } from './TypingIndicator';
import { RoomSettingsDialog } from './RoomSettingsDialog';
import { RoomMembersDialog } from './RoomMembersDialog';
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
  onSettings?: () => void;
  onMembers?: () => void;
}

export function ProductionChatInterface({
  roomId,
  userId,
  roomName,
  roomType = 'general',
  className = '',
  onMessageSent,
  onError,
  onStatsUpdate,
  onSettings,
  onMembers
}: ProductionChatInterfaceProps) {
  // Debug: Log the props we receive
  console.log('ProductionChatInterface props:', {
    roomId,
    roomName,
    roomType,
    userId: userId?.substring(0, 10) + '...'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const hasInitiallyScrolledRef = useRef(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/b4f8e839-594c-4f2f-bd8e-7a680ff1bc2e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductionChatInterface.tsx:84',message:'useProductionMessaging entry',data:{roomId,userId:userId?.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [roomId, userId]);
  // #endregion
  const {
    messages,
    isLoading,
    isConnected,
    hasError,
    errorMessage,
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
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/b4f8e839-594c-4f2f-bd8e-7a680ff1bc2e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductionChatInterface.tsx:103',message:'useProductionMessaging state',data:{roomId,isConnected,hasError,errorMessage,hasRoomInfo:!!roomInfo,roomInfoKeys:roomInfo?Object.keys(roomInfo):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [roomId, isConnected, hasError, errorMessage, roomInfo]);
  // #endregion

  // Debug: Log room info to see what we're getting
  useEffect(() => {
    if (roomInfo) {
      console.log('ProductionChatInterface - roomInfo:', roomInfo);
      console.log('ProductionChatInterface - roomName prop:', roomName);
      if ('roomName' in roomInfo) {
        console.log('ProductionChatInterface - roomInfo.roomName:', roomInfo.roomName);
      }
      if ('guildName' in roomInfo) {
        console.log('ProductionChatInterface - roomInfo.guildName:', roomInfo.guildName);
      }
      if ('allowReactions' in roomInfo) {
        console.log('ProductionChatInterface - roomInfo.allowReactions:', roomInfo.allowReactions, 'type:', typeof roomInfo.allowReactions);
      } else {
        console.log('ProductionChatInterface - roomInfo does not have allowReactions property');
      }
    }
  }, [roomInfo, roomName]);

  // Resolve replyTo for messages that have replyToId but no replyTo
  const messagesWithReplies = useMemo(() => {
    // Debug: Check for messages with replyToId
    const messagesWithReplyToId = messages.filter(m => m.replyToId);
    if (messagesWithReplyToId.length > 0) {
      console.log('Messages with replyToId:', messagesWithReplyToId.map(m => ({ id: m.id, replyToId: m.replyToId, hasReplyTo: !!m.replyTo })));
    }

    // Create a lookup map of message IDs
    const messageMap = new Map<string, Message>();
    messages.forEach(msg => messageMap.set(msg.id, msg));

    // Enrich messages with replyTo context
    return messages.map(msg => {
      // If replyTo is already populated, use it
      if (msg.replyTo) {
        return msg;
      }

      // If replyToId exists, try to find the parent message
      if (msg.replyToId) {
        const parentMessage = messageMap.get(msg.replyToId);
        if (parentMessage) {
          const replyContext: MessageReplyContext = {
            id: parentMessage.id,
            text: parentMessage.text,
            senderId: parentMessage.senderId,
            senderNickname: parentMessage.senderNickname
          };
          console.log('Resolved reply for message', msg.id, '->', replyContext);
          return { ...msg, replyTo: replyContext };
        } else {
          // Create a fallback reply context if parent not found
          const fallbackContext: MessageReplyContext = {
            id: msg.replyToId,
            text: 'Original message unavailable',
            isFallback: true
          };
          console.log('Reply parent not found for message', msg.id, 'replyToId:', msg.replyToId);
          return { ...msg, replyTo: fallbackContext };
        }
      }

      return msg;
    });
  }, [messages]);

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
    if (hasError && errorMessage && onError) {
      onError(errorMessage);
    }
  }, [hasError, errorMessage, onError]);

  // Handle reply to message
  const handleReply = (message: Message) => {
    console.log('Reply button clicked for message:', message);
    setReplyTo(message);
    // Focus the input after a short delay to ensure DOM is ready
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="Connecting"], textarea[placeholder*="Rate limited"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        console.log('Focused textarea for reply');
      } else {
        console.warn('Could not find textarea to focus');
      }
    }, 100);
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // Handle message sending
  const handleSendMessage = async (content: string, replyToId?: string) => {
    if (!content.trim() || !isConnected) return;

    try {
      const result: MessageSendResult = await sendMessage(content, replyToId);
      
      if (result.success) {
        // Clear reply context
        setReplyTo(null);
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

  const handleOpenSettings = () => {
    if (onSettings) {
      onSettings();
    } else {
      setSettingsDialogOpen(true);
    }
  };

  const handleOpenMembers = () => {
    if (onMembers) {
      onMembers();
    } else {
      setMembersDialogOpen(true);
    }
  };

  const handleSettingsUpdated = () => {
    // Reload room info when settings are updated
    if (currentRoom && loadMessages) {
      loadMessages();
    }
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
          roomName={
            (() => {
              // For guild rooms, format as "Guild Name - Guild Hall"
              const guildHallName = 'Guild Hall'; // TODO: Localize this
              
              // For guild rooms, prioritize the roomName prop (it's already formatted from GuildDetails)
              // This ensures we use the actual guild name from the guild data, not the API which might return IDs
              if (roomType === 'guild' && roomName?.trim()) {
                console.log('ChatHeader - Using roomName prop (guild room, prioritized):', roomName);
                // If it's already formatted, use as-is
                if (roomName.includes(' - ')) {
                  return roomName.trim();
                }
                // Otherwise, format it
                return `${roomName.trim()} - ${guildHallName}`;
              }
              
              // For non-guild rooms or when roomName prop is not available, try roomInfo from API
              // Try roomInfo.roomName first (from API)
              if ('roomName' in roomInfo && roomInfo.roomName?.trim()) {
                console.log('ChatHeader - Using roomInfo.roomName:', roomInfo.roomName);
                // If it's already formatted (contains " - Guild Hall"), use as-is
                if (roomInfo.roomName.includes(' - ')) {
                  return roomInfo.roomName.trim();
                }
                // Otherwise, format it for guild rooms
                if (roomType === 'guild') {
                  return `${roomInfo.roomName.trim()} - ${guildHallName}`;
                }
                return roomInfo.roomName.trim();
              }
              // Try roomInfo.guildName for guild rooms (only if roomName prop was not available above)
              if ('guildName' in roomInfo && roomInfo.guildName?.trim()) {
                console.log('ChatHeader - Checking roomInfo.guildName:', roomInfo.guildName);
                // Only use if it doesn't look like a UUID or ID
                const guildName = roomInfo.guildName.trim();
                // Check if it's not just an ID - match various ID formats:
                // - UUID format: 69a9d417-361d-4b05-9964-585f9883ee72
                // - Guild ID format: guild_69a9d417-361d-4b05-9964-585f9883ee72
                // - Guild# format: GUILD#guild_69a9d417-361d-4b05-9964-585f9883ee72
                const isId = 
                  guildName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
                  guildName.toLowerCase().match(/^(guild_|guild#)[0-9a-f-]+$/i) ||
                  guildName.toLowerCase().startsWith('guild_') ||
                  guildName.toLowerCase().startsWith('guild#');
                
                if (!isId && guildName.length > 2) {
                  // It's a real name, format as "Guild Name - Guild Hall"
                  console.log('ChatHeader - Using roomInfo.guildName (valid name):', guildName);
                  return `${guildName} - ${guildHallName}`;
                }
                // If it's an ID, skip it and fall through to roomName prop
                console.log('ChatHeader - Skipping roomInfo.guildName (looks like ID):', guildName);
              }
              // Fallback to roomName prop if roomInfo doesn't have a valid name
              if (roomName?.trim()) {
                console.log('ChatHeader - Using roomName prop (fallback):', roomName);
                // If it's already formatted, use as-is
                if (roomName.includes(' - ')) {
                  return roomName.trim();
                }
                // Otherwise, format it for guild rooms
                if (roomType === 'guild') {
                  return `${roomName.trim()} - ${guildHallName}`;
                }
                return roomName.trim();
              }
              console.log('ChatHeader - No roomName found, will use fallback');
              return undefined;
            })()
          }
          roomDescription={('description' in roomInfo && roomInfo.description?.trim()) ? roomInfo.description : undefined}
          roomType={roomType}
          isConnected={isConnected}
          activeConnections={roomInfo.memberCount}
          onRetry={handleRetry}
          onSettings={handleOpenSettings}
          onMembers={handleOpenMembers}
        />

        {/* Connection Status */}
        <ConnectionStatus
          status={connectionStatus}
          hasError={hasError}
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        {/* Messages List */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-900/20 dark:to-transparent" 
          style={{ 
            minHeight: 0, 
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb'
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
            messages={messagesWithReplies}
            currentUserId={userId}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            disableAutoScroll={true}
            onReply={handleReply}
            allowReactions={(() => {
              // Check if allowReactions property exists and its value
              // Default to true if not set, but respect explicit false
              const hasProperty = 'allowReactions' in roomInfo;
              let value: any = hasProperty ? roomInfo.allowReactions : undefined;
              
              // Normalize the value: convert string "false"/"true" to boolean, handle undefined
              if (value === "false") {
                value = false;
              } else if (value === "true") {
                value = true;
              } else if (value === false) {
                value = false; // Already false
              } else if (value === true) {
                value = true; // Already true
              } else {
                // undefined or null - means not set, so default to true (allow reactions)
                value = true;
              }
              
              console.log('ProductionChatInterface - allowReactions check:', { 
                hasProperty, 
                rawValue: hasProperty ? roomInfo.allowReactions : undefined,
                rawType: typeof (hasProperty ? roomInfo.allowReactions : undefined),
                normalizedValue: value,
                normalizedType: typeof value,
                final: value
              });
              return value;
            })()}
          />
          
          {/* Scroll anchor - used to scroll to bottom */}
          <div ref={messagesEndRef} style={{ height: 1 }} />

          {/* Error Display */}
          {hasError && errorMessage && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
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
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm">
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
            maxLength={('maxMessageLength' in roomInfo) ? (roomInfo.maxMessageLength || 2000) : 2000}
            rateLimitInfo={rateLimitInfo}
            replyTo={replyTo ? {
              messageId: replyTo.id,
              senderNickname: replyTo.senderNickname,
              text: replyTo.text
            } : null}
            onCancelReply={handleCancelReply}
          />
        </div>

        {/* Room Settings Dialog */}
        <RoomSettingsDialog
          roomId={roomId}
          roomName={roomName}
          roomType={roomType}
          isOpen={settingsDialogOpen}
          onClose={() => setSettingsDialogOpen(false)}
          onSettingsUpdated={handleSettingsUpdated}
        />

        {/* Room Members Dialog */}
        <RoomMembersDialog
          roomId={roomId}
          roomName={roomName}
          roomType={roomType}
          isOpen={membersDialogOpen}
          onClose={() => setMembersDialogOpen(false)}
          currentUserId={userId}
        />
      </div>
    </ErrorBoundary>
  );
}
