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
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  reactionId: string;
  commentId: string;
  userId: string;
  username: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: string;
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
  content: string;
}): Promise<Comment> {
  return apiRequest<Comment>('/collaborations/comments', {
    method: 'POST',
    body: JSON.stringify({
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      content: data.content,
    }),
  });
}

export async function listComments(
  resourceType: 'goal' | 'quest' | 'task',
  resourceId: string
): Promise<Comment[]> {
  return apiRequest<Comment[]>(`/collaborations/comments?resource_type=${resourceType}&resource_id=${resourceId}`);
}

export async function updateComment(commentId: string, content: string): Promise<Comment> {
  return apiRequest<Comment>(`/collaborations/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  return apiRequest<void>(`/collaborations/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// Reaction Management
export async function addReaction(data: {
  commentId: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
}): Promise<Reaction> {
  return apiRequest<Reaction>(`/collaborations/comments/${data.commentId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ type: data.type }),
  });
}

export async function removeReaction(commentId: string, reactionId: string): Promise<void> {
  return apiRequest<void>(`/collaborations/comments/${commentId}/reactions/${reactionId}`, {
    method: 'DELETE',
  });
}

export async function listReactions(commentId: string): Promise<Reaction[]> {
  return apiRequest<Reaction[]>(`/collaborations/comments/${commentId}/reactions`);
}