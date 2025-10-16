/**
 * GuildsList Component
 *
 * A comprehensive list component for displaying guilds with search, filtering,
 * sorting, and view mode options following the project's patterns.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  Loader2,
  Users,
  Globe,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Guild } from '@/lib/api/guild';
import { GuildCard } from './GuildCard';
import { useTranslation } from '@/hooks/useTranslation';
import { getGuildTranslations } from '@/i18n/guild';

interface GuildsListProps {
  guilds: Guild[];
  isLoading?: boolean;
  onGuildClick?: (guild: Guild) => void;
  onJoinGuild?: (guildId: string) => Promise<void>;
  onLeaveGuild?: (guildId: string) => Promise<void>;
  onGuildSettings?: (guild: Guild) => void;
  onCreateGuild?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  sortBy?: 'newest' | 'oldest' | 'members' | 'activity';
  onSortChange?: (sort: 'newest' | 'oldest' | 'members' | 'activity') => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showCreateButton?: boolean;
  showFilters?: boolean;
  currentUserId?: string;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'members' | 'activity';
type ViewMode = 'grid' | 'list';

export const GuildsList: React.FC<GuildsListProps> = ({
  guilds,
  isLoading = false,
  onGuildClick,
  onJoinGuild,
  onLeaveGuild,
  onGuildSettings,
  onCreateGuild,
  searchQuery = '',
  onSearchChange,
  selectedTags = [],
  onTagsChange,
  sortBy = 'newest',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  showCreateButton = true,
  showFilters = true,
  currentUserId,
  className,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localSortBy, setLocalSortBy] = useState<SortOption>(sortBy);
  const [localViewMode, setLocalViewMode] = useState<ViewMode>(viewMode);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(localSearchQuery);
      onSearchChange?.(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearchChange]);

  // Sync external props with local state
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalSortBy(sortBy);
  }, [sortBy]);

  useEffect(() => {
    setLocalViewMode(viewMode);
  }, [viewMode]);

  // Get unique tags from all guilds
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    guilds.forEach(guild => {
      guild.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [guilds]);

  // Filter and sort guilds
  const filteredAndSortedGuilds = useMemo(() => {
    let filtered = guilds;

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(guild =>
        guild.name.toLowerCase().includes(query) ||
        guild.description?.toLowerCase().includes(query) ||
        guild.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(guild =>
        selectedTags.every(tag => guild.tags?.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (localSortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'members':
          return b.memberCount - a.memberCount;
        case 'activity':
          // For now, use member count as a proxy for activity
          // In the future, this could be based on actual activity metrics
          return b.memberCount - a.memberCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [guilds, debouncedSearchQuery, selectedTags, localSortBy]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const newSort = value as SortOption;
    setLocalSortBy(newSort);
    onSortChange?.(newSort);
  }, [onSortChange]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setLocalViewMode(mode);
    onViewModeChange?.(mode);
  }, [onViewModeChange]);

  const handleTagToggle = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange?.(newTags);
  }, [selectedTags, onTagsChange]);

  const clearFilters = useCallback(() => {
    setLocalSearchQuery('');
    onTagsChange?.([]);
  }, [onTagsChange]);

  const renderEmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {guildTranslations?.list?.empty?.title || 'No guilds yet'}
        </h3>
        <p className="text-gray-600 mb-6">
          {guildTranslations?.list?.empty?.description || 'Create your first guild to start building a community around shared goals.'}
        </p>
        {showCreateButton && onCreateGuild && (
          <Button onClick={onCreateGuild} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {guildTranslations?.list?.empty?.action || 'Create Guild'}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderLoadingState = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <label htmlFor="guild-search" className="sr-only">
              {guildTranslations?.list?.search?.label || 'Search guilds'}
            </label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <Input
              id="guild-search"
              placeholder={guildTranslations?.list?.search?.placeholder || 'Search guilds...'}
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="pl-10"
              aria-describedby="search-help"
              role="searchbox"
              aria-label="Search guilds by name or description"
            />
            <div id="search-help" className="sr-only">
              Type to search guilds by name or description
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" id="tags-filter-label">
                Filter by tags:
              </label>
              <div 
                className="flex flex-wrap gap-2" 
                role="group" 
                aria-labelledby="tags-filter-label"
                aria-label="Filter guilds by tags"
              >
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    onClick={() => handleTagToggle(tag)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedTags.includes(tag)}
                    aria-label={`${selectedTags.includes(tag) ? 'Remove' : 'Add'} ${tag} filter`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTagToggle(tag);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <Select value={localSortBy} onValueChange={handleSortChange}>
                <SelectTrigger id="sort-select" className="w-40" aria-label="Sort guilds">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{guildTranslations?.list?.sort?.newest || 'Newest'}</SelectItem>
                  <SelectItem value="oldest">{guildTranslations?.list?.sort?.oldest || 'Oldest'}</SelectItem>
                  <SelectItem value="members">{guildTranslations?.list?.sort?.members || 'Most Members'}</SelectItem>
                  <SelectItem value="activity">{guildTranslations?.list?.sort?.activity || 'Most Active'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 border rounded-md" role="group" aria-label="View mode">
              <Button
                variant={localViewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className="rounded-r-none"
                aria-pressed={localViewMode === 'grid'}
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid3X3 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant={localViewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="rounded-l-none"
                aria-pressed={localViewMode === 'list'}
                aria-label="List view"
                title="List view"
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Clear Filters */}
            {(localSearchQuery || selectedTags.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                aria-label="Clear all filters"
                title="Clear all filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGuilds = () => {
    if (filteredAndSortedGuilds.length === 0) {
      return renderEmptyState();
    }

    const gridClasses = localViewMode === 'grid' 
      ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
      : 'space-y-4';

    return (
      <div 
        className={gridClasses}
        role="region"
        aria-label={`Guilds list showing ${filteredAndSortedGuilds.length} guilds`}
        aria-live="polite"
      >
        {filteredAndSortedGuilds.map(guild => (
          <GuildCard
            key={guild.guildId}
            guild={guild}
            currentUserId={currentUserId}
            onGuildClick={onGuildClick}
            onJoin={onJoinGuild}
            onLeave={onLeaveGuild}
            onSettings={onGuildSettings}
            variant={localViewMode === 'list' ? 'compact' : 'default'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" id="guilds-title">
            {guildTranslations?.list?.title || 'My Guilds'}
          </h1>
          <p className="text-gray-600 mt-1" id="guilds-count" aria-live="polite">
            {filteredAndSortedGuilds.length} guild{guilds.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {showCreateButton && onCreateGuild && (
          <Button 
            onClick={onCreateGuild} 
            className="inline-flex items-center gap-2"
            aria-label="Create a new guild"
            title="Create a new guild"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Guild
          </Button>
        )}
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Content */}
      {isLoading ? renderLoadingState() : renderGuilds()}
    </div>
  );
};
