import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { TrendDataPoint } from '@/models/analytics';
import { useTranslation } from 'react-i18next';

interface TrendChartProps {
  data: {
    completionRate: TrendDataPoint[];
    xpEarned: TrendDataPoint[];
    questsCreated: TrendDataPoint[];
  };
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, period, className }) => {
  const { t } = useTranslation('quest');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      case 'allTime':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return dateStr;
    }
  };

  const formatTooltipValue = (value: number, name: string) => {
    switch (name) {
      case 'completionRate':
        return [`${(value * 100).toFixed(1)}%`, t('analytics.charts.completionRate', 'Completion Rate')];
      case 'xpEarned':
        return [value.toString(), t('analytics.charts.xpEarned', 'XP Earned')];
      case 'questsCreated':
        return [value.toString(), t('analytics.charts.questsCreated', 'Quests Created')];
      default:
        return [value.toString(), name];
    }
  };

  const chartData = data.completionRate.map((point, index) => ({
    date: formatDate(point.date),
    completionRate: point.value,
    xpEarned: data.xpEarned[index]?.value || 0,
    questsCreated: data.questsCreated[index]?.value || 0,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('analytics.charts.trends', 'Trends')}
        </CardTitle>
        <CardDescription>
          {t('analytics.charts.trendsDescription', 'Track your quest performance over time')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        {payload.map((entry, index) => {
                          const [value, name] = formatTooltipValue(entry.value as number, entry.dataKey as string);
                          return (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {name}: {value}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="completionRate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                name={t('analytics.charts.completionRate', 'Completion Rate')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="xpEarned"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                name={t('analytics.charts.xpEarned', 'XP Earned')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="questsCreated"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--chart-3))', strokeWidth: 2 }}
                name={t('analytics.charts.questsCreated', 'Quests Created')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendChart;
