import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTranslation } from '@/hooks/useTranslation';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import { BadgeDisplay } from '@/components/gamification/BadgeDisplay';
import { getCurrentSubscription } from '@/lib/api/subscription';
import { getCountries } from '@/i18n/countries';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Heart,
  Users,
  Award,
  Edit3,
  Shield,
  CheckCircle,
  Clock,
  Bell,
  CreditCard
} from 'lucide-react';

const ProfileView = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { profile, loading, error, refetch } = useUserProfile();
  const [activeTab, setActiveTab] = useState<string>('basic');
  const profileTranslations = (t as any)?.profile || {};
  const view = profileTranslations.view || {};
  const roleLabels = view.roles || {};
  const languageLabels = view.languages || {};
  const signupTranslations = (t as any)?.signup?.local || {};
  const questTranslations = (t as any)?.quest?.notifications?.preferences || {};
  const subscriptionTranslations = (t as any)?.subscription || {};

  // Get countries list for country name lookup
  const countries = useMemo(() => getCountries(language), [language]);
  const countryMap = useMemo(() => {
    const map = new Map<string, string>();
    countries.forEach(c => map.set(c.code, c.name));
    return map;
  }, [countries]);

  // Get pronoun label from value
  const getPronounLabel = (pronounValue: string): string => {
    const pronounMap: Record<string, string> = {
      'she/her': signupTranslations.options?.pronouns?.sheHer || 'She/Her',
      'he/him': signupTranslations.options?.pronouns?.heHim || 'He/Him',
      'they/them': signupTranslations.options?.pronouns?.theyThem || 'They/Them',
      'she/they': signupTranslations.options?.pronouns?.sheThey || 'She/They',
      'he/they': signupTranslations.options?.pronouns?.heThey || 'He/They',
    };
    return pronounMap[pronounValue.toLowerCase()] || pronounValue;
  };

  // Fetch current subscription to get the actual tier
  const {
    data: subscription,
    isLoading: subscriptionLoading,
  } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: getCurrentSubscription,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const formatDate = (timestamp: number) => {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
    };
    const locale = localeMap[language] || 'en-US';
    return new Date(timestamp).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'partner':
        return <Users className="h-4 w-4" />;
      case 'patron':
        return <Award className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'partner':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'patron':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string, emailConfirmed: boolean) => {
    if (status === 'ACTIVE' && emailConfirmed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (status: string, emailConfirmed: boolean) => {
    if (status === 'ACTIVE' && emailConfirmed) {
      return view.statusVerified || 'Verified';
    }
    if (!emailConfirmed) {
      return view.statusEmailNotVerified || 'Email Not Verified';
    }
    return status;
  };

  if (loading) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>

            {/* Profile cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-4xl">
          <Alert className="mb-6">
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={refetch}
              >
                {view.tryAgain || 'Try Again'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertDescription>
              {view.profileNotFound || profileTranslations.messages?.profileNotFound || 'Profile not found. Please try refreshing the page.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="spacing-medieval py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {profile.fullName || profile.nickname || (view.adventurer || 'Adventurer')}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {getRoleIcon(profile.role)}
                <Badge className={getRoleColor(profile.role)}>
                  {roleLabels[profile.role] || (profile.role.charAt(0).toUpperCase() + profile.role.slice(1))}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(profile.status, profile.email_confirmed)}
                <span className="text-sm">
                  {getStatusText(profile.status, profile.email_confirmed)}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate('/profile/edit')}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {view.editProfile || 'Edit Profile'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic">{view.tabs?.basic || profileTranslations.edit?.tabs?.basic || 'Basic Info'}</TabsTrigger>
            <TabsTrigger value="notifications">{view.tabs?.notifications || profileTranslations.edit?.tabs?.notifications || 'Notifications'}</TabsTrigger>
            <TabsTrigger value="subscription">{view.tabs?.subscription || profileTranslations.edit?.tabs?.subscription || 'Subscription'}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {view.basicInformation || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{view.email || 'Email'}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              {profile.nickname && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{view.nickname || 'Nickname'}</p>
                    <p className="text-sm text-muted-foreground">@{profile.nickname}</p>
                  </div>
                </div>
              )}

              {profile.birthDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{view.birthDate || 'Birth Date'}</p>
                    <p className="text-sm text-muted-foreground">{profile.birthDate}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{view.language || 'Language'}</p>
                  <p className="text-sm text-muted-foreground">
                    {languageLabels[profile.language] || profile.language.toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {view.locationIdentity || 'Location & Identity'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.country && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{view.country || 'Country'}</p>
                    <p className="text-sm text-muted-foreground">
                      {countryMap.get(profile.country) || profile.country}
                    </p>
                  </div>
                </div>
              )}

              {profile.gender && (
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{view.gender || 'Gender'}</p>
                    <p className="text-sm text-muted-foreground">{profile.gender}</p>
                  </div>
                </div>
              )}

              {profile.pronouns && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{view.pronouns || 'Pronouns'}</p>
                    <p className="text-sm text-muted-foreground">
                      {getPronounLabel(profile.pronouns)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{view.provider || 'Provider'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile.provider}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About & Bio */}
          {(profile.bio || profile.tags.length > 0) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{view.about || 'About'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && (
                  <div>
                    <p className="text-sm font-medium mb-2">{view.bio || 'Bio'}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {profile.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">{view.tags || 'Tags'}</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* XP & Gamification */}
          <XPDisplay className="md:col-span-2" />
          <BadgeDisplay className="md:col-span-2" />

          {/* Account Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{view.accountInformation || 'Account Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {subscriptionLoading ? (
                      <Skeleton className="h-8 w-20 mx-auto" />
                    ) : (
                      (subscription?.plan_tier || profile.tier || 'FREE').toUpperCase()
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{view.tier || 'Tier'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatDate(profile.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">{view.memberSince || 'Member Since'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatDate(profile.updatedAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">{view.lastUpdated || 'Last Updated'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {questTranslations.title || 'Notification Preferences'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.notificationPreferences ? (
                  <>
                    {/* Notification Types */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        {questTranslations.title || 'Notification Types'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {questTranslations.questStarted || 'Quest Started'}
                            </p>
                          </div>
                          <Badge variant={profile.notificationPreferences.questStarted ? 'default' : 'secondary'}>
                            {profile.notificationPreferences.questStarted ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {questTranslations.questCompleted || 'Quest Completed'}
                            </p>
                          </div>
                          <Badge variant={profile.notificationPreferences.questCompleted ? 'default' : 'secondary'}>
                            {profile.notificationPreferences.questCompleted ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {questTranslations.questFailed || 'Quest Failed'}
                            </p>
                          </div>
                          <Badge variant={profile.notificationPreferences.questFailed ? 'default' : 'secondary'}>
                            {profile.notificationPreferences.questFailed ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {questTranslations.progressMilestones || 'Progress Milestones'}
                            </p>
                          </div>
                          <Badge variant={profile.notificationPreferences.progressMilestones ? 'default' : 'secondary'}>
                            {profile.notificationPreferences.progressMilestones ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {questTranslations.deadlineWarnings || 'Deadline Warnings'}
                            </p>
                          </div>
                          <Badge variant={profile.notificationPreferences.deadlineWarnings ? 'default' : 'secondary'}>
                            {profile.notificationPreferences.deadlineWarnings ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {questTranslations.streakAchievements || 'Streak Achievements'}
                            </p>
                          </div>
                          <Badge variant={profile.notificationPreferences.streakAchievements ? 'default' : 'secondary'}>
                            {profile.notificationPreferences.streakAchievements ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {questTranslations.challengeUpdates || 'Challenge Updates'}
                            </p>
                          </div>
                          <Badge variant={profile.notificationPreferences.challengeUpdates ? 'default' : 'secondary'}>
                            {profile.notificationPreferences.challengeUpdates ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Notification Channels */}
                    {profile.notificationPreferences.channels && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {questTranslations.channels?.title || 'Notification Channels'}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {questTranslations.channels?.inApp || 'In-App Notifications'}
                              </p>
                            </div>
                            <Badge variant={profile.notificationPreferences.channels.inApp ? 'default' : 'secondary'}>
                              {profile.notificationPreferences.channels.inApp ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {questTranslations.channels?.email || 'Email Notifications'}
                              </p>
                            </div>
                            <Badge variant={profile.notificationPreferences.channels.email ? 'default' : 'secondary'}>
                              {profile.notificationPreferences.channels.email ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {questTranslations.channels?.push || 'Push Notifications'}
                              </p>
                            </div>
                            <Badge variant={profile.notificationPreferences.channels.push ? 'default' : 'secondary'}>
                              {profile.notificationPreferences.channels.push ? (view.enabled || 'Enabled') : (view.disabled || 'Disabled')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      {view.noNotificationPreferences || 'No notification preferences set. Edit your profile to configure notifications.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {subscriptionTranslations.title || 'Subscription'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscriptionLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {subscriptionTranslations.planTier || 'Plan Tier'}
                        </p>
                        <p className="text-2xl font-bold">
                          {(subscription.plan_tier || profile.tier || 'FREE').toUpperCase()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {subscriptionTranslations.status || 'Status'}
                        </p>
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status || 'N/A'}
                        </Badge>
                      </div>

                      {subscription.current_period_start && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {subscriptionTranslations.currentPeriodStart || 'Current Period Start'}
                          </p>
                          <p className="text-sm">
                            {formatDate(new Date(subscription.current_period_start).getTime())}
                          </p>
                        </div>
                      )}

                      {subscription.current_period_end && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {subscriptionTranslations.currentPeriodEnd || 'Current Period End'}
                          </p>
                          <p className="text-sm">
                            {formatDate(new Date(subscription.current_period_end).getTime())}
                          </p>
                        </div>
                      )}

                      {subscription.cancel_at_period_end && (
                        <div className="md:col-span-2">
                          <Alert>
                            <AlertDescription>
                              {subscriptionTranslations.cancelAtPeriodEnd || 'This subscription will be canceled at the end of the current period.'}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>

                    {!subscription.has_active_subscription && (
                      <Alert>
                        <AlertDescription>
                          {subscriptionTranslations.noActiveSubscription || 'No active subscription. Edit your profile to upgrade.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      {subscriptionTranslations.loadFailed || 'Failed to load subscription information.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              {view.backToDashboard || 'Back to Dashboard'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
