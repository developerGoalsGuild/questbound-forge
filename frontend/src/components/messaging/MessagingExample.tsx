/**
 * Example implementation of the messaging system
 * Shows how to integrate the ChatInterface component
 */

import React, { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Message } from '../../types/messaging';
import { Users, MessageSquare, Settings, Plus } from 'lucide-react';

interface MessagingExampleProps {
  userId: string;
  className?: string;
}

export function MessagingExample({ userId, className = '' }: MessagingExampleProps) {
  const [activeRoom, setActiveRoom] = useState<string>('ROOM-general');
  const [rooms] = useState([
    {
      id: 'ROOM-general',
      name: 'General Chat',
      type: 'general' as const,
      description: 'Main discussion room',
      memberCount: 12,
      isActive: true
    },
    {
      id: 'GUILD#guild-123',
      name: 'Guild Chat',
      type: 'guild' as const,
      description: 'Guild members only',
      memberCount: 8,
      isActive: true
    },
    {
      id: 'ROOM-project-alpha',
      name: 'Project Alpha',
      type: 'general' as const,
      description: 'Project discussion',
      memberCount: 5,
      isActive: false
    }
  ]);

  const handleMessageSent = (message: Message) => {
    console.log('Message sent:', message);
    // Here you could update local state, send notifications, etc.
  };

  const handleError = (error: string) => {
    console.error('Messaging error:', error);
    // Here you could show toast notifications, log errors, etc.
  };

  const activeRoomData = rooms.find(room => room.id === activeRoom);

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Messages
            </h1>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeRoom === room.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveRoom(room.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {room.name}
                  </h3>
                  <Badge variant={room.type === 'guild' ? 'default' : 'secondary'}>
                    {room.type === 'guild' ? 'Guild' : 'General'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {room.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="h-3 w-3" />
                    <span>{room.memberCount} members</span>
                  </div>
                  {room.isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {userId.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                User {userId.slice(-4)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoomData ? (
          <ChatInterface
            roomId={activeRoom}
            userId={userId}
            roomName={activeRoomData.name}
            roomType={activeRoomData.type}
            onMessageSent={handleMessageSent}
            onError={handleError}
            className="h-full"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="text-center">Select a Room</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Choose a room from the sidebar to start chatting.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Usage example component
export function MessagingDemo() {
  const [userId] = useState('user-123');

  return (
    <div className="h-screen">
      <MessagingExample userId={userId} />
    </div>
  );
}
