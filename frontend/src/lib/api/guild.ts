/**
 * API client for guild features.
 *
 * This module provides functions for managing guilds, including creation,
 * membership management, and content association.
 */

import { getAccessToken, getApiBase } from '@/lib/utils';

export interface GuildUserPermissions {
  is_member: boolean;
  is_owner: boolean;
  is_moderator: boolean;
  can_join: boolean;
  can_request_join: boolean;
  has_pending_request: boolean;
  can_leave: boolean;
  can_manage: boolean;
}

export interface Guild {
  guild_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  member_count: number;
  goal_count: number;
  quest_count: number;
  guild_type: 'public' | 'private' | 'approval';
  tags: string[];
  members?: GuildMember[];
  goals?: Goal[];
  quests?: Quest[];
  // Owner information
  owner_username?: string;
  owner_nickname?: string;
  // Ranking data
  position?: number;
  previous_position?: number;
  total_score?: number;
  activity_score?: number;
  growth_rate?: number;
  badges?: string[];
  // Avatar data
  avatar_url?: string;
  avatar_key?: string;
  // Moderation data
  moderators?: string[]; // user_ids of moderators
  pending_requests?: number;
  settings?: {
    allow_join_requests: boolean;
    require_approval: boolean;
    allow_comments: boolean;
  };
  // User permissions
  user_permissions?: GuildUserPermissions;
}

export interface GuildCreateInput {
  name: string;
  description?: string;
  tags: string[];
  guild_type: 'public' | 'private' | 'approval';
  settings?: {
    allow_join_requests?: boolean;
    require_approval?: boolean;
    allow_comments?: boolean;
  };
}

export interface GuildUpdateInput {
  name?: string;
  description?: string;
  tags?: string[];
  guild_type?: 'public' | 'private' | 'approval';
  settings?: {
    allow_join_requests?: boolean;
    require_approval?: boolean;
    allow_comments?: boolean;
  };
}

export interface AvatarUploadResponse {
  avatar_url: string;
  avatar_key: string;
  message: string;
}

export interface AvatarGetResponse {
  avatar_url: string;
  size: string;
  expiresAt: string;
}

export interface GuildMember {
  user_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
  last_seen_at?: string;
  invited_by?: string;
  // Moderation fields
  is_blocked?: boolean;
  blocked_at?: string;
  blocked_by?: string;
  can_comment?: boolean;
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
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface GuildMemberListResponse {
  members: GuildMember[];
  nextToken?: string;
  totalCount: number;
}

export interface GuildJoinRequest {
  guild_id: string;
  user_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_reason?: string;
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

const API_BASE_URL = getApiBase();

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
      guild_type: data.guild_type,
    }),
  });
}

// Check if guild name is available
export async function checkGuildNameAvailability(name: string): Promise<boolean> {
  try {
    const response = await apiRequest<{ available: boolean }>('/guilds/check-name', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return response.available;
  } catch (error) {
    console.error('Error checking guild name availability:', error);
    return false; // Assume not available if check fails
  }
}

export async function getMyGuilds(limit: number = 50, nextToken?: string): Promise<GuildListResponse> {
  const params = new URLSearchParams();
  
  // Only add limit if it's different from the default
  if (limit !== 50) {
    params.append('limit', limit.toString());
  }
  
  // Add nextToken if provided
  if (nextToken) {
    params.append('next_token', nextToken);
  }

  const queryString = params.toString();
  return apiRequest<GuildListResponse>(`/guilds${queryString ? `?${queryString}` : ''}`);
}

export async function getGuild(
  guild_id: string,
  includeMembers: boolean = false,
  includeGoals: boolean = false,
  includeQuests: boolean = false
): Promise<Guild> {
  // Validate guild_id parameter
  if (!guild_id || guild_id === 'undefined' || guild_id.trim() === '') {
    throw new GuildAPIError('Invalid guild ID provided', 400);
  }

  const params = new URLSearchParams({
    ...(includeMembers && { include_members: 'true' }),
    ...(includeGoals && { include_goals: 'true' }),
    ...(includeQuests && { include_quests: 'true' }),
  });

  const queryString = params.toString();
  const endpoint = `/guilds/${guild_id}${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<Guild>(endpoint);
}

export async function updateGuild(guild_id: string, data: GuildUpdateInput): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guild_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      tags: data.tags,
      guildType: data.guild_type,
      settings: data.settings,
    }),
  });
}

export async function deleteGuild(guild_id: string): Promise<void> {
  return apiRequest<void>(`/guilds/${guild_id}`, {
    method: 'DELETE',
  });
}

// Membership Management
export async function joinGuild(guild_id: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guild_id}/join`, {
    method: 'POST',
  });
}

