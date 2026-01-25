/**
 * Chat header component
 * Displays room information, connection status, and controls
 */

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
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
  roomDescription?: string;
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
  roomDescription,
  roomType = 'general',
  isConnected,
  activeConnections,
  onRetry,
  onSettings,
  onMembers,
  className = ''
}: ChatHeaderProps) {
  const { t } = useTranslation();
  const chatT = (t as any)?.chat?.header;

  const getRoomIcon = () => {
    if (roomType === 'guild') {
      return <Shield className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
  };

  const getRoomDisplayName = () => {
    // Prioritize passed roomName, but also handle empty strings
    if (roomName && roomName.trim()) return roomName;
    if (roomType === 'guild') {
      return chatT?.guildHall || 'Guild Hall';
    }
    return `${chatT?.roomPrefix || 'Room:'} ${roomId}`;
  };

  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {/* Room info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {getRoomIcon()}
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getRoomDisplayName()}
            </h2>
            {roomDescription && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {roomDescription}
              </p>
            )}
          </div>
        </div>

        {/* Room type badge */}
        <Badge variant={roomType === 'guild' ? 'default' : 'secondary'}>
          {roomType === 'guild' ? (chatT?.guild || 'Guild') : (chatT?.general || 'General')}
        </Badge>

        {/* Connection status */}
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isConnected ? (chatT?.connected || 'Connected') : (chatT?.disconnected || 'Disconnected')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-6">
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
                <p>{chatT?.retryConnection || 'Retry connection'}</p>
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
                <p>{chatT?.viewMembers || 'View members'}</p>
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
              {chatT?.roomSettings || 'Room settings'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMembers}>
              <Users className="h-4 w-4 mr-2" />
              {chatT?.viewMembers || 'View members'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {chatT?.retryConnection || 'Retry connection'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
