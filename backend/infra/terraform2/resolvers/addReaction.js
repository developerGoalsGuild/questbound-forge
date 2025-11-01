// resolvers/addReaction.js
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
  const unicode = args.unicode;

  if (!messageId) {
    util.error('messageId required', 'Validation');
  }
  if (!shortcode) {
    util.error('shortcode required', 'Validation');
  }
  if (!unicode) {
    util.error('unicode required', 'Validation');
  }

  return {
    messageId,
    shortcode,
    unicode,
    userId,
    timestamp: util.time.nowEpochMilliSeconds()
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

