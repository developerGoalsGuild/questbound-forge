import { util } from '@aws-appsync/utils';

// Pipeline resolver: before/after
export function request(ctx) {
  // No-op: functions will run; return empty to proceed
  return {};
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  // Construct GraphQL user response from args/identity
  const args = ctx.args && ctx.args.input ? ctx.args.input : {};
  const email = (args.email || '').trim().toLowerCase();
  const identity = ctx.identity || {};
  const sub = identity.sub || util.autoId();
  return {
    id: sub,
    nickname: args.nickname || '',
    email,
    fullName: args.fullName || '',
    birthDate: (args.birthDate || null) || null,
    status: args.status || 'email confirmation pending',
    country: args.country || null,
    language: args.language || 'en',
    gender: args.gender || '',
    pronouns: args.pronouns || '',
    bio: args.bio || '',
    tags: Array.isArray(args.tags) ? args.tags : [],
    tier: 'free',
  };
}

