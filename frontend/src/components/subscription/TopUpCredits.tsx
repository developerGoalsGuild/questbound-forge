/**
 * TopUpCredits Component
 *
 * Allows users to purchase additional credits.
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { topUpCredits } from '@/lib/api/subscription';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface TopUpCreditsProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const TopUpCredits: React.FC<TopUpCreditsProps> = ({
  trigger,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const subscriptionTranslations = (t as any)?.subscription;
  const creditsTranslations = subscriptionTranslations?.credits || {};

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('10');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (credits: number) => topUpCredits(credits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      toast({
        title: creditsTranslations.addCredits || 'Credits Added',
        description: `${creditsTranslations.addCredits || 'Credits'} successfully added to your account`,
        variant: 'default',
      });
      setOpen(false);
      setAmount('10');
      setErrors({});
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      logger.error('Failed to top up credits', { error: error.message });
      toast({
        title: creditsTranslations.topUpFailed || 'Error',
        description: error.message || creditsTranslations.topUpFailed || 'Failed to top up credits',
        variant: 'destructive',
      });
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    // Clear error when user starts typing
    if (errors.amount) {
      setErrors(prev => {
        const { amount, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const creditsAmount = parseInt(amount, 10);
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!amount || isNaN(creditsAmount)) {
      newErrors.amount = creditsTranslations.amount || 'Amount is required';
    } else if (creditsAmount < 10) {
      newErrors.amount = creditsTranslations.minAmount || 'Minimum 10 credits ($5)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(creditsAmount);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Coins className="h-4 w-4 mr-2" />
      {creditsTranslations.topUp || 'Top Up Credits'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {creditsTranslations.topUp || 'Top Up Credits'}
          </DialogTitle>
          <DialogDescription>
            {creditsTranslations.minAmount || 'Minimum purchase: 10 credits ($5)'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {creditsTranslations.amount || 'Amount'} (credits)
              </Label>
              <Input
                id="amount"
                type="number"
                min="10"
                step="10"
                value={amount}
                onChange={handleAmountChange}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'error-amount' : undefined}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p id="error-amount" className="text-xs text-red-600" role="alert">
                  {errors.amount}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {creditsTranslations.minAmount || 'Minimum 10 credits ($5)'}
              </p>
            </div>

            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {mutation.error?.message || creditsTranslations.topUpFailed || 'Failed to top up credits'}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !!errors.amount}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  {creditsTranslations.addCredits || 'Add Credits'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

