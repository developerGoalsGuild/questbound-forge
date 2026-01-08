/**
 * FAQ Data
 */

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqs: FAQ[] = [
  {
    id: 'what-is-goalsguild',
    question: 'What is GoalsGuild?',
    answer: 'GoalsGuild is a platform that helps you achieve your goals through community support, gamification, and AI-powered guidance. You can create goals, break them down into tasks, join guilds, and track your progress.',
    category: 'getting-started'
  },
  {
    id: 'how-to-create-goal',
    question: 'How do I create a goal?',
    answer: 'To create a goal, click the "Create Goal" button on your dashboard. Fill in the goal details including title, description, deadline, and category. You can also answer NLP questions to help break down your goal into actionable tasks.',
    category: 'getting-started'
  },
  {
    id: 'what-are-quests',
    question: 'What are quests?',
    answer: 'Quests are gamified challenges that reward you with XP and badges when completed. They help make goal achievement fun and motivating. You can create custom quests or use templates.',
    category: 'goals-quests'
  },
  {
    id: 'how-to-join-guild',
    question: 'How do I join a guild?',
    answer: 'You can browse available guilds from the Guilds page. Click on a guild to view details, then click "Join Guild" if it\'s public, or "Request to Join" if it requires approval.',
    category: 'guilds'
  },
  {
    id: 'how-to-collaborate',
    question: 'How do I collaborate on goals?',
    answer: 'You can invite others to collaborate on your goals by clicking the "Invite Collaborator" button. Enter their email address and send an invite. They\'ll receive a notification and can accept to start collaborating.',
    category: 'goals-quests'
  },
  {
    id: 'subscription-plans',
    question: 'What subscription plans are available?',
    answer: 'GoalsGuild offers multiple subscription tiers: Free, Journeyman, and Patron. Each tier includes different features and limits. Visit the Subscription page to see details and upgrade.',
    category: 'billing'
  },
  {
    id: 'how-to-cancel',
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription from the Subscription Management page. Your subscription will remain active until the end of your billing period, and you\'ll continue to have access to all features until then.',
    category: 'billing'
  },
  {
    id: 'reset-password',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive an email with instructions to reset your password.',
    category: 'troubleshooting'
  },
  {
    id: 'delete-account',
    question: 'How do I delete my account?',
    answer: 'You can delete your account from the Profile Settings page. This action is permanent and will delete all your data including goals, quests, and guild memberships.',
    category: 'troubleshooting'
  },
  {
    id: 'export-data',
    question: 'Can I export my data?',
    answer: 'Yes, you can export your goals and progress data. This feature is available in your Profile Settings. You\'ll receive a downloadable file with all your data.',
    category: 'troubleshooting'
  }
];

