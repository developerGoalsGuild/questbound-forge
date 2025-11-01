/**
 * Individual message item component
 * Displays a single message with proper styling and interactions
 */

import React, { useEffect, useMemo, useState } from 'react';
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
  Clock,
  CornerDownLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ReactionsBar } from '../chat/ReactionsBar';

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
  allowReactions?: boolean; // Whether reactions are allowed in this room
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
  className = '',
  allowReactions = true
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isOwn = isOwnMessage(message, currentUserId);
  const sanitizedText = useMemo(() => {
    try {
      let value = message.text ?? '';
      value = value.replace(/\r\n?/g, '\n');
      value = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, '');
      value = value.replace(/[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g, '');
      value = value.replace(/\n+/g, ' ');
      return value;
    } catch {
      return message.text ?? '';
    }
  }, [message.text]);

  useEffect(() => {
    try {
      if (isOwn) {
        const codes = Array.from(sanitizedText).map(char => char.charCodeAt(0));
        console.debug('Chat message debug', sanitizedText, codes.join(','));
      }
    } catch {}
  }, [sanitizedText, isOwn]);

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
  const replyPreview = message.replyTo ?? null;
  const replyIsFallback = !!replyPreview?.isFallback;
  const rawReplySender = (replyPreview?.senderNickname || '').trim();
  const replySender = rawReplySender || 'Unknown user';
  const showReplySender = Boolean(rawReplySender);
  const replyText = (replyPreview?.text || '').replace(/\s+/g, ' ').trim();
  const replyBodyText = replyText || (replyIsFallback ? 'Original message unavailable' : 'No message content');
  const replyContainerClass = isOwn
    ? replyIsFallback
      ? 'border-white/20 border-l-amber-200/70 bg-white/10 text-white/80'
      : 'border-white/20 border-l-blue-200/70 bg-white/10 text-white/80'
    : replyIsFallback
      ? 'border-amber-200/70 border-l-amber-500/60 bg-amber-50/80 text-amber-900 dark:border-amber-900/40 dark:border-l-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100'
      : 'border-blue-200/70 border-l-blue-500/60 bg-blue-50/80 text-blue-900 dark:border-blue-900/50 dark:border-l-blue-500/40 dark:bg-blue-900/20 dark:text-blue-100';
  const replyTitleClass = isOwn
    ? replyIsFallback
      ? 'text-white/75'
      : 'text-white/80'
    : replyIsFallback
      ? 'text-amber-800 dark:text-amber-200'
      : 'text-blue-700 dark:text-blue-200';
  const replySenderClass = replyIsFallback
    ? isOwn
      ? 'text-white/70'
      : 'text-amber-800/80 dark:text-amber-200/85'
    : isOwn
      ? 'text-white font-semibold'
      : 'text-blue-900 dark:text-blue-100 font-semibold';
  const replyBodyClass = replyIsFallback
    ? isOwn
      ? 'mt-1 text-xs italic text-white/75'
      : 'mt-1 text-xs italic text-amber-900/90 dark:text-amber-100/85'
    : isOwn
      ? 'mt-1 text-xs leading-relaxed text-white/80 line-clamp-2'
      : 'mt-1 text-xs leading-relaxed text-blue-900/90 dark:text-blue-100/90 line-clamp-2';
  const replyIconClass = replyIsFallback
    ? isOwn
      ? 'text-white/70'
      : 'text-amber-500 dark:text-amber-200'
    : isOwn
      ? 'text-white/70'
      : 'text-blue-600 dark:text-blue-200';

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
            {(message.senderNickname || message.senderId).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div
        className={`flex flex-col min-w-0 ${
          isOwn ? 'items-end ml-auto w-fit max-w-full' : 'items-start max-w-[70%]'
        }`}
      >
        {/* Message bubble with reactions inline */}
        <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Message bubble */}
          <div
            className={`
              relative inline-flex flex-col max-w-full flex-none
              transition-all duration-200 ease-out
              ${isOwn 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-sm shadow-lg shadow-blue-500/20' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700'
              }
              ${isFirstInGroup ? '' : isOwn ? 'rounded-tr-md' : 'rounded-tl-md'}
              ${isLastInGroup ? '' : isOwn ? 'rounded-br-md' : 'rounded-bl-md'}
              ${isGrouped ? 'mt-1.5' : 'mt-2'}
              ${isOwn ? 'px-4 py-2.5' : 'px-4 py-2.5'}
            `}
          >
            {/* Reply preview */}
            {replyPreview && (
              <div
                className={`mb-2 rounded-lg border px-3 py-2 text-xs shadow-sm border-l-4 ${replyContainerClass}`}
              >
                <div
                  className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide ${replyTitleClass} whitespace-nowrap min-w-0`}
                >
                  <CornerDownLeft className={`h-3.5 w-3.5 flex-shrink-0 ${replyIconClass}`} />
                  <span className="flex-shrink-0">Replying to</span>
                  {showReplySender && (
                    <span className={`${replySenderClass} truncate ml-1 min-w-0`}>
                      {replySender}
                    </span>
                  )}
                </div>
                <div className={replyBodyClass}>
                  {replyBodyText}
                </div>
              </div>
            )}

            <span
              className={`block text-sm leading-relaxed whitespace-normal text-left font-normal ${isOwn ? 'bubble-text-own' : 'bubble-text-other'}`}
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {sanitizedText}
            </span>

            {/* Message actions */}
            {isHovered && (
              <div className="absolute -top-10 right-0 flex items-center space-x-1 bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-sm text-white rounded-xl px-2 py-1.5 shadow-xl border border-gray-700/50 transition-all duration-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={handleCopy}
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
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
                          className="h-7 w-7 p-0 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          onClick={handleReply}
                        >
                          <Reply className="h-3.5 w-3.5" />
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
                        className="h-7 w-7 p-0 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
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

          {/* Reactions - positioned beside the message */}
          {/* Only show if reactions are allowed in this room */}
          {/* Use !== false to allow true and undefined (default), but block false */}
          {allowReactions !== false && (
            <ReactionsBar
              messageId={message.id}
              initialReactions={message.reactions}
              className="items-end self-end"
              showAddButton={isHovered}
              isOwnMessage={isOwn}
            />
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
