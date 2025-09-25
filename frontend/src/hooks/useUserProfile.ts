import { useState, useEffect, useCallback } from 'react';
import { UserProfile, ProfileUpdateInput, getUserProfile, updateUserProfile } from '@/lib/api';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateProfile: (updates: ProfileUpdateInput) => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: ProfileUpdateInput) => {
    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await updateUserProfile(updates);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      console.error('Profile update error:', err);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
  };
};
