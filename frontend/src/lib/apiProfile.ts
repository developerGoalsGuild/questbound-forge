import { authFetch, isNicknameAvailableForUser, updateUserProfile, type UserProfile, type ProfileUpdateInput, graphqlRaw } from '@/lib/api';
import { MY_PROFILE, GET_USER } from '@/graphql/queries';
import { type Language } from '@/i18n/translations';
import { getCountries as i18nGetCountries } from '@/i18n/countries';
import { logger } from './logger';

export { type UserProfile, type ProfileUpdateInput };

export async function getProfile(): Promise<UserProfile> {
  const operation = 'getProfile';
  try {
    const data = await graphqlRaw<{ myProfile: UserProfile }>(MY_PROFILE);
    const profile = data?.myProfile as UserProfile;
    
    // Add default notification preferences since GraphQL schema doesn't have the field yet
    if (profile) {
      profile.notificationPreferences = {
        questStarted: true,
        questCompleted: true,
        questFailed: true,
        progressMilestones: true,
        deadlineWarnings: true,
        streakAchievements: true,
        challengeUpdates: true,
        channels: {
          inApp: true,
          email: false,
          push: false
        }
      };
    }
    
    return profile;
  } catch (e: any) {
    const errorContext = {
      operation,
      error: e,
      errors: e?.errors,
      errorMessage: e?.message,
      response: e?.response,
    };
    logger.error('Failed to fetch profile', errorContext);
    
    // Handle specific GraphQL errors
    if (e?.errors && Array.isArray(e.errors)) {
      const error = e.errors[0];
      if (error?.errorType === 'NotFound' && error?.message === 'Profile not found') {
        throw new Error('PROFILE_NOT_FOUND');
      }
      throw new Error(error?.message || 'GraphQL error');
    }
    
    throw new Error(e?.message || 'Failed to fetch profile');
  }
}

export async function updateProfile(updates: ProfileUpdateInput): Promise<UserProfile> {
  return updateUserProfile(updates);
}

export async function checkNicknameAvailability(nickname: string, currentNickname?: string): Promise<boolean> {
  // Skip validation if nickname is empty or whitespace-only
  if (!nickname || !nickname.trim()) {
    return false;
  }

  // Skip validation if nickname is the same as current user's nickname
  if (currentNickname && nickname === currentNickname) {
    return true;
  }

  // Use the authorized resolver that excludes current user from the check
  return isNicknameAvailableForUser(nickname);
}

export function getCountries(language: Language) {
  return i18nGetCountries(language);
}

export async function validateProfileField(field: string, value: unknown, currentProfile?: UserProfile): Promise<boolean> {
  if (field === 'nickname' && typeof value === 'string' && value) {
    return checkNicknameAvailability(value, currentProfile?.nickname);
  }
  return true;
}

// Lightweight fetch for displaying other users' nicknames in chat
export async function getUserById(userId: string): Promise<{ id: string; nickname?: string; fullName?: string }> {
  const data = await graphqlRaw<{ user: { id: string; nickname?: string; fullName?: string } }>(GET_USER, { userId }, { quiet: true });
  return data.user;
}


