import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ActiveGoalsBadgeProps } from '@/models/header';
import { cn } from '@/lib/utils';

const ActiveGoalsBadge: React.FC<ActiveGoalsBadgeProps> = ({
  count,
  isLoading,
  hasError,
  onRetry,
  className = '',
}) => {
  const getDisplayCount = () => {
    if (isLoading) return null;
    if (hasError) return '?';
    return count ?? 0;
  };

  const getBadgeVariant = () => {
    if (hasError) return 'destructive';
    if (count === 0) return 'secondary';
    if (count && count > 0) return 'default';
    return 'outline';
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }
    if (hasError) {
      return <AlertCircle className="h-3 w-3" />;
    }
    return <Target className="h-3 w-3" />;
  };

  const displayCount = getDisplayCount();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Goals Count Badge */}
      <Badge
        variant={getBadgeVariant()}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-semibold',
          'bg-white/20 text-white border-white/30',
          'shadow-md backdrop-blur-sm',
          'hover:bg-white/30 hover:shadow-lg',
          'transition-all duration-300 transform hover:scale-105',
          'font-cinzel tracking-wide',
          hasError && 'bg-red-500/20 text-red-100 border-red-400',
          count === 0 && 'bg-gray-500/20 text-gray-200 border-gray-400'
        )}
        role="status"
        aria-label={`${displayCount} active goals`}
      >
        {getIcon()}
        <span className="font-cinzel font-semibold">
          {displayCount !== null ? displayCount : '...'}
        </span>
        <span className="hidden sm:inline text-xs opacity-75">
          {isLoading ? 'Loading' : hasError ? 'Error' : 'Active'}
        </span>
      </Badge>

      {/* Retry Button (only shown on error) */}
      {hasError && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 w-6 p-0 text-white hover:text-white hover:bg-white/20"
          aria-label="Retry loading goals count"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default ActiveGoalsBadge;
