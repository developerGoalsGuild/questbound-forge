/**
 * Chat header component
 * Displays room information, connection status, and controls
 */

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Settings, 
  MoreHorizontal,
  RefreshCw,
  Shield,
  Hash
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ChatHeaderProps {
  roomId: string;
  roomName?: string;
  roomType?: 'general' | 'guild';
  isConnected: boolean;
  activeConnections: number;
  onRetry?: () => void;
  onSettings?: () => void;
  onMembers?: () => void;
  className?: string;
}

export function ChatHeader({
  roomId,
  roomName,
  roomType = 'general',
  isConnected,
  activeConnections,
  onRetry,
  onSettings,
  onMembers,
  className = ''
}: ChatHeaderProps) {
  const getRoomIcon = () => {
    if (roomType === 'guild') {
      return <Shield className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
  };

  const getRoomDisplayName = () => {
    if (roomName) return roomName;
    if (roomType === 'guild') {
      return roomId.replace('GUILD#', 'Guild: ');
    }
    return `Room: ${roomId}`;
  };

  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {/* Room info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {getRoomIcon()}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getRoomDisplayName()}
          </h2>
        </div>

        {/* Room type badge */}
        <Badge variant={roomType === 'guild' ? 'default' : 'secondary'}>
          {roomType === 'guild' ? 'Guild' : 'General'}
        </Badge>

        {/* Connection status */}
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Active connections */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{activeConnections}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Active connections</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Retry connection */}
        {!isConnected && onRetry && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Retry connection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Members button */}
        {onMembers && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMembers}
                  className="h-8 w-8 p-0"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View members</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Settings menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Room settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMembers}>
              <Users className="h-4 w-4 mr-2" />
              View members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry connection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
