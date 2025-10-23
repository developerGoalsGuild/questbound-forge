/**
 * MessageGroup component
 * Groups consecutive messages from the same user
 */

import React from 'react';
import { Message } from '../../types/messaging';
import { MessageItem } from './MessageItem';

interface MessageGroupProps {
  messages: Message[];
  currentUserId: string;
  showAvatar?: boolean;
  onMessageAction?: (messageId: string, action: string) => void;
}

export const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  currentUserId,
  showAvatar = true,
  onMessageAction
}) => {
  if (!messages || messages.length === 0) {
    return null;
  }

  const firstMessage = messages[0];
  const isOwnGroup = firstMessage.senderId === currentUserId;

  return (
    <div className={`flex ${isOwnGroup ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnGroup ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[80%]`}>
        {/* Avatar - only show for first message in group */}
        {showAvatar && (
          <div className={`flex-shrink-0 ${isOwnGroup ? 'ml-2' : 'mr-2'}`}>
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
              {firstMessage.senderName?.charAt(0) || 'U'}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className={`flex flex-col ${isOwnGroup ? 'items-end' : 'items-start'}`}>
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              showAvatar={false} // Avatar is handled by the group
              isFirstInGroup={index === 0}
              isLastInGroup={index === messages.length - 1}
              onMessageAction={onMessageAction}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
