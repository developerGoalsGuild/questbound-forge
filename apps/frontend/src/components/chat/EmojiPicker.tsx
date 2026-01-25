/**
 * Emoji Picker Component
 * Lightweight emoji picker with common emojis
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

// Common emoji sets for quick access
const EMOJI_CATEGORIES = {
  recently: ['😀', '😂', '❤️', '👍', '🔥', '🎉'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  people: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒'],
  food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🎿', '⛷️', '🏂', '⛸️'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼'],
  objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'],
  flags: ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇳', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼']
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function EmojiPicker({ onSelect, children, className }: EmojiPickerProps) {
  const { t } = useTranslation();
  const emojiT = (t as any)?.chat?.emoji;
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    const stored = localStorage.getItem('chat_recent_emojis');
    return stored ? JSON.parse(stored) : EMOJI_CATEGORIES.recently;
  });

  // Get localized category name
  const getCategoryName = (cat: keyof typeof EMOJI_CATEGORIES): string => {
    return emojiT?.categories?.[cat] || cat;
  };

  // Filter emojis based on search
  const filteredEmojis = React.useMemo(() => {
    if (!searchTerm) {
      return EMOJI_CATEGORIES[selectedCategory];
    }
    
    // Simple search - combine all categories and filter
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    return allEmojis.filter(emoji => 
      emoji.includes(searchTerm) || 
      // Could add emoji name matching here if needed
      searchTerm.toLowerCase().includes(emoji)
    );
  }, [searchTerm, selectedCategory]);

  const handleEmojiSelect = (emoji: string) => {
    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 6);
    setRecentEmojis(updated);
    localStorage.setItem('chat_recent_emojis', JSON.stringify(updated));
    
    onSelect(emoji);
    setOpen(false);
    setSearchTerm('');
  };

  const categories = Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-8 w-8 p-0", className)}
            aria-label={emojiT?.addEmoji || "Add emoji"}
          >
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3">
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={emojiT?.searchEmojis || "Search emojis..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              aria-label={emojiT?.searchEmojis || "Search emojis"}
            />
          </div>

          {/* Categories */}
          {!searchTerm && (
            <div className="flex gap-1 mb-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={selectedCategory === cat ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs flex-shrink-0"
                  aria-label={`${emojiT?.selectCategory || "Select category"}: ${getCategoryName(cat)}`}
                >
                  {getCategoryName(cat)}
                </Button>
              ))}
            </div>
          )}

          {/* Emoji Grid */}
          <div 
            className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto"
            role="grid"
            aria-label={emojiT?.emojiPicker || "Emoji picker"}
          >
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                className={cn(
                  "text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  "transition-colors"
                )}
                aria-label={`${emojiT?.selectEmoji || "Select emoji"} ${emoji}`}
                tabIndex={0}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Recent section when not searching */}
          {!searchTerm && recentEmojis.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-gray-500 mb-2">{emojiT?.recent || "Recent"}</div>
              <div className="flex gap-1">
                {recentEmojis.map((emoji, index) => (
                  <button
                    key={`recent-${emoji}-${index}`}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-xl p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label={`${emojiT?.selectRecentEmoji || "Select recent emoji"} ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

