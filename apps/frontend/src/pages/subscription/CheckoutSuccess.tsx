/**
 * CheckoutSuccess Page Component
 *
 * Displays success message after successful subscription checkout.
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getCurrentSubscription } from '@/lib/api/subscription';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import ARIALiveRegion from '@/components/ui/ARIALiveRegion';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const subscriptionTranslations = (t as any)?.subscription || {};
  const checkoutTranslations = subscriptionTranslations.checkout || {};

  const sessionId = searchParams.get('session_id');
  const [pollAttempts, setPollAttempts] = React.useState(0);
  const [shouldPoll, setShouldPoll] = React.useState(Boolean(sessionId));
  const maxPollAttempts = 10;

  // Refetch subscription to get updated status
  const { data: subscription, isLoading, isFetching } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: getCurrentSubscription,
    enabled: shouldPoll,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    refetchInterval: shouldPoll ? 2000 : false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    onSuccess: (data) => {
      if (data?.has_active_subscription) {
        setShouldPoll(false);
        return;
      }
      setPollAttempts((prev) => {
        const next = prev + 1;
        if (next >= maxPollAttempts) {
          setShouldPoll(false);
        }
        return next;
      });
    },
  });

  React.useEffect(() => {
    setShouldPoll(Boolean(sessionId));
    setPollAttempts(0);
  }, [sessionId]);

  React.useEffect(() => {
    if (subscription?.has_active_subscription) {
      toast({
        title: checkoutTranslations.success || 'Payment Successful!',
        description: 'Your subscription has been activated',
        variant: 'default',
      });
    }
  }, [subscription, toast, checkoutTranslations]);

  const isProcessing = isLoading || isFetching || (shouldPoll && !subscription?.has_active_subscription);
  const hasTimedOut = !shouldPoll && !subscription?.has_active_subscription;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {checkoutTranslations.processing || 'Processing...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {checkoutTranslations.success || 'Payment Successful!'}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {sessionId && `Session ID: ${sessionId}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isProcessing ? (
              <Alert>
                <AlertDescription>
                  {checkoutTranslations.verifying || 'Verifying your subscription...'}
                </AlertDescription>
              </Alert>
            ) : subscription?.has_active_subscription ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Your subscription has been successfully activated! You now have access to all premium features.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-4">
                  <Button onClick={() => navigate('/subscription/manage')}>
                    Manage Subscription
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  {hasTimedOut
                    ? checkoutTranslations.delayed || 'Your payment is taking longer than expected. Please refresh or contact support.'
                    : checkoutTranslations.error || 'Payment error occurred'}. Please contact support if you believe this is an error.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <ARIALiveRegion
          message={
            isProcessing
              ? checkoutTranslations.verifying || 'Verifying your subscription...'
              : subscription?.has_active_subscription
              ? checkoutTranslations.success || 'Payment Successful!'
              : checkoutTranslations.error || 'Payment error occurred'
          }
          priority="polite"
          className="sr-only"
        />
      </div>
    </div>
  );
};

export default CheckoutSuccess;

