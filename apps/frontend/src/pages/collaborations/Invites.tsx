/**
 * Page for viewing and managing collaboration invites.
 */

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import InvitesList from '@/components/collaborations/InvitesList';
import { Mail } from 'lucide-react';

const Invites: React.FC = () => {
  const { t } = useTranslation();
  
  // Get translations with safety checks
  const pageTranslations = (t as any)?.invites?.page;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">
            {pageTranslations?.title || 'Collaboration Invites'}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {pageTranslations?.description || 'View and manage your collaboration invitations from other users.'}
        </p>
      </div>

      {/* Invites List */}
      <InvitesList />
    </div>
  );
};

export default Invites;
