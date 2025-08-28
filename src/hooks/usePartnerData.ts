import { useState, useEffect, useCallback } from 'react';
import { 
  getPartnerDashboardData, 
  createService, 
  toggleServiceStatus,
  updateServiceMetrics,
  calculateTotalRevenue,
  getActiveServices,
  generateServiceReport
} from '@/data/partnerData';
import { Service, PartnerDashboardData, PartnerMetrics } from '@/data/types';

interface UsePartnerDataReturn {
  data: PartnerDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addService: (service: Partial<Service>) => Promise<void>;
  updateService: (serviceId: string | number, updates: Partial<Service>) => Promise<void>;
  toggleService: (serviceId: string | number) => Promise<void>;
  deleteService: (serviceId: string | number) => Promise<void>;
  serviceReport: ReturnType<typeof generateServiceReport>;
}

export const usePartnerData = (): UsePartnerDataReturn => {
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dashboardData = getPartnerDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch partner data');
    } finally {
      setLoading(false);
    }
  }, []);

  const addService = useCallback(async (serviceData: Partial<Service>) => {
    try {
      setLoading(true);
      const newService = createService(serviceData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          services: [...prevData.services, newService],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add service');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateService = useCallback(async (serviceId: string | number, updates: Partial<Service>) => {
    try {
      setData(prevData => {
        if (!prevData) return prevData;
        
        const updatedServices = prevData.services.map(service => 
          service.id === serviceId ? { ...service, ...updates } : service
        );
        
        return {
          ...prevData,
          services: updatedServices,
        };
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    }
  }, []);

  const toggleService = useCallback(async (serviceId: string | number) => {
    try {
      setData(prevData => {
        if (!prevData) return prevData;
        
        const updatedServices = prevData.services.map(service => 
          service.id === serviceId ? toggleServiceStatus(service) : service
        );
        
        return {
          ...prevData,
          services: updatedServices,
        };
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle service');
    }
  }, []);

  const deleteService = useCallback(async (serviceId: string | number) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          services: prevData.services.filter(service => service.id !== serviceId),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Generate service report
  const serviceReport = data ? generateServiceReport(data.services) : {
    totalServices: 0,
    activeServices: 0,
    totalRevenue: 0,
    averageEngagement: 0,
    topPerformer: null,
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    addService,
    updateService,
    toggleService,
    deleteService,
    serviceReport,
  };
};

// Specialized hooks for specific data
export const usePartnerMetrics = (): { metrics: PartnerMetrics | null; loading: boolean } => {
  const { data, loading } = usePartnerData();
  return {
    metrics: data?.metrics || null,
    loading,
  };
};

export const usePartnerServices = () => {
  const { 
    data, 
    loading, 
    error, 
    addService, 
    updateService, 
    toggleService, 
    deleteService,
    serviceReport 
  } = usePartnerData();
  
  return {
    services: data?.services || [],
    loading,
    error,
    addService,
    updateService,
    toggleService,
    deleteService,
    activeServices: data ? getActiveServices(data.services) : [],
    totalRevenue: data ? calculateTotalRevenue(data.services) : 0,
    serviceReport,
  };
};

export const usePartnerAnalytics = () => {
  const { data, loading, error } = usePartnerData();
  
  return {
    engagementTrends: data?.engagementTrends || { thisMonth: 0, lastMonth: 0 },
    topServices: data?.topServices || [],
    activities: data?.activities || [],
    loading,
    error,
  };
};