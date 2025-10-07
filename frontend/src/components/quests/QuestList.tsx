import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuests } from '@/hooks/useQuest';
import QuestCard from './QuestCard';
import { Quest } from '@/models/quest';
import { Search, Filter, RefreshCw, Plus, Info } from 'lucide-react';

interface QuestListProps {
  onViewDetails: (id: string) => void;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onFail: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateQuest: () => void;
}

interface QuestFilters {
  status: string;
  difficulty: string;
  category: string;
  search: string;
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
  
  const [filters, setFilters] = useState<QuestFilters>({
    status: 'all',
    difficulty: 'all',
    category: 'all',
    search: '',
  });


  // Filter and sort quests
  const filteredQuests = useMemo(() => {
    if (!quests) return [];

    return quests
      .filter((quest: Quest) => {
        // Status filter
        if (filters.status !== 'all' && quest.status !== filters.status) {
          return false;
        }

        // Difficulty filter
        if (filters.difficulty !== 'all' && quest.difficulty !== filters.difficulty) {
          return false;
        }

        // Category filter
        if (filters.category !== 'all' && quest.category !== filters.category) {
          return false;
        }

        // Search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          return (
            quest.title.toLowerCase().includes(searchTerm) ||
            quest.description?.toLowerCase().includes(searchTerm) ||
            quest.category.toLowerCase().includes(searchTerm)
          );
        }

        return true;
      })
      .sort((a: Quest, b: Quest) => {
        // Sort by updatedAt descending (most recent first)
        return b.updatedAt - a.updatedAt;
      });
  }, [quests, filters]);

  const handleFilterChange = (key: keyof QuestFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      difficulty: 'all',
      category: 'all',
      search: '',
    });
  };

  const handleRetry = () => {
    refresh();
  };

  // Get unique categories from quests
  const categories = useMemo(() => {
    if (!quests) return [];
    return Array.from(new Set(quests.map((quest: Quest) => quest.category))).sort();
  }, [quests]);

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.quest.actions.retry}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Retry loading quests. This will attempt to fetch your quests again.
              </p>
            </TooltipContent>
          </Tooltip>
        </AlertDescription>
      </Alert>
    );
  }

  if (filteredQuests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <div className="text-muted-foreground">
            {filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.category !== 'all'
              ? 'No quests match your current filters.'
              : 'You don\'t have any quests yet.'}
          </div>
          {filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.category !== 'all' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Clear all active filters and show all quests.
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onCreateQuest}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.quest.actions.create}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Create a new quest to track your progress and earn rewards.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {t.quest?.tooltips?.filters || 'Use these filters to find specific quests. You can search by title, filter by status, difficulty, or category.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quests..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        
        <div className="flex items-center gap-2">
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-32" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="select-item-all">All Status</SelectItem>
              <SelectItem value="draft" data-testid="select-item-draft">Draft</SelectItem>
              <SelectItem value="active" data-testid="select-item-active">Active</SelectItem>
              <SelectItem value="completed" data-testid="select-item-completed">Completed</SelectItem>
              <SelectItem value="cancelled" data-testid="select-item-cancelled">Cancelled</SelectItem>
              <SelectItem value="failed" data-testid="select-item-failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {t.quest?.tooltips?.statusFilter || 'Filter quests by their current status: Draft, Active, Completed, Cancelled, or Failed.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange('difficulty', value)}>
            <SelectTrigger className="w-32" aria-label="Filter by difficulty">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="select-item-all">All Difficulty</SelectItem>
              <SelectItem value="easy" data-testid="select-item-easy">Easy</SelectItem>
              <SelectItem value="medium" data-testid="select-item-medium">Medium</SelectItem>
              <SelectItem value="hard" data-testid="select-item-hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {t.quest?.tooltips?.difficultyFilter || 'Filter quests by difficulty level: Easy (50 XP), Medium (100 XP), or Hard (200 XP).'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger className="w-32" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="select-item-all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category} data-testid={`select-item-${category.toLowerCase()}`}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {t.quest?.tooltips?.categoryFilter || 'Filter quests by category: Health, Work, Personal, Learning, Fitness, Creative, Financial, Social, Spiritual, Hobby, Travel, or Other.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              {t.quest?.tooltips?.clearFilters || 'Clear all active filters and show all quests.'}
            </p>
          </TooltipContent>
        </Tooltip>
        </div>
      </div>

      {/* Quest Grid */}
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
    </div>
  );
};

export default QuestList;
