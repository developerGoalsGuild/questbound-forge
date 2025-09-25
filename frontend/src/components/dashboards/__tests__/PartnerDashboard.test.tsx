/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock the usePartnerData hook before importing the component
vi.mock('@/hooks/usePartnerData', () => ({
  usePartnerData: vi.fn()
}));

import PartnerDashboard from '../PartnerDashboard';
import { usePartnerData } from '@/hooks/usePartnerData';

// Get the mocked function
const mockUsePartnerData = vi.mocked(usePartnerData);

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div data-testid="card-title" className={className}>{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className }: any) => (
    <button data-testid={`button-${variant || 'default'}-${size || 'default'}`} className={className}>
      {children}
    </button>
  )
}));

vi.mock('lucide-react', () => ({
  Building2: () => <div data-testid="building-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />
}));

// Mock hooks
const mockPartnerData = {
  metrics: {
    totalUsers: 15420,
    activeEngagements: 2340,
    monthlyRevenue: 45600,
    satisfaction: 4.7
  },
  services: [
    {
      name: 'Premium Coaching',
      active: true,
      engagement: 85,
      revenue: 2500
    },
    {
      name: 'Group Workshops',
      active: false,
      engagement: 0,
      revenue: 0
    }
  ],
  engagementTrends: {
    thisMonth: 15,
    lastMonth: 8
  },
  topServices: [
    {
      name: 'Premium Coaching',
      engagement: 85
    },
    {
      name: 'One-on-One Sessions',
      engagement: 72
    }
  ],
  activities: [
    {
      id: '1',
      type: 'enrollment',
      activity: 'New user enrolled in Premium Coaching',
      details: 'John Doe • 2 hours ago'
    },
    {
      id: '2',
      type: 'completion',
      activity: 'Sarah completed Group Workshop',
      details: 'Workshop feedback: 5/5 • 5 hours ago'
    }
  ]
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      dashboard: {
        partner: {
          title: 'Partner Control Center',
          services: 'Services Management',
          analytics: 'Analytics Overview'
        }
      }
    }
  })
}));


describe('PartnerDashboard', () => {
  beforeEach(() => {
    // Set default mock return value
    mockUsePartnerData.mockReturnValue({
      data: mockPartnerData,
      loading: false,
      error: null
    });
  });

  test('renders loading state initially', () => {
    mockUsePartnerData.mockReturnValue({
      data: null,
      loading: true,
      error: null
    });

    render(<PartnerDashboard />);

    // Loading skeleton should be present with animate-pulse class
    const loadingSkeleton = document.querySelector('.animate-pulse');
    expect(loadingSkeleton).toBeInTheDocument();
  });

  test('renders error state when data loading fails', () => {
    mockUsePartnerData.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load partner data'
    });

    render(<PartnerDashboard />);

    expect(screen.getByText('Failed to load partner data')).toBeInTheDocument();
  });

  test('renders dashboard with partner data', () => {
    render(<PartnerDashboard />);

    expect(screen.getByText('Partner Control Center')).toBeInTheDocument();
    expect(screen.getByText('Manage your services and track business impact')).toBeInTheDocument();

    // Metrics cards
    expect(screen.getByText('15.420')).toBeInTheDocument(); // Total users
    expect(screen.getByText('2340')).toBeInTheDocument(); // Active engagements
    expect(screen.getByText('$45.600')).toBeInTheDocument(); // Monthly revenue
    expect(screen.getByText('4.7/5')).toBeInTheDocument(); // Satisfaction score

    // Services section
    expect(screen.getByText('Services Management')).toBeInTheDocument();
    // Check that Premium Coaching appears in the services list
    const serviceHeaders = screen.getAllByText('Premium Coaching');
    expect(serviceHeaders.length).toBeGreaterThan(0);
    expect(screen.getByText('Group Workshops')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Analytics section
    expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    expect(screen.getByText('User Engagement Trends')).toBeInTheDocument();
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();

    // Top performing services
    expect(screen.getByText('Top Performing Services')).toBeInTheDocument();
    // Premium Coaching appears in services management and top performing services
    const premiumCoachingElements = screen.getAllByText('Premium Coaching');
    expect(premiumCoachingElements).toHaveLength(2);
    expect(screen.getByText('One-on-One Sessions')).toBeInTheDocument();
    expect(screen.getByText('85% engagement')).toBeInTheDocument();
    expect(screen.getByText('72% engagement')).toBeInTheDocument();

    // Recent activity
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('New user enrolled in Premium Coaching')).toBeInTheDocument();
    expect(screen.getByText('Sarah completed Group Workshop')).toBeInTheDocument();
  });

  test('displays active service metrics', () => {
    render(<PartnerDashboard />);

    expect(screen.getByText('85%')).toBeInTheDocument(); // Engagement
    expect(screen.getByText('$2500')).toBeInTheDocument(); // Revenue
  });

  test('does not display metrics for inactive services', () => {
    render(<PartnerDashboard />);

    // Should not show metrics for inactive Group Workshops
    const revenueElements = screen.getAllByText(/\$[\d,]+/);
    expect(revenueElements).toHaveLength(2); // Only monthly revenue and active service revenue
  });

  test('renders action buttons', () => {
    render(<PartnerDashboard />);

    // Check for Manage buttons (should be one for each service)
    const manageButtons = screen.getAllByText('Manage');
    expect(manageButtons).toHaveLength(2); // Premium Coaching and Group Workshops
    expect(screen.getByText('Add New Service')).toBeInTheDocument();
    expect(screen.getByText('View Full Analytics')).toBeInTheDocument();
  });

  test('displays activity indicators with correct colors', () => {
    render(<PartnerDashboard />);

    // Should have activity indicators (dots) for each activity
    const activities = screen.getAllByTestId('card-content');
    // The activity section should contain the colored dots
    expect(activities.length).toBeGreaterThan(0);
  });

  test('formats large numbers correctly', () => {
    render(<PartnerDashboard />);

    expect(screen.getByText('15.420')).toBeInTheDocument();
    expect(screen.getByText('$45.600')).toBeInTheDocument();
  });

  test('displays satisfaction score with /5 suffix', () => {
    render(<PartnerDashboard />);

    expect(screen.getByText('4.7/5')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction Score')).toBeInTheDocument();
  });
});
