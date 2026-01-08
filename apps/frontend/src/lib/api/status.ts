/**
 * Status API utilities
 * 
 * Functions for checking service health and status.
 */

import { getApiBase } from '@/lib/utils';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  message?: string;
  timestamp?: string;
}

/**
 * Check health of a specific service endpoint
 */
export async function checkServiceHealth(endpoint: string): Promise<HealthCheckResponse> {
  const apiBase = getApiBase();
  const url = `${apiBase}${endpoint}`;
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      try {
        const data = await response.json();
        return {
          status: 'ok',
          message: data.message || 'Service is operational',
          timestamp: new Date().toISOString()
        };
      } catch {
        // If response is ok but not JSON, still consider it operational
        return {
          status: 'ok',
          message: 'Service is operational',
          timestamp: new Date().toISOString()
        };
      }
    } else if (response.status === 401 || response.status === 403) {
      // Authentication errors mean the service is up but requires auth
      return {
        status: 'ok',
        message: 'Service is operational (authentication required)',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        status: 'degraded',
        message: `Service returned status ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        status: 'down',
        message: 'Service timeout - no response received',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      status: 'down',
      message: error.message || 'Service unavailable',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check overall system health
 */
export async function checkSystemHealth(): Promise<{
  overall: 'operational' | 'degraded' | 'down';
  services: Array<{ name: string; status: HealthCheckResponse }>;
}> {
  const endpoints = [
    { name: 'API Gateway', endpoint: '/health' },
    { name: 'Authentication', endpoint: '/users/login' },
    { name: 'Goals', endpoint: '/quests' }
  ];

  const results = await Promise.all(
    endpoints.map(async (endpoint) => ({
      name: endpoint.name,
      status: await checkServiceHealth(endpoint.endpoint)
    }))
  );

  const hasDown = results.some(r => r.status.status === 'down');
  const allOperational = results.every(r => r.status.status === 'ok');

  return {
    overall: hasDown ? 'down' : allOperational ? 'operational' : 'degraded',
    services: results
  };
}

