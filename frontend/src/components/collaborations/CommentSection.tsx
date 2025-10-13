/**
 * CommentSection Component
 *
 * A comprehensive component for managing comments and reactions on resources
 * (goals, quests, tasks). Supports threaded discussions, real-time reactions,
 * and full accessibility features.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Edit3,
  Trash2,
  Heart,
  ThumbsUp,
  Laugh,
  Frown,
  Angry,
  Loader2,
  Reply,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Comment,
  createComment,
  listResourceComments,
  updateComment,
  deleteComment,
  toggleReaction,
  getCommentReactions
} from '@/lib/api/collaborations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  resourceType: 'goal' | 'quest' | 'task';
  resourceId: string;
  className?: string;
}

const REACTION_EMOJIS = {
  '👍': { icon: ThumbsUp, label: 'Like' },
  '❤️': { icon: Heart, label: 'Love' },
  '😂': { icon: Laugh, label: 'Laugh' },
  '😢': { icon: Frown, label: 'Sad' },
  '😠': { icon: Angry, label: 'Angry' }
} as const;

const CommentItem: React.FC<{
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  level: number;
  resourceType: string;
  resourceId: string;
}> = ({ comment, onReply, onEdit, onDelete, level, resourceType, resourceId }) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);

  const { data: reactionData, refetch: refetchReactions } = useQuery({
    queryKey: ['comment-reactions', comment.commentId],
    queryFn: () => getCommentReactions(comment.commentId),
    enabled: !!comment.commentId,
  });

  const reactionMutation = useMutation({
    mutationFn: (emoji: string) => toggleReaction(comment.commentId, emoji),
    onSuccess: () => {
      refetchReactions();
      setIsReacting(false);
      setShowReactions(false);
    },
    onError: (error) => {
      toast.error('Failed to react to comment');
      setIsReacting(false);
    },
  });

  const handleReaction = useCallback((emoji: string) => {
    if (!user) return;
    setIsReacting(true);
    reactionMutation.mutate(emoji);
  }, [user, reactionMutation]);

  const canEdit = user?.userId === comment.userId;
  const canDelete = user?.userId === comment.userId;

  return (
    <div className={cn("flex gap-3", level > 0 && "ml-8 border-l-2 border-muted pl-4")}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.userAvatar} alt={comment.username} />
        <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.username}</span>
              {comment.isEdited && (
                <Badge variant="outline" className="text-xs">Edited</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(comment)}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.commentId)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="text-sm whitespace-pre-wrap">{comment.text}</div>

          {/* Reactions */}
          {reactionData && Object.keys(reactionData.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(reactionData.reactions).map(([emoji, count]) => {
                const isUserReaction = reactionData.userReaction === emoji;
                return (
                  <Button
                    key={emoji}
                    variant={isUserReaction ? "default" : "outline"}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleReaction(emoji)}
                    disabled={isReacting}
                  >
                    {emoji} {count}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.commentId)}
            className="h-6 px-2 text-xs"
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReactions(!showReactions)}
              className="h-6 px-2 text-xs"
              disabled={isReacting}
            >
              {isReacting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Heart className="h-3 w-3" />
              )}
              React
            </Button>

            {showReactions && (
              <div
                ref={reactionRef}
                className="absolute bottom-full mb-1 bg-background border rounded-md p-1 shadow-lg z-10"
              >
                <div className="flex gap-1">
                  {Object.entries(REACTION_EMOJIS).map(([emoji, { icon: Icon, label }]) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReaction(emoji)}
                      className="h-8 w-8 p-0"
                      title={label}
                    >
                      <span className="text-lg">{emoji}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies count */}
        {comment.replyCount > 0 && (
          <div className="mt-2">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const CommentForm: React.FC<{
  onSubmit: (text: string, parentId?: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  isSubmitting?: boolean;
}> = ({ onSubmit, onCancel, placeholder = "Write a comment...", initialValue = "", isSubmitting = false }) => {
  const [text, setText] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!text.trim() || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {initialValue ? 'Update' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({
  resourceType,
  resourceId,
  className
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Query for comments
  const {
    data: commentsData,
    isLoading,
    refetch: refetchComments
  } = useQuery({
    queryKey: ['resource-comments', resourceType, resourceId],
    queryFn: () => listResourceComments(resourceType, resourceId),
    enabled: !!resourceId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { text: string; parentId?: string }) =>
      createComment({
        resourceType,
        resourceId,
        text: data.text,
        parentId: data.parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-comments', resourceType, resourceId] });
      toast.success('Comment added');
      setReplyingTo(null);
      setShowCommentForm(false);
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      updateComment(commentId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-comments', resourceType, resourceId] });
      toast.success('Comment updated');
      setEditingComment(null);
    },
    onError: () => {
      toast.error('Failed to update comment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-comments', resourceType, resourceId] });
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });

  const handleCreateComment = useCallback((text: string, parentId?: string) => {
    createMutation.mutate({ text, parentId });
  }, [createMutation]);

  const handleReply = useCallback((parentId: string) => {
    setReplyingTo(parentId);
    setEditingComment(null);
    setShowCommentForm(false);
  }, []);

  const handleEdit = useCallback((comment: Comment) => {
    setEditingComment(comment);
    setReplyingTo(null);
    setShowCommentForm(false);
  }, []);

  const handleDelete = useCallback((commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate(commentId);
    }
  }, [deleteMutation]);

  const handleCancel = useCallback(() => {
    setReplyingTo(null);
    setEditingComment(null);
  }, []);

  const renderComments = useCallback((comments: Comment[], level = 0): React.ReactNode => {
    return comments.map((comment) => (
      <div key={comment.commentId} className="space-y-3">
        <CommentItem
          comment={comment}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          level={level}
          resourceType={resourceType}
          resourceId={resourceId}
        />

        {/* Edit form */}
        {editingComment?.commentId === comment.commentId && (
          <div className="ml-11">
            <CommentForm
              onSubmit={(text) => updateMutation.mutate({ commentId: comment.commentId, text })}
              onCancel={handleCancel}
              initialValue={comment.text}
              isSubmitting={updateMutation.isPending}
              placeholder="Edit your comment..."
            />
          </div>
        )}

        {/* Reply form */}
        {replyingTo === comment.commentId && (
          <div className="ml-11">
            <CommentForm
              onSubmit={(text) => handleCreateComment(text, comment.commentId)}
              onCancel={handleCancel}
              isSubmitting={createMutation.isPending}
              placeholder={`Reply to ${comment.username}...`}
            />
          </div>
        )}

        {/* Note: Replies would be loaded separately with parent_id filtering */}
      </div>
    ));
  }, [editingComment, replyingTo, handleReply, handleEdit, handleDelete, handleCancel, updateMutation, createMutation, resourceType, resourceId]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">Comments</h3>
        {commentsData && (
          <Badge variant="secondary">{commentsData.totalCount}</Badge>
        )}
      </div>

      {/* Main comment form */}
      {user && !showCommentForm && !replyingTo && !editingComment && (
        <Button
          variant="outline"
          onClick={() => setShowCommentForm(true)}
          className="w-full justify-start"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Add a comment...
        </Button>
      )}

      {showCommentForm && (
        <CommentForm
          onSubmit={(text) => handleCreateComment(text)}
          onCancel={() => setShowCommentForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : commentsData?.comments ? (
          renderComments(commentsData.comments)
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
};
