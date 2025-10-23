/**
 * Custom hook for WebSocket connection management
 * Provides low-level WebSocket functionality for messaging
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { UseWebSocketReturn, WebSocketMessage } from '../types/messaging';
import { getWebSocketUrl } from '../lib/api/messaging';

interface UseWebSocketOptions {
  roomId: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export function useWebSocket({
  roomId,
  autoConnect = true,
  reconnectAttempts = 5,
  reconnectDelay = 3000,
  heartbeatInterval = 30000
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string>();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  // Connect to WebSocket
  const connect = useCallback(async (targetRoomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      disconnect();
    }

    setConnectionStatus('connecting');
    setLastError(undefined);

    try {
      const wsUrl = getWebSocketUrl(targetRoomId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected to room ${targetRoomId}`);
        setIsConnected(true);
        setConnectionStatus('connected');
        setLastError(undefined);
        reconnectAttemptsRef.current = 0;
        
        // Send any queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        }
        
        // Start heartbeat
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected from room ${targetRoomId}:`, event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        stopHeartbeat();
        
        // Attempt reconnection if not a manual disconnect
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting WebSocket reconnection ${reconnectAttemptsRef.current}/${reconnectAttempts}`);
          
          setConnectionStatus('connecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(targetRoomId);
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
          setConnectionStatus('error');
          setLastError('Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setLastError('WebSocket connection error');
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('error');
      setLastError('Failed to connect to messaging service');
    }
  }, [reconnectAttempts, reconnectDelay]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback(async (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('WebSocket message sent:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        throw error;
      }
    } else {
      // Queue message for when connection is restored
      messageQueueRef.current.push(message);
      console.log('WebSocket not connected, message queued:', message);
    }
  }, []);

  // Heartbeat management
  const startHeartbeat = useCallback(() => {
    stopHeartbeat(); // Clear any existing heartbeat
    
    heartbeatTimeoutRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const heartbeatMessage: WebSocketMessage = {
          type: 'ping',
          timestamp: new Date().toISOString()
        };
        wsRef.current.send(JSON.stringify(heartbeatMessage));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = undefined;
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && roomId) {
      connect(roomId);
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, roomId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
    lastError
  };
}
