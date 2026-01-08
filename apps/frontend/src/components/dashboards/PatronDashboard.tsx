import { Crown, Heart, Users, Gift, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { usePatronData } from '@/hooks/usePatronData';

const PatronDashboard = () => {
  const { t } = useTranslation();
  const { data: patronData, loading, error } = usePatronData();

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

  if (error || !patronData) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto text-center">
          <p className="text-destructive">{error || 'Failed to load patron data'}</p>
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
            {t.dashboard.patron.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            Your noble support makes dreams reality
          </p>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="guild-card bg-gradient-gold border-secondary">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-secondary-foreground mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-secondary-foreground">
                {patronData.impact.totalSupported}
              </div>
              <div className="text-sm text-secondary-foreground/80">Adventurers Supported</div>
            </CardContent>
          </Card>
          
          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">
                {patronData.impact.goalsAchieved}
              </div>
              <div className="text-sm text-muted-foreground">Goals Achieved</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">
                +{patronData.impact.communityGrowth}%
              </div>
              <div className="text-sm text-muted-foreground">Community Growth</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Crown className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">
                ${patronData.impact.totalContributed}
              </div>
              <div className="text-sm text-muted-foreground">Total Contributed</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contribution History */}
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {t.dashboard.patron.contributions}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patronData.contributions.map((contribution, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{contribution.month}</span>
                    <span className="text-secondary font-bold">${contribution.amount}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Helped {contribution.impact} adventurers achieve their goals
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 ${contribution.status === 'processed' ? 'bg-primary' : 'bg-muted-foreground'} rounded-full`} />
                    <span className={contribution.status === 'processed' ? 'text-primary' : 'text-muted-foreground'}>
                      {contribution.status === 'processed' ? 'Payment processed successfully' : 'Payment pending'}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="medieval-banner p-4 text-center">
                <h3 className="font-cinzel font-bold text-gradient-royal mb-2">
                  Increase Your Impact
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upgrade your patronage to unlock more benefits
                </p>
                <Button className="btn-gold text-secondary-foreground">
                  Upgrade Patronage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Patron Benefits */}
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-xl flex items-center gap-2">
                <Gift className="h-5 w-5 text-secondary" />
                {t.dashboard.patron.benefits}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patronData.benefits.map((benefit, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  benefit.unlocked 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted border-muted-foreground/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      benefit.unlocked 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {benefit.unlocked ? '✓' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{benefit.name}</div>
                      {benefit.requirement && (
                        <div className="text-sm text-muted-foreground">
                          Requires: {benefit.requirement}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Community Impact Stories */}
        <Card className="guild-card mt-8">
          <CardHeader>
            <CardTitle className="font-cinzel text-xl flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {t.dashboard.patron.impact}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="medieval-banner p-6">
                <h3 className="font-cinzel text-lg font-bold text-gradient-royal mb-3">
                  Success Story: Maria's Career Transformation
                </h3>
                <p className="text-muted-foreground mb-4">
                  Thanks to your support, Maria was able to access premium career coaching services. 
                  She successfully transitioned from junior developer to team lead, increasing her 
                  salary by 40% and gaining confidence in leadership.
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Award className="h-4 w-4" />
                  <span>Your contribution directly supported this achievement</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-accent rounded-lg">
                  <div className="font-cinzel text-2xl font-bold text-gradient-royal">{patronData.communityStats.goalSuccessRate}%</div>
                  <div className="text-sm text-muted-foreground">Goal Success Rate</div>
                  <div className="text-xs text-primary mt-1">+12% vs last month</div>
                </div>
                
                <div className="text-center p-4 bg-accent rounded-lg">
                  <div className="font-cinzel text-2xl font-bold text-gradient-gold">{patronData.communityStats.livesImpacted}</div>
                  <div className="text-sm text-muted-foreground">Lives Impacted</div>
                  <div className="text-xs text-primary mt-1">Through your patronage</div>
                </div>

                <div className="text-center p-4 bg-accent rounded-lg">
                  <div className="font-cinzel text-2xl font-bold text-gradient-royal">{patronData.communityStats.thankYouMessages}</div>
                  <div className="text-sm text-muted-foreground">Thank You Messages</div>
                  <div className="text-xs text-primary mt-1">From the community</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatronDashboard;
