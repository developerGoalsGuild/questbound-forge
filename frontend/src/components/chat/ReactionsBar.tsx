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
  initialReactions = [], 
  className,
  onError,
  showAddButton = false,
  isOwnMessage = false
}: ReactionsBarProps) {
  const { reactions, toggleReaction, isLoading } = useReactions({
    messageId,
    initialReactions,
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
  if (isLoading && reactions.length === 0 && (!initialReactions || initialReactions.length === 0)) {
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
                className="h-7 w-7 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={canAddReaction ? "Add reaction" : "Maximum reactions reached"}
              >
                <span className="text-base leading-none">➕</span>
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
    <div className={cn("flex items-end gap-1 flex-nowrap", className)} role="group" aria-label="Message reactions">
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
                  "h-7 px-2 text-xs rounded-full flex items-center gap-1 flex-shrink-0",
                  reaction.viewerHasReacted && "bg-primary/20 border-primary",
                  "hover:bg-primary/10 transition-colors"
                )}
                aria-label={`${reaction.count} ${reaction.shortcode} reaction${reaction.count !== 1 ? 's' : ''}${reaction.viewerHasReacted ? ', you reacted' : ''}`}
                aria-pressed={reaction.viewerHasReacted}
              >
                <span className="text-base leading-none" role="img" aria-label={reaction.shortcode}>
                  {reaction.unicode}
                </span>
                <span className="font-medium">{reaction.count}</span>
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
              <div className="h-7 px-2 text-xs rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                <span className="font-medium">+{remainingCount}</span>
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

