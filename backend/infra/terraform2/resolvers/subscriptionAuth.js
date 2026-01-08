import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const headers = ctx.request?.headers || {};
  return {
    operation: 'Invoke',
    payload: {
      mode: 'subscription',
      headers,
      arguments: ctx.arguments || {},
      roomId: ctx.arguments?.roomId || null,
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message || 'Unauthorized', ctx.error?.type || 'Unauthorized');
  }
  return ctx.result || {};
}
