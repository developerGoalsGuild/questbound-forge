import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { createUser, isEmailAvailable, isNicknameAvailable, confirmEmail, login } from '@/lib/api';
import { getCountries, initialsFor, isValidCountryCode } from '@/i18n/countries';
import { mapSignupErrorToField } from './errorMapping';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils';
import { emailConfirmationEnabled } from '@/config/featureFlags';
import { SubscriptionTier, createCheckoutSession } from '@/lib/api/subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check } from 'lucide-react';

interface FormData {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  pronouns: string;
  bio: string;
  birthDate: string;
  country: string;
  gender: string;
  role: 'user' | 'partner' | 'patron';
  subscriptionTier?: SubscriptionTier;
}

const LocalSignUp: React.FC = () => {
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Unify translation shape: prefer signup.local when present
  const signup = useMemo(() => (t as any).signup?.local || (t as any).signup || {}, [t]);
  
  // Get plan from URL query parameter and convert to uppercase SubscriptionTier
  const planFromUrl = searchParams.get('plan');
  const initialSubscriptionTier = useMemo(() => {
    if (!planFromUrl) return undefined;
    const tierMap: Record<string, SubscriptionTier> = {
      'initiate': 'INITIATE',
      'journeyman': 'JOURNEYMAN',
      'sage': 'SAGE',
      'guildmaster': 'GUILDMASTER',
    };
    return tierMap[planFromUrl.toLowerCase()] || undefined;
  }, [planFromUrl]);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    pronouns: '',
    bio: '',
    birthDate: '',
    country: '',
        gender: '',
        role: 'user',
    subscriptionTier: initialSubscriptionTier
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [pronounsWasSet, setPronounsWasSet] = useState(false);
  const [genderWasSet, setGenderWasSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
        const [nickChecking, setNickChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const n = formData.nickname.trim();
    setNicknameAvailable(null);
    if (!n) { setNickChecking(false); return; }
    const h = setTimeout(async () => {
      try {
        setNickChecking(true);
        const available = await isNicknameAvailable(n);
        setNicknameAvailable(available);
        setErrors(prev => ({ ...prev, nickname: available ? undefined : (signup.validation?.nicknameTaken || 'Nickname already in use') }));
      } catch (error) {
        console.error('Nickname availability check failed:', error);
      }
      finally { setNickChecking(false); }
    }, 500);
    return () => clearTimeout(h);
  }, [formData.nickname]);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // Formats a Date to YYYY-MM-DD in local time without timezone shifts
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  const countries = useMemo(() => getCountries(language), [language]);
  const subscriptionTranslations = useMemo(() => (t as any)?.subscription || {}, [t]);
  const plansTranslations = subscriptionTranslations.plans || {};
  // Build diacritic-safe placeholders to keep queries robust across encodings
  const normalizeDisplay = (raw: string) => {
    try {
      return raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\uFFFD]/g, 'e');
    } catch {
      return raw;
    }
  };
  const pronounsPlaceholder = useMemo(() => {
    const raw = (signup.selectPronouns as string) || 'Select pronouns';
    return normalizeDisplay(raw);
  }, [signup.selectPronouns]);
  // TODO: Transform pronouns input into a select combo using these values.
  const pronounOptions = [
    { value: 'she/her', label: signup.options?.pronouns?.sheHer || 'She/Her' },
    { value: 'he/him', label: signup.options?.pronouns?.heHim || 'He/Him' },
    { value: 'they/them', label: signup.options?.pronouns?.theyThem || 'They/Them' },
    { value: 'she/they', label: signup.options?.pronouns?.sheThey || 'She/They' },
    { value: 'he/they', label: signup.options?.pronouns?.heThey || 'He/They' },
    { value: 'other', label: signup.options?.common?.other || 'Other' },
  ];
  // TODO: Add a Gender select combo bound to formData.gender using these values.
  const genderOptions = [
    { value: 'female', label: signup.options?.genders?.female || 'Female' },
    { value: 'male', label: signup.options?.genders?.male || 'Male' },
    { value: 'non-binary', label: signup.options?.genders?.nonBinary || 'Non-binary' },
    { value: 'transgender', label: signup.options?.genders?.transgender || 'Transgender' },
    { value: 'prefer-not', label: signup.options?.common?.preferNot || 'Prefer not to say' },
    { value: 'other', label: signup.options?.common?.other || 'Other' },
  ];
  const [countryQuery, setCountryQuery] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const countryInputRef = useRef<HTMLInputElement | null>(null);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const name = c.name.toLowerCase();
      const code = c.code.toLowerCase();
      const initials = initialsFor(c.name).toLowerCase();
      return name.includes(q) || code.startsWith(q) || initials.startsWith(q);
    });
  }, [countryQuery, countries]);

  // Max allowed birthdate is today minus 1 year
  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return formatDate(d);
  })();

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const validation = signup.validation || {};
    if (!formData.email) {
      newErrors.email = validation.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = validation.invalidEmail;
    } else if (emailAvailable === false) {
      newErrors.email = validation.emailTaken || 'Email already in use';
    }
    if (!formData.fullName) {
      newErrors.fullName = validation.required;
    }
    if (!formData.nickname) {
      newErrors.nickname = validation.required;
    }
    if (!formData.birthDate) {
      newErrors.birthDate = validation.required;
    } else {
      // Must be a valid date string and not later than (today - 1 year)
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(formData.birthDate)) {
        newErrors.birthDate = validation.invalidDate || 'Please enter a valid date (YYYY-MM-DD)';
      } else if (formData.birthDate > maxBirthDate) {
        newErrors.birthDate = validation.birthDateTooRecent || ('Birth date cannot be later than ' + maxBirthDate);
      }
    }
    if (formData.bio && formData.bio.length > 200) {
      newErrors.bio = validation.bioMaxLength || 'Bio must be 200 characters or fewer';
    }
    if (!formData.country) {
      newErrors.country = validation.required;
    } else if (!isValidCountryCode(formData.country)) {
      newErrors.country = validation.invalidCountry || validation.required;
    }
    // Optional fields with special rule: if user once selected a value and later cleared, require re-selection
    if (pronounsWasSet && !formData.pronouns) {
      (newErrors as any).pronouns = validation.required || 'This field is required';
    }
    if (genderWasSet && !formData.gender) {
      newErrors.gender = validation.required || 'This field is required';
    }
    if (!formData.password) {
      newErrors.password = validation.required;
    } else {
      const pwd = formData.password;
      const rules = [
        { test: (s: string) => s.length >= 8, msg: validation.passwordMinLength },
        { test: (s: string) => /[a-z]/.test(s), msg: validation.passwordLower || 'Must include a lowercase letter' },
        { test: (s: string) => /[A-Z]/.test(s), msg: validation.passwordUpper || 'Must include an uppercase letter' },
        { test: (s: string) => /[0-9]/.test(s), msg: validation.passwordDigit || 'Must include a digit' },
        { test: (s: string) => /[!@#$%^&*()\-_=+\[\]{};:,.?/]/.test(s), msg: validation.passwordSpecial || 'Must include a special character' },
      ];
      for (const r of rules) {
        if (!r.test(pwd)) { newErrors.password = r.msg; break; }
      }
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = validation.required;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = validation.passwordMismatch;
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  // Debounced email availability check as user types
  useEffect(() => {
    const validation = signup.validation || {};
    const email = formData.email.trim();
    setEmailAvailable(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailChecking(false);
      return;
    }
    let cancelled = false;
    setEmailChecking(true);
    const timer = setTimeout(async () => {
      try {
        const available = await isEmailAvailable(email);
        if (!cancelled) {
          setEmailAvailable(available);
          setErrors((prev) => ({
            ...prev,
            email: available ? undefined : (validation.emailTaken || 'Email already in use'),
          }));
        }
      } catch (error) {
        if (!cancelled) {
          // On failure, don't block, just clear checking state
          // The backend will validate email uniqueness during signup
          setEmailAvailable(null);
          console.debug('Email availability check failed:', error);
        }
      } finally {
        if (!cancelled) setEmailChecking(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.email, signup.validation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    // Clear availability status when email changes
    if (name === 'email') {
      setEmailAvailable(null);
    }
    if (name === 'pronouns' && value) {
      setPronounsWasSet(true);
    }
    if (name === 'gender' && value) {
      setGenderWasSet(true);
    }
  };

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email' && value.trim()) {
      const email = value.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        try {
          setEmailChecking(true);
          const available = await isEmailAvailable(email);
          setEmailAvailable(available);
          setErrors((prev) => ({
            ...prev,
            email: available ? undefined : (signup.validation?.emailTaken || 'Email already in use'),
          }));
        } catch (error) {
          // On failure, don't show availability status - leave it as unknown
          // The backend will validate email uniqueness during signup
          setEmailAvailable(null);
          console.debug('Email availability check failed on blur:', error);
        } finally {
          setEmailChecking(false);
        }
      }
    }
    
    if (name === 'nickname' && value.trim()) {
      const nickname = value.trim();
      try {
        setNickChecking(true);
        const available = await isNicknameAvailable(nickname);
        setNicknameAvailable(available);
        setErrors(prev => ({ 
          ...prev, 
          nickname: available ? undefined : (signup.validation?.nicknameTaken || 'Nickname already in use') 
        }));
      } catch (error) {
        console.error('Nickname availability check failed on blur:', error);
      } finally {
        setNickChecking(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!validate()) {
      return;
    }

    // Optional: server-side email uniqueness check via GraphQL
    try {
      const available = await isEmailAvailable(formData.email);
      if (!available) {
        setErrors((prev) => ({ ...prev, email: (signup.validation?.emailTaken as string) || 'Email already in use' }));
        return;
      }
    } catch (err) {
      // On check failure, proceed with signup (availability check is optional)
      // Don't block signup on availability check failure - let the backend handle it
    }

    setLoading(true);
    try {
      // Create user; status depends on feature flag
      const status = emailConfirmationEnabled ? 'email confirmation pending' : 'active';
      const selectedTier = formData.subscriptionTier;
      await createUser({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        status,
        role: 'user',
        nickname: formData.nickname,
        pronouns: formData.pronouns,
        bio: formData.bio,
        birthDate: formData.birthDate,
        country: formData.country,
        gender: formData.gender,
        subscriptionTier: selectedTier
        });
      
      if (emailConfirmationEnabled) {
        // Send email confirmation only when enabled
        await confirmEmail(formData.email);
        // Success copy depends on feature flag
        const successText = signup.successConfirmMessage || signup.successMessage;
        setSuccessMessage(successText);
        setFormData({
          email: '',
          fullName: '',
          password: '',
          confirmPassword: '',
          nickname: '',
          pronouns: '',
          bio: '',
          birthDate: '',
          country: '',
          gender: '',
          role: 'user',
          subscriptionTier: undefined,
        });
      } else {
        // If email confirmation is disabled, automatically log the user in
        // Add a small delay to ensure user account is fully created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const loginResponse = await login(formData.email, formData.password);
          
          // Store authentication tokens
          localStorage.setItem('auth', JSON.stringify(loginResponse));
          window.dispatchEvent(new CustomEvent('auth:change'));
          
          // If subscription tier was selected, redirect to Stripe checkout
          if (selectedTier) {
            try {
              const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
              const cancelUrl = `${window.location.origin}/dashboard`;
              const checkoutResponse = await createCheckoutSession(
                selectedTier,
                successUrl,
                cancelUrl
              );
              // Redirect to Stripe checkout
              window.location.href = checkoutResponse.url;
              return; // Exit early, user will be redirected
            } catch (checkoutError: any) {
              console.error('Failed to create checkout session:', checkoutError);
              // Continue with normal flow if checkout fails
              setErrorMessage(checkoutError?.message || 'Failed to create checkout session. You can subscribe later.');
            }
          }
          
          // Try to infer user type from token payload
          const token = loginResponse.id_token || loginResponse.access_token;
          let userType: 'user' | 'partner' | 'patron' = 'user';
          if (token && token.split('.').length >= 2) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const role = (payload?.role || payload?.user_type || '').toString().toLowerCase();
              if (role === 'partner' || role === 'patron' || role === 'user') {
                userType = role as any;
              }
            } catch {}
          }
          
          // Navigate to dashboard or subscription page
          const dest = userType ? `/dashboard?type=${encodeURIComponent(userType)}` : '/dashboard';
          navigate(dest, { replace: true });
        } catch (loginError: any) {
          // If auto-login fails, try once more after a longer delay
          try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retryLoginResponse = await login(formData.email, formData.password);
            
            // Store authentication tokens
            localStorage.setItem('auth', JSON.stringify(retryLoginResponse));
            window.dispatchEvent(new CustomEvent('auth:change'));
            
            // If subscription tier was selected, redirect to Stripe checkout
            if (selectedTier) {
              try {
                const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
                const cancelUrl = `${window.location.origin}/dashboard`;
                const checkoutResponse = await createCheckoutSession(
                  selectedTier,
                  successUrl,
                  cancelUrl
                );
                // Redirect to Stripe checkout
                window.location.href = checkoutResponse.url;
                return; // Exit early, user will be redirected
              } catch (checkoutError: any) {
                console.error('Failed to create checkout session:', checkoutError);
                // Continue with normal flow if checkout fails
                setErrorMessage(checkoutError?.message || 'Failed to create checkout session. You can subscribe later.');
              }
            }
            
            // Try to infer user type from token payload
            const token = retryLoginResponse.id_token || retryLoginResponse.access_token;
            let userType: 'user' | 'partner' | 'patron' = 'user';
            if (token && token.split('.').length >= 2) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = (payload?.role || payload?.user_type || '').toString().toLowerCase();
                if (role === 'partner' || role === 'patron' || role === 'user') {
                  userType = role as any;
                }
              } catch {}
            }
            
            // Navigate to dashboard or subscription page
            const dest = userType ? `/dashboard?type=${encodeURIComponent(userType)}` : '/dashboard';
            navigate(dest, { replace: true });
          } catch (retryError: any) {
            // If retry also fails, show success message and let user login manually
            setSuccessMessage(signup.successMessage || 'Account created successfully. Please log in.');
            setFormData({
              email: '',
              fullName: '',
              password: '',
              confirmPassword: '',
              nickname: '',
              pronouns: '',
              bio: '',
              birthDate: '',
              country: '',
              gender: '',
              role: 'user',
              subscriptionTier: undefined,
            });
          }
        }
      }
    } catch (error: any) {
      const mapped = mapSignupErrorToField(error, signup);
      if (mapped) {
        setErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }));
      } else {
        setErrorMessage(signup.errorMessage || error?.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">{signup.title}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="email" className="block font-medium mb-1">
            {signup.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="username"
            className={'w-full border rounded px-3 py-2 ' + (errors.email ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
          />
          {errors.email && (
            <p id="email-error" className="text-red-600 text-sm mt-1">
              {errors.email}
            </p>
          )}
        </div>
        {formData.email && !errors.email && (
  <div className="text-xs mt-[-8px] mb-2">
    {emailChecking ? (
      <span className="text-gray-500">{t.common.loading}</span>
    ) : emailAvailable === true ? (
      <span className="text-green-600">{(signup.validation?.emailAvailable as string) || t.common.success || 'Available'}</span>
    ) : emailAvailable === false ? (
      <span className="text-red-600">{(signup.validation?.emailTaken as string) || 'Email already in use'}</span>
    ) : null}
  </div>
)}

        <div className="mb-4">
          <label htmlFor="fullName" className="block font-medium mb-1">
            {signup.fullName}
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            className={'w-full border rounded px-3 py-2 ' + (errors.fullName ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.fullName}
            aria-describedby="fullName-error"
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-red-600 text-sm mt-1">
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="nickname" className="block font-medium mb-1">
            {signup.nickname || 'Nickname'}
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            value={formData.nickname}
            onChange={handleChange}
            onBlur={handleBlur}
            className={'w-full border rounded px-3 py-2 ' + (errors.nickname ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.nickname}
            aria-describedby="nickname-error"
          />
          {errors.nickname && (
            <p id="nickname-error" className="text-red-600 text-sm mt-1">
              {errors.nickname}
            </p>
          )}
        </div>
        {formData.nickname && !errors.nickname && (
          <div id="nickname-status" className="text-xs mt-[-8px] mb-2">
            {nickChecking ? (
              <span className="text-gray-500">{t.common.loading}</span>
            ) : nicknameAvailable === true ? (
              <span className="text-green-600">{(signup.validation?.nicknameAvailable as string) || (signup.validation?.available as string) || 'Available'}</span>
            ) : nicknameAvailable === false ? (
              <span className="text-red-600">{(signup.validation?.nicknameTaken as string) || 'Nickname already in use'}</span>
            ) : null}
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="pronouns" className="block font-medium mb-1">{signup.pronouns || 'Pronouns'}</label>
          <select
            id="pronouns"
            name="pronouns"
            value={formData.pronouns}
            onChange={handleChange}
            aria-label={(signup.pronouns as string) || 'Pronouns'}
            className={'w-full border rounded px-3 py-2 bg-white ' + ((errors as any).pronouns ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!(errors as any).pronouns}
            aria-describedby="pronouns-error"
          >
            <option value="">{pronounsPlaceholder}</option>
            {pronounOptions.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {(errors as any).pronouns && (
            <p id="pronouns-error" className="text-red-600 text-sm mt-1">{(errors as any).pronouns}</p>
          )}
        </div>

        {/* Gender select */}
        <div className="mb-4">
          <label htmlFor="gender" className="block font-medium mb-1">{signup.gender || 'Gender'}</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            aria-label={(signup.gender as string) || 'Gender'}
            className={'w-full border rounded px-3 py-2 bg-white ' + (errors.gender ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.gender}
            aria-describedby="gender-error"
          >
            <option value="">{signup.options?.common?.preferNot || 'Prefer not to say'}</option>
            {genderOptions.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          {errors.gender && (
            <p id="gender-error" className="text-red-600 text-sm mt-1">{errors.gender}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="birthDate" className="block font-medium mb-1">
            {signup.birthDate || 'Date of Birth'}
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
            max={maxBirthDate}
            className={'w-full border rounded px-3 py-2 ' + (errors.birthDate ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.birthDate}
            aria-describedby="birthDate-error"
          />
          {errors.birthDate && (
            <p id="birthDate-error" className="text-red-600 text-sm mt-1">
              {errors.birthDate}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="bio" className="block font-medium mb-1">
            {signup.bio || 'Bio'}
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={200}
            value={formData.bio}
            onChange={handleChange}
            className={'w-full border rounded px-3 py-2 ' + (errors.bio ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.bio}
            aria-describedby="bio-error"
          />
          <div className="text-xs text-gray-500 mt-1">{(formData.bio?.length || 0)}/200</div>
          {errors.bio && (
            <p id="bio-error" className="text-red-600 text-sm mt-1">
              {errors.bio}
            </p>
          )}
        </div>

        <div className="mb-4 relative">
          <label htmlFor="country" className="block font-medium mb-1">
            {signup.country || 'Country'}
          </label>
          <input
            id="country"
            name="countrySearch"
            ref={countryInputRef}
            autoComplete="off"
            placeholder={(() => {
              const raw = (signup.selectCountry as string) || 'Select your country';
              return normalizeDisplay(raw);
            })()}
            value={countryQuery}
            onChange={(e) => {
              setCountryQuery(e.target.value);
              setCountryOpen(true);
            }}
            onFocus={() => setCountryOpen(true)}
            onBlur={() => setTimeout(() => setCountryOpen(false), 150)}
            className={'w-full border rounded px-3 py-2 bg-white ' + (errors.country ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.country}
            aria-describedby="country-error"
          />
          {countryOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 bg-white shadow">
              {filteredCountries.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
              ) : (
                filteredCountries.slice(0, 50).map((c) => (
                  <button
                    type="button"
                    key={c.code}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, country: c.code }));
                      setErrors((prev) => ({ ...prev, country: undefined }));
                      setCountryQuery(c.name);
                      setCountryOpen(false);
                    }}
                  >
                    {c.name} ({c.code})
                  </button>
                ))
              )}
            </div>
          )}
          {errors.country && (
            <p id="country-error" className="text-red-600 text-sm mt-1">
              {errors.country}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block font-medium mb-1">
            {signup.password}
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full"
            inputClassName={cn('border rounded', errors.password ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
          />
          {errors.password && (
            <p id="password-error" className="text-red-600 text-sm mt-1">
              {errors.password}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block font-medium mb-1">
            {signup.confirmPassword}
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full"
            inputClassName={cn('border rounded', errors.confirmPassword ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirmPassword-error"
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-red-600 text-sm mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Subscription Selection Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {subscriptionTranslations.title || 'Choose a Subscription Plan'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {subscriptionTranslations.subtitle || 'Select a plan to get started, or continue with free tier'}
          </p>
          
          <Tabs 
            defaultValue={formData.subscriptionTier?.toLowerCase() || 'free'} 
            value={formData.subscriptionTier?.toLowerCase() || 'free'}
            onValueChange={(value) => {
              if (value === 'free') {
                setFormData(prev => ({ ...prev, subscriptionTier: undefined }));
              } else {
                setFormData(prev => ({ ...prev, subscriptionTier: value.toUpperCase() as SubscriptionTier }));
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 mb-4 h-auto">
              <TabsTrigger 
                value="free" 
                className={cn(
                  'text-xs sm:text-sm px-2 py-2 whitespace-nowrap',
                  !formData.subscriptionTier && 'bg-primary text-primary-foreground'
                )}
              >
                Free
              </TabsTrigger>
              {(['INITIATE', 'JOURNEYMAN', 'SAGE', 'GUILDMASTER'] as SubscriptionTier[]).map((tier) => {
                const planKey = tier.toLowerCase() as keyof typeof plansTranslations;
                const plan = plansTranslations[planKey] || {};
                const isSelected = formData.subscriptionTier === tier;
                const isPopular = plan.popular || false;
                const displayName = plan.name || tier;
                
                return (
                  <TabsTrigger 
                    key={tier} 
                    value={tier.toLowerCase()}
                    className={cn(
                      'relative text-xs sm:text-sm px-2 py-2 flex flex-col items-center gap-1 min-h-[3rem]',
                      isSelected && 'bg-primary text-primary-foreground',
                      isPopular && 'font-semibold'
                    )}
                  >
                    <span className="truncate w-full text-center">{displayName}</span>
                    {isPopular && (
                      <Badge className="h-4 px-1 text-[10px] leading-tight">Popular</Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            <TabsContent value="free" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Free Tier</CardTitle>
                  <CardDescription>Get started with basic features</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Basic quest templates</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Community access</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Standard support</span>
                    </li>
                  </ul>
                  {!formData.subscriptionTier && (
                    <div className="mt-4 text-center">
                      <Badge variant="default" className="bg-primary">
                        Selected
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {(['INITIATE', 'JOURNEYMAN', 'SAGE', 'GUILDMASTER'] as SubscriptionTier[]).map((tier) => {
              const planKey = tier.toLowerCase() as keyof typeof plansTranslations;
              const plan = plansTranslations[planKey] || {};
              const isSelected = formData.subscriptionTier === tier;
              
              return (
                <TabsContent key={tier} value={tier.toLowerCase()} className="mt-0">
                  <Card className={cn(
                    'relative',
                    isSelected && 'border-primary border-2'
                  )}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 right-4 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name || tier}</CardTitle>
                      <CardDescription>{plan.description || ''}</CardDescription>
                      <div className="mt-2">
                        <span className="text-4xl font-bold">{plan.price || '$0'}</span>
                        {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {(plan.features || []).map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {isSelected && (
                        <div className="mt-6 text-center">
                          <Badge variant="default" className="bg-primary text-lg px-4 py-2">
                            Selected Plan
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"

        >
          {loading ? t.common.loading : signup.submit}
        </button>
      </form>

      {successMessage && (
        <p className="mt-4 text-green-600" role="alert">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p className="mt-4 text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default LocalSignUp;
        {/* Gender select inserted above */}
