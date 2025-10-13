/**
 * API client for collaboration features.
 * 
 * This module provides functions for managing collaboration invites,
 * collaborators, comments, and reactions.
 */

export interface Collaborator {
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: 'owner' | 'collaborator';
  joinedAt: string;
}

export interface Invite {
  inviteId: string;
  inviterId: string;
  inviterUsername: string;
  inviteeId: string;
  inviteeEmail: string;
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  resourceTitle: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.goalsguild.com';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      ...options.headers,
    },
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

  return response.json();
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
  return apiRequest<Invite[]>('/collaborations/invites');
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