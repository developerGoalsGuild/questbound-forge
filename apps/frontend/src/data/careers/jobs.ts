/**
 * Job Listings Data
 */

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  postedDate: string;
  salary?: string;
}

export const jobs: Job[] = [
  {
    id: 'senior-frontend-engineer',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    description: 'We are looking for an experienced Frontend Engineer to join our team and help build the next generation of goal achievement tools.',
    requirements: [
      '5+ years of experience with React and TypeScript',
      'Strong understanding of modern frontend architecture',
      'Experience with state management (Redux, Zustand, etc.)',
      'Knowledge of accessibility best practices',
      'Experience with testing frameworks (Jest, Vitest)'
    ],
    responsibilities: [
      'Develop and maintain React components',
      'Collaborate with design team on UI/UX',
      'Optimize application performance',
      'Write clean, maintainable code',
      'Mentor junior developers'
    ],
    postedDate: '2024-12-20',
    salary: '$120,000 - $160,000'
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    description: 'Join our backend team to build scalable APIs and services that power GoalsGuild\'s platform.',
    requirements: [
      '3+ years of experience with Python/FastAPI',
      'Experience with AWS services (Lambda, DynamoDB, API Gateway)',
      'Knowledge of RESTful API design',
      'Understanding of database design and optimization',
      'Experience with testing and CI/CD'
    ],
    responsibilities: [
      'Design and implement REST APIs',
      'Optimize database queries',
      'Implement authentication and authorization',
      'Monitor and debug production issues',
      'Collaborate with frontend team'
    ],
    postedDate: '2024-12-18',
    salary: '$100,000 - $140,000'
  },
  {
    id: 'product-designer',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'full-time',
    description: 'We\'re seeking a talented Product Designer to help shape the user experience of GoalsGuild.',
    requirements: [
      '3+ years of product design experience',
      'Strong portfolio showcasing UX/UI work',
      'Proficiency in Figma or similar tools',
      'Understanding of user research methods',
      'Experience with design systems'
    ],
    responsibilities: [
      'Design user interfaces and experiences',
      'Conduct user research and testing',
      'Create design systems and components',
      'Collaborate with engineering team',
      'Iterate based on user feedback'
    ],
    postedDate: '2024-12-15',
    salary: '$90,000 - $120,000'
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    description: 'Help us build and maintain our infrastructure on AWS.',
    requirements: [
      '3+ years of DevOps experience',
      'Strong AWS knowledge (EC2, ECS, Lambda, etc.)',
      'Experience with Terraform or CloudFormation',
      'Knowledge of CI/CD pipelines',
      'Understanding of monitoring and logging'
    ],
    responsibilities: [
      'Manage AWS infrastructure',
      'Automate deployment processes',
      'Monitor system performance',
      'Implement security best practices',
      'Troubleshoot production issues'
    ],
    postedDate: '2024-12-12',
    salary: '$110,000 - $150,000'
  },
  {
    id: 'marketing-manager',
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'full-time',
    description: 'Lead our marketing efforts to grow the GoalsGuild community.',
    requirements: [
      '5+ years of marketing experience',
      'Experience with digital marketing channels',
      'Strong analytical skills',
      'Excellent communication skills',
      'Experience with SaaS products'
    ],
    responsibilities: [
      'Develop marketing strategies',
      'Manage marketing campaigns',
      'Analyze marketing metrics',
      'Create content and materials',
      'Work with product team on launches'
    ],
    postedDate: '2024-12-10',
    salary: '$80,000 - $110,000'
  }
];

