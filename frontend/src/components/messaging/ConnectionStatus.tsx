/**
 * Connection status component
 * Shows connection state, errors, and rate limiting information
 */

import React from 'react';
import { RateLimitInfo } from '../../types/messaging';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  hasError: boolean;
  errorMessage?: string;
  rateLimitInfo?: RateLimitInfo;
  onRetry?: () => void;
  className?: string;
}

export function ConnectionStatus({
  status,
  hasError,
  errorMessage,
  rateLimitInfo,
  onRetry,
  className = ''
}: ConnectionStatusProps) {
  // Don't show anything if connected and no errors
  if (status === 'connected' && !hasError && !rateLimitInfo?.isLimited) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-orange-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusMessage = () => {
    if (rateLimitInfo?.isLimited) {
      const resetTime = Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000);
      return `Rate limit exceeded. You can send messages again in ${resetTime} seconds.`;
    }

    if (hasError && errorMessage) {
      return errorMessage;
    }

    switch (status) {
      case 'connecting':
        return 'Connecting to chat...';
      case 'connected':
        return 'Connected to chat';
      case 'disconnected':
        return 'Disconnected from chat. Attempting to reconnect...';
      case 'error':
        return 'Connection error. Please check your network.';
      default:
        return 'Unknown connection status';
    }
  };

  const getAlertVariant = () => {
    if (rateLimitInfo?.isLimited) {
      return 'destructive';
    }
    if (hasError || status === 'error') {
      return 'destructive';
    }
    if (status === 'disconnected') {
      return 'default';
    }
    return 'default';
  };

  return (
    <div className={`px-4 py-2 ${className}`}>
      <Alert variant={getAlertVariant()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <AlertDescription>
              {getStatusMessage()}
            </AlertDescription>
          </div>
          
          {/* Retry button for errors or disconnections */}
          {(status === 'error' || status === 'disconnected') && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}
