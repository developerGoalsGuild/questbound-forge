import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { login as apiLogin, LoginResponse } from '@/lib/api';
import { PasswordInput } from '@/components/ui/password-input';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // basic validation
      const emailTrim = email.trim();
      const pwdTrim = password.trim();
      const emailRe = /.+@.+\..+/;
      if (!emailTrim) {
        setError(t?.login?.validation?.requiredEmail || 'Email is required');
        return;
      }
      if (!emailRe.test(emailTrim)) {
        setError(t?.login?.validation?.invalidEmail || 'Please enter a valid email address');
        return;
      }
      if (!pwdTrim) {
        setError(t?.login?.validation?.requiredPassword || 'Password is required');
        return;
      }

      const resp: LoginResponse = await apiLogin(emailTrim, pwdTrim);
      try {
        localStorage.setItem('auth', JSON.stringify(resp));
        window.dispatchEvent(new CustomEvent('auth:change'));
      } catch {}

      // Try to infer user type from token payload (id_token preferred)
      const token = resp.id_token || resp.access_token;
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
      const dest = userType ? `/dashboard?type=${encodeURIComponent(userType)}` : '/dashboard';
      window.location.href = dest;
    } catch (err: any) {
      const msg = err?.message || t?.login?.messages?.loginFailed || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = (provider: 'google' | 'apple' | 'facebook' | 'twitter') => {
    // Redirect to Cognito Hosted UI with the selected identity provider
    const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
    const redirectUri = (import.meta.env.VITE_COGNITO_REDIRECT_SIGNIN as string | undefined) || window.location.origin + '/dashboard';
    const scope = (import.meta.env.VITE_COGNITO_SCOPE as string | undefined) || 'openid+email+profile';

    if (!domain || !clientId) {
      console.error('Cognito Hosted UI env vars missing. Set VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID.');
      return;
    }

    // Cognito provider names
    const idpMap: Record<string, string> = {
      google: 'Google',
      apple: 'SignInWithApple',
      facebook: 'Facebook',
      twitter: 'Twitter'
    };
    const idp = idpMap[provider];
    // Note: Twitter requires a custom OIDC/SAML IdP to be configured in Cognito. If not present, this will not work.

    const url = new URL(`https://${domain}/oauth2/authorize`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scope);
    if (idp) url.searchParams.set('identity_provider', idp);
    window.location.assign(url.toString());
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.483 32.659 29.102 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.706 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.652-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.339 16.108 18.839 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.706 4 24 4 15.317 4 7.989 9.063 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.047 0 9.62-1.932 13.09-5.071l-6.047-5.129C29.003 35.053 26.64 36 24 36c-5.077 0-9.447-3.321-11.017-7.922l-6.55 5.046C8.096 39.063 15.46 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.023 3.159-3.262 5.649-6.258 7.031l.001-.001 6.047 5.129C37.803 37.348 40 31.137 40 24c0-1.341-.138-2.652-.389-3.917z"/>
    </svg>
  );

  const AppleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.665 16.27c-.27.62-.593 1.187-.97 1.703-.51.71-1.106 1.07-1.79 1.082-.43 0-.95-.124-1.56-.374-.61-.25-1.17-.375-1.68-.375-.53 0-1.1.125-1.71.375-.62.25-1.13.377-1.53.377-.66-.012-1.26-.36-1.8-1.046-.39-.51-.73-1.09-1.02-1.74-.45-.99-.68-1.95-.68-2.87 0-1.06.23-1.98.69-2.75.44-.73 1.02-1.1 1.73-1.113.42-.008.98.134 1.67.426.69.292 1.23.438 1.63.438.37 0 .9-.15 1.6-.45.7-.3 1.29-.45 1.78-.45.65.01 1.22.2 1.7.57.26.2.49.44.69.72-.82.5-1.37 1.2-1.64 2.1-.17.56-.2 1.1-.07 1.63.18.76.62 1.38 1.33 1.86.39.27.82.45 1.3.53-.04.11-.09.23-.14.35zM14.92 3.44c0 .5-.18 1.02-.53 1.57-.43.63-.96 1.03-1.53 1.2-.15.04-.3.06-.45.06-.02-.06-.03-.14-.03-.24 0-.53.22-1.1.62-1.62.21-.28.48-.52.81-.72.33-.2.64-.32.94-.35.03.07.05.15.05.23z"/>
    </svg>
  );

  const FacebookIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06C2 17.08 5.66 21.21 10.44 22v-7.03H7.9v-2.91h2.54V9.41c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22C18.34 21.21 22 17.08 22 12.06z"/>
    </svg>
  );

  const XIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.9 3H22l-7.05 8.06L23 21h-6.9l-4.46-5.24L5.6 21H2.5l7.53-8.61L1 3h7l4 4.71L18.9 3zm-2.42 16h1.91L7.64 5H5.64l10.84 14z"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6 text-foreground">
          {t?.login?.title || t?.nav?.login || 'Sign In'}
        </h1>
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-muted-foreground">{t?.login?.emailLabel || 'Email'}</label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t?.login?.emailPlaceholder || 'you@example.com'}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-muted-foreground">{t?.login?.passwordLabel || 'Password'}</label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t?.login?.passwordPlaceholder || '••••••••'}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (t?.common?.loading || 'Loading...') : (t?.login?.submit || t?.nav?.login || 'Sign In')}
          </Button>
        </form>
        <div className="text-sm text-muted-foreground mt-4 flex items-center justify-between">
          <a href="/signup/LocalSignUp" className="hover:text-foreground">{t?.nav?.signup || 'Create account'}</a>
          <a href="#" className="hover:text-foreground">{t?.login?.forgotPassword || 'Forgot password?'}</a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-muted-foreground">{t?.login?.orContinueWith || 'or continue with'}</span>
          <div className="h-px bg-border flex-1" />
        </div>

        {/* Social Providers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={() => socialLogin('google')}>
            <GoogleIcon />
            Google
          </Button>
          <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={() => socialLogin('apple')}>
            <AppleIcon />
            Apple
          </Button>
          <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={() => socialLogin('facebook')}>
            <FacebookIcon />
            Facebook
          </Button>
          <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={() => socialLogin('twitter')}>
            <XIcon />
            Twitter (X)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
