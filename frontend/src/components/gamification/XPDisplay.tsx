/**
 * XP Display Component
 * Shows user's current XP, level, and progress
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp } from 'lucide-react';
import { getLevelProgress, LevelProgress } from '@/lib/api/gamification';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface XPDisplayProps {
  userId?: string;
  className?: string;
}

export function XPDisplay({ userId, className }: XPDisplayProps) {
  const { t } = useTranslation();
  const [xpSummary, setXpSummary] = useState<LevelProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchXP = async () => {
      try {
        setLoading(true);
        setError(null);
        const summary = await getLevelProgress();
        setXpSummary(summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load XP';
        console.error('Failed to fetch XP:', err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchXP();
  }, [userId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error || !xpSummary) {
    return (
      <Card className={className} aria-live="polite">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t?.gamification?.xp?.title || 'Experience Points'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600" role="alert">
            {error || (t?.common?.errors?.generic || 'Unable to load XP data')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.round(xpSummary.xpProgress * 100);
  const xpRemaining = xpSummary.xpForNextLevel - xpSummary.totalXp;
  const liveMessage =
    xpRemaining > 0
      ? `${progressPercentage}% ${t?.gamification?.xp?.progress || 'progress'}`
      : t?.gamification?.xp?.maxLevel || 'Max level reached!';

  return (
    <Card className={cn('outline-none focus-visible:ring-2 focus-visible:ring-offset-2', className)} data-testid="xp-display" tabIndex={-1} aria-live="polite">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="xp-title">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t?.gamification?.xp?.title || 'Experience Points'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div data-testid="xp-content">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold" data-testid="xp-amount">{xpSummary.totalXp.toLocaleString()} XP</span>
            <span className="text-lg font-semibold text-blue-600" data-testid="xp-level">
              Level {xpSummary.currentLevel}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100} data-testid="xp-progress-bar">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
              data-testid="xp-progress-fill"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {xpRemaining > 0
                ? `${xpRemaining.toLocaleString()} XP to next level`
                : 'Max level reached!'}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {progressPercentage}%
            </span>
          </div>
          <p className="sr-only" aria-live="polite">
            {liveMessage}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

