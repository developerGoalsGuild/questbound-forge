import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

export type QuestTabType = 'my' | 'following' | 'templates';

interface QuestTabsProps {
  myQuestsContent: React.ReactNode;
  followingQuestsContent: React.ReactNode;
  templatesContent?: React.ReactNode;
  defaultTab?: QuestTabType;
  onTabChange?: (tab: QuestTabType) => void;
  className?: string;
  showTitle?: boolean;
  title?: string;
}

export const QuestTabs: React.FC<QuestTabsProps> = ({
  myQuestsContent,
  followingQuestsContent,
  templatesContent,
  defaultTab = 'my',
  onTabChange,
  className = '',
  showTitle = true,
  title,
}) => {
  const { t } = useTranslation();

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const dashboardTranslations = questTranslations?.dashboard;

  const handleTabChange = (value: string) => {
    const tab = value as QuestTabType;
    onTabChange?.(tab);
  };

  const displayTitle = title || (dashboardTranslations?.tabs?.title || 'Quest Overview');

  const myTabLabel = dashboardTranslations?.tabs?.myQuests || 'My Quests';
  const followingTabLabel = dashboardTranslations?.tabs?.followingQuests || 'Following';
  const templatesTabLabel = dashboardTranslations?.tabs?.templates || 'Templates';

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
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3" aria-label={displayTitle}>
            <TabsTrigger value="my">
              {myTabLabel}
            </TabsTrigger>
            <TabsTrigger value="following">
              {followingTabLabel}
            </TabsTrigger>
            <TabsTrigger value="templates">
              {templatesTabLabel}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-6">
            {myQuestsContent}
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            {followingQuestsContent}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            {templatesContent || (
              <div className="text-center py-8 text-muted-foreground">
                <p>{dashboardTranslations?.tabs?.templatesPlaceholder || 'Templates feature will be implemented in a future update.'}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
