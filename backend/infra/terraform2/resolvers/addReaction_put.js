import { util } from '@aws-appsync/utils';

function getInput(ctx) {
  const prev = ctx.prev || {};
  const base = prev && typeof prev === 'object'
    ? (prev.result !== undefined ? prev.result : prev)
    : {};
  const args = ctx.args || {};
  const identity = ctx.identity || {};
  const identitySub = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  return {
    messageId: base.messageId || args.messageId,
    shortcode: base.shortcode || args.shortcode,
    unicode: base.unicode || args.unicode,
    userId: base.userId || identitySub,
    timestamp: base.timestamp || util.time.nowEpochMilliSeconds(),
    delta: typeof base.delta === 'number' ? base.delta : 0,
  };
}

export function request(ctx) {
  const input = getInput(ctx);
  const { messageId, shortcode, unicode, userId, timestamp } = input;

  if (!messageId || !shortcode || !unicode || !userId) {
    util.error('Invalid reaction input', 'Validation');
  }

  const pk = `MSG#${messageId}`;
  const reactionKey = {
    PK: pk,
    SK: `REACT#${shortcode}#${userId}`
  };

  const reactionItem = {
    ...reactionKey,
    emojiUnicode: unicode,
    emojiShortcode: shortcode,
    userId,
    createdAt: timestamp,
    type: 'Reaction'
  };

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues(reactionKey),
    attributeValues: util.dynamodb.toMapValues(reactionItem),
    condition: {
      expression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
    }
  };
}

export function response(ctx) {
  const input = getInput(ctx);

  if (ctx.error) {
    const errorType = ctx.error.type || '';
    const errorMsg = ctx.error.message || '';
    const cancellation = ctx.error.cancellationReason || '';
    const isConditional =
      cancellation === 'ConditionalCheckFailed' ||
      errorType.indexOf('ConditionalCheckFailed') !== -1 ||
      errorMsg.indexOf('conditional request failed') !== -1;

    if (isConditional) {
      return {
        ...input,
        added: false,
        delta: 0,
      };
    }

    util.error(ctx.error.message, ctx.error.type);
  }

  return {
    ...input,
    added: true,
    delta: 1,
  };
}

