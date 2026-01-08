/**
 * NLPQuestionStep Component
 * 
 * Individual step for each NLP question in the goal creation wizard.
 * Displays one question at a time with validation and character count.
 */

import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { GoalCreateFormData } from '@/hooks/useGoalCreateForm';
import type { NLPQuestionKey } from '@/pages/goals/questions';
import { validateNLPAnswer } from '@/lib/validation/goalValidation';

interface NLPQuestionStepProps {
  questionKey: NLPQuestionKey;
  formData: GoalCreateFormData;
  onFieldChange: (field: string, value: any) => void;
  onNext?: () => void;
  errors: Record<string, string>;
}

const NLPQuestionStep: React.FC<NLPQuestionStepProps> = ({
  questionKey,
  formData,
  onFieldChange,
  onNext,
  errors
}) => {
  const { t } = useTranslation();
  const goalCreationTranslations = (t as any)?.goalCreation;
  const nlpTranslations = goalCreationTranslations?.nlp ?? {};
  const questions = nlpTranslations.questions ?? {};
  const hints = nlpTranslations.hints ?? {};
  const questionHints = hints as Record<string, string | undefined>;

  const questionLabel = questions[questionKey] || questionKey;
  const hint = questionHints[questionKey];
  const questionId = `nlp-${questionKey}`;
  const answer = formData.nlpAnswers[questionKey] || '';
  const fieldError = errors[`nlpAnswers.${questionKey}`];
  const hasError = Boolean(fieldError);

  // Keep local state for immediate UI feedback
  const [localAnswer, setLocalAnswer] = useState(answer);

  useEffect(() => {
    setLocalAnswer(answer);
  }, [answer]);

  // Validate answer
  const validation = validateNLPAnswer(localAnswer);
  const isValid = !hasError && (localAnswer.trim().length === 0 || validation.isValid);
  const isInvalid = hasError || (!validation.isValid && localAnswer.trim().length > 0);

  const handleAnswerChange = (value: string) => {
    setLocalAnswer(value);
    onFieldChange(`nlpAnswers.${questionKey}`, value);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {goalCreationTranslations?.sections?.nlpQuestions || 'Goal Contract'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {goalCreationTranslations?.sections?.nlpSubtitle || 'Answer this question to clarify and strengthen your goal.'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Question Label with Hint */}
          <div className="flex items-start gap-2">
            <Label 
              htmlFor={questionId}
              className="text-base font-medium flex-1"
            >
              {questionLabel} *
            </Label>
            {hint && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0"
                    aria-label={`More information about ${questionLabel}`}
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  role="tooltip"
                  side="top"
                  align="start"
                  className="max-w-xs text-sm leading-relaxed"
                >
                  {hint}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Textarea */}
          <div className="relative">
            <Textarea
              id={questionId}
              value={localAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              onKeyDown={(e) => {
                // Support Ctrl+Enter (Windows/Linux) and Cmd+Enter (Mac)
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onNext) {
                  e.preventDefault();
                  e.stopPropagation();
                  onNext();
                }
              }}
              rows={6}
              className={`min-h-[150px] pr-12 pb-8 ${
                isInvalid
                  ? 'border-destructive focus-visible:ring-destructive' 
                  : isValid && localAnswer.trim().length >= 10
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : ''
              }`}
              aria-describedby={
                hint ? `${questionId}-hint` : undefined
              }
              aria-invalid={isInvalid}
              placeholder={goalCreationTranslations?.placeholders?.nlpAnswer || 'Type your answer here...'}
            />
            
            {/* Validation status icon */}
            <div className="absolute top-3 right-3">
              {isInvalid ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : isValid && localAnswer.trim().length >= 10 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : null}
            </div>
            
            {/* Character count */}
            <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {localAnswer.length}/500
            </div>
          </div>

          {/* Error Message */}
          {hasError && (
            <p 
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {fieldError}
            </p>
          )}

          {/* Hint Text */}
          {hint && !hasError && (
            <p 
              className="text-xs text-muted-foreground"
              id={`${questionId}-hint`}
            >
              {hint}
            </p>
          )}

          {/* Validation hint */}
          {!hasError && localAnswer.trim().length > 0 && localAnswer.trim().length < 10 && (
            <p className="text-xs text-muted-foreground">
              {goalCreationTranslations?.validation?.nlpAnswerMinLength || 'Answer must be at least 10 characters'}
            </p>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>
            {goalCreationTranslations?.help?.nlpAnswer || 'Press Ctrl+Enter (or Cmd+Enter on Mac) to proceed to the next question.'}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NLPQuestionStep;

