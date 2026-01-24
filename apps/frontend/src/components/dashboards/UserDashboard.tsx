import { Target, Trophy, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import GoalsButton from '@/components/dashboard/GoalsButton';

import { getActiveGoalsCountForUser, getAllGoalsProgress } from '@/lib/apiGoal';
import { getUserIdFromToken } from '@/lib/utils';
import { getQuestAnalytics } from '@/lib/apiAnalytics';
import { getCurrentXP } from '@/lib/api/gamification';
import { getMyBadges, type UserBadge } from '@/lib/api/gamification';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import type { Achievement } from '@/data/types';

const UserDashboard = () => {
  const { t } = useTranslation() as any;

  // Fetch live active quests count from backend (fallback to mock on error)
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [progressData, setProgressData] = useState<{
    overallProgress: number;
    taskProgress: number;
    timeProgress: number;
    completedTasks: number;
    totalTasks: number;
  } | null>(null);
  
  // Analytics data for success rate
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // XP data for guild points
  const [totalXP, setTotalXP] = useState<number | null>(null);
  const [xpLoading, setXpLoading] = useState(false);
  
  // Badges data for achievements
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  
  // Overall loading state
  const isLoading = analyticsLoading || xpLoading || badgesLoading;

  // Fetch active quests and progress data
  useEffect(() => {
    const uid = getUserIdFromToken();
    if (!uid) { 
      setActiveCount(null);
      setProgressData(null);
      return; 
    }
    let cancelled = false;
    (async () => {
      try {
        const [count, progress] = await Promise.all([
          getActiveGoalsCountForUser(uid),
          getAllGoalsProgress()
        ]);
        
        if (!cancelled) {
          setActiveCount(count);
          
          // Calculate aggregate progress metrics
          if (progress && progress.length > 0) {
            const totalProgress = progress.reduce((sum, goal) => sum + goal.progressPercentage, 0);
            const totalTaskProgress = progress.reduce((sum, goal) => sum + goal.taskProgress, 0);
            const totalTimeProgress = progress.reduce((sum, goal) => sum + goal.timeProgress, 0);
            const totalCompletedTasks = progress.reduce((sum, goal) => sum + goal.completedTasks, 0);
            const totalTasks = progress.reduce((sum, goal) => sum + goal.totalTasks, 0);
            
            setProgressData({
              overallProgress: Math.round(totalProgress / progress.length),
              taskProgress: Math.round(totalTaskProgress / progress.length),
              timeProgress: Math.round(totalTimeProgress / progress.length),
              completedTasks: totalCompletedTasks,
              totalTasks: totalTasks
            });
          } else {
            setProgressData({
              overallProgress: 0,
              taskProgress: 0,
              timeProgress: 0,
              completedTasks: 0,
              totalTasks: 0
            });
          }
        }
      } catch (error) {
        logger.error('Failed to load dashboard progress data', { error });
        if (!cancelled) {
          setActiveCount(0);
          setProgressData({
            overallProgress: 0,
            taskProgress: 0,
            timeProgress: 0,
            completedTasks: 0,
            totalTasks: 0
          });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch analytics for success rate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAnalyticsLoading(true);
        const analytics = await getQuestAnalytics('allTime', false);
        if (!cancelled) {
          setSuccessRate(Math.round(analytics.successRate * 100));
        }
      } catch (error) {
        logger.error('Failed to load analytics data', { error });
        if (!cancelled) {
          setSuccessRate(0);
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch XP data for guild points
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setXpLoading(true);
        const xpSummary = await getCurrentXP();
        if (!cancelled) {
          setTotalXP(xpSummary.totalXp);
        }
      } catch (error) {
        logger.error('Failed to load XP data', { error });
        if (!cancelled) {
          setTotalXP(0);
        }
      } finally {
        if (!cancelled) {
          setXpLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch badges for achievements
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBadgesLoading(true);
        const badgeResponse = await getMyBadges();
        if (!cancelled) {
          setBadges(badgeResponse.badges || []);
        }
      } catch (error) {
        logger.error('Failed to load badges data', { error });
        if (!cancelled) {
          setBadges([]);
        }
      } finally {
        if (!cancelled) {
          setBadgesLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Transform badges to achievements format
  const achievements: Achievement[] = badges.map((userBadge) => ({
    name: userBadge.definition.name,
    icon: Trophy, // Default icon, could be enhanced with icon mapping
    earned: true, // All badges from API are earned
    description: userBadge.definition.description,
  }));

  if (isLoading && activeCount === null && progressData === null) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spacing-medieval py-8">
      <div className="container mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gradient-royal mb-2">
            {t.user?.title || "Adventurer's Hall"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.user?.welcome || 'Welcome back!'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">{activeCount ?? 0}</div>
              <div className="text-sm text-muted-foreground">{t.user?.stats?.activeQuests || 'Active Quests'}</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">
                {badgesLoading ? '...' : badges.length}
              </div>
              <div className="text-sm text-muted-foreground">{t.user?.stats?.achievements || 'Achievements'}</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">
                {xpLoading ? '...' : (totalXP ?? 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">{t.user?.stats?.guildPoints || 'Total XP'}</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">
                {analyticsLoading ? '...' : (successRate ?? 0)}%
              </div>
              <div className="text-sm text-muted-foreground">{t.user?.stats?.successRate || 'Success Rate'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {t.user?.progressMetrics?.overall || 'Overall Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="font-cinzel text-3xl font-bold text-gradient-royal mb-2">
                  {progressData?.overallProgress ?? 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.user?.progressMetrics?.overall || 'Overall Progress'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-secondary" />
                {t.user?.progressMetrics?.taskProgress || 'Task Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="font-cinzel text-3xl font-bold text-gradient-gold mb-2">
                  {progressData?.taskProgress ?? 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.user?.progressMetrics?.completedTasks || 'Completed Tasks'}: {progressData?.completedTasks ?? 0} / {progressData?.totalTasks ?? 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t.user?.progressMetrics?.timeProgress || 'Time Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="font-cinzel text-3xl font-bold text-gradient-royal mb-2">
                  {progressData?.timeProgress ?? 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.user?.progressMetrics?.timeProgress || 'Time Progress'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Goals Management */}
          <GoalsButton />

          {/* Achievements */}
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                {t.user?.achievements || 'Earned Honors'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-muted animate-pulse">
                      <div className="h-8 w-8 mx-auto mb-2 bg-muted-foreground/20 rounded" />
                      <div className="h-4 w-20 mx-auto bg-muted-foreground/20 rounded" />
                    </div>
                  ))}
                </div>
              ) : achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => {
                    const Icon = achievement?.icon || Trophy;
                    return (
                      <div
                        key={index}
                        className="p-4 rounded-lg border text-center transition-all duration-300 bg-gradient-gold border-secondary shadow-gold"
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2 text-secondary-foreground" />
                        <div className="font-semibold text-sm">{achievement?.name || (t.user?.achievement || 'Achievement')}</div>
                        {achievement?.description && (
                          <div className="text-xs text-muted-foreground mt-1">{achievement.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t.user?.noAchievements || 'No achievements earned yet'}</p>
                  <p className="text-sm mt-2">{t.user?.completeQuestsMessage || 'Complete quests to earn badges and achievements'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
