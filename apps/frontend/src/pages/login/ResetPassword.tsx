import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { useTranslation } from '@/hooks/useTranslation';
import { resetPassword } from '@/lib/api';
import { logger } from '@/lib/logger';
import { loginTranslations } from '@/i18n/login';
import { Globe } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Language } from '@/i18n/translations';

const ResetPassword = () => {
  const { t, language, setLanguage } = useTranslation();
  // Access login translations directly from the translation file with safe fallback
  const loginT = loginTranslations[language] || loginTranslations.en;
  
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  // Ensure reset password page follows language selected on main page
  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem('userLanguage');
      if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'es' || storedLanguage === 'fr')) {
        const storedLang = storedLanguage as Language;
        if (storedLang !== language) {
          setLanguage(storedLang);
        }
      }
    } catch (e) {
      // localStorage not available or error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - context handles updates during navigation

  // Listen for storage events to sync language changes across tabs/pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userLanguage' && e.newValue) {
        const newLang = e.newValue as Language;
        if ((newLang === 'en' || newLang === 'es' || newLang === 'fr') && newLang !== language) {
          setLanguage(newLang);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language, setLanguage]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  useEffect(() => {
    if (!token) {
      setError(loginT?.invalidResetToken || 'Invalid or missing reset token');
    }
  }, [token, loginT]);

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return loginT?.validation?.passwordRequired || loginT?.validation?.requiredPassword || 'Password is required';
    }
    
    const rules = [
      { test: (s: string) => s.length >= 8, msg: loginT?.validation?.passwordMinLength || 'Password must be at least 8 characters' },
      { test: (s: string) => /[a-z]/.test(s), msg: loginT?.validation?.passwordLower || 'Must include a lowercase letter' },
      { test: (s: string) => /[A-Z]/.test(s), msg: loginT?.validation?.passwordUpper || 'Must include an uppercase letter' },
      { test: (s: string) => /[0-9]/.test(s), msg: loginT?.validation?.passwordDigit || 'Must include a digit' },
      { test: (s: string) => /[!@#$%^&*()\-_=+\[\]{};:,.?/]/.test(s), msg: loginT?.validation?.passwordSpecial || 'Must include a special character' },
    ];
    
    for (const r of rules) {
      if (!r.test(password)) {
        return r.msg;
      }
    }
    
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    
    if (!token) {
      setError(loginT?.invalidResetToken || 'Invalid or missing reset token');
      return;
    }
    
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = loginT?.validation?.passwordRequired || loginT?.validation?.requiredPassword || 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = loginT?.validation?.passwordMismatch || 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      logger.info('Password reset successful');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: loginT?.passwordResetSuccess || 'Password reset successfully. Please log in with your new password.' } });
      }, 2000);
    } catch (err: any) {
      const msg = err?.message || loginT?.messages?.resetFailed || 'Failed to reset password';
      setError(msg);
      logger.error('Password reset failed', { error: err });
      
      // Check for specific error messages
      if (msg.toLowerCase().includes('expired')) {
        setError(loginT?.expiredResetToken || 'Reset token has expired. Please request a new password reset.');
      } else if (msg.toLowerCase().includes('invalid')) {
        setError(loginT?.invalidResetToken || 'Invalid reset token. Please request a new password reset.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm relative">
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" aria-label="Select language">
                  <Globe className="h-4 w-4" />
                  {languages.find(lang => lang.code === language)?.flag}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      try {
                        localStorage.setItem('userLanguage', lang.code);
                      } catch (e) {
                        // localStorage not available
                      }
                    }}
                    className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <h1 className="text-2xl font-semibold mb-4 text-foreground pr-16">
            {loginT?.resetPasswordTitle || 'Reset Password'}
          </h1>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-800 dark:text-red-200" role="alert">
              {loginT?.invalidResetToken || 'Invalid or missing reset token'}
            </p>
          </div>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            {loginT?.requestNewReset || 'Request a new password reset'}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm relative">
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" aria-label="Select language">
                  <Globe className="h-4 w-4" />
                  {languages.find(lang => lang.code === language)?.flag}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      try {
                        localStorage.setItem('userLanguage', lang.code);
                      } catch (e) {
                        // localStorage not available
                      }
                    }}
                    className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <h1 className="text-2xl font-semibold mb-4 text-foreground pr-16">
            {loginT?.resetPasswordTitle || 'Reset Password'}
          </h1>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-4">
            <p className="text-sm text-green-800 dark:text-green-200" role="alert">
              {loginT?.passwordResetSuccess || 'Password reset successfully. Redirecting to login...'}
            </p>
          </div>
          <Link to="/login" className="text-sm text-primary hover:underline">
            {loginT?.goToLogin || 'Go to login'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm relative">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label="Select language">
                <Globe className="h-4 w-4" />
                {languages.find(lang => lang.code === language)?.flag}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    try {
                      localStorage.setItem('userLanguage', lang.code);
                    } catch (e) {
                      // localStorage not available
                    }
                  }}
                  className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h1 className="text-2xl font-semibold mb-2 text-foreground pr-16">
          {loginT?.resetPasswordTitle || 'Reset Password'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {loginT?.resetPasswordDescription || 'Enter your new password below.'}
        </p>
        
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm mb-1 text-muted-foreground">
              {loginT?.newPasswordLabel || 'New Password'}
            </label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) {
                  setErrors(prev => {
                    const { newPassword, ...rest } = prev;
                    return rest;
                  });
                }
                if (error) setError(null);
              }}
              placeholder={loginT?.passwordPlaceholder || '••••••••'}
              aria-invalid={!!errors.newPassword}
              aria-describedby={errors.newPassword ? 'error-newPassword' : undefined}
            />
            {errors.newPassword && (
              <p id="error-newPassword" className="text-xs text-red-600 mt-1" role="alert">
                {errors.newPassword}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm mb-1 text-muted-foreground">
              {loginT?.confirmPasswordLabel || 'Confirm Password'}
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => {
                    const { confirmPassword, ...rest } = prev;
                    return rest;
                  });
                }
                if (error) setError(null);
              }}
              placeholder={loginT?.passwordPlaceholder || '••••••••'}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'error-confirmPassword' : undefined}
            />
            {errors.confirmPassword && (
              <p id="error-confirmPassword" className="text-xs text-red-600 mt-1" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200" role="alert">
                {error}
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (t?.common?.loading || 'Loading...') : (loginT?.submitReset || 'Reset Password')}
          </Button>
          
          <div className="text-sm text-muted-foreground text-center">
            <Link to="/login" className="hover:text-foreground">
              {loginT?.backToLogin || 'Back to login'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
