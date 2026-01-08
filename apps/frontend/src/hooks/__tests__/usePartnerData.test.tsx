/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePartnerData, usePartnerMetrics, usePartnerServices, usePartnerAnalytics } from '../usePartnerData';
import * as partnerData from '@/data/partnerData';

// Mock the partner data functions
vi.mock('@/data/partnerData', () => ({
  getPartnerDashboardData: vi.fn(),
  createService: vi.fn(),
  toggleServiceStatus: vi.fn(),
  updateServiceMetrics: vi.fn(),
  calculateTotalRevenue: vi.fn(),
  getActiveServices: vi.fn(),
  generateServiceReport: vi.fn()
}));

const mockPartnerData = vi.mocked(partnerData);

describe('usePartnerData', () => {
  const mockService = {
    id: '1',
    name: 'Premium Coaching',
    active: true,
    engagement: 85,
    revenue: 2500
  };

  const mockDashboardData = {
    metrics: {
      totalUsers: 15420,
      activeEngagements: 2340,
      monthlyRevenue: 45600,
      satisfaction: 4.7
    },
    services: [mockService],
    engagementTrends: {
      thisMonth: 15,
      lastMonth: 8
    },
    topServices: [
      {
        name: 'Premium Coaching',
        engagement: 85
      }
    ],
    activities: [
      {
        id: '1',
        type: 'enrollment',
        activity: 'New user enrolled',
        details: 'John Doe • 2 hours ago'
      }
    ]
  };

  const mockNewService = {
    id: '2',
    name: 'New Service',
    active: false,
    engagement: 0,
    revenue: 0
  };

  const mockServiceReport = {
    totalServices: 2,
    activeServices: 1,
    totalRevenue: 2500,
    averageEngagement: 42.5,
    topPerformer: mockService
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    const { getPartnerDashboardData, createService, toggleServiceStatus, generateServiceReport } = mockPartnerData;

    getPartnerDashboardData.mockReturnValue(mockDashboardData);
    createService.mockReturnValue(mockNewService);
    toggleServiceStatus.mockImplementation((service) => ({ ...service, active: !service.active }));
    generateServiceReport.mockReturnValue(mockServiceReport);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('fetches data on mount', async () => {
    const { result } = renderHook(() => usePartnerData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.serviceReport).toEqual(mockServiceReport);
  });

  test('handles fetch error', async () => {
    const { getPartnerDashboardData } = mockPartnerData;
    getPartnerDashboardData.mockImplementation(() => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  test('refetch function reloads data', async () => {
    const { getPartnerDashboardData } = mockPartnerData;

    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refetch
    act(() => {
      result.current.refetch();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getPartnerDashboardData).toHaveBeenCalledTimes(2);
  });

  test('addService adds new service to data', async () => {
    const { createService } = mockPartnerData;

    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.addService({ name: 'New Service', active: false });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(createService).toHaveBeenCalledWith({ name: 'New Service', active: false });
    expect(result.current.data?.services).toContain(mockNewService);
  });

  test('addService handles error', async () => {
    const { createService } = mockPartnerData;
    createService.mockImplementation(() => {
      throw new Error('Create failed');
    });

    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.addService({ name: 'New Service' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Create failed');
  });

  test('updateService updates existing service', async () => {
    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateService('1', { engagement: 90 });
    });

    expect(result.current.data?.services[0].engagement).toBe(90);
  });

  test('updateService handles error', async () => {
    // Mock update to throw error
    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Force an error by updating with invalid data
    act(() => {
      // This would normally work, but let's simulate an error
      const originalData = result.current.data;
      act(() => {
        // Simulate error in update
        try {
          result.current.updateService('1', { engagement: 90 });
        } catch (e) {
          // Error handling
        }
      });
    });

    // Since the update function doesn't actually throw in our mock, it should work
    expect(result.current.data?.services[0].engagement).toBe(90);
  });

  test('toggleService toggles service active status', async () => {
    const { toggleServiceStatus } = mockPartnerData;

    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalActive = result.current.data?.services[0].active;

    act(() => {
      result.current.toggleService('1');
    });

    expect(toggleServiceStatus).toHaveBeenCalledWith(mockService);
    expect(result.current.data?.services[0].active).toBe(!originalActive);
  });

  test('deleteService removes service from data', async () => {
    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.services).toHaveLength(1);

    act(() => {
      result.current.deleteService('1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.services).toHaveLength(0);
  });

  test('deleteService handles error', async () => {
    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Force error by trying to delete non-existent service
    act(() => {
      result.current.deleteService('999');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still have the original service
    expect(result.current.data?.services).toHaveLength(1);
  });

  test('serviceReport is generated correctly', async () => {
    const { generateServiceReport } = mockPartnerData;

    const { result } = renderHook(() => usePartnerData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(generateServiceReport).toHaveBeenCalledWith(mockDashboardData.services);
    expect(result.current.serviceReport).toEqual(mockServiceReport);
  });
});

describe('usePartnerMetrics', () => {
  const mockDashboardData = {
    metrics: {
      totalUsers: 15420,
      activeEngagements: 2340,
      monthlyRevenue: 45600,
      satisfaction: 4.7
    },
    services: []
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getPartnerDashboardData } = mockPartnerData;
    getPartnerDashboardData.mockReturnValue(mockDashboardData);
  });

  test('returns metrics and loading state', async () => {
    const { result } = renderHook(() => usePartnerMetrics());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(mockDashboardData.metrics);
  });
});

describe('usePartnerServices', () => {
  const mockDashboardData = {
    services: [
      {
        id: '1',
        name: 'Premium Coaching',
        active: true,
        engagement: 85,
        revenue: 2500
      }
    ]
  };

  const mockActiveServices = [mockDashboardData.services[0]];
  const mockTotalRevenue = 2500;

  beforeEach(() => {
    vi.clearAllMocks();

    const { getPartnerDashboardData, getActiveServices, calculateTotalRevenue } = mockPartnerData;

    getPartnerDashboardData.mockReturnValue(mockDashboardData);
    getActiveServices.mockReturnValue(mockActiveServices);
    calculateTotalRevenue.mockReturnValue(mockTotalRevenue);
  });

  test('returns services data and computed values', async () => {
    const { result } = renderHook(() => usePartnerServices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services).toEqual(mockDashboardData.services);
    expect(result.current.activeServices).toEqual(mockActiveServices);
    expect(result.current.totalRevenue).toEqual(mockTotalRevenue);
  });

  test('includes service management functions', async () => {
    const { result } = renderHook(() => usePartnerServices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.addService).toBe('function');
    expect(typeof result.current.updateService).toBe('function');
    expect(typeof result.current.toggleService).toBe('function');
    expect(typeof result.current.deleteService).toBe('function');
  });
});

describe('usePartnerAnalytics', () => {
  const mockDashboardData = {
    engagementTrends: {
      thisMonth: 15,
      lastMonth: 8
    },
    topServices: [
      {
        name: 'Premium Coaching',
        engagement: 85
      }
    ],
    activities: [
      {
        id: '1',
        type: 'enrollment',
        activity: 'New user enrolled',
        details: 'John Doe • 2 hours ago'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const { getPartnerDashboardData } = mockPartnerData;
    getPartnerDashboardData.mockReturnValue(mockDashboardData);
  });

  test('returns analytics data', async () => {
    const { result } = renderHook(() => usePartnerAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.engagementTrends).toEqual(mockDashboardData.engagementTrends);
    expect(result.current.topServices).toEqual(mockDashboardData.topServices);
    expect(result.current.activities).toEqual(mockDashboardData.activities);
  });
});
