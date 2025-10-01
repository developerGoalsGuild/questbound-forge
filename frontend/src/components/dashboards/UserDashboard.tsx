import { Target, Users, Trophy, TrendingUp, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserData } from '@/hooks/useUserData';
import GoalsButton from '@/components/dashboard/GoalsButton';

import { getActiveGoalsCountForUser } from '@/lib/apiGoal';
import { getUserIdFromToken } from '@/lib/utils';

import { useEffect, useState } from 'react';
import { useCommunityActivities } from '@/hooks/useCommunityData';

const UserDashboard = () => {
  const { t } = useTranslation() as any;
  const { data: userData, loading, error } = useUserData();
  const { activities: communityActivities } = useCommunityActivities('achievement', 2);

  // Fetch live active quests count from backend (fallback to mock on error)
  const [activeCount, setActiveCount] = useState<number | null>(null);
  useEffect(() => {
    const uid = getUserIdFromToken();
    if (!uid) { setActiveCount(null); return; }
    let cancelled = false;
    (async () => {
      const n = await getActiveGoalsCountForUser(uid);
      if (!cancelled) setActiveCount(n);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
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

  if (error || !userData) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto text-center">
          <h1 className="font-cinzel text-4xl font-bold text-gradient-royal mb-2">
            Adventurer's Hall
          </h1>
          <p className="text-destructive">{error || 'Failed to load dashboard data'}</p>
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
            {t.dashboard?.user?.title || "Adventurer's Hall"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.dashboard?.user?.welcome || 'Welcome back!'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">{activeCount ?? userData?.stats?.activeQuests ?? 0}</div>
              <div className="text-sm text-muted-foreground">{t.dashboard?.user?.stats?.activeQuests || 'Active Quests'}</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">{userData?.stats?.achievements ?? 0}</div>
              <div className="text-sm text-muted-foreground">{t.dashboard?.user?.stats?.achievements || 'Achievements'}</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">{userData?.stats?.guildPoints ?? 0}</div>
              <div className="text-sm text-muted-foreground">{t.dashboard?.user?.stats?.guildPoints || 'Guild Points'}</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">{userData?.stats?.successRate ?? 0}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
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
                {t.dashboard?.user?.achievements || 'Earned Honors'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(userData?.achievements || []).map((achievement, index) => {
                  const Icon = achievement?.icon || Star;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border text-center transition-all duration-300 ${
                        achievement?.earned
                          ? 'bg-gradient-gold border-secondary shadow-gold'
                          : 'bg-muted border-border opacity-50'
                      }`}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${
                        achievement?.earned ? 'text-secondary-foreground' : 'text-muted-foreground'
                      }`} />
                      <div className="font-semibold text-sm">{achievement?.name || 'Achievement'}</div>
                    </div>
                  );
                })}
              </div>
              {userData?.nextAchievement && (
                <div className="mt-6 p-4 medieval-banner rounded-lg text-center">
                  <div className="font-cinzel text-lg font-bold text-gradient-royal mb-2">
                    Next Achievement
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {userData.nextAchievement.description || 'Complete more quests to unlock achievements'}
                  </div>
                  <div className="progress-medieval mb-2">
                    <div className="progress-medieval-fill" style={{ width: `${userData.nextAchievement.progress || 0}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {userData.nextAchievement.current || 0}/{userData.nextAchievement.target || 1} quests completed
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Community Activity */}
        <Card className="guild-card mt-8">
          <CardHeader>
            <CardTitle className="font-cinzel text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t.dashboard?.user?.community || 'Guild Activities'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communityActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-accent rounded-lg">
                  <div className={`w-10 h-10 ${activity.type === 'achievement' ? 'bg-primary' : 'bg-secondary'} rounded-full flex items-center justify-center`}>
                    <span className={`${activity.type === 'achievement' ? 'text-primary-foreground' : 'text-secondary-foreground'} font-semibold`}>
                      {activity.userInitial}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{activity.activity}</div>
                    <div className="text-sm text-muted-foreground">
                      {activity.timeAgo}
                      {activity.details && ` • ${activity.details}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
