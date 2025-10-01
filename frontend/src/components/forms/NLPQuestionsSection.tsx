import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { nlpQuestionOrder, NLPQuestionKey, NLPAnswers } from '@/pages/goals/questions';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { validateNLPAnswer } from '@/lib/validation/goalValidation';

interface NLPQuestionsSectionProps {
  answers: NLPAnswers;
  onAnswersChange: (answers: NLPAnswers) => void;
  errors?: { [K in NLPQuestionKey]?: string };
  disabled?: boolean;
  className?: string;
}

const NLPQuestionsSection: React.FC<NLPQuestionsSectionProps> = ({
  answers,
  onAnswersChange,
  errors = {},
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation();

  // Get translations with safety checks
  const goalsTranslations = (t as any)?.goals;
  const section = goalsTranslations?.section ?? {};
  const questions = goalsTranslations?.questions ?? {};
  const hints = goalsTranslations?.hints ?? {};
  const questionHints = (hints.questions ?? {}) as Record<string, string | undefined>;
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

  // Handle individual answer change
  const handleAnswerChange = (key: NLPQuestionKey, value: string) => {
    const newAnswers = { ...answers, [key]: value };
    onAnswersChange(newAnswers);
  };

  // Validate individual answer
  const validateAnswer = (key: NLPQuestionKey, value: string): string | undefined => {
    if (errors[key]) {
      return errors[key];
    }
    
    if (value.trim().length === 0) {
      return undefined; // Don't show error for empty fields during typing
    }
    
    const validation = validateNLPAnswer(value);
    return validation.isValid ? undefined : validation.error;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`space-y-6 ${className}`} data-testid="nlp-section">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {section.nlpTitle || 'Well-formed Outcome (NLP)'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {section.nlpSubtitle || 'Answer these questions to clarify and strengthen your goal.'}
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-4" data-testid="nlp-questions">
          {nlpQuestionOrder.map((key) => {
            const questionId = `nlp-${key}`;
            const questionLabel = questions[key] || key;
            const hint = questionHints[key];
            const currentError = validateAnswer(key, answers[key] || '');
            const hasError = Boolean(currentError);

            return (
              <div key={key} className="space-y-2">
                {/* Question Label with Hint */}
                <div className="flex items-start gap-2">
                  <Label 
                    htmlFor={questionId}
                    className="text-sm font-medium"
                  >
                    {questionLabel}
                  </Label>
                  <InfoHint 
                    targetId={questionId} 
                    fieldLabel={questionLabel} 
                    hint={hint} 
                  />
                </div>

                {/* Textarea */}
                <div className="relative">
                  <Textarea
                    id={questionId}
                    value={answers[key] || ''}
                    onChange={(e) => handleAnswerChange(key, e.target.value)}
                    disabled={disabled}
                    rows={3}
                    className={`min-h-[80px] ${
                      hasError 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : ''
                    }`}
                    aria-describedby={
                      hint ? createHintId(questionId) : undefined
                    }
                    aria-invalid={hasError}
                    data-testid={`nlp-${key}-input`}
                  />
                  
                  {/* Character count */}
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {(answers[key] || '').length}/500
                  </div>
                </div>

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
                {hint && !hasError && (
                  <p 
                    className="text-xs text-muted-foreground"
                    id={createHintId(questionId)}
                  >
                    {hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <h3 className="text-sm font-medium text-destructive mb-2">
              Please fix the following errors:
            </h3>
            <ul className="text-sm text-destructive space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>
                  • {questions[key as NLPQuestionKey] || key}: {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default NLPQuestionsSection;
