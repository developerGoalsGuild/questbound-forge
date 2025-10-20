/**
 * CreateGuild Page Component
 *
 * A page component for creating new guilds with proper navigation
 * and success handling.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GuildCreationForm } from '@/components/guilds/GuildCreationForm';
import { GuildCreateInput } from '@/lib/api/guild';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

export const CreateGuild: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;

  const handleSuccess = (guild: any) => {
    toast.success(guildTranslations?.messages?.createSuccess || 'Guild created successfully!');
    navigate(`/guilds/${guild.guild_id}`);
  };

  const handleCancel = () => {
    navigate('/guilds');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {guildTranslations?.create?.title || 'Create New Guild'}
          </h1>
          <p className="text-gray-600">
            {guildTranslations?.create?.subtitle || 'Build a community around shared goals and interests'}
          </p>
        </div>

        <GuildCreationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};
