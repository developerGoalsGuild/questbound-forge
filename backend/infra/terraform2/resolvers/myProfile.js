// resolvers/myProfile.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('[myProfile] Request context:', JSON.stringify(ctx, null, 2));
  console.log('[myProfile] Identity:', JSON.stringify(ctx.identity, null, 2));
  console.log('[myProfile] Args:', JSON.stringify(ctx.args, null, 2));
  
  // Match existing pattern: prefer lambda authorizer resolverContext.sub
  const sub = ctx.identity?.resolverContext?.sub || ctx.identity?.sub;
  console.log('[myProfile] Extracted sub:', sub);
  
  if (!sub) {
    console.log('[myProfile] No sub found, throwing unauthorized');
    util.unauthorized();
  }

  const key = { PK: `USER#${sub}`, SK: `PROFILE#${sub}` };
  console.log('[myProfile] DynamoDB key:', JSON.stringify(key, null, 2));

  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues(key),
    consistentRead: false,
  };
}

export function response(ctx) {
  console.log('[myProfile] Response context:', JSON.stringify(ctx, null, 2));
  console.log('[myProfile] Response result:', JSON.stringify(ctx.result, null, 2));
  
  if (ctx.error) {
    console.log('[myProfile] Error in response:', ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  const a = ctx.result?.item || ctx.result;
  console.log('[myProfile] DynamoDB item:', JSON.stringify(a, null, 2));
  
  if (!a) {
    console.log('[myProfile] No item found in DynamoDB result');
    util.error('Profile not found', 'NotFound');
  }

  // Map DynamoDB item to GraphQL User type
  const userProfile = {
    id: a.id,
    email: a.email,
    role: a.role || 'user', // Default to 'user' if not specified
    fullName: a.fullName,
    nickname: a.nickname,
    birthDate: a.birthDate || null,
    status: a.status,
    country: a.country,
    language: a.language || 'en',
    gender: a.gender,
    pronouns: a.pronouns,
    bio: a.bio,
    tags: a.tags || [],
    tier: a.tier || 'free',
    notificationPreferences: a.notificationPreferences ? {
      questStarted: a.notificationPreferences.questStarted || true,
      questCompleted: a.notificationPreferences.questCompleted || true,
      questFailed: a.notificationPreferences.questFailed || true,
      progressMilestones: a.notificationPreferences.progressMilestones || true,
      deadlineWarnings: a.notificationPreferences.deadlineWarnings || true,
      streakAchievements: a.notificationPreferences.streakAchievements || true,
      challengeUpdates: a.notificationPreferences.challengeUpdates || true,
      channels: {
        inApp: a.notificationPreferences.channels?.inApp || true,
        email: a.notificationPreferences.channels?.email || false,
        push: a.notificationPreferences.channels?.push || false,
      }
    } : null,
    createdAt: null,
    updatedAt: null,
    ageYears: a.ageYears || null,
  };
  
  console.log('[myProfile] Returning user profile:', JSON.stringify(userProfile, null, 2));
  return userProfile;
}


