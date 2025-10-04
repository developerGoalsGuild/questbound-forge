import { util } from '@aws-appsync/utils';

/**
 * Query resolver for me
 * Returns the current user's profile
 */
export function request(ctx) {
  const userId = ctx.identity.sub;
  
  if (!userId) {
    util.error('Unauthorized', 'UNAUTHORIZED');
  }

  return {
    operation: 'GetItem',
    key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  if (!ctx.result) {
    util.error('User profile not found', 'NOT_FOUND');
  }

  const item = ctx.result;
  
  // Transform DynamoDB item to GraphQL User type
  return {
    id: item.PK.replace('USER#', ''),
    email: item.email,
    role: item.role,
    fullName: item.fullName,
    nickname: item.nickname,
    birthDate: item.birthDate,
    status: item.status,
    country: item.country,
    language: item.language,
    gender: item.gender,
    pronouns: item.pronouns,
    bio: item.bio,
    tags: item.tags || [],
    tier: item.tier,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ageYears: item.ageYears
  };
}
