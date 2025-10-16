/**
 * MyGuilds Page Component
 *
 * A page component for displaying and managing user's guilds
 * with search, filtering, and creation capabilities.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GuildsList } from '@/components/guilds/GuildsList';
import { GuildRankingList } from '@/components/guilds/GuildRankingList';
import { GuildCreationModal } from '@/components/guilds/GuildCreationModal';
import { guildAPI, Guild } from '@/lib/api/guild';
import { useGuildRankings } from '@/hooks/useGuildRankings';
import { GuildRankingData } from '@/components/guilds/GuildRankingCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Trophy, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const MyGuilds: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'members' | 'activity'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'rankings' | 'my-guilds'>('rankings');

  // Fetch user's guilds
  const {
    data: guildsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-guilds', searchQuery, selectedTags, sortBy],
    queryFn: () => guildAPI.getMyGuilds(50),
    enabled: !!user,
  });

  // Fetch guild rankings
  const {
    rankings,
    loading: rankingsLoading,
    error: rankingsError,
    refresh: refreshRankings,
  } = useGuildRankings({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    limit: 50,
  });

  const guilds = guildsData?.guilds || [];

  const handleGuildClick = useCallback((guild: Guild) => {
    navigate(`/guilds/${guild.guildId}`);
  }, [navigate]);

  const handleRankingGuildClick = useCallback((guild: GuildRankingData) => {
    navigate(`/guilds/${guild.guildId}`);
  }, [navigate]);

  const handleJoinGuild = useCallback(async (guildId: string) => {
    try {
      await guildAPI.joinGuild(guildId);
      toast.success(guildTranslations?.messages?.joinSuccess || 'Successfully joined the guild!');
      refetch();
    } catch (error) {
      console.error('Failed to join guild:', error);
      toast.error(guildTranslations?.messages?.error || 'Failed to join guild');
    }
  }, [refetch]);

  const handleLeaveGuild = useCallback(async (guildId: string) => {
    try {
      await guildAPI.leaveGuild(guildId);
      toast.success(guildTranslations?.messages?.leaveSuccess || 'Successfully left the guild!');
      refetch();
    } catch (error) {
      console.error('Failed to leave guild:', error);
      toast.error(guildTranslations?.messages?.error || 'Failed to leave guild');
    }
  }, [refetch]);

  const handleGuildSettings = useCallback((guild: Guild) => {
    // TODO: Implement guild settings modal
    console.log('Guild settings:', guild);
  }, []);

  const handleCreateGuild = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((guild: Guild) => {
    setShowCreateModal(false);
    toast.success('Guild created successfully!');
    refetch();
    navigate(`/guilds/${guild.guildId}`);
  }, [refetch, navigate]);

  const handleCreateCancel = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleTagsChange = useCallback((tags: string[]) => {
    setSelectedTags(tags);
  }, []);

  const handleSortChange = useCallback((sort: 'newest' | 'oldest' | 'members' | 'activity') => {
    setSortBy(sort);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Guilds</h1>
          <p className="text-gray-600 mb-4">
            There was an error loading your guilds. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guilds</h1>
          <p className="text-gray-600 mt-1">
            Discover and manage your guilds
          </p>
        </div>
        <Button
          onClick={handleCreateGuild}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {guildTranslations?.create?.actions?.create || 'Create Guild'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'rankings' | 'my-guilds')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rankings" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {guildTranslations?.rankings?.title || 'Rankings'}
          </TabsTrigger>
          <TabsTrigger value="my-guilds" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {guildTranslations?.list?.title || 'My Guilds'}
          </TabsTrigger>
        </TabsList>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="mt-6">
          <GuildRankingList
            guilds={rankings}
            loading={rankingsLoading}
            error={rankingsError}
            title={guildTranslations?.rankings?.title || 'Guild Rankings'}
            showSearch={true}
            showFilters={true}
            showStats={true}
            limit={50}
            onGuildClick={handleRankingGuildClick}
          />
        </TabsContent>

        {/* My Guilds Tab */}
        <TabsContent value="my-guilds" className="mt-6">
          <GuildsList
            guilds={guilds}
            isLoading={isLoading}
            onGuildClick={handleGuildClick}
            onJoinGuild={handleJoinGuild}
            onLeaveGuild={handleLeaveGuild}
            onGuildSettings={handleGuildSettings}
            onCreateGuild={handleCreateGuild}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            showCreateButton={false} // Hide since we have it in header
            showFilters={true}
            currentUserId={user?.id}
          />
        </TabsContent>
      </Tabs>

      {/* Create Guild Modal */}
      <GuildCreationModal
        isOpen={showCreateModal}
        onClose={handleCreateCancel}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
