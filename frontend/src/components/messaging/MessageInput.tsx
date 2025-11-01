/**
 * Message input component
 * Handles message composition, typing indicators, and sending
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RateLimitInfo } from '../../types/messaging';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { EmojiPicker } from '../chat/EmojiPicker';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  rateLimitInfo?: RateLimitInfo;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 2000,
  rateLimitInfo,
  className = ''
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle emoji selection - insert at cursor position
  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = message;
    
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setMessage(newText);
    
    // Restore cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      handleMessageChange(newText);
    }, 0);
  }, [message]);

  // Handle message change
  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    // Start typing indicator
    if (value.trim() && onTypingStart && !isComposing) {
      onTypingStart();
      setIsComposing(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing indicator after 2 seconds of inactivity
    if (value.trim() && onTypingStop) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
        setIsComposing(false);
      }, 2000);
    } else if (!value.trim()) {
      onTypingStop?.();
      setIsComposing(false);
    }
  };

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) return;

    setIsSending(true);
    
    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Stop typing indicator
      onTypingStop?.();
      setIsComposing(false);
      
      // Clear any typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show rate limit warning if applicable
      if (error instanceof Error && error.message.includes('rate limit')) {
        setShowRateLimit(true);
        if (rateLimitTimeoutRef.current) {
          clearTimeout(rateLimitTimeoutRef.current);
        }
        rateLimitTimeoutRef.current = setTimeout(() => {
          setShowRateLimit(false);
        }, 5000);
      }
    } finally {
      setIsSending(false);
    }
  }, [message, disabled, isSending, onSendMessage, onTypingStop]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > maxLength) {
      e.preventDefault();
      setMessage(pastedText.slice(0, maxLength));
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
    };
  }, []);

  // Handle recording (placeholder for future implementation)
  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  const isMessageEmpty = !message.trim();
  const isOverLimit = message.length > maxLength;
  const canSend = !isMessageEmpty && !disabled && !isSending && !isOverLimit;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Rate limit warning */}
      {showRateLimit && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You're sending messages too quickly. Please slow down.
          </AlertDescription>
        </Alert>
      )}

      {/* Rate limit info */}
      {rateLimitInfo?.isLimited && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <Clock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Rate limit exceeded. You can send messages again in {Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)} seconds.
          </AlertDescription>
        </Alert>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {/* Attachment button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={disabled}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className="min-h-[40px] max-h-[120px] resize-none border-0 p-0 focus:ring-0 focus:outline-none bg-transparent"
            rows={1}
          />
          
          {/* Character count */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-1 right-1 text-xs text-gray-400">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Emoji picker */}
        <EmojiPicker 
          onSelect={handleEmojiSelect}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        />

        {/* Voice recording button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 ${
                  isRecording 
                    ? 'text-red-500 hover:text-red-700' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={handleRecordingToggle}
                disabled={disabled}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRecording ? 'Stop recording' : 'Voice message'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Send button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!canSend}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSending ? 'Sending...' : 'Send message'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Helper text */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>
          Press Enter to send, Shift+Enter for new line
        </span>
        {isOverLimit && (
          <span className="text-red-500">
            Message too long ({message.length}/{maxLength})
          </span>
        )}
      </div>
    </div>
  );
}
