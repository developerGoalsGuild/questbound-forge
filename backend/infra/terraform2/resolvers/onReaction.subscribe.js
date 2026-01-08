import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const auth = ctx.prev?.result || {};
  const identity = ctx.identity || {};
  const sub =
    auth.sub ||
    identity.sub ||
    (identity.resolverContext && identity.resolverContext.sub);
  if (!sub) util.unauthorized();

  const requestedMessageId = ctx.args?.messageId ?? null;
  if (!requestedMessageId) {
    util.error('messageId required', 'Validation');
  }

  if (auth.messageId && auth.messageId !== requestedMessageId) {
    util.unauthorized();
  }

  return { payload: requestedMessageId };
}

export function response(ctx) {
  return null;
}

