/**
 * BillingPortal Component
 *
 * Provides access to Stripe Customer Portal for managing billing.
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getBillingPortalUrl } from '@/lib/api/subscription';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BillingPortalProps {
  returnUrl?: string;
  variant?: 'button' | 'link';
  className?: string;
}

export const BillingPortal: React.FC<BillingPortalProps> = ({
  returnUrl,
  variant = 'button',
  className,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const subscriptionTranslations = (t as any)?.subscription;
  const billingTranslations = subscriptionTranslations?.billing || {};

  const [isOpening, setIsOpening] = useState(false);

  const mutation = useMutation({
    mutationFn: (url: string) => getBillingPortalUrl(url),
    onSuccess: (portalUrl) => {
      setIsOpening(false);
      if (!portalUrl) {
        toast({
          title: billingTranslations.portalFailed || 'Billing Portal Unavailable',
          description: billingTranslations.portalUnavailable || 'Billing portal is not available for this account.',
          variant: 'destructive',
        });
        return;
      }
      window.location.href = portalUrl;
    },
    onError: (error: any) => {
      setIsOpening(false);
      logger.error('Failed to get billing portal URL', { error: error.message });
      toast({
        title: billingTranslations.portalFailed || 'Error',
        description: error.message || billingTranslations.portalFailed || 'Failed to access billing portal',
        variant: 'destructive',
      });
    },
  });

  const handleOpenPortal = () => {
    setIsOpening(true);
    const url = returnUrl || window.location.href;
    mutation.mutate(url);
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleOpenPortal}
        disabled={isOpening || mutation.isPending}
        className={`text-primary hover:underline flex items-center gap-1 ${className}`}
      >
        {isOpening || mutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {billingTranslations.portal || 'Billing Portal'}
          </>
        ) : (
          <>
            {billingTranslations.portal || 'Billing Portal'}
            <ExternalLink className="h-3 w-3" />
          </>
        )}
      </button>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={handleOpenPortal}
        disabled={isOpening || mutation.isPending}
        variant="outline"
        data-testid="billing-portal-button"
      >
        {isOpening || mutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Opening...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {billingTranslations.manageBilling || 'Manage Billing'}
          </>
        )}
      </Button>

      {mutation.isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {mutation.error?.message || billingTranslations.portalFailed || 'Failed to access billing portal'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

