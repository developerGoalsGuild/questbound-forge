import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestStatisticsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export const QuestStatisticsCard: React.FC<QuestStatisticsCardProps> = ({
  title,
  value,
  icon: Icon,
  className = '',
  description,
  trend,
}) => {
  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md h-full', className)}>
      <CardContent className="flex items-center p-6 h-full">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mr-4 flex-shrink-0">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mb-1">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground leading-tight">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
                aria-label={`Trend: ${trend.label}`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
