/**
 * Terms of Service Content
 * 
 * Full terms of service text organized by sections.
 */

export interface TermsSection {
  id: string;
  title: string;
  content: string[];
  items?: string[];
}

export interface TermsOfServiceData {
  lastUpdated: string;
  sections: TermsSection[];
}

export const termsOfServiceContent: TermsOfServiceData = {
  lastUpdated: 'December 23, 2024',
  sections: [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using GoalsGuild, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our service.',
        'We reserve the right to modify these terms at any time. Your continued use of the service after changes constitutes acceptance of the modified terms.'
      ]
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      content: [
        'To use certain features of GoalsGuild, you must create an account. You agree to:',
      ],
      items: [
        'Provide accurate, current, and complete information',
        'Maintain and update your account information',
        'Maintain the security of your password',
        'Accept responsibility for all activities under your account',
        'Notify us immediately of any unauthorized access',
        'Be at least 13 years old (or the age of majority in your jurisdiction)'
      ]
    },
    {
      id: 'usage',
      title: 'Service Usage Rules',
      content: [
        'You agree not to:',
      ],
      items: [
        'Violate any applicable laws or regulations',
        'Infringe on intellectual property rights',
        'Transmit harmful code, viruses, or malware',
        'Harass, abuse, or harm other users',
        'Impersonate others or provide false information',
        'Interfere with or disrupt the service',
        'Use automated systems to access the service without permission',
        'Collect user information without consent',
        'Use the service for illegal or unauthorized purposes'
      ]
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      content: [
        'The GoalsGuild service, including its design, features, and functionality, is owned by GoalsGuild and protected by copyright, trademark, and other intellectual property laws.',
        'You retain ownership of content you create and post on GoalsGuild. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the service.',
        'You may not copy, modify, distribute, sell, or lease any part of our service without our written permission.'
      ]
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: [
        'GoalsGuild is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.',
        'To the maximum extent permitted by law, GoalsGuild shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses.',
        'Our total liability for any claims arising from your use of the service shall not exceed the amount you paid us in the 12 months preceding the claim.'
      ]
    },
    {
      id: 'termination',
      title: 'Termination',
      content: [
        'We may terminate or suspend your account and access to the service immediately, without prior notice, for any reason, including if you breach these Terms of Service.',
        'You may terminate your account at any time by contacting us or using the account deletion feature in your settings.',
        'Upon termination, your right to use the service will cease immediately. We may delete your account and data, subject to our data retention policies.'
      ]
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      content: [
        'We reserve the right to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.',
        'What constitutes a material change will be determined at our sole discretion. Your continued use of the service after changes constitutes acceptance of the new terms.',
        'If you do not agree to the new terms, you must stop using the service and may delete your account.'
      ]
    }
  ]
};

