/**
 * Chat Page - Production messaging system
 * Real-time messaging functionality for GoalsGuild
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppSyncChatInterface } from '@/components/messaging/AppSyncChatInterface';
import { SimpleChatInterface } from '@/components/messaging/SimpleChatInterface';
import { ProductionChatInterface } from '@/components/messaging/ProductionChatInterface';
import { RoomMembersDialog } from '@/components/messaging/RoomMembersDialog';
import { RoomSettingsDialog } from '@/components/messaging/RoomSettingsDialog';
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
import { listRooms, getRoomsInfo } from '@/lib/api/messaging';
import { type Room } from '@/types/messaging';

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<string>('ROOM-general');
  const [chatMode, setChatMode] = useState<'simple' | 'production'>('production');
  const [chatRooms, setChatRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

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
          // Batch fetch room info for all rooms (reduces API calls via caching and parallel requests)
          const roomIds = rooms.map(r => r.id);
          const roomsInfoMap = await getRoomsInfo(roomIds);
          
          // Enrich rooms with live member counts and updated name/description from database
          const roomsWithCounts = rooms.map((r) => {
            const info = roomsInfoMap.get(r.id);
            if (info) {
              const count = info.memberCount ?? 0;
              // Use name and description from room info (database) instead of listRooms
              let roomName = r.name;
              let roomDescription = r.description || '';
              
              // Extract name based on room type (RoomInfo is a union type)
              if ('roomName' in info && info.roomName) {
                roomName = info.roomName;
              } else if ('guildName' in info && info.guildName) {
                roomName = info.guildName;
              }
              
              if ('description' in info && info.description) {
                roomDescription = info.description;
              }
              
              return { 
                ...(r as Room), 
                name: roomName,
                description: roomDescription,
                memberCount: count 
              };
            }
            // Fallback if room info not available
            return { ...(r as Room), memberCount: r.memberCount ?? 0 };
          });
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
        if (!selectedRoom) {
          return;
        }
        // Use batch function which leverages caching - if room was already fetched in listRooms, this will use cache
        const roomsInfoMap = await getRoomsInfo([selectedRoom]);
        const info = roomsInfoMap.get(selectedRoom);
        if (!mounted) return;
        if (info) {
          const count = info.memberCount ?? 0;
          setActiveConnections(count);
        } else {
          setActiveConnections(0);
        }
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
              <Badge variant="outline" className="flex items-center space-x-1 hidden">
                <Users className="h-3 w-3" />
                <span>Live</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatMode(chatMode === 'production' ? 'simple' : 'production')}
                className="flex items-center space-x-1 hidden"
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
                        onSettings={() => setShowSettingsDialog(true)}
                        onMembers={() => setShowMembersDialog(true)}
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
                      onSettings={() => setShowSettingsDialog(true)}
                      onMembers={() => setShowMembersDialog(true)}
                      className="h-full"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>

      {/* Room Members Dialog */}
      <RoomMembersDialog
        roomId={selectedRoom}
        roomName={selectedRoomData?.name}
        roomType={selectedRoomData?.type}
        isOpen={showMembersDialog}
        onClose={() => setShowMembersDialog(false)}
        currentUserId={userId}
      />

      {/* Room Settings Dialog */}
      <RoomSettingsDialog
        roomId={selectedRoom}
        roomName={selectedRoomData?.name}
        roomType={selectedRoomData?.type}
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        onSettingsUpdated={async () => {
          // Refresh room data after settings are updated
          try {
            const rooms = await listRooms();
            if (rooms && rooms.length) {
              // Use batch function to fetch all room info efficiently
              const roomIds = rooms.map(r => r.id);
              const roomsInfoMap = await getRoomsInfo(roomIds);
              const roomsWithCounts = rooms.map((r) => {
                const info = roomsInfoMap.get(r.id);
                if (info) {
                  const count = (info?.memberCount ?? 0) as number;
                  return { ...(r as Room), memberCount: count };
                }
                return { ...(r as Room), memberCount: r.memberCount ?? 0 };
              });
              setChatRooms(roomsWithCounts);
              
              // Update selected room if it still exists
              const exists = roomsWithCounts.some(r => r.id === selectedRoom);
              if (exists && selectedRoomData) {
                const updatedRoom = roomsWithCounts.find(r => r.id === selectedRoom);
                if (updatedRoom) {
                  // Room data refreshed
                }
              }
            }
          } catch (error) {
            console.error('Error refreshing room data after settings update:', error);
          }
        }}
      />
    </div>
  );
}
