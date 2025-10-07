import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestDetailsComponent from '@/components/quests/QuestDetails';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const QuestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  const handleBack = () => {
    navigate('/quests');
  };

  const handleEditQuest = (questId: string) => {
    navigate(`/quests/edit/${questId}`);
  };

  const handleStartQuest = (questId: string) => {
    // Quest start logic will be handled by the QuestDetails component
    console.log('Starting quest:', questId);
  };

  const handleCancelQuest = (questId: string) => {
    // Quest cancel logic will be handled by the QuestDetails component
    console.log('Cancelling quest:', questId);
  };

  const handleFailQuest = (questId: string) => {
    // Quest fail logic will be handled by the QuestDetails component
    console.log('Failing quest:', questId);
  };

  const handleDeleteQuest = (questId: string) => {
    // Quest delete logic will be handled by the QuestDetails component
    console.log('Deleting quest:', questId);
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
              {questTranslations?.title || 'Quest Details'}
            </h1>
            <p className="text-muted-foreground">
              {questTranslations?.description || 'View and manage your quest details'}
            </p>
          </div>
        </div>

        {/* Quest Details */}
        <QuestDetailsComponent
          questId={id}
          onBack={handleBack}
          onEdit={handleEditQuest}
          onStart={handleStartQuest}
          onCancel={handleCancelQuest}
          onFail={handleFailQuest}
          onDelete={handleDeleteQuest}
        />
      </div>
    </div>
  );
};

export default QuestDetailsPage;
