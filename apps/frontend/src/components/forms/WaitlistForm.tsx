import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { subscribeToWaitlist, WaitlistResponse } from '@/lib/api';
import ARIALiveRegion, { FormAnnouncements } from '@/components/ui/ARIALiveRegion';
import NetworkErrorRecovery from '@/components/ui/NetworkErrorRecovery';
import { Loader2, Check, Mail } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface WaitlistFormProps {
  className?: string;
  variant?: 'default' | 'inline' | 'compact';
}

const WaitlistForm = ({ className = '', variant = 'default' }: WaitlistFormProps) => {
  const { t } = useTranslation();
  const waitlistT = (t as any).waitlist || {};
  const isOnline = useOnlineStatus();
  
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'polite' | 'assertive'>('polite');

  const validateEmail = useCallback((emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  }, []);

  const handleFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
    if (hasValidationErrors) {
      setHasValidationErrors(false);
    }
    if (success) {
      setSuccess(false);
    }
  }, [error, hasValidationErrors, success]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);
    setHasValidationErrors(false);
    setAnnouncement('');

    // Validate email
    if (!email.trim()) {
      const errorMsg = waitlistT.validation?.emailRequired || 'Email is required';
      setError(errorMsg);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.fieldRequired('Email'));
      setAnnouncementPriority('assertive');
      return;
    }

    if (!validateEmail(email)) {
      const errorMsg = waitlistT.validation?.emailInvalid || 'Please enter a valid email address';
      setError(errorMsg);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.validationError('Email'));
      setAnnouncementPriority('assertive');
      return;
    }

    setSubmitting(true);
    setAnnouncement(waitlistT.messages?.submitting || 'Submitting...');
    setAnnouncementPriority('polite');

    try {
      const response: WaitlistResponse = await subscribeToWaitlist(email.trim());
      
      setSuccess(true);
      setEmail('');
      setError(null);
      setAnnouncement(response.message || waitlistT.messages?.success || 'Successfully subscribed to waitlist');
      setAnnouncementPriority('polite');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setAnnouncement('');
      }, 5000);
    } catch (err: any) {
      const errorMessage = err?.message || waitlistT.messages?.error || 'Something went wrong. Please try again later.';
      setError(errorMessage);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.formError(errorMessage));
      setAnnouncementPriority('assertive');
    } finally {
      setSubmitting(false);
    }
  }, [email, validateEmail, waitlistT]);

  const handleRetry = useCallback(async () => {
    if (email && !submitting) {
      await handleSubmit(new Event('submit') as any);
    }
  }, [email, submitting, handleSubmit]);

  const handleCheckStatus = useCallback(() => {
    // Check network status - useOnlineStatus hook handles this
    if (isOnline) {
      setAnnouncement(FormAnnouncements.networkRestored());
      setAnnouncementPriority('polite');
    }
  }, [isOnline]);

  const isCompact = variant === 'compact';
  const isInline = variant === 'inline';

  return (
    <div className={className}>
      <ARIALiveRegion 
        message={announcement} 
        priority={announcementPriority} 
        className="sr-only"
      />
      
      <NetworkErrorRecovery
        isOnline={isOnline}
        hasError={!!error && !hasValidationErrors}
        errorMessage={error || ''}
        onRetry={handleRetry}
        onCheckStatus={handleCheckStatus}
        showAutoRetry={true}
        autoRetryDelay={5}
        maxAutoRetries={3}
        variant="inline"
      />

      <form onSubmit={handleSubmit} noValidate role="form" aria-label="Waitlist subscription form">
        <div className={isInline ? 'flex gap-2' : isCompact ? 'space-y-2' : 'space-y-4'}>
          <div className={isInline ? 'flex-1' : ''}>
            <label htmlFor="waitlist-email" className="sr-only">
              {waitlistT.labels?.email || 'Email address'}
            </label>
            <Input
              id="waitlist-email"
              type="email"
              value={email}
              onChange={handleFieldChange}
              placeholder={waitlistT.placeholder || 'Enter your email'}
              disabled={submitting}
              aria-invalid={!!error}
              aria-describedby={error ? 'waitlist-error' : success ? 'waitlist-success' : undefined}
              className={error ? 'border-red-500' : ''}
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={submitting || hasValidationErrors || !email.trim()}
            className={isInline ? 'whitespace-nowrap' : 'w-full'}
            size={isCompact ? 'sm' : 'default'}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {waitlistT.button?.submitting || 'Joining...'}
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {waitlistT.button?.success || 'Subscribed!'}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                {waitlistT.button?.submit || 'Join the Community'}
              </>
            )}
          </Button>
        </div>

        {error && (
          <p
            id="waitlist-error"
            className="text-xs text-red-600 mt-2"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            id="waitlist-success"
            className="text-xs text-green-600 mt-2"
            role="alert"
            aria-live="polite"
          >
            {waitlistT.messages?.success || 'Thank you for joining! We\'ll be in touch soon.'}
          </p>
        )}

        {!isCompact && (
          <p className="text-xs text-muted-foreground mt-2">
            {waitlistT.note || 'Join the community that\'s already changing lives. No spam, just results.'}
          </p>
        )}
      </form>
    </div>
  );
};

export default WaitlistForm;
