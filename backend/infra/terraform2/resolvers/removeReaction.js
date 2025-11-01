// resolvers/removeReaction.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  const userId = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  if (!userId) {
    util.unauthorized();
  }

  const args = ctx.args || {};
  const messageId = args.messageId;
  const shortcode = args.shortcode;

  if (!messageId) {
    util.error('messageId required', 'Validation');
  }
  if (!shortcode) {
    util.error('shortcode required', 'Validation');
  }

  return {
    messageId,
    shortcode,
    userId,
    delta: 0,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const prev = ctx.prev;
  if (prev && typeof prev === 'object' && prev.result !== undefined) {
    return prev.result;
  }

  return prev;
}
