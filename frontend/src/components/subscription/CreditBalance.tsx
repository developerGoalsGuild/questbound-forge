/**
 * CreditBalance Component
 *
 * Displays the user's current credit balance with last top-up and reset information.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCreditBalance } from '@/lib/api/subscription';
import { useTranslation } from '@/hooks/useTranslation';
import { Coins, RefreshCw, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CreditBalanceProps {
  className?: string;
  showLastTopUp?: boolean;
  showLastReset?: boolean;
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  className,
  showLastTopUp = true,
  showLastReset = true,
}) => {
  const { t } = useTranslation();
  const subscriptionTranslations = (t as any)?.subscription;
  const creditsTranslations = subscriptionTranslations?.credits || {};

  const {
    data: creditData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: getCreditBalance,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {creditsTranslations.title || 'Credit Balance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {creditsTranslations.title || 'Credit Balance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {creditsTranslations.balanceFailed || 'Failed to load credit balance'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const balance = creditData?.balance || 0;
  const lastTopUp = creditData?.last_top_up;
  const lastReset = creditData?.last_reset;

  return (
    <Card className={className} data-testid="credit-balance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {creditsTranslations.title || 'Credit Balance'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {creditsTranslations.balance || 'Balance'}
            </p>
            <p className="text-3xl font-bold">
              {balance} <span className="text-lg text-muted-foreground">{creditsTranslations.credits || 'credits'}</span>
            </p>
          </div>
          <Badge
            variant={balance > 0 ? 'default' : 'secondary'}
            className="text-lg px-4 py-2"
          >
            {balance}
          </Badge>
        </div>

        {(showLastTopUp || showLastReset) && (
          <div className="space-y-2 text-sm text-muted-foreground">
            {showLastTopUp && lastTopUp && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>
                  {creditsTranslations.lastTopUp || 'Last Top-Up'}:{' '}
                  {formatDistanceToNow(new Date(lastTopUp), { addSuffix: true })}
                </span>
              </div>
            )}
            {showLastReset && lastReset && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {creditsTranslations.lastReset || 'Last Reset'}:{' '}
                  {formatDistanceToNow(new Date(lastReset), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        )}

        {balance === 0 && (
          <Alert>
            <AlertDescription>
              {creditsTranslations.insufficient || 'Insufficient Credits'}.{' '}
              <a
                href="/subscription/credits"
                className="font-medium underline hover:no-underline"
              >
                {creditsTranslations.buyMore || 'Buy More Credits'}
              </a>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

