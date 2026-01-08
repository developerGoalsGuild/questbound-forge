/**
 * GuildModeration Component
 *
 * A component for managing guild moderation actions including blocking users,
 * removing comments, and managing comment permissions.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  UserX,
  UserCheck,
  MessageSquareX,
  MessageSquare,
  Loader2,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { guildAPI, GuildMember, ModerationAction } from '@/lib/api/guild';
import { getGuildTranslations } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildModerationProps {
  guildId: string;
  currentUserId: string;
  userRole: 'owner' | 'moderator' | 'member';
  members: GuildMember[];
  onMemberUpdate?: () => void;
  className?: string;
}

interface ModerationDialogProps {
  member: GuildMember;
  action: 'block' | 'unblock' | 'toggle_comment';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isProcessing: boolean;
}

const ModerationDialog: React.FC<ModerationDialogProps> = ({
  member,
  action,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}) => {
  const { t, language } = useTranslation();
  const translations = getGuildTranslations(language);
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  const handleSubmit = useCallback(() => {
    const finalReason = reason.trim() || selectedReason || undefined;
    onConfirm(finalReason);
    setReason('');
    setSelectedReason('');
  }, [reason, selectedReason, onConfirm]);

  const handleClose = useCallback(() => {
    setReason('');
    setSelectedReason('');
    onClose();
  }, [onClose]);

  const getActionInfo = () => {
    switch (action) {
      case 'block':
        return {
          title: 'Block User',
          description: `Block ${member.username} from accessing the guild`,
          icon: <UserX className="h-5 w-5 text-red-500" />,
          confirmText: 'Block User',
          confirmVariant: 'destructive' as const,
        };
      case 'unblock':
        return {
          title: 'Unblock User',
          description: `Unblock ${member.username} and restore guild access`,
          icon: <UserCheck className="h-5 w-5 text-green-500" />,
          confirmText: 'Unblock User',
          confirmVariant: 'default' as const,
        };
      case 'toggle_comment':
        return {
          title: member.canComment ? 'Disable Comments' : 'Enable Comments',
          description: `${member.canComment ? 'Disable' : 'Enable'} commenting for ${member.username}`,
          icon: member.canComment ? 
            <MessageSquareX className="h-5 w-5 text-orange-500" /> : 
            <MessageSquare className="h-5 w-5 text-green-500" />,
          confirmText: member.canComment ? 'Disable Comments' : 'Enable Comments',
          confirmVariant: member.canComment ? 'destructive' as const : 'default' as const,
        };
    }
  };

  const actionInfo = getActionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {actionInfo.icon}
            {actionInfo.title}
          </DialogTitle>
          <DialogDescription>
            {actionInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatarUrl} alt={member.username} />
              <AvatarFallback>
                {member.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.username}</p>
              <Badge variant="outline" className="text-xs">
                {member.role}
              </Badge>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">{translations.moderation.reasons.spam}</SelectItem>
                <SelectItem value="inappropriate">{translations.moderation.reasons.inappropriate}</SelectItem>
                <SelectItem value="harassment">{translations.moderation.reasons.harassment}</SelectItem>
                <SelectItem value="other">{translations.moderation.reasons.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="custom-reason">Custom reason (optional)</Label>
            <Textarea
              id="custom-reason"
              placeholder="Add additional details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant={actionInfo.confirmVariant}
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {actionInfo.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const GuildModeration: React.FC<GuildModerationProps> = ({
  guildId,
  currentUserId,
  userRole,
  members,
  onMemberUpdate,
  className,
}) => {
  const { t, language } = useTranslation();
  const translations = getGuildTranslations(language);
  
  const [selectedMember, setSelectedMember] = useState<GuildMember | null>(null);
  const [moderationAction, setModerationAction] = useState<'block' | 'unblock' | 'toggle_comment' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const canModerate = userRole === 'owner' || userRole === 'moderator';
  const moderatableMembers = members.filter(member => 
    member.userId !== currentUserId && 
    member.role !== 'owner' &&
    (userRole === 'owner' || member.role !== 'moderator')
  );

  const handleModerationAction = useCallback(async (reason?: string) => {
    if (!selectedMember || !moderationAction) return;

    try {
      setProcessing(true);
      
      let action: ModerationAction;
      
      switch (moderationAction) {
        case 'block':
          action = {
            action: 'block_user',
            targetUserId: selectedMember.userId,
            reason,
          };
          break;
        case 'unblock':
          action = {
            action: 'unblock_user',
            targetUserId: selectedMember.userId,
            reason,
          };
          break;
        case 'toggle_comment':
          action = {
            action: 'toggle_comment_permission',
            targetUserId: selectedMember.userId,
            reason,
          };
          break;
        default:
          throw new Error('Invalid moderation action');
      }

      await guildAPI.performModerationAction(guildId, action);
      
      const actionText = moderationAction === 'block' ? 'blocked' : 
                        moderationAction === 'unblock' ? 'unblocked' : 
                        'comment permission updated';
      
      toast.success(`User ${actionText} successfully`);
      onMemberUpdate?.();
      
      setIsDialogOpen(false);
      setSelectedMember(null);
      setModerationAction(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to perform moderation action');
    } finally {
      setProcessing(false);
    }
  }, [guildId, selectedMember, moderationAction, onMemberUpdate]);

  const openModerationDialog = useCallback((member: GuildMember, action: 'block' | 'unblock' | 'toggle_comment') => {
    setSelectedMember(member);
    setModerationAction(action);
    setIsDialogOpen(true);
  }, []);

  if (!canModerate) {
    return null;
  }

  return (
    <>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            {translations.moderation.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moderatableMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members available for moderation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {moderatableMembers.filter(member => member && member.userId).map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl} alt={member.username} />
                    <AvatarFallback>
                      {member.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.username}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      {member.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          Blocked
                        </Badge>
                      )}
                      {member.canComment === false && (
                        <Badge variant="secondary" className="text-xs">
                          No Comments
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {member.isBlocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModerationDialog(member, 'unblock')}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModerationDialog(member, 'block')}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModerationDialog(member, 'toggle_comment')}
                    >
                      {member.canComment === false ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <MessageSquareX className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMember && moderationAction && (
        <ModerationDialog
          member={selectedMember}
          action={moderationAction}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedMember(null);
            setModerationAction(null);
          }}
          onConfirm={handleModerationAction}
          isProcessing={processing}
        />
      )}
    </>
  );
};

