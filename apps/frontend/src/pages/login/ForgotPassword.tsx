import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { requestPasswordReset } from '@/lib/api';
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

const ForgotPassword = () => {
  const { t, language, setLanguage } = useTranslation();
  // Access login translations directly from the translation file with safe fallback
  const loginT = loginTranslations[language] || loginTranslations.en;
  
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  // Ensure forgot password page follows language selected on main page
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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Function to translate API error messages
  const translateErrorMessage = (errorMessage: string): string => {
    if (!errorMessage) return loginT?.messages?.resetRequestFailed || 'Failed to request password reset';
    
    const msg = errorMessage.toLowerCase();
    
    // Map common API error messages to translated versions
    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      return loginT?.emailNotConfirmed || 'Email not confirmed. Please confirm your email before requesting a password reset.';
    }
    if (msg.includes('invalid') || msg.includes('invalid email')) {
      return loginT?.validation?.invalidEmail || 'Please enter a valid email address';
    }
    if (msg.includes('missing authentication token') || msg.includes('forbidden') || msg.includes('unauthorized')) {
      // API Gateway authentication error - this shouldn't happen for password reset, but handle gracefully
      return loginT?.messages?.resetRequestFailed || 'Unable to process password reset request. Please try again later.';
    }
    if (msg.includes('network error') || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection')) {
      return loginT?.messages?.resetRequestFailed || 'Network error. Please check your connection and try again.';
    }
    if (msg.includes('api base url not configured') || msg.includes('not configured')) {
      return loginT?.messages?.resetRequestFailed || 'Service configuration error. Please try again later.';
    }
    
    // If no match, return the original message or generic fallback
    return errorMessage || loginT?.messages?.resetRequestFailed || 'Failed to request password reset';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    const emailTrim = email.trim();
    
    try {
      const emailRe = /.+@.+\..+/;
      
      if (!emailTrim) {
        setError(loginT?.validation?.requiredEmail || 'Email is required');
        setLoading(false);
        return;
      }
      
      if (!emailRe.test(emailTrim)) {
        setError(loginT?.validation?.invalidEmail || 'Please enter a valid email address');
        setLoading(false);
        return;
      }

      await requestPasswordReset(emailTrim);
      setSuccess(true);
      logger.info('Password reset request submitted', { email: emailTrim });
    } catch (err: any) {
      // Extract error message from various error types
      let errorMsg = '';
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else if (err?.message) {
        errorMsg = err.message;
      } else if (err?.toString) {
        errorMsg = err.toString();
      } else {
        errorMsg = 'An unexpected error occurred';
      }
      
      const translatedMsg = translateErrorMessage(errorMsg);
      setError(translatedMsg);
      
      // Enhanced error logging - extract safe properties to avoid circular reference issues
      logger.error('Password reset request failed', {
        errorMessage: errorMsg,
        errorName: err?.name,
        errorType: err?.constructor?.name,
        errorStack: err?.stack,
        email: emailTrim,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

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
                  onClick={() => setLanguage(lang.code)}
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
          {loginT?.forgotPasswordTitle || 'Forgot Password'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {loginT?.forgotPasswordDescription || 'Enter your email address and we\'ll send you a link to reset your password.'}
        </p>
        
        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200" role="alert">
                {loginT?.resetLinkSent || 'If the account exists and email is confirmed, a reset link will be sent.'}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link to="/login" className="text-primary hover:underline">
                {loginT?.backToLogin || 'Back to login'}
              </Link>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm mb-1 text-muted-foreground">
                {loginT?.emailLabel || 'Email Address'}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={loginT?.emailPlaceholder || 'you@example.com'}
                aria-invalid={!!error}
                aria-describedby={error ? 'error-email' : undefined}
              />
              {error && (
                <p id="error-email" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                  {error}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (t?.common?.loading || 'Loading...') : (loginT?.submitResetRequest || 'Send Reset Link')}
            </Button>
            
            <div className="text-sm text-muted-foreground text-center">
              <Link to="/login" className="hover:text-foreground">
                {loginT?.backToLogin || 'Back to login'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
