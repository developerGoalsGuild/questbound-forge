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
import { useTranslation } from '@/hooks/useTranslation';
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
          {content.length}/500 characters
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
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

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
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.commentId);
    }
  }, [comment.commentId, onDelete]);

  const handleBlockUser = useCallback(() => {
    if (onBlockUser && window.confirm(`Are you sure you want to block ${comment.username} from commenting?`)) {
      onBlockUser(comment.userId, comment.username);
    }
  }, [comment.userId, comment.username, onBlockUser]);

  const handleRemoveUser = useCallback(() => {
    if (onRemoveUser && window.confirm(`Are you sure you want to remove ${comment.username} from the guild?`)) {
      onRemoveUser(comment.userId, comment.username);
    }
  }, [comment.userId, comment.username, onRemoveUser]);

  const handleLike = useCallback(() => {
    onLike(comment.commentId);
  }, [comment.commentId, onLike]);

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
                Owner
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-500">(edited)</span>
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
                            Block User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={handleRemoveUser}
                            className="text-red-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove from Guild
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

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReplies}
            className="h-8 px-2 text-xs text-gray-600"
          >
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </Button>
          
          {showReplies && (
            <div className="mt-2 space-y-3 pl-4 border-l-2 border-gray-100">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.commentId}
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
                />
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Generate mock comments
      const mockComments: GuildComment[] = [
        {
          commentId: 'comment-1',
          guildId,
          userId: 'user-1',
          username: 'AlexJohnson',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexJohnson',
          content: 'Welcome to our guild! Looking forward to achieving great goals together.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 5,
          isLiked: false,
          isEdited: false,
          userRole: 'owner',
          replies: [
            {
              commentId: 'reply-1',
              guildId,
              userId: 'user-2',
              username: 'SarahChen',
              avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahChen',
              content: 'Thanks for the warm welcome! Excited to be here.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              likes: 2,
              isLiked: true,
              isEdited: false,
              userRole: 'member',
            },
          ],
        },
        {
          commentId: 'comment-2',
          guildId,
          userId: 'user-3',
          username: 'MikeRodriguez',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MikeRodriguez',
          content: 'Has anyone started working on the fitness goals yet? I\'d love to collaborate!',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          likes: 3,
          isLiked: false,
          isEdited: false,
          userRole: 'member',
        },
        {
          commentId: 'comment-3',
          guildId,
          userId: 'user-4',
          username: 'EmmaWilson',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmmaWilson',
          content: 'Great progress on the coding challenges everyone! Keep up the excellent work.',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          likes: 7,
          isLiked: true,
          isEdited: true,
          userRole: 'moderator',
        },
      ];

      return mockComments;
    },
    enabled: isMember,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: string }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const newComment: GuildComment = {
        commentId: `comment-${Date.now()}`,
        guildId,
        userId: currentUserId || 'current-user',
        username: 'Current User',
        content,
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isEdited: false,
        userRole: userRole || 'member',
        parentCommentId,
      };

      return newComment;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData(['guild-comments', guildId], (oldComments: GuildComment[] = []) => {
        if (newComment.parentCommentId) {
          // Add as reply
          return oldComments.map(comment => {
            if (comment.commentId === newComment.parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment],
              };
            }
            return comment;
          });
        } else {
          // Add as top-level comment
          return [newComment, ...oldComments];
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      return { commentId, content };
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
            if (comment.replies) {
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      return commentId;
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      return commentId;
    },
    onSuccess: (commentId) => {
      queryClient.setQueryData(['guild-comments', guildId], (oldComments: GuildComment[] = []) => {
        const toggleLike = (comments: GuildComment[]): GuildComment[] => {
          return comments.map(comment => {
            if (comment.commentId === commentId) {
              return {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: toggleLike(comment.replies),
              };
            }
            return comment;
          });
        };
        return toggleLike(oldComments);
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
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
    addCommentMutation.mutate({ content, parentCommentId: replyingTo || undefined });
  }, [addCommentMutation, replyingTo]);

  const handleReply = useCallback((commentId: string) => {
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
            Members Only
          </h3>
          <p className="text-gray-600 mb-4">
            You need to be a member of this guild to view and post comments.
          </p>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Join Guild
          </Button>
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
            Error Loading Comments
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error loading the comments. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Loader2 className="h-4 w-4 mr-2" />
            Retry
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
          Guild Comments
          <Badge variant="secondary" className="ml-2">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        <CommentForm
          onSubmit={handleAddComment}
          placeholder="Share your thoughts with the guild..."
          isSubmitting={addCommentMutation.isPending}
        />

        <Separator />

        {/* Comments List */}
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
              Be the first to start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.commentId}>
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
                />
                
                {/* Reply Form */}
                {replyingTo === comment.commentId && (
                  <div className="ml-11 mt-3">
                    <CommentForm
                      onSubmit={handleAddComment}
                      onCancel={handleCancelReply}
                      placeholder={`Reply to ${comment.username}...`}
                      isSubmitting={addCommentMutation.isPending}
                      isReply={true}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuildComments;
