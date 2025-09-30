import { authFetch, isNicknameAvailableForUser, updateUserProfile, type UserProfile, type ProfileUpdateInput, graphqlRaw } from '@/lib/api';
import { MY_PROFILE } from '@/graphql/queries';
import { type Language } from '@/i18n/translations';
import { getCountries as i18nGetCountries } from '@/i18n/countries';

export { type UserProfile, type ProfileUpdateInput };

export async function getProfile(): Promise<UserProfile> {
  try {
    const data = await graphqlRaw<{ myProfile: UserProfile }>(MY_PROFILE);
    return data?.myProfile as UserProfile;
  } catch (e: any) {
    console.error('[getProfile] Complete error object:', e);
    console.error('[getProfile] Error errors:', e?.errors);
    console.error('[getProfile] Error message:', e?.message);
    console.error('[getProfile] Error response:', e?.response);
    
    // Handle specific GraphQL errors
    if (e?.errors && Array.isArray(e.errors)) {
      const error = e.errors[0];
      console.error('[getProfile] First GraphQL error:', error);
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


