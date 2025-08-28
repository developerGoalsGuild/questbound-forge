import { Building2, BarChart3, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { usePartnerData } from '@/hooks/usePartnerData';

const PartnerDashboard = () => {
  const { t } = useTranslation();
  const { data: partnerData, loading, error } = usePartnerData();

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

  if (error || !partnerData) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto text-center">
          <p className="text-destructive">{error || 'Failed to load partner data'}</p>
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
            {t.dashboard.partner.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your services and track business impact
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">
                {partnerData.metrics.totalUsers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Users Reached</div>
            </CardContent>
          </Card>
          
          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">
                {partnerData.metrics.activeEngagements}
              </div>
              <div className="text-sm text-muted-foreground">Active Engagements</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-royal">
                ${partnerData.metrics.monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Revenue</div>
            </CardContent>
          </Card>

          <Card className="guild-card">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="font-cinzel text-2xl font-bold text-gradient-gold">
                {partnerData.metrics.satisfaction}/5
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction Score</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services Management */}
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {t.dashboard.partner.services}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partnerData.services.map((service, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        service.active 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {service.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  
                  {service.active && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Engagement</div>
                        <div className="font-semibold">{service.engagement}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-semibold">${service.revenue}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Button className="w-full btn-heraldic text-primary-foreground">
                Add New Service
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="guild-card">
            <CardHeader>
              <CardTitle className="font-cinzel text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                {t.dashboard.partner.analytics}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Engagement Trends */}
              <div>
                <h3 className="font-semibold mb-3">User Engagement Trends</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month</span>
                    <span className="text-sm font-semibold text-primary">+{partnerData.engagementTrends.thisMonth}%</span>
                  </div>
                  <div className="progress-medieval">
                    <div className="progress-medieval-fill" style={{ width: `${partnerData.engagementTrends.thisMonth + 60}%` }} />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Month</span>
                    <span className="text-sm font-semibold">+{partnerData.engagementTrends.lastMonth}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-muted-foreground h-2 rounded-full" style={{ width: `${partnerData.engagementTrends.lastMonth + 55}%` }} />
                  </div>
                </div>
              </div>

              {/* Top Performing Services */}
              <div>
                <h3 className="font-semibold mb-3">Top Performing Services</h3>
                <div className="space-y-2">
                  {partnerData.topServices.map((service, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-accent rounded">
                      <span className="text-sm">{service.name}</span>
                      <span className={`text-sm font-semibold ${index === 0 ? 'text-secondary' : ''}`}>
                        {service.engagement}% engagement
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Full Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="guild-card mt-8">
          <CardHeader>
            <CardTitle className="font-cinzel text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partnerData.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-accent rounded-lg">
                  <div className={`w-2 h-2 ${
                    activity.type === 'enrollment' ? 'bg-primary' : 
                    activity.type === 'completion' ? 'bg-secondary' : 'bg-primary'
                  } rounded-full mt-3`} />
                  <div className="flex-1">
                    <div className="font-semibold">{activity.activity}</div>
                    <div className="text-sm text-muted-foreground">{activity.details}</div>
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

export default PartnerDashboard;
