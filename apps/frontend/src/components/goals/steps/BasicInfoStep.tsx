/**
 * BasicInfoStep Component
 * 
 * First step of the goal creation wizard - handles basic goal information
 * including title, description, deadline, category, and tags.
 */

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import GoalCategorySelector from '@/components/forms/GoalCategorySelector';
import TagsInput from '@/components/forms/TagsInput';
import { useTranslation } from '@/hooks/useTranslation';
import type { GoalCreateFormData } from '@/hooks/useGoalCreateForm';
import { Info } from 'lucide-react';

interface BasicInfoStepProps {
  formData: GoalCreateFormData;
  onFieldChange: (field: string, value: any) => void;
  onNext?: () => void;
  errors: Record<string, string>;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  onFieldChange,
  onNext,
  errors
}) => {
  const { t } = useTranslation();
  const goalCreationTranslations = (t as any)?.goalCreation;

  // Keep local input state so typing reflects immediately in the UI
  const [title, setTitle] = useState(formData.title || '');
  const [description, setDescription] = useState(formData.description || '');

  useEffect(() => {
    setTitle(formData.title || '');
  }, [formData.title]);

  useEffect(() => {
    setDescription(formData.description || '');
  }, [formData.description]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {goalCreationTranslations?.sections?.basicInfo || 'Basic Information'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {goalCreationTranslations?.sections?.basicInfoDescription || 'Provide the essential details for your goal.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="goal-title" className="text-sm font-medium">
              {goalCreationTranslations?.fields?.title || 'Title'} *
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {goalCreationTranslations?.hints?.title || 'Choose a clear, descriptive title for your goal.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              onFieldChange('title', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (onNext) {
                  onNext();
                }
              }
            }}
            placeholder={goalCreationTranslations?.placeholders?.title || 'Enter your goal title...'}
            className={errors.title ? 'border-red-500' : ''}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'goal-title-error' : undefined}
          />
          {errors.title && (
            <p id="goal-title-error" className="text-xs text-red-600" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="goal-description" className="text-sm font-medium">
              {goalCreationTranslations?.fields?.description || 'Description'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {goalCreationTranslations?.hints?.description || 'Provide a detailed description of your goal.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="goal-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onFieldChange('description', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && onNext) {
                e.preventDefault();
                onNext();
              }
            }}
            placeholder={goalCreationTranslations?.placeholders?.description || 'Describe your goal...'}
            className={errors.description ? 'border-red-500' : ''}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'goal-description-error' : undefined}
            rows={3}
          />
          {errors.description && (
            <p id="goal-description-error" className="text-xs text-red-600" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="goal-deadline" className="text-sm font-medium">
              {goalCreationTranslations?.fields?.deadline || 'Deadline'} *
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {goalCreationTranslations?.hints?.deadline || 'Set a target date for completing your goal.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="goal-deadline"
            type="date"
            value={formData.deadline || ''}
            onChange={(e) => onFieldChange('deadline', e.target.value)}
            className={errors.deadline ? 'border-red-500' : ''}
            aria-invalid={!!errors.deadline}
            aria-describedby={errors.deadline ? 'goal-deadline-error' : undefined}
          />
          {errors.deadline && (
            <p id="goal-deadline-error" className="text-xs text-red-600" role="alert">
              {errors.deadline}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <GoalCategorySelector
            value={formData.category || ''}
            onValueChange={(value) => onFieldChange('category', value)}
            error={errors.category}
            placeholder={goalCreationTranslations?.placeholders?.category || 'Select a category...'}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="goal-tags" className="text-sm font-medium">
              {goalCreationTranslations?.fields?.tags || 'Tags'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {goalCreationTranslations?.hints?.tags || 'Add tags to help organize and find your goal.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <TagsInput
            value={formData.tags || []}
            onChange={(tags) => onFieldChange('tags', tags)}
            error={errors.tags}
            placeholder={goalCreationTranslations?.placeholders?.tags || 'Add tags and press Enter'}
            maxTags={10}
          />
          {errors.tags && (
            <p className="text-xs text-red-600" role="alert">
              {errors.tags}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;

