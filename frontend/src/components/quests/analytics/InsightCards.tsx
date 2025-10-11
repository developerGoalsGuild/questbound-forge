import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Clock, Award, Zap, BarChart3 } from 'lucide-react';
import { AnalyticsInsights } from '@/models/analytics';
import { useTranslation } from 'react-i18next';

interface InsightCardsProps {
  insights: AnalyticsInsights | null;
  className?: string;
}

export const InsightCards: React.FC<InsightCardsProps> = ({ insights, className }) => {
  const { t } = useTranslation('quest');

  if (!insights) {
    return null;
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTrendText = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return t('analytics.insights.trendImproving', 'Your performance is improving!');
      case 'declining':
        return t('analytics.insights.trendDeclining', 'Your performance has declined recently.');
      case 'stable':
        return t('analytics.insights.trendStable', 'Your performance is stable.');
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Overall Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              {t('analytics.insights.overallPerformance', 'Overall Performance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {insights.overallPerformance}
            </p>
          </CardContent>
        </Card>

        {/* Streak Info */}
        {insights.streakInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4" />
                {t('analytics.insights.streakInfo', 'Streak Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {insights.streakInfo}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Most Productive Category */}
        {insights.mostProductiveCategory && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                {t('analytics.insights.mostProductiveCategory', 'Best Category')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{insights.mostProductiveCategory.category}</span>
                {' '}
                {t('analytics.insights.withSuccessRate', 'with')} 
                {' '}
                <span className="font-medium text-green-600">
                  {(insights.mostProductiveCategory.successRate * 100).toFixed(0)}%
                </span>
                {' '}
                {t('analytics.insights.successRate', 'success rate')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Most Productive Hour */}
        {insights.mostProductiveHour && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {t('analytics.insights.mostProductiveHour', 'Peak Hour')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('analytics.insights.mostProductiveHourText', 'You complete most quests around')}
                {' '}
                <span className="font-medium">
                  {insights.mostProductiveHour.hour === 0 ? '12 AM' : 
                   insights.mostProductiveHour.hour < 12 ? `${insights.mostProductiveHour.hour} AM` :
                   insights.mostProductiveHour.hour === 12 ? '12 PM' :
                   `${insights.mostProductiveHour.hour - 12} PM`}
                </span>
                {' '}
                ({insights.mostProductiveHour.questsCompleted} {t('analytics.insights.questsCompleted', 'quests completed')})
              </p>
            </CardContent>
          </Card>
        )}

        {/* Trend Analysis */}
        {insights.trend && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getTrendIcon(insights.trend)}
                {t('analytics.insights.trendAnalysis', 'Trend Analysis')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {getTrendText(insights.trend)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Consistency Score */}
        {insights.consistencyScore !== undefined && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4" />
                {t('analytics.insights.consistencyScore', 'Consistency Score')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('analytics.insights.consistencyDescription', 'Based on your best streak vs total quests')}
                  </span>
                  <span className="text-sm font-medium">
                    {(insights.consistencyScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${insights.consistencyScore * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InsightCards;
