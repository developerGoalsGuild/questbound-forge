import { 
  Service, 
  PartnerMetrics, 
  PartnerActivity, 
  PartnerDashboardData,
  ServiceSchema,
  PartnerMetricsSchema,
  PartnerActivitySchema
} from './types';

// Mock partner data
const mockPartnerMetrics: PartnerMetrics = PartnerMetricsSchema.parse({
  totalUsers: 1247,
  activeEngagements: 89,
  monthlyRevenue: 4200,
  satisfaction: 4.8,
});

const mockServices: Service[] = [
  ServiceSchema.parse({
    id: 'service-1',
    name: 'Leadership Coaching',
    active: true,
    engagement: 85,
    revenue: 2400,
    description: 'One-on-one executive coaching sessions',
  }),
  ServiceSchema.parse({
    id: 'service-2',
    name: 'Team Building Workshops',
    active: true,
    engagement: 72,
    revenue: 1800,
    description: 'Interactive workshops for team development',
  }),
  ServiceSchema.parse({
    id: 'service-3',
    name: 'Career Mentorship',
    active: false,
    engagement: 0,
    revenue: 0,
    description: 'Long-term career guidance program',
  }),
];

const mockPartnerActivities: PartnerActivity[] = [
  PartnerActivitySchema.parse({
    id: 'activity-1',
    activity: 'New user enrolled in Leadership Coaching',
    details: 'Sarah Johnson • 2 hours ago',
    timeAgo: '2 hours ago',
    type: 'enrollment',
  }),
  PartnerActivitySchema.parse({
    id: 'activity-2',
    activity: 'Team Building Workshop completed',
    details: 'Tech Innovators Guild • 4 hours ago',
    timeAgo: '4 hours ago',
    type: 'completion',
  }),
  PartnerActivitySchema.parse({
    id: 'activity-3',
    activity: 'Monthly revenue target achieved',
    details: '$4,200 total • Today',
    timeAgo: 'Today',
    type: 'milestone',
  }),
];

const mockEngagementTrends = {
  thisMonth: 12,
  lastMonth: 8,
};

const mockTopServices = [
  { name: 'Leadership Coaching', engagement: 85 },
  { name: 'Team Building', engagement: 72 },
];

// Data factory functions
export const createService = (data: Partial<Service>): Service => {
  return ServiceSchema.parse({
    id: Date.now().toString(),
    name: 'New Service',
    active: false,
    engagement: 0,
    revenue: 0,
    ...data,
  });
};

export const toggleServiceStatus = (service: Service): Service => {
  return ServiceSchema.parse({
    ...service,
    active: !service.active,
    engagement: service.active ? 0 : service.engagement,
    revenue: service.active ? 0 : service.revenue,
  });
};

export const updateServiceMetrics = (
  service: Service, 
  metrics: { engagement?: number; revenue?: number }
): Service => {
  return ServiceSchema.parse({
    ...service,
    engagement: metrics.engagement ?? service.engagement,
    revenue: metrics.revenue ?? service.revenue,
  });
};

// Data access functions
export const getPartnerMetrics = (): PartnerMetrics => {
  return mockPartnerMetrics;
};

export const getPartnerServices = (): Service[] => {
  return mockServices;
};

export const getPartnerActivities = (): PartnerActivity[] => {
  return mockPartnerActivities;
};

export const getEngagementTrends = () => {
  return mockEngagementTrends;
};

export const getTopServices = () => {
  return mockTopServices;
};

export const getPartnerDashboardData = (): PartnerDashboardData => {
  return {
    metrics: getPartnerMetrics(),
    services: getPartnerServices(),
    activities: getPartnerActivities(),
    engagementTrends: getEngagementTrends(),
    topServices: getTopServices(),
  };
};

// Utility functions
export const calculateTotalRevenue = (services: Service[]): number => {
  return services.reduce((total, service) => total + (service.active ? service.revenue : 0), 0);
};

export const getActiveServices = (services: Service[]): Service[] => {
  return services.filter(service => service.active);
};

export const getServicesByEngagement = (services: Service[]): Service[] => {
  return services
    .filter(service => service.active)
    .sort((a, b) => b.engagement - a.engagement);
};

export const calculateAverageEngagement = (services: Service[]): number => {
  const activeServices = getActiveServices(services);
  if (activeServices.length === 0) return 0;
  
  const totalEngagement = activeServices.reduce((sum, service) => sum + service.engagement, 0);
  return Math.round(totalEngagement / activeServices.length);
};

export const getServicePerformanceCategory = (engagement: number): 'excellent' | 'good' | 'average' | 'poor' => {
  if (engagement >= 80) return 'excellent';
  if (engagement >= 60) return 'good';
  if (engagement >= 40) return 'average';
  return 'poor';
};

export const generateServiceReport = (services: Service[]) => {
  const activeServices = getActiveServices(services);
  return {
    totalServices: services.length,
    activeServices: activeServices.length,
    totalRevenue: calculateTotalRevenue(services),
    averageEngagement: calculateAverageEngagement(services),
    topPerformer: activeServices.length > 0 ? activeServices.reduce((top, service) => 
      service.engagement > top.engagement ? service : top
    ) : null,
  };
};
