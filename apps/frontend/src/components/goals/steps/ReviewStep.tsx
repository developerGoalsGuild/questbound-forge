/**
 * ReviewStep Component
 * 
 * Final step of the goal creation wizard - displays a summary of all entered information
 * before submission.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import type { GoalCreateFormData } from '@/hooks/useGoalCreateForm';
import { nlpQuestionOrder } from '@/pages/goals/questions';
import { Calendar, Tag, FolderOpen } from 'lucide-react';
import { getCategoryName } from '@/models/goal';

interface ReviewStepProps {
  formData: GoalCreateFormData;
  errors: Record<string, string>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  errors
}) => {
  const { t } = useTranslation();
  const goalCreationTranslations = (t as any)?.goalCreation;
  const goalsTranslations = (t as any)?.goals;
  const nlpTranslations = goalCreationTranslations?.nlp ?? {};
  const questions = nlpTranslations.questions ?? {};

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString + 'T00:00:00Z');
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {goalCreationTranslations?.steps?.review || 'Review Your Goal'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {goalCreationTranslations?.steps?.reviewDescription || 'Please review all information before creating your goal.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {goalCreationTranslations?.sections?.basicInfo || 'Basic Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {goalCreationTranslations?.fields?.title || 'Title'}
              </p>
              <p className="text-base">{formData.title || 'Not provided'}</p>
            </div>

            {formData.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {goalCreationTranslations?.fields?.description || 'Description'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{formData.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                {goalCreationTranslations?.fields?.deadline || 'Deadline'}:
              </span>
              <span>{formatDate(formData.deadline)}</span>
            </div>

            {formData.category && (
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  {goalCreationTranslations?.fields?.category || 'Category'}:
                </span>
                <span>{getCategoryName(formData.category, { categories: goalsTranslations?.categories })}</span>
              </div>
            )}

            {formData.tags && formData.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {goalCreationTranslations?.fields?.tags || 'Tags'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {goalCreationTranslations?.sections?.nlpQuestions || 'Goal Contract'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nlpQuestionOrder.map((key) => {
              const answer = formData.nlpAnswers[key];
              const question = questions[key] || key;
              
              return (
                <div key={key} className="border-b last:border-0 pb-4 last:pb-0">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {question}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {answer || (
                      <span className="text-muted-foreground italic">
                        {goalCreationTranslations?.review?.noAnswer || 'No answer provided'}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Errors Summary */}
        {Object.keys(errors).length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                {goalCreationTranslations?.validation?.errorsFound || 'Validation Errors'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-destructive">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    • {field}: {error}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewStep;