export async function leaveGuild(guild_id: string): Promise<void> {
  return apiRequest<void>(`/guilds/${guild_id}/leave`, {
    method: 'POST',
  });
}

export async function getGuildMembers(
  guild_id: string,
  limit: number = 50,
  nextToken?: string,
  role?: 'owner' | 'member' | 'all'
): Promise<GuildMemberListResponse> {
  const params = new URLSearchParams();
  
  // Only add limit if it's different from the default
  if (limit !== 50) {
    params.append('limit', limit.toString());
  }
  
  // Add nextToken if provided
  if (nextToken) {
    params.append('next_token', nextToken);
  }
  
  // Add role if provided and not 'all'
  if (role && role !== 'all') {
    params.append('role', role);
  }

  const queryString = params.toString();
  return apiRequest<GuildMemberListResponse>(`/guilds/${guild_id}/members${queryString ? `?${queryString}` : ''}`);
}

export async function removeGuildMember(guild_id: string, user_id: string): Promise<void> {
  return apiRequest<void>(`/guilds/${guild_id}/members/${user_id}`, {
    method: 'DELETE',
  });
}

// Content Association
export async function addGoalToGuild(guild_id: string, goalId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guild_id}/goals/${goalId}`, {
    method: 'POST',
  });
}

export async function removeGoalFromGuild(guild_id: string, goalId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guild_id}/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export async function addQuestToGuild(guild_id: string, questId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guild_id}/quests/${questId}`, {
    method: 'POST',
  });
}

export async function removeQuestFromGuild(guild_id: string, questId: string): Promise<Guild> {
  return apiRequest<Guild>(`/guilds/${guild_id}/quests/${questId}`, {
    method: 'DELETE',
  });
}

// Discovery
export async function discoverGuilds(
  search?: string,
  tags?: string[],
  limit: number = 50,
  offset: number = 0,
  guildType?: string
): Promise<GuildListResponse> {
  const params = new URLSearchParams();
  
  // Only add limit if it's different from the default
  if (limit !== 50) {
    params.append('limit', limit.toString());
  }
  
  // Add offset if provided
  if (offset > 0) {
    params.append('offset', offset.toString());
  }
  
  // Add search if provided
  if (search) {
    params.append('search', search);
  }
  
  // Add guild type if provided
  if (guildType) {
    params.append('guild_type', guildType);
  }

  // Add tags if provided (comma-separated)
  if (tags && tags.length > 0) {
    params.append('tags', tags.join(','));
  }

  const queryString = params.toString();
  return apiRequest<GuildListResponse>(`/guilds${queryString ? `?${queryString}` : ''}`);
}

// Avatar upload functions
export const uploadGuildAvatar = async (guild_id: string, file: File): Promise<AvatarUploadResponse> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  // Step 1: Get presigned URL
  const presignedResponse = await fetch(`${getApiBase()}/guilds/${guild_id}/avatar/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: JSON.stringify({
      file_type: file.type,
      file_size: file.size
    }),
  });

  if (!presignedResponse.ok) {
    const errorBody = await presignedResponse.json().catch(() => ({}));
    const message = errorBody.detail || presignedResponse.statusText || 'Failed to get upload URL';
    throw new Error(message);
  }

  const { uploadUrl, avatarUrl, avatarKey } = await presignedResponse.json();

  // Step 2: Upload directly to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to S3');
  }

  // Step 3: Confirm upload
  const confirmResponse = await fetch(`${getApiBase()}/guilds/${guild_id}/avatar/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: JSON.stringify({
      avatar_key: avatarKey
    }),
  });

  if (!confirmResponse.ok) {
    const errorBody = await confirmResponse.json().catch(() => ({}));
    const message = errorBody.detail || confirmResponse.statusText || 'Failed to confirm upload';
    throw new Error(message);
  }

  return {
    avatar_url: avatarUrl,
    avatar_key: avatarKey,
    message: 'Avatar uploaded successfully'
  };
};

