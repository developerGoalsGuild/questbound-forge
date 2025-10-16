/**
 * API client for guild features.
 *
 * This module provides functions for managing guilds, including creation,
 * membership management, and content association.
 */

import { getAccessToken } from '@/lib/utils';

export interface Guild {
  guildId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  memberCount: number;
  goalCount: number;
  questCount: number;
  guildType: 'public' | 'private' | 'approval';
  tags: string[];
  members?: GuildMember[];
  goals?: Goal[];
  quests?: Quest[];
  // Ranking data
  position?: number;
  previousPosition?: number;
  totalScore?: number;
  activityScore?: number;
  growthRate?: number;
  badges?: string[];
  // Avatar data
  avatarUrl?: string;
  avatarKey?: string;
  // Moderation data
  moderators?: string[]; // userIds of moderators
  pendingRequests?: number;
  settings?: {
    allowJoinRequests: boolean;
    requireApproval: boolean;
    allowComments: boolean;
  };
}

export interface GuildCreateInput {
  name: string;
  description?: string;
  tags: string[];
  guildType: 'public' | 'private' | 'approval';
  settings?: {
    allowJoinRequests?: boolean;
    requireApproval?: boolean;
    allowComments?: boolean;
  };
}

export interface GuildUpdateInput {
  name?: string;
  description?: string;
  tags?: string[];
  guildType?: 'public' | 'private' | 'approval';
  settings?: {
    allowJoinRequests?: boolean;
    requireApproval?: boolean;
    allowComments?: boolean;
  };
}

export interface AvatarUploadResponse {
  avatarUrl: string;
  thumbnails: {
    '64x64': string;
    '128x128': string;
    '256x256': string;
  };
  uploadedAt: string;
}

export interface AvatarGetResponse {
  avatarUrl: string;
  size: string;
  expiresAt: string;
}

export interface GuildMember {
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
  lastSeenAt?: string;
  invitedBy?: string;
  // Moderation fields
  isBlocked?: boolean;
  blockedAt?: string;
  blockedBy?: string;
  canComment?: boolean;
}

export interface Goal {
  goalId: string;
  title: string;
  description?: string;
  status: string;
  addedAt: string;
  addedBy: string;
}

export interface Quest {
  questId: string;
  title: string;
  description?: string;
  status: string;
  addedAt: string;
  addedBy: string;
}

export interface GuildListResponse {
  guilds: Guild[];
  nextToken?: string;
  totalCount: number;
}

export interface GuildMemberListResponse {
  members: GuildMember[];
  nextToken?: string;
  totalCount: number;
}

export interface GuildJoinRequest {
  guildId: string;
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewReason?: string;
}

export interface GuildJoinRequestListResponse {
  requests: GuildJoinRequest[];
  nextToken?: string;
  totalCount: number;
}

export interface TransferOwnershipRequest {
  newOwnerId: string;
  reason?: string;
}

export interface ModerationAction {
  action: 'block_user' | 'unblock_user' | 'remove_comment' | 'toggle_comment_permission';
  targetUserId?: string;
  commentId?: string;
  reason?: string;
}

export class GuildAPIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'GuildAPIError';
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/v1';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('Guild API Request:', {
    method: options.method || 'GET',
    fullUrl,
    apiBaseUrl: API_BASE_URL,
    endpoint,
    hasToken: !!token,
    timestamp: new Date().toISOString()
  });

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Operation failed';
    console.error('Guild API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      url: endpoint,
      timestamp: new Date().toISOString()
    });
    throw new GuildAPIError(message, response.status);
  }

  // Handle empty responses (like 204 No Content for DELETE operations)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  // Check if response has content
  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text);
}

// Guild Management
export async function createGuild(data: GuildCreateInput): Promise<Guild> {
  return apiRequest<Guild>('/guilds', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      tags: data.tags,
      guild_type: data.guildType,
    }),
  });
}

export async function getMyGuilds(limit: number = 20, nextToken?: string): Promise<GuildListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    ...(nextToken && { next_token: nextToken }),
  });

  return apiRequest<GuildListResponse>(`/guilds?${params}`);
}

