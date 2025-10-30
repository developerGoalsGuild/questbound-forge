// resolvers/onMessage.subscribe.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const auth = ctx.prev?.result || {};
  const identity = ctx.identity || {};
  const sub =
    auth.sub ||
    identity.sub ||
    (identity.resolverContext && identity.resolverContext.sub);
  if (!sub) util.unauthorized();

  const requestedRoomId = ctx.args?.roomId ?? null;
  if (auth.roomId && requestedRoomId && auth.roomId !== requestedRoomId) {
    util.unauthorized();
  }

  return { payload: requestedRoomId };
}

export function response(ctx) {
  // Subscriptions should not emit a synchronous payload during handshake.
  // Returning null prevents AppSync from trying to coerce the roomId string
  // into the Message type defined in the schema.
  return null;
}
