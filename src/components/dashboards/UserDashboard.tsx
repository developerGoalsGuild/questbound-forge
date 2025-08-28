import { Target, Users, Trophy, TrendingUp, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/hooks/useTranslation';

const UserDashboard = () => {
  const { t } = useTranslation();

  // Mock data - in real app this would come from AWS Lambda/DynamoDB
  const mockGoals = [
    { id: 1, title: 'Complete React Course', progress: 75, category: 'Learning', dueDate: '2024-12-15' },
    { id: 2, title: 'Run 5K Marathon', progress: 45, category: 'Fitness', dueDate: '2024-11-30' },
    { id: 3, title: 'Read 12 Books', progress: 60, category: 'Personal', dueDate: '2024-12-31' },
  ];

  const mockAchievements = [
    { name: 'First Quest', icon: Star, earned: true },
    { name: 'Team Player', icon: Users, earned: true },
    { name: 'Goal Crusher', icon: Target, earned: false },
  ];

  return (
    <div className="spacing-medieval py-8">
      <div className="container mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gradient-royal mb-2">
            {t.dashboard.user.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.dashboard.user.welcome}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">12</div>
              <div className="text-sm text-muted-foreground">Active Quests</div>
            </CardContent>
          </Card>
          
          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">8</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">156</div>
              <div className="text-sm text-muted-foreground">Guild Points</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">89%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Goals */}
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-xl flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {t.dashboard.user.goals}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{goal.title}</h3>
                    <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                  </div>
                  <div className="progress-medieval">
                    <div 
                      className="progress-medieval-fill" 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-accent rounded text-xs">{goal.category}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {goal.dueDate}
                    </span>
                  </div>
                </div>
              ))}
              <Button className="w-full btn-heraldic text-primary-foreground">
                Add New Quest
              </Button>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                {t.dashboard.user.achievements}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {mockAchievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border text-center transition-all duration-300 ${
                        achievement.earned
                          ? 'bg-gradient-gold border-secondary shadow-gold'
                          : 'bg-muted border-border opacity-50'
                      }`}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${
                        achievement.earned ? 'text-secondary-foreground' : 'text-muted-foreground'
                      }`} />
                      <div className="font-semibold text-sm">{achievement.name}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 medieval-banner rounded-lg text-center">
                <div className="font-cinzel text-lg font-bold text-gradient-royal mb-2">
                  Next Achievement
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Complete 3 more quests to unlock "Quest Master"
                </div>
                <div className="progress-medieval mb-2">
                  <div className="progress-medieval-fill" style={{ width: '66%' }} />
                </div>
                <div className="text-xs text-muted-foreground">2/3 quests completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Activity */}
        <Card className="guild-card mt-8">
          <CardHeader>
            <CardTitle className="font-cinzel text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t.dashboard.user.community}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-accent rounded-lg">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">A</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Alex completed "Master JavaScript"</div>
                  <div className="text-sm text-muted-foreground">2 hours ago • Earned "Code Warrior" badge</div>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-accent rounded-lg">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-secondary-foreground font-semibold">M</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Maria shared tips in "Fitness Guild"</div>
                  <div className="text-sm text-muted-foreground">4 hours ago • 12 guild members liked this</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;