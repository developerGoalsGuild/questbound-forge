// resolvers/sendMessage.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const identity = ctx.identity || {};
  const senderId = identity.sub;
  if (!senderId) util.unauthorized();

  const args = ctx.args || {};
  const roomId = args.roomId;
  const text = args.text;
  if (!roomId) util.error('roomId required', 'Validation');
  if (!text) util.error('text required', 'Validation');

  const ts = util.time.nowEpochMilliSeconds();
  const id = util.autoId();

  const item = {
    PK: 'ROOM#' + roomId,
    SK: 'MSG#' + ts + '#' + id,
    type: 'Message',
    id: id,
    roomId: roomId,
    senderId: senderId,
    text: text,
    ts: ts
  };

  return put({ item: item });
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const a = (ctx.result && ctx.result.attributes) ? ctx.result.attributes : ctx.result;
  return {
    id: a.id,
    roomId: a.roomId,
    senderId: a.senderId,
    text: a.text,
    ts: a.ts
  };
}
