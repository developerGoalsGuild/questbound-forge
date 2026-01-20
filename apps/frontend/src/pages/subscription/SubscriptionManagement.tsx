/**
 * SubscriptionManagement Page Component
 *
 * Allows users to manage their current subscription, view billing info, and cancel/reactivate.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TierBadge } from '@/components/ui/TierBadge';
import { CreditBalance } from '@/components/subscription/CreditBalance';
import { BillingPortal } from '@/components/subscription/BillingPortal';
import { getCurrentSubscription, cancelSubscription } from '@/lib/api/subscription';
import { logger } from '@/lib/logger';
import { Loader2, ArrowLeft, CreditCard, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const subscriptionTranslations = (t as any)?.subscription || {};
  const billingTranslations = subscriptionTranslations.billing || {};

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch current subscription
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: getCurrentSubscription,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      toast({
        title: billingTranslations.cancel || 'Subscription Canceled',
        description: subscription?.cancel_at_period_end
          ? billingTranslations.cancelAtPeriodEnd || 'Your subscription will be canceled at the end of the billing period'
          : 'Your subscription has been canceled',
        variant: 'default',
      });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      logger.error('Failed to cancel subscription', { error: error.message });
      toast({
        title: subscriptionTranslations.errors?.cancelFailed || 'Error',
        description: error.message || subscriptionTranslations.errors?.cancelFailed || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {subscriptionTranslations.errors?.loadFailed || 'Failed to load subscription information'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = subscription?.has_active_subscription;
  const currentTier = subscription?.plan_tier;
  const status = subscription?.status;
  const currentPeriodEnd = subscription?.current_period_end;
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-2">
            {billingTranslations.title || 'Billing & Subscription'}
          </h1>
        </div>

        {/* Current Subscription Card */}
        <Card className="mb-6" data-testid="subscription-management-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{billingTranslations.currentPlan || 'Current Plan'}</span>
              {currentTier && <TierBadge tier={currentTier} />}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {status && (
                <Badge variant={status === 'active' ? 'default' : 'secondary'} className="mt-2">
                  {subscriptionTranslations[status] || status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasActiveSubscription ? (
              <>
                {currentPeriodEnd && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {billingTranslations.nextBilling || 'Next Billing Date'}:{' '}
                      <strong>{format(new Date(currentPeriodEnd), 'MMMM d, yyyy')}</strong>
                    </span>
                  </div>
                )}

                {cancelAtPeriodEnd && (
                  <Alert>
                    <AlertDescription>
                      {billingTranslations.cancelAtPeriodEnd || 'Your subscription will be canceled at the end of the billing period'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <BillingPortal returnUrl={window.location.href} />
                  
                  {!cancelAtPeriodEnd ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={cancelMutation.isPending}
                      data-testid="cancel-subscription-button"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {billingTranslations.cancelNow || 'Cancel Now'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reactivate would need to be implemented
                        toast({
                          title: 'Not Implemented',
                          description: 'Subscription reactivation is not yet implemented',
                          variant: 'default',
                        });
                      }}
                    >
                      {billingTranslations.reactivate || 'Reactivate Subscription'}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  You don't have an active subscription.{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate('/subscription')}
                  >
                    View Plans
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Credit Balance */}
        <CreditBalance className="mb-6" />

        {/* Cancel Subscription Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {billingTranslations.cancel || 'Cancel Subscription'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelMutation.isPending}>
                Keep Subscription
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Canceling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SubscriptionManagement;

