/**
 * Badge Display Component
 * Shows user's earned badges
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getMyBadges, getUserBadges, UserBadge } from '@/lib/api/gamification';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  userId?: string;
  className?: string;
}

export function BadgeDisplay({ userId, className }: BadgeDisplayProps) {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        setError(null);
        if (userId) {
          const response = await getUserBadges(userId);
          setBadges(response.badges);
        } else {
          const response = await getMyBadges();
          setBadges(response.badges);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load badges';
        console.error('Failed to fetch badges:', err);
        setError(message);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  useEffect(() => {
    if (!loading && badges.length > 0 && cardRef.current) {
      cardRef.current.focus();
    }
  }, [loading, badges.length]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || badges.length === 0) {
    return (
      <Card className={className} aria-live="polite">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            {t?.gamification?.badges?.title || 'Badges'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={cn('text-sm text-center py-4', error ? 'text-red-600' : 'text-muted-foreground')}
            data-testid="no-badges-message"
            role={error ? 'alert' : 'status'}
          >
            {error || t?.gamification?.badges?.noBadges || 'No badges earned yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-purple-500 bg-purple-50';
      case 'epic':
        return 'border-blue-500 bg-blue-50';
      case 'rare':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <Card
      className={cn('outline-none focus-visible:ring-2 focus-visible:ring-offset-2', className)}
      data-testid="badge-display"
      tabIndex={-1}
      ref={cardRef}
      aria-live="polite"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="badge-title">
          <Award className="h-5 w-5 text-yellow-500" />
          {t?.gamification?.badges?.title || 'Badges'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="badge-grid">
          {badges.map((badge) => (
            <div
              key={badge.badge.badgeId}
              className={`flex flex-col items-center p-4 rounded-lg border-2 ${getRarityColor(badge.definition.rarity)}`}
              title={badge.definition.description}
              data-testid={`badge-${badge.badge.badgeId}`}
              data-rarity={badge.definition.rarity}
              data-category={badge.definition.category}
            >
              <Award className="h-12 w-12 mb-2" />
              <p className="text-xs font-medium text-center">{badge.definition.name}</p>
            </div>
          ))}
          <p className="sr-only">
            {t?.gamification?.badges?.earned || 'Earned Badges'}: {badges.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

