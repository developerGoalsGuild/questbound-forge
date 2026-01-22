import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { type ProfileFormData } from '@/models/profile';
import { profileUpdateSchema } from '@/lib/validation/profileValidation';
import { getProfile, updateProfile, getCountries, checkNicknameAvailability } from '@/lib/apiProfile';
import {
  SubscriptionTier,
  getCurrentSubscription,
  createCheckoutSession,
  updateSubscriptionPlan,
} from '@/lib/api/subscription';
import ARIALiveRegion from '@/components/ui/ARIALiveRegion';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import NotificationPreferences from './NotificationPreferences';

const TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { language, t, changeLanguage } = useTranslation();
  const { toast: toastNotification } = useToast();
  const queryClient = useQueryClient();
  const editTranslations = (t as any)?.profile?.edit || {};
  const languageLabels = editTranslations.languages || {};

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [nicknameTaken, setNicknameTaken] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [processingTier, setProcessingTier] = useState<SubscriptionTier | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [shouldFetchSubscription, setShouldFetchSubscription] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'subscription') {
      setShouldFetchSubscription(true);
    }
  }, [activeTab]);

  // Fetch current subscription - only when subscription tab is active
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: getCurrentSubscription,
    enabled: activeTab === 'subscription' && shouldFetchSubscription, // Only fetch when subscription tab is active
    retry: false, // Don't retry on error to prevent spam
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 60_000,
    onSuccess: () => {
      setShouldFetchSubscription(false);
    },
    onError: () => {
      setShouldFetchSubscription(false);
    },
  });

  const subscriptionTranslations = useMemo(() => (t as any)?.subscription || {}, [t]);
  const plansTranslations = subscriptionTranslations.plans || {};
  const signupTranslations = useMemo(() => (t as any)?.signup?.local || {}, [t]);

  // Pronoun options with translations
  const pronounOptions = useMemo(() => {
    const options = [
      { value: 'she/her', label: signupTranslations.options?.pronouns?.sheHer || 'She/Her' },
      { value: 'he/him', label: signupTranslations.options?.pronouns?.heHim || 'He/Him' },
      { value: 'they/them', label: signupTranslations.options?.pronouns?.theyThem || 'They/Them' },
      { value: 'she/they', label: signupTranslations.options?.pronouns?.sheThey || 'She/They' },
      { value: 'he/they', label: signupTranslations.options?.pronouns?.heThey || 'He/They' },
      { value: 'other', label: signupTranslations.options?.common?.other || 'Other' },
    ];
    return options;
  }, [signupTranslations]);

  const checkoutMutation = useMutation({
    mutationFn: (tier: SubscriptionTier) => {
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/profile/edit?tab=subscription`;
      return createCheckoutSession(tier, successUrl, cancelUrl);
    },
    onSuccess: (response) => {
      window.location.href = response.url;
    },
    onError: (error: any) => {
      logger.error('Failed to create checkout session', { error: error.message });
      toastNotification({
        title: subscriptionTranslations.errors?.checkoutFailed || 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
      setSelectedTier(null);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ tier, changeTiming }: { tier: SubscriptionTier; changeTiming: 'immediate' | 'period_end' }) => (
      updateSubscriptionPlan({ plan_tier: tier, change_timing: changeTiming })
    ),
    onSuccess: () => {
      toastNotification({
        title: subscriptionTranslations.messages?.updated || 'Subscription updated',
        description: subscriptionTranslations.messages?.updateSuccess || 'Your subscription plan has been updated.',
        variant: 'default',
      });
      setShouldFetchSubscription(true);
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      setSelectedTier(null);
    },
    onError: (error: any) => {
      logger.error('Failed to update subscription plan', { error: error.message });
      toastNotification({
        title: subscriptionTranslations.errors?.updateFailed || 'Error',
        description: error.message || 'Failed to update subscription plan',
        variant: 'destructive',
      });
      setSelectedTier(null);
    },
  });

  const countries = useMemo(() => getCountries(language), [language]);

  const { register, handleSubmit, formState, setValue, watch, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema.partial() as any),
    defaultValues: {
      fullName: '',
      nickname: '',
      birthDate: '',
      country: '',
      language: language,
      gender: '',
      pronouns: '',
      bio: '',
      tags: [],
    }
  });

  const nickname = watch('nickname');
  const tags = watch('tags') || [];
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const p = await getProfile();
        reset({
          fullName: p.fullName || '',
          nickname: p.nickname || '',
          birthDate: p.birthDate || '',
          country: p.country || '',
          language: p.language || language,
          gender: p.gender || '',
          pronouns: p.pronouns || '',
          bio: p.bio || '',
          tags: p.tags || [],
        });
      } catch (err: any) {
        setLoadError(err?.message || editTranslations.loadError || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [language, reset]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!nickname) { setNicknameTaken(false); return; }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const available = await checkNicknameAvailability(nickname);
        setNicknameTaken(!available);
      } catch {
        // ignore availability errors
      }
    }, 500);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [nickname]);

  // Add tag from input
  const addTag = () => {
    const newTag = tagInput.trim();
    if (!newTag) return;
    if (!TAG_REGEX.test(newTag)) {
      toast.error(editTranslations.validation?.tagFormat || 'Tags can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    if (tags.includes(newTag)) {
      toast.error(editTranslations.validation?.tagDuplicate || 'Duplicate tags are not allowed');
      return;
    }
    const newTags = [...tags, newTag];
    setValue('tags', newTags);
    setTagInput('');
  };

  // Handle Enter key in tag input
  const onTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove tag by index
  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setValue('tags', newTags);
  };

  const onSubmit = useCallback(async (data: ProfileFormData) => {
    logger.debug('Profile edit form submission started', { data });
    logger.debug('Profile edit form validation errors', { errors: formState.errors });
    try {
      setIsSubmitting(true);
      logger.debug('Processing tags for profile update', { tags: data.tags });
      const updateData = {
        fullName: data.fullName || undefined,
        nickname: data.nickname || undefined,
        birthDate: data.birthDate || undefined,
        country: data.country || undefined,
        language: data.language || undefined,
        gender: data.gender || undefined,
        pronouns: data.pronouns || undefined,
        bio: data.bio || undefined,
        tags: data.tags && data.tags.length ? data.tags : undefined,
      };
      logger.info('Sending profile update data to API', { updateData });
      await updateProfile(updateData);
      logger.info('Profile updated successfully');
      if (data.language && data.language !== language) {
        await changeLanguage(data.language as any);
      }
      toast.success(t.profile.messages.saveSuccess);
      navigate('/profile');
    } catch (err: any) {
      logger.error('Error updating profile', { error: err });
      toast.error(t.profile.messages.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, t, formState.errors, changeLanguage, language]);

  if (isLoading) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.messages.loading}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-3xl">
          <Alert>
            <AlertDescription>
              {loadError === 'PROFILE_NOT_FOUND' 
                ? t.profile.messages.profileNotFound
                : loadError
              }
            </AlertDescription>
          </Alert>
          {loadError === 'PROFILE_NOT_FOUND' && (
            <div className="mt-4">
              <Button onClick={() => navigate('/signup/LocalSignUp')}>
                {t.profile.actions.goToSignUp}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="spacing-medieval py-8">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t.profile.title}</h1>
          <p className="text-muted-foreground">{t.profile.subtitle}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic">{editTranslations.tabs?.basic || 'Basic Info'}</TabsTrigger>
            <TabsTrigger value="notifications">{editTranslations.tabs?.notifications || 'Notifications'}</TabsTrigger>
            <TabsTrigger value="subscription">{editTranslations.tabs?.subscription || 'Subscription'}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <form onSubmit={handleSubmit(onSubmit, (errors) => {
              logger.warn('Profile edit form validation failed on submit', { errors });
              toast.error(editTranslations.formFixErrors || 'Please fix the form errors before saving');
            })} aria-label="Edit Profile Form">
              {/* Basic Information */}
              <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t.profile.basicInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t.profile.basicInfo.fullName.label}</label>
                <Input aria-label={t.profile.basicInfo.fullName.label} placeholder={t.profile.basicInfo.fullName.placeholder} {...register('fullName')} />
                {formState.errors.fullName && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{formState.errors.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">{t.profile.basicInfo.nickname.label}</label>
                <Input aria-label={t.profile.basicInfo.nickname.label} placeholder={t.profile.basicInfo.nickname.placeholder} {...register('nickname')} />
                <p className="text-xs text-muted-foreground mt-1">{t.profile.basicInfo.nickname.help}</p>
                {formState.errors.nickname && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{formState.errors.nickname.message}</p>
                )}
                {nicknameTaken && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{t.profile.validation.nicknameTaken}</p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">{t.profile.basicInfo.birthDate.label}</label>
                <Input type="date" aria-label={t.profile.basicInfo.birthDate.label} placeholder={t.profile.basicInfo.birthDate.placeholder} {...register('birthDate')} />
                {formState.errors.birthDate && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{formState.errors.birthDate.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location & Language */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t.profile.location.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t.profile.location.country.label}</label>
                <Select value={watch('country') || ''} onValueChange={(v) => setValue('country', v)}>
                  <SelectTrigger aria-label={t.profile.location.country.label}>
                    <SelectValue placeholder={t.profile.location.country.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1">{t.profile.location.language.label}</label>
                <Select value={watch('language') || language} onValueChange={(v) => setValue('language', v)}>
                  <SelectTrigger aria-label={t.profile.location.language.label}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{languageLabels.en || 'English'}</SelectItem>
                    <SelectItem value="es">{languageLabels.es || 'Español'}</SelectItem>
                    <SelectItem value="fr">{languageLabels.fr || 'Français'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Identity */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t.profile.identity.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t.profile.identity.gender.label}</label>
                <Input aria-label={t.profile.identity.gender.label} placeholder={t.profile.identity.gender.placeholder} {...register('gender')} />
              </div>
              <div>
                <label className="block text-sm mb-1">{t.profile.identity.pronouns.label}</label>
                <Select 
                  value={watch('pronouns') || undefined} 
                  onValueChange={(v) => setValue('pronouns', v)}
                >
                  <SelectTrigger aria-label={t.profile.identity.pronouns.label}>
                    <SelectValue placeholder={signupTranslations.selectPronouns || t.profile.identity.pronouns.placeholder || 'Select pronouns'} />
                  </SelectTrigger>
                  <SelectContent>
                    {pronounOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t.profile.about.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-1">{t.profile.about.bio.label}</label>
                <Textarea aria-label={t.profile.about.bio.label} placeholder={t.profile.about.bio.placeholder} {...register('bio')} />
                <p className="text-xs text-muted-foreground mt-1">{t.profile.about.bio.help}</p>
              </div>
              <div>
                <label className="block text-sm mb-1">{t.profile.about.tags.label}</label>
                <Input 
                  aria-label={t.profile.about.tags.label} 
                  placeholder={t.profile.about.tags.placeholder || editTranslations.addTagPlaceholder || 'Add tag and press Enter'} 
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={onTagInputKeyDown}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        aria-label={`${editTranslations.removeTagAria || 'Remove tag'} ${tag}`}
                        onClick={() => removeTag(idx)}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{editTranslations.tagsHelp || 'Type a tag and press Enter to add it. Up to 10 tags allowed.'}</p>
                {formState.errors.tags && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{formState.errors.tags.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
                  {t.profile.actions.cancel}
                </Button>
                <Button type="button" variant="secondary" onClick={() => reset()}>
                  {t.profile.actions.reset}
                </Button>
                <Button type="submit" disabled={isSubmitting || nicknameTaken}>
                  {t.profile.actions.save}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationPreferences />
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>{subscriptionTranslations.title || 'Subscription Plans'}</CardTitle>
                <CardDescription>
                  {subscriptionTranslations.subtitle || 'Change your subscription plan'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : subscriptionError ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {subscriptionTranslations.errors?.loadFailed || 'Failed to load subscription information'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <SubscriptionPlanSelector
                    currentTier={subscription?.plan_tier}
                    hasActiveSubscription={subscription?.has_active_subscription || false}
                    plansTranslations={plansTranslations}
                    subscriptionTranslations={subscriptionTranslations}
                    selectedTier={selectedTier}
                    onTierSelect={setSelectedTier}
                    processingTier={processingTier}
                    isProcessing={checkoutMutation.isPending || updatePlanMutation.isPending}
                    onCheckout={(tier, changeTiming) => {
                      setProcessingTier(tier);
                      if (subscription?.has_active_subscription) {
                        updatePlanMutation.mutate(
                          { tier, changeTiming },
                          {
                            onSettled: () => setProcessingTier(null),
                          }
                        );
                        return;
                      }
                      checkoutMutation.mutate(tier, {
                        onSettled: () => setProcessingTier(null),
                      });
                    }}
                  />
                )}
                <ARIALiveRegion
                  message={
                    checkoutMutation.isPending || updatePlanMutation.isPending
                      ? subscriptionTranslations.messages?.processing || 'Processing subscription request'
                      : ''
                  }
                  priority="polite"
                  className="sr-only"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface SubscriptionPlanSelectorProps {
  currentTier?: SubscriptionTier | null;
  hasActiveSubscription: boolean;
  plansTranslations: any;
  subscriptionTranslations: any;
  selectedTier: SubscriptionTier | null;
  onTierSelect: (tier: SubscriptionTier | null) => void;
  onCheckout: (tier: SubscriptionTier, changeTiming: 'immediate' | 'period_end') => void;
  processingTier: SubscriptionTier | null;
  isProcessing: boolean;
}

const SubscriptionPlanSelector: React.FC<SubscriptionPlanSelectorProps> = ({
  currentTier,
  hasActiveSubscription,
  plansTranslations,
  subscriptionTranslations,
  selectedTier,
  onTierSelect,
  onCheckout,
  processingTier,
  isProcessing,
}) => {
  const popularLabel = subscriptionTranslations.mostPopular || 'Most Popular';
  const currentBadgeLabel = subscriptionTranslations.currentBadge || 'Current';
  const currentPlanLabel = subscriptionTranslations.currentPlan || 'Current Plan';
  const freeTierNotice = subscriptionTranslations.freeTierNotice
    || "You're currently on the free tier. Select a plan above to upgrade and unlock premium features.";
  const plans: Array<{ tier: SubscriptionTier; name: string; price: string; period: string; description: string; features: string[]; popular: boolean }> = [
    {
      tier: 'INITIATE',
      ...plansTranslations.initiate,
    },
    {
      tier: 'JOURNEYMAN',
      ...plansTranslations.journeyman,
    },
    {
      tier: 'SAGE',
      ...plansTranslations.sage,
    },
    {
      tier: 'GUILDMASTER',
      ...plansTranslations.guildmaster,
    },
  ];

  const getTierHierarchy = (tier: SubscriptionTier): number => {
    const hierarchy: Record<SubscriptionTier, number> = {
      INITIATE: 1,
      JOURNEYMAN: 2,
      SAGE: 3,
      GUILDMASTER: 4,
    };
    return hierarchy[tier] || 0;
  };

  const isUpgrade = (tier: SubscriptionTier): boolean => {
    if (!currentTier) return true;
    return getTierHierarchy(tier) > getTierHierarchy(currentTier);
  };

  const isDowngrade = (tier: SubscriptionTier): boolean => {
    if (!currentTier) return false;
    return getTierHierarchy(tier) < getTierHierarchy(currentTier);
  };

  const getChangeTiming = (tier: SubscriptionTier): 'immediate' | 'period_end' => {
    if (!currentTier) return 'immediate';
    return isDowngrade(tier) ? 'period_end' : 'immediate';
  };

  return (
    <div className="space-y-6">
      {hasActiveSubscription && currentTier && (
        <Alert>
          <AlertDescription>
            <strong>{subscriptionTranslations.currentPlan || 'Current Plan'}:</strong>{' '}
            {plansTranslations[currentTier.toLowerCase() as keyof typeof plansTranslations]?.name || currentTier}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrentPlan = currentTier === plan.tier;
          const isSelected = selectedTier === plan.tier;
          const isUpgradePlan = isUpgrade(plan.tier);
          const isDowngradePlan = isDowngrade(plan.tier);
          const isLoading = isProcessing && processingTier === plan.tier;

          return (
            <Card
              key={plan.tier}
              className={cn(
                'relative flex flex-col h-full transition-all',
                isCurrentPlan && 'border-green-500 border-2',
                isSelected && !isCurrentPlan && 'border-primary border-2 shadow-lg',
                plan.popular && !isCurrentPlan && 'border-primary'
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary z-10">
                  {popularLabel}
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-green-500 z-10">
                  {currentBadgeLabel}
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name || plan.tier}</CardTitle>
                <CardDescription>{plan.description || ''}</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price || '$0'}</span>
                  {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <ul className="space-y-2 flex-grow mb-4">
                  {(plan.features || []).slice(0, 3).map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => {
                    if (isCurrentPlan) return;
                    onTierSelect(plan.tier);
                    onCheckout(plan.tier, getChangeTiming(plan.tier));
                  }}
                  disabled={isCurrentPlan || selectedTier === plan.tier || isProcessing}
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : isSelected ? 'default' : 'outline'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {subscriptionTranslations.messages?.processing || 'Processing...'}
                    </>
                  ) : isCurrentPlan ? (
                    currentPlanLabel
                  ) : isUpgradePlan ? (
                    subscriptionTranslations.upgrade || 'Upgrade'
                  ) : isDowngradePlan ? (
                    subscriptionTranslations.downgrade || 'Downgrade'
                  ) : (
                    plan.cta || 'Select'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!hasActiveSubscription && (
        <Alert>
          <AlertDescription>
            {freeTierNotice}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfileEdit;


