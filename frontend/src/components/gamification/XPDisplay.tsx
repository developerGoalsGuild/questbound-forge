/**
 * XP Display Component
 * Shows user's current XP, level, and progress
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp } from 'lucide-react';
import { getCurrentXP, XPSummary } from '@/lib/api/gamification';
import { useTranslation } from '@/hooks/useTranslation';

interface XPDisplayProps {
  userId?: string;
  className?: string;
}

export function XPDisplay({ userId, className }: XPDisplayProps) {
  const { t } = useTranslation();
  const [xpSummary, setXpSummary] = useState<XPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchXP = async () => {
      try {
        setLoading(true);
        setError(null);
        const summary = await getCurrentXP();
        setXpSummary(summary);
      } catch (err) {
        console.error('Failed to fetch XP:', err);
        setError(err instanceof Error ? err.message : 'Failed to load XP');
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
    return null; // Fail silently
  }

  const progressPercentage = Math.round(xpSummary.xpProgress * 100);
  const xpRemaining = xpSummary.xpForNextLevel - xpSummary.totalXp;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t?.gamification?.xp?.title || 'Experience Points'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{xpSummary.totalXp.toLocaleString()} XP</span>
            <span className="text-lg font-semibold text-blue-600">
              Level {xpSummary.currentLevel}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
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
        </div>
      </CardContent>
    </Card>
  );
}