export const getGuildAvatar = async (guild_id: string, size: string = 'original'): Promise<AvatarGetResponse> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${getApiBase()}/guilds/${guild_id}/avatar?size=${size}`, {
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

export const deleteGuildAvatar = async (guild_id: string): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${getApiBase()}/guilds/${guild_id}/avatar`, {
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
      guild_id: `guild_${Date.now()}`,
      name: data.name,
      description: data.description,
      created_by: 'current_user_id',
      created_at: new Date().toISOString(),
      member_count: 1,
      goal_count: 0,
      quest_count: 0,
      guild_type: data.guild_type,
      tags: data.tags,
    };
    
    console.log('Mock createGuild:', mockGuild);
    return mockGuild;
  },

  getMyGuilds: async (limit: number = 50, nextToken?: string): Promise<GuildListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockGuilds: Guild[] = [
      {
        guild_id: 'guild_1',
        name: 'Fitness Enthusiasts',
        description: 'A community focused on health and fitness goals',
        created_by: 'current_user_id',
        created_at: '2024-01-15T10:00:00Z',
        member_count: 15,
        goal_count: 8,
        quest_count: 3,
        guild_type: 'public',
        tags: ['fitness', 'health', 'wellness'],
      },
      {
        guild_id: 'guild_2',
        name: 'Study Group Alpha',
        description: 'Collaborative learning and academic achievement',
        created_by: 'user_2',
        created_at: '2024-01-10T14:30:00Z',
        member_count: 12,
        goal_count: 5,
        quest_count: 7,
        guild_type: 'public',
        tags: ['education', 'learning', 'academic'],
      },
      {
        guild_id: 'guild_3',
        name: 'Creative Writers',
        description: 'Private guild for aspiring writers',
        created_by: 'current_user_id',
        created_at: '2024-01-05T09:15:00Z',
        member_count: 8,
        goal_count: 12,
        quest_count: 4,
        guild_type: 'private',
        tags: ['writing', 'creative', 'literature'],
      },
      {
        guild_id: 'guild_4',
        name: 'Elite Developers',
        description: 'An exclusive guild for experienced developers. Requires approval to join.',
        created_by: 'user_6',
        created_at: '2024-01-12T11:30:00Z',
        member_count: 5,
        goal_count: 20,
        quest_count: 15,
        guild_type: 'approval',
        tags: ['programming', 'elite', 'senior'],
        moderators: ['user_7', 'user_8'],
        pending_requests: 3,
        settings: {
          allow_join_requests: true,
          require_approval: true,
          allow_comments: true,
        },
      },
    ];
    
    return {
      guilds: mockGuilds,
      total: mockGuilds.length,
      limit: 50,
      offset: 0,
      has_more: false
    };
  },

  getGuild: async (guild_id: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockGuild: Guild = {
      guild_id: guild_id,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      created_by: 'current_user_id',
      created_at: '2024-01-15T10:00:00Z',
      member_count: 15,
      goal_count: 8,
      quest_count: 3,
      guild_type: 'public',
      tags: ['fitness', 'health', 'wellness'],
      members: [
        {
          user_id: 'current_user_id',
          username: 'current_user',
          role: 'owner',
          joined_at: '2024-01-15T10:00:00Z',
        },
        {
          user_id: 'user_2',
          username: 'fitness_fan',
          role: 'moderator',
          joined_at: '2024-01-16T11:00:00Z',
        },
      ],
    };
    
    return mockGuild;
  },

  joinGuild: async (guild_id: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockGuild: Guild = {
      guild_id,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      created_by: 'user_2',
      created_at: '2024-01-15T10:00:00Z',
      member_count: 16, // Incremented
      goal_count: 8,
      quest_count: 3,
      guild_type: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  leaveGuild: async (guild_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    console.log('Mock leaveGuild:', guild_id);
  },

  updateGuild: async (guild_id: string, data: GuildUpdateInput): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockGuild: Guild = {
      guild_id,
      name: data.name || 'Updated Guild Name',
      description: data.description,
      created_by: 'current_user_id',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
      member_count: 15,
      goal_count: 8,
      quest_count: 3,
      guild_type: data.guild_type ?? 'public',
      tags: data.tags || ['fitness', 'health'],
    };
    
    return mockGuild;
  },

  deleteGuild: async (guild_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock deleteGuild:', guild_id);
  },

  getGuildMembers: async (guild_id: string): Promise<GuildMemberListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockMembers: GuildMember[] = [
      {
        user_id: 'current_user_id',
        username: 'current_user',
        role: 'owner',
        joined_at: '2024-01-15T10:00:00Z',
      },
      {
        user_id: 'user_2',
        username: 'fitness_fan',
        role: 'member',
        joined_at: '2024-01-16T11:00:00Z',
      },
      {
        user_id: 'user_3',
        username: 'health_guru',
        role: 'member',
        joined_at: '2024-01-17T09:30:00Z',
      },
    ];
    
    return {
      members: mockMembers,
      totalCount: mockMembers.length,
    };
  },

  removeGuildMember: async (guild_id: string, user_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock removeGuildMember:', { guild_id, user_id });
  },

  addGoalToGuild: async (guild_id: string, goalId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockGuild: Guild = {
      guild_id,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      created_by: 'current_user_id',
      created_at: '2024-01-15T10:00:00Z',
      member_count: 15,
      goal_count: 9, // Incremented
      quest_count: 3,
      guild_type: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  removeGoalFromGuild: async (guild_id: string, goalId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockGuild: Guild = {
      guild_id,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      created_by: 'current_user_id',
      created_at: '2024-01-15T10:00:00Z',
      member_count: 15,
      goal_count: 7, // Decremented
      quest_count: 3,
      guild_type: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  addQuestToGuild: async (guild_id: string, questId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockGuild: Guild = {
      guild_id,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      created_by: 'current_user_id',
      created_at: '2024-01-15T10:00:00Z',
      member_count: 15,
      goal_count: 8,
      quest_count: 4, // Incremented
      guild_type: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  removeQuestFromGuild: async (guild_id: string, questId: string): Promise<Guild> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockGuild: Guild = {
      guild_id,
      name: 'Fitness Enthusiasts',
      description: 'A community focused on health and fitness goals',
      created_by: 'current_user_id',
      created_at: '2024-01-15T10:00:00Z',
      member_count: 15,
      goal_count: 8,
      quest_count: 2, // Decremented
      guild_type: 'public',
      tags: ['fitness', 'health', 'wellness'],
    };
    
    return mockGuild;
  },

  discoverGuilds: async (search?: string, tags?: string[], limit: number = 50, offset: number = 0, guildType?: string): Promise<GuildListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockGuilds: Guild[] = [
      {
        guild_id: 'guild_4',
        name: 'Tech Innovators',
        description: 'Building the future with technology',
        created_by: 'user_4',
        created_at: '2024-01-20T16:00:00Z',
        member_count: 25,
        goal_count: 15,
        quest_count: 8,
        guild_type: 'public',
        tags: ['technology', 'innovation', 'coding'],
      },
      {
        guild_id: 'guild_5',
        name: 'Art & Design',
        description: 'Creative minds coming together',
        created_by: 'user_5',
        created_at: '2024-01-18T12:00:00Z',
        member_count: 18,
        goal_count: 10,
        quest_count: 6,
        guild_type: 'public',
        tags: ['art', 'design', 'creative'],
      },
    ];
    
    let filteredGuilds = [...mockGuilds];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredGuilds = filteredGuilds.filter(guild => 
        guild.name.toLowerCase().includes(searchLower) ||
        (guild.description && guild.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply guild type filter
    if (guildType) {
      filteredGuilds = filteredGuilds.filter(guild => guild.guild_type === guildType);
    }
    
    // Apply tags filter
    if (tags && tags.length > 0) {
      filteredGuilds = filteredGuilds.filter(guild => 
        tags.some(tag => guild.tags.includes(tag))
      );
    }
    
    // Apply pagination
    const total = filteredGuilds.length;
    const paginatedGuilds = filteredGuilds.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    return {
      guilds: paginatedGuilds,
      total,
      limit,
      offset,
      has_more: hasMore
    };
  },

  getGuildRankings: async (limit: number = 50) => {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const mockRankings: Guild[] = Array.from({ length: limit }, (_, index) => {
      const position = index + 1;
      const member_count = Math.floor(Math.random() * 200) + 10;
      const goal_count = Math.floor(Math.random() * 50) + 5;
      const quest_count = Math.floor(Math.random() * 30) + 3;
      const activity_score = Math.floor(Math.random() * 40) + 60;
      const total_score = Math.floor(
        (member_count * 10) + 
        (goal_count * 50) + 
        (quest_count * 100) + 
        (activity_score * 20) + 
        Math.random() * 1000
      );

      return {
        guild_id: `guild-${index + 1}`,
        name: `Guild ${index + 1}`,
        description: `A great guild with amazing members`,
        created_by: `user-${index + 1}`,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        member_count,
        goal_count,
        quest_count,
        guild_type: Math.random() > 0.2 ? 'public' : Math.random() > 0.5 ? 'private' : 'approval',
        tags: ['active', 'friendly', 'supportive'],
        position,
        previous_position: Math.random() > 0.3 ? position + Math.floor(Math.random() * 5) - 2 : undefined,
        total_score,
        activity_score,
        growthRate: Math.floor(Math.random() * 40) - 10,
        badges: ['Active', 'Growing', 'Community'],
      };
    });

    return mockRankings.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
  },

  // Avatar upload functions
  uploadGuildAvatar: async (guild_id: string, file: File): Promise<AvatarUploadResponse> => {
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
    const baseUrl = `https://via.placeholder.com/256x256/6366f1/ffffff?text=Guild+${guild_id}+${timestamp}`;
    
    return {
      avatar_url: baseUrl,
      avatar_key: `guilds/${guild_id}/avatar/${timestamp}.png`,
      message: 'Avatar uploaded successfully',
    };
  },

  getGuildAvatar: async (guild_id: string, size: string = 'original'): Promise<AvatarGetResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock signed URL
    const timestamp = Date.now();
    const avatarUrl = `https://via.placeholder.com/256x256/6366f1/ffffff?text=Guild+${guild_id}+${timestamp}`;
    
    return {
      avatar_url: avatarUrl,
      size,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    };
  },

  deleteGuildAvatar: async (guild_id: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful deletion
    console.log(`Avatar deleted for guild ${guild_id}`);
  },

  // Join request functions
  requestToJoinGuild: async (guild_id: string, message?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Join request sent for guild ${guild_id} with message: ${message || 'No message'}`);
  },

  getGuildJoinRequests: async (guild_id: string): Promise<GuildJoinRequestListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockRequests: GuildJoinRequest[] = [
      {
        guild_id,
        user_id: 'user1',
        username: 'JohnDoe',
        email: 'john@example.com',
        avatar_url: 'https://via.placeholder.com/40x40/6366f1/ffffff?text=JD',
        requested_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'pending',
      },
      {
        guild_id,
        user_id: 'user2',
        username: 'JaneSmith',
        email: 'jane@example.com',
        avatar_url: 'https://via.placeholder.com/40x40/10b981/ffffff?text=JS',
        requested_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        status: 'pending',
      },
    ];

    return {
      requests: mockRequests,
      totalCount: mockRequests.length,
    };
  },

  approveJoinRequest: async (guild_id: string, user_id: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Join request approved for user ${user_id} in guild ${guild_id}. Reason: ${reason || 'No reason provided'}`);
  },

  rejectJoinRequest: async (guild_id: string, user_id: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Join request rejected for user ${user_id} in guild ${guild_id}. Reason: ${reason || 'No reason provided'}`);
  },

  // Ownership transfer functions
  transferGuildOwnership: async (guild_id: string, newOwnerId: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Guild ownership transferred from current owner to ${newOwnerId} in guild ${guild_id}. Reason: ${reason || 'No reason provided'}`);
  },

  // Moderator management functions
  assignModerator: async (guild_id: string, user_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${user_id} assigned as moderator for guild ${guild_id}`);
  },

  removeModerator: async (guild_id: string, user_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${user_id} removed as moderator for guild ${guild_id}`);
  },

  // Moderation actions
  performModerationAction: async (guild_id: string, action: ModerationAction): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Moderation action performed in guild ${guild_id}:`, action);
  },

  blockUser: async (guild_id: string, user_id: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${user_id} blocked from guild ${guild_id}. Reason: ${reason || 'No reason provided'}`);
  },

  unblockUser: async (guild_id: string, user_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${user_id} unblocked from guild ${guild_id}`);
  },

  removeComment: async (guild_id: string, commentId: string, reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Comment ${commentId} removed from guild ${guild_id}. Reason: ${reason || 'No reason provided'}`);
  },

  toggleUserCommentPermission: async (guild_id: string, user_id: string, canComment: boolean): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${user_id} comment permission in guild ${guild_id} set to: ${canComment}`);
  },

  // Remove user from guild
  removeUserFromGuild: async (guild_id: string, user_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`User ${user_id} removed from guild ${guild_id}`);
  },
};

// Export the real API functions directly - all endpoints are authorized with tokens
export const guildAPI = {
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
  getGuildRankings: async (limit: number = 50) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    // Only add limit if it's different from the default
    const queryString = limit !== 50 ? `?limit=${limit}` : '';
    const url = `${getApiBase()}/guilds/rankings${queryString}`;

    console.log('Guild rankings API call:', {
      url,
      method: 'GET',
      hasToken: !!token,
      limit
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    console.log('Guild rankings API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch guild rankings';
      console.error('Guild rankings API error:', errorBody);
      throw new Error(message);
    }



    const data = await response.json();
    
    // Transform snake_case to camelCase for rankings data
    if (data.rankings && Array.isArray(data.rankings)) {
      data.rankings = data.rankings.map((ranking: any) => ({
        guildId: ranking.guild_id,
        name: ranking.name,
        description: ranking.description,
        avatarUrl: ranking.avatar_url,
        position: ranking.position,
        previousPosition: ranking.previous_position,
        totalScore: ranking.total_score,
        memberCount: ranking.member_count,
        goalCount: ranking.goal_count || 0,
        questCount: ranking.quest_count || 0,
        activityScore: ranking.activity_score,
        growthRate: ranking.growth_rate,
        badges: ranking.badges || [],
        isPublic: ranking.is_public !== false,
        createdAt: ranking.created_at || new Date().toISOString(),
        lastActivityAt: ranking.last_activity_at || new Date().toISOString(),
        trend: ranking.trend || 'stable'
      }));
    }
    
    return data;
  },
  uploadGuildAvatar,
  getGuildAvatar,
  deleteGuildAvatar,
  // Join request functions
  requestToJoinGuild: async (guild_id: string, message?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/join-request`, {
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

  getGuildJoinRequests: async (guild_id: string): Promise<GuildJoinRequestListResponse> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/join-requests`, {
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

  approveJoinRequest: async (guild_id: string, user_id: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/join-requests/${user_id}/approve`, {
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

  rejectJoinRequest: async (guild_id: string, user_id: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/join-requests/${user_id}/reject`, {
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
  transferGuildOwnership: async (guild_id: string, newOwnerId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/transfer-ownership`, {
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
  assignModerator: async (guild_id: string, user_id: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/moderators/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ user_id }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to assign moderator';
      throw new Error(message);
    }
  },

  removeModerator: async (guild_id: string, user_id: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/moderators/${user_id}`, {
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
  performModerationAction: async (guild_id: string, action: ModerationAction): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/moderation/action`, {
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

  blockUser: async (guild_id: string, user_id: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/block-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ user_id, reason }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to block user';
      throw new Error(message);
    }
  },

  unblockUser: async (guild_id: string, user_id: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/unblock-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ user_id }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to unblock user';
      throw new Error(message);
    }
  },

  removeComment: async (guild_id: string, commentId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/comments/${commentId}`, {
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

  toggleUserCommentPermission: async (guild_id: string, user_id: string, canComment: boolean): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/comment-permission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ user_id, canComment }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to update comment permission';
      throw new Error(message);
    }
  },

  // Remove user from guild
  removeUserFromGuild: async (guild_id: string, user_id: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/members/${user_id}`, {
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

  // Get guilds for a specific user
  getUserGuilds: async (user_id: string): Promise<GuildListResponse> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/users/${user_id}/guilds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch user guilds';
      throw new Error(message);
    }

    return response.json();
  },

  // Guild Analytics
  getGuildAnalytics: async (guild_id: string): Promise<any> => {
    // Validate guild_id parameter
    if (!guild_id || guild_id === 'undefined' || guild_id.trim() === '') {
      throw new GuildAPIError('Invalid guild ID provided', 400);
    }

    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch guild analytics';
      throw new Error(message);
    }

    const data = await response.json();
    console.log('Raw analytics API response:', data);
    
    // Transform snake_case to camelCase for frontend compatibility
    const transformedData = {
      // Basic metrics
      totalMembers: data.total_members || 0,
      activeMembers: data.active_members || 0,
      totalGoals: data.total_goals || 0,
      completedGoals: data.completed_goals || 0,
      totalQuests: data.total_quests || 0,
      completedQuests: data.completed_quests || 0,
      
      // Activity metrics
      weeklyActivity: data.activity_score || 0,
      monthlyActivity: data.activity_score || 0,
      averageGoalCompletion: data.goal_completion_rate || 0,
      averageQuestCompletion: data.quest_completion_rate || 0,
      
      // Growth metrics
      memberGrowthRate: data.member_growth_rate || 0,
      goalGrowthRate: data.goal_completion_rate || 0,
      questGrowthRate: data.quest_completion_rate || 0,
      
      // Performance metrics
      topPerformers: data.memberLeaderboard?.length || 0,
      newMembersThisWeek: 0, // Not available in current backend
      goalsCreatedThisWeek: 0, // Not available in current backend
      questsCompletedThisWeek: 0, // Not available in current backend
      
      // Time-based data
      createdAt: data.created_at || data.last_updated || new Date().toISOString(),
      lastActivityAt: data.last_activity_at || data.last_updated || new Date().toISOString(),
      
      // Member leaderboard data (transform if available)
      memberLeaderboard: data.memberLeaderboard?.map((member: any) => ({
        userId: member.user_id || member.userId,
        username: member.username || 'Unknown',
        avatarUrl: member.avatar_url || member.avatarUrl,
        role: member.role || 'member',
        goalsCompleted: member.goals_completed || member.goalsCompleted || 0,
        questsCompleted: member.quests_completed || member.questsCompleted || 0,
        activityScore: member.score || member.activityScore || 0,
        totalXp: member.score || member.totalXp || 0,
        joinedAt: member.last_activity || member.joinedAt || new Date().toISOString(),
        lastSeenAt: member.last_activity || member.lastSeenAt,
      })) || [],
    };
    
    console.log('Transformed analytics data:', transformedData);
    return transformedData;
  },

  getGuildLeaderboard: async (guild_id: string): Promise<any> => {
    // Validate guild_id parameter
    if (!guild_id || guild_id === 'undefined' || guild_id.trim() === '') {
      throw new GuildAPIError('Invalid guild ID provided', 400);
    }

    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/analytics/leaderboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch guild leaderboard';
      throw new Error(message);
    }

    return response.json();
  },

  // Guild Comments
  getGuildComments: async (guild_id: string): Promise<any> => {
    // Validate guild_id parameter
    if (!guild_id || guild_id === 'undefined' || guild_id.trim() === '') {
      throw new GuildAPIError('Invalid guild ID provided', 400);
    }

    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to fetch guild comments';
      throw new Error(message);
    }

    const data = await response.json();
    
    // Transform snake_case to camelCase for comments
    if (Array.isArray(data)) {
      // Direct array response
      return data.map((comment: any) => ({
        commentId: comment.comment_id,
        guildId: comment.guild_id,
        userId: comment.user_id,
        username: comment.username,
        avatarUrl: comment.avatar_url,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        parentCommentId: comment.parent_comment_id,
        replies: comment.replies ? comment.replies.map((reply: any) => ({
          commentId: reply.comment_id,
          guildId: reply.guild_id,
          userId: reply.user_id,
          username: reply.username,
          avatarUrl: reply.avatar_url,
          content: reply.content,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          parentCommentId: reply.parent_comment_id,
          likes: reply.likes,
          isLiked: reply.is_liked,
          isEdited: reply.is_edited,
          userRole: reply.user_role,
        })) : [],
        likes: comment.likes,
        isLiked: comment.is_liked,
        isEdited: comment.is_edited,
        userRole: comment.user_role,
      }));
    } else if (data.comments && data.comments.comments) {
      // Wrapped response (fallback)
      data.comments.comments = data.comments.comments.map((comment: any) => ({
        commentId: comment.comment_id,
        guildId: comment.guild_id,
        userId: comment.user_id,
        username: comment.username,
        avatarUrl: comment.avatar_url,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        parentCommentId: comment.parent_comment_id,
        replies: comment.replies ? comment.replies.map((reply: any) => ({
          commentId: reply.comment_id,
          guildId: reply.guild_id,
          userId: reply.user_id,
          username: reply.username,
          avatarUrl: reply.avatar_url,
          content: reply.content,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          parentCommentId: reply.parent_comment_id,
          likes: reply.likes,
          isLiked: reply.is_liked,
          isEdited: reply.is_edited,
          userRole: reply.user_role,
        })) : [],
        likes: comment.likes,
        isLiked: comment.is_liked,
        isEdited: comment.is_edited,
        userRole: comment.user_role,
      }));
    }
    
    return data;
  },

  createGuildComment: async (guild_id: string, content: string, parentCommentId?: string): Promise<any> => {
    // Validate guild_id parameter
    if (!guild_id || guild_id === 'undefined' || guild_id.trim() === '') {
      throw new GuildAPIError('Invalid guild ID provided', 400);
    }

    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const requestBody = { content, parent_comment_id: parentCommentId };
    console.log('Sending comment creation request with body:', requestBody);
    
    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to create guild comment';
      throw new Error(message);
    }

    const data = await response.json();
    
    // Transform snake_case to camelCase for the created comment
    if (data) {
      return {
        commentId: data.comment_id,
        guildId: data.guild_id,
        userId: data.user_id,
        username: data.username,
        avatarUrl: data.avatar_url,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        parentCommentId: data.parent_comment_id,
        replies: data.replies || [],
        likes: data.likes,
        isLiked: data.is_liked,
        isEdited: data.is_edited,
        userRole: data.user_role,
      };
    }
    
    return data;
  },

  updateGuildComment: async (guild_id: string, commentId: string, content: string): Promise<any> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to update guild comment';
      throw new Error(message);
    }

    return response.json();
  },

  deleteGuildComment: async (guild_id: string, commentId: string, reason?: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/comments/${commentId}`, {
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
      const message = errorBody.detail || response.statusText || 'Failed to delete guild comment';
      throw new Error(message);
    }
  },

  likeGuildComment: async (guild_id: string, commentId: string): Promise<any> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to like guild comment';
      throw new Error(message);
    }

    return response.json();
  },

  // Check if user has pending join request
  hasPendingJoinRequest: async (guild_id: string): Promise<boolean> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${getApiBase()}/guilds/${guild_id}/join-requests/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to check join request status';
      throw new Error(message);
    }

    const data = await response.json();
    return data.hasPendingRequest || false;
  },
};
