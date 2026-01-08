/**
 * GuildEditForm Component
 *
 * A comprehensive form for editing guild details including basic information,
 * settings, and member management.
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X, Plus, Trash2, Crown, Shield, User, Settings, Users, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Guild, GuildUpdateInput, uploadGuildAvatar } from '@/lib/api/guild';
import { GuildAvatar } from './GuildAvatar';
import { GuildMemberManagement } from './GuildMemberManagement';
import { AvatarUpload } from './AvatarUpload';

// Validation schema
const guildEditSchema = z.object({
  name: z.string().min(1, 'Guild name is required').max(50, 'Guild name must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  guild_type: z.enum(['public', 'private', 'approval']),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  settings: z.object({
    allow_join_requests: z.boolean(),
    require_approval: z.boolean(),
    allow_comments: z.boolean(),
  }),
});

type GuildEditFormData = z.infer<typeof guildEditSchema>;

interface GuildEditFormProps {
  guild: Guild;
  onSave: (data: GuildUpdateInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  currentUserId?: string;
}

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange, maxTags = 10 }) => {
  const [inputValue, setInputValue] = useState('');
  const { t } = useTranslation();
  const guildTranslations = t.guild;

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      
      if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
        onTagsChange([...tags, newTag]);
        setInputValue('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="tags">Tags</Label>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {tags.length < maxTags && (
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder={guildTranslations?.edit?.addTag || 'Add tag...'}
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px]"
          />
        )}
      </div>
      <p className="text-xs text-gray-500">
        {guildTranslations?.edit?.tagsHelp || 'Press Enter or comma to add tags. Maximum 10 tags.'}
      </p>
    </div>
  );
};

interface GuildSettingsProps {
  settings: Guild['settings'];
  onSettingsChange: (settings: Guild['settings']) => void;
  isRequireApprovalLocked: boolean;
}

const GuildSettings: React.FC<GuildSettingsProps> = ({ settings, onSettingsChange, isRequireApprovalLocked }) => {
  const { t } = useTranslation();
  const guildTranslations = t.guild;

  const handleSettingChange = (key: keyof Guild['settings'], value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="allow_join_requests">
            {guildTranslations?.edit?.allowJoinRequests || 'Allow Join Requests'}
          </Label>
          <p className="text-sm text-gray-500">
            {guildTranslations?.edit?.allowJoinRequestsDesc || 'Allow users to request to join this guild'}
          </p>
        </div>
        <Switch
          id="allow_join_requests"
          checked={settings?.allow_join_requests ?? true}
          onCheckedChange={(checked) => handleSettingChange('allow_join_requests', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="require_approval">
            {guildTranslations?.edit?.requireApproval || 'Require Approval'}
            {isRequireApprovalLocked && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {guildTranslations?.edit?.locked || 'Locked'}
              </Badge>
            )}
          </Label>
          <p className="text-sm text-gray-500">
            {isRequireApprovalLocked 
              ? (guildTranslations?.edit?.requireApprovalLockedDesc || 'This setting is locked because the guild type is "Approval Required". Change the guild type to modify this setting.')
              : (guildTranslations?.edit?.requireApprovalDesc || 'Require approval for new members to join')
            }
          </p>
        </div>
        <Switch
          id="require_approval"
          checked={settings?.require_approval ?? false}
          onCheckedChange={(checked) => handleSettingChange('require_approval', checked)}
          disabled={isRequireApprovalLocked}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="allow_comments">
            {guildTranslations?.edit?.allowComments || 'Allow Comments'}
          </Label>
          <p className="text-sm text-gray-500">
            {guildTranslations?.edit?.allowCommentsDesc || 'Allow members to post comments in this guild'}
          </p>
        </div>
        <Switch
          id="allow_comments"
          checked={settings?.allow_comments ?? true}
          onCheckedChange={(checked) => handleSettingChange('allow_comments', checked)}
        />
      </div>
    </div>
  );
};

export const GuildEditForm: React.FC<GuildEditFormProps> = ({
  guild,
  onSave,
  onCancel,
  isLoading = false,
  error = null,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const guildTranslations = t.guild;
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(guild.avatar_url || '');
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<GuildEditFormData>({
    resolver: zodResolver(guildEditSchema),
    defaultValues: {
      name: guild.name,
      description: guild.description || '',
      guild_type: guild.guild_type,
      tags: guild.tags || [],
      settings: {
        allow_join_requests: guild.settings?.allow_join_requests ?? true,
        require_approval: guild.settings?.require_approval ?? false,
        allow_comments: guild.settings?.allow_comments ?? true,
      },
    },
  });

  const watchedSettings = watch('settings');
  const watchedTags = watch('tags');
  const watchedGuildType = watch('guild_type');
  
  // Business rule: If guild type is "approval", require_approval must be true and cannot be changed
  const isApprovalGuild = watchedGuildType === 'approval';
  const isRequireApprovalLocked = isApprovalGuild;
  
  // Effect to automatically set require_approval to true when guild type is "approval"
  useEffect(() => {
    if (isApprovalGuild) {
      setValue('settings.require_approval', true, { shouldDirty: true });
    }
  }, [isApprovalGuild, setValue]);

  // Update avatar URL when guild data changes (after refetch)
  useEffect(() => {
    // Update avatar URL if it changed (including when it becomes null/undefined)
    if (guild.avatar_url !== avatarUrl) {
      setAvatarUrl(guild.avatar_url || '');
    }
  }, [guild.avatar_url, avatarUrl]);

  // Handle avatar upload success
  const handleAvatarUploadSuccess = async (url: string) => {
    setAvatarUrl(url);
    setAvatarChanged(true);
    
    // Invalidate guild query to trigger refetch with updated avatar URL
    queryClient.invalidateQueries({ queryKey: ['guild', guild.guild_id] });
  };

  // Handle avatar removal
  const handleAvatarRemoval = () => {
    setAvatarUrl('');
    setAvatarChanged(true);
    
    // Invalidate guild query to trigger refetch with removed avatar
    queryClient.invalidateQueries({ queryKey: ['guild', guild.guild_id] });
  };

  // Handle avatar upload error
  const handleAvatarUploadError = (error: string) => {
    console.error('Avatar upload error:', error);
  };

  // Handle avatar file selection
  const handleAvatarFileSelect = (file: File) => {
    setAvatarFile(file);
    setAvatarChanged(true);
  };

  // Handle form submission
  const onSubmit = async (data: GuildEditFormData) => {
    try {
      // First, upload avatar if a new one was selected
      if (avatarFile) {
        setAvatarUploading(true);
        try {
          await uploadGuildAvatar(guild.guild_id, avatarFile);
          console.log('Avatar uploaded successfully');
          setAvatarChanged(false); // Reset avatar changed state after successful upload
        } catch (avatarError) {
          console.error('Error uploading avatar:', avatarError);
          // Continue with guild update even if avatar upload fails
        } finally {
          setAvatarUploading(false);
        }
      }

      // Then save the guild data
      await onSave({
        name: data.name,
        description: data.description,
        guild_type: data.guild_type,
        tags: data.tags,
        settings: data.settings,
      });
    } catch (error) {
      console.error('Error saving guild:', error);
    }
  };

  // Handle tags change
  const handleTagsChange = (newTags: string[]) => {
    setValue('tags', newTags, { shouldDirty: true });
  };

  // Handle settings change
  const handleSettingsChange = (newSettings: Guild['settings']) => {
    setValue('settings', newSettings, { shouldDirty: true });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {guildTranslations?.edit?.title || 'Edit Guild'}
          </h1>
          <p className="text-gray-600">
            {guildTranslations?.edit?.subtitle || 'Update your guild information and settings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            {guildTranslations?.edit?.cancel || 'Cancel'}
          </Button>
          <Button
            type="submit"
            form="guild-edit-form"
            disabled={(!isDirty && !avatarChanged) || isLoading || avatarUploading}
          >
            {(isLoading || avatarUploading) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {avatarUploading 
              ? (guildTranslations?.edit?.uploadingAvatar || 'Uploading Avatar...')
              : (guildTranslations?.edit?.save || 'Save Changes')
            }
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form id="guild-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {guildTranslations?.edit?.basicInfo || 'Basic Info'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {guildTranslations?.edit?.settings || 'Settings'}
            </TabsTrigger>
            <TabsTrigger value="avatar" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {guildTranslations?.edit?.avatar || 'Avatar'}
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {guildTranslations?.edit?.members || 'Members'}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {guildTranslations?.edit?.basicInfo || 'Basic Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {guildTranslations?.edit?.guildName || 'Guild Name'} *
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder={guildTranslations?.edit?.guildNamePlaceholder || 'Enter guild name'}
                    className={cn(errors.name && 'border-red-500')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {guildTranslations?.edit?.description || 'Description'}
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder={guildTranslations?.edit?.descriptionPlaceholder || 'Enter guild description'}
                    rows={4}
                    className={cn(errors.description && 'border-red-500')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guild_type">
                    {guildTranslations?.edit?.guildType || 'Guild Type'} *
                  </Label>
                  <Select
                    value={watch('guild_type')}
                    onValueChange={(value) => setValue('guild_type', value as 'public' | 'private' | 'approval', { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={guildTranslations?.edit?.selectGuildType || 'Select guild type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {guildTranslations?.edit?.publicGuild || 'Public'}
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {guildTranslations?.edit?.privateGuild || 'Private'}
                        </div>
                      </SelectItem>
                      <SelectItem value="approval">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          {guildTranslations?.edit?.approvalGuild || 'Approval Required'}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.guild_type && (
                    <p className="text-sm text-red-600">{errors.guild_type.message}</p>
                  )}
                </div>

                <TagInput
                  tags={watchedTags}
                  onTagsChange={handleTagsChange}
                  maxTags={10}
                />
                {errors.tags && (
                  <p className="text-sm text-red-600">{errors.tags.message}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {guildTranslations?.edit?.guildSettings || 'Guild Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GuildSettings
                  settings={watchedSettings}
                  onSettingsChange={handleSettingsChange}
                  isRequireApprovalLocked={isRequireApprovalLocked}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avatar Tab */}
          <TabsContent value="avatar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {guildTranslations?.edit?.guildAvatar || 'Guild Avatar'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                        <AvatarUpload
                          guildId={guild.guild_id}
                          currentAvatarUrl={avatarUrl}
                          onUploadSuccess={handleAvatarUploadSuccess}
                          onUploadError={handleAvatarUploadError}
                          onFileSelect={handleAvatarFileSelect}
                          onAvatarRemoved={handleAvatarRemoval}
                          disabled={isLoading || avatarUploading}
                          size="lg"
                        />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <GuildMemberManagement
              guildId={guild.guild_id}
              currentUserId={currentUserId}
              isOwner={guild.created_by === currentUserId}
              isModerator={guild.moderators?.includes(currentUserId || '') || false}
            />
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default GuildEditForm;
