/**
 * Quest Challenges Page
 * 
 * Placeholder page for quest challenges feature.
 * This feature will allow users to join and participate in quest challenges.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, Construction } from 'lucide-react';

const QuestChallenges: React.FC = () => {
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
              <Trophy className="h-8 w-8" />
              {questTranslations?.challenges?.title || 'Quest Challenges'}
            </h1>
            <p className="text-muted-foreground">
              {questTranslations?.challenges?.description || 'Join quest challenges and compete with others'}
            </p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5" />
              {questTranslations?.challenges?.comingSoon?.title || 'Coming Soon'}
            </CardTitle>
            <CardDescription>
              {questTranslations?.challenges?.comingSoon?.description || 
               'The quest challenges feature is currently under development. Check back soon!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {questTranslations?.challenges?.comingSoon?.message || 
               'This feature will allow you to:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{questTranslations?.challenges?.comingSoon?.feature1 || 'Join community quest challenges'}</li>
              <li>{questTranslations?.challenges?.comingSoon?.feature2 || 'Compete with other users'}</li>
              <li>{questTranslations?.challenges?.comingSoon?.feature3 || 'Earn special rewards and achievements'}</li>
              <li>{questTranslations?.challenges?.comingSoon?.feature4 || 'Track your progress on leaderboards'}</li>
            </ul>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => navigate('/quests/dashboard')}>
                {questTranslations?.challenges?.comingSoon?.backToDashboard || 'Back to Dashboard'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/quests/create')}>
                {questTranslations?.actions?.create || 'Create Quest'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestChallenges;

