import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestEditForm from '@/components/quests/QuestEditForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuest } from '@/hooks/useQuest';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const QuestEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { quest, loading, error } = useQuest(id || '');
  
  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  const handleBack = () => {
    navigate('/quests');
  };

  const handleQuestUpdated = (quest: any) => {
    // Navigate to the updated quest details
    navigate(`/quests/details/${quest.id}`);
  };

  const handleCancel = () => {
    navigate('/quests');
  };

  // Check if quest can be edited
  const canEditQuest = () => {
    if (!quest) return false;
    return quest.status === 'draft';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6" role="main">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {commonTranslations?.back || 'Back'}
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {questTranslations?.title || 'Edit Quest'}
            </h1>
            <p className="text-muted-foreground">
              {questTranslations?.description || 'Edit your quest details and settings'}
            </p>
          </div>
        </div>

        {/* Inline states */}
        {loading && (
          <Alert>
            <AlertDescription>
              {questTranslations?.messages?.loading || 'Loading quest...'}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {questTranslations?.errors?.loadFailed || 'Failed to load quest. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {quest && !canEditQuest() && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {questTranslations?.errors?.cannotEdit || `Cannot edit quest. This quest is currently ${quest.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}. Only draft quests can be edited.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Quest Edit Form */}
        {id && (
          <QuestEditForm
            questId={id}
            onSuccess={handleQuestUpdated}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default QuestEditPage;
