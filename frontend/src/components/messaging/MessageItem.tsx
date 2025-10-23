/**
 * Individual message item component
 * Displays a single message with proper styling and interactions
 */

import React, { useState } from 'react';
import { Message } from '../../types/messaging';
import { formatMessageTimestamp, isOwnMessage } from '../../lib/api/messaging';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  MoreHorizontal, 
  Copy, 
  Reply, 
  Edit, 
  Trash2, 
  Check, 
  CheckCheck,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isGrouped?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  className?: string;
}

export function MessageItem({
  message,
  currentUserId,
  showAvatar = false,
  showTimestamp = false,
  isGrouped = false,
  isFirstInGroup = false,
  isLastInGroup = false,
  onReply,
  onEdit,
  onDelete,
  className = ''
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isOwn = isOwnMessage(message, currentUserId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleReply = () => {
    onReply?.(message);
  };

  const handleEdit = () => {
    onEdit?.(message);
  };

  const handleDelete = () => {
    onDelete?.(message);
  };

  const getMessageStatus = () => {
    // This would typically come from the message state
    // For now, we'll show different statuses based on message age
    const messageAge = Date.now() - message.ts;
    
    if (messageAge < 1000) {
      return { icon: Clock, text: 'Sending', className: 'text-gray-400' };
    } else if (messageAge < 5000) {
      return { icon: Check, text: 'Sent', className: 'text-gray-400' };
    } else {
      return { icon: CheckCheck, text: 'Delivered', className: 'text-blue-500' };
    }
  };

  const status = getMessageStatus();
  const StatusIcon = status.icon;

  return (
    <div
      className={`group flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="w-6 h-6 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {message.senderId.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div
          className={`
            relative px-3 py-2 rounded-2xl max-w-full break-words
            ${isOwn 
              ? 'bg-blue-500 text-white rounded-br-md' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
            }
            ${isFirstInGroup ? '' : isOwn ? 'rounded-tr-md' : 'rounded-tl-md'}
            ${isLastInGroup ? '' : isOwn ? 'rounded-br-md' : 'rounded-bl-md'}
            ${isGrouped ? 'mt-1' : ''}
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>

          {/* Message actions */}
          {isHovered && (
            <div className="absolute -top-8 right-0 flex items-center space-x-1 bg-gray-800 text-white rounded-lg px-2 py-1 shadow-lg">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={handleCopy}
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCopied ? 'Copied!' : 'Copy message'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {!isOwn && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                        onClick={handleReply}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reply</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleReply}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {/* Message status and timestamp */}
        {showTimestamp && (
          <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <StatusIcon className={`h-3 w-3 ${status.className}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessageTimestamp(message.ts)}
            </span>
          </div>
        )}
      </div>

      {/* Spacer for alignment */}
      {!isOwn && !showAvatar && <div className="w-6" />}
    </div>
  );
}
