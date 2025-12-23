import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { SubscriptionTier, getCurrentSubscription, createCheckoutSession } from '@/lib/api/subscription';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import NotificationPreferences from './NotificationPreferences';

const TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const { toast: toastNotification } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [nicknameTaken, setNicknameTaken] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  // Fetch current subscription
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: getCurrentSubscription,
  });

  const subscriptionTranslations = useMemo(() => (t as any)?.subscription || {}, [t]);
  const plansTranslations = subscriptionTranslations.plans || {};

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
        setLoadError(err?.message || 'Failed to load profile');
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
      toast.error('Tags can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    if (tags.includes(newTag)) {
      toast.error('Duplicate tags are not allowed');
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
      toast.success(t.profile.messages.saveSuccess);
      navigate('/profile');
    } catch (err: any) {
      logger.error('Error updating profile', { error: err });
      toast.error(t.profile.messages.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, t, formState.errors]);

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
              <Button onClick={() => navigate('/signup')}>
                Go to Sign Up
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

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <form onSubmit={handleSubmit(onSubmit, (errors) => {
              logger.warn('Profile edit form validation failed on submit', { errors });
              toast.error('Please fix the form errors before saving');
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
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
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
                <Input aria-label={t.profile.identity.pronouns.label} placeholder={t.profile.identity.pronouns.placeholder} {...register('pronouns')} />
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
                  placeholder={t.profile.about.tags.placeholder || 'Add tag and press Enter'} 
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
                        aria-label={`Remove tag ${tag}`}
                        onClick={() => removeTag(idx)}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Type a tag and press Enter to add it. Up to 10 tags allowed.</p>
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
                    onCheckout={(tier) => {
                      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
                      const cancelUrl = `${window.location.origin}/profile/edit?tab=subscription`;
                      createCheckoutSession(tier, successUrl, cancelUrl)
                        .then((response) => {
                          window.location.href = response.url;
                        })
                        .catch((error: any) => {
                          logger.error('Failed to create checkout session', { error: error.message });
                          toastNotification({
                            title: subscriptionTranslations.errors?.checkoutFailed || 'Error',
                            description: error.message || 'Failed to create checkout session',
                            variant: 'destructive',
                          });
                        });
                    }}
                  />
                )}
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
  onCheckout: (tier: SubscriptionTier) => void;
}

const SubscriptionPlanSelector: React.FC<SubscriptionPlanSelectorProps> = ({
  currentTier,
  hasActiveSubscription,
  plansTranslations,
  subscriptionTranslations,
  selectedTier,
  onTierSelect,
  onCheckout,
}) => {
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
                  Most Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-green-500 z-10">
                  Current
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
                    onCheckout(plan.tier);
                  }}
                  disabled={isCurrentPlan || selectedTier === plan.tier}
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : isSelected ? 'default' : 'outline'}
                >
                  {isCurrentPlan
                    ? 'Current Plan'
                    : isUpgradePlan
                    ? subscriptionTranslations.upgrade || 'Upgrade'
                    : isDowngradePlan
                    ? subscriptionTranslations.downgrade || 'Downgrade'
                    : plan.cta || 'Select'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!hasActiveSubscription && (
        <Alert>
          <AlertDescription>
            You're currently on the free tier. Select a plan above to upgrade and unlock premium features.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfileEdit;


