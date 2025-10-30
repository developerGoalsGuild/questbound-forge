// resolvers/sendMessage.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const identity = ctx.identity || {};
  const senderId = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  if (!senderId) util.unauthorized();

  const args = ctx.args || {};
  const roomId = args.roomId;
  const text = args.text;
  const senderNickname = args.senderNickname;
  if (!roomId) util.error('roomId required', 'Validation');
  if (!text) util.error('text required', 'Validation');

  const ts = util.time.nowEpochMilliSeconds();
  const id = util.autoId();

  // Determine table and key pattern based on roomId
  let tableName, pk, roomType;
  
  if (roomId.startsWith('GUILD#')) {
    // Guild chat - use gg_guild table
    tableName = 'gg_guild';
    pk = roomId; // roomId is already in GUILD# format
    roomType = 'guild';
  } else {
    // General room - use gg_core table
    tableName = 'gg_core';
    // Use roomId as-is to match messaging service storage pattern
    pk = roomId;
    roomType = 'general';
  }

  const item = {
    PK: pk,
    SK: 'MSG#' + ts + '#' + id,
    type: 'Message',
    id: id,
    roomId: roomId,
    senderId: senderId,
    senderNickname: senderNickname,
    text: text,
    ts: ts,
    roomType: roomType
  };

  ctx.stash.newMessage = {
    id,
    roomId,
    senderId,
    senderNickname,
    text,
    ts
  };

  return put({
    key: {
      PK: pk,
      SK: `MSG#${ts}#${id}`
    },
    item: item,
    tableName: tableName
  });
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const message = ctx.stash.newMessage;
  if (!message) {
    util.error('Failed to deliver message payload', 'InternalFailure');
  }
  return message;
}
