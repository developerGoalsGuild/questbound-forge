/**
 * Component for displaying and managing collaboration invites.
 * 
 * This component shows a list of received invites with options to accept or decline them.
 */

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Mail, 
  Check, 
  X, 
  Clock, 
  User, 
  Target,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  listInvitesForUser, 
  acceptInvite, 
  declineInvite,
  Invite,
  CollaborationAPIError 
} from '../../lib/api/collaborations';
import { useToast } from '../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface InvitesListProps {
  className?: string;
}

export const InvitesList: React.FC<InvitesListProps> = ({ className }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set());

  // Get translations with safety checks
  const invitesTranslations = (t as any)?.invites;

  // Query for invites
  const {
    data: invites = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-invites'],
    queryFn: listInvitesForUser,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Ensure invites is always an array
  const invitesList = Array.isArray(invites) ? invites : [];

  // Accept invite mutation
  const acceptMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: (inviteId) => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(inviteId);
        return newSet;
      });
      toast({
        title: invitesTranslations?.acceptSuccess?.title || 'Invite Accepted',
        description: invitesTranslations?.acceptSuccess?.description || 'You have successfully accepted the collaboration invite.',
      });
    },
    onError: (error: CollaborationAPIError) => {
      toast({
        title: invitesTranslations?.acceptError?.title || 'Failed to Accept Invite',
        description: error.message || invitesTranslations?.acceptError?.description || 'There was an error accepting the invite.',
        variant: 'destructive',
      });
    },
  });

  // Decline invite mutation
  const declineMutation = useMutation({
    mutationFn: declineInvite,
    onSuccess: (inviteId) => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(inviteId);
        return newSet;
      });
      toast({
        title: invitesTranslations?.declineSuccess?.title || 'Invite Declined',
        description: invitesTranslations?.declineSuccess?.description || 'You have declined the collaboration invite.',
      });
    },
    onError: (error: CollaborationAPIError) => {
      toast({
        title: invitesTranslations?.declineError?.title || 'Failed to Decline Invite',
        description: error.message || invitesTranslations?.declineError?.description || 'There was an error declining the invite.',
        variant: 'destructive',
      });
    },
  });

  const handleAccept = async (inviteId: string) => {
    setProcessingInvites(prev => new Set(prev).add(inviteId));
    acceptMutation.mutate(inviteId);
  };

  const handleDecline = async (inviteId: string) => {
    setProcessingInvites(prev => new Set(prev).add(inviteId));
    declineMutation.mutate(inviteId);
  };

  const getResourceTypeIcon = (resourceType?: string) => {
    if (!resourceType) return FileText;
    switch (resourceType.toLowerCase()) {
      case 'goal':
        return Target;
      case 'quest':
        return Target;
      case 'task':
        return FileText;
      default:
        return FileText;
    }
  };

  const getResourceTypeLabel = (resourceType?: string) => {
    if (!resourceType) return 'Unknown';
    return invitesTranslations?.resourceTypes?.[resourceType.toLowerCase()] || resourceType;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            {invitesTranslations?.loading || 'Loading invites...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {invitesTranslations?.errorTitle || 'Failed to Load Invites'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {invitesTranslations?.errorDescription || 'There was an error loading your collaboration invites.'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {invitesTranslations?.retry || 'Try Again'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitesList.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {invitesTranslations?.emptyTitle || 'No Invites'}
              </h3>
              <p className="text-muted-foreground">
                {invitesTranslations?.emptyDescription || 'You don\'t have any collaboration invites at the moment.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {invitesTranslations?.title || 'Collaboration Invites'}
          </h2>
          <p className="text-muted-foreground">
            {invitesTranslations?.subtitle || 'Manage your collaboration invitations'}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {invitesTranslations?.refresh || 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4">
        {invitesList.map((invite) => {
          const ResourceIcon = getResourceTypeIcon(invite?.resource_type);
          const isProcessing = processingInvites.has(invite?.invite_id || '');
          
          return (
            <Card key={invite?.invite_id || 'unknown'} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {invite?.inviter_username || 'Unknown User'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {invitesTranslations?.invitedYou || 'invited you to collaborate on'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {invite?.created_at ? formatDistanceToNow(new Date(invite.created_at), { addSuffix: true }) : 'Unknown time'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Resource Info */}
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {getResourceTypeLabel(invite?.resource_type)}: {invite?.resource_title || 'Unknown Resource'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invite?.message || invitesTranslations?.noMessage || 'No message provided'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      onClick={() => invite?.invite_id && handleDecline(invite.invite_id)}
                      variant="outline"
                      size="sm"
                      disabled={isProcessing || !invite?.invite_id}
                      className="text-destructive hover:text-destructive"
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      {invitesTranslations?.decline || 'Decline'}
                    </Button>
                    <Button
                      onClick={() => invite?.invite_id && handleAccept(invite.invite_id)}
                      size="sm"
                      disabled={isProcessing || !invite?.invite_id}
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {invitesTranslations?.accept || 'Accept'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InvitesList;
