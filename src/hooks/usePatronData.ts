import { useState, useEffect, useCallback } from 'react';
import { 
  getPatronDashboardData, 
  createContribution, 
  processContribution,
  getTotalContributions,
  getTotalImpact,
  calculatePatronTier,
  getNextTierRequirement,
  generateImpactReport
} from '@/data/patronData';
import { Contribution, PatronDashboardData, PatronImpact } from '@/data/types';

interface UsePatronDataReturn {
  data: PatronDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addContribution: (contribution: Partial<Contribution>) => Promise<void>;
  processContributionById: (contributionId: string) => Promise<void>;
  impactReport: ReturnType<typeof generateImpactReport>;
  patronTier: string;
  nextTier: ReturnType<typeof getNextTierRequirement>;
}

export const usePatronData = (): UsePatronDataReturn => {
  const [data, setData] = useState<PatronDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dashboardData = getPatronDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patron data');
    } finally {
      setLoading(false);
    }
  }, []);

  const addContribution = useCallback(async (contributionData: Partial<Contribution>) => {
    try {
      setLoading(true);
      const newContribution = createContribution(contributionData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          contributions: [newContribution, ...prevData.contributions],
          impact: {
            ...prevData.impact,
            totalContributed: prevData.impact.totalContributed + newContribution.amount,
          },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contribution');
    } finally {
      setLoading(false);
    }
  }, []);

  const processContributionById = useCallback(async (contributionId: string) => {
    try {
      setData(prevData => {
        if (!prevData) return prevData;
        
        const updatedContributions = prevData.contributions.map(contribution => 
          contribution.id === contributionId ? processContribution(contribution) : contribution
        );
        
        return {
          ...prevData,
          contributions: updatedContributions,
        };
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process contribution');
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Derived values
  const impactReport = data ? generateImpactReport(data.contributions) : {
    totalAmount: 0,
    totalImpact: 0,
    averageImpactPerDollar: '0',
    currentTier: 'Community Friend',
    nextTier: { tier: 'Guild Benefactor', required: 200 },
    monthlyTrend: 0,
  };

  const patronTier = data ? calculatePatronTier(data.impact.totalContributed) : 'Community Friend';
  const nextTier = data ? getNextTierRequirement(data.impact.totalContributed) : { tier: 'Guild Benefactor', required: 200 };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    addContribution,
    processContributionById,
    impactReport,
    patronTier,
    nextTier,
  };
};

// Specialized hooks for specific data
export const usePatronImpact = (): { impact: PatronImpact | null; loading: boolean } => {
  const { data, loading } = usePatronData();
  return {
    impact: data?.impact || null,
    loading,
  };
};

export const usePatronContributions = () => {
  const { 
    data, 
    loading, 
    error, 
    addContribution, 
    processContributionById,
    impactReport 
  } = usePatronData();
  
  return {
    contributions: data?.contributions || [],
    loading,
    error,
    addContribution,
    processContribution: processContributionById,
    totalContributions: data ? getTotalContributions(data.contributions) : 0,
    totalImpact: data ? getTotalImpact(data.contributions) : 0,
    impactReport,
  };
};

export const usePatronBenefits = () => {
  const { data, loading, error, patronTier, nextTier } = usePatronData();
  
  return {
    benefits: data?.benefits || [],
    unlockedBenefits: data?.benefits.filter(b => b.unlocked) || [],
    lockedBenefits: data?.benefits.filter(b => !b.unlocked) || [],
    patronTier,
    nextTier,
    loading,
    error,
  };
};

export const usePatronImpactStories = () => {
  const { data, loading, error } = usePatronData();
  
  return {
    stories: data?.impactStories || [],
    communityStats: data?.communityStats || { goalSuccessRate: 0, livesImpacted: 0, thankYouMessages: 0 },
    loading,
    error,
  };
};