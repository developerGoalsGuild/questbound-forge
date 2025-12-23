/**
 * Quest Activity Page
 * 
 * Placeholder page for quest activity feature.
 * This feature will show a timeline of quest-related activities.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ArrowLeft, Construction } from 'lucide-react';

const QuestActivity: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/quests/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonTranslations?.back || 'Back'}
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-8 w-8" />
              {questTranslations?.activity?.title || 'Quest Activity'}
            </h1>
            <p className="text-muted-foreground">
              {questTranslations?.activity?.description || 'View your quest activity timeline'}
            </p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5" />
              {questTranslations?.activity?.comingSoon?.title || 'Coming Soon'}
            </CardTitle>
            <CardDescription>
              {questTranslations?.activity?.comingSoon?.description || 
               'The quest activity feature is currently under development. Check back soon!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {questTranslations?.activity?.comingSoon?.message || 
               'This feature will allow you to:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{questTranslations?.activity?.comingSoon?.feature1 || 'View a timeline of all quest activities'}</li>
              <li>{questTranslations?.activity?.comingSoon?.feature2 || 'Track quest completions and milestones'}</li>
              <li>{questTranslations?.activity?.comingSoon?.feature3 || 'See activity from quests you follow'}</li>
              <li>{questTranslations?.activity?.comingSoon?.feature4 || 'Filter and search through activity history'}</li>
            </ul>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => navigate('/quests/dashboard')}>
                {questTranslations?.activity?.comingSoon?.backToDashboard || 'Back to Dashboard'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/quests')}>
                {questTranslations?.dashboard?.quickActions?.viewAllQuests || 'View All Quests'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestActivity;

