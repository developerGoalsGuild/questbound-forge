/**
 * SubscriptionPlans Page Component
 *
 * Displays available subscription plans and allows users to subscribe.
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanCard } from '@/components/subscription/PlanCard';
import { CreditBalance } from '@/components/subscription/CreditBalance';
import { getCurrentSubscription, createCheckoutSession, SubscriptionTier } from '@/lib/api/subscription';
import { logger } from '@/lib/logger';
import { Loader2, ArrowLeft } from 'lucide-react';

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const subscriptionTranslations = (t as any)?.subscription || {};
  const plansTranslations = subscriptionTranslations.plans || {};

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  // Fetch current subscription
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: getCurrentSubscription,
  });

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: (tier: SubscriptionTier) => {
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/subscription`;
      return createCheckoutSession(tier, successUrl, cancelUrl);
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      logger.error('Failed to create checkout session', { error: error.message });
      toast({
        title: subscriptionTranslations.errors?.checkoutFailed || 'Error',
        description: error.message || subscriptionTranslations.errors?.checkoutFailed || 'Failed to create checkout session',
        variant: 'destructive',
      });
      setSelectedTier(null);
    },
  });

  const handlePlanSelect = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    checkoutMutation.mutate(tier);
  };

  const currentTier = subscription?.plan_tier;

  const plans = [
    {
      tier: 'INITIATE' as SubscriptionTier,
      ...plansTranslations.initiate,
    },
    {
      tier: 'JOURNEYMAN' as SubscriptionTier,
      ...plansTranslations.journeyman,
    },
    {
      tier: 'SAGE' as SubscriptionTier,
      ...plansTranslations.sage,
    },
    {
      tier: 'GUILDMASTER' as SubscriptionTier,
      ...plansTranslations.guildmaster,
    },
  ];

  if (subscriptionLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
            {subscriptionTranslations.title || 'Subscription Plans'}
          </h1>
          <p className="text-muted-foreground">
            {subscriptionTranslations.subtitle || 'Choose the plan that fits your goals'}
          </p>
        </div>

        {/* Current Subscription Info */}
        {subscription?.has_active_subscription && currentTier && (
          <Alert className="mb-6">
            <AlertDescription>
              <strong>{subscriptionTranslations.currentPlan || 'Current Plan'}:</strong>{' '}
              {plansTranslations[currentTier.toLowerCase() as keyof typeof plansTranslations]?.name || currentTier}
              {subscription.cancel_at_period_end && (
                <span className="ml-2 text-orange-600">
                  ({subscriptionTranslations.billing?.cancelAtPeriodEnd || 'Cancels at period end'})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {subscriptionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {subscriptionTranslations.errors?.loadFailed || 'Failed to load subscription information'}
            </AlertDescription>
          </Alert>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="subscription-plans-grid">
          {plans.map((plan) => (
            <PlanCard
              key={plan.tier}
              tier={plan.tier}
              name={plan.name || plan.tier}
              price={plan.price || '$0'}
              period={plan.period || ''}
              description={plan.description || ''}
              features={plan.features || []}
              cta={plan.cta || 'Subscribe'}
              popular={plan.popular || false}
              currentPlan={currentTier === plan.tier}
              onSelect={handlePlanSelect}
              disabled={checkoutMutation.isPending || selectedTier === plan.tier}
              data-testid={`plan-card-${plan.tier.toLowerCase()}`}
            />
          ))}
        </div>

        {/* Credit Balance */}
        <div className="mb-8">
          <CreditBalance />
        </div>

        {/* Loading Overlay */}
        {checkoutMutation.isPending && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {subscriptionTranslations.checkout?.redirecting || 'Redirecting to checkout...'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlans;

