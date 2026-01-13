import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { requestPasswordReset } from '@/lib/api';
import { logger } from '@/lib/logger';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      const emailTrim = email.trim();
      const emailRe = /.+@.+\..+/;
      
      if (!emailTrim) {
        setError(t?.login?.validation?.requiredEmail || 'Email is required');
        setLoading(false);
        return;
      }
      
      if (!emailRe.test(emailTrim)) {
        setError(t?.login?.validation?.invalidEmail || 'Please enter a valid email address');
        setLoading(false);
        return;
      }

      await requestPasswordReset(emailTrim);
      setSuccess(true);
      logger.info('Password reset request submitted', { email: emailTrim });
    } catch (err: any) {
      const msg = err?.message || t?.login?.messages?.resetRequestFailed || 'Failed to request password reset';
      setError(msg);
      logger.error('Password reset request failed', { error: err, email });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2 text-foreground">
          {t?.login?.forgotPasswordTitle || 'Forgot Password'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t?.login?.forgotPasswordDescription || 'Enter your email address and we\'ll send you a link to reset your password.'}
        </p>
        
        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200" role="alert">
                {t?.login?.resetLinkSent || 'If the account exists and email is confirmed, a reset link will be sent.'}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link to="/login" className="text-primary hover:underline">
                {t?.login?.backToLogin || 'Back to login'}
              </Link>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm mb-1 text-muted-foreground">
                {t?.login?.emailLabel || 'Email Address'}
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
                placeholder={t?.login?.emailPlaceholder || 'you@example.com'}
                aria-invalid={!!error}
                aria-describedby={error ? 'error-email' : undefined}
              />
              {error && (
                <p id="error-email" className="text-xs text-red-600 mt-1" role="alert">
                  {error}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (t?.common?.loading || 'Loading...') : (t?.login?.submitResetRequest || 'Send Reset Link')}
            </Button>
            
            <div className="text-sm text-muted-foreground text-center">
              <Link to="/login" className="hover:text-foreground">
                {t?.login?.backToLogin || 'Back to login'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
