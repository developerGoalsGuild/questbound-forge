import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Trophy, Activity } from 'lucide-react';

interface QuestQuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  ariaLabel: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

interface QuestQuickActionsProps {
  className?: string;
  showTitle?: boolean;
  title?: string;
  actions?: Partial<QuestQuickAction>[];
}

export const QuestQuickActions: React.FC<QuestQuickActionsProps> = ({
  className = '',
  showTitle = true,
  title,
  actions: customActions,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;

  const defaultActions: QuestQuickAction[] = [
    {
      id: 'create-quest',
      label: questTranslations?.dashboard?.quickActions?.createQuest || 'Create Quest',
      icon: Plus,
      onClick: () => navigate('/quests/create'),
      ariaLabel: questTranslations?.dashboard?.quickActions?.createQuest || 'Create a new quest',
      variant: 'default' as const,
    },
    {
      id: 'view-all',
      label: questTranslations?.dashboard?.quickActions?.viewAllQuests || 'View All',
      icon: Eye,
      onClick: () => navigate('/quests'),
      ariaLabel: questTranslations?.dashboard?.quickActions?.viewAllQuests || 'View all quests',
      variant: 'outline' as const,
    },
    {
      id: 'challenges',
      label: questTranslations?.dashboard?.quickActions?.joinChallenges || 'Challenges',
      icon: Trophy,
      onClick: () => navigate('/quests/challenges'),
      ariaLabel: questTranslations?.dashboard?.quickActions?.joinChallenges || 'Join quest challenges',
      variant: 'outline' as const,
    },
    {
      id: 'activity',
      label: questTranslations?.dashboard?.quickActions?.viewActivity || 'Activity',
      icon: Activity,
      onClick: () => navigate('/quests/activity'),
      ariaLabel: questTranslations?.dashboard?.quickActions?.viewActivity || 'View quest activity',
      variant: 'outline' as const,
    },
  ];

  // Merge custom actions with defaults
  const actions: QuestQuickAction[] = customActions
    ? defaultActions.map(defaultAction => {
        const customAction = customActions.find(ca => ca.id === defaultAction.id);
        return customAction ? { ...defaultAction, ...customAction } : defaultAction;
      })
    : defaultActions;

  const displayTitle = title || (questTranslations?.dashboard?.quickActions?.title || 'Quick Actions');

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-lg">
            {displayTitle}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? 'pt-0' : ''}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 h-20"
              aria-label={action.ariaLabel}
            >
              <action.icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
