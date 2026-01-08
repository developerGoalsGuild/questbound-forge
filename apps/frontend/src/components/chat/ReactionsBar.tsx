/**
 * ReactionsBar Component
 * Displays reactions for a message with ability to add/remove reactions
 */

import React from 'react';
import { Reaction } from '../../types/messaging';
import { Button } from '../ui/button';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '@/lib/utils';
import { useReactions } from '../../hooks/useReactions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ReactionsBarProps {
  messageId: string;
  initialReactions?: Reaction[];
  className?: string;
  onError?: (error: Error) => void;
  showAddButton?: boolean;
  isOwnMessage?: boolean;
}

export function ReactionsBar({ 
  messageId, 
  initialReactions, 
  className,
  onError,
  showAddButton = false,
  isOwnMessage = false
}: ReactionsBarProps) {
  const { reactions, toggleReaction, isLoading } = useReactions({
    messageId,
    initialReactions: initialReactions, // Pass as-is (undefined if not included, array if included)
    onError
  });

  const handleReactionClick = async (reaction: Reaction) => {
    await toggleReaction(reaction.shortcode, reaction.unicode);
  };

  const handleEmojiSelect = async (emoji: string) => {
    // Get shortcode from emoji - simple mapping
    const shortcodeMap: Record<string, string> = {
      '😀': ':grinning:', '😃': ':smiley:', '😄': ':smile:', '😁': ':grin:',
      '😆': ':laughing:', '😅': ':sweat_smile:', '🤣': ':rofl:', '😂': ':joy:',
      '🙂': ':slight_smile:', '🙃': ':upside_down:', '😉': ':wink:', '😊': ':blush:',
      '😇': ':innocent:', '🥰': ':smiling_face_with_3_hearts:', '😍': ':heart_eyes:',
      '🤩': ':star_struck:', '😘': ':kissing_heart:', '❤️': ':heart:', '👍': ':thumbsup:',
      '👎': ':thumbsdown:', '🔥': ':fire:', '🎉': ':tada:', '👋': ':wave:',
      '👌': ':ok_hand:', '✌️': ':v:', '🤞': ':crossed_fingers:', '🤘': ':metal:',
    };
    
    const shortcode = shortcodeMap[emoji] || `:emoji_${emoji.codePointAt(0)?.toString(16)}:`;
    
    // The hook will handle validation - it will prevent adding if at max
    await toggleReaction(shortcode, emoji);
  };

  // Don't render if loading and no initial reactions - but show if we have reactions or are not loading
  // If initialReactions is undefined, reactions weren't included in the query, so we're fetching them
  if (isLoading && reactions.length === 0 && initialReactions === undefined) {
    return null;
  }

  // Limit to maximum 5 different reaction types
  const MAX_REACTIONS = 5;
  const visibleReactions = reactions.slice(0, MAX_REACTIONS);
  const remainingCount = reactions.length - MAX_REACTIONS;
  // Can add if we have less than 5 different reaction types
  const canAddReaction = reactions.length < MAX_REACTIONS;

  // Determine order: for own messages (right side), add button should be last
  // For received messages (left side), add button should be after reactions
  const addButtonElement = showAddButton && canAddReaction ? (
    <TooltipProvider key="add-reaction">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <EmojiPicker onSelect={handleEmojiSelect}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!canAddReaction}
                className="h-8 w-8 p-0 rounded-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900/50 hover:from-blue-50 hover:to-white dark:hover:from-blue-950/30 dark:hover:to-gray-800 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-100 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20"
                aria-label={canAddReaction ? "Add reaction" : "Maximum reactions reached"}
              >
                <span className="text-lg leading-none opacity-70 hover:opacity-100 transition-all duration-300 hover:rotate-90" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}>
                  ➕
                </span>
              </Button>
            </EmojiPicker>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{canAddReaction ? 'Add reaction' : 'Maximum of 5 reactions reached'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  return (
    <div className={cn("flex items-end gap-1.5 flex-nowrap", className)} role="group" aria-label="Message reactions">
      {/* For own messages (right side): add button first, then reactions */}
      {isOwnMessage && addButtonElement}
      
      {/* Existing reactions - limited to 5 */}
      {visibleReactions.map((reaction) => (
        <TooltipProvider key={reaction.shortcode}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={reaction.viewerHasReacted ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleReactionClick(reaction)}
                className={cn(
                  "h-8 px-3 text-xs rounded-full flex items-center gap-2 flex-shrink-0",
                  "transition-all duration-300 ease-out",
                  "hover:scale-110 active:scale-100",
                  "relative overflow-hidden",
                  reaction.viewerHasReacted 
                    ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border-2 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-200 shadow-lg shadow-blue-300/40 dark:shadow-blue-500/30 ring-2 ring-blue-200/50 dark:ring-blue-500/30" 
                    : "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white dark:hover:from-blue-950/20 dark:hover:to-gray-800 hover:shadow-md hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20",
                  "font-medium backdrop-blur-sm"
                )}
                aria-label={`${reaction.count} ${reaction.shortcode} reaction${reaction.count !== 1 ? 's' : ''}${reaction.viewerHasReacted ? ', you reacted' : ''}`}
                aria-pressed={reaction.viewerHasReacted}
              >
                <span 
                  className={cn(
                    "text-lg leading-none select-none transition-transform duration-300",
                    "inline-block",
                    reaction.viewerHasReacted && "scale-110 drop-shadow-sm",
                    "hover:scale-125"
                  )} 
                  role="img" 
                  aria-label={reaction.shortcode}
                  style={{
                    filter: reaction.viewerHasReacted 
                      ? 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' 
                      : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                    textShadow: reaction.viewerHasReacted 
                      ? '0 0 8px rgba(59, 130, 246, 0.2)' 
                      : 'none'
                  }}
                >
                  {reaction.unicode}
                </span>
                <span className={cn(
                  "font-bold text-[12px] leading-tight min-w-[16px] text-center",
                  reaction.viewerHasReacted 
                    ? "text-blue-800 dark:text-blue-200" 
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  {reaction.count}
                </span>
                {reaction.viewerHasReacted && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-transparent animate-pulse" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {reaction.count} {reaction.shortcode}
                {reaction.viewerHasReacted && ' (You)'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {/* Show count if there are more than 5 reactions */}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-8 px-3 text-xs rounded-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/70 dark:to-gray-900/50 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 flex-shrink-0 hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-200 hover:shadow-md hover:scale-105">
                <span className="font-bold text-[12px] leading-tight">+{remainingCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more reaction{remainingCount !== 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* For received messages (left side): reactions first, then add button */}
      {!isOwnMessage && addButtonElement}
    </div>
  );
}

