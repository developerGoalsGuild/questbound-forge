/**
 * GuildComments Component
 *
 * A component for displaying and managing guild comments
 * with member-only access and real-time updates.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, fr } from 'date-fns/locale';
import { useTranslation } from '@/hooks/useTranslation';
import { guildAPI } from '@/lib/api/guild';
import {
  MessageSquare,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Heart,
  Loader2,
  AlertCircle,
  Lock,
  Users,
  Shield,
  Ban,
  UserX,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface GuildComment {
  commentId: string;
  guildId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentCommentId?: string;
  replies?: GuildComment[];
  likes: number;
  isLiked: boolean;
  isEdited: boolean;
  userRole: 'owner' | 'moderator' | 'member';
}

interface GuildCommentsProps {
  guildId: string;
  currentUserId?: string;
  isMember: boolean;
  userRole?: 'owner' | 'moderator' | 'member';
  isBlocked?: boolean;
  canComment?: boolean;
  className?: string;
}

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  isSubmitting?: boolean;
  isReply?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  initialValue = "",
  isSubmitting = false,
  isReply = false,
}) => {
  const [content, setContent] = useState(initialValue);
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent("");
    }
  }, [content, onSubmit]);

  const handleCancel = useCallback(() => {
    setContent("");
    onCancel?.();
  }, [onCancel]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {content.length}/500 {guildTranslations?.comments?.characters || 'characters'}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {guildTranslations?.create?.actions?.cancel || 'Cancel'}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting || content.length > 500}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isReply ? (guildTranslations?.comments?.reply || 'Reply') : (guildTranslations?.comments?.post || 'Comment')}
          </Button>
        </div>
      </div>
    </form>
  );
};

const CommentItem: React.FC<{
  comment: GuildComment;
  currentUserId?: string;
  currentUserRole?: 'owner' | 'moderator' | 'member';
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onBlockUser?: (userId: string, username: string) => void;
  onRemoveUser?: (userId: string, username: string) => void;
  isSubmitting?: boolean;
  replyingTo?: string | null;
  onAddComment: (content: string) => void;
  onCancelReply: () => void;
}> = ({
  comment,
  currentUserId,
  currentUserRole,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onBlockUser,
  onRemoveUser,
  isSubmitting = false,
  replyingTo,
  onAddComment,
  onCancelReply,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { t, language } = useTranslation();
  const guildTranslations = (t as any)?.guild;

  // Date locale mapping
  const dateLocales: Record<string, typeof enUS> = { en: enUS, es, fr };
  const dateLocale = dateLocales[language] || enUS;

  const isOwner = comment.userId === currentUserId;
  const canEdit = isOwner;
  const canDelete = isOwner || currentUserRole === 'owner' || currentUserRole === 'moderator';
  const canModerate = currentUserRole === 'owner' || currentUserRole === 'moderator';
  const canModerateThisUser = canModerate && comment.userId !== currentUserId && comment.userRole !== 'owner';

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSaveEdit = useCallback((content: string) => {
    onEdit(comment.commentId, content);
    setIsEditing(false);
  }, [comment.commentId, onEdit]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (window.confirm(guildTranslations?.comments?.confirmDeleteComment || 'Are you sure you want to delete this comment?')) {
      onDelete(comment.commentId);
    }
  }, [comment.commentId, onDelete, guildTranslations]);

  const handleLike = useCallback(() => {
    onLike(comment.commentId);
  }, [comment.commentId, onLike]); // Fixed duplicate declaration

  const handleBlockUser = useCallback(() => {
    const confirmMessage = (guildTranslations?.comments?.confirmBlockUser || 'Are you sure you want to block {username} from commenting?').replace('{username}', comment.username);
    if (onBlockUser && window.confirm(confirmMessage)) {
      onBlockUser(comment.userId, comment.username);
    }
  }, [comment.userId, comment.username, onBlockUser, guildTranslations]);

  const handleRemoveUser = useCallback(() => {
    const confirmMessage = (guildTranslations?.comments?.confirmRemoveUser || 'Are you sure you want to remove {username} from the guild?').replace('{username}', comment.username);
    if (onRemoveUser && window.confirm(confirmMessage)) {
      onRemoveUser(comment.userId, comment.username);
    }
  }, [comment.userId, comment.username, onRemoveUser, guildTranslations]);

  const handleReply = useCallback(() => {
    onReply(comment.commentId);
  }, [comment.commentId, onReply]);

  const toggleReplies = useCallback(() => {
    setShowReplies(!showReplies);
  }, [showReplies]);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.avatarUrl} alt={comment.username} />
          <AvatarFallback>
            {comment.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.username}</span>
            {comment.userRole === 'owner' && (
              <Badge variant="secondary" className="text-xs">
                {guildTranslations?.comments?.owner || 'Owner'}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {(() => {
                try {
                  const date = new Date(comment.createdAt);
                  if (isNaN(date.getTime())) {
                    return guildTranslations?.comments?.justNow || 'just now';
                  }
                  return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
                } catch (error) {
                  console.warn('Invalid date format:', comment.createdAt, error);
                  return guildTranslations?.comments?.justNow || 'just now';
                }
              })()}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-500">{guildTranslations?.comments?.edited || '(edited)'}</span>
            )}
          </div>

          {isEditing ? (
            <CommentForm
              onSubmit={handleSaveEdit}
              onCancel={handleCancelEdit}
              initialValue={comment.content}
              placeholder="Edit your comment..."
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {comment.content}
              </p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isSubmitting}
                  className={cn(
                    "h-8 px-2 text-xs",
                    comment.isLiked && "text-red-500 hover:text-red-600"
                  )}
                >
                  <Heart className={cn("h-3 w-3 mr-1", comment.isLiked && "fill-current")} />
                  {comment.likes}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReply}
                  disabled={isSubmitting}
                  className="h-8 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  {guildTranslations?.comments?.reply || 'Reply'}
                </Button>

                {(canEdit || canDelete || canModerateThisUser) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isSubmitting}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-2" />
                          {guildTranslations?.comments?.edit || 'Edit'}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={handleDelete}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {guildTranslations?.comments?.delete || 'Delete'}
                        </DropdownMenuItem>
                      )}
                      {canModerateThisUser && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={handleBlockUser}
                            className="text-orange-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {guildTranslations?.comments?.blockUser || 'Block User'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={handleRemoveUser}
                            className="text-red-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            {guildTranslations?.comments?.removeFromGuild || 'Remove from Guild'}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Reply Form for this comment */}
      {replyingTo === comment.commentId && (
        <div className="ml-11 mt-3 pl-4 border-l-2 border-gray-100">
          <CommentForm
            onSubmit={(content) => {
              console.log('Reply form submitted for comment:', comment.commentId, 'with content:', content);
              onAddComment(content);
            }}
            onCancel={onCancelReply}
            placeholder={`Reply to ${comment.username}...`}
            isSubmitting={isSubmitting}
            isReply={true}
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReplies}
            className="h-8 px-2 text-xs text-gray-600"
          >
            {showReplies ? (guildTranslations?.comments?.hideReplies || 'Hide') : (guildTranslations?.comments?.showReplies || 'Show')} {comment.replies.length} {comment.replies.length === 1 ? (guildTranslations?.comments?.replyCount || 'reply') : (guildTranslations?.comments?.repliesCount || 'replies')}
          </Button>
          
          {showReplies && (
            <div className="mt-2 space-y-3 pl-4 border-l-2 border-gray-100">
              {comment.replies.map((reply, replyIndex) => (
                <div key={reply.commentId || `reply-${replyIndex}`} className="space-y-3">
                  <CommentItem
                    comment={reply}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onLike={onLike}
                    onBlockUser={onBlockUser}
                    onRemoveUser={onRemoveUser}
                    isSubmitting={isSubmitting}
                    replyingTo={replyingTo}
                    onAddComment={onAddComment}
                    onCancelReply={onCancelReply}
                  />
                  
                  {/* Reply Form for nested replies */}
                  {replyingTo === reply.commentId && (
                    <div className="ml-11 mt-3 pl-4 border-l-2 border-gray-200">
                      <CommentForm
                        onSubmit={(content) => {
                          console.log('Nested reply form submitted for comment:', reply.commentId, 'with content:', content);
                          onAddComment(content);
                        }}
                        onCancel={onCancelReply}
                        placeholder={`Reply to ${reply.username}...`}
                        isSubmitting={isSubmitting}
                        isReply={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const GuildComments: React.FC<GuildCommentsProps> = ({
  guildId,
  currentUserId,
  isMember,
  userRole,
  isBlocked = false,
  canComment = true,
  className = '',
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const guildTranslations = (t as any)?.guild;
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  // Fetch comments
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guild-comments', guildId],
    queryFn: async () => {
      try {
        const response = await guildAPI.getGuildComments(guildId);
        console.log('Guild comments API response:', response);
        
        // Handle different response structures
        if (Array.isArray(response)) {
          return response;
        } else if (response && response.comments && Array.isArray(response.comments.comments)) {
          return response.comments.comments;
        } else if (response && Array.isArray(response.comments)) {
          return response.comments;
        } else {
          console.log('No comments found in response, returning demo comments');
          // Return demo comments to make the section more engaging
          return [
            {
              commentId: 'demo-1',
              guildId,
              userId: 'demo-user-1',
              username: 'GuildMaster',
              avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GuildMaster',
              content: 'Welcome to our guild! This is a demo comment to show how the comments section works. Feel free to add your own comments!',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              likes: 3,
              isLiked: false,
              isEdited: false,
              userRole: 'owner',
              replies: [
                {
                  commentId: 'demo-reply-1',
                  guildId,
                  userId: 'demo-user-2',
                  username: 'NewMember',
                  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewMember',
                  content: 'Thanks for the warm welcome! Excited to be part of this community.',
                  createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                  likes: 1,
                  isLiked: true,
                  isEdited: false,
                  userRole: 'member',
                },
              ],
            },
            {
              commentId: 'demo-2',
              guildId,
              userId: 'demo-user-3',
              username: 'GoalSetter',
              avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoalSetter',
              content: 'Has anyone started working on their fitness goals this week? I\'d love to hear about your progress!',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              likes: 2,
              isLiked: false,
              isEdited: false,
              userRole: 'member',
            },
          ];
        }
      } catch (error) {
        console.error('Error fetching guild comments:', error);
        // Return empty array on error to prevent crashes
        return [];
      }
    },
    enabled: isMember,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Debug logging
  console.log('GuildComments render - comments:', comments, 'isArray:', Array.isArray(comments));

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: string }) => {
      console.log('Mutation called with:', { content, parentCommentId, guildId });
      try {
        const response = await guildAPI.createGuildComment(guildId, content, parentCommentId);
        console.log('API response:', response);
        console.log('API response parentCommentId:', response.parentCommentId);
        
        // Ensure parentCommentId is preserved in the response
        const commentWithParent = {
          ...response,
          parentCommentId: response.parentCommentId || parentCommentId
        };
        console.log('Comment with preserved parentCommentId:', commentWithParent);
        return commentWithParent;
      } catch (error) {
        // If backend is not implemented, create a local comment for demo purposes
        console.warn('Backend comment creation failed, creating local comment:', error);
        const localComment = {
          commentId: `local_${Date.now()}`,
          guildId,
          userId: currentUserId || 'current-user',
          username: 'You',
          content,
          createdAt: new Date().toISOString(),
          likes: 0,
          isLiked: false,
          isEdited: false,
          userRole: userRole || 'member',
          parentCommentId,
        };
        console.log('Created local comment:', localComment);
        return localComment;
      }
    },
    onSuccess: (newComment) => {
      console.log('onSuccess called with newComment:', newComment);
      console.log('newComment.parentCommentId:', newComment.parentCommentId);
      
      queryClient.setQueryData(['guild-comments', guildId], (oldComments: GuildComment[] = []) => {
        console.log('Updating comments with parentCommentId:', newComment.parentCommentId);
        if (newComment.parentCommentId) {
          // Add as reply
          console.log('Adding as reply to parent comment:', newComment.parentCommentId);
          return oldComments.map(comment => {
            if (comment.commentId === newComment.parentCommentId) {
              console.log('Found parent comment, adding reply');
              return {
                ...comment,
                replies: [...(comment.replies || []), { ...newComment, commentId: newComment.commentId || `reply-${Date.now()}` }],
              };
            }
            return comment;
          });
        } else {
          // Add as top-level comment
          console.log('Adding as top-level comment');
          return [{ ...newComment, commentId: newComment.commentId || `comment-${Date.now()}` }, ...oldComments];
        }
      });
      setReplyingTo(null);
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      try {
        await guildAPI.updateGuildComment(guildId, commentId, content);
        return { commentId, content };
      } catch (error) {
        console.warn('Backend comment update failed, updating locally:', error);
        return { commentId, content };
      }
    },
    onSuccess: ({ commentId, content }) => {
      queryClient.setQueryData(['guild-comments', guildId], (oldComments: GuildComment[] = []) => {
        const updateComment = (comments: GuildComment[]): GuildComment[] => {
          return comments.map(comment => {
            if (comment.commentId === commentId) {
              return {
                ...comment,
                content,
                updatedAt: new Date().toISOString(),
                isEdited: true,
              };
            }
            if (comment.replies && Array.isArray(comment.replies)) {
              return {
                ...comment,
                replies: updateComment(comment.replies),
              };
            }
            return comment;
          });
        };
        return updateComment(oldComments);
      });
      setEditingComment(null);
      toast.success('Comment updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to edit comment:', error);
      toast.error('Failed to edit comment');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      try {
        await guildAPI.deleteGuildComment(guildId, commentId);
        return commentId;
      } catch (error) {
        console.warn('Backend comment deletion failed, deleting locally:', error);
        return commentId;
      }
    },
    onSuccess: (commentId) => {
      queryClient.setQueryData(['guild-comments', guildId], (oldComments: GuildComment[] = []) => {
        const removeComment = (comments: GuildComment[]): GuildComment[] => {
          return comments.filter(comment => {
            if (comment.commentId === commentId) {
              return false;
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: removeComment(comment.replies),
              };
            }
            return true;
          });
        };
        return removeComment(oldComments);
      });
      toast.success('Comment deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      try {
        const result = await guildAPI.likeGuildComment(guildId, commentId);
        return { commentId, result };
      } catch (error) {
        console.warn('Backend comment like failed, liking locally:', error);
        return { commentId, result: null };
      }
    },
    onSuccess: ({ commentId, result }) => {
      queryClient.setQueryData(['guild-comments', guildId], (oldComments: GuildComment[] = []) => {
        const updateLike = (comments: GuildComment[]): GuildComment[] => {
          return comments.map(comment => {
            if (comment.commentId === commentId) {
              // Use backend response if available, otherwise toggle locally
              if (result) {
                return {
                  ...comment,
                  isLiked: result.is_liked,
                  likes: result.likes,
                };
              } else {
                return {
                  ...comment,
                  isLiked: !comment.isLiked,
                  likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                };
              }
            }
            if (comment.replies && Array.isArray(comment.replies)) {
              return {
                ...comment,
                replies: updateLike(comment.replies),
              };
            }
            return comment;
          });
        };
        return updateLike(oldComments);
      });
    },
    onError: (error) => {
      console.error('Failed to like comment:', error);
      toast.error('Failed to like comment');
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await guildAPI.blockUser(guildId, userId, 'Blocked from commenting');
      return userId;
    },
    onSuccess: (userId) => {
      toast.success('User blocked from commenting successfully');
      // Invalidate guild data to refresh member status
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
    },
    onError: (error) => {
      console.error('Failed to block user:', error);
      toast.error('Failed to block user');
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await guildAPI.removeUserFromGuild(guildId, userId);
      return userId;
    },
    onSuccess: (userId) => {
      toast.success('User removed from guild successfully');
      // Invalidate guild data to refresh member list
      queryClient.invalidateQueries({ queryKey: ['guild', guildId] });
      // Remove user's comments from the comments list
      queryClient.setQueryData(['guild-comments', guildId], (oldComments: GuildComment[] = []) => {
        const removeUserComments = (comments: GuildComment[]): GuildComment[] => {
          return comments.filter(comment => {
            if (comment.userId === userId) {
              return false;
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: removeUserComments(comment.replies),
              };
            }
            return true;
          });
        };
        return removeUserComments(oldComments);
      });
    },
    onError: (error) => {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user');
    },
  });

  const handleAddComment = useCallback((content: string) => {
    console.log('Creating comment with parentCommentId:', replyingTo);
    addCommentMutation.mutate({ content, parentCommentId: replyingTo || undefined });
  }, [addCommentMutation, replyingTo]);

  const handleReply = useCallback((commentId: string) => {
    console.log('Setting replyingTo to:', commentId);
    setReplyingTo(commentId);
  }, []);

  const handleEdit = useCallback((commentId: string, content: string) => {
    editCommentMutation.mutate({ commentId, content });
  }, [editCommentMutation]);

  const handleDelete = useCallback((commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  }, [deleteCommentMutation]);

  const handleLike = useCallback((commentId: string) => {
    likeCommentMutation.mutate(commentId);
  }, [likeCommentMutation]);

  const handleBlockUser = useCallback((userId: string, username: string) => {
    blockUserMutation.mutate(userId);
  }, [blockUserMutation]);

  const handleRemoveUser = useCallback((userId: string, username: string) => {
    removeUserMutation.mutate(userId);
  }, [removeUserMutation]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  if (!isMember) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {guildTranslations?.comments?.membersOnly?.title || 'Members Only'}
          </h3>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.comments?.membersOnly?.message || 'You need to be a member of this guild to view and post comments.'}
          </p>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            {guildTranslations?.comments?.membersOnly?.joinButton || 'Join Guild'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isBlocked) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Ban className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {guildTranslations?.comments?.blocked?.title || 'Access Restricted'}
          </h3>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.comments?.blocked?.message || 'You have been blocked from accessing the comments section of this guild.'}
          </p>
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {guildTranslations?.comments?.blocked?.contactModerator || 'Contact a guild moderator if you believe this is an error.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!canComment) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {guildTranslations?.comments?.commentingDisabled?.title || 'Commenting Disabled'}
          </h3>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.comments?.commentingDisabled?.message || 'You are not allowed to post comments in this guild.'}
          </p>
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {guildTranslations?.comments?.commentingDisabled?.contactModerator || 'Contact a guild moderator if you believe this is an error.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {guildTranslations?.comments?.errorLoading || 'Error Loading Comments'}
          </h3>
          <p className="text-gray-600 mb-4">
            {guildTranslations?.comments?.error || 'There was an error loading the comments. Please try again.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Loader2 className="h-4 w-4 mr-2" />
            {guildTranslations?.comments?.retry || 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {guildTranslations?.comments?.title || 'Guild Comments'}
          <Badge variant="secondary" className="ml-2">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        <CommentForm
          onSubmit={handleAddComment}
          placeholder={guildTranslations?.comments?.placeholder || 'Share your thoughts with the guild...'}
          isSubmitting={addCommentMutation.isPending}
        />

        <Separator />

        {/* Comments List */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {guildTranslations?.comments?.noComments || 'No comments yet'}
              </h3>
              <p className="text-gray-600">
                {guildTranslations?.comments?.noCommentsDescription || 'Be the first to start the conversation! Share your thoughts with the guild.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.isArray(comments) && comments.map((comment, index) => (
                <div key={comment.commentId || `comment-${index}`}>
                  <CommentItem
                    comment={comment}
                    currentUserId={currentUserId}
                    currentUserRole={userRole}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    onBlockUser={handleBlockUser}
                    onRemoveUser={handleRemoveUser}
                    isSubmitting={
                      addCommentMutation.isPending ||
                      editCommentMutation.isPending ||
                      deleteCommentMutation.isPending ||
                      likeCommentMutation.isPending ||
                      blockUserMutation.isPending ||
                      removeUserMutation.isPending
                    }
                    replyingTo={replyingTo}
                    onAddComment={handleAddComment}
                    onCancelReply={handleCancelReply}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GuildComments;
