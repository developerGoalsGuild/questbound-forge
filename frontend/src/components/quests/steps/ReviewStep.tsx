/**
 * ReviewStep Component
 * 
 * Third step of the quest creation wizard - displays a summary of all quest details
 * for final review before submission.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { type QuestCreateFormData } from '@/models/quest';
import { type GoalResponse } from '@/lib/apiGoal';
import { type TaskResponse } from '@/lib/apiTask';
import { 
  Target,
  Calendar,
  Clock,
  Star,
  Tag,
  ShieldCheck,
  Users,
  Lock,
  Globe,
  UserCheck
} from 'lucide-react';

interface ReviewStepProps {
  formData: QuestCreateFormData;
  goals?: GoalResponse[];
  tasks?: TaskResponse[];
}

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  formData, 
  goals = [],
  tasks = []
}) => {
  const { t } = useTranslation();
  const questTranslations = (t as any)?.quest;

  // Calculate reward XP based on difficulty
  // Note: rewardXp is now auto-calculated by backend based on scope, period, and difficulty
  const calculatedRewardXp = 'Auto-calculated';

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'followers':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return questTranslations?.privacy?.public || 'Public';
      case 'followers':
        return questTranslations?.privacy?.followers || 'Followers';
      case 'private':
        return questTranslations?.privacy?.private || 'Private';
      default:
        return privacy;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {questTranslations?.steps?.review || 'Review & Submit'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {questTranslations?.steps?.reviewDescription || 'Review your quest details before creating.'}
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {formData.title}
            </CardTitle>
            <CardDescription>
              {formData.description || questTranslations?.placeholders?.noDescription || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{questTranslations?.fields?.category || 'Category'}:</span>
                <span className="ml-2">{formData.category}</span>
              </div>
              <div>
                <span className="font-medium">{questTranslations?.fields?.difficulty || 'Difficulty'}:</span>
                <span className="ml-2 capitalize">{formData.difficulty}</span>
              </div>
              <div>
                <span className="font-medium">{questTranslations?.fields?.rewardXp || 'Reward XP'}:</span>
                <span className="ml-2 flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  {formData.rewardXp || calculatedRewardXp}
                </span>
              </div>
              <div>
                <span className="font-medium">{questTranslations?.fields?.privacy || 'Privacy'}:</span>
                <span className="ml-2 flex items-center gap-1">
                  {getPrivacyIcon(formData.privacy)}
                  {getPrivacyLabel(formData.privacy)}
                </span>
              </div>
              <div>
                <span className="font-medium">{questTranslations?.fields?.kind || 'Quest Type'}:</span>
                <span className="ml-2 capitalize">{formData.kind}</span>
              </div>
              {formData.deadline && (
                <div>
                  <span className="font-medium">{questTranslations?.fields?.deadline || 'Deadline'}:</span>
                  <span className="ml-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(formData.deadline)}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {formData.tags && formData.tags.length > 0 && (
              <div>
                <span className="font-medium text-sm">{questTranslations?.fields?.tags || 'Tags'}:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quantitative Quest Details */}
            {formData.kind === 'quantitative' && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {questTranslations?.sections?.quantitativeInfo || 'Quantitative Quest Details'}
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm pl-6">
                  {formData.targetCount && (
                    <div>
                      <span className="font-medium">{questTranslations?.fields?.targetCount || 'Target Count'}:</span>
                      <span className="ml-2">{formData.targetCount}</span>
                    </div>
                  )}
                  {formData.countScope && (
                    <div>
                      <span className="font-medium">{questTranslations?.fields?.countScope || 'Count Scope'}:</span>
                      <span className="ml-2">{formData.countScope}</span>
                    </div>
                  )}
                  {formData.periodDays && (
                    <div>
                      <span className="font-medium">{questTranslations?.fields?.period || 'Period'}:</span>
                      <span className="ml-2 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formData.periodDays} {questTranslations?.fields?.days || 'days'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Linked Items */}
            {(formData.linkedGoalIds?.length > 0 || formData.linkedTaskIds?.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {questTranslations?.sections?.linkedItems || 'Linked Items'}
                </h4>
                <div className="space-y-1 text-sm pl-6">
                  {formData.linkedGoalIds && formData.linkedGoalIds.length > 0 && (
                    <div>
                      <span className="font-medium">{questTranslations?.fields?.linkedGoals || 'Linked Goals'}:</span>
                      <div className="space-y-1 mt-1">
                        {formData.linkedGoalIds.map((goalId) => {
                          const goal = goals.find(g => g.id === goalId);
                          return (
                            <div key={goalId} className="text-muted-foreground">
                              {goal ? goal.title : goalId}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {formData.linkedTaskIds && formData.linkedTaskIds.length > 0 && (
                    <div>
                      <span className="font-medium">{questTranslations?.fields?.linkedTasks || 'Linked Tasks'}:</span>
                      <div className="space-y-1 mt-1">
                        {formData.linkedTaskIds.map((taskId) => {
                          const task = tasks.find(t => t.id === taskId);
                          return (
                            <div key={taskId} className="text-muted-foreground">
                              {task ? task.title : taskId}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Star className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium">{questTranslations?.fields?.rewardXp || 'Reward XP'}</div>
              <div className="text-muted-foreground">{formData.rewardXp || calculatedRewardXp}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Target className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium">{questTranslations?.fields?.kind || 'Quest Type'}</div>
              <div className="text-muted-foreground capitalize">{formData.kind}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {getPrivacyIcon(formData.privacy)}
            <div>
              <div className="font-medium">{questTranslations?.fields?.privacy || 'Privacy'}</div>
              <div className="text-muted-foreground">{getPrivacyLabel(formData.privacy)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
