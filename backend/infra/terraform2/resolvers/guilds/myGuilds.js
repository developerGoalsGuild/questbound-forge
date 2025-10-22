/**
 * GraphQL Resolver for myGuilds query
 * Returns the current user's guilds with pagination
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('myGuilds resolver event:', JSON.stringify(event, null, 2));
  
  try {
    const { identity, arguments } = event;
    const { limit = 20, nextToken } = arguments;
    
    // Get user ID from the identity context
    const userId = identity?.claims?.sub || identity?.username;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Query user's guilds using GSI2
    const queryParams = {
      TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :userId',
      ExpressionAttributeValues: {
        ':userId': `USER#${userId}`
      },
      Limit: limit,
      ScanIndexForward: false // Most recent first
    };
    
    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }
    
    const result = await docClient.send(new QueryCommand(queryParams));
    
    // Transform items to GraphQL format
    const guilds = result.Items?.map(item => ({
      id: item.guild_id,
      name: item.name,
      description: item.description,
      createdBy: item.created_by,
      createdAt: Math.floor(new Date(item.created_at).getTime() / 1000),
      updatedAt: item.updated_at ? Math.floor(new Date(item.updated_at).getTime() / 1000) : null,
      memberCount: item.member_count || 0,
      goalCount: item.goal_count || 0,
      questCount: item.quest_count || 0,
      guildType: item.guild_type?.toUpperCase() || 'PUBLIC',
      tags: item.tags || [],
      position: item.position,
      previousPosition: item.previous_position,
      totalScore: item.total_score,
      activityScore: item.activity_score,
      growthRate: item.growth_rate,
      badges: item.badges || [],
      avatarUrl: item.avatar_url,
      moderators: item.moderators || [],
      pendingRequests: item.pending_requests || 0,
      settings: item.settings ? {
        allowJoinRequests: item.settings.allow_join_requests || false,
        requireApproval: item.settings.require_approval || false,
        allowComments: item.settings.allow_comments || true
      } : null,
      userPermissions: {
        isMember: true, // User is a member since they're querying their guilds
        isOwner: item.role === 'owner',
        isModerator: item.role === 'moderator',
        canJoin: false, // Already a member
        canRequestJoin: false, // Already a member
        hasPendingRequest: false,
        canLeave: item.role !== 'owner',
        canManage: item.role === 'owner' || item.role === 'moderator'
      }
    })) || [];
    
    // Generate next token if there are more results
    let nextTokenOut = null;
    if (result.LastEvaluatedKey) {
      nextTokenOut = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }
    
    return {
      items: guilds,
      nextToken: nextTokenOut,
      totalCount: guilds.length
    };
    
  } catch (error) {
    console.error('Error in myGuilds resolver:', error);
    throw new Error(`Failed to fetch user guilds: ${error.message}`);
  }
};


