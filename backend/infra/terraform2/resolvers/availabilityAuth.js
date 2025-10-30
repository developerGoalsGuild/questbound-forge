import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const headers = ctx.request?.headers || {};
  return {
    operation: 'Invoke',
    payload: {
      mode: 'availability',
      headers,
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message || 'Unauthorized', ctx.error?.type || 'Unauthorized');
  }
  return ctx.result || {};
}
