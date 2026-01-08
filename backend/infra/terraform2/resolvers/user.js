import { util } from '@aws-appsync/utils';
import { get } from '@aws-appsync/utils/dynamodb';

/**
 * Query resolver for user(userId: ID!)
 * Fetches a specific user by userId
 */
export function request(ctx) {
  const { userId } = ctx.args;
  
  if (!userId) {
    util.error('userId is required', 'VALIDATION_ERROR');
  }

  // Use helper to build proper DynamoDB request shape
  return get({
    key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    }
  });
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  if (!ctx.result) {
    return null;
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
