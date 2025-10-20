/**
 * GuildEditPage Component
 *
 * Main page for editing guild details with comprehensive form management
 * and permission checks.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GuildEditForm } from '@/components/guilds/GuildEditForm';
import { guildAPI } from '@/lib/api/guild';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { Guild, GuildUpdateInput } from '@/lib/api/guild';

export const GuildEditPage: React.FC = () => {
  const { id: guildId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const guildTranslations = t.guild;

  const [error, setError] = useState<string | null>(null);

  // Fetch guild data
  const {
    data: guild,
    isLoading: isLoadingGuild,
    error: guildError,
  } = useQuery({
    queryKey: ['guild', guildId],
    queryFn: () => guildAPI.getGuild(guildId!, true, true, true),
    enabled: !!guildId,
    retry: 1,
  });

  // Update guild mutation
  const updateGuildMutation = useMutation({
    mutationFn: (data: GuildUpdateInput) => guildAPI.updateGuild(guildId!, data),
    onSuccess: () => {
      // Invalidate and refetch guild data
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      queryClient.invalidateQueries({ queryKey: ['my-guilds'] });
      queryClient.invalidateQueries({ queryKey: ['guild-rankings'] });
      
      // Navigate back to guild details
      navigate(`/guilds/${guildId}`);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Handle form submission
  const handleSave = async (data: GuildUpdateInput) => {
    setError(null);
    try {
      await updateGuildMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error('Error updating guild:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/guilds/${guildId}`);
  };

  // Check if user has permission to edit
  const isOwner = guild?.created_by === user?.id;
  const isModerator = guild?.moderators?.includes(user?.id || '') || false;
  const canEdit = isOwner || isModerator;
  

  // Show loading state
  if (isLoadingGuild) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {guildTranslations?.edit?.loading || 'Loading guild details...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (guildError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {guildTranslations?.edit?.errorTitle || 'Error Loading Guild'}
          </h2>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.edit?.errorMessage || 'Unable to load guild details. Please try again.'}
          </p>
          <Button onClick={() => navigate('/guilds')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {guildTranslations?.edit?.backToGuilds || 'Back to Guilds'}
          </Button>
        </div>
      </div>
    );
  }

  // Show permission denied
  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {guildTranslations?.edit?.permissionDenied || 'Permission Denied'}
          </h2>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.edit?.permissionMessage || 'You do not have permission to edit this guild.'}
          </p>
          <Button onClick={() => navigate(`/guilds/${guildId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {guildTranslations?.edit?.backToGuild || 'Back to Guild'}
          </Button>
        </div>
      </div>
    );
  }

  // Show guild not found
  if (!guild) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {guildTranslations?.edit?.guildNotFound || 'Guild Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.edit?.guildNotFoundMessage || 'The guild you are looking for does not exist.'}
          </p>
          <Button onClick={() => navigate('/guilds')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {guildTranslations?.edit?.backToGuilds || 'Back to Guilds'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => navigate('/guilds')}
            className="hover:text-gray-700"
          >
            {guildTranslations?.edit?.guilds || 'Guilds'}
          </button>
          <span>/</span>
          <button
            onClick={() => navigate(`/guilds/${guildId}`)}
            className="hover:text-gray-700"
          >
            {guild.name}
          </button>
          <span>/</span>
          <span className="text-gray-900">
            {guildTranslations?.edit?.edit || 'Edit'}
          </span>
        </nav>

        {/* Main Content */}
        <GuildEditForm
          guild={guild}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={updateGuildMutation.isPending}
          error={error}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
};

export default GuildEditPage;
