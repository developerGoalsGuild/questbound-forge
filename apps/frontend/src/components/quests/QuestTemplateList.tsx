import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  MoreHorizontal,
  Grid3X3,
  List,
  Loader2,
  Plus
} from 'lucide-react';
import QuestTemplateCard from './QuestTemplateCard';
import { QuestTemplate, QuestTemplateFilters, QuestTemplateSortOptions } from '@/models/questTemplate';
import { 
  QUEST_TEMPLATE_CATEGORIES,
  QUEST_TEMPLATE_DIFFICULTY_OPTIONS,
  QUEST_TEMPLATE_KIND_OPTIONS,
  QUEST_TEMPLATE_PRIVACY_OPTIONS
} from '@/models/questTemplate';
import { logger } from '@/lib/logger';

interface QuestTemplateListProps {
  templates: QuestTemplate[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onEdit?: (template: QuestTemplate) => void;
  onDelete?: (template: QuestTemplate) => void;
  onUse?: (template: QuestTemplate) => void;
  onView?: (template: QuestTemplate) => void;
  onCreate?: () => void;
  showActions?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'createdAt' | 'updatedAt' | 'difficulty' | 'rewardXp';
type SortDirection = 'asc' | 'desc';

const QuestTemplateList: React.FC<QuestTemplateListProps> = ({
  templates,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onEdit,
  onDelete,
  onUse,
  onView,
  onCreate,
  showActions = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<QuestTemplateFilters>({});
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = template.title.toLowerCase().includes(query);
        const matchesDescription = template.description?.toLowerCase().includes(query) || false;
        const matchesCategory = template.category.toLowerCase().includes(query);
        const matchesTags = template.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesDescription && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && template.category !== filters.category) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty && filters.difficulty !== 'all' && template.difficulty !== filters.difficulty) {
        return false;
      }

      // Privacy filter
      if (filters.privacy && filters.privacy !== 'all' && template.privacy !== filters.privacy) {
        return false;
      }

      // Kind filter
      if (filters.kind && filters.kind !== 'all' && template.kind !== filters.kind) {
        return false;
      }

      return true;
    });

    // Sort templates
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
          bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
          break;
        case 'rewardXp':
          aValue = a.rewardXp;
          bValue = b.rewardXp;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [templates, searchQuery, filters, sortField, sortDirection]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (key: keyof QuestTemplateFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({});
    setSortField('createdAt');
    setSortDirection('desc');
  };

  const hasActiveFilters = searchQuery || Object.keys(filters).length > 0;

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const getSortLabel = (field: SortField) => {
    const labels: Record<SortField, string> = {
      title: questTranslations?.templates?.sort?.title || 'Title',
      createdAt: questTranslations?.templates?.sort?.createdAt || 'Created',
      updatedAt: questTranslations?.templates?.sort?.updatedAt || 'Updated',
      difficulty: questTranslations?.templates?.sort?.difficulty || 'Difficulty',
      rewardXp: questTranslations?.templates?.sort?.rewardXp || 'XP'
    };
    return labels[field];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={questTranslations?.templates?.search?.placeholder || 'Search templates...'}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {questTranslations?.templates?.title || 'Quest Templates'}
          </h3>
          {onCreate && (
            <Button onClick={onCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {questTranslations?.templates?.actions?.createTemplate || 'Create Template'}
            </Button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={questTranslations?.templates?.filters?.category || 'Category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{questTranslations?.templates?.filters?.allCategories || 'All Categories'}</SelectItem>
              {QUEST_TEMPLATE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty Filter */}
          <Select
            value={filters.difficulty || 'all'}
            onValueChange={(value) => handleFilterChange('difficulty', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={questTranslations?.templates?.filters?.difficulty || 'Difficulty'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{questTranslations?.templates?.filters?.allDifficulties || 'All'}</SelectItem>
              {QUEST_TEMPLATE_DIFFICULTY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Privacy Filter */}
          <Select
            value={filters.privacy || 'all'}
            onValueChange={(value) => handleFilterChange('privacy', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={questTranslations?.templates?.filters?.privacy || 'Privacy'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{questTranslations?.templates?.filters?.allPrivacy || 'All'}</SelectItem>
              {QUEST_TEMPLATE_PRIVACY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Kind Filter */}
          <Select
            value={filters.kind || 'all'}
            onValueChange={(value) => handleFilterChange('kind', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={questTranslations?.templates?.filters?.kind || 'Kind'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{questTranslations?.templates?.filters?.allKinds || 'All'}</SelectItem>
              {QUEST_TEMPLATE_KIND_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {questTranslations?.templates?.sort?.title || 'Sort'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['title', 'createdAt', 'updatedAt', 'difficulty', 'rewardXp'] as SortField[]).map(field => (
                <DropdownMenuItem
                  key={field}
                  onClick={() => handleSortChange(field)}
                  className="flex items-center justify-between"
                >
                  <span>{getSortLabel(field)}</span>
                  {getSortIcon(field)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              {questTranslations?.templates?.filters?.clear || 'Clear'}
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Badge key={key} variant="secondary" className="gap-1">
                  {key}: {value}
                  <button
                    onClick={() => handleFilterChange(key as keyof QuestTemplateFilters, undefined)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredAndSortedTemplates.length} {questTranslations?.templates?.results?.templates || 'templates'}
          {hasActiveFilters && ` (${templates.length} total)`}
        </span>
        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{commonTranslations?.loading || 'Loading...'}</span>
          </div>
        )}
      </div>

      {/* Templates Grid/List */}
      {filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? (questTranslations?.templates?.messages?.noResults || 'No templates match your filters')
              : (questTranslations?.templates?.messages?.noTemplates || 'No templates found')
            }
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              {questTranslations?.templates?.filters?.clear || 'Clear Filters'}
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredAndSortedTemplates.map(template => (
            <QuestTemplateCard
              key={template.id}
              template={template}
              onEdit={onEdit}
              onDelete={onDelete}
              onUse={onUse}
              onView={onView}
              showActions={showActions}
              className={viewMode === 'list' ? 'flex flex-row' : ''}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {commonTranslations?.loading || 'Loading...'}
              </>
            ) : (
              questTranslations?.templates?.actions?.loadMore || 'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestTemplateList;
