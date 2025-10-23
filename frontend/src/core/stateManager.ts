/**
 * State Management System
 * Centralized state management with Zustand for messaging system
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// State interfaces
export interface MessagingState {
  messages: Record<string, any[]>;
  rooms: Record<string, any>;
  connections: Record<string, boolean>;
  typingUsers: Record<string, any[]>;
  errors: Record<string, any>;
  loading: Record<string, boolean>;
  metadata: Record<string, any>;
}

export interface MessagingActions {
  // Message actions
  addMessage: (roomId: string, message: any) => void;
  updateMessage: (roomId: string, messageId: string, updates: any) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  clearMessages: (roomId: string) => void;
  setMessages: (roomId: string, messages: any[]) => void;

  // Room actions
  setRoom: (roomId: string, room: any) => void;
  updateRoom: (roomId: string, updates: any) => void;
  removeRoom: (roomId: string) => void;

  // Connection actions
  setConnection: (roomId: string, connected: boolean) => void;
  setAllConnections: (connections: Record<string, boolean>) => void;

  // Typing actions
  addTypingUser: (roomId: string, user: any) => void;
  removeTypingUser: (roomId: string, userId: string) => void;
  clearTypingUsers: (roomId: string) => void;

  // Error actions
  setError: (roomId: string, error: any) => void;
  clearError: (roomId: string) => void;
  clearAllErrors: () => void;

  // Loading actions
  setLoading: (key: string, loading: boolean) => void;
  setMultipleLoading: (loading: Record<string, boolean>) => void;

  // Metadata actions
  setMetadata: (key: string, value: any) => void;
  updateMetadata: (key: string, updates: any) => void;
  clearMetadata: (key: string) => void;

  // Utility actions
  reset: () => void;
  resetRoom: (roomId: string) => void;
  getState: () => MessagingState;
}

export interface MessagingStore extends MessagingState, MessagingActions {}

// Initial state
const initialState: MessagingState = {
  messages: {},
  rooms: {},
  connections: {},
  typingUsers: {},
  errors: {},
  loading: {},
  metadata: {}
};

// Create the store
export const useMessagingStore = create<MessagingStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Message actions
        addMessage: (roomId: string, message: any) => {
          set((state) => {
            if (!state.messages[roomId]) {
              state.messages[roomId] = [];
            }
            state.messages[roomId].push(message);
          });
        },

        updateMessage: (roomId: string, messageId: string, updates: any) => {
          set((state) => {
            if (state.messages[roomId]) {
              const index = state.messages[roomId].findIndex(m => m.id === messageId);
              if (index !== -1) {
                Object.assign(state.messages[roomId][index], updates);
              }
            }
          });
        },

        deleteMessage: (roomId: string, messageId: string) => {
          set((state) => {
            if (state.messages[roomId]) {
              state.messages[roomId] = state.messages[roomId].filter(m => m.id !== messageId);
            }
          });
        },

        clearMessages: (roomId: string) => {
          set((state) => {
            state.messages[roomId] = [];
          });
        },

        setMessages: (roomId: string, messages: any[]) => {
          set((state) => {
            state.messages[roomId] = messages;
          });
        },

        // Room actions
        setRoom: (roomId: string, room: any) => {
          set((state) => {
            state.rooms[roomId] = room;
          });
        },

        updateRoom: (roomId: string, updates: any) => {
          set((state) => {
            if (state.rooms[roomId]) {
              Object.assign(state.rooms[roomId], updates);
            }
          });
        },

        removeRoom: (roomId: string) => {
          set((state) => {
            delete state.rooms[roomId];
            delete state.messages[roomId];
            delete state.connections[roomId];
            delete state.typingUsers[roomId];
            delete state.errors[roomId];
          });
        },

        // Connection actions
        setConnection: (roomId: string, connected: boolean) => {
          set((state) => {
            state.connections[roomId] = connected;
          });
        },

        setAllConnections: (connections: Record<string, boolean>) => {
          set((state) => {
            state.connections = connections;
          });
        },

        // Typing actions
        addTypingUser: (roomId: string, user: any) => {
          set((state) => {
            if (!state.typingUsers[roomId]) {
              state.typingUsers[roomId] = [];
            }
            const existingIndex = state.typingUsers[roomId].findIndex(u => u.userId === user.userId);
            if (existingIndex === -1) {
              state.typingUsers[roomId].push(user);
            } else {
              state.typingUsers[roomId][existingIndex] = user;
            }
          });
        },

        removeTypingUser: (roomId: string, userId: string) => {
          set((state) => {
            if (state.typingUsers[roomId]) {
              state.typingUsers[roomId] = state.typingUsers[roomId].filter(u => u.userId !== userId);
            }
          });
        },

        clearTypingUsers: (roomId: string) => {
          set((state) => {
            state.typingUsers[roomId] = [];
          });
        },

        // Error actions
        setError: (roomId: string, error: any) => {
          set((state) => {
            state.errors[roomId] = error;
          });
        },

        clearError: (roomId: string) => {
          set((state) => {
            delete state.errors[roomId];
          });
        },

        clearAllErrors: () => {
          set((state) => {
            state.errors = {};
          });
        },

        // Loading actions
        setLoading: (key: string, loading: boolean) => {
          set((state) => {
            state.loading[key] = loading;
          });
        },

        setMultipleLoading: (loading: Record<string, boolean>) => {
          set((state) => {
            Object.assign(state.loading, loading);
          });
        },

        // Metadata actions
        setMetadata: (key: string, value: any) => {
          set((state) => {
            state.metadata[key] = value;
          });
        },

        updateMetadata: (key: string, updates: any) => {
          set((state) => {
            if (state.metadata[key]) {
              Object.assign(state.metadata[key], updates);
            } else {
              state.metadata[key] = updates;
            }
          });
        },

        clearMetadata: (key: string) => {
          set((state) => {
            delete state.metadata[key];
          });
        },

        // Utility actions
        reset: () => {
          set(() => ({ ...initialState }));
        },

        resetRoom: (roomId: string) => {
          set((state) => {
            delete state.messages[roomId];
            delete state.rooms[roomId];
            delete state.connections[roomId];
            delete state.typingUsers[roomId];
            delete state.errors[roomId];
          });
        },

        getState: () => {
          return get();
        }
      }))
    ),
    {
      name: 'messaging-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Selectors
export const selectors = {
  getMessages: (roomId: string) => (state: MessagingState) => state.messages[roomId] || [],
  getRoom: (roomId: string) => (state: MessagingState) => state.rooms[roomId],
  isConnected: (roomId: string) => (state: MessagingState) => state.connections[roomId] || false,
  getTypingUsers: (roomId: string) => (state: MessagingState) => state.typingUsers[roomId] || [],
  getError: (roomId: string) => (state: MessagingState) => state.errors[roomId],
  isLoading: (key: string) => (state: MessagingState) => state.loading[key] || false,
  getMetadata: (key: string) => (state: MessagingState) => state.metadata[key],
  getAllRooms: (state: MessagingState) => Object.values(state.rooms),
  getAllConnections: (state: MessagingState) => state.connections,
  getAllErrors: (state: MessagingState) => state.errors,
  getAllLoading: (state: MessagingState) => state.loading
};

// Middleware for persistence
export const persistMiddleware = (config: {
  name: string;
  storage?: Storage;
  partialize?: (state: MessagingState) => Partial<MessagingState>;
}) => {
  const storage = config.storage || localStorage;
  const key = `messaging-${config.name}`;

  return (set: any, get: any, api: any) => {
    // Load persisted state
    try {
      const persisted = storage.getItem(key);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        set(parsed);
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }

    // Save state changes
    api.subscribe((state: MessagingState) => {
      try {
        const toPersist = config.partialize ? config.partialize(state) : state;
        storage.setItem(key, JSON.stringify(toPersist));
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    });

    return api;
  };
};

// Middleware for logging
export const loggingMiddleware = (config: {
  enabled?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}) => {
  return (set: any, get: any, api: any) => {
    if (!config.enabled) return api;

    const originalSet = set;
    set = (partial: any, replace?: boolean) => {
      const prevState = get();
      const result = originalSet(partial, replace);
      const nextState = get();

      console.log(`[StateManager] State changed:`, {
        prevState: config.logLevel === 'debug' ? prevState : 'hidden',
        nextState: config.logLevel === 'debug' ? nextState : 'hidden',
        changes: config.logLevel === 'debug' ? partial : 'hidden'
      });

      return result;
    };

    return api;
  };
};

// Middleware for analytics
export const analyticsMiddleware = (config: {
  enabled?: boolean;
  trackActions?: string[];
}) => {
  return (set: any, get: any, api: any) => {
    if (!config.enabled) return api;

    const originalSet = set;
    set = (partial: any, replace?: boolean) => {
      const result = originalSet(partial, replace);
      
      // Track specific actions
      if (typeof partial === 'function') {
        const actionName = partial.name || 'anonymous';
        if (config.trackActions?.includes(actionName)) {
          console.log(`[Analytics] Action tracked: ${actionName}`);
          // Here you would send to your analytics service
        }
      }

      return result;
    };

    return api;
  };
};

// Hook for subscribing to specific state changes
export const useMessagingSubscription = <T>(
  selector: (state: MessagingState) => T,
  callback: (value: T, prevValue: T) => void
) => {
  const store = useMessagingStore;
  let prevValue = selector(store.getState());

  store.subscribe((state) => {
    const currentValue = selector(state);
    if (currentValue !== prevValue) {
      callback(currentValue, prevValue);
      prevValue = currentValue;
    }
  });
};

// Hook for derived state
export const useDerivedMessagingState = <T>(
  selector: (state: MessagingState) => T,
  deps: any[] = []
) => {
  return useMessagingStore(selector);
};
