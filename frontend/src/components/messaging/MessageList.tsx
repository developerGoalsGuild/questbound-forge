/**
 * Message list component
 * Displays messages with grouping, timestamps, and user information
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message } from '../../types/messaging';
import { MessageItem } from './MessageItem';
import { MessageGroup } from './MessageGroup';
import { formatMessageTimestamp, isOwnMessage, shouldGroupWithPrevious } from '../../lib/api/messaging';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { ChevronUp, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
  disableAutoScroll?: boolean; // Allow parent to control scrolling
}

export function MessageList({
  messages,
  currentUserId,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className = '',
  disableAutoScroll = false
}: MessageListProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  // Group messages by sender and time proximity
  const groupedMessages = React.useMemo(() => {
    if (messages.length === 0) return [];

    const groups: Message[][] = [];
    let currentGroup: Message[] = [];

    messages.forEach((message, index) => {
      const previousMessage = index > 0 ? messages[index - 1] : null;
      
      if (shouldGroupWithPrevious(message, previousMessage, currentUserId)) {
        currentGroup.push(message);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [message];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [messages, currentUserId]);

  // Handle load more messages
  const handleLoadMore = async () => {
    if (isLoadingMore || !onLoadMore) return;

    setIsLoadingMore(true);
    setShowLoadMore(false);
    
    // Store scroll position before loading
    if (listRef.current) {
      previousScrollHeight.current = listRef.current.scrollHeight;
    }

    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Restore scroll position after loading more messages (only if auto-scroll is enabled)
  useEffect(() => {
    if (disableAutoScroll || isLoadingMore || !listRef.current || previousScrollHeight.current === 0) return;
    
    const newScrollHeight = listRef.current.scrollHeight;
    const scrollDiff = newScrollHeight - previousScrollHeight.current;
    
    if (scrollDiff > 0) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = scrollDiff;
        }
      });
    }
  }, [isLoadingMore, messages, disableAutoScroll]);

  // Show load more button when scrolling to top
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setShowLoadMore(scrollTop < 100 && hasMore && !isLoadingMore);
  };

  // Auto-scroll to bottom for new messages (only if auto-scroll is enabled)
  useEffect(() => {
    if (disableAutoScroll || isLoadingMore || !listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom) {
      // Use requestAnimationFrame to prevent flickering
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isLoadingMore, disableAutoScroll]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${className}`}>
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No messages yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start the conversation by sending a message below.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Load more button */}
      {showLoadMore && (
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="rounded-full"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Load more messages
              </>
            )}
          </Button>
        </div>
      )}

      {/* Messages list */}
      <div
        ref={disableAutoScroll ? undefined : listRef}
        className="space-y-4"
        onScroll={disableAutoScroll ? undefined : handleScroll}
      >
        {isLoading && messages.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <MessageGroup
              key={`group-${groupIndex}`}
              messages={group}
              currentUserId={currentUserId}
              isFirstGroup={groupIndex === 0}
              isLastGroup={groupIndex === groupedMessages.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Message group component for better organization
interface MessageGroupProps {
  messages: Message[];
  currentUserId: string;
  isFirstGroup: boolean;
  isLastGroup: boolean;
}

function MessageGroup({ messages, currentUserId, isFirstGroup, isLastGroup }: MessageGroupProps) {
  const firstMessage = messages[0];
  const isOwnGroup = isOwnMessage(firstMessage, currentUserId);
  const [resolvedName] = React.useState<string>('');
  const nickname = useMemo(() => {
    try {
      // Primary source: auth cache
      const authRaw = localStorage.getItem('auth');
      const auth = authRaw ? JSON.parse(authRaw) : null;
      const authNickname = auth?.user?.nickname || auth?.user?.fullName;
      if (auth?.user?.id && auth.user.id === firstMessage.senderId && authNickname) {
        return authNickname;
      }

      // Secondary source: persisted profile
      const profileRaw = localStorage.getItem('profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : null;
      if (profile?.id === firstMessage.senderId) {
        return profile.nickname || profile.fullName || `User ${firstMessage.senderId.slice(-4)}`;
      }
    } catch {}
    return resolvedName || `User ${firstMessage.senderId.slice(-4)}`;
  }, [firstMessage.senderId, resolvedName]);

  // No remote lookups; rely solely on senderNickname field or local cache

  return (
    <div className={`flex ${isOwnGroup ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[70%] ${isOwnGroup ? 'items-end' : 'items-start'}`}>
        {/* User info for first message in group */}
        {!isOwnGroup && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
              {(firstMessage.senderNickname || firstMessage.senderId).charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {firstMessage.senderNickname || nickname}
            </span>
          </div>
        )}

        {/* Messages in group */}
        <div className="space-y-1">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              showAvatar={index === 0 && !isOwnGroup}
              showTimestamp={index === messages.length - 1}
              isGrouped={messages.length > 1}
              isFirstInGroup={index === 0}
              isLastInGroup={index === messages.length - 1}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
