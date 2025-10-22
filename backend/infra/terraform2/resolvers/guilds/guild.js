/**
 * GraphQL Resolver for guild query
 * Returns detailed guild information with optional expanded data
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetItemCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('guild resolver event:', JSON.stringify(event, null, 2));
  
  try {
    const { identity, arguments } = event;
    const { guildId, includeMembers = false, includeGoals = false, includeQuests = false } = arguments;
    
    // Get user ID from the identity context
    const userId = identity?.claims?.sub || identity?.username;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    if (!guildId) {
      throw new Error('Guild ID is required');
    }
    
    // Get guild metadata
    const guildParams = {
      TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
      Key: {
        PK: `GUILD#${guildId}`,
        SK: 'METADATA'
      }
    };
    
    const guildResult = await docClient.send(new GetItemCommand(guildParams));
    
    if (!guildResult.Item) {
      return null; // Guild not found
    }
    
    const guild = guildResult.Item;
    
    // Check if user has access to this guild
    const memberParams = {
      TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
      Key: {
        PK: `GUILD#${guildId}`,
        SK: `MEMBER#${userId}`
      }
    };
    
    const memberResult = await docClient.send(new GetItemCommand(memberParams));
    const isMember = !!memberResult.Item;
    const isPublic = guild.guild_type === 'public';
    
    if (!isMember && !isPublic) {
      throw new Error('Access denied: Guild is private and user is not a member');
    }
    
    // Build base guild response
    const guildResponse = {
      id: guild.guild_id,
      name: guild.name,
      description: guild.description,
      createdBy: guild.created_by,
      createdAt: Math.floor(new Date(guild.created_at).getTime() / 1000),
      updatedAt: guild.updated_at ? Math.floor(new Date(guild.updated_at).getTime() / 1000) : null,
      memberCount: guild.member_count || 0,
      goalCount: guild.goal_count || 0,
      questCount: guild.quest_count || 0,
      guildType: guild.guild_type?.toUpperCase() || 'PUBLIC',
      tags: guild.tags || [],
      position: guild.position,
      previousPosition: guild.previous_position,
      totalScore: guild.total_score,
      activityScore: guild.activity_score,
      growthRate: guild.growth_rate,
      badges: guild.badges || [],
      avatarUrl: guild.avatar_url,
      moderators: guild.moderators || [],
      pendingRequests: guild.pending_requests || 0,
      settings: guild.settings ? {
        allowJoinRequests: guild.settings.allow_join_requests || false,
        requireApproval: guild.settings.require_approval || false,
        allowComments: guild.settings.allow_comments || true
      } : null,
      userPermissions: {
        isMember,
        isOwner: memberResult.Item?.role === 'owner',
        isModerator: memberResult.Item?.role === 'moderator',
        canJoin: !isMember && (isPublic || guild.guild_type === 'approval'),
        canRequestJoin: !isMember && guild.guild_type === 'approval',
        hasPendingRequest: false, // Would need to check join requests table
        canLeave: isMember && memberResult.Item?.role !== 'owner',
        canManage: memberResult.Item?.role === 'owner' || memberResult.Item?.role === 'moderator'
      }
    };
    
    // Add members if requested
    if (includeMembers && isMember) {
      const membersParams = {
        TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `GUILD#${guildId}`,
          ':sk': 'MEMBER#'
        },
        ProjectionExpression: 'user_id, username, nickname, email, avatar_url, #r, joined_at, last_seen_at, invited_by, is_blocked, blocked_at, blocked_by, can_comment',
        ExpressionAttributeNames: {
          '#r': 'role'
        }
      };
      
      const membersResult = await docClient.send(new QueryCommand(membersParams));
      
      guildResponse.members = membersResult.Items?.map(member => ({
        userId: member.user_id,
        username: member.username,
        email: member.email,
        avatarUrl: member.avatar_url,
        role: member.role?.toUpperCase() || 'MEMBER',
        joinedAt: Math.floor(new Date(member.joined_at).getTime() / 1000),
        lastSeenAt: member.last_seen_at ? Math.floor(new Date(member.last_seen_at).getTime() / 1000) : null,
        invitedBy: member.invited_by,
        isBlocked: member.is_blocked || false,
        blockedAt: member.blocked_at ? Math.floor(new Date(member.blocked_at).getTime() / 1000) : null,
        blockedBy: member.blocked_by,
        canComment: member.can_comment !== false
      })) || [];
    }
    
    // Add goals if requested (would need to query goals table)
    if (includeGoals && isMember) {
      // This would require querying the goals table for guild-associated goals
      guildResponse.goals = []; // Placeholder - would need actual implementation
    }
    
    // Add quests if requested (would need to query quests table)
    if (includeQuests && isMember) {
      // This would require querying the quests table for guild-associated quests
      guildResponse.quests = []; // Placeholder - would need actual implementation
    }
    
    return guildResponse;
    
  } catch (error) {
    console.error('Error in guild resolver:', error);
    throw new Error(`Failed to fetch guild: ${error.message}`);
  }
};


