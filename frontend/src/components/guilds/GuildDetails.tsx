/**
 * GuildDetails Component
 *
 * A comprehensive component for displaying detailed guild information
 * with tabs for overview, members, goals, and quests.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Target,
  Trophy,
  Calendar,
  Settings,
  UserPlus,
  UserMinus,
  Crown,
  Globe,
  Lock,
  Shield,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  UserX,
  UserCheck,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { guildAPI, Guild, GuildMember } from '@/lib/api/guild';
import { getGuildTranslations } from '@/i18n/guild';
import { GuildAnalyticsCard } from './GuildAnalyticsCard';
import { GuildComments } from './GuildComments';
import { GuildJoinRequests } from './GuildJoinRequests';
import { GuildJoinRequestForm } from './GuildJoinRequestForm';
import { GuildModeration } from './GuildModeration';
import { GuildOwnershipTransfer } from './GuildOwnershipTransfer';
import { GuildAvatar } from './GuildAvatar';
import { useGuildAnalytics } from '@/hooks/useGuildAnalytics';
import { toast } from 'sonner';

interface GuildDetailsProps {
  guildId: string;
  currentUserId?: string;
  onBack?: () => void;
  onEdit?: (guild: Guild) => void;
  onDelete?: (guild: Guild) => void;
  initialTab?: TabType;
  className?: string;
}

type TabType = 'overview' | 'members' | 'goals' | 'quests' | 'analytics' | 'comments' | 'joinRequests' | 'moderation';

export const GuildDetails: React.FC<GuildDetailsProps> = ({
  guildId,
  currentUserId,
  onBack,
  onEdit,
  onDelete,
  initialTab = 'overview',
  className,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showJoinRequestForm, setShowJoinRequestForm] = useState(false);

  const queryClient = useQueryClient();
  const translations = getGuildTranslations('en'); // TODO: Use actual language

  // Fetch guild analytics
  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics,
  } = useGuildAnalytics({
    guildId,
    autoRefresh: false, // Disable auto-refresh for better performance
  });

  // Fetch guild details
  const {
    data: guild,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guild', guildId],
    queryFn: () => {
      if (!guildId || guildId === 'undefined') {
        throw new Error('Invalid guild ID provided');
      }
      return guildAPI.getGuild(guildId, true, true, true);
    },
    enabled: !!guildId && guildId !== 'undefined',
    retry: (failureCount, error) => {
      // Don't retry if it's an invalid guild ID error
      if (error?.message?.includes('Invalid guild ID')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Join guild mutation
  const joinMutation = useMutation({
    mutationFn: () => guildAPI.joinGuild(guildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      queryClient.invalidateQueries({ queryKey: ['my-guilds'] });
      toast.success(translations.messages.joinSuccess);
    },
    onError: (error) => {
      console.error('Failed to join guild:', error);
      toast.error(error.message || translations.messages.error);
    },
  });

  // Leave guild mutation
  const leaveMutation = useMutation({
    mutationFn: () => guildAPI.leaveGuild(guildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      queryClient.invalidateQueries({ queryKey: ['my-guilds'] });
      toast.success(translations.messages.leaveSuccess);
    },
    onError: (error) => {
      console.error('Failed to leave guild:', error);
      toast.error(error.message || translations.messages.error);
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.removeUserFromGuild(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success('User removed from guild successfully');
    },
    onError: (error) => {
      console.error('Failed to remove user:', error);
      toast.error(error.message || 'Failed to remove user');
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.blockUser(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success('User blocked successfully');
    },
    onError: (error) => {
      console.error('Failed to block user:', error);
      toast.error(error.message || 'Failed to block user');
    },
  });

  // Unblock user mutation
  const unblockUserMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.unblockUser(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success('User unblocked successfully');
    },
    onError: (error) => {
      console.error('Failed to unblock user:', error);
      toast.error(error.message || 'Failed to unblock user');
    },
  });

  // Assign moderator mutation
  const assignModeratorMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.assignModerator(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success('Moderator assigned successfully');
    },
    onError: (error) => {
      console.error('Failed to assign moderator:', error);
      toast.error(error.message || 'Failed to assign moderator');
    },
  });

  // Remove moderator mutation
  const removeModeratorMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.removeModerator(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success('Moderator removed successfully');
    },
    onError: (error) => {
      console.error('Failed to remove moderator:', error);
      toast.error(error.message || 'Failed to remove moderator');
    },
  });

  // Determine user's role and permissions
  const userRole = guild?.members?.find(member => member.user_id === currentUserId)?.role;
  const isOwner = userRole === 'owner';
  const isModerator = userRole === 'moderator';
  const isMember = userRole === 'member' || isModerator || isOwner;
  const canJoin = !isMember && guild?.guild_type === 'public';
  const canRequestJoin = !isMember && guild?.guild_type === 'approval';
  const canModerate = isOwner || isModerator;

  const handleJoin = useCallback(async () => {
    if (!canJoin || isJoining) return;
    
    setIsJoining(true);
    try {
      await joinMutation.mutateAsync();
    } finally {
      setIsJoining(false);
    }
  }, [canJoin, isJoining, joinMutation]);

  const handleLeave = useCallback(async () => {
    if (!isMember || isLeaving) return;
    
    if (confirm(translations.messages.confirmLeave)) {
      setIsLeaving(true);
      try {
        await leaveMutation.mutateAsync();
      } finally {
        setIsLeaving(false);
      }
    }
  }, [isMember, isLeaving, leaveMutation, translations.messages.confirmLeave]);

  const handleEdit = useCallback(() => {
    if (guild && isOwner) {
      onEdit?.(guild);
    }
  }, [guild, isOwner, onEdit]);

  const handleDelete = useCallback(() => {
    if (guild && isOwner) {
      if (confirm(translations.messages.confirmDelete)) {
        onDelete?.(guild);
      }
    }
  }, [guild, isOwner, onDelete, translations.messages.confirmDelete]);

  // Admin action handlers
  const handleRemoveUser = useCallback((userId: string, username: string) => {
    if (confirm(`Are you sure you want to remove ${username} from the guild?`)) {
      removeUserMutation.mutate(userId);
    }
  }, [removeUserMutation]);

  const handleBlockUser = useCallback((userId: string, username: string) => {
    if (confirm(`Are you sure you want to block ${username} from commenting?`)) {
      blockUserMutation.mutate(userId);
    }
  }, [blockUserMutation]);

  const handleUnblockUser = useCallback((userId: string, username: string) => {
    if (confirm(`Are you sure you want to unblock ${username}?`)) {
      unblockUserMutation.mutate(userId);
    }
  }, [unblockUserMutation]);

  const handleAssignModerator = useCallback((userId: string, username: string) => {
    if (confirm(`Are you sure you want to make ${username} a moderator?`)) {
      assignModeratorMutation.mutate(userId);
    }
  }, [assignModeratorMutation]);

  const handleRemoveModerator = useCallback((userId: string, username: string) => {
    if (confirm(`Are you sure you want to remove ${username} as a moderator?`)) {
      removeModeratorMutation.mutate(userId);
    }
  }, [removeModeratorMutation]);

  const getGuildInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{translations.details.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !guild) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error ? 'Failed to load guild details' : translations.details.notFound}
        </AlertDescription>
      </Alert>
    );
  }

  const renderGuildHeader = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <GuildAvatar 
              guildId={guild.guild_id}
              guildName={guild.name}
              avatarUrl={guild.avatar_url}
              size="lg"
              className="h-16 w-16"
            />

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{guild.name}</h1>
                {isOwner && <Crown className="h-5 w-5 text-yellow-500" />}
                {guild.guild_type === 'public' && (
                  <Globe className="h-5 w-5 text-green-500" />
                )}
                {guild.guild_type === 'private' && (
                  <Lock className="h-5 w-5 text-gray-500" />
                )}
                {guild.guild_type === 'approval' && (
                  <Shield className="h-5 w-5 text-blue-500" />
                )}
              </div>
              
              {guild.description && (
                <p className="text-gray-600 mb-2">{guild.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Created {formatDate(guild.created_at)}</span>
                <span>by {guild.owner_nickname || guild.owner_username || guild.created_by}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}

            {canJoin && (
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="inline-flex items-center gap-2"
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {translations.details.actions.join}
              </Button>
            )}

            {canRequestJoin && (
              <Button
                onClick={() => setShowJoinRequestForm(true)}
                className="inline-flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Request to Join
              </Button>
            )}

            {isMember && !isOwner && (
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={isLeaving}
                className="inline-flex items-center gap-2"
              >
                {isLeaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                {translations.details.actions.leave}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{guild.member_count}</span>
            </div>
            <p className="text-sm text-gray-600">{translations.details.stats.members}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{guild.goal_count}</span>
            </div>
            <p className="text-sm text-gray-600">{translations.details.stats.goals}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{guild.quest_count}</span>
            </div>
            <p className="text-sm text-gray-600">{translations.details.stats.quests}</p>
          </div>
        </div>

        {/* Tags */}
        {guild.tags && guild.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {guild.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Guild Avatar Display (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Guild Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <GuildAvatar 
              guildId={guild.guild_id}
              guildName={guild.name}
              avatarUrl={guild.avatar_url}
              size="xl"
              className="h-32 w-32"
            />
          </div>
          {isOwner && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Click "Edit" to change the avatar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Activity feed coming soon...</p>
        </CardContent>
      </Card>

      {/* Guild Rules/Info */}
      <Card>
        <CardHeader>
          <CardTitle>Guild Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Visibility:</span>
              <span className="font-medium">
                {guild.guild_type === 'public' ? 'Public' : 'Private'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">{formatDate(guild.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-medium">{guild.owner_nickname || guild.owner_username || guild.created_by}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMembersTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {translations.members.title} ({guild.member_count})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {guild.members && guild.members.length > 0 ? (
          <div className="space-y-3">
            {guild.members.map(member => {
              const isCurrentUser = member.user_id === currentUserId;
              const canManageUser = canModerate && !isCurrentUser && member.role !== 'owner';
              const isLoading = 
                removeUserMutation.isPending ||
                blockUserMutation.isPending ||
                unblockUserMutation.isPending ||
                assignModeratorMutation.isPending ||
                removeModeratorMutation.isPending;

              return (
                <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} alt={member.username} />
                      <AvatarFallback>
                        {member.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.username}</span>
                        {member.role === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                        {member.role === 'moderator' && <Shield className="h-4 w-4 text-blue-500" />}
                        {member.is_blocked && <Ban className="h-4 w-4 text-red-500" />}
                      </div>
                      <p className="text-sm text-gray-600">
                        Joined {formatDate(member.joined_at)}
                        {member.is_blocked && (
                          <span className="text-red-500 ml-2">(Blocked from commenting)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      member.role === 'owner' ? 'default' : 
                      member.role === 'moderator' ? 'secondary' : 
                      'outline'
                    }>
                      {member.role === 'owner' ? translations.members.role.owner : 
                       member.role === 'moderator' ? translations.members.role.moderator :
                       translations.members.role.member}
                    </Badge>
                    
                    {canManageUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={isLoading}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isOwner && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleAssignModerator(member.user_id, member.username)}
                                disabled={isLoading}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {member.role === 'moderator' ? 'Remove Moderator' : 'Make Moderator'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => 
                              member.is_blocked 
                                ? handleUnblockUser(member.user_id, member.username)
                                : handleBlockUser(member.user_id, member.username)
                            }
                            disabled={isLoading}
                          >
                            {member.is_blocked ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unblock User
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Block User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveUser(member.user_id, member.username)}
                            disabled={isLoading}
                            className="text-red-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove from Guild
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">{translations.members.empty}</p>
        )}
      </CardContent>
    </Card>
  );

  const renderGoalsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Goals ({guild.goal_count})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-center py-8">
          Guild goals will be displayed here. This feature is coming soon.
        </p>
      </CardContent>
    </Card>
  );

  const renderQuestsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Quests ({guild.quest_count})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-center py-8">
          Guild quests will be displayed here. This feature is coming soon.
        </p>
      </CardContent>
    </Card>
  );

  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Analytics...
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

    if (analyticsError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Analytics Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load analytics data: {analyticsError}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button 
                onClick={refreshAnalytics} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!analyticsData) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              No analytics data available for this guild.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <GuildAnalyticsCard
          data={analyticsData}
          variant="dashboard"
          showTrends={true}
          showDetailedMetrics={true}
          showLeaderboard={true}
          leaderboardLimit={5}
          className="w-full"
        />
        
        {/* Additional Analytics Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analytics Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={refreshAnalytics} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Refresh Data
              </Button>
              <div className="text-sm text-gray-600">
                Last updated: {analyticsData.lastUpdated ? 
                  new Date(analyticsData.lastUpdated).toLocaleString() : 
                  'Never'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCommentsTab = () => {
    // Check if current user is a member
    const isMember = guild?.members?.some(member => member.user_id === currentUserId) || false;
    const userRole = guild?.members?.find(member => member.user_id === currentUserId)?.role;

    return (
      <GuildComments
        guildId={guildId}
        currentUserId={currentUserId}
        isMember={isMember}
        userRole={userRole}
        className="w-full"
      />
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {renderGuildHeader()}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">{translations.details.tabs.overview}</TabsTrigger>
          <TabsTrigger value="members">{translations.details.tabs.members}</TabsTrigger>
          <TabsTrigger value="goals">{translations.details.tabs.goals}</TabsTrigger>
          <TabsTrigger value="quests">{translations.details.tabs.quests}</TabsTrigger>
          <TabsTrigger value="analytics">{translations.details.tabs.analytics}</TabsTrigger>
          <TabsTrigger value="comments">{translations.details.tabs.comments}</TabsTrigger>
          {canModerate && (
            <TabsTrigger value="joinRequests">
              <Shield className="h-4 w-4 mr-1" />
              Requests
            </TabsTrigger>
          )}
          {canModerate && (
            <TabsTrigger value="moderation">
              <Shield className="h-4 w-4 mr-1" />
              Moderation
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          {renderMembersTab()}
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          {renderGoalsTab()}
        </TabsContent>

        <TabsContent value="quests" className="mt-6">
          {renderQuestsTab()}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {renderAnalyticsTab()}
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          {renderCommentsTab()}
        </TabsContent>

        {canModerate && (
          <TabsContent value="joinRequests" className="mt-6">
            <GuildJoinRequests
              guildId={guildId}
              currentUserId={currentUserId || ''}
              userRole={userRole || 'member'}
              className="w-full"
              onGuildDataUpdate={() => {
                // Refresh guild data when join requests are approved/rejected
                queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
                // Also refresh analytics to update member count
                refreshAnalytics();
              }}
            />
          </TabsContent>
        )}

        {canModerate && (
          <TabsContent value="moderation" className="mt-6 space-y-6">
            <GuildModeration
              guildId={guildId}
              currentUserId={currentUserId || ''}
              userRole={userRole || 'member'}
              members={guild?.members || []}
              onMemberUpdate={() => {
                // Refetch guild data when members are updated
                queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
                // Also refresh analytics to update member count
                refreshAnalytics();
              }}
              className="w-full"
            />
            
            {isOwner && (
              <GuildOwnershipTransfer
                guildId={guildId}
                currentUserId={currentUserId || ''}
                members={guild?.members || []}
                onOwnershipTransferred={() => {
                  // Refetch guild data when ownership is transferred
                  queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
                  // Also refresh analytics to update member count
                  refreshAnalytics();
                }}
                className="w-full"
              />
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Join Request Form Dialog */}
      {showJoinRequestForm && guild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GuildJoinRequestForm
            guildId={guildId}
            guildName={guild.name}
            onSuccess={() => {
              setShowJoinRequestForm(false);
              toast.success('Join request sent successfully!');
            }}
            onCancel={() => setShowJoinRequestForm(false)}
          />
        </div>
      )}
    </div>
  );
};
