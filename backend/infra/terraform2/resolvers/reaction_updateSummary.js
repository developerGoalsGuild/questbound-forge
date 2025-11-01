import { util } from '@aws-appsync/utils';

function getInput(ctx) {
  const prev = ctx.prev || {};
  const base = prev && typeof prev === 'object'
    ? (prev.result !== undefined ? prev.result : prev)
    : {};
  const args = ctx.args || {};
  const delta = typeof base.delta === 'number' ? base.delta : 0;
  return {
    messageId: base.messageId || args.messageId,
    shortcode: base.shortcode || args.shortcode,
    unicode: base.unicode || args.unicode,
    delta,
    added: base.added === true,
  };
}

export function request(ctx) {
  const input = getInput(ctx);
  const { messageId, shortcode, unicode, delta } = input;

  if (!messageId || !shortcode) {
    util.error('Invalid reaction summary input', 'Validation');
  }

  const pk = `MSG#${messageId}`;
  const summaryKey = {
    PK: pk,
    SK: `SUMMARY#REACT#${shortcode}`
  };

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues(summaryKey),
    update: {
      expression: 'ADD #count :delta SET #updatedAt = :now, #unicode = if_not_exists(#unicode, :unicode)',
      expressionNames: {
        '#count': 'count',
        '#updatedAt': 'updatedAt',
        '#unicode': 'unicode'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':delta': delta,
        ':now': util.time.nowEpochMilliSeconds(),
        ':unicode': unicode || ''
      })
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  return getInput(ctx);
}
