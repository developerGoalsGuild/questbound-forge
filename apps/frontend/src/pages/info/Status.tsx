/**
 * System Status Page
 * 
 * Displays real-time API health checks and system status.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { checkServiceHealth } from '@/lib/api/status';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

const Status: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const statusTranslations = (t as any)?.status || {};
  const commonTranslations = (t as any)?.common || {};

  const servicesToCheck = [
    { name: 'API Gateway', endpoint: '/health' },
    { name: 'Authentication Service', endpoint: '/users/login' },
    { name: 'Goals Service', endpoint: '/quests' },
    { name: 'Quests Service', endpoint: '/quests/quests' },
    { name: 'Guilds Service', endpoint: '/guilds' },
    { name: 'Messaging Service', endpoint: '/messaging/rooms' },
    { name: 'Subscriptions Service', endpoint: '/subscriptions/current' }
  ];

  const checkAllServices = async () => {
    setIsLoading(true);
    const results: ServiceStatus[] = [];

    for (const service of servicesToCheck) {
      try {
        const startTime = Date.now();
        const health = await checkServiceHealth(service.endpoint);
        const responseTime = Date.now() - startTime;
        
        results.push({
          name: service.name,
          status: health.status === 'ok' ? 'operational' : 'degraded',
          responseTime,
          lastChecked: new Date()
        });
      } catch (error: any) {
        results.push({
          name: service.name,
          status: 'down',
          lastChecked: new Date(),
          error: error.message || 'Service unavailable'
        });
      }
    }

    setServices(results);
    setLastUpdate(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      checkAllServices();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800">Down</Badge>;
    }
  };

  const overallStatus = services.length > 0
    ? services.every(s => s.status === 'operational')
      ? 'operational'
      : services.some(s => s.status === 'down')
        ? 'down'
        : 'degraded'
    : 'unknown';

  const uptimePercentage = services.length > 0
    ? (services.filter(s => s.status === 'operational').length / services.length) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {commonTranslations?.back || 'Back'}
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-8 w-8" />
                {statusTranslations?.title || 'System Status'}
              </h1>
              <p className="text-muted-foreground">
                {statusTranslations?.subtitle || 'Real-time service health and uptime information'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {autoRefresh ? statusTranslations?.autoRefreshOn || 'Auto-refresh ON' : statusTranslations?.autoRefreshOff || 'Auto-refresh OFF'}
            </Button>
            <Button
              variant="outline"
              onClick={checkAllServices}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {statusTranslations?.refresh || 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              {statusTranslations?.overallStatus || 'Overall Status'}
            </CardTitle>
            <CardDescription>
              {statusTranslations?.lastUpdated || 'Last Updated'}: {lastUpdate.toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {statusTranslations?.systemStatus || 'System Status'}
                </span>
                {getStatusBadge(overallStatus)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {statusTranslations?.uptime || 'Uptime'}
                  </span>
                  <span className="text-sm font-semibold">
                    {uptimePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      uptimePercentage >= 99 ? 'bg-green-500' :
                      uptimePercentage >= 95 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${uptimePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusTranslations?.services || 'Services'}
            </CardTitle>
            <CardDescription>
              {statusTranslations?.servicesDescription || 'Individual service status and response times'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {statusTranslations?.checking || 'Checking services...'}
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <div className="font-semibold">{service.name}</div>
                        {service.responseTime !== undefined && (
                          <div className="text-sm text-muted-foreground">
                            {service.responseTime}ms {statusTranslations?.responseTime || 'response time'}
                          </div>
                        )}
                        {service.error && (
                          <div className="text-sm text-red-600">
                            {service.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(service.status)}
                      <div className="text-xs text-muted-foreground">
                        {service.lastChecked.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incident History */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusTranslations?.incidentHistory || 'Incident History'}
            </CardTitle>
            <CardDescription>
              {statusTranslations?.incidentHistoryDescription || 'Recent incidents and maintenance windows'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              {statusTranslations?.noIncidents || 'No recent incidents'}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusTranslations?.additionalInfo || 'Additional Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {statusTranslations?.statusPageDescription || 
               'This status page provides real-time information about the health of GoalsGuild services. Status is checked every 30 seconds when auto-refresh is enabled.'}
            </p>
            <p>
              {statusTranslations?.contactSupport || 
               'If you experience issues not reflected here, please contact support at support@goalsguild.com'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Status;

