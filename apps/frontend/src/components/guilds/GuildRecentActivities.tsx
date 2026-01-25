/**
 * GuildRecentActivities Component
 *
 * Displays recent guild activities including quest created, member joins/leaves, and quest completions.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  UserPlus,
  UserMinus,
  CheckCircle,
  Loader2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, fr } from 'date-fns/locale';
import { guildAPI, GuildActivity } from '@/lib/api/guild';
import { cn } from '@/lib/utils';
import { getGuildTranslations } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildRecentActivitiesProps {
  guildId: string;
  limit?: number;
  className?: string;
  language?: string; // Optional prop to force language
}

const ACTIVITY_ICONS = {
  quest_created: Trophy,
  quest_activated: Trophy,
  quest_completed: CheckCircle,
  quest_failed: AlertCircle,
  member_joined: UserPlus,
  member_left: UserMinus,
};

const ACTIVITY_COLORS = {
  quest_created: 'text-purple-500',
  quest_activated: 'text-blue-500',
  quest_completed: 'text-green-500',
  quest_failed: 'text-red-500',
  member_joined: 'text-green-500',
  member_left: 'text-red-500',
};

const getActivityMessage = (activity: GuildActivity, t: any): string => {
  switch (activity.activityType) {
    case 'quest_created':
      return `${t.messages.questCreated || 'created quest'} "${activity.details.questTitle || 'Untitled'}"`;
    case 'quest_activated':
      return `${t.messages.questActivated || 'activated quest'} "${activity.details.questTitle || 'Untitled'}"`;
    case 'quest_completed':
      return `${t.messages.questCompleted || 'completed quest'} "${activity.details.questTitle || 'Untitled'}"`;
    case 'quest_failed':
      return `${t.messages.questFailed || 'quest failed'} "${activity.details.questTitle || 'Untitled'}"`;
    case 'member_joined':
      return t.messages.memberJoined;
    case 'member_left':
      return t.messages.memberLeft;
    default:
      return 'performed an action';
  }
};

export const GuildRecentActivities: React.FC<GuildRecentActivitiesProps> = ({
  guildId,
  limit = 10,
  className,
  language: propLanguage,
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['guild-activities', guildId, limit],
    queryFn: () => guildAPI.getGuildActivities(guildId, limit),
    enabled: !!guildId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch guild members to resolve user IDs to nicknames for existing activities
  const { data: guildData } = useQuery({
    queryKey: ['guild', guildId, 'members'],
    queryFn: () => guildAPI.getGuild(guildId, true, false, false),
    enabled: !!guildId,
    staleTime: 60000, // Cache for 1 minute
  });

  // Helper function to resolve actor name from ID if needed
  const resolveActorName = (activity: GuildActivity): string => {
    // If actorName is "Unknown" or looks like a user ID, try to resolve it from members
    const needsResolving = 
      activity.actorName === 'Unknown' ||
      activity.actorName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
      activity.actorName.startsWith('User_');
    
    if (needsResolving && guildData?.members) {
      // Try to find the member and use their nickname
      const member = guildData.members.find(m => m.user_id === activity.actorId);
      if (member) {
        // Prefer nickname, fallback to username, then use original actorName
        return member.nickname || member.username || activity.actorName;
      }
    }
    // Otherwise, use the stored actorName (should be nickname for new activities)
    return activity.actorName;
  };

  const { language: contextLanguage, isLanguageLoading } = useTranslation();
  // Use prop language if provided (most reliable), otherwise use context, with safe fallback
  // If language is still loading, use prop or default to 'en'
  const language = propLanguage || (isLanguageLoading ? 'en' : contextLanguage) || 'en';
  // Ensure we're using a valid language code
  const validLanguage = (language === 'en' || language === 'es' || language === 'fr') ? language : 'en';
  const translations = getGuildTranslations(validLanguage);
  const t = translations.activities;

  // Date locale mapping
  const dateLocales: Record<string, typeof enUS> = { en: enUS, es, fr };
  const dateLocale = dateLocales[validLanguage] || enUS;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">{t.loading}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <p className="font-semibold text-lg">{t.error}</p>
              <p className="text-sm text-gray-600 mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = data?.activities || [];

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 text-center py-8">
            <Activity className="h-16 w-16 text-gray-300" />
            <div>
              <p className="font-semibold text-lg">{t.empty}</p>
              <p className="text-sm text-gray-600 mt-1">
                {t.emptyDescription}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.activityType] || Activity;
            const colorClass = ACTIVITY_COLORS[activity.activityType] || 'text-gray-500';

            return (
              <div
                key={activity.activityId}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={cn('rounded-full p-2 bg-gray-100', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{resolveActorName(activity)}</span>
                    <span className="text-sm text-gray-600">
                      {getActivityMessage(activity, t)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: dateLocale })}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {(t.types as Record<string, string>)[activity.activityType] || activity.activityType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

