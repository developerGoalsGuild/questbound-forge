// resolvers/isNicknameAvailable.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const raw = ctx.args && ctx.args.nickname ? ctx.args.nickname : '';
  const nicknameTrim = ('' + raw).trim();
  if (!nicknameTrim) util.error('nickname required', 'Validation');

  const nickKey = 'NICK#' + nicknameTrim;
  return {
    operation: 'Query',
    index: 'GSI2',
    query: {
      expression: '#pk = :pk',
      expressionNames: { '#pk': 'GSI2PK' },
      expressionValues: util.dynamodb.toMapValues({ ':pk': nickKey }),
    },
    limit: 1,
    scanIndexForward: true,
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const items = (ctx.result && ctx.result.items) ? ctx.result.items : [];
  // Available if no user has this nickname indexed
  return items.length === 0;
}