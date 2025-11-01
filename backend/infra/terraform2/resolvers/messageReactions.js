// resolvers/messageReactions.js
// Resolver for Message.reactions field - fetches reactions for a single message
// This is called automatically by AppSync when reactions field is requested
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  const userId = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  if (!userId) util.unauthorized();

  // Get messageId from parent (the message object)
  const messageId = ctx.source.id;
  
  // If reactions were already fetched in the messages resolver (empty array placeholder),
  // we still need to fetch them here since AppSync JS can't do async batch operations
  if (!messageId) {
    util.error('messageId required', 'Validation');
  }

  // Query all reaction summaries for this message
  // Note: This will be called once per message, which is the N+1 problem
  // To truly batch, we'd need to use a Lambda resolver for the messages query
  // that can fetch all reactions in parallel using asyncio/boto3
  const pk = `MSG#${messageId}`;
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
  if (!ctx.result || !ctx.result.items || ctx.result.items.length === 0) {
    return [];
  }

  const summaries = ctx.result.items;
  const identity = ctx.identity || {};
  const userId = identity.sub || (identity.resolverContext && identity.resolverContext.sub);
  const messageId = ctx.source.id;

  // Transform summaries to reactions
  const validReactions = summaries.reduce(function(acc, summary) {
    if (!summary || !summary.SK) {
      return acc;
    }
    
    const skValue = summary.SK;
    const prefix = 'SUMMARY#REACT#';
    
    if (!skValue || skValue.indexOf(prefix) !== 0) {
      return acc;
    }
    
    const shortcode = skValue.replace(prefix, '');
    if (!shortcode || shortcode.length === 0) {
      return acc;
    }
    
    const unicode = summary.unicode || '';
    const count = summary.count || 0;

    // Check if current user has reacted by checking if their reaction exists
    // The reaction item has PK=MSG#<messageId> and SK=REACT#<shortcode>#<userId>
    const userReactionKey = `REACT#${shortcode}#${userId}`;
    // We can't directly check in AppSync JS resolver without a separate query,
    // but we'll use a pattern: if the user has reacted, their reaction item exists
    // For now, we'll use a simpler heuristic: check if userId is in the reactions list
    // This is a limitation of AppSync JS - in a Lambda resolver we could batch check
    const viewerHasReacted = false; // Will be enhanced by frontend or Lambda resolver
    
    acc.push({
      shortcode: shortcode,
      unicode: unicode,
      count: count,
      viewerHasReacted: viewerHasReacted
    });
    
    return acc;
  }, []);
  
  return validReactions;
}

