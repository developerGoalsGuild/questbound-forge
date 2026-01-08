import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  isFieldValidating?: boolean;
  isFieldValid?: boolean;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
}

const TAG_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

const TagsInput: React.FC<TagsInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add tags and press Enter',
  error,
  isFieldValidating = false,
  isFieldValid = false,
  maxTags = 10,
  disabled = false,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // Validate tag
    if (!trimmedTag) return;
    if (trimmedTag.length > 50) return;
    if (!TAG_REGEX.test(trimmedTag)) return;
    if (value.includes(trimmedTag)) return;
    if (value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(value.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Prevent adding invalid characters
    if (TAG_REGEX.test(newValue) || newValue === '') {
      setInputValue(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
          {value.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTag(index)}
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || value.length >= maxTags}
          className={`pr-10 ${error ? 'border-destructive' : isFieldValid ? 'border-green-500' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? 'tags-error' : undefined}
        />
        
        {/* Validation status icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isFieldValidating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          ) : isFieldValid ? (
            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          ) : error ? (
            <div className="h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p id="tags-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        {value.length >= maxTags ? (
          <span className="text-destructive">Maximum {maxTags} tags allowed</span>
        ) : (
          <span>
            {value.length}/{maxTags} tags • Press Enter or comma to add
          </span>
        )}
      </div>
    </div>
  );
};

export default TagsInput;
