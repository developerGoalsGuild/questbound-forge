/**
 * PlanCard Component
 *
 * Displays a subscription plan card with features and pricing.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionTier } from '@/lib/api/subscription';

interface PlanCardProps {
  tier: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  currentPlan?: boolean;
  onSelect: (tier: SubscriptionTier) => void;
  disabled?: boolean;
  'data-testid'?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  tier,
  name,
  price,
  period,
  description,
  features,
  cta,
  popular = false,
  currentPlan = false,
  onSelect,
  disabled = false,
  'data-testid': testId,
}) => {
  return (
    <Card
      className={cn(
        'relative flex flex-col h-full',
        popular && 'border-primary shadow-lg scale-105',
        currentPlan && 'border-green-500'
      )}
      data-testid={testId || 'plan-card'}
      data-tier={tier}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}
      
      {currentPlan && (
        <Badge className="absolute -top-3 right-4 bg-green-500">
          Current Plan
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground ml-1">{period}</span>}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onSelect(tier)}
          disabled={disabled || currentPlan}
          className="w-full"
          variant={popular ? 'default' : 'outline'}
        >
          {currentPlan ? 'Current Plan' : cta}
        </Button>
      </CardFooter>
    </Card>
  );
};

