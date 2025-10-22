/**
 * GraphQL Resolver for joinGuild mutation
 * Allows users to join a guild (public guilds) or request to join (approval guilds)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetItemCommand, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('joinGuild resolver event:', JSON.stringify(event, null, 2));
  
  try {
    const { identity, arguments } = event;
    const { guildId } = arguments;
    
    // Get user ID from the identity context
    const userId = identity?.claims?.sub || identity?.username;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const username = identity?.claims?.preferred_username || identity?.username || 'Unknown';
    
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
      throw new Error('Guild not found');
    }
    
    const guild = guildResult.Item;
    
    // Check if user is already a member
    const memberParams = {
      TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
      Key: {
        PK: `GUILD#${guildId}`,
        SK: `MEMBER#${userId}`
      }
    };
    
    const memberResult = await docClient.send(new GetItemCommand(memberParams));
    
    if (memberResult.Item) {
      throw new Error('User is already a member of this guild');
    }
    
    // Check guild type and handle accordingly
    if (guild.guild_type === 'private') {
      throw new Error('Cannot join private guilds directly');
    }
    
    if (guild.guild_type === 'approval') {
      // Create join request instead of direct membership
      const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const joinRequestItem = {
        PK: `GUILD#${guildId}`,
        SK: `REQUEST#${userId}`,
        request_id: requestId,
        guild_id: guildId,
        user_id: userId,
        username: username,
        requested_at: now,
        status: 'pending',
        TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
      };
      
      await docClient.send(new PutItemCommand({
        TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
        Item: joinRequestItem
      }));
      
      // Update pending requests count
      await docClient.send(new UpdateItemCommand({
        TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
        Key: {
          PK: `GUILD#${guildId}`,
          SK: 'METADATA'
        },
        UpdateExpression: 'ADD pending_requests :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        }
      }));
      
      throw new Error('Join request submitted. Waiting for approval.');
    }
    
    // For public guilds, add user directly
    if (guild.guild_type === 'public') {
      const now = new Date().toISOString();
      
      // Create member item
      const memberItem = {
        PK: `GUILD#${guildId}`,
        SK: `MEMBER#${userId}`,
        GSI3PK: `USER#${userId}`,
        GSI3SK: `GUILD#${guildId}`,
        guild_id: guildId,
        user_id: userId,
        username: username,
        nickname: username,
        role: 'member',
        joined_at: now,
        is_blocked: false,
        can_comment: true,
        TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
      };
      
      // Add member
      await docClient.send(new PutItemCommand({
        TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
        Item: memberItem
      }));
      
      // Update member count
      await docClient.send(new UpdateItemCommand({
        TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
        Key: {
          PK: `GUILD#${guildId}`,
          SK: 'METADATA'
        },
        UpdateExpression: 'ADD member_count :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        }
      }));
      
      // Return updated guild
      return {
        id: guildId,
        name: guild.name,
        description: guild.description,
        createdBy: guild.created_by,
        createdAt: Math.floor(new Date(guild.created_at).getTime() / 1000),
        updatedAt: Math.floor(new Date(now).getTime() / 1000),
        memberCount: (guild.member_count || 0) + 1,
        goalCount: guild.goal_count || 0,
        questCount: guild.quest_count || 0,
        guildType: guild.guild_type.toUpperCase(),
        tags: guild.tags || [],
        moderators: guild.moderators || [],
        pendingRequests: guild.pending_requests || 0,
        settings: guild.settings ? {
          allowJoinRequests: guild.settings.allow_join_requests || false,
          requireApproval: guild.settings.require_approval || false,
          allowComments: guild.settings.allow_comments !== false
        } : null,
        userPermissions: {
          isMember: true,
          isOwner: false,
          isModerator: false,
          canJoin: false,
          canRequestJoin: false,
          hasPendingRequest: false,
          canLeave: true,
          canManage: false
        }
      };
    }
    
    throw new Error('Invalid guild type');
    
  } catch (error) {
    console.error('Error in joinGuild resolver:', error);
    throw new Error(`Failed to join guild: ${error.message}`);
  }
};


