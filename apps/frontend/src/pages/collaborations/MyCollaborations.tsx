/**
 * Page component for displaying user's collaborations.
 * 
 * Shows all quests and goals where the user is a collaborator.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  BookOpen, 
  CheckSquare, 
  Calendar,
  Filter,
  ExternalLink
} from 'lucide-react';
import { getMyCollaborations, UserCollaboration } from '@/lib/api/collaborations';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, fr } from 'date-fns/locale';

const dateLocales = {
  en: enUS,
  es: es,
  fr: fr,
};

const MyCollaborations: React.FC = () => {
  const { t, language } = useTranslation();
  const [filterType, setFilterType] = useState<'all' | 'goal' | 'quest' | 'task'>('all');
  
  // Get translations
  const translations = (t as any)?.myCollaborations;
  const locale = dateLocales[language as keyof typeof dateLocales] || enUS;

  // Fetch user's collaborations
  const { data: collaborationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['my-collaborations', filterType],
    queryFn: () => getMyCollaborations(filterType === 'all' ? undefined : filterType),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const collaborations = collaborationsData?.collaborations || [];

  // Get resource type icon
  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'goal':
        return <Target className="h-5 w-5" />;
      case 'quest':
        return <BookOpen className="h-5 w-5" />;
      case 'task':
        return <CheckSquare className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  // Get resource type label
  const getResourceTypeLabel = (resourceType: string) => {
    const key = resourceType.toLowerCase();
    return translations?.resourceTypes?.[key] || resourceType;
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    return role === 'owner' ? 'default' : 'secondary';
  };

  // Format joined date
  const formatJoinedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return translations?.unknownDate || 'Unknown date';
      }
      return formatDistanceToNow(date, { addSuffix: true, locale });
    } catch (error) {
      return translations?.unknownDate || 'Unknown date';
    }
  };

  // Get resource link
  const getResourceLink = (collaboration: UserCollaboration) => {
    switch (collaboration.resourceType) {
      case 'goal':
        return `/goals/details/${collaboration.resourceId}`;
      case 'quest':
        return `/quests/details/${collaboration.resourceId}`;
      case 'task':
        return `/tasks/${collaboration.resourceId}`;
      default:
        return '#';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{translations?.title || 'My Collaborations'}</h1>
            <p className="text-gray-600">{translations?.loading || 'Loading your collaborations...'}</p>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{translations?.title || 'My Collaborations'}</h1>
            <p className="text-gray-600">{translations?.errorTitle || 'Error loading your collaborations'}</p>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <Users className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{translations?.errorTitle || 'Failed to Load Collaborations'}</h3>
              <p className="text-gray-600 mb-4">
                {translations?.errorDescription || 'There was an error loading your collaborations. Please try again.'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                {translations?.tryAgain || 'Try Again'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{translations?.title || 'My Collaborations'}</h1>
          <p className="text-gray-600">
            {translations?.subtitle || 'Quests and goals where you are collaborating with others'}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{translations?.filterByType || 'Filter by type:'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: translations?.all || 'All', count: collaborationsData?.total_count || 0 },
              { key: 'goal', label: translations?.goals || 'Goals', count: collaborations.filter(c => c.resourceType === 'goal').length },
              { key: 'quest', label: translations?.quests || 'Quests', count: collaborations.filter(c => c.resourceType === 'quest').length },
              { key: 'task', label: translations?.tasks || 'Tasks', count: collaborations.filter(c => c.resourceType === 'task').length },
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={filterType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(key as any)}
                className="flex items-center gap-2"
              >
                {label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Collaborations List */}
        {collaborations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Users className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{translations?.noCollaborationsTitle || 'No Collaborations Found'}</h3>
              <p className="text-gray-600 mb-4">
                {filterType === 'all' 
                  ? (translations?.noCollaborationsAll || "You're not collaborating on any quests or goals yet.")
                  : (translations?.noCollaborationsType || "You're not collaborating on any {type}s yet.").replace('{type}', getResourceTypeLabel(filterType))
                }
              </p>
              <p className="text-sm text-gray-500">
                {translations?.inviteHint || 'Ask someone to invite you to collaborate on their quest or goal!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {collaborations.map((collaboration) => (
              <Card key={`${collaboration.resourceType}-${collaboration.resourceId}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          {getResourceTypeIcon(collaboration.resourceType)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {collaboration.resourceTitle}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {getResourceTypeLabel(collaboration.resourceType)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {translations?.joined || 'Joined'} {formatJoinedDate(collaboration.joinedAt)}
                          </div>
                          <Badge variant={getRoleBadgeVariant(collaboration.role)} className="text-xs">
                            {collaboration.role === 'owner' ? (translations?.owner || 'Owner') : (translations?.collaborator || 'Collaborator')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Link to={getResourceLink(collaboration)}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          {translations?.view || 'View'}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {collaborations.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            {translations?.showing || 'Showing'} {collaborations.length} {translations?.of || 'of'} {collaborationsData?.total_count || 0} {translations?.collaborationsCount || 'collaborations'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCollaborations;
