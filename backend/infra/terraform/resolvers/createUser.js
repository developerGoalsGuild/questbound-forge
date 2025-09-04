// resolvers/createUser.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';

/**
 * Mutation.createUser(input: { nickname!, language, pronouns, bio, tags, passwordHash! }): User
 */
export function request(ctx) {
  const args = ctx.args && ctx.args.input ? ctx.args.input : {};
  const nickname = args.nickname;
  if (!nickname) util.error('nickname required', 'Validation');

  const passwordHash = args.passwordHash;
  if (!passwordHash) util.error('passwordHash required', 'Validation');

  const identity = ctx.identity || {};
  const sub = identity.sub || util.autoId();

  const now =((new Date()).getTime());

  const item = {
    PK: 'USER#' + sub,
    SK: 'PROFILE#' + sub,
    type: 'User',
    id: sub,
    nickname: nickname,
    language: args.language || 'en',
    pronouns: args.pronouns || '',
    bio: args.bio || '',
    tags: Array.isArray(args.tags) ? args.tags : [],
    tier: 'free',
    passwordHash: passwordHash,
    passwordAlgo: 'bcrypt$12',
    passwordUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'USER#' + sub,
    GSI1SK: 'ENTITY#User#' + now
  };

  // PutItem via helper; providing the whole item is enough
  return put({ item: item });
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const a = (ctx.result && ctx.result.attributes) ? ctx.result.attributes : ctx.result;
  return {
    id: a.id,
    nickname: a.nickname,
    language: a.language,
    pronouns: a.pronouns,
    bio: a.bio,
    tags: a.tags || [],
    tier: a.tier || 'free',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  };
}
