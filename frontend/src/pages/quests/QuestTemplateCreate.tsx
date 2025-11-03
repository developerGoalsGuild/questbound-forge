/**
 * QuestTemplateCreate Page
 * 
 * Page for creating new quest templates with comprehensive form validation,
 * accessibility features, and internationalization support.
 * 
 * Features:
 * - Multi-step template creation form
 * - Real-time validation with debounced feedback
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Internationalization (i18n) support
 * - Error handling and recovery
 * - Form state persistence
 * 
 * Steps:
 * 1. Basic Information (title, description, category, difficulty)
 * 2. Advanced Options (privacy, kind, tags, reward settings)
 * 3. Review and Submit
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestTemplateCreate } from '@/hooks/useQuestTemplateCreate';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { 
  QUEST_TEMPLATE_CATEGORIES,
  QUEST_TEMPLATE_DIFFICULTY_OPTIONS,
  QUEST_TEMPLATE_PRIVACY_OPTIONS,
  QUEST_TEMPLATE_KIND_OPTIONS,
  type QuestTemplateCreateInput,
  type QuestTemplatePrivacy
} from '@/models/questTemplate';
import { 
  type QuestDifficulty,
  type QuestKind
} from '@/models/quest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Loader2,
  Tag,
  Trophy,
  Shield,
  Target,
  FileText,
  Settings,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface QuestTemplateCreateFormData {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty | '';
  privacy: QuestTemplatePrivacy;
  kind: QuestKind;
  tags: string[];
  rewardXp: number;
  estimatedDuration: number;
  instructions: string;
}

interface StepProps {
  formData: QuestTemplateCreateFormData;
  onDataChange: (data: Partial<QuestTemplateCreateFormData>) => void;
  errors: Record<string, string>;
  onErrorChange: (field: string, error: string | null) => void;
}

// ============================================================================
// Validation Schema
// ============================================================================

const QuestTemplateCreateFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['easy', 'medium', 'hard'] as const),
  privacy: z.enum(['public', 'followers', 'private'] as const),
  kind: z.enum(['linked', 'quantitative'] as const),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  rewardXp: z.number().min(0).max(10000), // XP is calculated automatically, just validate range
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 day').max(365, 'Duration must be less than 1 year'),
  instructions: z.string().max(1000, 'Instructions must be less than 1000 characters').optional()
});

// ============================================================================
// Step Components
// ============================================================================

const BasicInfoStep: React.FC<StepProps> = ({ formData, onDataChange, errors, onErrorChange }) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest?.templates;
  

  const handleFieldChange = (field: keyof QuestTemplateCreateFormData, value: any) => {
    onDataChange({ [field]: value });
    if (errors[field]) {
      onErrorChange(field, null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          {questTranslations?.form?.title || 'Template Title'} *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder={questTranslations?.form?.titlePlaceholder || 'Enter template title...'}
          className={errors.title ? 'border-red-500' : ''}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'error-title' : undefined}
        />
        {errors.title && (
          <p id="error-title" className="text-sm text-red-600" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          {questTranslations?.form?.description || 'Description'} *
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder={questTranslations?.form?.descriptionPlaceholder || 'Describe what this template is for...'}
          className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'error-description' : undefined}
        />
        {errors.description && (
          <p id="error-description" className="text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            {questTranslations?.form?.category || 'Category'} *
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleFieldChange('category', value)}
          >
            <SelectTrigger 
              id="category"
              className={errors.category ? 'border-red-500' : ''}
            >
              <SelectValue placeholder={questTranslations?.form?.categoryPlaceholder || 'Select category...'} />
            </SelectTrigger>
            <SelectContent>
              {QUEST_TEMPLATE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-600" role="alert">
              {errors.category}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty" className="text-sm font-medium">
            {questTranslations?.form?.difficulty || 'Difficulty'} *
          </Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value) => handleFieldChange('difficulty', value as QuestDifficulty | '')}
          >
            <SelectTrigger 
              id="difficulty"
              className={errors.difficulty ? 'border-red-500' : ''}
            >
              <SelectValue placeholder={questTranslations?.form?.difficultyPlaceholder || 'Select difficulty...'} />
            </SelectTrigger>
            <SelectContent>
              {QUEST_TEMPLATE_DIFFICULTY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.difficulty && (
            <p className="text-sm text-red-600" role="alert">
              {errors.difficulty}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const AdvancedOptionsStep: React.FC<StepProps> = ({ formData, onDataChange, errors, onErrorChange }) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest?.templates;
  const [tagInput, setTagInput] = useState('');

  const handleFieldChange = (field: keyof QuestTemplateCreateFormData, value: any) => {
    onDataChange({ [field]: value });
    if (errors[field]) {
      onErrorChange(field, null);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 10) {
      handleFieldChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleFieldChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="privacy" className="text-sm font-medium">
            {questTranslations?.form?.privacy || 'Privacy'} *
          </Label>
          <Select
            value={formData.privacy}
            onValueChange={(value) => handleFieldChange('privacy', value as QuestTemplatePrivacy)}
          >
            <SelectTrigger 
              id="privacy"
              className={errors.privacy ? 'border-red-500' : ''}
            >
              <SelectValue placeholder={questTranslations?.form?.privacyPlaceholder || 'Select privacy...'} />
            </SelectTrigger>
            <SelectContent>
              {QUEST_TEMPLATE_PRIVACY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.privacy && (
            <p className="text-sm text-red-600" role="alert">
              {errors.privacy}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kind" className="text-sm font-medium">
            {questTranslations?.form?.kind || 'Kind'} *
          </Label>
          <Select
            value={formData.kind}
            onValueChange={(value) => handleFieldChange('kind', value as QuestKind)}
          >
            <SelectTrigger 
              id="kind"
              className={errors.kind ? 'border-red-500' : ''}
            >
              <SelectValue placeholder={questTranslations?.form?.kindPlaceholder || 'Select kind...'} />
            </SelectTrigger>
            <SelectContent>
              {QUEST_TEMPLATE_KIND_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.kind && (
            <p className="text-sm text-red-600" role="alert">
              {errors.kind}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags" className="text-sm font-medium">
          {questTranslations?.form?.tags || 'Tags'}
        </Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={questTranslations?.form?.tagsPlaceholder || 'Add a tag...'}
            className="flex-1"
          />
          <Button type="button" onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= 10}>
            <Tag className="h-4 w-4" />
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        {errors.tags && (
          <p className="text-sm text-red-600" role="alert">
            {errors.tags}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="rewardXp" className="text-sm font-medium">
              {questTranslations?.form?.rewardXp || 'XP Reward'}
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
            <span className="text-xs text-muted-foreground" data-testid="xp-calculation-note">
              ({questTranslations?.messages?.calculated || 'Calculated based on difficulty'})
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedDuration" className="text-sm font-medium">
            {questTranslations?.form?.estimatedDuration || 'Estimated Duration (days)'}
          </Label>
          <Input
            id="estimatedDuration"
            type="number"
            min="1"
            max="365"
            value={formData.estimatedDuration}
            onChange={(e) => handleFieldChange('estimatedDuration', parseInt(e.target.value) || 1)}
            placeholder="7"
            className={errors.estimatedDuration ? 'border-red-500' : ''}
            aria-invalid={!!errors.estimatedDuration}
            aria-describedby={errors.estimatedDuration ? 'error-estimatedDuration' : undefined}
          />
          {errors.estimatedDuration && (
            <p id="error-estimatedDuration" className="text-sm text-red-600" role="alert">
              {errors.estimatedDuration}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions" className="text-sm font-medium">
          {questTranslations?.form?.instructions || 'Instructions (Optional)'}
        </Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => handleFieldChange('instructions', e.target.value)}
          placeholder={questTranslations?.form?.instructionsPlaceholder || 'Add any specific instructions for using this template...'}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
};

const ReviewStep: React.FC<StepProps> = ({ formData, errors }) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest?.templates;

  const getDifficultyLabel = (difficulty: QuestDifficulty | '') => {
    if (!difficulty || (difficulty as string) === '') return 'Not selected';
    const option = QUEST_TEMPLATE_DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
    return option?.label || difficulty;
  };

  const getPrivacyLabel = (privacy: QuestTemplatePrivacy) => {
    const option = QUEST_TEMPLATE_PRIVACY_OPTIONS.find(opt => opt.value === privacy);
    return option?.label || privacy;
  };

  const getKindLabel = (kind: QuestKind) => {
    const option = QUEST_TEMPLATE_KIND_OPTIONS.find(opt => opt.value === kind);
    return option?.label || kind;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {questTranslations?.form?.basicInfo || 'Basic Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Title</Label>
              <p className="text-sm">{formData.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm">{formData.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                <p className="text-sm">{formData.category}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Difficulty</Label>
                <p className="text-sm">{getDifficultyLabel(formData.difficulty)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {questTranslations?.form?.advancedOptions || 'Advanced Options'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Privacy</Label>
                <p className="text-sm">{getPrivacyLabel(formData.privacy)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Kind</Label>
                <p className="text-sm">{getKindLabel(formData.kind)}</p>
              </div>
            </div>
            {formData.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">XP Reward</Label>
                <p className="text-sm">{formData.rewardXp} XP</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Estimated Duration</Label>
                <p className="text-sm">{formData.estimatedDuration} days</p>
              </div>
            </div>
            {formData.instructions && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Instructions</Label>
                <p className="text-sm">{formData.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const QuestTemplateCreate: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createTemplate, loading: createLoading, error: createError } = useQuestTemplateCreate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestTemplateCreateFormData>({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    privacy: 'public',
    kind: 'linked',
    tags: [],
    rewardXp: 0,
    estimatedDuration: 7,
    instructions: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ARIA Live Region for announcements
  const [liveMessage, setLiveMessage] = useState('');
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  // Focus management
  const containerRef = useRef<HTMLDivElement>(null);

  const questTranslations = (t as any)?.quest?.templates;
  const commonTranslations = (t as any)?.common;

  const steps = [
    {
      title: questTranslations?.form?.steps?.basicInfo || 'Basic Information',
      description: questTranslations?.form?.steps?.basicInfoDesc || 'Enter the basic details for your template',
      icon: FileText
    },
    {
      title: questTranslations?.form?.steps?.advancedOptions || 'Advanced Options',
      description: questTranslations?.form?.steps?.advancedOptionsDesc || 'Configure privacy, tags, and rewards',
      icon: Settings
    },
    {
      title: questTranslations?.form?.steps?.review || 'Review',
      description: questTranslations?.form?.steps?.reviewDesc || 'Review your template before creating',
      icon: Check
    }
  ];

  const handleDataChange = useCallback((data: Partial<QuestTemplateCreateFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };
      
      // Note: rewardXp is now auto-calculated by backend based on scope, period, and difficulty
      // No need to calculate it here
      
      return newData;
    });
  }, []);

  const handleErrorChange = useCallback((field: string, error: string | null) => {
    setErrors(prev => {
      if (error === null) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      else if (formData.title.length > 100) newErrors.title = 'Title must be less than 100 characters';
      
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      else if (formData.description.length > 500) newErrors.description = 'Description must be less than 500 characters';
      
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.difficulty || (formData.difficulty as string) === '') newErrors.difficulty = 'Difficulty is required';
    } else if (step === 1) {
      if (!formData.privacy) newErrors.privacy = 'Privacy is required';
      if (!formData.kind) newErrors.kind = 'Kind is required';
      if (formData.tags.length > 10) newErrors.tags = 'Maximum 10 tags allowed';
      // XP is now calculated automatically, no validation needed
      if (formData.estimatedDuration < 1) newErrors.estimatedDuration = 'Duration must be at least 1 day';
      if (formData.estimatedDuration > 365) newErrors.estimatedDuration = 'Duration must be less than 1 year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setLiveMessage(`Moved to step ${currentStep + 2}: ${steps[currentStep + 1].title}`);
      }
    } else {
      setLiveMessage('Please fix the errors before continuing');
    }
  }, [currentStep, steps, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setLiveMessage(`Moved to step ${currentStep}: ${steps[currentStep - 1].title}`);
    }
  }, [currentStep, steps]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) {
      setLiveMessage('Please fix the errors before submitting');
      return;
    }

    try {
      const templateData: QuestTemplateCreateInput = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty as QuestDifficulty,
        privacy: formData.privacy,
        kind: formData.kind,
        tags: formData.tags,
        rewardXp: formData.rewardXp,
        estimatedDuration: formData.estimatedDuration,
        instructions: formData.instructions,
      };

      await createTemplate(templateData);
      setLiveMessage(questTranslations?.messages?.createSuccess || 'Template created successfully!');
      
      // Navigate back to templates dashboard
      setTimeout(() => {
        navigate('/quests');
      }, 1500);
    } catch (error) {
      logger.error('Template creation failed:', error);
      setLiveMessage(questTranslations?.messages?.createError || 'Failed to create template');
    }
  }, [formData, currentStep, validateStep, createTemplate, questTranslations, navigate]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            formData={formData}
            onDataChange={handleDataChange}
            errors={errors}
            onErrorChange={handleErrorChange}
          />
        );
      case 1:
        return (
          <AdvancedOptionsStep
            formData={formData}
            onDataChange={handleDataChange}
            errors={errors}
            onErrorChange={handleErrorChange}
          />
        );
      case 2:
        return (
          <ReviewStep
            formData={formData}
            onDataChange={handleDataChange}
            errors={errors}
            onErrorChange={handleErrorChange}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <ErrorBoundary
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load template creation form</p>
            <Button onClick={() => navigate('/quests')} variant="outline">
              Back to Quests
            </Button>
          </div>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl" ref={containerRef}>
      {/* ARIA Live Region */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quests')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonTranslations?.back || 'Back'}
          </Button>
        </div>
        <h1 className="text-3xl font-bold">
          {questTranslations?.form?.title || 'Create Quest Template'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {questTranslations?.form?.description || 'Create a reusable template for quests'}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {questTranslations?.form?.step || 'Step'} {currentStep + 1} {questTranslations?.form?.of || 'of'} {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                isActive 
                  ? 'border-primary bg-primary/5' 
                  : isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium ${
                  isActive ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-xs ${
                  isActive ? 'text-primary/70' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {createError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {createError.message || questTranslations?.messages?.createError || 'Failed to create template'}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {commonTranslations?.previous || 'Previous'}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={createLoading}
              className="flex items-center gap-2"
            >
              {createLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {createLoading 
                ? (questTranslations?.form?.creating || 'Creating...') 
                : (questTranslations?.form?.create || 'Create Template')
              }
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {commonTranslations?.next || 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default QuestTemplateCreate;
