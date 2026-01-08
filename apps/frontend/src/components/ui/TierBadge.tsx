/**
 * TierBadge Component
 *
 * Displays a subscription tier badge with appropriate styling.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, Star, Shield } from 'lucide-react';

export type SubscriptionTier = 'INITIATE' | 'JOURNEYMAN' | 'SAGE' | 'GUILDMASTER' | 'FREE';

interface TierBadgeProps {
  tier: SubscriptionTier;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  FREE: {
    label: 'Free',
    color: 'bg-gray-500 hover:bg-gray-600',
    icon: null,
  },
  INITIATE: {
    label: 'Initiate',
    color: 'bg-blue-500 hover:bg-blue-600',
    icon: Shield,
  },
  JOURNEYMAN: {
    label: 'Journeyman',
    color: 'bg-green-500 hover:bg-green-600',
    icon: Sparkles,
  },
  SAGE: {
    label: 'Radiant Sage',
    color: 'bg-purple-500 hover:bg-purple-600',
    icon: Star,
  },
  GUILDMASTER: {
    label: 'Guildmaster',
    color: 'bg-amber-500 hover:bg-amber-600',
    icon: Crown,
  },
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  className,
  showIcon = true,
  size = 'md',
}) => {
  const config = tierConfig[tier] || tierConfig.FREE;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      className={cn(
        config.color,
        sizeClasses[size],
        'text-white font-semibold',
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />}
      {config.label}
    </Badge>
  );
};

