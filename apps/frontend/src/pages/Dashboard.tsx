import { useEffect, useMemo, useState } from 'react';
import { User, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserDashboard from '@/components/dashboards/UserDashboard';
import PartnerDashboard from '@/components/dashboards/PartnerDashboard';
import PatronDashboard from '@/components/dashboards/PatronDashboard';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAccessToken } from '@/lib/utils';

type DashboardType = 'user' | 'partner' | 'patron';

const Dashboard = () => {
  const location = useLocation();
  const initialType = useMemo<DashboardType>(() => {
    try {
      const tok = getAccessToken();
      let role: string | null = null;
      if (tok && tok.split('.').length >= 2) {
        try {
          const b64 = tok.split('.')[1];
          const base64decode = (s: string) => (typeof window !== 'undefined' && (window as any).atob ? (window as any).atob(s) : (globalThis as any).atob(s));
          const payload = JSON.parse(base64decode(b64));
          role = (payload?.role || payload?.user_type || '').toString().toLowerCase();
          if (!(['partner','patron','user'].includes(role))) role = null;
        } catch {}
      }
      const params = new URLSearchParams(location.search);
      const q = (params.get('type') || '').toLowerCase();
      if (['user','partner','patron'].includes(q)) {
        if (role && q !== role) return role as DashboardType;
        return q as DashboardType;
      }
      if (role) return role as DashboardType;
      return 'user';
    } catch {
      return 'user';
    }
  }, [location.search]);
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>(initialType);
  useEffect(() => { setActiveDashboard(initialType); }, [initialType]);
  const navigate = useNavigate();
  useEffect(() => {
    // Enforce role-specific dashboard if query param mismatches token role
    try {
      const tok = getAccessToken();
      if (tok && tok.split('.').length >= 2) {
        const b64 = tok.split('.')[1];
        const base64decode = (s: string) => (typeof window !== 'undefined' && (window as any).atob ? (window as any).atob(s) : (globalThis as any).atob(s));
        const payload = JSON.parse(base64decode(b64));
        const role = (payload?.role || payload?.user_type || '').toString().toLowerCase();
        if (role && ['user','partner','patron'].includes(role)) {
          const params = new URLSearchParams(location.search);
          const q = (params.get('type') || '').toLowerCase();
          if (q && q !== role) {
            setActiveDashboard(role as DashboardType);
            navigate(`/dashboard?type=${encodeURIComponent(role)}`, { replace: true });
          }
        }
      }
    } catch {}
  }, [location.search, navigate]);
  const { t } = useTranslation();

  // Determine user role from token once (null when unauthenticated)
  const roleFromToken = useMemo<DashboardType | null>(() => {
    try {
      const tok = getAccessToken();
      if (tok && tok.split('.').length >= 2) {
        const b64 = tok.split('.')[1];
        const base64decode = (s: string) => (typeof window !== 'undefined' && (window as any).atob ? (window as any).atob(s) : (globalThis as any).atob(s));
        const payload = JSON.parse(base64decode(b64));
        const role = (payload?.role || payload?.user_type || '').toString().toLowerCase();
        return (['user','partner','patron'].includes(role) ? role as DashboardType : null);
      }
    } catch {}
    return null;
  }, []);

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

  const visibleTypes = roleFromToken ? dashboardTypes.filter(d => d.key === roleFromToken) : dashboardTypes;

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Type Selector */}
      <div className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto spacing-medieval">
          <div className="flex flex-wrap gap-4 justify-center">
            {visibleTypes.map((type) => {
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
