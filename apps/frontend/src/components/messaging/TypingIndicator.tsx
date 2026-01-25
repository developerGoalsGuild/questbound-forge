/**
 * Typing indicator component
 * Shows when users are typing in the chat
 */

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { TypingUser } from '../../types/messaging';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface TypingIndicatorProps {
  users: TypingUser[];
  className?: string;
}

export function TypingIndicator({ users, className = '' }: TypingIndicatorProps) {
  const { t } = useTranslation();
  const chatT = (t as any)?.chat?.typing;

  if (users.length === 0) {
    return null;
  }

  const getTypingMessage = () => {
    if (users.length === 1) {
      return (chatT?.isTyping || '{user} is typing...').replace('{user}', users[0].username);
    } else if (users.length === 2) {
      return (chatT?.areTyping || '{user1} and {user2} are typing...')
        .replace('{user1}', users[0].username)
        .replace('{user2}', users[1].username);
    } else {
      return (chatT?.andOthersTyping || '{user} and {count} others are typing...')
        .replace('{user}', users[0].username)
        .replace('{count}', String(users.length - 1));
    }
  };

  return (
    <div className={`flex items-center space-x-2 p-2 ${className}`}>
      {/* Typing avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <Avatar key={user.userId} className="h-6 w-6 border-2 border-white dark:border-gray-900">
            <AvatarFallback className="text-xs">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {users.length > 3 && (
          <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium">
            +{users.length - 3}
          </div>
        )}
      </div>

      {/* Typing animation */}
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {getTypingMessage()}
        </span>
      </div>
    </div>
  );
}
