/**
 * GraphQL Resolver for createGuild mutation
 * Creates a new guild with the current user as owner
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutItemCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('createGuild resolver event:', JSON.stringify(event, null, 2));
  
  try {
    const { identity, arguments } = event;
    const { input } = arguments;
    
    // Get user ID from the identity context
    const userId = identity?.claims?.sub || identity?.username;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const username = identity?.claims?.preferred_username || identity?.username || 'Unknown';
    
    // Validate input
    if (!input.name || input.name.trim().length < 3) {
      throw new Error('Guild name must be at least 3 characters long');
    }
    
    if (input.name.length > 50) {
      throw new Error('Guild name must be less than 50 characters');
    }
    
    if (input.description && input.description.length > 500) {
      throw new Error('Guild description must be less than 500 characters');
    }
    
    if (input.tags && input.tags.length > 10) {
      throw new Error('Maximum 10 tags allowed');
    }
    
    // Generate guild ID
    const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Create guild metadata item
    const guildItem = {
      PK: `GUILD#${guildId}`,
      SK: 'METADATA',
      GSI1PK: `GUILD#${input.guildType || 'PUBLIC'}`,
      GSI1SK: `CREATED#${now}`,
      GSI2PK: `USER#${userId}`,
      GSI2SK: `GUILD#${guildId}`,
      guild_id: guildId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      guild_type: (input.guildType || 'PUBLIC').toLowerCase(),
      tags: input.tags || [],
      created_by: userId,
      owner_username: username,
      owner_nickname: username,
      created_at: now,
      updated_at: now,
      member_count: 1,
      goal_count: 0,
      quest_count: 0,
      pending_requests: 0,
      settings: {
        allow_join_requests: input.settings?.allowJoinRequests !== false,
        require_approval: input.settings?.requireApproval || false,
        allow_comments: input.settings?.allowComments !== false
      },
      TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };
    
    // Create owner member item
    const ownerMemberItem = {
      PK: `GUILD#${guildId}`,
      SK: `MEMBER#${userId}`,
      GSI3PK: `USER#${userId}`,
      GSI3SK: `GUILD#${guildId}`,
      guild_id: guildId,
      user_id: userId,
      username: username,
      nickname: username,
      role: 'owner',
      joined_at: now,
      is_blocked: false,
      can_comment: true,
      TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };
    
    // Use batch write for atomic operation
    const batchParams = {
      RequestItems: {
        [process.env.GUILD_TABLE_NAME || 'gg_guild']: [
          {
            PutRequest: {
              Item: guildItem
            }
          },
          {
            PutRequest: {
              Item: ownerMemberItem
            }
          }
        ]
      }
    };
    
    await docClient.send(new PutItemCommand({
      TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
      Item: guildItem
    }));
    
    await docClient.send(new PutItemCommand({
      TableName: process.env.GUILD_TABLE_NAME || 'gg_guild',
      Item: ownerMemberItem
    }));
    
    // Return the created guild
    return {
      id: guildId,
      name: guildItem.name,
      description: guildItem.description,
      createdBy: userId,
      createdAt: Math.floor(new Date(now).getTime() / 1000),
      updatedAt: Math.floor(new Date(now).getTime() / 1000),
      memberCount: 1,
      goalCount: 0,
      questCount: 0,
      guildType: guildItem.guild_type.toUpperCase(),
      tags: guildItem.tags,
      moderators: [],
      pendingRequests: 0,
      settings: {
        allowJoinRequests: guildItem.settings.allow_join_requests,
        requireApproval: guildItem.settings.require_approval,
        allowComments: guildItem.settings.allow_comments
      },
      userPermissions: {
        isMember: true,
        isOwner: true,
        isModerator: false,
        canJoin: false,
        canRequestJoin: false,
        hasPendingRequest: false,
        canLeave: false,
        canManage: true
      }
    };
    
  } catch (error) {
    console.error('Error in createGuild resolver:', error);
    throw new Error(`Failed to create guild: ${error.message}`);
  }
};


