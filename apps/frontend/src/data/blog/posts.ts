/**
 * Blog Posts Metadata
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: 'product-updates' | 'community' | 'tips-tricks';
  featured: boolean;
  readTime: number;
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'welcome-to-goalsguild',
    title: 'Welcome to GoalsGuild: Your Journey Starts Here',
    excerpt: 'We\'re excited to introduce GoalsGuild, a revolutionary platform that helps you achieve your goals through community, gamification, and AI-powered guidance.',
    author: 'GoalsGuild Team',
    date: '2024-12-15',
    category: 'product-updates',
    featured: true,
    readTime: 5
  },
  {
    slug: 'getting-started-with-goals',
    title: 'Getting Started with Goals: A Beginner\'s Guide',
    excerpt: 'Learn how to create your first goal, break it down into manageable tasks, and track your progress effectively.',
    author: 'Sarah Johnson',
    date: '2024-12-10',
    category: 'tips-tricks',
    featured: true,
    readTime: 8
  },
  {
    slug: 'building-successful-guilds',
    title: 'Building Successful Guilds: Tips for Community Leaders',
    excerpt: 'Discover strategies for creating and managing thriving guilds that help members achieve their goals together.',
    author: 'Michael Chen',
    date: '2024-12-05',
    category: 'community',
    featured: false,
    readTime: 6
  },
  {
    slug: 'quest-system-explained',
    title: 'The Quest System Explained: Gamify Your Progress',
    excerpt: 'Understand how quests work, how to earn XP and badges, and how gamification can motivate you to achieve more.',
    author: 'Emma Rodriguez',
    date: '2024-11-28',
    category: 'tips-tricks',
    featured: false,
    readTime: 7
  },
  {
    slug: 'december-2024-updates',
    title: 'December 2024 Updates: New Features and Improvements',
    excerpt: 'Check out the latest features we\'ve added, including improved collaboration tools, enhanced analytics, and more.',
    author: 'GoalsGuild Team',
    date: '2024-12-01',
    category: 'product-updates',
    featured: true,
    readTime: 4
  }
];

