/**
 * GuildMemberManagement Component
 *
 * A comprehensive component for managing guild members including
 * viewing, promoting, demoting, and removing members.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Crown, Shield, User, MoreVertical, Trash2, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { guildAPI, GuildMember } from '@/lib/api/guild';
import { toast } from 'sonner';

interface GuildMemberManagementProps {
  guildId: string;
  currentUserId?: string;
  isOwner?: boolean;
  isModerator?: boolean;
}

interface MemberActionDialogProps {
  member: GuildMember;
  action: 'remove' | 'promote' | 'demote';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MemberActionDialog: React.FC<MemberActionDialogProps> = ({
  member,
  action,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const guildTranslations = t.guild;

  const getActionDetails = () => {
    switch (action) {
      case 'remove':
        return {
          title: guildTranslations?.memberManagement?.removeMember || 'Remove Member',
          description: guildTranslations?.memberManagement?.removeMemberDesc || `Are you sure you want to remove ${member.username} from this guild?`,
          confirmText: guildTranslations?.memberManagement?.remove || 'Remove',
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          variant: 'destructive' as const,
        };
      case 'promote':
        return {
          title: guildTranslations?.memberManagement?.promoteModerator || 'Promote to Moderator',
          description: guildTranslations?.memberManagement?.promoteModeratorDesc || `Are you sure you want to promote ${member.username} to moderator?`,
          confirmText: guildTranslations?.memberManagement?.promote || 'Promote',
          icon: <Shield className="h-5 w-5 text-blue-500" />,
          variant: 'default' as const,
        };
      case 'demote':
        return {
          title: guildTranslations?.memberManagement?.demoteModerator || 'Demote Moderator',
          description: guildTranslations?.memberManagement?.demoteModeratorDesc || `Are you sure you want to demote ${member.username} from moderator?`,
          confirmText: guildTranslations?.memberManagement?.demote || 'Demote',
          icon: <User className="h-5 w-5 text-gray-500" />,
          variant: 'default' as const,
        };
      default:
        return {
          title: '',
          description: '',
          confirmText: '',
          icon: null,
          variant: 'default' as const,
        };
    }
  };

  const actionDetails = getActionDetails();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {actionDetails.icon}
            {actionDetails.title}
          </DialogTitle>
          <DialogDescription>
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {guildTranslations?.memberManagement?.cancel || 'Cancel'}
          </Button>
          <Button
            variant={actionDetails.variant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {actionDetails.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const GuildMemberManagement: React.FC<GuildMemberManagementProps> = ({
  guildId,
  currentUserId,
  isOwner = false,
  isModerator = false,
}) => {
  const { t } = useTranslation();
  const guildTranslations = t.guild;
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<GuildMember | null>(null);
  const [action, setAction] = useState<'remove' | 'promote' | 'demote' | null>(null);

  // Fetch guild members
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ['guild-members', guildId],
    queryFn: () => guildAPI.getGuildMembers(guildId),
    enabled: !!guildId,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.removeUserFromGuild(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild-members', guildId] });
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success(guildTranslations?.memberManagement?.memberRemoved || 'Member removed successfully');
      setSelectedMember(null);
      setAction(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || guildTranslations?.memberManagement?.error || 'Failed to remove member');
    },
  });

  // Promote member mutation
  const promoteMemberMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.assignModerator(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild-members', guildId] });
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success(guildTranslations?.memberManagement?.memberPromoted || 'Member promoted successfully');
      setSelectedMember(null);
      setAction(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || guildTranslations?.memberManagement?.error || 'Failed to promote member');
    },
  });

  // Demote member mutation
  const demoteMemberMutation = useMutation({
    mutationFn: (userId: string) => guildAPI.removeModerator(guildId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild-members', guildId] });
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      toast.success(guildTranslations?.memberManagement?.memberDemoted || 'Member demoted successfully');
      setSelectedMember(null);
      setAction(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || guildTranslations?.memberManagement?.error || 'Failed to demote member');
    },
  });

  const handleAction = (member: GuildMember, actionType: 'remove' | 'promote' | 'demote') => {
    setSelectedMember(member);
    setAction(actionType);
  };

  const handleConfirmAction = () => {
    if (!selectedMember || !action) return;

    switch (action) {
      case 'remove':
        removeMemberMutation.mutate(selectedMember.user_id);
        break;
      case 'promote':
        promoteMemberMutation.mutate(selectedMember.user_id);
        break;
      case 'demote':
        demoteMemberMutation.mutate(selectedMember.user_id);
        break;
    }
  };

  const handleCancelAction = () => {
    setSelectedMember(null);
    setAction(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const canManageMember = (member: GuildMember) => {
    if (!isOwner && !isModerator) return false;
    if (member.user_id === currentUserId) return false; // Can't manage yourself
    if (member.role === 'owner') return false; // Can't manage owner
    if (isModerator && member.role === 'moderator') return false; // Moderators can't manage other moderators
    return true;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoadingMembers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {guildTranslations?.memberManagement?.title || 'Member Management'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{guildTranslations?.memberManagement?.loading || 'Loading members...'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (membersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {guildTranslations?.memberManagement?.title || 'Member Management'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {guildTranslations?.memberManagement?.error || 'Failed to load members'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const members = membersData?.members || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {guildTranslations?.memberManagement?.title || 'Member Management'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {guildTranslations?.memberManagement?.subtitle || 'Manage guild members and their roles'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{guildTranslations?.memberManagement?.noMembers || 'No members found'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} alt={member.username} />
                      <AvatarFallback>
                        {member.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{member.username}</span>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {guildTranslations?.memberManagement?.joinedOn || 'Joined on'} {formatDate(member.joined_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageMember(member) && (
                      <>
                        {member.role === 'member' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(member, 'promote')}
                            disabled={promoteMemberMutation.isPending}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            {guildTranslations?.memberManagement?.promote || 'Promote'}
                          </Button>
                        )}
                        {member.role === 'moderator' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(member, 'demote')}
                            disabled={demoteMemberMutation.isPending}
                          >
                            <User className="h-4 w-4 mr-1" />
                            {guildTranslations?.memberManagement?.demote || 'Demote'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(member, 'remove')}
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {guildTranslations?.memberManagement?.remove || 'Remove'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Confirmation Dialog */}
        {selectedMember && action && (
          <MemberActionDialog
            member={selectedMember}
            action={action}
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
            isLoading={
              removeMemberMutation.isPending ||
              promoteMemberMutation.isPending ||
              demoteMemberMutation.isPending
            }
          />
        )}
      </CardContent>
    </Card>
  );
};

export default GuildMemberManagement;