export async function getGuild(
  guildId: string,
  includeMembers: boolean = false,
  includeGoals: boolean = false,
  includeQuests: boolean = false
): Promise<Guild> {
  const params = new URLSearchParams({
    ...(includeMembers && { include_members: 'true' }),
    ...(includeGoals && { include_goals: 'true' }),
    ...(includeQuests && { include_quests: 'true' }),
  });

  const queryString = params.toString();
  const endpoint = `/guilds/${guildId}${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<Guild>(endpoint);
}

export async function updateGuild(guildId: string, data: GuildUpdateInput): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guildId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      tags: data.tags,
      guild_type: data.guildType,
    }),
  });
}

export async function deleteGuild(guildId: string): Promise<void> {
  return apiRequest<void>(`/guilds/${guildId}`, {
    method: 'DELETE',
  });
}

// Membership Management
export async function joinGuild(guildId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guildId}/join`, {
    method: 'POST',
  });
}

export async function leaveGuild(guildId: string): Promise<void> {
  return apiRequest<void>(`/guilds/${guildId}/leave`, {
    method: 'POST',
  });
}

export async function getGuildMembers(
  guildId: string,
  limit: number = 50,
  nextToken?: string,
  role?: 'owner' | 'member' | 'all'
): Promise<GuildMemberListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    ...(nextToken && { next_token: nextToken }),
    ...(role && role !== 'all' && { role }),
  });

  return apiRequest<GuildMemberListResponse>(`/guilds/${guildId}/members?${params}`);
}

export async function removeGuildMember(guildId: string, userId: string): Promise<void> {
  return apiRequest<void>(`/guilds/${guildId}/members/${userId}`, {
    method: 'DELETE',
  });
}

// Content Association
export async function addGoalToGuild(guildId: string, goalId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guildId}/goals/${goalId}`, {
    method: 'POST',
  });
}

export async function removeGoalFromGuild(guildId: string, goalId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guildId}/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export async function addQuestToGuild(guildId: string, questId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guildId}/quests/${questId}`, {
    method: 'POST',
  });
}

export async function removeQuestFromGuild(guildId: string, questId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guildId}/quests/${questId}`, {
    method: 'DELETE',
  });
}

// Discovery
export async function discoverGuilds(
  search?: string,
  tags?: string[],
  limit: number = 20,
  nextToken?: string
): Promise<GuildListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    ...(search && { search }),
    ...(nextToken && { next_token: nextToken }),
  });

  if (tags && tags.length > 0) {
    tags.forEach(tag => params.append('tags', tag));
  }

  return apiRequest<GuildListResponse>(`/guilds/discover?${params}`);
}

// Avatar upload functions
export const uploadGuildAvatar = async (guildId: string, file: File): Promise<AvatarUploadResponse> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to upload avatar';
    throw new Error(message);
  }

  return response.json();
};

export const getGuildAvatar = async (guildId: string, size: string = 'original'): Promise<AvatarGetResponse> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/avatar?size=${size}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to get avatar';
    throw new Error(message);
  }

  return response.json();
};

export const deleteGuildAvatar = async (guildId: string): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/avatar`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Failed to delete avatar';
    throw new Error(message);
  }
};

