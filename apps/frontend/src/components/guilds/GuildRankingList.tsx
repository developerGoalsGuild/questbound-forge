/**
 * GuildRankingList Component
 *
 * A component for displaying a list of guild rankings in leaderboard format
 * with search, filtering, and sorting capabilities.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GuildRankingCard, GuildRankingData } from './GuildRankingCard';
import { GuildScoreInfo } from './GuildScoreInfo';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trophy,
  Users,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface GuildRankingListProps {
  guilds: GuildRankingData[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  limit?: number;
  onGuildClick?: (guild: GuildRankingData) => void;
}

type SortField = 'position' | 'score' | 'members' | 'activity' | 'name';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'public' | 'private' | 'top10' | 'top50';

export const GuildRankingList: React.FC<GuildRankingListProps> = ({
  guilds,
  loading = false,
  error = null,
  className = '',
  title = 'Guild Rankings',
  showSearch = true,
  showFilters = true,
  showStats = true,
  limit,
  onGuildClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter and sort guilds
  const filteredAndSortedGuilds = useMemo(() => {
    let filtered = guilds.filter(guild => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!guild.name.toLowerCase().includes(searchLower) &&
            !guild.description?.toLowerCase().includes(searchLower) &&
            !guild.badges.some(badge => badge.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Type filter
      switch (filterType) {
        case 'public':
          return guild.isPublic;
        case 'private':
          return !guild.isPublic;
        case 'top10':
          return guild.position <= 10;
        case 'top50':
          return guild.position <= 50;
        default:
          return true;
      }
    });

    // Sort guilds
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'position':
          aValue = a.position;
          bValue = b.position;
          break;
        case 'score':
          aValue = a.totalScore;
          bValue = b.totalScore;
          break;
        case 'members':
          aValue = a.memberCount;
          bValue = b.memberCount;
          break;
        case 'activity':
          aValue = a.activityScore;
          bValue = b.activityScore;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.position;
          bValue = b.position;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numA = Number(aValue);
      const numB = Number(bValue);
      
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return limit ? filtered.slice(0, limit) : filtered;
  }, [guilds, searchTerm, sortField, sortDirection, filterType, limit]);

  // Calculate stats
  const stats = useMemo(() => {
    if (guilds.length === 0) return null;

    const totalGuilds = guilds.length;
    const totalMembers = guilds.reduce((sum, guild) => sum + guild.memberCount, 0);
    const totalScore = guilds.reduce((sum, guild) => sum + guild.totalScore, 0);
    const avgActivity = guilds.reduce((sum, guild) => sum + guild.activityScore, 0) / totalGuilds;

    return {
      totalGuilds,
      totalMembers,
      totalScore,
      avgActivity: Math.round(avgActivity),
    };
  }, [guilds]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <SortAsc className="h-4 w-4" /> : 
      <SortDesc className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Rankings...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Loading Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title}
            <GuildScoreInfo variant="icon" size="sm" />
          </CardTitle>
          {showStats && stats && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stats.totalMembers.toLocaleString()} members
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                {stats.totalScore.toLocaleString()} pts
              </span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search guilds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {showFilters && (
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Guilds</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="top10">Top 10</SelectItem>
                    <SelectItem value="top50">Top 50</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('position')}
                    className={cn(
                      'rounded-r-none border-r',
                      sortField === 'position' && 'bg-gray-100'
                    )}
                  >
                    Rank {getSortIcon('position')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('score')}
                    className={cn(
                      'rounded-none border-r',
                      sortField === 'score' && 'bg-gray-100'
                    )}
                  >
                    Score {getSortIcon('score')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('members')}
                    className={cn(
                      'rounded-none border-r',
                      sortField === 'members' && 'bg-gray-100'
                    )}
                  >
                    Members {getSortIcon('members')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('activity')}
                    className="rounded-l-none"
                  >
                    Activity {getSortIcon('activity')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredAndSortedGuilds.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guilds found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'No guilds are available at the moment.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedGuilds.map((guild, index) => {
              // Debug: Log guild data to check for missing guildId
              if (!guild.guildId) {
                console.warn('Guild missing guildId:', guild, 'at index:', index);
              }
              return (
              <div
                key={guild.guildId || `guild-${index}`}
                className={cn(
                  'transition-all duration-200',
                  onGuildClick && 'cursor-pointer hover:scale-[1.02]'
                )}
                onClick={() => onGuildClick?.(guild)}
              >
                <GuildRankingCard
                  data={guild}
                  variant="leaderboard"
                  showTrends={true}
                />
              </div>
              );
            })}
          </div>
        )}

        {limit && filteredAndSortedGuilds.length === limit && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Showing top {limit} of {guilds.length} guilds
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuildRankingList;

