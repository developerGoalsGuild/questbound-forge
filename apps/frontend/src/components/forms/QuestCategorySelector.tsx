import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { QUEST_CATEGORIES } from '@/models/quest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface QuestCategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  // Validation status props
  isFieldValidating?: boolean;
  isFieldValid?: boolean;
}

const QuestCategorySelector: React.FC<QuestCategorySelectorProps> = ({
  value = '',
  onValueChange,
  error,
  disabled = false,
  className = '',
  placeholder = 'Select a category',
  isFieldValidating = false,
  isFieldValid = undefined
}) => {
  const { t } = useTranslation();

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const fields = questTranslations?.fields ?? {};
  const hints = questTranslations?.hints ?? {};
  const fieldHints = (hints.fields ?? {}) as Record<string, string | undefined>;
  const iconLabelTemplate = typeof hints.iconLabel === 'string' ? hints.iconLabel : 'More information about {field}';

  // Accessibility helpers
  const createHintId = (id: string) => `${id}-hint`;
  const formatHintLabel = (fieldLabel: string) => {
    const safeLabel = fieldLabel && fieldLabel.trim().length > 0 ? fieldLabel.trim() : 'this field';
    if (iconLabelTemplate.includes('{field}')) {
      return iconLabelTemplate.replace('{field}', safeLabel);
    }
    return `${iconLabelTemplate} ${safeLabel}`.trim();
  };

  // Info icon + tooltip component (accessible)
  const InfoHint = ({ hint, targetId, fieldLabel }: { hint?: string; targetId: string; fieldLabel: string }) => {
    if (!hint) {
      return null;
    }
    const descriptionId = createHintId(targetId);
    const tooltipId = `${descriptionId}-content`;
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={formatHintLabel(fieldLabel)}
              aria-describedby={descriptionId}
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            id={tooltipId}
            role="tooltip"
            side="top"
            align="start"
            aria-labelledby={descriptionId}
            className="max-w-xs text-sm leading-relaxed"
          >
            {hint}
          </TooltipContent>
        </Tooltip>
        <span id={descriptionId} className="sr-only">
          {hint}
        </span>
      </>
    );
  };

  // Get current error
  const hasError = Boolean(error);

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`space-y-2 ${className}`}>
        {/* Label with Hint */}
        <div className="flex items-center gap-2">
          <Label 
            htmlFor="quest-category"
            className="text-sm font-medium"
          >
            {fields.category || 'Category'}
          </Label>
          <InfoHint 
            targetId="quest-category" 
            fieldLabel={fields.category || 'Category'} 
            hint={fieldHints.category} 
          />
        </div>

        {/* Category Selection */}
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            id="quest-category"
            className={`w-full pr-10 ${
              hasError 
                ? 'border-destructive focus-visible:ring-destructive' 
                : isFieldValid 
                  ? 'border-green-500 focus-visible:ring-green-500'
                  : ''
            }`}
            aria-describedby={
              fieldHints.category ? createHintId('quest-category') : undefined
            }
            aria-invalid={hasError}
          >
            <SelectValue placeholder={placeholder} />
            {/* Validation status icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isFieldValidating ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isFieldValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : hasError ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : null}
            </div>
          </SelectTrigger>
          <SelectContent>
            {QUEST_CATEGORIES.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id}
                data-testid={`category-${category.id}`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{category.name}</span>
                  {category.description && (
                    <span className="text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Error Message */}
        {hasError && (
          <p 
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
};

export default QuestCategorySelector;
