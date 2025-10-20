/**
 * GuildCard Component
 *
 * A card component for displaying guild information with actions,
 * following the project's design patterns and accessibility standards.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GuildAvatar } from './GuildAvatar';
import {
  Users,
  Target,
  Trophy,
  Calendar,
  Settings,
  UserPlus,
  UserMinus,
  Loader2,
  Crown,
  Globe,
  Lock,
  Shield,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Guild, GuildMember } from '@/lib/api/guild';
import { useTranslation } from '@/hooks/useTranslation';
import { getGuildTranslations } from '@/i18n/guild';
import { useAccessibility } from '@/hooks/useAccessibility';
import { ARIALiveRegion } from '@/components/ui/aria-live-region';

interface GuildCardProps {
  guild: Guild;
  currentUserId?: string;
  onGuildClick?: (guild: Guild) => void;
  onJoin?: (guildId: string) => Promise<void>;
  onLeave?: (guildId: string) => Promise<void>;
  onSettings?: (guild: Guild) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export const GuildCard: React.FC<GuildCardProps> = ({
  guild,
  currentUserId,
  onGuildClick,
  onJoin,
  onLeave,
  onSettings,
  showActions = true,
  variant = 'default',
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  const { announce } = useAccessibility();

  // Determine user's role in the guild
  const userRole = guild.members?.find(member => member.user_id === currentUserId)?.role;
  const isOwner = userRole === 'owner';
  const isMember = userRole === 'member' || isOwner;
  const canJoin = !isMember && guild.guild_type === 'public';

  const handleGuildClick = useCallback(() => {
    onGuildClick?.(guild);
  }, [guild, onGuildClick]);

  const handleJoin = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onJoin || isLoading) return;

    setIsLoading(true);
    setActionLoading('join');
    announce(`Joining ${guild.name}...`, { priority: 'polite' });
    
    try {
      await onJoin(guild.guild_id);
      announce(`Successfully joined ${guild.name}`, { priority: 'polite' });
    } catch (error) {
      console.error('Failed to join guild:', error);
      announce(`Failed to join ${guild.name}`, { priority: 'assertive' });
    } finally {
      setIsLoading(false);
      setActionLoading(null);
    }
  }, [guild.guild_id, guild.name, onJoin, isLoading, announce]);

  const handleLeave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onLeave || isLoading) return;

    if (confirm(guildTranslations?.messages?.confirmLeave || 'Are you sure you want to leave this guild?')) {
      setIsLoading(true);
      setActionLoading('leave');
      announce(`Leaving ${guild.name}...`, { priority: 'polite' });
      
      try {
        await onLeave(guild.guild_id);
        announce(`Successfully left ${guild.name}`, { priority: 'polite' });
      } catch (error) {
        console.error('Failed to leave guild:', error);
        announce(`Failed to leave ${guild.name}`, { priority: 'assertive' });
      } finally {
        setIsLoading(false);
        setActionLoading(null);
      }
    }
  }, [guild.guild_id, guild.name, onLeave, isLoading, guildTranslations?.messages?.confirmLeave, announce]);

  const handleSettings = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSettings?.(guild);
  }, [guild, onSettings]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getGuildInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderTags = () => {
    if (!guild.tags || guild.tags.length === 0) return null;

    const displayTags = variant === 'compact' ? guild.tags.slice(0, 2) : guild.tags.slice(0, 3);
    const remainingCount = guild.tags.length - displayTags.length;

    return (
      <div 
        className="flex flex-wrap gap-1" 
        role="group" 
        aria-label={`Guild tags: ${displayTags.join(', ')}${remainingCount > 0 ? ` and ${remainingCount} more` : ''}`}
      >
        {displayTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs" role="text">
            {tag}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs" role="text" aria-label={`${remainingCount} more tags`}>
            +{remainingCount}
          </Badge>
        )}
      </div>
    );
  };

  const renderActions = () => {
    if (!showActions) return null;

    return (
      <div className="flex items-center gap-2" role="group" aria-label="Guild actions">
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettings}
            className="h-8 w-8 p-0"
            aria-label={`${guildTranslations?.details?.actions?.settings || 'Guild settings'} for ${guild.name}`}
            title={guildTranslations?.details?.actions?.settings || 'Guild settings'}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}

        {canJoin && (
          <Button
            size="sm"
            onClick={handleJoin}
            disabled={isLoading}
            className="h-8"
            aria-label={`${guildTranslations?.details?.actions?.join || 'Join'} ${guild.name}`}
            aria-describedby={isLoading ? `join-loading-${guild.guild_id}` : undefined}
          >
            {actionLoading === 'join' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden="true" />
                <span id={`join-loading-${guild.guild_id}`} className="sr-only">Joining guild...</span>
              </>
            ) : (
              <UserPlus className="h-4 w-4 mr-1" aria-hidden="true" />
            )}
            {guildTranslations?.details?.actions?.join || 'Join'}
          </Button>
        )}

        {isMember && !isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeave}
            disabled={isLoading}
            className="h-8"
            aria-label={`${guildTranslations?.details?.actions?.leave || 'Leave'} ${guild.name}`}
            aria-describedby={isLoading ? `leave-loading-${guild.guild_id}` : undefined}
          >
            {actionLoading === 'leave' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden="true" />
                <span id={`leave-loading-${guild.guild_id}`} className="sr-only">Leaving guild...</span>
              </>
            ) : (
              <UserMinus className="h-4 w-4 mr-1" aria-hidden="true" />
            )}
            {guildTranslations?.details?.actions?.leave || 'Leave'}
          </Button>
        )}
      </div>
    );
  };

  const cardContent = (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-md',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
        variant === 'compact' && 'h-full',
        className
      )}
      onClick={handleGuildClick}
      tabIndex={0}
      role="button"
      aria-label={`${guildTranslations?.details?.actions?.viewProfile || 'View guild'} ${guild.name}. ${guild.member_count} members, ${guild.goal_count} goals, ${guild.quest_count} quests. ${guild.guild_type} guild.`}
      aria-describedby={`guild-${guild.guild_id}-description`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleGuildClick();
        }
      }}
    >
      <CardHeader className={cn('pb-3', variant === 'compact' && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Guild Avatar */}
            <GuildAvatar 
              guildId={guild.guild_id}
              guildName={guild.name}
              avatarUrl={guild.avatar_url}
              size="sm"
              className="h-10 w-10 flex-shrink-0"
            />

            {/* Guild Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate" id={`guild-${guild.guild_id}-title`}>
                  {guild.name}
                </h3>
                {isOwner && (
                  <Crown 
                    className="h-4 w-4 text-yellow-500 flex-shrink-0" 
                    aria-label="Owner"
                    role="img"
                  />
                )}
                {guild.guild_type === 'public' && (
                  <Globe 
                    className="h-4 w-4 text-green-500 flex-shrink-0" 
                    aria-label="Public guild"
                    role="img"
                  />
                )}
                {guild.guild_type === 'private' && (
                  <Lock 
                    className="h-4 w-4 text-gray-500 flex-shrink-0" 
                    aria-label="Private guild"
                    role="img"
                  />
                )}
                {guild.guild_type === 'approval' && (
                  <Shield 
                    className="h-4 w-4 text-blue-500 flex-shrink-0" 
                    aria-label="Approval required guild"
                    role="img"
                  />
                )}
              </div>
              
              {guild.description && variant !== 'compact' && (
                <p className="text-sm text-gray-600 line-clamp-2" id={`guild-${guild.guild_id}-description`}>
                  {guild.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {renderActions()}
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', variant === 'compact' && 'pt-0')}>
        {/* Stats */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600" role="group" aria-label="Guild statistics">
          <div className="flex items-center gap-1" aria-label={`${guild.member_count} members`}>
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>{guild.member_count}</span>
          </div>
          <div className="flex items-center gap-1" aria-label={`${guild.goal_count} goals`}>
            <Target className="h-4 w-4" aria-hidden="true" />
            <span>{guild.goal_count}</span>
          </div>
          <div className="flex items-center gap-1" aria-label={`${guild.quest_count} quests`}>
            <Trophy className="h-4 w-4" aria-hidden="true" />
            <span>{guild.quest_count}</span>
          </div>
          {variant !== 'compact' && (
            <div className="flex items-center gap-1 ml-auto" aria-label={`Created ${formatDate(guild.created_at)}`}>
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{formatDate(guild.created_at)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {renderTags()}

        {/* Compact variant additional info */}
        {variant === 'compact' && (
          <div className="mt-2 text-xs text-gray-500">
            {guildTranslations?.details?.stats?.created || 'Created'} {formatDate(guild.createdAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {cardContent}
      <ARIALiveRegion 
        message="" 
        priority="polite" 
        className="sr-only"
      />
    </>
  );
};
