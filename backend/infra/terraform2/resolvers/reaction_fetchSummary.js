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
  };
}

export function request(ctx) {
  const input = getInput(ctx);
  const { messageId, shortcode } = input;

  if (!messageId || !shortcode) {
    util.error('Invalid reaction fetch input', 'Validation');
  }

  const pk = `MSG#${messageId}`;
  const summaryKey = {
    PK: pk,
    SK: `SUMMARY#REACT#${shortcode}`
  };

  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues(summaryKey),
    consistentRead: false
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const input = getInput(ctx);
  const item = ctx.result && (ctx.result.item || ctx.result) || {};

  let countValue = 0;
  if (item.count !== undefined) {
    if (typeof item.count === 'number') {
      countValue = item.count;
    } else if (item.count && typeof item.count.value === 'number') {
      countValue = item.count.value;
    } else if (item.count && typeof item.count.N === 'string') {
      const numeric = item.count.N - 0;
      if (numeric === numeric) {
        countValue = numeric;
      }
    }
  }

  const unicodeValue = typeof item.unicode === 'string' && item.unicode
    ? item.unicode
    : (input.unicode || '');

  const shortcodeValue = input.shortcode || '';
  if (!shortcodeValue) {
    util.error('shortcode missing in fetch response', 'Validation');
  }

  return {
    messageId: input.messageId,
    shortcode: shortcodeValue,
    unicode: unicodeValue,
    count: countValue,
    added: input.delta > 0,
    removed: input.delta < 0,
  };
}
