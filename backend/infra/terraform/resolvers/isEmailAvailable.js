// resolvers/isEmailAvailable.js
import { util } from '@aws-appsync/utils';
import { query } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const email = (ctx.args?.email || '').trim().toLowerCase();
  if (!email) util.error('email required', 'Validation');
  const emailRe = /^(?:[^\s@]+)@(?:[^\s@]+)\.(?:[^\s@]+)$/;
  if (!emailRe.test(email)) util.error('invalid email', 'Validation');

  const emailKey = 'EMAIL#' + email;
  return query({
    query: {
      expression: 'GSI2PK = :pk',
      expressionValues: {
        ':pk': emailKey,
      },
    },
    index: 'GSI2',
    limit: 1,
    consistentRead: false,
  });
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const items = ctx.result?.items ?? [];
  // Available if no user has this email indexed
  return items.length === 0;
}

