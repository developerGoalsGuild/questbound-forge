/**
 * BasicInfoStep Component
 * 
 * First step of the quest creation wizard - handles basic quest information
 * including title, description, category, difficulty, and reward XP.
 */

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import QuestCategorySelector from '@/components/forms/QuestCategorySelector';
import { useTranslation } from '@/hooks/useTranslation';
import type { QuestCreateFormData } from '@/hooks/useQuestCreateForm';
import {
  QUEST_DIFFICULTIES,
  type QuestDifficulty
} from '@/models/quest';


type FieldValue = string | number | QuestDifficulty;
import { Info } from 'lucide-react';


interface BasicInfoStepProps {
  formData: QuestCreateFormData;
  onFieldChange: (field: string, value: FieldValue) => void;
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
  const questTranslations = (t as any)?.quest;

  // Get translated difficulty labels
  const getDifficultyLabel = (value: QuestDifficulty): string => {
    const difficultyMap: Record<QuestDifficulty, string> = {
      easy: questTranslations?.difficulty?.easy || 'Easy',
      medium: questTranslations?.difficulty?.medium || 'Medium',
      hard: questTranslations?.difficulty?.hard || 'Hard'
    };
    return difficultyMap[value] || value;
  };

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
          {questTranslations?.steps?.basicInfo || 'Basic Information'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {questTranslations?.steps?.basicInfoDescription || 'Provide the essential details for your quest.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="title" className="text-sm font-medium">
              {questTranslations?.fields?.title || 'Title'} *
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.title || 'Choose a clear, descriptive title for your quest. This will help you and others understand what needs to be accomplished.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="title"
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
            placeholder={questTranslations?.placeholders?.title || 'Enter quest title...'}
            className={errors.title ? 'border-red-500' : ''}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="text-xs text-red-600" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {questTranslations?.fields?.description || 'Description'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.description || 'Provide a detailed description of your quest. This helps you and others understand what needs to be accomplished.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onFieldChange('description', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (onNext) {
                  onNext();
                }
              }
            }}
            placeholder={questTranslations?.placeholders?.description || 'Describe your quest...'}
            className={errors.description ? 'border-red-500' : ''}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
            rows={3}
          />
          {errors.description && (
            <p id="description-error" className="text-xs text-red-600" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        {/* Category and Difficulty Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <QuestCategorySelector
            value={formData.category || ''}
            onValueChange={(value) => onFieldChange('category', value)}
            error={errors.category}
            placeholder={questTranslations?.placeholders?.category || 'Select category...'}
          />

          {/* Difficulty */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                {questTranslations?.fields?.difficulty || 'Difficulty'} *
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {questTranslations?.tooltips?.difficulty || 'Select the difficulty level. This affects the reward XP you\'ll earn when completing the quest.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.difficulty || ''}
              onValueChange={(value) => onFieldChange('difficulty', value as QuestDifficulty)}
            >
              <SelectTrigger 
                id="difficulty"
                className={errors.difficulty ? 'border-red-500' : ''}
                aria-label="Select difficulty"
              >
                <SelectValue placeholder={questTranslations?.placeholders?.difficulty || 'Select difficulty...'} />
              </SelectTrigger>
              <SelectContent>
                {QUEST_DIFFICULTIES.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {getDifficultyLabel(difficulty.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.difficulty && (
              <p className="text-xs text-red-600" role="alert">
                {errors.difficulty}
              </p>
            )}
          </div>
        </div>

        {/* Reward XP - Calculated automatically */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="rewardXp" className="text-sm font-medium">
              {questTranslations?.fields?.rewardXp || 'Reward XP'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {questTranslations?.tooltips?.rewardXp || 'XP reward is calculated automatically based on quest difficulty.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {(() => {
                switch (formData.difficulty) {
                  case 'easy': return '50 XP';
                  case 'medium': return '100 XP';
                  case 'hard': return '200 XP';
                  default: return '100 XP';
                }
              })()}
            </span>
            <span className="text-xs text-muted-foreground">
              ({questTranslations?.messages?.calculated || 'Calculated based on difficulty'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
