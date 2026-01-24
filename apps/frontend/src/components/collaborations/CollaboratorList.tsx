/**
 * Component for displaying and managing collaborators for a resource.
 * 
 * This component shows a list of collaborators with their roles, avatars,
 * and provides management actions for resource owners.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Trash2, 
  Crown, 
  User,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  listCollaborators, 
  removeCollaborator, 
  cleanupOrphanedInvites,
  Collaborator,
  CollaborationAPIError 
} from '../../lib/api/collaborations';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';

interface CollaboratorListProps {
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  resourceTitle: string;
  currentUserId: string;
  isOwner: boolean;
  onInviteClick?: () => void;
  className?: string;
}

interface CollaboratorWithActions extends Collaborator {
  isCurrentUser: boolean;
  canRemove: boolean;
}

export const CollaboratorList: React.FC<CollaboratorListProps> = ({
  resourceType,
  resourceId,
  resourceTitle,
  currentUserId,
  isOwner,
  onInviteClick,
  className = ''
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Safe access to translations with fallbacks
  const translations = (t as any)?.collaborators || {
    title: 'Collaborators',
    empty: 'No collaborators yet',
    invite: 'Invite',
    inviteFirst: 'Invite your first collaborator',
    cleanup: 'Cleanup',
    cleanupTooltip: 'Clean up orphaned invite records for removed collaborators',
    cleanupSuccess: {
      title: 'Cleanup Complete',
      description: 'Orphaned invites have been cleaned up successfully'
    },
    cleanupError: {
      title: 'Cleanup Failed',
      description: 'Failed to cleanup orphaned invites. Please try again.'
    },
    owner: 'Owner',
    you: 'You',
    joined: 'Joined {date}',
    remove: {
      confirm: {
        title: 'Remove Collaborator',
        description: 'Are you sure you want to remove {username} from this collaboration?'
      },
      success: {
        title: 'Collaborator Removed',
        description: '{username} has been removed from the collaboration'
      },
      errors: {
        noPermission: {
          title: 'Permission Denied',
          description: "You don't have permission to remove collaborators"
        },
        generic: {
          title: 'Failed to Remove',
          description: 'Failed to remove collaborator'
        }
      }
    },
    errors: {
      noPermission: "You don't have permission to view collaborators",
      resourceNotFound: 'Resource not found',
      generic: 'Failed to load collaborators'
    }
  };
  
  const [collaborators, setCollaborators] = useState<CollaboratorWithActions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  // Load collaborators
  const loadCollaborators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await listCollaborators(resourceType, resourceId);
      
      // Handle both array response and object with collaborators property
      const collaborators = Array.isArray(response) ? response : (response as any).collaborators || [];
      
      const collaboratorsWithActions = collaborators.map(collaborator => {
        const userId = collaborator.userId || (collaborator as any).user_id;
        return {
          ...collaborator,
          userId, // Ensure userId is always available
          isCurrentUser: userId === currentUserId,
          canRemove: isOwner && collaborator.role !== 'owner' && userId !== currentUserId
        };
      });
      
      setCollaborators(collaboratorsWithActions);
      
    } catch (error) {
      console.error('Failed to load collaborators:', error);
      
      if (error instanceof CollaborationAPIError) {
        if (error.status === 403) {
          setError(translations.errors.noPermission);
        } else if (error.status === 404) {
          setError(translations.errors.resourceNotFound);
        } else {
          setError(error.message);
        }
      } else {
        setError(translations.errors.generic);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load collaborators on mount and when dependencies change
  useEffect(() => {
    loadCollaborators();
  }, [resourceType, resourceId, currentUserId, isOwner]);
  
  // Remove collaborator
  const handleRemoveCollaborator = async (userId: string, username: string) => {
    try {
      setRemovingUserId(userId);
      
      await removeCollaborator(resourceType, resourceId, userId);
      
      // Optimistically update the list
      setCollaborators(prev => prev.filter(c => c.userId !== userId));
      
      toast({
        title: translations.remove.success.title,
        description: translations.remove.success.description.replace('{username}', username),
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      
      if (error instanceof CollaborationAPIError) {
        if (error.status === 403) {
          toast({
            title: translations.remove.errors.noPermission.title,
            description: translations.remove.errors.noPermission.description,
            variant: 'destructive'
          });
        } else {
          toast({
            title: translations.remove.errors.generic.title,
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: translations.remove.errors.generic.title,
          description: translations.remove.errors.generic.description,
          variant: 'destructive'
        });
      }
      
      // Reload collaborators to ensure consistency
      loadCollaborators();
    } finally {
      setRemovingUserId(null);
      setShowRemoveConfirm(null);
    }
  };

  // Cleanup orphaned invites
  const handleCleanupOrphanedInvites = async () => {
    try {
      setIsCleaningUp(true);
      
      const result = await cleanupOrphanedInvites(resourceType, resourceId);
      
      toast({
        title: translations.cleanupSuccess?.title || 'Cleanup Complete',
        description: result.message || translations.cleanupSuccess?.description || 'Orphaned invites have been cleaned up successfully',
        variant: 'default'
      });
      
      // Reload collaborators to ensure consistency
      loadCollaborators();
    } catch (error) {
      console.error('Failed to cleanup orphaned invites:', error);
      toast({
        title: translations.cleanupError?.title || 'Cleanup Failed',
        description: translations.cleanupError?.description || 'Failed to cleanup orphaned invites. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };
  
  // Format joined date safely
  const formatJoinedDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting joined date:', error);
      return 'Invalid date';
    }
  };

  // Get user avatar or initials
  const getUserDisplay = (collaborator: CollaboratorWithActions) => {
    if (collaborator.avatarUrl) {
      return (
        <img
          src={collaborator.avatarUrl}
          alt={collaborator.username}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    
    const initials = collaborator.username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-sm font-medium text-blue-600">{initials}</span>
      </div>
    );
  };
  
  // Don't render if translations are not loaded
  if (!t?.collaborators) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={loadCollaborators}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {t?.retry || 'Retry'}
          </button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {translations.title}
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {collaborators.length}
            </span>
          </div>
          
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={onInviteClick}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {translations.invite}
              </button>
              <button
                onClick={handleCleanupOrphanedInvites}
                disabled={isCleaningUp}
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center disabled:opacity-50"
                title={translations.cleanupTooltip || "Clean up orphaned invite records for removed collaborators"}
              >
                {isCleaningUp ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {translations.cleanup || 'Cleanup'}
              </button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
      
      {/* Collaborators List */}
      {collaborators.length === 0 ? (
        <div className="text-center py-6">
          <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">
            {translations.empty}
          </p>
          {isOwner && (
            <button
              onClick={onInviteClick}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center mx-auto"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {translations.inviteFirst}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {collaborators.map((collaborator) => {
            const userId = collaborator.userId || (collaborator as any).user_id;
            return (
            <div
              key={userId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getUserDisplay(collaborator)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {collaborator.username}
                    </p>
                    {collaborator.role === 'owner' && (
                      <div title={translations.owner}>
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                    {collaborator.isCurrentUser && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {translations.you}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {translations.joined.replace('{date}', formatJoinedDate(collaborator.joinedAt || (collaborator as any).joined_at))}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              {collaborator.canRemove && (
                <div className="relative">
                          <button
                            onClick={() => setShowRemoveConfirm(userId)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            disabled={removingUserId === userId}
                          >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {showRemoveConfirm === userId && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[200px]">
                      <div className="p-3">
                        <p className="text-sm text-gray-900 mb-2">
                          {translations.remove.confirm.title}
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                          {translations.remove.confirm.description.replace('{username}', collaborator.username)}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowRemoveConfirm(null)}
                            className="flex-1 px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            {t?.cancel || 'Cancel'}
                          </button>
                          <button
                            onClick={() => handleRemoveCollaborator(userId, collaborator.username)}
                            disabled={removingUserId === userId}
                            className="flex-1 px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                          >
                            {removingUserId === userId ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                {t?.remove || 'Remove'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
      </CardContent>
    </Card>
  );
};