// Mock implementations for development
export const mockGuildAPI = {
  createGuild: async (data: GuildCreateInput): Promise<Guild> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockGuild: Guild = {
      guildId: `guild_${Date.now()}`,
      name: data.name,
      description: data.description,
      createdBy: 'current_user_id',
      createdAt: new Date().toISOString(),
      memberCount: 1,
      goalCount: 0,
      questCount: 0,
      guildType: data.guildType,
      tags: data.tags,
    };
    
    console.log('Mock createGuild:', mockGuild);
    return mockGuild;
  },

  getMyGuilds: async (limit: number = 20, nextToken?: string): Promise<GuildListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockGuilds: Guild[] = [
      {
        guildId: 'guild_1',
        name: 'Fitness Enthusiasts',
        description: 'A community focused on health and fitness goals',
        createdBy: 'current_user_id',
        createdAt: '2024-01-15T10:00:00Z',
        memberCount: 15,
        goalCount: 8,
        questCount: 3,
        guildType: 'public',
        tags: ['fitness', 'health', 'wellness'],
      },
      {
        guildId: 'guild_2',
        name: 'Study Group Alpha',
        description: 'Collaborative learning and academic achievement',
        createdBy: 'user_2',
        createdAt: '2024-01-10T14:30:00Z',
        memberCount: 12,
        goalCount: 5,
        questCount: 7,
        guildType: 'public',
        tags: ['education', 'learning', 'academic'],
      },
      {
        guildId: 'guild_3',
        name: 'Creative Writers',
        description: 'Private guild for aspiring writers',
        createdBy: 'current_user_id',
        createdAt: '2024-01-05T09:15:00Z',
        memberCount: 8,
        goalCount: 12,
        questCount: 4,
        guildType: 'private',
        tags: ['writing', 'creative', 'literature'],
      },
      {
        guildId: 'guild_4',
        name: 'Elite Developers',
        description: 'An exclusive guild for experienced developers. Requires approval to join.',
        createdBy: 'user_6',
        createdAt: '2024-01-12T11:30:00Z',
        memberCount: 5,
        goalCount: 20,
        questCount: 15,
        guildType: 'approval',
        tags: ['programming', 'elite', 'senior'],
        moderators: ['user_7', 'user_8'],
        pendingRequests: 3,
        settings: {
          allowJoinRequests: true,
          requireApproval: true,
          allowComments: true,
        },
      },
    ];
    
    return {
      guilds: mockGuilds,
      totalCount: mockGuilds.length,
    };
  },

  getGuild: async (guildId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockGuild: Guild = {
      guildId,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      createdBy: 'current_user_id',
      createdAt: '2024-01-15T10:00:00Z',
      memberCount: 15,
      goalCount: 8,
      questCount: 3,
      guildType: 'public',
      tags: ['fitness', 'health', 'wellness'],
      members: [
        {
          userId: 'current_user_id',
          username: 'current_user',
          role: 'owner',
          joinedAt: '2024-01-15T10:00:00Z',
        },
        {
          userId: 'user_2',
          username: 'fitness_fan',
          role: 'moderator',
          joinedAt: '2024-01-16T11:00:00Z',
        },
      ],
    };
    
    return mockGuild;
  },

  joinGuild: async (guildId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockGuild: Guild = {
      guildId,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      createdBy: 'user_2',
      createdAt: '2024-01-15T10:00:00Z',
      memberCount: 16, // Incremented
      goalCount: 8,
      questCount: 3,
      guildType: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  leaveGuild: async (guildId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    console.log('Mock leaveGuild:', guildId);
  },

  updateGuild: async (guildId: string, data: GuildUpdateInput): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockGuild: Guild = {
      guildId,
      name: data.name || 'Updated Guild Name',
      description: data.description,
      createdBy: 'current_user_id',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: new Date().toISOString(),
      memberCount: 15,
      goalCount: 8,
      questCount: 3,
      guildType: data.guildType ?? 'public',
      tags: data.tags || ['fitness', 'health'],
    };
    
    return mockGuild;
  },

  deleteGuild: async (guildId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock deleteGuild:', guildId);
  },

  getGuildMembers: async (guildId: string): Promise<GuildMemberListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockMembers: GuildMember[] = [
      {
        userId: 'current_user_id',
        username: 'current_user',
        role: 'owner',
        joinedAt: '2024-01-15T10:00:00Z',
      },
      {
        userId: 'user_2',
        username: 'fitness_fan',
        role: 'member',
        joinedAt: '2024-01-16T11:00:00Z',
      },
      {
        userId: 'user_3',
        username: 'health_guru',
        role: 'member',
        joinedAt: '2024-01-17T09:30:00Z',
      },
    ];
    
    return {
      members: mockMembers,
      totalCount: mockMembers.length,
    };
  },

  removeGuildMember: async (guildId: string, userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock removeGuildMember:', { guildId, userId });
  },

  addGoalToGuild: async (guildId: string, goalId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockGuild: Guild = {
      guildId,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      createdBy: 'current_user_id',
      createdAt: '2024-01-15T10:00:00Z',
      memberCount: 15,
      goalCount: 9, // Incremented
      questCount: 3,
      guildType: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  removeGoalFromGuild: async (guildId: string, goalId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockGuild: Guild = {
      guildId,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      createdBy: 'current_user_id',
      createdAt: '2024-01-15T10:00:00Z',
      memberCount: 15,
      goalCount: 7, // Decremented
      questCount: 3,
      guildType: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  addQuestToGuild: async (guildId: string, questId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockGuild: Guild = {
      guildId,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      createdBy: 'current_user_id',
      createdAt: '2024-01-15T10:00:00Z',
      memberCount: 15,
      goalCount: 8,
      questCount: 4, // Incremented
      guildType: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  removeQuestFromGuild: async (guildId: string, questId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockGuild: Guild = {
      guildId,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      createdBy: 'current_user_id',
      createdAt: '2024-01-15T10:00:00Z',
      memberCount: 15,
      goalCount: 8,
      questCount: 2, // Decremented
      guildType: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  discoverGuilds: async (search?: string, tags?: string[]): Promise<GuildListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockGuilds: Guild[] = [
      {
        guildId: 'guild_4',
        name: 'Tech Innovators',
        description: 'Building the future with technology',
        createdBy: 'user_4',
        createdAt: '2024-01-20T16:00:00Z',
        memberCount: 25,
        goalCount: 15,
        questCount: 8,
        guildType: 'public',
        tags: ['technology', 'innovation', 'coding'],
      },
      {
        guildId: 'guild_5',
        name: 'Art & Design',
        description: 'Creative minds coming together',
        createdBy: 'user_5',
        createdAt: '2024-01-18T12:00:00Z',
        memberCount: 18,
        goalCount: 10,
        questCount: 6,
        guildType: 'public',
        tags: ['art', 'design', 'creative'],
      },
    ];
    
    return {
      guilds: mockGuilds,
      totalCount: mockGuilds.length,
    };
  },

  getGuildRankings: async (limit?: number) => {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const mockRankings: Guild[] = Array.from({ length: limit || 20 }, (_, index) => {
      const position = index + 1;
      const memberCount = Math.floor(Math.random() * 200) + 10;
      const goalCount = Math.floor(Math.random() * 50) + 5;
      const questCount = Math.floor(Math.random() * 30) + 3;
      const activityScore = Math.floor(Math.random() * 40) + 60;
      const totalScore = Math.floor(
        (memberCount * 10) + 
        (goalCount * 50) + 
        (questCount * 100) + 
        (activityScore * 20) + 
        Math.random() * 1000
      );

      return {
        guildId: `guild-${index + 1}`,
        name: `Guild ${index + 1}`,
        description: `A great guild with amazing members`,
        createdBy: `user-${index + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        memberCount,
        goalCount,
        questCount,
        guildType: Math.random() > 0.2 ? 'public' : Math.random() > 0.5 ? 'private' : 'approval',
        tags: ['active', 'friendly', 'supportive'],
        position,
        previousPosition: Math.random() > 0.3 ? position + Math.floor(Math.random() * 5) - 2 : undefined,
        totalScore,
        activityScore,
        growthRate: Math.floor(Math.random() * 40) - 10,
        badges: ['Active', 'Growing', 'Community'],
      };
    });

    return mockRankings.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  },

  // Avatar upload functions
  uploadGuildAvatar: async (guildId: string, file: File): Promise<AvatarUploadResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate file validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB.');
    }

    // Generate mock avatar URLs
    const timestamp = Date.now();
    const baseUrl = `https://via.placeholder.com/256x256/6366f1/ffffff?text=Guild+${guildId}+${timestamp}`;
    
    return {
      avatarUrl: baseUrl,
      thumbnails: {
        '64x64': `https://via.placeholder.com/64x64/6366f1/ffffff?text=64`,
        '128x128': `https://via.placeholder.com/128x128/6366f1/ffffff?text=128`,
        '256x256': `https://via.placeholder.com/256x256/6366f1/ffffff?text=256`,
      },
      uploadedAt: new Date().toISOString(),
    };
  },

  getGuildAvatar: async (guildId: string, size: string = 'original'): Promise<AvatarGetResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock signed URL
    const timestamp = Date.now();
    const avatarUrl = `https://via.placeholder.com/256x256/6366f1/ffffff?text=Guild+${guildId}+${timestamp}`;
    
    return {
      avatarUrl,
      size,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    };
  },

  deleteGuildAvatar: async (guildId: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful deletion
    console.log(`Avatar deleted for guild ${guildId}`);
  },

  // Join request functions
  requestToJoinGuild: async (guildId: string, message?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Join request sent for guild ${guildId} with message: ${message || 'No message'}`);
  },

  getGuildJoinRequests: async (guildId: string): Promise<GuildJoinRequestListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockRequests: GuildJoinRequest[] = [
      {
        guildId,
        userId: 'user1',
        username: 'JohnDoe',
        email: 'john@example.com',
        avatarUrl: 'https://via.placeholder.com/40x40/6366f1/ffffff?text=JD',
        requestedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'pending',
      },
      {
        guildId,
        userId: 'user2',
        username: 'JaneSmith',
        email: 'jane@example.com',
        avatarUrl: 'https://via.placeholder.com/40x40/10b981/ffffff?text=JS',
        requestedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        status: 'pending',
      },
    ];

    return {
      requests: mockRequests,
      totalCount: mockRequests.length,
    };
  },

  approveJoinRequest: async (guildId: string, userId: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Join request approved for user ${userId} in guild ${guildId}. Reason: ${reason || 'No reason provided'}`);
  },

  rejectJoinRequest: async (guildId: string, userId: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Join request rejected for user ${userId} in guild ${guildId}. Reason: ${reason || 'No reason provided'}`);
  },

  // Ownership transfer functions
  transferGuildOwnership: async (guildId: string, newOwnerId: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Guild ownership transferred from current owner to ${newOwnerId} in guild ${guildId}. Reason: ${reason || 'No reason provided'}`);
  },

  // Moderator management functions
  assignModerator: async (guildId: string, userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${userId} assigned as moderator for guild ${guildId}`);
  },

  removeModerator: async (guildId: string, userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${userId} removed as moderator for guild ${guildId}`);
  },

  // Moderation actions
  performModerationAction: async (guildId: string, action: ModerationAction): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Moderation action performed in guild ${guildId}:`, action);
  },

  blockUser: async (guildId: string, userId: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${userId} blocked from guild ${guildId}. Reason: ${reason || 'No reason provided'}`);
  },

  unblockUser: async (guildId: string, userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${userId} unblocked from guild ${guildId}`);
  },

  removeComment: async (guildId: string, commentId: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Comment ${commentId} removed from guild ${guildId}. Reason: ${reason || 'No reason provided'}`);
  },

  toggleUserCommentPermission: async (guildId: string, userId: string, canComment: boolean): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${userId} comment permission in guild ${guildId} set to: ${canComment}`);
  },

  // Remove user from guild
  removeUserFromGuild: async (guildId: string, userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${userId} removed from guild ${guildId}`);
  },
};

