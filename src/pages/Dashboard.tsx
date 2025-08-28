import { useState } from 'react';
import { User, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserDashboard from '@/components/dashboards/UserDashboard';
import PartnerDashboard from '@/components/dashboards/PartnerDashboard';
import PatronDashboard from '@/components/dashboards/PatronDashboard';
import { useTranslation } from '@/hooks/useTranslation';

type DashboardType = 'user' | 'partner' | 'patron';

const Dashboard = () => {
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>('user');
  const { t } = useTranslation();

  const dashboardTypes = [
    {
      key: 'user' as DashboardType,
      icon: User,
      label: 'Adventurer',
      description: 'Personal goal tracking',
    },
    {
      key: 'partner' as DashboardType,
      icon: Building2,
      label: 'Partner Company',
      description: 'Business services',
    },
    {
      key: 'patron' as DashboardType,
      icon: Crown,
      label: 'Noble Patron',
      description: 'Community support',
    },
  ];

  const renderDashboard = () => {
    switch (activeDashboard) {
      case 'user':
        return <UserDashboard />;
      case 'partner':
        return <PartnerDashboard />;
      case 'patron':
        return <PatronDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Type Selector */}
      <div className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto spacing-medieval">
          <div className="flex flex-wrap gap-4 justify-center">
            {dashboardTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.key}
                  variant={activeDashboard === type.key ? "secondary" : "outline"}
                  className={`flex items-center gap-3 px-6 py-3 ${
                    activeDashboard === type.key
                      ? 'bg-secondary text-secondary-foreground'
                      : 'border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary'
                  }`}
                  onClick={() => setActiveDashboard(type.key)}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-xs opacity-80">{type.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
