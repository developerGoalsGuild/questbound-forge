/**
 * GuildCreationForm Component
 *
 * A comprehensive form component for creating new guilds with validation,
 * accessibility features, and internationalization support.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Globe,
  Lock,
  Shield,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { guildAPI, GuildCreateInput } from '@/lib/api/guild';
import { guildCreateSchema, GuildCreateForm, getTagSuggestions } from '@/lib/validation/guildValidation';
import { getGuildTranslations, GUILD_TRANSLATION_KEYS } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormAccessibility } from '@/hooks/useAccessibility';
import { ARIALiveRegion } from '@/components/ui/aria-live-region';
import { AvatarUpload } from './AvatarUpload';

interface GuildCreationFormProps {
  onSuccess?: (guild: any) => void;
  onCancel?: () => void;
  initialData?: Partial<GuildCreateInput>;
  mode?: 'create' | 'edit';
  className?: string;
}

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
  error?: string;
  translations?: any;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  suggestions = [],
  maxTags = 10,
  placeholder = 'Add tags...',
  error,
  translations,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim()) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        !tags.includes(suggestion.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, tags]);

  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < maxTags) {
      onTagsChange([...tags, normalizedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  }, [tags, onTagsChange, maxTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  }, [tags, onTagsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }, [inputValue, tags, addTag, removeTag]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    addTag(suggestion);
  }, [addTag]);

  return (
    <div className="space-y-2">
      <Label htmlFor="tags-input" className="text-sm font-medium">
        {translations?.create?.form?.tags?.label || 'Tags'}
      </Label>
      
      {/* Tags Display */}
      {tags.length > 0 && (
        <div 
          className="flex flex-wrap gap-2 mb-2" 
          role="group" 
          aria-label={`Selected tags: ${tags.join(', ')}`}
        >
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
              role="text"
            >
              <Tag className="h-3 w-3" aria-hidden="true" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label={`${translations?.create?.form?.tags?.removeTag || 'Remove'} ${tag} tag`}
                title={`${translations?.create?.form?.tags?.removeTag || 'Remove'} ${tag}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Input */}
      <div className="relative">
        <Input
          id="tags-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim()) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={tags.length >= maxTags ? `${translations?.create?.form?.tags?.maxReached || 'Maximum'} ${maxTags}` : placeholder}
          disabled={tags.length >= maxTags}
          className={cn(
            'pr-8',
            error && 'border-red-500 focus:border-red-500'
          )}
          aria-describedby={error ? 'tags-error' : 'tags-help'}
          aria-invalid={!!error}
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
        />
        
        {inputValue.trim() && tags.length < maxTags && (
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={`${translations?.create?.form?.tags?.addTag || 'Add tag'}: ${inputValue}`}
            title={`${translations?.create?.form?.tags?.addTag || 'Add tag'}: ${inputValue}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
          role="listbox"
          aria-label="Tag suggestions"
        >
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              role="option"
              aria-label={`Add tag: ${suggestion}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p id="tags-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Tag Count */}
      <p id="tags-help" className="text-xs text-gray-500">
        {tags.length}/{maxTags} {translations?.create?.form?.tags?.count || 'tags'}
      </p>
    </div>
  );
};

export const GuildCreationForm: React.FC<GuildCreationFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  mode = 'create',
  className,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Get translations with fallback
  const translations = getGuildTranslations(t('lang'));
  
  // Form accessibility
  const { announceFormSuccess, announceFormError, announceValidationError, focusFirstError } = useFormAccessibility();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<GuildCreateForm>({
    resolver: zodResolver(guildCreateSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      tags: initialData?.tags || [],
      guildType: initialData?.guildType ?? 'public',
    },
    mode: 'onChange',
  });

  const watchedTags = watch('tags');
  const watchedName = watch('name');

  // Load tag suggestions
  useEffect(() => {
    const suggestions = getTagSuggestions('', watchedTags);
    setTagSuggestions(suggestions);
  }, [watchedTags]);

  // Clear validation errors when user starts typing
  const handleFieldChange = useCallback((field: keyof GuildCreateForm) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setValue(field, value as any);
      
      if (errors[field]) {
        clearErrors(field);
      }
    };
  }, [setValue, errors, clearErrors]);

  // Focus first error when form is invalid
  useEffect(() => {
    if (!isValid && isDirty && Object.keys(errors).length > 0) {
      const formRef = { current: document.querySelector('form') as HTMLFormElement };
      focusFirstError(formRef);
    }
  }, [isValid, isDirty, errors, focusFirstError]);

  const handleTagsChange = useCallback((tags: string[]) => {
    setValue('tags', tags, { shouldValidate: true });
    if (errors.tags) {
      clearErrors('tags');
    }
  }, [setValue, errors, clearErrors]);

  const handleAvatarUploadSuccess = useCallback((url: string) => {
    setAvatarUrl(url);
    toast.success(translations.create.form.avatar.success);
  }, []);

  const handleAvatarUploadError = useCallback((error: string) => {
    toast.error(`${translations.create.form.avatar.error}: ${error}`);
  }, []);

  const onSubmit = useCallback(async (data: GuildCreateForm) => {
    setIsSubmitting(true);
    
    try {
      const guildData: GuildCreateInput = {
        name: data.name,
        description: data.description,
        tags: data.tags,
        guildType: data.guildType,
      };

      const createdGuild = await guildAPI.createGuild(guildData);
      
      toast.success(translations.messages.createSuccess);
      announceFormSuccess(translations.messages.createSuccess);
      onSuccess?.(createdGuild);
    } catch (error) {
      console.error('Guild creation error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('name') && error.message.includes('taken')) {
          setError('name', {
            type: 'manual',
            message: translations.validation.nameTaken,
          });
          announceValidationError('Guild name', translations.validation.nameTaken);
        } else {
          toast.error(error.message || translations.messages.error);
          announceFormError(error.message || translations.messages.error);
        }
      } else {
        toast.error(translations.messages.error);
        announceFormError(translations.messages.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [translations, onSuccess, setError, announceFormSuccess, announceFormError, announceValidationError]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (confirm(translations.create.form.validation.cancelConfirm)) {
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  }, [isDirty, onCancel]);

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" id="guild-form-title">
          <Users className="h-5 w-5" aria-hidden="true" />
          {mode === 'edit' ? translations.create.editTitle : translations.create.title}
        </CardTitle>
        <p className="text-sm text-gray-600" id="guild-form-description">
          {translations.create.subtitle}
        </p>
      </CardHeader>

      <CardContent>
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-6"
          role="form"
          aria-labelledby="guild-form-title"
          aria-describedby="guild-form-description"
          noValidate
        >
          {/* Guild Name */}
          <div className="space-y-2">
            <Label htmlFor="guild-name" className="text-sm font-medium">
              {translations.create.form.name.label} *
            </Label>
            <Input
              id="guild-name"
              {...register('name')}
              onChange={handleFieldChange('name')}
              placeholder={translations.create.form.name.placeholder}
              className={cn(
                errors.name && 'border-red-500 focus:border-red-500'
              )}
              aria-describedby={errors.name ? 'guild-name-error' : 'guild-name-help'}
              aria-invalid={!!errors.name}
            />
            
            {errors.name ? (
              <p id="guild-name-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" />
                {errors.name.message}
              </p>
            ) : (
              <p id="guild-name-help" className="text-xs text-gray-500">
                {translations.create.form.name.help}
              </p>
            )}
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {translations.create.form.avatar.label}
            </Label>
            <div className="flex justify-center">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleAvatarUploadError}
                disabled={isSubmitting}
                size="lg"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {translations.create.form.avatar.help}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="guild-description" className="text-sm font-medium">
              {translations.create.form.description.label}
            </Label>
            <Textarea
              id="guild-description"
              {...register('description')}
              onChange={handleFieldChange('description')}
              placeholder={translations.create.form.description.placeholder}
              rows={3}
              className={cn(
                errors.description && 'border-red-500 focus:border-red-500'
              )}
              aria-describedby={errors.description ? 'guild-description-error' : 'guild-description-help'}
              aria-invalid={!!errors.description}
            />
            
            {errors.description ? (
              <p id="guild-description-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" />
                {errors.description.message}
              </p>
            ) : (
              <p id="guild-description-help" className="text-xs text-gray-500">
                {translations.create.form.description.help}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <TagInput
              tags={watchedTags}
              onTagsChange={handleTagsChange}
              suggestions={tagSuggestions}
              maxTags={10}
              placeholder={translations.create.form.tags.placeholder}
              error={errors.tags?.message}
              translations={translations}
            />
            <p className="text-xs text-gray-500">
              {translations.create.form.tags.help}
            </p>
          </div>

          {/* Guild Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="guild-type" className="text-sm font-medium">
              {translations.create.form.guildType.label}
            </Label>
            
            <Select
              value={watch('guildType')}
              onValueChange={(value) => setValue('guildType', value as 'public' | 'private' | 'approval')}
            >
              <SelectTrigger id="guild-type" aria-describedby="guild-type-help">
                <SelectValue placeholder={translations.create.form.guildType.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {translations.create.form.guildType.options.public}
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {translations.create.form.guildType.options.private}
                  </div>
                </SelectItem>
                <SelectItem value="approval">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {translations.create.form.guildType.options.approval}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {watch('guildType') === 'public' && (
                <>
                  <Globe className="h-4 w-4" />
                  {translations.create.form.guildType.descriptions.public}
                </>
              )}
              {watch('guildType') === 'private' && (
                <>
                  <Lock className="h-4 w-4" />
                  {translations.create.form.guildType.descriptions.private}
                </>
              )}
              {watch('guildType') === 'approval' && (
                <>
                  <Shield className="h-4 w-4" />
                  {translations.create.form.guildType.descriptions.approval}
                </>
              )}
            </div>
            
            <p id="guild-type-help" className="text-xs text-gray-500">
              {translations.create.form.guildType.help}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {translations.create.actions.creating}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {translations.create.actions.create}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {translations.create.actions.cancel}
            </Button>
          </div>

          {/* Form Status */}
          {!isValid && isDirty && (
            <Alert role="alert" aria-live="polite">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                {translations.create.form.validation.fixErrors}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      <ARIALiveRegion 
        message="" 
        priority="polite" 
        className="sr-only"
      />
    </Card>
  );
};
