// resolvers/isNicknameAvailableForUser.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const raw = ctx.args && ctx.args.nickname ? ctx.args.nickname : '';
  const nicknameTrim = ('' + raw).trim();
  if (!nicknameTrim) util.error('nickname required', 'Validation');

  // Get current user ID from the context (Lambda authorizer provides this)
  const currentUserId = ctx.identity?.resolverContext?.sub || ctx.identity?.sub;
  
  if (!currentUserId) {
    util.error('User not authenticated', 'Unauthorized');
  }

  const nickKey = 'NICK#' + nicknameTrim;
  return {
    operation: 'Query',
    index: 'GSI2',
    query: {
      expression: '#pk = :pk',
      expressionNames: { '#pk': 'GSI2PK' },
      expressionValues: util.dynamodb.toMapValues({ ':pk': nickKey }),
    },
    filter: {
      expression: '#id <> :currentUserId',
      expressionNames: { '#id': 'id' },
      expressionValues: util.dynamodb.toMapValues({ ':currentUserId': currentUserId }),
    },
    limit: 1,
    scanIndexForward: true,
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  
  const items = (ctx.result && ctx.result.items) ? ctx.result.items : [];
  
  // Available if no items found (no other users have this nickname)
  // The filter excludes the current user, so if count = 0, nickname is available
  return items.length === 0;
}
