import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import type { QuestFilters } from '@/hooks/useQuestFilters';
import { getUniqueCategories, hasActiveFilters, getActiveFilterCount } from '@/lib/questFilters';
import type { Quest } from '@/models/quest';
import { Search, Filter, RefreshCw, Info, X } from 'lucide-react';

export interface QuestFiltersProps {
  /** Array of quests to extract categories from */
  quests?: Quest[];
  /** Current filter values */
  filters: QuestFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: QuestFilters) => void;
  /** Show filter statistics */
  showStats?: boolean;
  /** Custom className */
  className?: string;
  /** Show/hide title */
  showTitle?: boolean;
  /** Custom title */
  title?: string;
  /** Show compact layout */
  compact?: boolean;
}

export const QuestFilters: React.FC<QuestFiltersProps> = ({
  quests = [],
  filters,
  onFiltersChange,
  showStats = true,
  className = '',
  showTitle = true,
  title,
  compact = false,
}) => {
  const { t } = useTranslation();

  // Get translations
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  // Check if filters are active
  const hasFilters = hasActiveFilters(filters);
  const activeFilterCount = getActiveFilterCount(filters);

  // Extract unique categories from quests
  const categories = useMemo(() => getUniqueCategories(quests), [quests]);

  const handleFilterChange = (type: keyof QuestFilters, value: string) => {
    const newFilters = { ...filters, [type]: value };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: 'all',
      difficulty: 'all',
      category: 'all',
      search: '',
    };
    onFiltersChange(clearedFilters);
  };

  const displayTitle = title || (questTranslations?.filters?.title || 'Filters');

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={questTranslations?.filters?.searchPlaceholder || 'Search quests...'}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
            aria-label={questTranslations?.filters?.searchAriaLabel || 'Search quests'}
          />
        </div>

        {/* Quick Filters */}
        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={questTranslations?.filters?.status || 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{commonTranslations?.all || 'All'}</SelectItem>
            <SelectItem value="draft">{questTranslations?.status?.draft || 'Draft'}</SelectItem>
            <SelectItem value="active">{questTranslations?.status?.active || 'Active'}</SelectItem>
            <SelectItem value="completed">{questTranslations?.status?.completed || 'Completed'}</SelectItem>
            <SelectItem value="cancelled">{questTranslations?.status?.cancelled || 'Cancelled'}</SelectItem>
            <SelectItem value="failed">{questTranslations?.status?.failed || 'Failed'}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange('difficulty', value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={questTranslations?.filters?.difficulty || 'Difficulty'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{commonTranslations?.all || 'All'}</SelectItem>
            <SelectItem value="easy">{questTranslations?.difficulty?.easy || 'Easy'}</SelectItem>
            <SelectItem value="medium">{questTranslations?.difficulty?.medium || 'Medium'}</SelectItem>
            <SelectItem value="hard">{questTranslations?.difficulty?.hard || 'Hard'}</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
            aria-label={questTranslations?.filters?.clearFilters || 'Clear all filters'}
          >
            <X className="h-4 w-4" />
            {questTranslations?.filters?.clear || 'Clear'}
          </Button>
        )}

        {/* Active Filters Count */}
        {showStats && activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount} {questTranslations?.filters?.active || 'active'}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {displayTitle}
            </CardTitle>

            {/* Active Filters Summary */}
            {showStats && hasFilters && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {activeFilterCount} {questTranslations?.filters?.activeFilters || 'active filters'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  aria-label={questTranslations?.filters?.clearFilters || 'Clear all filters'}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {questTranslations?.filters?.clearAll || 'Clear All'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className={showTitle ? 'pt-0' : ''}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                {questTranslations?.filters?.search || 'Search'}
              </label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  {questTranslations?.tooltips?.filters ||
                   'Search in quest titles, descriptions, and categories'}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={questTranslations?.filters?.searchPlaceholder || 'Search quests...'}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={`pl-10 ${validationErrors.search ? 'border-red-500' : ''}`}
                aria-label={questTranslations?.filters?.searchAriaLabel || 'Search quests'}
              />
            </div>
            {validationErrors.search && (
              <p className="text-xs text-red-600" role="alert">
                {validationErrors.search}
              </p>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {questTranslations?.filters?.status || 'Status'}
            </label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder={questTranslations?.filters?.statusPlaceholder || 'All statuses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{commonTranslations?.all || 'All'}</SelectItem>
                <SelectItem value="draft">{questTranslations?.status?.draft || 'Draft'}</SelectItem>
                <SelectItem value="active">{questTranslations?.status?.active || 'Active'}</SelectItem>
                <SelectItem value="completed">{questTranslations?.status?.completed || 'Completed'}</SelectItem>
                <SelectItem value="cancelled">{questTranslations?.status?.cancelled || 'Cancelled'}</SelectItem>
                <SelectItem value="failed">{questTranslations?.status?.failed || 'Failed'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {questTranslations?.filters?.difficulty || 'Difficulty'}
            </label>
            <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange('difficulty', value)}>
              <SelectTrigger>
                <SelectValue placeholder={questTranslations?.filters?.difficultyPlaceholder || 'All difficulties'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{commonTranslations?.all || 'All'}</SelectItem>
                <SelectItem value="easy">{questTranslations?.difficulty?.easy || 'Easy'}</SelectItem>
                <SelectItem value="medium">{questTranslations?.difficulty?.medium || 'Medium'}</SelectItem>
                <SelectItem value="hard">{questTranslations?.difficulty?.hard || 'Hard'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {questTranslations?.filters?.category || 'Category'}
            </label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder={questTranslations?.filters?.categoryPlaceholder || 'All categories'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{commonTranslations?.all || 'All'}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Statistics */}
        {showStats && hasFilters && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {questTranslations?.filters?.showing || 'Showing'} {activeFilterCount} {questTranslations?.filters?.activeFilters || 'active filters'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-auto p-1"
                aria-label={questTranslations?.filters?.clearFilters || 'Clear all filters'}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
