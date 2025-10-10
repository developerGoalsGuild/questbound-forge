import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { updateProfile, getProfile } from '@/lib/apiProfile';
import { NotificationPreferences } from '@/models/profile';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface NotificationPreferencesFormData {
  questStarted: boolean;
  questCompleted: boolean;
  questFailed: boolean;
  progressMilestones: boolean;
  deadlineWarnings: boolean;
  streakAchievements: boolean;
  challengeUpdates: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  language: string;
}

const NotificationPreferences: React.FC = () => {
  const { t, changeLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const { register, handleSubmit, watch, setValue, reset } = useForm<NotificationPreferencesFormData>({
    defaultValues: {
      questStarted: true,
      questCompleted: true,
      questFailed: true,
      progressMilestones: true,
      deadlineWarnings: true,
      streakAchievements: true,
      challengeUpdates: true,
      channels: {
        inApp: true,
        email: false,
        push: false,
      },
      language: 'en',
    }
  });

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  // Load user preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const profile = await getProfile();
        
        if (profile.notificationPreferences) {
          const prefs = profile.notificationPreferences;
          reset({
            questStarted: prefs.questStarted ?? true,
            questCompleted: prefs.questCompleted ?? true,
            questFailed: prefs.questFailed ?? true,
            progressMilestones: prefs.progressMilestones ?? true,
            deadlineWarnings: prefs.deadlineWarnings ?? true,
            streakAchievements: prefs.streakAchievements ?? true,
            challengeUpdates: prefs.challengeUpdates ?? true,
            channels: {
              inApp: prefs.channels?.inApp ?? true,
              email: prefs.channels?.email ?? false,
              push: prefs.channels?.push ?? false,
            },
            language: profile.language || 'en',
          });
          setCurrentLanguage(profile.language || 'en');
        }
      } catch (error) {
        logger.error('Failed to load notification preferences', { error });
        toast.error('Failed to load notification preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [reset]);

  const handleLanguageChange = useCallback(async (newLanguage: string) => {
    try {
      setCurrentLanguage(newLanguage);
      setValue('language', newLanguage);
      
      // Update profile with new language
      await updateProfile({ language: newLanguage });
      
      // Change i18n language immediately
      await changeLanguage(newLanguage as 'en' | 'es' | 'fr');
      
      toast.success(questTranslations?.notifications?.messages?.languageChanged || 'Language changed successfully');
    } catch (error) {
      logger.error('Failed to change language', { error });
      toast.error('Failed to change language');
      // Revert on error
      setCurrentLanguage(watch('language'));
    }
  }, [changeLanguage, setValue, questTranslations, watch]);

  const onSubmit = useCallback(async (data: NotificationPreferencesFormData) => {
    try {
      setIsSubmitting(true);
      logger.debug('Saving notification preferences', { data });

      const notificationPreferences: NotificationPreferences = {
        questStarted: data.questStarted,
        questCompleted: data.questCompleted,
        questFailed: data.questFailed,
        progressMilestones: data.progressMilestones,
        deadlineWarnings: data.deadlineWarnings,
        streakAchievements: data.streakAchievements,
        challengeUpdates: data.challengeUpdates,
        channels: {
          inApp: data.channels.inApp,
          email: data.channels.email,
          push: data.channels.push,
        },
      };

      await updateProfile({ 
        notificationPreferences,
        language: data.language 
      });

      logger.info('Notification preferences saved successfully');
      toast.success(commonTranslations?.messages?.saveSuccess || 'Preferences saved successfully');
    } catch (error) {
      logger.error('Error saving notification preferences', { error });
      toast.error(commonTranslations?.messages?.saveError || 'Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  }, [commonTranslations]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{questTranslations?.notifications?.preferences?.title || 'Notification Preferences'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading preferences...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{questTranslations?.notifications?.preferences?.title || 'Notification Preferences'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">
              {questTranslations?.notifications?.preferences?.language?.title || 'Preferred Language'}
            </Label>
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" aria-label={questTranslations?.notifications?.preferences?.language?.selectLanguage || 'Select Language'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  {questTranslations?.notifications?.preferences?.language?.english || 'English'}
                </SelectItem>
                <SelectItem value="es">
                  {questTranslations?.notifications?.preferences?.language?.spanish || 'Spanish'}
                </SelectItem>
                <SelectItem value="fr">
                  {questTranslations?.notifications?.preferences?.language?.french || 'French'}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {questTranslations?.notifications?.preferences?.language?.currentLanguage || 'Current Language'}: {currentLanguage.toUpperCase()}
            </p>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {questTranslations?.notifications?.preferences?.title || 'Notification Types'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="questStarted">
                    {questTranslations?.notifications?.preferences?.questStarted || 'Quest Started'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you start a quest
                  </p>
                </div>
                <Switch
                  id="questStarted"
                  checked={watch('questStarted')}
                  onCheckedChange={(checked) => setValue('questStarted', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.questStarted || 'Quest Started'} notifications`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="questCompleted">
                    {questTranslations?.notifications?.preferences?.questCompleted || 'Quest Completed'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you complete a quest
                  </p>
                </div>
                <Switch
                  id="questCompleted"
                  checked={watch('questCompleted')}
                  onCheckedChange={(checked) => setValue('questCompleted', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.questCompleted || 'Quest Completed'} notifications`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="questFailed">
                    {questTranslations?.notifications?.preferences?.questFailed || 'Quest Failed'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a quest fails
                  </p>
                </div>
                <Switch
                  id="questFailed"
                  checked={watch('questFailed')}
                  onCheckedChange={(checked) => setValue('questFailed', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.questFailed || 'Quest Failed'} notifications`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="progressMilestones">
                    {questTranslations?.notifications?.preferences?.progressMilestones || 'Progress Milestones'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified at progress milestones
                  </p>
                </div>
                <Switch
                  id="progressMilestones"
                  checked={watch('progressMilestones')}
                  onCheckedChange={(checked) => setValue('progressMilestones', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.progressMilestones || 'Progress Milestones'} notifications`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="deadlineWarnings">
                    {questTranslations?.notifications?.preferences?.deadlineWarnings || 'Deadline Warnings'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about approaching deadlines
                  </p>
                </div>
                <Switch
                  id="deadlineWarnings"
                  checked={watch('deadlineWarnings')}
                  onCheckedChange={(checked) => setValue('deadlineWarnings', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.deadlineWarnings || 'Deadline Warnings'} notifications`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="streakAchievements">
                    {questTranslations?.notifications?.preferences?.streakAchievements || 'Streak Achievements'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about streak achievements
                  </p>
                </div>
                <Switch
                  id="streakAchievements"
                  checked={watch('streakAchievements')}
                  onCheckedChange={(checked) => setValue('streakAchievements', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.streakAchievements || 'Streak Achievements'} notifications`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="challengeUpdates">
                    {questTranslations?.notifications?.preferences?.challengeUpdates || 'Challenge Updates'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about challenge updates
                  </p>
                </div>
                <Switch
                  id="challengeUpdates"
                  checked={watch('challengeUpdates')}
                  onCheckedChange={(checked) => setValue('challengeUpdates', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.challengeUpdates || 'Challenge Updates'} notifications`}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {questTranslations?.notifications?.preferences?.channels?.title || 'Notification Channels'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inApp">
                    {questTranslations?.notifications?.preferences?.channels?.inApp || 'In-App Notifications'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications within the application
                  </p>
                </div>
                <Switch
                  id="inApp"
                  checked={watch('channels.inApp')}
                  onCheckedChange={(checked) => setValue('channels.inApp', checked)}
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.channels?.inApp || 'In-App Notifications'}`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">
                    {questTranslations?.notifications?.preferences?.channels?.email || 'Email Notifications'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications via email (coming soon)
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={watch('channels.email')}
                  onCheckedChange={(checked) => setValue('channels.email', checked)}
                  disabled
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.channels?.email || 'Email Notifications'} (disabled)`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push">
                    {questTranslations?.notifications?.preferences?.channels?.push || 'Push Notifications'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send push notifications (coming soon)
                  </p>
                </div>
                <Switch
                  id="push"
                  checked={watch('channels.push')}
                  onCheckedChange={(checked) => setValue('channels.push', checked)}
                  disabled
                  aria-label={`Toggle ${questTranslations?.notifications?.preferences?.channels?.push || 'Push Notifications'} (disabled)`}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (commonTranslations?.actions?.saving || 'Saving...') 
                : (commonTranslations?.actions?.save || 'Save Preferences')
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;