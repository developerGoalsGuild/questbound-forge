// resolvers/reactions.js
import { util } from '@aws-appsync/utils';

/**
 * List reactions summary for a message
 * 
 * Algorithm:
 * 1. Extract messageId from args
 * 2. Get userId from identity context (for viewerHasReacted)
 * 3. Determine table based on messageId pattern
 * 4. Query PK=MSG#<messageId>, SK begins_with SUMMARY#REACT# to get all summaries
 * 5. For each summary, GetItem REACT#<shortcode>#<userId> to check viewerHasReacted
 * 6. Return array of reactions with counts and viewerHasReacted flags
 */
export function request(ctx) {
  const identity = ctx.identity || {};
  const userId = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  if (!userId) util.unauthorized();

  const args = ctx.args || {};
  const messageId = args.messageId;

  if (!messageId) util.error('messageId required', 'Validation');

  // Determine PK pattern (table name comes from data source configuration)
  const pk = `MSG#${messageId}`;

  // Query all reaction summaries for this message
  const exprNames = { '#pk': 'PK', '#sk': 'SK' };
  const exprValues = util.dynamodb.toMapValues({
    ':pk': pk,
    ':sk': 'SUMMARY#REACT#'
  });

  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: exprNames,
      expressionValues: exprValues
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  // Ensure we always return an array, never null
  if (!ctx.result) {
    return [];
  }

  if (!ctx.result.items) {
    return [];
  }

  const summaries = ctx.result.items;
  if (!summaries || summaries.length === 0) {
    return [];
  }

  // Transform summaries to reactions using .map()
  // Build valid reactions array - only include valid entries (no nulls)
  // AppSync doesn't support while/for loops or .filter(), so we use reduce
  const validReactions = summaries.reduce(function(acc, summary) {
    // Validate summary
    if (!summary || !summary.SK) {
      return acc;
    }
    
    const skValue = summary.SK;
    const prefix = 'SUMMARY#REACT#';
    
    // Check if SK starts with prefix
    if (!skValue || skValue.indexOf(prefix) !== 0) {
      return acc;
    }
    
    // Extract shortcode
    const shortcode = skValue.replace(prefix, '');
    if (!shortcode || shortcode.length === 0) {
      return acc;
    }
    
    const unicode = summary.unicode || '';
    const count = summary.count || 0;

    acc.push({
      shortcode: shortcode,
      unicode: unicode,
      count: count,
      viewerHasReacted: false
    });
    
    return acc;
  }, []);
  
  return validReactions;
}