// Use mock API in development
const isDevelopment = import.meta.env.DEV;

export const guildAPI = isDevelopment ? mockGuildAPI : {
  createGuild,
  getMyGuilds,
  getGuild,
  updateGuild,
  deleteGuild,
  joinGuild,
  leaveGuild,
  getGuildMembers,
  removeGuildMember,
  addGoalToGuild,
  removeGoalFromGuild,
  addQuestToGuild,
  removeQuestFromGuild,
  discoverGuilds,
  getGuildRankings: async (limit?: number) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const url = `${import.meta.env.VITE_API_BASE_URL}/guilds/rankings${limit ? `?limit=${limit}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch guild rankings';
      throw new Error(message);
    }

    return response.json();
  },
  uploadGuildAvatar,
  getGuildAvatar,
  deleteGuildAvatar,
  // Join request functions
  requestToJoinGuild: async (guildId: string, message?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/join-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to send join request';
      throw new Error(message);
    }
  },

  getGuildJoinRequests: async (guildId: string): Promise<GuildJoinRequestListResponse> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/join-requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch join requests';
      throw new Error(message);
    }

    return response.json();
  },

  approveJoinRequest: async (guildId: string, userId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/join-requests/${userId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to approve join request';
      throw new Error(message);
    }
  },

  rejectJoinRequest: async (guildId: string, userId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/join-requests/${userId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to reject join request';
      throw new Error(message);
    }
  },

  // Ownership transfer functions
  transferGuildOwnership: async (guildId: string, newOwnerId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/transfer-ownership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ newOwnerId, reason }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to transfer ownership';
      throw new Error(message);
    }
  },

  // Moderator management functions
  assignModerator: async (guildId: string, userId: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/moderators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to assign moderator';
      throw new Error(message);
    }
  },

  removeModerator: async (guildId: string, userId: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/moderators/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to remove moderator';
      throw new Error(message);
    }
  },

  // Moderation actions
  performModerationAction: async (guildId: string, action: ModerationAction): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/moderation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to perform moderation action';
      throw new Error(message);
    }
  },

  blockUser: async (guildId: string, userId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/block-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ userId, reason }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to block user';
      throw new Error(message);
    }
  },

  unblockUser: async (guildId: string, userId: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/unblock-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to unblock user';
      throw new Error(message);
    }
  },

  removeComment: async (guildId: string, commentId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to remove comment';
      throw new Error(message);
    }
  },

  toggleUserCommentPermission: async (guildId: string, userId: string, canComment: boolean): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/comment-permission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ userId, canComment }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to update comment permission';
      throw new Error(message);
    }
  },

  // Remove user from guild
  removeUserFromGuild: async (guildId: string, userId: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/guilds/${guildId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to remove user from guild';
      throw new Error(message);
    }
  },
};
