/**
 * Privacy Policy Content
 * 
 * Full privacy policy text organized by sections.
 */

export interface PrivacySection {
  id: string;
  title: string;
  content: string[];
  items?: string[];
}

export interface PrivacyPolicyData {
  lastUpdated: string;
  sections: PrivacySection[];
}

export const privacyPolicyContent: PrivacyPolicyData = {
  lastUpdated: 'December 23, 2024',
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      content: [
        'Welcome to GoalsGuild. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.',
        'By using GoalsGuild, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.'
      ]
    },
    {
      id: 'data-collection',
      title: 'Data Collection',
      content: [
        'We collect information that you provide directly to us, including:',
        'We also automatically collect certain information when you use our service:'
      ],
      items: [
        'Account information (email, username, password)',
        'Profile information (name, bio, preferences)',
        'Goal and quest data that you create',
        'Content you post, including comments and messages',
        'Payment information (processed securely through Stripe)',
        'Support communications',
        'Device information (IP address, browser type, operating system)',
        'Usage data (pages visited, features used, time spent)',
        'Cookies and similar tracking technologies'
      ]
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Data',
      content: [
        'We use the information we collect to:',
      ],
      items: [
        'Provide, maintain, and improve our services',
        'Process transactions and send related information',
        'Send you technical notices and support messages',
        'Respond to your comments and questions',
        'Monitor and analyze usage patterns',
        'Detect, prevent, and address technical issues',
        'Personalize your experience',
        'Send you marketing communications (with your consent)'
      ]
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing and Disclosure',
      content: [
        'We do not sell your personal information. We may share your information in the following circumstances:',
      ],
      items: [
        'With service providers who assist us in operating our platform (e.g., AWS, Stripe)',
        'When you choose to make content public or share it with collaborators',
        'To comply with legal obligations or protect our rights',
        'In connection with a business transfer (merger, acquisition, etc.)',
        'With your explicit consent'
      ]
    },
    {
      id: 'user-rights',
      title: 'Your Rights',
      content: [
        'Depending on your location, you may have the following rights regarding your personal data:',
        'To exercise these rights, please contact us at privacy@goalsguild.com.'
      ],
      items: [
        'Access: Request a copy of your personal data',
        'Correction: Request correction of inaccurate data',
        'Deletion: Request deletion of your personal data',
        'Portability: Request transfer of your data',
        'Objection: Object to processing of your data',
        'Restriction: Request restriction of processing',
        'Withdraw Consent: Withdraw consent at any time'
      ]
    },
    {
      id: 'cookies',
      title: 'Cookies Policy',
      content: [
        'We use cookies and similar technologies to enhance your experience. Types of cookies we use:',
        'You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our service.'
      ],
      items: [
        'Essential cookies: Required for the service to function',
        'Analytics cookies: Help us understand how you use our service',
        'Preference cookies: Remember your settings and preferences',
        'Marketing cookies: Used to deliver relevant advertisements'
      ]
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: [
        'If you have questions about this Privacy Policy or our data practices, please contact us:',
      ],
      items: [
        'Email: privacy@goalsguild.com',
        'Address: GoalsGuild Privacy Team'
      ]
    }
  ]
};

