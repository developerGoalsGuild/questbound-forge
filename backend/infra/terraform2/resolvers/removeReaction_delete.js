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
    delta: typeof base.delta === 'number' ? base.delta : 0,
  };
}

export function request(ctx) {
  const input = getInput(ctx);
  const { messageId, shortcode, userId } = input;

  if (!messageId || !shortcode || !userId) {
    util.error('Invalid reaction delete input', 'Validation');
  }

  const pk = `MSG#${messageId}`;
  const reactionKey = {
    PK: pk,
    SK: `REACT#${shortcode}#${userId}`
  };

  return {
    operation: 'DeleteItem',
    key: util.dynamodb.toMapValues(reactionKey),
    condition: {
      expression: 'attribute_exists(PK) AND attribute_exists(SK)'
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
        delta: 0,
        added: false,
      };
    }

    util.error(ctx.error.message, ctx.error.type);
  }

  return {
    ...input,
    delta: -1,
    added: false,
  };
}
