// resolvers/messages.js
import { util } from '@aws-appsync/utils';
import { query } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const identity = ctx.identity || {};
  const userId = identity.sub;
  if (!userId) util.unauthorized();

  const args = ctx.args || {};
  const roomId = args.roomId;
  const after = args.after;
  const limit = Math.min(args.limit || 50, 100); // Cap at 100 messages

  if (!roomId) util.error('roomId required', 'Validation');

  // Determine table and key pattern based on roomId
  let tableName, pk;
  
  if (roomId.startsWith('GUILD#')) {
    // Guild chat - use gg_guild table
    tableName = 'gg_guild';
    pk = roomId; // roomId is already in GUILD# format
  } else {
    // General room - use gg_core table
    tableName = 'gg_core';
    pk = 'ROOM#' + roomId;
  }

  // Build query parameters
  const queryParams = {
    table: tableName,
    key: {
      PK: pk,
      SK: { begins_with: 'MSG#' }
    },
    limit: limit,
    scanIndexForward: false // Sort by timestamp descending (newest first)
  };

  // Add filter for 'after' timestamp if provided
  if (after) {
    queryParams.filter = {
      expression: 'ts > :after',
      expressionValues: {
        ':after': after
      }
    };
  }

  return query(queryParams);
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
