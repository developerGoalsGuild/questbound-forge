import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { createUser, isEmailAvailable, isNicknameAvailable, confirmEmail } from '@/lib/api';
import { getCountries, initialsFor, isValidCountryCode } from '@/i18n/countries';
import { mapSignupErrorToField } from './errorMapping';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils';
import { emailConfirmationEnabled } from '@/config/featureFlags';

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
        gender: '',
        role: 'user'
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
  const roleOptions = [
    { value: 'user', label: signup.options?.roles?.user || 'User' },
    { value: 'partner', label: signup.options?.roles?.partner || 'Partner' },
    { value: 'patron', label: signup.options?.roles?.patron || 'Patron' },
  ];

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
    if (name === 'pronouns' && value) {
      setPronounsWasSet(true);
    }
    if (name === 'gender' && value) {
      setGenderWasSet(true);
    }
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
      // Create user; status depends on feature flag
      const status = emailConfirmationEnabled ? 'email confirmation pending' : 'active';
      await createUser({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        status,
        role: formData.role,
        nickname: formData.nickname,
        pronouns: formData.pronouns,
        bio: formData.bio,
        birthDate: formData.birthDate,
        country: formData.country,
        gender: formData.gender
        });
      if (emailConfirmationEnabled) {
        // Send email confirmation only when enabled
        await confirmEmail(formData.email);
      }
      // Success copy depends on feature flag
      const successText = emailConfirmationEnabled
        ? (signup.successConfirmMessage || signup.successMessage)
        : signup.successMessage;
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
      });
    } catch (error: any) {
      const mapped = mapSignupErrorToField(error, signup);
      if (mapped) {
        setErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }));
      } else {
        setErrorMessage(signup.errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      {emailConfirmationEnabled && (
        <div role="note" className="mb-4 text-sm rounded border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2">
          {(signup.successConfirmMessage as string) || 'Email confirmation is required. Please check your inbox after signing up.'}
        </div>
      )}
      <h2 className="text-2xl font-semibold mb-4">{signup.title}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="role" className="block font-medium mb-1">
            {signup.role || 'Role'}
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={'w-full border rounded px-3 py-2 ' + (errors as any).role ? 'border-red-500' : 'border-gray-300'}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
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
          <select
            id="pronouns"
            name="pronouns"
            value={formData.pronouns}
            onChange={handleChange}
            className={'w-full border rounded px-3 py-2 bg-white ' + ((errors as any).pronouns ? 'border-red-500' : 'border-gray-300')}
            aria-invalid={!!(errors as any).pronouns}
            aria-describedby="pronouns-error"
          >
            <option value="">{signup.selectPronouns || 'Select pronouns'}</option>
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
