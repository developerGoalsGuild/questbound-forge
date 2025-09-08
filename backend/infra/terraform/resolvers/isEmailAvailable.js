// resolvers/isEmailAvailable.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const raw = ctx.args && ctx.args.email ? ctx.args.email : '';
  const emailTrim = ('' + raw).trim();
  if (!emailTrim) util.error('email required', 'Validation');
  const atIdx = emailTrim.indexOf('@');
  const dotIdx = emailTrim.lastIndexOf('.');
  if (!(atIdx > 0 && dotIdx > atIdx + 1 && dotIdx < emailTrim.length - 1)) {
    util.error('invalid email', 'Validation');
  }
  const email = emailTrim.toLowerCase();

  const emailKey = 'EMAIL#' + email;
  return {
    operation: 'Query',
    index: 'GSI3',
    query: {
      expression: '#pk = :pk',
      expressionNames: { '#pk': 'GSI3PK' },
      expressionValues: util.dynamodb.toMapValues({ ':pk': emailKey }),
    },
    limit: 1,
    scanIndexForward: true,
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const items = (ctx.result && ctx.result.items) ? ctx.result.items : [];
  // Available if no user has this email indexed
  return items.length === 0;
}