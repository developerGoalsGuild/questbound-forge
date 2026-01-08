/**
 * Help Articles Data
 */

export interface HelpArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
}

export const helpArticles: HelpArticle[] = [
  {
    slug: 'getting-started-guide',
    title: 'Getting Started with GoalsGuild',
    excerpt: 'A comprehensive guide to help you get started with GoalsGuild and make the most of the platform.',
    category: 'getting-started',
    content: `# Getting Started with GoalsGuild

Welcome to GoalsGuild! This guide will help you get started and make the most of our platform.

## Creating Your First Goal

1. Click the "Create Goal" button on your dashboard
2. Enter your goal title and description
3. Set a deadline
4. Choose a category
5. Answer NLP questions to help break down your goal
6. Review and create your goal

## Breaking Down Goals into Tasks

Once you've created a goal, you can add tasks:
- Click "Add Task" on your goal
- Enter task details
- Set due dates
- Mark tasks as complete as you progress

## Joining Guilds

Guilds are communities of people working toward similar goals:
- Browse guilds from the Guilds page
- Join public guilds instantly
- Request to join private guilds
- Create your own guild

## Using Quests

Quests gamify your goal achievement:
- Create quests from the Quests page
- Set targets and rewards
- Track your progress
- Earn XP and badges

## Need More Help?

Check out our other help articles or contact support.`
  },
  {
    slug: 'creating-effective-goals',
    title: 'Creating Effective Goals',
    excerpt: 'Learn how to create goals that are specific, measurable, and achievable.',
    category: 'goals-quests',
    content: `# Creating Effective Goals

Setting effective goals is crucial for success. Here's how to create goals that work.

## Be Specific

Instead of "get fit," try "run a 5K in under 30 minutes by March 2024."

## Make It Measurable

Include numbers or metrics so you can track progress:
- "Lose 10 pounds"
- "Read 12 books"
- "Save $5,000"

## Set Deadlines

Give yourself a realistic timeline. Deadlines create urgency and help you stay focused.

## Break It Down

Break large goals into smaller milestones and tasks:
- Milestone 1: Build up to running 1 mile
- Milestone 2: Run 2 miles continuously
- Milestone 3: Complete a 5K run

## Review Regularly

Check your progress weekly and adjust as needed.`
  },
  {
    slug: 'guild-management',
    title: 'Managing Your Guild',
    excerpt: 'Tips for creating and managing successful guilds.',
    category: 'guilds',
    content: `# Managing Your Guild

As a guild leader, you have tools to help your community thrive.

## Setting Up Your Guild

1. Choose a clear focus and theme
2. Write a compelling description
3. Set guild rules and guidelines
4. Choose privacy settings

## Growing Your Guild

- Invite friends and colleagues
- Share your guild on social media
- Post in relevant communities
- Welcome new members warmly

## Maintaining Engagement

- Plan regular activities
- Encourage member participation
- Recognize achievements
- Foster collaboration

## Handling Issues

- Address conflicts promptly
- Listen to member feedback
- Maintain a positive environment
- Be fair and consistent`
  },
  {
    slug: 'subscription-faq',
    title: 'Subscription and Billing FAQ',
    excerpt: 'Common questions about subscriptions, billing, and credits.',
    category: 'billing',
    content: `# Subscription and Billing FAQ

## Subscription Plans

GoalsGuild offers three subscription tiers:

### Free Tier
- Basic goal tracking
- Limited quests
- Community features

### Journeyman
- Unlimited goals and quests
- Advanced analytics
- Priority support

### Patron
- All Journeyman features
- Exclusive badges
- Early access to features

## Billing

- Subscriptions are billed monthly or annually
- You can upgrade or downgrade at any time
- Cancellations take effect at the end of your billing period

## Credits

Credits are used for premium features:
- AI-powered goal breakdowns
- Advanced quest templates
- Premium guild features

You can purchase credits from the Subscription page.`
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting Common Issues',
    excerpt: 'Solutions to common problems and issues.',
    category: 'troubleshooting',
    content: `# Troubleshooting Common Issues

## Can't Log In

- Check your email and password
- Try resetting your password
- Clear your browser cache
- Try a different browser

## Goals Not Saving

- Check your internet connection
- Refresh the page
- Try logging out and back in
- Clear browser cache

## Notifications Not Working

- Check notification settings in your profile
- Ensure browser notifications are enabled
- Check spam folder for emails

## Performance Issues

- Clear browser cache
- Disable browser extensions
- Try a different browser
- Check your internet connection

## Still Having Issues?

Contact our support team for assistance.`
  }
];

