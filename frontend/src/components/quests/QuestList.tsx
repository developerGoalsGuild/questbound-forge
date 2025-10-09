import React, { useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuests } from '@/hooks/useQuest';
import { useQuestFilters } from '@/hooks/useQuestFilters';
import { filterAndSortQuests } from '@/lib/questFilters';
import QuestCard from './QuestCard';
import { QuestFilters } from './QuestFilters';
import { Quest } from '@/models/quest';
import { RefreshCw, Plus } from 'lucide-react';

interface QuestListProps {
  onViewDetails: (id: string) => void;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onFail: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateQuest: () => void;
}

const QuestList: React.FC<QuestListProps> = ({
  onViewDetails,
  onStart,
  onEdit,
  onCancel,
  onFail,
  onDelete,
  onCreateQuest,
}) => {
  const { t } = useTranslation();
  const { quests, loading, error, refresh, loadingStates } = useQuests();
  
  // Use the quest filters hook
  const { filters, hasActiveFilters, updateFilters, clearFilters } = useQuestFilters({
    storageKey: 'quest-list',
  });



  // Filter and sort quests using the new utility functions
  const filteredQuests = useMemo(() => {
    const result = filterAndSortQuests(quests || [], filters, 'updatedAt', 'desc');
    return result;
  }, [quests, filters, hasActiveFilters]);

  // Callback to handle filter changes from QuestFilters component
  const handleFiltersChange = useCallback((newFilters: QuestFilters) => {
    updateFilters(newFilters);
  }, [updateFilters]);


  const handleRetry = () => {
    refresh();
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{t.quest.messages.loadError}</span>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t.quest.actions.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quest Filters - Always visible */}
      <QuestFilters
        quests={quests}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        compact={true}
      />

      {/* Empty state or Quest Grid */}
      {filteredQuests.length === 0 ? (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="text-muted-foreground">
              {hasActiveFilters
                ? 'No quests match your current filters.'
                : 'You don\'t have any quests yet.'}
            </div>
            <div className="flex gap-2 justify-center">
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
              {!hasActiveFilters && (
                <Button onClick={onCreateQuest}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.quest.actions.create}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuests.map((quest: Quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onViewDetails={onViewDetails}
                onStart={onStart}
                onEdit={onEdit}
                onCancel={onCancel}
                onFail={onFail}
                onDelete={onDelete}
                loadingStates={loadingStates}
              />
            ))}
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredQuests.length} of {quests?.length || 0} quests
          </div>
        </>
      )}
      </div>
    );
  }

export default QuestList;
