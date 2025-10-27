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

  // Determine table and key pattern based on roomId
  let tableName, pk;
  if (roomId.startsWith('GUILD#')) {
    tableName = 'gg_guild';
    pk = roomId; // Guild rooms use gg_guild table
  } else {
    tableName = 'gg_core';
    // For general rooms, use roomId as-is (don't add ROOM# prefix)
    // The messaging service stores with room_id as-is
    pk = roomId;
  }

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

  // Note: AppSync JS runtime uses top-level 'nextToken' handling automatically;
  // for 'after' we keep it simple with a filter; if you need key condition, restructure SK to include ts
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
  
  // Transform DynamoDB items to Message format
  const messages = items.map(item => ({
    id: item.id,
    roomId: item.roomId,
    senderId: item.senderId,
    text: item.text,
    ts: item.ts
  }));

  return messages;
}
