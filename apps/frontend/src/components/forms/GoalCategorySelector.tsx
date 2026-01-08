import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { GOAL_CATEGORIES, GoalCategory } from '@/models/goal';
import { validateGoalCategory } from '@/lib/validation/goalValidation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface GoalCategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
  placeholder?: string;
  // Validation status props
  isFieldValidating?: boolean;
  isFieldValid?: boolean;
}

const GoalCategorySelector: React.FC<GoalCategorySelectorProps> = ({
  value = '',
  onValueChange,
  error,
  disabled = false,
  className = '',
  allowCustom = true,
  placeholder = 'Select a category',
  isFieldValidating = false,
  isFieldValid = undefined
}) => {
  const { t } = useTranslation();
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Get translations with safety checks
  const goalsTranslations = (t as any)?.goals;
  const fields = goalsTranslations?.fields ?? {};
  const hints = goalsTranslations?.hints ?? {};
  const fieldHints = (hints.fields ?? {}) as Record<string, string | undefined>;
  const iconLabelTemplate = typeof hints.iconLabel === 'string' ? hints.iconLabel : 'More information about {field}';

  // Check if current value is a custom category (not in predefined list)
  const isCurrentValueCustom = value && !GOAL_CATEGORIES.some(cat => cat.id === value);

  // Initialize custom mode if value is custom
  React.useEffect(() => {
    if (isCurrentValueCustom && !isCustomMode) {
      setCustomCategory(value);
      setIsCustomMode(true);
    }
  }, [value, isCurrentValueCustom, isCustomMode]);

  // Accessibility helpers
  const createHintId = (id: string) => `${id}-hint`;
  const formatHintLabel = (_fieldLabel: string) => {
    // Use a generic label to avoid conflicting with form field labels in accessibility queries
    return 'More information';
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

  // Handle category selection
  const handleCategorySelect = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setIsCustomMode(true);
      setCustomCategory(value || '');
    } else {
      setIsCustomMode(false);
      setCustomCategory('');
      onValueChange(selectedValue);
    }
  };

  // Handle custom category input
  const handleCustomCategoryChange = (inputValue: string) => {
    setCustomCategory(inputValue);
    onValueChange(inputValue);
  };

  // Handle custom category blur (validate)
  const handleCustomCategoryBlur = () => {
    if (customCategory.trim()) {
      const validation = validateGoalCategory(customCategory.trim());
      if (validation.isValid) {
        onValueChange(customCategory.trim());
      }
    }
  };

  // Get current display value
  const getDisplayValue = () => {
    if (isCustomMode) {
      return customCategory;
    }
    const selectedCategory = GOAL_CATEGORIES.find(cat => cat.id === value);
    return selectedCategory ? selectedCategory.name : value;
  };

  // Get current error
  const getCurrentError = () => {
    if (error) return error;
    if (isCustomMode && customCategory.trim()) {
      const validation = validateGoalCategory(customCategory.trim());
      return validation.isValid ? undefined : validation.error;
    }
    return undefined;
  };

  const currentError = getCurrentError();
  const hasError = Boolean(currentError);

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`space-y-2 ${className}`}>
        {/* Label with Hint */}
        <div className="flex items-center gap-2">
          <Label 
            htmlFor="goal-category"
            className="text-sm font-medium"
          >
            {fields.category || 'Category'}
          </Label>
          <InfoHint 
            targetId="goal-category" 
            fieldLabel={fields.category || 'Category'} 
            hint={fieldHints.category} 
          />
        </div>

        {/* Category Selection */}
        {!isCustomMode ? (
          <Select
            value={value}
            onValueChange={handleCategorySelect}
            disabled={disabled}
          >
            <SelectTrigger
              id="goal-category"
              className={`w-full pr-10 ${
                hasError 
                  ? 'border-destructive focus-visible:ring-destructive' 
                  : isFieldValid 
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : ''
              }`}
              aria-describedby={
                fieldHints.category ? createHintId('goal-category') : undefined
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
              {GOAL_CATEGORIES.map((category) => (
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
              {allowCustom && (
                <SelectItem 
                  value="custom"
                  data-testid="category-custom"
                >
                  <span className="font-medium">Custom category...</span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="goal-category"
                value={customCategory}
                onChange={(e) => handleCustomCategoryChange(e.target.value)}
                onBlur={handleCustomCategoryBlur}
                disabled={disabled}
                placeholder="Enter custom category"
                className={`w-full pr-10 ${
                  hasError 
                    ? 'border-destructive focus-visible:ring-destructive' 
                    : isFieldValid 
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : ''
                }`}
                aria-describedby={
                  fieldHints.category ? createHintId('goal-category') : undefined
                }
                aria-invalid={hasError}
                data-testid="category-custom-input"
              />
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
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(false);
                  setCustomCategory('');
                  onValueChange('');
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
                disabled={disabled}
              >
                Back to predefined categories
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <p 
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {currentError}
          </p>
        )}

        {/* Hint Text */}
        {fieldHints.category && !hasError && (
          <p 
            className="text-xs text-muted-foreground"
            id={createHintId('goal-category')}
          >
            {fieldHints.category}
          </p>
        )}

        {/* Character count for custom category */}
        {isCustomMode && customCategory && (
          <div className="text-xs text-muted-foreground text-right">
            {customCategory.length}/50
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default GoalCategorySelector;
