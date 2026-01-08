import { 
  Contribution, 
  PatronBenefit, 
  PatronImpact, 
  ImpactStory, 
  PatronDashboardData,
  ContributionSchema,
  PatronBenefitSchema,
  PatronImpactSchema,
  ImpactStorySchema
} from './types';

// Mock patron data
const mockPatronImpact: PatronImpact = PatronImpactSchema.parse({
  totalSupported: 45,
  goalsAchieved: 127,
  communityGrowth: 18,
  totalContributed: 1200,
});

const mockContributions: Contribution[] = [
  ContributionSchema.parse({
    id: 'contrib-1',
    month: 'November 2024',
    amount: 150,
    impact: 12,
    status: 'processed',
  }),
  ContributionSchema.parse({
    id: 'contrib-2',
    month: 'October 2024',
    amount: 150,
    impact: 15,
    status: 'processed',
  }),
  ContributionSchema.parse({
    id: 'contrib-3',
    month: 'September 2024',
    amount: 100,
    impact: 8,
    status: 'processed',
  }),
];

const mockPatronBenefits: PatronBenefit[] = [
  PatronBenefitSchema.parse({
    name: 'Early Access to Features',
    unlocked: true,
    description: 'Get first access to new platform features',
  }),
  PatronBenefitSchema.parse({
    name: 'Exclusive Patron Events',
    unlocked: true,
    description: 'Join special community events and workshops',
  }),
  PatronBenefitSchema.parse({
    name: 'Monthly Impact Reports',
    unlocked: true,
    description: 'Detailed reports on your contribution impact',
  }),
  PatronBenefitSchema.parse({
    name: 'Direct Developer Access',
    unlocked: false,
    requirement: '$200/month',
    description: 'Direct communication channel with development team',
  }),
];

const mockImpactStories: ImpactStory[] = [
  ImpactStorySchema.parse({
    id: 'story-1',
    title: 'Maria\'s Career Transformation',
    description: 'Thanks to your support, Maria was able to access premium career coaching services. She successfully transitioned from junior developer to team lead, increasing her salary by 40% and gaining confidence in leadership.',
    achievement: 'Career advancement',
    impact: 'Your contribution directly supported this achievement',
  }),
];

const mockCommunityStats = {
  goalSuccessRate: 89,
  livesImpacted: 324,
  thankYouMessages: 156,
};

// Data factory functions
export const createContribution = (data: Partial<Contribution>): Contribution => {
  return ContributionSchema.parse({
    id: Date.now().toString(),
    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    amount: 0,
    impact: 0,
    status: 'pending',
    ...data,
  });
};

export const processContribution = (contribution: Contribution): Contribution => {
  return ContributionSchema.parse({
    ...contribution,
    status: 'processed',
  });
};

export const calculateImpactMultiplier = (amount: number): number => {
  // Simple formula: every $10 can support approximately 1 user's goal
  return Math.floor(amount / 10);
};

// Data access functions
export const getPatronImpact = (): PatronImpact => {
  return mockPatronImpact;
};

export const getPatronContributions = (): Contribution[] => {
  return mockContributions;
};

export const getPatronBenefits = (): PatronBenefit[] => {
  return mockPatronBenefits;
};

export const getImpactStories = (): ImpactStory[] => {
  return mockImpactStories;
};

export const getCommunityStats = () => {
  return mockCommunityStats;
};

export const getPatronDashboardData = (): PatronDashboardData => {
  return {
    impact: getPatronImpact(),
    contributions: getPatronContributions(),
    benefits: getPatronBenefits(),
    impactStories: getImpactStories(),
    communityStats: getCommunityStats(),
  };
};

// Utility functions
export const getTotalContributions = (contributions: Contribution[]): number => {
  return contributions
    .filter(contrib => contrib.status === 'processed')
    .reduce((total, contrib) => total + contrib.amount, 0);
};

export const getTotalImpact = (contributions: Contribution[]): number => {
  return contributions
    .filter(contrib => contrib.status === 'processed')
    .reduce((total, contrib) => total + contrib.impact, 0);
};

export const getUnlockedBenefits = (benefits: PatronBenefit[]): PatronBenefit[] => {
  return benefits.filter(benefit => benefit.unlocked);
};

export const getLockedBenefits = (benefits: PatronBenefit[]): PatronBenefit[] => {
  return benefits.filter(benefit => !benefit.unlocked);
};

export const calculatePatronTier = (totalContributed: number): string => {
  if (totalContributed >= 1000) return 'Noble Patron';
  if (totalContributed >= 500) return 'Royal Supporter';
  if (totalContributed >= 200) return 'Guild Benefactor';
  return 'Community Friend';
};

export const getNextTierRequirement = (totalContributed: number): { tier: string; required: number } => {
  if (totalContributed < 200) return { tier: 'Guild Benefactor', required: 200 - totalContributed };
  if (totalContributed < 500) return { tier: 'Royal Supporter', required: 500 - totalContributed };
  if (totalContributed < 1000) return { tier: 'Noble Patron', required: 1000 - totalContributed };
  return { tier: 'Maximum Tier Achieved', required: 0 };
};

export const calculateMonthlyImpactTrend = (contributions: Contribution[]): number => {
  if (contributions.length < 2) return 0;
  
  const recent = contributions[0];
  const previous = contributions[1];
  
  if (previous.impact === 0) return 100;
  return Math.round(((recent.impact - previous.impact) / previous.impact) * 100);
};

export const generateImpactReport = (contributions: Contribution[]) => {
  const totalAmount = getTotalContributions(contributions);
  const totalImpact = getTotalImpact(contributions);
  const tier = calculatePatronTier(totalAmount);
  const nextTier = getNextTierRequirement(totalAmount);
  
  return {
    totalAmount,
    totalImpact,
    averageImpactPerDollar: totalAmount > 0 ? (totalImpact / totalAmount).toFixed(2) : '0',
    currentTier: tier,
    nextTier,
    monthlyTrend: calculateMonthlyImpactTrend(contributions),
  };
};
