// resolvers/messages.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  const userId = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  if (!userId) util.unauthorized();

  const args = ctx.args || {};
  const roomId = args.roomId;
  const after = args.after;
  const limit = Math.min(args.limit || 50, 100); // Cap at 100 messages

  if (!roomId) util.error('roomId required', 'Validation');

  // Determine key pattern based on roomId. Data source targets gg_core by default.
  // For unsupported guild table on this data source, force a non-matching PK.
  const pk = roomId.startsWith('GUILD#') ? '__UNSUPPORTED__' : roomId;

  const exprNames = { '#pk': 'PK', '#sk': 'SK' };
  const exprValues = util.dynamodb.toMapValues({ ':pk': pk, ':sk': 'MSG#' });

  const req = {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: exprNames,
      expressionValues: exprValues,
    },
    scanIndexForward: false,
    limit,
  };

  if (after) {
    req.filter = {
      expression: 'ts > :after',
      expressionValues: util.dynamodb.toMapValues({ ':after': after }),
    };
  }

  return req;
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  
  const items = ctx.result?.items || [];
  const identity = ctx.identity || {};
  const userId = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  
  // Transform DynamoDB items to Message format
  const messages = items.map(item => {
    const message = {
    id: item.id,
    roomId: item.roomId,
    senderId: item.senderId,
    senderNickname: item.senderNickname,
    text: item.text,
    ts: item.ts
    };
    
    // Include replyToId if present
    if (item.replyToId) {
      message.replyToId = item.replyToId;
    }
    
    // Don't include reactions here - the field resolver will handle it
    // Including empty array causes AppSync to still call the field resolver
    // Leaving it out means reactions are only fetched if explicitly requested
    
    return message;
  });

  return messages;
}
