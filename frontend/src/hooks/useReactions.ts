/**
 * Custom hook for managing message reactions
 * Handles optimistic updates and API synchronization
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import '../config/amplifyClient';
import { Reaction, ReactionResponse } from '../types/messaging';
import { getReactions, addReaction, removeReaction, MESSAGING_QUERIES } from '../lib/api/messaging';
// Simple announce function - can be replaced with proper hook if available
function useAnnounce() {
  return (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // For now, just log - can be enhanced with ARIA live region
    if (priority === 'assertive') {
      console.warn(message);
    }
  };
}

interface UseReactionsProps {
  messageId: string;
  initialReactions?: Reaction[];
  onError?: (error: Error) => void;
}

interface UseReactionsReturn {
  reactions: Reaction[];
  isLoading: boolean;
  error: Error | null;
  toggleReaction: (shortcode: string, unicode: string) => Promise<void>;
  refreshReactions: () => Promise<void>;
}

/**
 * Convert unicode emoji to shortcode
 * Simple mapping for common emojis - can be expanded
 */
function unicodeToShortcode(unicode: string): string {
  // Common emoji to shortcode mapping
  const mapping: Record<string, string> = {
    '😀': ':grinning:',
    '😃': ':smiley:',
    '😄': ':smile:',
    '😁': ':grin:',
    '😆': ':laughing:',
    '😅': ':sweat_smile:',
    '🤣': ':rofl:',
    '😂': ':joy:',
    '🙂': ':slight_smile:',
    '🙃': ':upside_down:',
    '😉': ':wink:',
    '😊': ':blush:',
    '😇': ':innocent:',
    '🥰': ':smiling_face_with_3_hearts:',
    '😍': ':heart_eyes:',
    '🤩': ':star_struck:',
    '😘': ':kissing_heart:',
    '😗': ':kissing:',
    '😚': ':kissing_closed_eyes:',
    '😙': ':kissing_smiling_eyes:',
    '😋': ':yum:',
    '😛': ':stuck_out_tongue:',
    '😜': ':stuck_out_tongue_winking_eye:',
    '🤪': ':zany_face:',
    '😝': ':stuck_out_tongue_closed_eyes:',
    '❤️': ':heart:',
    '🧡': ':orange_heart:',
    '💛': ':yellow_heart:',
    '💚': ':green_heart:',
    '💙': ':blue_heart:',
    '💜': ':purple_heart:',
    '🖤': ':black_heart:',
    '🤍': ':white_heart:',
    '🤎': ':brown_heart:',
    '👍': ':thumbsup:',
    '👎': ':thumbsdown:',
    '🔥': ':fire:',
    '🎉': ':tada:',
    '👋': ':wave:',
    '👌': ':ok_hand:',
    '✌️': ':v:',
    '🤞': ':crossed_fingers:',
    '🤘': ':metal:',
  };

  return mapping[unicode] || `:emoji_${unicode.codePointAt(0)?.toString(16)}:`;
}

