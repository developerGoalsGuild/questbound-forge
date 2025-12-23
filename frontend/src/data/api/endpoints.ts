/**
 * API Endpoints Documentation Data
 * 
 * Comprehensive list of all API endpoints organized by category.
 */

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  category: string;
  requiresAuth?: boolean;
  exampleRequest?: any;
  exampleResponse?: any;
  baseUrl?: string;
}

export interface ApiCategory {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
}

const API_BASE = 'https://api.goalsguild.com/v1';

export const apiEndpoints: ApiCategory[] = [
  {
    name: 'Authentication',
    description: 'User authentication and authorization endpoints',
    endpoints: [
      {
        method: 'POST',
        path: '/users/signup',
        description: 'Register a new user account',
        category: 'authentication',
        requiresAuth: false,
        exampleRequest: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
          username: 'username',
          full_name: 'John Doe'
        },
        exampleResponse: {
          user_id: 'user-123',
          email: 'user@example.com',
          username: 'username',
          id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/users/login',
        description: 'Authenticate and receive access tokens',
        category: 'authentication',
        requiresAuth: false,
        exampleRequest: {
          email: 'user@example.com',
          password: 'SecurePassword123!'
        },
        exampleResponse: {
          id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'refresh-token-here'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/auth/renew',
        description: 'Renew access token using refresh token',
        category: 'authentication',
        requiresAuth: true,
        exampleRequest: {
          refresh_token: 'refresh-token-here'
        },
        exampleResponse: {
          id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        baseUrl: API_BASE
      }
    ]
  },
  {
    name: 'Goals',
    description: 'Goal management endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/quests',
        description: 'List all goals for the authenticated user',
        category: 'goals',
        requiresAuth: true,
        exampleResponse: [
          {
            id: 'goal-123',
            title: 'Learn TypeScript',
            description: 'Master TypeScript programming',
            status: 'active',
            deadline: '2024-12-31',
            progress: 45
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/quests/{goal_id}',
        description: 'Get a specific goal by ID',
        category: 'goals',
        requiresAuth: true,
        exampleResponse: {
          id: 'goal-123',
          title: 'Learn TypeScript',
          description: 'Master TypeScript programming',
          status: 'active',
          deadline: '2024-12-31',
          progress: 45,
          tasks: []
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/quests',
        description: 'Create a new goal',
        category: 'goals',
        requiresAuth: true,
        exampleRequest: {
          title: 'Learn TypeScript',
          description: 'Master TypeScript programming',
          deadline: '2024-12-31',
          category: 'Learning',
          tags: ['programming', 'education'],
          answers: []
        },
        exampleResponse: {
          id: 'goal-123',
          title: 'Learn TypeScript',
          status: 'active'
        },
        baseUrl: API_BASE
      },
      {
        method: 'PUT',
        path: '/quests/{goal_id}',
        description: 'Update an existing goal',
        category: 'goals',
        requiresAuth: true,
        exampleRequest: {
          title: 'Learn TypeScript Advanced',
          description: 'Master advanced TypeScript concepts'
        },
        exampleResponse: {
          id: 'goal-123',
          title: 'Learn TypeScript Advanced',
          updated_at: 1703347200
        },
        baseUrl: API_BASE
      },
      {
        method: 'DELETE',
        path: '/quests/{goal_id}',
        description: 'Delete a goal',
        category: 'goals',
        requiresAuth: true,
        exampleResponse: {
          message: 'Goal deleted successfully'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/quests/createTask',
        description: 'Create a task for a goal',
        category: 'goals',
        requiresAuth: true,
        exampleRequest: {
          goal_id: 'goal-123',
          title: 'Complete TypeScript basics course',
          due_at: 1703347200,
          tags: ['course'],
          status: 'pending'
        },
        exampleResponse: {
          id: 'task-456',
          goal_id: 'goal-123',
          title: 'Complete TypeScript basics course',
          status: 'pending'
        },
        baseUrl: API_BASE
      },
      {
        method: 'PUT',
        path: '/quests/tasks/{task_id}',
        description: 'Update a task',
        category: 'goals',
        requiresAuth: true,
        exampleRequest: {
          goal_id: 'goal-123',
          title: 'Complete TypeScript basics course',
          status: 'completed'
        },
        exampleResponse: {
          id: 'task-456',
          status: 'completed',
          updated_at: 1703347200
        },
        baseUrl: API_BASE
      },
      {
        method: 'DELETE',
        path: '/quests/tasks/{task_id}',
        description: 'Delete a task',
        category: 'goals',
        requiresAuth: true,
        exampleResponse: {
          message: 'Task deleted successfully'
        },
        baseUrl: API_BASE
      }
    ]
  },
  {
    name: 'Quests',
    description: 'Quest management endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/quests/quests',
        description: 'List all quests for the authenticated user',
        category: 'quests',
        requiresAuth: true,
        exampleResponse: [
          {
            id: 'quest-789',
            title: 'Complete 10 Goals',
            status: 'active',
            reward_xp: 500
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/quests/quests/{quest_id}',
        description: 'Get a specific quest by ID',
        category: 'quests',
        requiresAuth: true,
        exampleResponse: {
          id: 'quest-789',
          title: 'Complete 10 Goals',
          status: 'active',
          reward_xp: 500,
          difficulty: 'medium'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/quests/createQuest',
        description: 'Create a new quest',
        category: 'quests',
        requiresAuth: true,
        exampleRequest: {
          title: 'Complete 10 Goals',
          description: 'Finish 10 goals to earn bonus XP',
          category: 'Achievement',
          difficulty: 'medium',
          reward_xp: 500,
          kind: 'quantitative',
          target_count: 10,
          count_scope: 'completed_tasks'
        },
        exampleResponse: {
          id: 'quest-789',
          title: 'Complete 10 Goals',
          status: 'draft'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/quests/quests/{quest_id}/start',
        description: 'Start a quest',
        category: 'quests',
        requiresAuth: true,
        exampleResponse: {
          id: 'quest-789',
          status: 'active',
          started_at: 1703347200
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/quests/quests/{quest_id}/cancel',
        description: 'Cancel an active quest',
        category: 'quests',
        requiresAuth: true,
        exampleResponse: {
          id: 'quest-789',
          status: 'cancelled'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/quests/quests/{quest_id}/fail',
        description: 'Mark a quest as failed',
        category: 'quests',
        requiresAuth: true,
        exampleResponse: {
          id: 'quest-789',
          status: 'failed'
        },
        baseUrl: API_BASE
      },
      {
        method: 'PUT',
        path: '/quests/quests/{quest_id}',
        description: 'Update a quest',
        category: 'quests',
        requiresAuth: true,
        exampleRequest: {
          title: 'Complete 15 Goals',
          reward_xp: 750
        },
        exampleResponse: {
          id: 'quest-789',
          title: 'Complete 15 Goals',
          updated_at: 1703347200
        },
        baseUrl: API_BASE
      },
      {
        method: 'DELETE',
        path: '/quests/quests/{quest_id}',
        description: 'Delete a quest',
        category: 'quests',
        requiresAuth: true,
        exampleResponse: {
          message: 'Quest deleted successfully'
        },
        baseUrl: API_BASE
      }
    ]
  },
  {
    name: 'Guilds',
    description: 'Guild management endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/guilds',
        description: 'List all guilds',
        category: 'guilds',
        requiresAuth: true,
        exampleResponse: [
          {
            guild_id: 'guild-abc',
            name: 'Fitness Warriors',
            member_count: 25,
            guild_type: 'public'
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/guilds/{guild_id}',
        description: 'Get a specific guild by ID',
        category: 'guilds',
        requiresAuth: true,
        exampleResponse: {
          guild_id: 'guild-abc',
          name: 'Fitness Warriors',
          description: 'A guild for fitness enthusiasts',
          member_count: 25,
          guild_type: 'public'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/guilds',
        description: 'Create a new guild',
        category: 'guilds',
        requiresAuth: true,
        exampleRequest: {
          name: 'Fitness Warriors',
          description: 'A guild for fitness enthusiasts',
          tags: ['fitness', 'health'],
          guild_type: 'public'
        },
        exampleResponse: {
          guild_id: 'guild-abc',
          name: 'Fitness Warriors'
        },
        baseUrl: API_BASE
      },
      {
        method: 'PUT',
        path: '/guilds/{guild_id}',
        description: 'Update a guild',
        category: 'guilds',
        requiresAuth: true,
        exampleRequest: {
          name: 'Fitness Warriors Elite',
          description: 'Updated description'
        },
        exampleResponse: {
          guild_id: 'guild-abc',
          name: 'Fitness Warriors Elite'
        },
        baseUrl: API_BASE
      },
      {
        method: 'DELETE',
        path: '/guilds/{guild_id}',
        description: 'Delete a guild',
        category: 'guilds',
        requiresAuth: true,
        exampleResponse: {
          message: 'Guild deleted successfully'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/guilds/{guild_id}/join',
        description: 'Join a guild',
        category: 'guilds',
        requiresAuth: true,
        exampleResponse: {
          message: 'Successfully joined guild',
          guild_id: 'guild-abc'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/guilds/{guild_id}/leave',
        description: 'Leave a guild',
        category: 'guilds',
        requiresAuth: true,
        exampleResponse: {
          message: 'Successfully left guild'
        },
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/guilds/rankings',
        description: 'Get guild rankings',
        category: 'guilds',
        requiresAuth: true,
        exampleResponse: [
          {
            guild_id: 'guild-abc',
            name: 'Fitness Warriors',
            total_score: 15000,
            position: 1
          }
        ],
        baseUrl: API_BASE
      }
    ]
  },
  {
    name: 'Messaging',
    description: 'Messaging and chat endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/messaging/rooms',
        description: 'List all chat rooms',
        category: 'messaging',
        requiresAuth: true,
        exampleResponse: [
          {
            room_id: 'ROOM-general',
            name: 'General',
            member_count: 10
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/messaging/rooms',
        description: 'Create a new chat room',
        category: 'messaging',
        requiresAuth: true,
        exampleRequest: {
          name: 'Project Discussion',
          description: 'Room for project discussions'
        },
        exampleResponse: {
          room_id: 'ROOM-project',
          name: 'Project Discussion'
        },
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/messaging/rooms/{room_id}',
        description: 'Get room details',
        category: 'messaging',
        requiresAuth: true,
        exampleResponse: {
          room_id: 'ROOM-general',
          name: 'General',
          member_count: 10,
          created_at: 1703347200
        },
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/messaging/rooms/{room_id}/messages',
        description: 'Get messages from a room',
        category: 'messaging',
        requiresAuth: true,
        exampleResponse: [
          {
            id: 'msg-123',
            room_id: 'ROOM-general',
            sender_id: 'user-123',
            text: 'Hello everyone!',
            ts: 1703347200
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/messaging/rooms/{room_id}/messages',
        description: 'Send a message to a room',
        category: 'messaging',
        requiresAuth: true,
        exampleRequest: {
          text: 'Hello everyone!'
        },
        exampleResponse: {
          id: 'msg-123',
          room_id: 'ROOM-general',
          text: 'Hello everyone!',
          ts: 1703347200
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/messaging/rooms/{room_id}/join',
        description: 'Join a chat room',
        category: 'messaging',
        requiresAuth: true,
        exampleResponse: {
          message: 'Successfully joined room'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/messaging/rooms/{room_id}/leave',
        description: 'Leave a chat room',
        category: 'messaging',
        requiresAuth: true,
        exampleResponse: {
          message: 'Successfully left room'
        },
        baseUrl: API_BASE
      }
    ]
  },
  {
    name: 'Collaborations',
    description: 'Collaboration and sharing endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/collaborations/my-collaborations',
        description: 'Get user\'s collaborations',
        category: 'collaborations',
        requiresAuth: true,
        exampleResponse: {
          collaborations: [
            {
              resource_type: 'goal',
              resource_id: 'goal-123',
              resource_title: 'Learn TypeScript',
              role: 'collaborator'
            }
          ]
        },
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/collaborations/invites',
        description: 'Get pending collaboration invites',
        category: 'collaborations',
        requiresAuth: true,
        exampleResponse: [
          {
            invite_id: 'invite-123',
            resource_type: 'goal',
            resource_id: 'goal-123',
            resource_title: 'Learn TypeScript',
            status: 'pending'
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/collaborations/invite',
        description: 'Send a collaboration invite',
        category: 'collaborations',
        requiresAuth: true,
        exampleRequest: {
          resource_type: 'goal',
          resource_id: 'goal-123',
          invitee_email: 'collaborator@example.com',
          message: 'Would you like to collaborate on this goal?'
        },
        exampleResponse: {
          invite_id: 'invite-123',
          status: 'pending'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/collaborations/invites/{invite_id}/accept',
        description: 'Accept a collaboration invite',
        category: 'collaborations',
        requiresAuth: true,
        exampleResponse: {
          message: 'Invite accepted successfully'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/collaborations/invites/{invite_id}/decline',
        description: 'Decline a collaboration invite',
        category: 'collaborations',
        requiresAuth: true,
        exampleResponse: {
          message: 'Invite declined'
        },
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/collaborations/resources/{resource_type}/{resource_id}/collaborators',
        description: 'Get collaborators for a resource',
        category: 'collaborations',
        requiresAuth: true,
        exampleResponse: [
          {
            user_id: 'user-456',
            username: 'collaborator',
            role: 'collaborator'
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/collaborations/resources/{resource_type}/{resource_id}/comments',
        description: 'Get comments for a resource',
        category: 'collaborations',
        requiresAuth: true,
        exampleResponse: [
          {
            comment_id: 'comment-123',
            text: 'Great progress!',
            user_id: 'user-456',
            created_at: 1703347200
          }
        ],
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/collaborations/resources/{resource_type}/{resource_id}/comments',
        description: 'Post a comment on a resource',
        category: 'collaborations',
        requiresAuth: true,
        exampleRequest: {
          text: 'Great progress!',
          parent_id: null
        },
        exampleResponse: {
          comment_id: 'comment-123',
          text: 'Great progress!',
          created_at: 1703347200
        },
        baseUrl: API_BASE
      }
    ]
  },
  {
    name: 'Subscriptions',
    description: 'Subscription and billing endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/subscriptions/current',
        description: 'Get current user subscription',
        category: 'subscriptions',
        requiresAuth: true,
        exampleResponse: {
          subscription_id: 'sub-123',
          plan_tier: 'JOURNEYMAN',
          status: 'active',
          has_active_subscription: true
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/subscriptions/create-checkout',
        description: 'Create Stripe checkout session',
        category: 'subscriptions',
        requiresAuth: true,
        exampleRequest: {
          plan_tier: 'JOURNEYMAN',
          success_url: 'https://app.goalsguild.com/subscription/success',
          cancel_url: 'https://app.goalsguild.com/subscription'
        },
        exampleResponse: {
          session_id: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/subscriptions/cancel',
        description: 'Cancel current subscription',
        category: 'subscriptions',
        requiresAuth: true,
        exampleResponse: {
          message: 'Subscription will be cancelled at end of billing period'
        },
        baseUrl: API_BASE
      },
      {
        method: 'GET',
        path: '/subscriptions/credits/balance',
        description: 'Get credit balance',
        category: 'subscriptions',
        requiresAuth: true,
        exampleResponse: {
          balance: 100,
          last_top_up: '2024-12-01T00:00:00Z'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/subscriptions/credits/top-up',
        description: 'Top up credits',
        category: 'subscriptions',
        requiresAuth: true,
        exampleRequest: {
          amount: 50
        },
        exampleResponse: {
          balance: 150,
          transaction_id: 'txn-123'
        },
        baseUrl: API_BASE
      },
      {
        method: 'POST',
        path: '/subscriptions/billing-portal',
        description: 'Get Stripe billing portal URL',
        category: 'subscriptions',
        requiresAuth: true,
        exampleResponse: {
          url: 'https://billing.stripe.com/p/session/portal_123'
        },
        baseUrl: API_BASE
      }
    ]
  },
  {
    name: 'Profile',
    description: 'User profile management endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/profile',
        description: 'Get current user profile',
        category: 'profile',
        requiresAuth: true,
        exampleResponse: {
          user_id: 'user-123',
          username: 'username',
          email: 'user@example.com',
          full_name: 'John Doe',
          bio: 'Goal achiever'
        },
        baseUrl: API_BASE
      },
      {
        method: 'PUT',
        path: '/profile',
        description: 'Update user profile',
        category: 'profile',
        requiresAuth: true,
        exampleRequest: {
          full_name: 'John Doe Updated',
          bio: 'Updated bio'
        },
        exampleResponse: {
          user_id: 'user-123',
          full_name: 'John Doe Updated',
          updated_at: 1703347200
        },
        baseUrl: API_BASE
      }
    ]
  }
];

