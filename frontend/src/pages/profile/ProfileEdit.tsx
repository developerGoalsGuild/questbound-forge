import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { type ProfileFormData } from '@/models/profile';
import { profileUpdateSchema } from '@/lib/validation/profileValidation';
import { getProfile, updateProfile, getCountries, checkNicknameAvailability } from '@/lib/apiProfile';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { language, t } = useTranslation();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [nicknameTaken, setNicknameTaken] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('');

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
      </div>
    </div>
  );
};

export default ProfileEdit;


