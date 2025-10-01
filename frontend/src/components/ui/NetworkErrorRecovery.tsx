import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Clock
} from 'lucide-react';

interface NetworkErrorRecoveryProps {
  /**
   * Whether the component is currently online
   */
  isOnline?: boolean;
  /**
   * Whether there's a network error
   */
  hasError?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * Function to retry the failed operation
   */
  onRetry?: () => void;
  /**
   * Function to check network status
   */
  onCheckStatus?: () => void;
  /**
   * Whether to show automatic retry countdown
   */
  showAutoRetry?: boolean;
  /**
   * Auto retry delay in seconds
   */
  autoRetryDelay?: number;
  /**
   * Maximum number of auto retries
   */
  maxAutoRetries?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Whether to show as inline alert or full card
   */
  variant?: 'inline' | 'card';
}

const NetworkErrorRecovery: React.FC<NetworkErrorRecoveryProps> = ({
  isOnline = true,
  hasError = false,
  errorMessage = 'Network connection lost',
  onRetry,
  onCheckStatus,
  showAutoRetry = true,
  autoRetryDelay = 5,
  maxAutoRetries = 3,
  className = '',
  variant = 'inline'
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto retry countdown
  useEffect(() => {
    if (hasError && showAutoRetry && retryCount < maxAutoRetries && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasError, showAutoRetry, retryCount, maxAutoRetries, countdown]);

  // Start auto retry countdown when error occurs
  useEffect(() => {
    if (hasError && showAutoRetry && retryCount < maxAutoRetries) {
      setCountdown(autoRetryDelay);
    }
  }, [hasError, showAutoRetry, retryCount, maxAutoRetries, autoRetryDelay]);

  // Auto retry when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && hasError && retryCount < maxAutoRetries) {
      handleRetry();
    }
  }, [countdown, hasError, retryCount, maxAutoRetries]);

  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      if (onRetry) {
        await onRetry();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCheckStatus = async () => {
    if (onCheckStatus) {
      await onCheckStatus();
    }
  };

  // Don't render if no error and online
  if (!hasError && isOnline) {
    return null;
  }

  const getStatusIcon = () => {
    if (isOnline && !hasError) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (hasError) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    } else {
      return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    if (isOnline && !hasError) {
      return 'Connection restored';
    } else if (hasError) {
      return errorMessage;
    } else {
      return 'No internet connection';
    }
  };

  const content = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <p className="text-sm font-medium">
            {getStatusMessage()}
          </p>
          {hasError && retryCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Retry attempt {retryCount} of {maxAutoRetries}
            </p>
          )}
          {hasError && showAutoRetry && retryCount < maxAutoRetries && countdown > 0 && (
            <p className="text-xs text-muted-foreground">
              Auto-retrying in {countdown}s
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {hasError && (
          <>
            {onCheckStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckStatus}
                disabled={isRetrying}
                className="flex items-center gap-1"
              >
                <Wifi className="h-3 w-3" />
                Check Status
              </Button>
            )}
            
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying || retryCount >= maxAutoRetries}
                className="flex items-center gap-1"
              >
                {isRetrying ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={`border-destructive ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            Network Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertDescription>
        {content}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Hook for managing network status and error recovery
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasError(false);
      setErrorMessage('');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasError(true);
      setErrorMessage('No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setError = (message: string) => {
    setHasError(true);
    setErrorMessage(message);
  };

  const clearError = () => {
    setHasError(false);
    setErrorMessage('');
  };

  return {
    isOnline,
    hasError,
    errorMessage,
    setError,
    clearError
  };
};

export default NetworkErrorRecovery;
