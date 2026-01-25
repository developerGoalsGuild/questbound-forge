/**
 * GuildOwnershipTransfer Component
 *
 * A component for transferring guild ownership to another member.
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
  Crown,
  AlertTriangle,
  Loader2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { guildAPI, GuildMember } from '@/lib/api/guild';
import { getGuildTranslations } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildOwnershipTransferProps {
  guildId: string;
  currentUserId: string;
  members: GuildMember[];
  onOwnershipTransferred?: () => void;
  className?: string;
}

export const GuildOwnershipTransfer: React.FC<GuildOwnershipTransferProps> = ({
  guildId,
  currentUserId,
  members,
  onOwnershipTransferred,
  className,
}) => {
  const { t, language } = useTranslation();
  const translations = getGuildTranslations(language);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const eligibleMembers = members.filter(member => 
    member.userId !== currentUserId && 
    member.role !== 'owner'
  );

  const selectedMember = members.find(member => member.userId === selectedMemberId);

  const handleTransfer = useCallback(async () => {
    if (!selectedMemberId) {
      toast.error('Please select a member to transfer ownership to');
      return;
    }

    try {
      setIsProcessing(true);
      
      await guildAPI.transferGuildOwnership(
        guildId, 
        selectedMemberId, 
        reason.trim() || undefined
      );
      
      toast.success(translations.ownership.transfer.success);
      onOwnershipTransferred?.();
      
      setIsDialogOpen(false);
      setSelectedMemberId('');
      setReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer ownership');
    } finally {
      setIsProcessing(false);
    }
  }, [guildId, selectedMemberId, reason, translations, onOwnershipTransferred]);

  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    if (!isProcessing) {
      setIsDialogOpen(false);
      setSelectedMemberId('');
      setReason('');
    }
  }, [isProcessing]);

  if (eligibleMembers.length === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {translations.ownership.transfer.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">{translations.ownership.transfer.warningTitle || 'Transfer Ownership'}</p>
                <p>{translations.ownership.transfer.warningMessage || 'This action cannot be undone. You will become a regular member.'}</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleOpenDialog}
              className="w-full"
            >
              <Crown className="h-4 w-4 mr-2" />
              {translations.ownership.transfer.title || 'Transfer Guild Ownership'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {translations.ownership.transfer.title}
            </DialogTitle>
            <DialogDescription>
              {translations.ownership.transfer.selectNewOwner}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-owner">{translations.ownership.transfer.selectNewOwner}</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.ownership.transfer.selectMember || 'Select a member'} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.filter(member => member && member.userId).map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatarUrl} alt={member.username} />
                          <AvatarFallback className="text-xs">
                            {member.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMember && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedMember.avatarUrl} alt={selectedMember.username} />
                  <AvatarFallback>
                    {selectedMember.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember.username}</p>
                  <Badge variant="outline" className="text-xs">
                    {selectedMember.role}
                  </Badge>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason">{translations.ownership.transfer.reason}</Label>
              <Textarea
                id="reason"
                placeholder={translations.ownership.transfer.reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
            <div className="text-xs text-gray-500 text-right mt-1">
              {reason.length}/500 {translations.ownership.transfer.characters || 'characters'}
            </div>
          </div>

            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="text-sm text-red-800">
                <p className="font-medium">{translations.ownership.transfer.finalWarning || 'Warning'}</p>
                <p>{translations.ownership.transfer.finalWarningMessage || 'This action cannot be undone. You will lose ownership privileges.'}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog} disabled={isProcessing}>
              {translations.ownership.transfer.cancel || 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleTransfer}
              disabled={isProcessing || !selectedMemberId}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {translations.ownership.transfer.confirming}
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  {translations.ownership.transfer.confirm}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

