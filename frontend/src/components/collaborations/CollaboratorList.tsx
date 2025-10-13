/**
 * Component for displaying and managing collaborators for a resource.
 * 
 * This component shows a list of collaborators with their roles, avatars,
 * and provides management actions for resource owners.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
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
  
  // Debug: Log the translations structure
  console.log('CollaboratorList translations debug:', {
    hasT: !!t,
    hasCollaborations: !!t?.collaborations,
    hasCollaborators: !!t?.collaborations?.collaborators,
    tKeys: t ? Object.keys(t) : [],
    collaborationsKeys: t?.collaborations ? Object.keys(t.collaborations) : []
  });

  // Safe access to translations with fallbacks
  const translations = t?.collaborations?.collaborators || {
    title: 'Collaborators',
    empty: 'No collaborators yet',
    invite: 'Invite',
    inviteFirst: 'Invite your first collaborator',
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
  
  // Load collaborators
  const loadCollaborators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await listCollaborators(resourceType, resourceId);
      
      // Handle both array response and object with collaborators property
      const collaborators = Array.isArray(response) ? response : response.collaborators || [];
      
      const collaboratorsWithActions = collaborators.map(collaborator => ({
        ...collaborator,
        isCurrentUser: collaborator.userId === currentUserId,
        canRemove: isOwner && collaborator.role !== 'owner' && !collaborator.isCurrentUser
      }));
      
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
  if (!t?.collaborations) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">Loading...</h3>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">
            {translations.title}
          </h3>
        </div>
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
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">
            {translations.title}
          </h3>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={loadCollaborators}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t.retry}
        </button>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">
            {translations.title}
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {collaborators.length}
          </span>
        </div>
        
        {isOwner && (
          <button
            onClick={onInviteClick}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {translations.invite}
          </button>
        )}
      </div>
      
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
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.userId}
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
                      <Crown className="h-4 w-4 text-yellow-500" title={translations.owner} />
                    )}
                    {collaborator.isCurrentUser && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {translations.you}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {translations.joined.replace('{date}', new Date(collaborator.joinedAt).toLocaleDateString())}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              {collaborator.canRemove && (
                <div className="relative">
                  <button
                    onClick={() => setShowRemoveConfirm(collaborator.userId)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    disabled={removingUserId === collaborator.userId}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {showRemoveConfirm === collaborator.userId && (
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
                            {t.cancel}
                          </button>
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.userId, collaborator.username)}
                            disabled={removingUserId === collaborator.userId}
                            className="flex-1 px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                          >
                            {removingUserId === collaborator.userId ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                {t.remove}
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
          ))}
        </div>
      )}
    </div>
  );
};
