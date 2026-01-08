import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';
import { HourlyProductivity } from '@/models/analytics';
import { useTranslation } from 'react-i18next';

interface ProductivityHeatmapProps {
  data: HourlyProductivity[];
  className?: string;
}

export const ProductivityHeatmap: React.FC<ProductivityHeatmapProps> = ({ data, className }) => {
  const { t } = useTranslation('quest');

  const maxQuests = Math.max(...data.map(h => h.questsCompleted), 1);
  const maxXp = Math.max(...data.map(h => h.xpEarned), 1);

  const getIntensity = (value: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(value / max, 1);
  };

  const getColorClass = (intensity: number) => {
    if (intensity === 0) return 'bg-muted';
    if (intensity < 0.2) return 'bg-green-100 dark:bg-green-900/20';
    if (intensity < 0.4) return 'bg-green-200 dark:bg-green-800/30';
    if (intensity < 0.6) return 'bg-green-300 dark:bg-green-700/40';
    if (intensity < 0.8) return 'bg-green-400 dark:bg-green-600/50';
    return 'bg-green-500 dark:bg-green-500/60';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('analytics.charts.productivityByHour', 'Productivity by Hour')}
          </CardTitle>
          <CardDescription>
            {t('analytics.charts.productivityByHourDescription', 'When you complete quests throughout the day')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t('analytics.noProductivityData', 'No productivity data available. Complete quests to see your activity patterns.')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('analytics.charts.productivityByHour', 'Productivity by Hour')}
        </CardTitle>
        <CardDescription>
          {t('analytics.charts.productivityByHourDescription', 'When you complete quests throughout the day')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="grid grid-cols-12 gap-1">
            {data.map((hour) => {
              const questIntensity = getIntensity(hour.questsCompleted, maxQuests);
              const xpIntensity = getIntensity(hour.xpEarned, maxXp);
              const combinedIntensity = (questIntensity + xpIntensity) / 2;
              
              return (
                <div
                  key={hour.hour}
                  className={`aspect-square rounded-sm border border-border/50 ${getColorClass(combinedIntensity)} flex flex-col items-center justify-center text-xs font-medium transition-colors hover:opacity-80`}
                  title={`${formatHour(hour.hour)}: ${hour.questsCompleted} quests, ${hour.xpEarned} XP`}
                >
                  <span className="text-xs">{hour.hour}</span>
                  {hour.questsCompleted > 0 && (
                    <span className="text-xs opacity-75">{hour.questsCompleted}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t('analytics.legend.lessActive', 'Less Active')}</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                <div
                  key={intensity}
                  className={`w-4 h-4 rounded-sm border border-border/50 ${getColorClass(intensity)}`}
                />
              ))}
            </div>
            <span>{t('analytics.legend.moreActive', 'More Active')}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {data.reduce((sum, h) => sum + h.questsCompleted, 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('analytics.stats.totalQuestsCompleted', 'Total Quests Completed')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.reduce((sum, h) => sum + h.xpEarned, 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('analytics.stats.totalXpEarned', 'Total XP Earned')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {(() => {
                  const mostProductive = data.reduce((best, current) => 
                    current.questsCompleted > best.questsCompleted ? current : best
                  );
                  return formatHour(mostProductive.hour);
                })()}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('analytics.stats.mostProductiveHour', 'Most Productive Hour')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductivityHeatmap;
