import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTranslation } from '@/hooks/useTranslation';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import { BadgeDisplay } from '@/components/gamification/BadgeDisplay';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Heart,
  Users,
  Award,
  Edit3,
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';

const ProfileView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, loading, error, refetch } = useUserProfile();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'partner':
        return <Users className="h-4 w-4" />;
      case 'patron':
        return <Award className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'partner':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'patron':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string, emailConfirmed: boolean) => {
    if (status === 'ACTIVE' && emailConfirmed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (status: string, emailConfirmed: boolean) => {
    if (status === 'ACTIVE' && emailConfirmed) {
      return 'Verified';
    }
    if (!emailConfirmed) {
      return 'Email Not Verified';
    }
    return status;
  };

  if (loading) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>

            {/* Profile cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-4xl">
          <Alert className="mb-6">
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={refetch}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="spacing-medieval py-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertDescription>
              Profile not found. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="spacing-medieval py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {profile.fullName || profile.nickname || 'Adventurer'}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {getRoleIcon(profile.role)}
                <Badge className={getRoleColor(profile.role)}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(profile.status, profile.email_confirmed)}
                <span className="text-sm">
                  {getStatusText(profile.status, profile.email_confirmed)}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate('/profile/edit')}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              {profile.nickname && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nickname</p>
                    <p className="text-sm text-muted-foreground">@{profile.nickname}</p>
                  </div>
                </div>
              )}

              {profile.birthDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Birth Date</p>
                    <p className="text-sm text-muted-foreground">{profile.birthDate}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">{profile.language.toUpperCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.country && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Country</p>
                    <p className="text-sm text-muted-foreground">{profile.country}</p>
                  </div>
                </div>
              )}

              {profile.gender && (
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-muted-foreground">{profile.gender}</p>
                  </div>
                </div>
              )}

              {profile.pronouns && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Pronouns</p>
                    <p className="text-sm text-muted-foreground">{profile.pronouns}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Provider</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile.provider}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About & Bio */}
          {(profile.bio || profile.tags.length > 0) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && (
                  <div>
                    <p className="text-sm font-medium mb-2">Bio</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {profile.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* XP & Gamification */}
          <XPDisplay className="md:col-span-2" />
          <BadgeDisplay className="md:col-span-2" />

          {/* Account Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{profile.tier.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">Tier</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatDate(profile.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatDate(profile.updatedAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
