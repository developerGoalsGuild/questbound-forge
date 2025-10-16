/**
 * GuildDetails Page Component
 *
 * A page component for displaying detailed guild information
 * with proper navigation and error handling.
 */

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GuildDetails as GuildDetailsComponent } from '@/components/guilds/GuildDetails';
import { GuildCreationModal } from '@/components/guilds/GuildCreationModal';
import { guildAPI, Guild } from '@/lib/api/guild';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

export const GuildDetails: React.FC = () => {
  const { id: guildId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;

  const handleBack = useCallback(() => {
    navigate('/guilds');
  }, [navigate]);

  const handleEdit = useCallback((guild: Guild) => {
    // TODO: Implement guild edit modal
    console.log('Edit guild:', guild);
    toast.info(guildTranslations?.messages?.error || 'Guild editing feature coming soon!');
  }, []);

  const handleDelete = useCallback(async (guild: Guild) => {
    try {
      await guildAPI.deleteGuild(guild.guildId);
      toast.success(guildTranslations?.messages?.deleteSuccess || 'Guild deleted successfully!');
      navigate('/guilds');
    } catch (error) {
      console.error('Failed to delete guild:', error);
      toast.error(guildTranslations?.messages?.error || 'Failed to delete guild');
    }
  }, [navigate]);

  if (!guildId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{guildTranslations?.details?.notFound || 'Guild Not Found'}</h1>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.details?.notFound || 'The requested guild could not be found.'}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {guildTranslations?.list?.title || 'Back to Guilds'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GuildDetailsComponent
        guildId={guildId}
        currentUserId={user?.id}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};
