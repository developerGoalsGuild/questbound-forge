import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QuestCreateForm from '@/components/quests/QuestCreateForm';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const QuestCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  // Extract goalId from URL parameters
  const goalId = searchParams.get('goalId') || undefined;

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  const handleBack = () => {
    // If goalId is present, go back to goal details, otherwise go to quests list
    if (goalId) {
      navigate(`/goals/details/${goalId}`);
    } else {
      navigate('/quests');
    }
  };

  const handleQuestCreated = (quest: any) => {
    // Navigate to the created quest details
    navigate(`/quests/details/${quest.id}`);
  };

  const handleCancel = () => {
    // If goalId is present, go back to goal details, otherwise go to quests list
    if (goalId) {
      navigate(`/goals/details/${goalId}`);
    } else {
      navigate('/quests');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {commonTranslations?.back || 'Back'}
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {questTranslations?.title || 'Create Quest'}
            </h1>
            <p className="text-muted-foreground">
              {questTranslations?.description || 'Create a new quest to track your progress'}
            </p>
          </div>
        </div>

        {/* Quest Create Form */}
        <QuestCreateForm
          goalId={goalId}
          onSuccess={handleQuestCreated}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default QuestCreatePage;
