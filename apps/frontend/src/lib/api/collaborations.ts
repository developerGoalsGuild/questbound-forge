/**
 * API client for collaboration features.
 *
 * This module provides functions for managing collaboration invites,
 * collaborators, comments, and reactions.
 */

import { getAccessToken } from '@/lib/utils';

export interface Collaborator {
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: 'owner' | 'collaborator';
  joinedAt: string;
  // Backend sends snake_case, so we need to handle both
  joined_at?: string;
  user_id?: string; // Backend sends user_id instead of userId
}

export interface Invite {
  invite_id: string;
  inviter_id: string;
  inviter_username: string;
  invitee_id?: string;
  invitee_email?: string;
  resource_type: 'goal' | 'quest' | 'task';
  resource_id: string;
  resource_title: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  commentId: string;
  parentId?: string;
  userId: string;
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  text: string;
  mentions: string[];
  reactions: Record<string, number>;
  replyCount: number;
  isEdited: boolean;
  username: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt: string;
}


export interface ReactionSummaryResponse {
  reactions: Record<string, number>; // emoji -> count
  userReaction?: string; // current user's reaction emoji
}

export class CollaborationAPIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'CollaborationAPIError';
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
    ...options.headers,
  };

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('Collaboration API Request:', {
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
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      url: endpoint,
      timestamp: new Date().toISOString()
    });
    throw new CollaborationAPIError(message, response.status);
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

// Invite Management
export async function createInvite(data: {
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  inviteeIdentifier: string;
  message?: string;
}): Promise<Invite> {
  return apiRequest<Invite>('/collaborations/invites', {
    method: 'POST',
    body: JSON.stringify({
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      invitee_identifier: data.inviteeIdentifier,
      message: data.message,
    }),
  });
}

export async function getInvite(inviteId: string): Promise<Invite> {
  return apiRequest<Invite>(`/collaborations/invites/${inviteId}`);
}

export async function acceptInvite(inviteId: string): Promise<Invite> {
  return apiRequest<Invite>(`/collaborations/invites/${inviteId}/accept`, {
    method: 'POST',
  });
}

export async function declineInvite(inviteId: string): Promise<Invite> {
  return apiRequest<Invite>(`/collaborations/invites/${inviteId}/decline`, {
    method: 'POST',
  });
}

export async function listInvitesForUser(): Promise<Invite[]> {
  const response = await apiRequest<{invites: Invite[], next_token?: string, total_count: number}>('/collaborations/invites');
  return response.invites;
}

// Collaborator Management
export async function listCollaborators(
  resourceType: 'goal' | 'quest' | 'task',
  resourceId: string
): Promise<Collaborator[]> {
  return apiRequest<Collaborator[]>(`/collaborations/resources/${resourceType}/${resourceId}/collaborators`);
}

export async function removeCollaborator(
  resourceType: 'goal' | 'quest' | 'task',
  resourceId: string,
  userId: string
): Promise<void> {
  return apiRequest<void>(`/collaborations/resources/${resourceType}/${resourceId}/collaborators/${userId}`, {
    method: 'DELETE',
  });
}

export async function cleanupOrphanedInvites(
  resourceType: 'goal' | 'quest' | 'task',
  resourceId: string
): Promise<{ message: string; cleaned_count: number }> {
  return apiRequest<{ message: string; cleaned_count: number }>(`/collaborations/resources/${resourceType}/${resourceId}/cleanup-orphaned-invites`, {
    method: 'POST',
  });
}

export interface UserCollaboration {
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  resourceTitle: string;
  joinedAt: string;
  role: 'owner' | 'collaborator';
}

export async function getMyCollaborations(
  resourceType?: 'goal' | 'quest' | 'task'
): Promise<{ collaborations: UserCollaboration[]; total_count: number }> {
  const params = resourceType ? `?resource_type=${resourceType}` : '';
  return apiRequest<{ collaborations: UserCollaboration[]; total_count: number }>(`/collaborations/my-collaborations${params}`);
}



// Comment Management
export async function createComment(data: {
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  parentId?: string;
  text: string;
}): Promise<Comment> {
  return apiRequest<Comment>('/collaborations/comments', {
    method: 'POST',
    body: JSON.stringify({
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      parent_id: data.parentId,
      text: data.text,
    }),
  });
}

export async function getComment(commentId: string): Promise<Comment> {
  return apiRequest<Comment>(`/collaborations/comments/${commentId}`);
}

export async function listResourceComments(
  resourceType: 'goal' | 'quest' | 'task',
  resourceId: string,
  parentId?: string,
  limit: number = 50,
  nextToken?: string
): Promise<{ comments: Comment[]; nextToken?: string; totalCount: number }> {
  const params = new URLSearchParams({
    ...(parentId && { parent_id: parentId }),
    ...(nextToken && { next_token: nextToken }),
    limit: limit.toString(),
  });

  return apiRequest<{ comments: Comment[]; nextToken?: string; totalCount: number }>(
    `/collaborations/resources/${resourceType}/${resourceId}/comments?${params}`
  );
}

export async function listComments(
  resourceType: 'goal' | 'quest' | 'task',
  resourceId: string,
  limit: number = 50
): Promise<Comment[]> {
  const result = await listResourceComments(resourceType, resourceId, undefined, limit);
  return result.comments;
}

export async function updateComment(commentId: string, data: { text: string }): Promise<Comment> {
  return apiRequest<Comment>(`/collaborations/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  return apiRequest<void>(`/collaborations/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// Reaction Management (enhanced)
export async function toggleReaction(commentId: string, emoji: string): Promise<ReactionSummaryResponse> {
  return apiRequest<ReactionSummaryResponse>(`/collaborations/comments/${commentId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

export async function getCommentReactions(commentId: string): Promise<ReactionSummaryResponse> {
  return apiRequest<ReactionSummaryResponse>(`/collaborations/comments/${commentId}/reactions`);
}