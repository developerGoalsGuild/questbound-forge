import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, BarChart3, TrendingUp, Clock, Target } from 'lucide-react';
import { useQuestAnalytics } from '@/hooks/useQuestAnalytics';
import { AnalyticsPeriod } from '@/models/analytics';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// Lazy load chart components
const TrendChart = React.lazy(() => import('./TrendChart'));
const CategoryPerformanceChart = React.lazy(() => import('./CategoryPerformanceChart'));
const ProductivityHeatmap = React.lazy(() => import('./ProductivityHeatmap'));
const InsightCards = React.lazy(() => import('./InsightCards'));

interface QuestAnalyticsDashboardProps {
  className?: string;
}

export const QuestAnalyticsDashboard: React.FC<QuestAnalyticsDashboardProps> = ({ className }) => {
  const { t } = useTranslation('quest');
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('weekly');
  
  const {
    analytics,
    insights,
    isLoading,
    error,
    refresh,
    clearError,
    lastUpdated
  } = useQuestAnalytics({
    period: selectedPeriod,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    enabled: true // Always enabled since component only renders when expanded
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as AnalyticsPeriod);
  };

  const handleRefresh = async () => {
    await refresh(true);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('analytics.title', 'Analytics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('analytics.actions.retry', 'Retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('analytics.title', 'Analytics')}
              </CardTitle>
              <CardDescription>
                {t('analytics.description', 'Track your quest performance and productivity patterns')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('analytics.periods.daily', 'Daily')}</SelectItem>
                  <SelectItem value="weekly">{t('analytics.periods.weekly', 'Weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('analytics.periods.monthly', 'Monthly')}</SelectItem>
                  <SelectItem value="allTime">{t('analytics.periods.allTime', 'All Time')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              {t('analytics.lastUpdated', 'Last updated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && !analytics ? (
            <AnalyticsSkeleton />
          ) : analytics ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title={t('analytics.metrics.totalQuests', 'Total Quests')}
                  value={analytics.totalQuests}
                  icon={<Target className="h-4 w-4" />}
                />
                <MetricCard
                  title={t('analytics.metrics.successRate', 'Success Rate')}
                  value={`${(analytics.successRate * 100).toFixed(0)}%`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard
                  title={t('analytics.metrics.bestStreak', 'Best Streak')}
                  value={`${analytics.bestStreak} days`}
                  icon={<Clock className="h-4 w-4" />}
                />
                <MetricCard
                  title={t('analytics.metrics.xpEarned', 'XP Earned')}
                  value={analytics.xpEarned}
                  icon={<BarChart3 className="h-4 w-4" />}
                />
              </div>

              {/* Insights */}
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <InsightCards insights={insights} />
              </Suspense>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ErrorBoundary
                  fallback={
                    <div className="h-64 w-full flex items-center justify-center border border-red-200 rounded-lg bg-red-50">
                      <p className="text-red-600 text-sm">Failed to load trend chart</p>
                    </div>
                  }
                >
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <TrendChart
                      data={analytics.trends}
                      period={selectedPeriod}
                    />
                  </Suspense>
                </ErrorBoundary>
                <ErrorBoundary
                  fallback={
                    <div className="h-64 w-full flex items-center justify-center border border-red-200 rounded-lg bg-red-50">
                      <p className="text-red-600 text-sm">Failed to load category chart</p>
                    </div>
                  }
                >
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <CategoryPerformanceChart
                      data={analytics.categoryPerformance}
                    />
                  </Suspense>
                </ErrorBoundary>
              </div>

              {/* Productivity Heatmap */}
              <ErrorBoundary
                fallback={
                  <div className="h-48 w-full flex items-center justify-center border border-red-200 rounded-lg bg-red-50">
                    <p className="text-red-600 text-sm">Failed to load productivity heatmap</p>
                  </div>
                }
              >
                <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                  <ProductivityHeatmap
                    data={analytics.productivityByHour}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('analytics.noData', 'No analytics data available. Complete some quests to see your performance insights.')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
    <Skeleton className="h-48 w-full" />
  </div>
);

export default QuestAnalyticsDashboard;
