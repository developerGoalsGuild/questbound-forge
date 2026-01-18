import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { loginTranslations } from '@/i18n/login';
import { Globe } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Language } from '@/i18n/translations';
import { logger } from '@/lib/logger';
import { getApiBase } from '@/lib/utils';
import { resendConfirmationEmail } from '@/lib/api';

const ConfirmEmail = () => {
  const { t, language, setLanguage } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  // Access login translations directly from the translation file to ensure proper language updates
  const loginT = loginTranslations[language];
  
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string>('');

  // Ensure confirm email page follows language selected on main page
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

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage(loginT?.invalidToken || 'Invalid confirmation link. Please check your email and try again.');
        return;
      }

      try {
        const base = getApiBase();
        const apiKey = import.meta.env.VITE_API_GATEWAY_KEY || '';
        
        if (!base) {
          throw new Error('API base URL not configured');
        }

        const url = `${base.replace(/\/$/, '')}/users/confirm-email?token=${encodeURIComponent(token)}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['x-api-key'] = apiKey;

        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        const text = await response.text();
        let body: any = {};
        try {
          body = text ? JSON.parse(text) : {};
        } catch {}

        if (!response.ok) {
          const errorMsg = body.detail || body.message || response.statusText || 'Failed to confirm email';
          setStatus('error');
          setMessage(errorMsg);
          
          logger.error('Email confirmation failed', {
            status: response.status,
            statusText: response.statusText,
            errorBody: body,
            url,
            timestamp: new Date().toISOString()
          });
          return;
        }

        setStatus('success');
        setMessage(body.message || loginT?.messages?.emailConfirmed || 'Email confirmed successfully! You can now log in.');
        
        logger.info('Email confirmed successfully', {
          message: body.message,
          timestamp: new Date().toISOString()
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        const errorMsg = err?.message || 'Network error. Please check your connection and try again.';
        setStatus('error');
        setMessage(errorMsg);
        
        logger.error('Email confirmation error', {
          error: err?.message,
          errorType: err?.constructor?.name,
          errorStack: err?.stack,
          timestamp: new Date().toISOString()
        });
      }
    };

    confirmEmail();
  }, [token, navigate, loginT]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMessage('');
    setResendStatus('loading');

    const emailTrim = resendEmail.trim();
    if (!emailTrim) {
      setResendStatus('error');
      setResendMessage(loginT?.validation?.requiredEmail || 'Email is required');
      return;
    }
    if (!/.+@.+\..+/.test(emailTrim)) {
      setResendStatus('error');
      setResendMessage(loginT?.validation?.invalidEmail || 'Please enter a valid email address');
      return;
    }

    try {
      const result = await resendConfirmationEmail(emailTrim);
      setResendStatus('success');
      setResendMessage(result.message || loginT?.resendSuccess || 'If the account exists, a confirmation email has been sent.');
      logger.info('Resend confirmation sent', { email: emailTrim, timestamp: new Date().toISOString() });
    } catch (err: any) {
      const errorMsg = err?.message || (loginT?.resendFailed || 'Failed to resend confirmation email. Please try again.');
      setResendStatus('error');
      setResendMessage(errorMsg);
      logger.error('Resend confirmation error', {
        error: err?.message,
        errorType: err?.constructor?.name,
        errorStack: err?.stack,
        timestamp: new Date().toISOString()
      });
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
          {loginT?.confirmEmailTitle || 'Confirm Your Email'}
        </h1>

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {loginT?.confirmingEmail || 'Confirming your email address...'}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200" role="alert">
                {message}
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {loginT?.redirectingToLogin || 'Redirecting to login page...'}
            </p>
            <div className="flex items-center justify-center">
              <Link to="/login">
                <Button>
                  {loginT?.goToLogin || 'Go to Login'}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200" role="alert">
                {message}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {loginT?.resendHelp || 'Didn\'t receive the email? Enter your address to resend the confirmation link.'}
              </p>
              <form onSubmit={handleResend} className="space-y-2">
                <div>
                  <label htmlFor="resend-email" className="block text-sm mb-1 text-muted-foreground">
                    {loginT?.resendEmailLabel || 'Email Address'}
                  </label>
                  <Input
                    id="resend-email"
                    type="email"
                    autoComplete="email"
                    value={resendEmail}
                    onChange={(e) => {
                      setResendEmail(e.target.value);
                      if (resendStatus === 'error') {
                        setResendStatus('idle');
                        setResendMessage('');
                      }
                    }}
                    placeholder={loginT?.resendEmailPlaceholder || 'you@example.com'}
                    aria-invalid={resendStatus === 'error'}
                    aria-describedby={resendStatus === 'error' ? 'resend-email-error' : undefined}
                  />
                  {resendStatus === 'error' && (
                    <p id="resend-email-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                      {resendMessage}
                    </p>
                  )}
                  {resendStatus === 'success' && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1" role="alert">
                      {resendMessage}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={resendStatus === 'loading'}>
                  {resendStatus === 'loading'
                    ? (t?.common?.loading || 'Loading...')
                    : (loginT?.resendConfirmation || 'Resend confirmation email')}
                </Button>
              </form>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link to="/login" className="text-primary hover:underline">
                {loginT?.backToLogin || 'Back to login'}
              </Link>
              <Link to="/signup/LocalSignUp" className="text-primary hover:underline">
                {loginT?.signUp || 'Sign up'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
