/**
 * Room Settings Dialog Component
 * Displays and allows editing of chat room settings
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Settings, AlertCircle, Loader2, Hash, Shield, CheckCircle2 } from 'lucide-react';
import { getRoomInfo, updateRoomSettings } from '@/lib/api/messaging';
import { type RoomInfo } from '@/types/messaging';
import { useToast } from '@/hooks/use-toast';

interface RoomSettingsDialogProps {
  roomId: string;
  roomName?: string;
  roomType?: 'general' | 'guild';
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

interface RoomSettings {
  name: string;
  description?: string;
  isPublic: boolean;
  allowFileUploads?: boolean;
  allowReactions?: boolean;
  maxMessageLength?: number;
}

export function RoomSettingsDialog({
  roomId,
  roomName,
  roomType = 'general',
  isOpen,
  onClose,
  onSettingsUpdated
}: RoomSettingsDialogProps) {
  const [settings, setSettings] = useState<RoomSettings>({
    name: roomName || '',
    description: '',
    isPublic: true,
    allowFileUploads: false,
    allowReactions: true,
    maxMessageLength: 2000
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !roomId) return;

    let mounted = true;
    
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const info = await getRoomInfo(roomId);
        if (!mounted) return;
        
        console.log('Room info fetched:', info); // Debug log
        setRoomInfo(info);
        
        // Extract settings from room info
        // Handle both normalized (roomName) and raw (name) formats
        const anyInfo = info as any;
        
        // Determine if it's a general room or guild room
        const isGeneralRoom = 'roomName' in info || (anyInfo.id && !anyInfo.guildId);
        
        if (isGeneralRoom) {
          // General room - use normalized or raw fields
          const roomNameValue = anyInfo.roomName || anyInfo.name || roomName || '';
          const descriptionValue = anyInfo.description || '';
          
          console.log('Setting general room settings:', {
            roomNameValue,
            descriptionValue,
            isPublic: anyInfo.isPublic !== undefined ? anyInfo.isPublic : (anyInfo.is_public !== undefined ? anyInfo.is_public : true),
            allowFileUploads: anyInfo.allowFileUploads !== undefined ? anyInfo.allowFileUploads : (anyInfo.allow_file_uploads !== undefined ? anyInfo.allow_file_uploads : false),
            allowReactions: anyInfo.allowReactions !== undefined ? anyInfo.allowReactions : (anyInfo.allow_reactions !== undefined ? anyInfo.allow_reactions : true),
            maxMessageLength: anyInfo.maxMessageLength || anyInfo.max_message_length || 2000
          });
          
          setSettings({
            name: roomNameValue,
            description: descriptionValue,
            isPublic: anyInfo.isPublic !== undefined ? anyInfo.isPublic : (anyInfo.is_public !== undefined ? anyInfo.is_public : true),
            allowFileUploads: anyInfo.allowFileUploads !== undefined ? anyInfo.allowFileUploads : (anyInfo.allow_file_uploads !== undefined ? anyInfo.allow_file_uploads : false),
            allowReactions: anyInfo.allowReactions !== undefined ? anyInfo.allowReactions : (anyInfo.allow_reactions !== undefined ? anyInfo.allow_reactions : true),
            maxMessageLength: anyInfo.maxMessageLength || anyInfo.max_message_length || 2000
          });
        } else if ('guildName' in info) {
          // Guild room - settings are limited
          setSettings({
            name: anyInfo.guildName || anyInfo.name || roomName || '',
            description: '', // Guild rooms don't have descriptions
            isPublic: true, // Guild rooms are always public to members
            allowFileUploads: anyInfo.allowFileUploads !== undefined ? anyInfo.allowFileUploads : (anyInfo.allow_file_uploads !== undefined ? anyInfo.allow_file_uploads : false),
            allowReactions: anyInfo.allowReactions !== undefined ? anyInfo.allowReactions : (anyInfo.allow_reactions !== undefined ? anyInfo.allow_reactions : true),
            maxMessageLength: anyInfo.maxMessageLength || anyInfo.max_message_length || 2000
          });
        } else {
          // Fallback: use provided roomName or API response
          setSettings({
            name: anyInfo.name || anyInfo.roomName || roomName || '',
            description: anyInfo.description || '',
            isPublic: anyInfo.isPublic !== undefined ? anyInfo.isPublic : (anyInfo.is_public !== undefined ? anyInfo.is_public : true),
            allowFileUploads: anyInfo.allowFileUploads !== undefined ? anyInfo.allowFileUploads : (anyInfo.allow_file_uploads !== undefined ? anyInfo.allow_file_uploads : false),
            allowReactions: anyInfo.allowReactions !== undefined ? anyInfo.allowReactions : (anyInfo.allow_reactions !== undefined ? anyInfo.allow_reactions : true),
            maxMessageLength: anyInfo.maxMessageLength || anyInfo.max_message_length || 2000
          });
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching room settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room settings');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchSettings();
    
    return () => {
      mounted = false;
    };
  }, [isOpen, roomId, roomName]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await updateRoomSettings(roomId, settings);
      
      // Show success notification
      toast({
        title: "Settings saved",
        description: "Room settings have been updated successfully.",
        variant: "default",
      });
      
      // Trigger custom event to refresh room info in hooks
      window.dispatchEvent(new CustomEvent('room:settingsUpdated', { detail: { roomId } }));
      
      onSettingsUpdated?.();
      onClose();
    } catch (err) {
      console.error('Error updating room settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room settings';
      setError(errorMessage);
      
      // Show error notification
      toast({
        title: "Error saving settings",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof RoomSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) {
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Room Settings
          </DialogTitle>
          <DialogDescription>
            Configure settings for {roomName || roomId}
            {roomType === 'guild' && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Guild Room
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  value={settings.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Enter room name"
                  disabled={roomType === 'guild'}
                />
                {roomType === 'guild' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Guild room names are managed by guild settings
                  </p>
                )}
              </div>

              {roomType === 'general' && (
                <div className="space-y-2">
                  <Label htmlFor="room-description">Description</Label>
                  <Textarea
                    id="room-description"
                    value={settings.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Enter room description"
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="room-public">Public Room</Label>
                  <Switch
                    id="room-public"
                    checked={settings.isPublic}
                    onCheckedChange={(checked) => handleFieldChange('isPublic', checked)}
                    disabled={roomType === 'guild'}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {settings.isPublic 
                    ? 'Anyone can join this room' 
                    : 'Only invited members can join this room'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="room-reactions">Allow Reactions</Label>
                  <Switch
                    id="room-reactions"
                    checked={settings.allowReactions !== false}
                    onCheckedChange={(checked) => handleFieldChange('allowReactions', checked)}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users to react to messages with emojis
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-length">Max Message Length</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={settings.maxMessageLength || 2000}
                  onChange={(e) => handleFieldChange('maxMessageLength', parseInt(e.target.value) || 2000)}
                  min={100}
                  max={10000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Maximum characters allowed per message (100 - 10,000)
                </p>
              </div>

              {roomInfo && 'memberCount' in roomInfo && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Active Members</span>
                    <Badge variant="outline">{roomInfo.memberCount || 0}</Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading || !settings.name.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

