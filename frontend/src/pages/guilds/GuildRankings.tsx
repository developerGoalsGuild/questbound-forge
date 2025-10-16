/**
 * GuildRankings Page
 *
 * A page component for displaying guild rankings and leaderboard
 * with search, filtering, and detailed guild information.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GuildRankingList } from '@/components/guilds/GuildRankingList';
import { useGuildRankings } from '@/hooks/useGuildRankings';
import { GuildRankingData } from '@/components/guilds/GuildRankingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  Target, 
  Zap, 
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  Award,
} from 'lucide-react';

export const GuildRankings: React.FC = () => {
  const navigate = useNavigate();
  const { rankings, loading, error, refresh, lastUpdated } = useGuildRankings({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  const handleGuildClick = (guild: GuildRankingData) => {
    navigate(`/guilds/${guild.guildId}`);
  };

  const handleBack = () => {
    navigate('/guilds');
  };

  // Calculate top performers
  const topPerformers = rankings.slice(0, 3);
  const totalGuilds = rankings.length;
  const totalMembers = rankings.reduce((sum, guild) => sum + guild.memberCount, 0);
  const totalScore = rankings.reduce((sum, guild) => sum + guild.totalScore, 0);
  const avgActivity = rankings.length > 0 
    ? Math.round(rankings.reduce((sum, guild) => sum + guild.activityScore, 0) / rankings.length)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guilds
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Guild Rankings
            </h1>
            <p className="text-gray-600 mt-1">
              Discover the top-performing guilds in the community
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Guilds</p>
                <p className="text-2xl font-bold text-gray-900">{totalGuilds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{totalMembers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Score</p>
                <p className="text-2xl font-bold text-gray-900">{totalScore.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Activity</p>
                <p className="text-2xl font-bold text-gray-900">{avgActivity}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.map((guild, index) => (
                <div
                  key={guild.guildId}
                  className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => handleGuildClick(guild)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{guild.name}</h3>
                      <p className="text-sm text-gray-600">{guild.memberCount} members</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-medium">{guild.totalScore.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Activity:</span>
                      <span className="font-medium">{guild.activityScore}%</span>
                    </div>
                    <div className="flex gap-1">
                      {guild.badges.slice(0, 2).map(badge => (
                        <Badge key={badge} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Rankings List */}
      <GuildRankingList
        guilds={rankings}
        loading={loading}
        error={error}
        title="All Guild Rankings"
        showSearch={true}
        showFilters={true}
        showStats={false}
        onGuildClick={handleGuildClick}
      />
    </div>
  );
};

export default GuildRankings;

