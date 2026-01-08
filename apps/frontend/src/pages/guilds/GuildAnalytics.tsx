/**
 * GuildAnalytics Page Component
 *
 * A demo page showcasing the GuildAnalyticsCard component
 * with different variants and configurations.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuildAnalyticsCard, GuildAnalyticsData } from '@/components/guilds/GuildAnalyticsCard';
import { useGuildAnalytics } from '@/hooks/useGuildAnalytics';
import { RefreshCw, BarChart3, Settings, Eye, EyeOff } from 'lucide-react';

export const GuildAnalytics: React.FC = () => {
  const [selectedGuildId, setSelectedGuildId] = useState('demo-guild-1');
  const [showTrends, setShowTrends] = useState(true);
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Use the hook to get analytics data
  const {
    data: analyticsData,
    loading,
    error,
    refresh,
    lastUpdated,
  } = useGuildAnalytics({
    guildId: selectedGuildId,
    autoRefresh,
    refreshInterval: 300000, // 5 minutes - increased from 10s to reduce API calls by 97%
  });

  // Demo guild IDs for testing different data
  const demoGuilds = [
    { id: 'demo-guild-1', name: 'Fitness Warriors' },
    { id: 'demo-guild-2', name: 'Code Masters' },
    { id: 'demo-guild-3', name: 'Learning Squad' },
    { id: 'demo-guild-4', name: 'Creative Minds' },
  ];

  const handleRefresh = async () => {
    await refresh();
  };

  const handleGuildChange = (guildId: string) => {
    setSelectedGuildId(guildId);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guild Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for your guilds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Demo Mode
          </Badge>
          {lastUpdated && (
            <Badge variant="secondary">
              Updated {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Analytics Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Guild Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Guild
              </label>
              <select
                value={selectedGuildId}
                onChange={(e) => handleGuildChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {demoGuilds.map((guild) => (
                  <option key={guild.id} value={guild.id}>
                    {guild.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Trends Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Display Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showTrends}
                    onChange={(e) => setShowTrends(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Show Trends</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showDetailedMetrics}
                    onChange={(e) => setShowDetailedMetrics(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Detailed Metrics</span>
                </label>
              </div>
            </div>

            {/* Auto-refresh Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Auto-refresh
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Enable (10s interval)</span>
              </label>
            </div>

            {/* Manual Refresh */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Actions
              </label>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="compact">Compact</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <GuildAnalyticsCard
            data={analyticsData!}
            variant="dashboard"
            showTrends={showTrends}
            showDetailedMetrics={showDetailedMetrics}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <GuildAnalyticsCard
            data={analyticsData!}
            variant="detailed"
            showTrends={showTrends}
            showDetailedMetrics={showDetailedMetrics}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="compact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GuildAnalyticsCard
              data={analyticsData!}
              variant="compact"
              showTrends={showTrends}
              className="w-full"
            />
            <GuildAnalyticsCard
              data={analyticsData!}
              variant="compact"
              showTrends={showTrends}
              className="w-full"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Configuration</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Guild ID: {selectedGuildId}</li>
                <li>• Show Trends: {showTrends ? 'Yes' : 'No'}</li>
                <li>• Detailed Metrics: {showDetailedMetrics ? 'Yes' : 'No'}</li>
                <li>• Auto-refresh: {autoRefresh ? 'Yes (10s)' : 'No'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Status</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Loading: {loading ? 'Yes' : 'No'}</li>
                <li>• Error: {error || 'None'}</li>
                <li>• Last Updated: {lastUpdated?.toLocaleString() || 'Never'}</li>
                <li>• Data Available: {analyticsData ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuildAnalytics;

