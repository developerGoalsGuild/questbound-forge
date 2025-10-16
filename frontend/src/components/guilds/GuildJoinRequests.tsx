/**
 * GuildJoinRequests Component
 *
 * A component for managing guild join requests, allowing owners and moderators
 * to approve or reject pending requests.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { guildAPI, GuildJoinRequest } from '@/lib/api/guild';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildJoinRequestsProps {
  guildId: string;
  currentUserId: string;
  userRole: 'owner' | 'moderator' | 'member';
  className?: string;
}

interface ApprovalDialogProps {
  request: GuildJoinRequest;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (reason?: string) => void;
  onReject: (reason?: string) => void;
  isProcessing: boolean;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = useCallback(() => {
    if (action === 'approve') {
      onApprove(reason || undefined);
    } else if (action === 'reject') {
      onReject(reason || undefined);
    }
    setReason('');
    setAction(null);
  }, [action, reason, onApprove, onReject]);

  const handleClose = useCallback(() => {
    setReason('');
    setAction(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{guildTranslations?.joinRequests?.reviewTitle || 'Review Join Request'}</DialogTitle>
          <DialogDescription>
            {guildTranslations?.joinRequests?.reviewDescription || 'Review the join request from'} {request.username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.avatarUrl} alt={request.username} />
              <AvatarFallback>
                {request.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.username}</p>
              <p className="text-sm text-gray-500">
                {guildTranslations?.joinRequests?.requested || 'Requested'} {formatDistanceToNow(new Date(request.requestedAt))} {guildTranslations?.analytics?.daysAgo || 'ago'}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">{guildTranslations?.joinRequests?.reasonLabel || 'Reason (optional)'}</Label>
            <Textarea
              id="reason"
              placeholder={guildTranslations?.joinRequests?.reasonPlaceholder || 'Add a reason for your decision...'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setAction('reject');
              handleSubmit();
            }}
            disabled={isProcessing}
          >
            {isProcessing && action === 'reject' && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            <XCircle className="h-4 w-4 mr-2" />
            {guildTranslations?.joinRequests?.actions?.reject || 'Reject'}
          </Button>
          <Button
            onClick={() => {
              setAction('approve');
              handleSubmit();
            }}
            disabled={isProcessing}
          >
            {isProcessing && action === 'approve' && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            <CheckCircle className="h-4 w-4 mr-2" />
            {guildTranslations?.joinRequests?.actions?.approve || 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const GuildJoinRequests: React.FC<GuildJoinRequestsProps> = ({
  guildId,
  currentUserId,
  userRole,
  className,
}) => {
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  
  const [requests, setRequests] = useState<GuildJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<GuildJoinRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const canModerate = userRole === 'owner' || userRole === 'moderator';

  const fetchRequests = useCallback(async () => {
    if (!canModerate) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await guildAPI.getGuildJoinRequests(guildId);
      setRequests(response.requests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch join requests');
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  }, [guildId, canModerate]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = useCallback(async (reason?: string) => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await guildAPI.approveJoinRequest(guildId, selectedRequest.userId, reason);
      toast.success('Join request approved');
      setRequests(prev => prev.filter(req => req.userId !== selectedRequest.userId));
      setIsDialogOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  }, [guildId, selectedRequest]);

  const handleReject = useCallback(async (reason?: string) => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await guildAPI.rejectJoinRequest(guildId, selectedRequest.userId, reason);
      toast.success('Join request rejected');
      setRequests(prev => prev.filter(req => req.userId !== selectedRequest.userId));
      setIsDialogOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  }, [guildId, selectedRequest]);

  const handleRequestClick = useCallback((request: GuildJoinRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  }, []);

  if (!canModerate) {
    return null;
  }

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {guildTranslations?.joinRequests?.title || 'Join Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
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
            <User className="h-5 w-5" />
            {guildTranslations?.joinRequests?.title || 'Join Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {guildTranslations?.joinRequests?.title || 'Join Requests'}
            {requests.length > 0 && (
              <Badge variant="secondary">{requests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{guildTranslations?.joinRequests?.empty || 'No pending join requests'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.userId}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRequestClick(request)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.avatarUrl} alt={request.username} />
                    <AvatarFallback>
                      {request.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.username}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(request.requestedAt))} ago
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {guildTranslations?.joinRequests?.status?.pending || 'Pending'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestClick(request);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        request={selectedRequest!}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedRequest(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={processing}
      />
    </>
  );
};
