/**
 * Chat Page - Production messaging system
 * Real-time messaging functionality for GoalsGuild
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppSyncChatInterface } from '@/components/messaging/AppSyncChatInterface';
import { SimpleChatInterface } from '@/components/messaging/SimpleChatInterface';
import { ProductionChatInterface } from '@/components/messaging/ProductionChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Users, 
  Settings,
  Database,
  Zap
} from 'lucide-react';
import { listRooms, getRoomInfo } from '@/lib/api/messaging';
import { type Room } from '@/types/messaging';

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<string>('ROOM-general');
  const [chatMode, setChatMode] = useState<'simple' | 'production'>('production');
  const [chatRooms, setChatRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  // Get user ID from authentication
  const userId = user?.id;

  // Load available chat rooms from messaging service
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setRoomsLoading(true);
        setRoomsError(null);
        const rooms = await listRooms();
        if (!mounted) return;
        if (rooms && rooms.length) {
          // Enrich rooms with live member counts
          const roomsWithCounts = await Promise.all(
            rooms.map(async (r) => {
              try {
                const info: any = await getRoomInfo(r.id);
                const count = (info?.memberCount ?? info?.active_connections ?? info?.activeConnections ?? 0) as number;
                return { ...(r as Room), memberCount: count };
              } catch {
                return { ...(r as Room), memberCount: r.memberCount ?? 0 };
              }
            })
          );
          setChatRooms(roomsWithCounts);
          // Keep current selection if still available, else default to first
          const exists = roomsWithCounts.some(r => r.id === selectedRoom);
          if (!exists) {
            setSelectedRoom(roomsWithCounts[0].id);
          }
        } else {
          // Fallback to default general room if API returns empty
          const fallback: Room = {
            id: 'ROOM-general',
            name: 'General Chat',
            type: 'general',
            description: 'Main discussion room for all users',
            memberCount: 0,
            isActive: true
          };
          setChatRooms([fallback]);
          setSelectedRoom('ROOM-general');
        }
      } catch (e: any) {
        if (!mounted) return;
        setRoomsError(e?.message || 'Failed to load rooms');
      } finally {
        if (mounted) setRoomsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedRoomData = chatRooms.find(room => room.id === selectedRoom);
  const [activeConnections, setActiveConnections] = useState<number>(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!selectedRoom) return;
        const info: any = await getRoomInfo(selectedRoom);
        if (!mounted) return;
        const count = (info?.memberCount ?? info?.member_count ?? info?.active_connections ?? info?.activeConnections ?? 0) as number;
        setActiveConnections(count);
      } catch {
        if (mounted) setActiveConnections(0);
      }
    })();
    return () => { mounted = false; };
  }, [selectedRoom]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access the chat functionality.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Chat
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Connect with your guild members and the community
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Live</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatMode(chatMode === 'production' ? 'simple' : 'production')}
                className="flex items-center space-x-1"
              >
                {chatMode === 'production' ? (
                  <>
                    <Database className="h-3 w-3" />
                    <span>Production</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3" />
                    <span>Demo</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Room Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Chat Rooms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {roomsLoading && (
                    <div className="p-4 text-sm text-gray-500">Loading rooms...</div>
                  )}
                  {roomsError && (
                    <div className="p-4 text-sm text-red-600">{roomsError}</div>
                  )}
                  {chatRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedRoom === room.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                          : ''
                      }`}
                      onClick={() => setSelectedRoom(room.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{room.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{room.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">{room.memberCount ?? 0}</span>
                          {room.isActive && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>{selectedRoomData?.name || 'Chat'}</span>
                  <Badge variant="outline" className="text-xs">
                    {activeConnections} members
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0">
                <div className="h-full min-h-0">
                  {chatMode === 'production' ? (
                    <ProductionChatInterface
                      roomId={selectedRoom}
                      userId={userId}
                      roomName={selectedRoomData?.name}
                      roomType={selectedRoomData?.type}
                      onMessageSent={(message) => {
                        console.log('Production message sent:', message);
                      }}
                      onError={(error) => {
                        console.error('Production chat error:', error);
                      }}
                      onStatsUpdate={(_, stats) => {
                        setActiveConnections(stats?.distinctSenders ?? 0);
                      }}
                      className="h-full"
                    />
                  ) : (
                    <SimpleChatInterface
                      roomId={selectedRoom}
                      userId={userId}
                      roomName={selectedRoomData?.name}
                      roomType={selectedRoomData?.type}
                      onMessageSent={(message) => {
                        console.log('Simple message sent:', message);
                      }}
                      onError={(error) => {
                        console.error('Simple chat error:', error);
                      }}
                      className="h-full"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
