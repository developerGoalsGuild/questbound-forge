import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { createUser, confirmEmail, isEmailAvailable, isNicknameAvailable } from '@/lib/api';
import { getCountries, initialsFor, isValidCountryCode } from '@/i18n/countries';

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
}

const LocalSignUp: React.FC = () => {
  const { t } = useTranslation();
  // Unify translation shape: prefer signup.local when present
  const signup = useMemo(() => (t as any).signup?.local || (t as any).signup || {}, [t]);
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
        gender: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
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
      } catch {}
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

  const { language } = useTranslation();
  const countries = useMemo(() => getCountries(language), [language]);
  const pronounOptions = [
    { value: 'she/her', label: signup.options?.pronouns?.sheHer || 'She/Her' },
    { value: 'he/him', label: signup.options?.pronouns?.heHim || 'He/Him' },
    { value: 'they/them', label: signup.options?.pronouns?.theyThem || 'They/Them' },
    { value: 'she/they', label: signup.options?.pronouns?.sheThey || 'She/They' },
    { value: 'he/they', label: signup.options?.pronouns?.heThey || 'He/They' },
    { value: 'other', label: signup.options?.common?.other || 'Other' },
  ];
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
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
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
    if (!formData.password) {
      newErrors.password = validation.required;
    } else if (formData.password.length < 8) {
      newErrors.password = validation.passwordMinLength;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = validation.required;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = validation.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Debounced email availability check as user types
  useEffect(() => {
    const validation = signup.validation || {};
    const email = formData.email.trim();
    setEmailAvailable(null);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
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
      } catch {
        if (!cancelled) {
          // On failure, don't block, just clear checking state
          setEmailAvailable(null);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!validate()) return;

    // Optional: server-side email uniqueness check via GraphQL
    try {
      const available = await isEmailAvailable(formData.email);
      if (!available) {
        setErrors((prev) => ({ ...prev, email: (signup.validation?.emailTaken as string) || 'Email already in use' }));
        return;
      }
    } catch (err) {
      // On check failure, proceed cautiously or surface a generic message
      // Here we choose to surface a validation-style message
      setErrors((prev) => ({ ...prev, email: (signup.validation?.emailTaken as string) || 'Email already in use' }));
      return;
    }

    setLoading(true);
    try {
      // Create user with status "email confirmation pending"
      await createUser({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        status: 'email confirmation pending',
        nickname: formData.nickname,
        pronouns: formData.pronouns,
        bio: formData.bio,
        birthDate: formData.birthDate,
        country: formData.country,
        gender: formData.gender
        });
      await confirmEmail(formData.email);
      setSuccessMessage(signup.successMessage);
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
      });
    } catch (error) {
      setErrorMessage(signup.errorMessage);
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
          <input
            id="pronouns"
            name="pronouns"
            type="text"
            value={formData.pronouns}
            onChange={handleChange}
            className={'w-full border rounded px-3 py-2 ' + ((errors as any).pronouns ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!(errors as any).pronouns}
            aria-describedby="pronouns-error"
          />
          {(errors as any).pronouns && (
            <p id="pronouns-error" className="text-red-600 text-sm mt-1">{(errors as any).pronouns}</p>
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
            placeholder={(signup.selectCountry as string) || 'Select your country'}
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
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className={'w-full border rounded px-3 py-2 ' + (errors.password ? 'border-red-500' : 'border-gray-300')}
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
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={'w-full border rounded px-3 py-2 ' + (errors.confirmPassword ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirmPassword-error"
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-red-600 text-sm mt-1">
              {errors.confirmPassword}
            </p>
          )}
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