export function useReactions({
  messageId,
  initialReactions = [],
  onError
}: UseReactionsProps): UseReactionsReturn {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const announce = useAnnounce();
  const subscriptionClientRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);
  const handleReactionUpdateRef = useRef<(payload: ReactionResponse) => void>();

  const getAuthToken = useCallback((): string | null => {
    try {
      const authRaw = localStorage.getItem('auth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed?.access_token) return parsed.access_token as string;
        if (parsed?.id_token) return parsed.id_token as string;
      }
    } catch (err) {
      console.warn('Failed to parse auth token for reactions:', err);
    }
    const fallback = localStorage.getItem('authToken');
    return fallback || null;
  }, []);

  const getSubscriptionClient = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('NO_TOKEN');
    }
    if (!subscriptionClientRef.current) {
      subscriptionClientRef.current = generateClient({
        authMode: 'lambda',
        authToken: () => {
          const fresh = getAuthToken();
          if (!fresh) {
            throw new Error('NO_TOKEN');
          }
          return fresh;
        }
      });
    }
    return subscriptionClientRef.current;
  }, [getAuthToken]);

  const applyReactionResponse = useCallback(
    (current: Reaction[], response: ReactionResponse | null | undefined, viewerOverride: boolean | null) => {
      if (!response || response.messageId !== messageId) {
        return current;
      }

      const next = [...current];
      const index = next.findIndex(r => r.shortcode === response.shortcode);
      const existingViewerState = index >= 0 ? next[index].viewerHasReacted : false;
      const targetViewerState = viewerOverride ?? existingViewerState;

      if (response.removed) {
        if (index >= 0) {
          if (response.count <= 0) {
            next.splice(index, 1);
          } else {
            next[index] = {
              ...next[index],
              count: response.count,
              viewerHasReacted: targetViewerState
            };
          }
        }
        return next;
      }

      if (index >= 0) {
        next[index] = {
          ...next[index],
          count: response.count,
          unicode: response.unicode || next[index].unicode,
          viewerHasReacted: targetViewerState
        };
      } else {
        next.push({
          shortcode: response.shortcode,
          unicode: response.unicode,
          count: response.count,
          viewerHasReacted: targetViewerState
        });
      }

      return next;
    },
    [messageId]
  );

  const handleReactionUpdate = useCallback((payload: ReactionResponse) => {
    if (!payload) return;
    setReactions(prev => applyReactionResponse(prev, payload, null));
  }, [applyReactionResponse]);

  // Keep ref in sync
  useEffect(() => {
    handleReactionUpdateRef.current = handleReactionUpdate;
  }, [handleReactionUpdate]);

  const refreshReactions = useCallback(async () => {
    if (!messageId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedReactions = await getReactions(messageId);
      setReactions(fetchedReactions);
    } catch (err) {
      const safeError = err instanceof Error ? err : new Error('Failed to fetch reactions');
      setError(safeError);
      onError?.(safeError);
    } finally {
      setIsLoading(false);
    }
  }, [messageId, onError]);

  const refreshReactionsRef = useRef(refreshReactions);
  useEffect(() => {
    refreshReactionsRef.current = refreshReactions;
  }, [refreshReactions]);

  // Track the last messageId to detect when it changes (used for both initialization and subscription)
  const lastMessageIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Only initialize reactions when messageId changes, not when initialReactions prop changes
    // This prevents infinite loops when the parent updates message.reactions after we've already
    // updated reactions state internally (e.g., from toggleReaction or subscription)
    const messageIdChanged = lastMessageIdRef.current !== messageId;
    
    if (messageIdChanged && messageId) {
      lastMessageIdRef.current = messageId;
      hasInitializedRef.current = false;
    }

    // Only fetch reactions if initialReactions is undefined (not included in messages query)
    // If initialReactions is defined (even if empty array), reactions came from the batch query
    if (messageId && initialReactions === undefined && messageIdChanged && !hasInitializedRef.current) {
      // Only fetch if we haven't initialized yet and messageId changed
      refreshReactionsRef.current();
      hasInitializedRef.current = true;
    } else if (initialReactions !== undefined && messageIdChanged && !hasInitializedRef.current && messageId) {
      // Use initial reactions if provided (e.g., from message query)
      // This includes empty arrays [] which means "no reactions" from the batch query
      // Only set once when messageId changes, not every time initialReactions prop changes
      setReactions(initialReactions);
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]); // Only depend on messageId - don't react to initialReactions changes
  useEffect(() => {
    if (!messageId) {
      return;
    }

    // Always set up subscription for real-time reaction updates across chat instances
    // Even if initialReactions is provided, we need to subscribe to get updates when other users react
    // The subscription is per-message, so it's efficient and necessary for real-time sync

    // Only set up subscription if messageId changed
    if (messageId === lastMessageIdRef.current && subscriptionRef.current) {
      return;
    }

    // Clean up previous subscription if messageId changed
    if (lastMessageIdRef.current !== messageId && subscriptionRef.current) {
      subscriptionRef.current?.unsubscribe?.();
      subscriptionRef.current = null;
    }

    lastMessageIdRef.current = messageId;
    let active = true;

    const startSubscription = async () => {
      try {
        const client = getSubscriptionClient();
        const token = getAuthToken();
        if (!token) {
          throw new Error('NO_TOKEN');
        }
        const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

        const subscription = client.graphql(
          {
            query: MESSAGING_QUERIES.SUBSCRIBE_REACTIONS,
            variables: { messageId },
            authMode: 'lambda',
            authToken: bearer,
          },
          async () => {
            const latest = getAuthToken();
            if (!latest) {
              return {};
            }
            const latestBearer = latest.startsWith('Bearer ') ? latest : `Bearer ${latest}`;
            return { Authorization: latestBearer };
          },
        ).subscribe({
          next: ({ data }: any) => {
            if (!active) return;
            const payload: ReactionResponse | undefined = data?.onReaction;
            if (!payload || payload.messageId !== messageId) return;
            handleReactionUpdateRef.current?.(payload);
          },
          error: (err: any) => {
            if (active) {
              console.error('Reaction subscription error:', err);
            }
          }
        });

        if (active) {
          subscriptionRef.current = subscription;
        } else {
          subscription.unsubscribe?.();
        }
      } catch (err) {
        if (active) {
          console.error('Failed to subscribe to reactions:', err);
        }
      }
    };

    startSubscription();

    return () => {
      active = false;
      if (lastMessageIdRef.current === messageId) {
        subscriptionRef.current?.unsubscribe?.();
        subscriptionRef.current = null;
        lastMessageIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]); // Only depend on messageId - always subscribe for real-time updates

  const toggleReaction = useCallback(async (shortcode: string, unicode: string) => {
    if (!messageId) return;

    const existingReaction = reactions.find(r => r.shortcode === shortcode);
    const viewerHasReacted = existingReaction?.viewerHasReacted || false;
    const finalShortcode = shortcode || unicodeToShortcode(unicode);
    const previousReactions = reactions;

    // Prevent adding a 6th different reaction type (max 5 unique reaction types)
    const MAX_REACTIONS = 5;
    // Only block if: adding a NEW reaction type (not existing) AND we already have 5 different types
    if (!existingReaction && reactions.length >= MAX_REACTIONS) {
      const error = new Error(`Maximum of ${MAX_REACTIONS} different reactions allowed per message`);
      setError(error);
      onError?.(error);
      announce(`Cannot add more than ${MAX_REACTIONS} different reactions. You can still react to existing ones.`, 'assertive');
      return;
    }

    setReactions(prev => {
      const next = [...prev];
      const index = next.findIndex(r => r.shortcode === finalShortcode);

      if (viewerHasReacted) {
        if (index >= 0) {
          const newCount = Math.max(0, next[index].count - 1);
          if (newCount === 0) {
            next.splice(index, 1);
          } else {
            next[index] = {
              ...next[index],
              count: newCount,
              viewerHasReacted: false,
            };
          }
        }
      } else {
        if (index >= 0) {
          next[index] = {
            ...next[index],
            count: next[index].count + 1,
            unicode,
            viewerHasReacted: true,
          };
        } else {
          next.push({
            shortcode: finalShortcode,
            unicode,
            count: 1,
            viewerHasReacted: true,
          });
        }
      }

      return next;
    });

    try {
      if (viewerHasReacted) {
        const response = await removeReaction(messageId, finalShortcode);
        const normalized: ReactionResponse = { ...response, messageId: response.messageId ?? messageId };
        setReactions(prev => applyReactionResponse(prev, normalized, false));
        announce(`Removed ${unicode} reaction`, 'polite');
      } else {
        const response = await addReaction(messageId, finalShortcode, unicode);
        const normalized: ReactionResponse = { ...response, messageId: response.messageId ?? messageId };
        setReactions(prev => applyReactionResponse(prev, normalized, true));
        announce(`Added ${unicode} reaction`, 'polite');
      }
    } catch (err) {
      setReactions(previousReactions);
      const safeError = err instanceof Error ? err : new Error('Failed to update reaction');
      setError(safeError);
      onError?.(safeError);
      announce('Failed to update reaction', 'assertive');
    }
  }, [messageId, reactions, applyReactionResponse, announce, onError]);

  return {
    reactions,
    isLoading,
    error,
    toggleReaction,
    refreshReactions
  };
}

