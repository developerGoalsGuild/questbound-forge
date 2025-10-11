import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Target } from 'lucide-react';
import { CategoryPerformance } from '@/models/analytics';
import { useTranslation } from 'react-i18next';

interface CategoryPerformanceChartProps {
  data: CategoryPerformance[];
  className?: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const CategoryPerformanceChart: React.FC<CategoryPerformanceChartProps> = ({ data, className }) => {
  const { t } = useTranslation('quest');

  const chartData = data.map((category, index) => ({
    category: category.category,
    successRate: category.successRate,
    totalQuests: category.totalQuests,
    completedQuests: category.completedQuests,
    xpEarned: category.xpEarned,
    color: COLORS[index % COLORS.length],
  }));

  const formatTooltipValue = (value: number, name: string) => {
    switch (name) {
      case 'successRate':
        return [`${(value * 100).toFixed(1)}%`, t('analytics.metrics.successRate', 'Success Rate')];
      case 'totalQuests':
        return [value.toString(), t('analytics.metrics.totalQuests', 'Total Quests')];
      case 'completedQuests':
        return [value.toString(), t('analytics.metrics.completedQuests', 'Completed Quests')];
      case 'xpEarned':
        return [value.toString(), t('analytics.metrics.xpEarned', 'XP Earned')];
      default:
        return [value.toString(), name];
    }
  };

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('analytics.charts.categoryPerformance', 'Category Performance')}
          </CardTitle>
          <CardDescription>
            {t('analytics.charts.categoryPerformanceDescription', 'Success rates by quest category')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t('analytics.noCategoryData', 'No category data available. Complete quests in different categories to see performance insights.')}
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
          <BarChart3 className="h-5 w-5" />
          {t('analytics.charts.categoryPerformance', 'Category Performance')}
        </CardTitle>
        <CardDescription>
          {t('analytics.charts.categoryPerformanceDescription', 'Success rates by quest category')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 1]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        <div className="space-y-1">
                          {Object.entries(data).map(([key, value]) => {
                            if (key === 'color') return null;
                            const [formattedValue, name] = formatTooltipValue(value as number, key);
                            return (
                              <p key={key} className="text-sm">
                                {name}: {formattedValue}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chartData.map((item, index) => (
            <div key={item.category} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.category}</span>
              <span className="text-muted-foreground">
                ({item.completedQuests}/{item.totalQuests})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryPerformanceChart;
