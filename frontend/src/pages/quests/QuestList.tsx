import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestList from '@/components/quests/QuestList';
import QuestCreateForm from '@/components/quests/QuestCreateForm';
import QuestDetails from '@/components/quests/QuestDetails';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuests, useQuestStart } from '@/hooks/useQuest';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';

const QuestListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { quests, refresh, cancel: cancelQuest, fail: failQuest, delete: deleteQuest } = useQuests();
  const { start: startQuest } = useQuestStart();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  const handleCreateQuest = () => {
    navigate('/quests/create');
  };

  const handleViewQuest = (questId: string) => {
    navigate(`/quests/details/${questId}`);
  };

  const handleEditQuest = (questId: string) => {
    navigate(`/quests/edit/${questId}`);
  };

  const validateQuestCanStart = (quest: any): { canStart: boolean; errorMessage?: string } => {
    // Check if quest exists
    if (!quest) {
      return { canStart: false, errorMessage: 'Quest not found. Please refresh the page and try again.' };
    }
    
    // Check if quest is in draft status
    if (quest.status !== 'draft') {
      const statusDisplay = quest.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return { canStart: false, errorMessage: `Cannot start quest. Quest is currently ${statusDisplay}. Only draft quests can be started.` };
    }
    
    // Check required fields for all quests
    if (!quest.title || quest.title.trim().length === 0) {
      return { canStart: false, errorMessage: 'Quest title is required. Please add a title to your quest before starting it.' };
    }
    
    if (!quest.category || quest.category.trim().length === 0) {
      return { canStart: false, errorMessage: 'Quest category is required. Please select a category for your quest before starting it.' };
    }
    
    if (!quest.difficulty || !['easy', 'medium', 'hard'].includes(quest.difficulty)) {
      return { canStart: false, errorMessage: 'Quest difficulty is required. Please select a difficulty level (Easy, Medium, or Hard) before starting your quest.' };
    }
    
    if (!quest.kind || !['linked', 'quantitative'].includes(quest.kind)) {
      return { canStart: false, errorMessage: 'Quest type is required. Please select whether this is a Linked or Quantitative quest before starting it.' };
    }
    
    // Validate quantitative quest requirements
    if (quest.kind === 'quantitative') {
      if (!quest.targetCount || quest.targetCount <= 0) {
        return { canStart: false, errorMessage: 'Quantitative quest requires a target count. Please set how many items you want to complete before starting your quest.' };
      }
      
      if (!quest.countScope || !['completed_tasks', 'completed_goals', 'any'].includes(quest.countScope)) {
        return { canStart: false, errorMessage: 'Quantitative quest requires a count scope. Please select what to count (completed tasks or goals) before starting your quest.' };
      }
      
      if (!quest.periodDays || quest.periodDays <= 0) {
        return { canStart: false, errorMessage: 'Quantitative quest requires a time period. Please set how many days you want to complete this quest in before starting it.' };
      }
    }
    
    // Validate linked quest requirements
    if (quest.kind === 'linked') {
      if (!quest.linkedGoalIds || quest.linkedGoalIds.length === 0) {
        return { canStart: false, errorMessage: 'Linked quest requires at least one goal. Please select the goals you want to work on before starting your quest.' };
      }
      
      if (!quest.linkedTaskIds || quest.linkedTaskIds.length === 0) {
        return { canStart: false, errorMessage: 'Linked quest requires at least one task. Please select the tasks you want to work on before starting your quest.' };
      }
    }
    
    return { canStart: true };
  };

  const handleStartQuest = async (questId: string) => {
    try {
      // Find the quest to validate it can be started
      const quest = quests?.find(q => q.id === questId);
      const validation = validateQuestCanStart(quest);
      
      if (!validation.canStart) {
        console.error('Quest validation failed:', validation.errorMessage);
        // TODO: Show user-friendly error message (toast, alert, etc.)
        alert(`Cannot start quest: ${validation.errorMessage}`);
        return;
      }
      
      // Start the quest using the hook
      await startQuest(questId);
      console.log('Quest started successfully:', questId);
      
      // Refresh the quest list to show updated status
      if (refresh) {
        await refresh();
      }
      // Force re-render by updating refresh key
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to start quest:', error);
      // TODO: Show user-friendly error message
      alert('Failed to start quest. Please try again.');
    }
  };

  const handleCancelQuest = async (questId: string) => {
    try {
      await cancelQuest(questId);
      console.log('Quest cancelled successfully:', questId);
      
      // Force refresh to ensure UI updates
      if (refresh) {
        await refresh();
      }
      // Force re-render by updating refresh key
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to cancel quest:', error);
      alert('Failed to cancel quest. Please try again.');
    }
  };

  const handleFailQuest = async (questId: string) => {
    try {
      await failQuest(questId);
      console.log('Quest marked as failed successfully:', questId);
      
      // Force refresh to ensure UI updates
      if (refresh) {
        await refresh();
      }
      // Force re-render by updating refresh key
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to mark quest as failed:', error);
      alert('Failed to mark quest as failed. Please try again.');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
      try {
        await deleteQuest(questId);
        console.log('Quest deleted successfully:', questId);
        
        // Force refresh to ensure UI updates
        if (refresh) {
          await refresh();
        }
        // Force re-render by updating refresh key
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Failed to delete quest:', error);
        alert('Failed to delete quest. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {questTranslations?.title || 'Quests'}
            </h1>
            <p className="text-muted-foreground">
              {questTranslations?.description || 'Manage your quests and track your progress'}
            </p>
          </div>
          <Button onClick={handleCreateQuest} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {questTranslations?.actions?.create || 'Create Quest'}
          </Button>
        </div>

        {/* Quest List */}
        <QuestList
          key={refreshKey}
          onViewDetails={handleViewQuest}
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

export default QuestListPage;
