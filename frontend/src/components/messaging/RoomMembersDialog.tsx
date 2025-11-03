/**
 * Room Members Dialog Component
 * Displays a list of members in a chat room
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { Users, AlertCircle, Crown, Shield, Hash } from 'lucide-react';
import { getRoomMembers, type RoomMember } from '@/lib/api/messaging';
import { getGuildMembers, type GuildMember } from '@/lib/api/guild';

interface RoomMembersDialogProps {
  roomId: string;
  roomName?: string;
  roomType?: 'general' | 'guild';
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export function RoomMembersDialog({
  roomId,
  roomName,
  roomType = 'general',
  isOpen,
  onClose,
  currentUserId
}: RoomMembersDialogProps) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !roomId) return;

    let mounted = true;
    
    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let roomMembers: RoomMember[] = [];
        
        // For guild rooms, fetch from guild API
        if (roomType === 'guild' && roomId.startsWith('GUILD#')) {
          // Extract guild ID: GUILD#guild_xxx -> guild_xxx
          const guildId = roomId.replace('GUILD#', '');
          try {
            const guildMembersResponse = await getGuildMembers(guildId, 100);
            // Transform GuildMember to RoomMember
            roomMembers = (guildMembersResponse.members || []).map((gm: GuildMember): RoomMember => ({
              userId: gm.user_id,
              username: gm.username,
              avatarUrl: gm.avatar_url || undefined,
              isOnline: false, // Guild API doesn't provide online status
              joinedAt: gm.joined_at,
              role: gm.role
            }));
          } catch (guildErr) {
            console.warn('Failed to fetch guild members, falling back to room members API:', guildErr);
            // Fallback to room members API
            roomMembers = await getRoomMembers(roomId);
          }
        } else {
          // For general rooms, use room members API
          roomMembers = await getRoomMembers(roomId);
        }
        
        if (!mounted) return;
        setMembers(roomMembers);
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching room members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room members');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchMembers();
    
    return () => {
      mounted = false;
    };
  }, [isOpen, roomId, roomType]);

  const getUserInitials = (username: string): string => {
    if (!username) return '?';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <Hash className="h-3 w-3 text-gray-400" />;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="default" className="text-xs">Owner</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs">Moderator</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Room Members
          </DialogTitle>
          <DialogDescription>
            {roomName || roomId}
            {members.length > 0 && ` • ${members.length} ${members.length === 1 ? 'member' : 'members'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && members.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No members found</p>
            </div>
          )}

          {!isLoading && !error && members.length > 0 && (
            <div className="space-y-2">
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                
                return (
                  <div
                    key={member.userId}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isCurrentUser 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={member.avatarUrl || undefined} 
                          alt={member.username} 
                        />
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                          {getUserInitials(member.username)}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${isCurrentUser ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                          {member.username}
                          {isCurrentUser && ' (You)'}
                        </span>
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(member.role)}
                        {member.isOnline !== undefined && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {member.isOnline ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

