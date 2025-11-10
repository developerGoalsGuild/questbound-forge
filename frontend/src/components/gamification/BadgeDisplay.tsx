/**
 * Badge Display Component
 * Shows user's earned badges
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Badge {
  badge: {
    userId: string;
    badgeId: string;
    earnedAt: number;
    progress?: number;
    metadata?: any;
  };
  definition: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category: string;
    rarity: string;
  };
}

interface BadgeDisplayProps {
  userId?: string;
  className?: string;
}

export function BadgeDisplay({ userId, className }: BadgeDisplayProps) {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        setError(null);
        // TODO: Implement API call
        // const response = await getBadges(userId);
        // setBadges(response.badges);
        setBadges([]); // Placeholder
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        setError(err instanceof Error ? err.message : 'Failed to load badges');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            {t?.gamification?.badges?.title || 'Badges'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t?.gamification?.badges?.noBadges || 'No badges earned yet'}
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          {t?.gamification?.badges?.title || 'Badges'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.badge.badgeId}
              className={`flex flex-col items-center p-4 rounded-lg border-2 ${getRarityColor(badge.definition.rarity)}`}
              title={badge.definition.description}
            >
              <Award className="h-12 w-12 mb-2" />
              <p className="text-xs font-medium text-center">{badge.definition.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

