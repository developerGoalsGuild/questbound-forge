// resolvers/onMessage.subscribe.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  if (!identity.sub) util.unauthorized();

  // Payload is arbitrary. AppSync matches via @aws_subscribe on roomId.
  return { payload: ctx.args && ctx.args.roomId ? ctx.args.roomId : null };
}

export function response(ctx) {
  return ctx.result;
}
