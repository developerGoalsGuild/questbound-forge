// resolvers/createUser.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { input } = ctx.args;
  
  // Generate a unique user ID
  const userId = util.autoId();
  
  // Validate required fields
  if (!input.email) util.error('Email is required', 'ValidationError');
  if (!input.fullName) util.error('Full name is required', 'ValidationError');
  if (!input.country) util.error('Country is required', 'ValidationError');
  
  // Set defaults
  const now = util.time.nowEpochMilliSeconds();
  const status = input.status || 'active';
  const language = input.language || 'en';
  const tier = 'free';
  
  // Create the user profile item
  const profileItem = {
    PK: `USER#${userId}`,
    SK: `PROFILE#${userId}`,
    id: userId,
    email: input.email,
    fullName: input.fullName,
    nickname: input.nickname || null,
    birthDate: input.birthDate || null,
    status: status,
    country: input.country,
    language: language,
    gender: input.gender || null,
    pronouns: input.pronouns || null,
    bio: input.bio || null,
    tags: input.tags || [],
    tier: tier,
    createdAt: now,
    updatedAt: now,
    ageYears: input.birthDate ? calculateAge(input.birthDate) : null,
  };
  
  // Create the email uniqueness check item
  const emailItem = {
    PK: `EMAIL#${input.email}`,
    SK: `UNIQUE#USER`,
    userId: userId,
    createdAt: now,
  };
  
  return {
    operation: 'TransactWrite',
    transactItems: [
      {
        table: ctx.source,
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ PK: `USER#${userId}`, SK: `PROFILE#${userId}` }),
        attributeValues: util.dynamodb.toMapValues(profileItem),
        condition: {
          expression: 'attribute_not_exists(PK)',
        },
      },
      {
        table: ctx.source,
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ PK: `EMAIL#${input.email}`, SK: `UNIQUE#USER` }),
        attributeValues: util.dynamodb.toMapValues(emailItem),
        condition: {
          expression: 'attribute_not_exists(PK)',
        },
      },
    ],
  };
}

export function response(ctx) {
  if (ctx.error) {
    if (ctx.error.message.includes('ConditionalCheckFailed')) {
      util.error('Email already exists', 'ConflictError');
    }
    util.error(ctx.error.message, ctx.error.type);
  }
  
  // Return the created user profile
  const profileItem = ctx.result.transactItems[0].attributeValues;
  
  return {
    id: profileItem.id,
    email: profileItem.email,
    fullName: profileItem.fullName,
    nickname: profileItem.nickname,
    birthDate: profileItem.birthDate,
    status: profileItem.status,
    country: profileItem.country,
    language: profileItem.language,
    gender: profileItem.gender,
    pronouns: profileItem.pronouns,
    bio: profileItem.bio,
    tags: profileItem.tags || [],
    tier: profileItem.tier,
    createdAt: profileItem.createdAt,
    updatedAt: profileItem.updatedAt,
    ageYears: profileItem.ageYears,
  };
}

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
