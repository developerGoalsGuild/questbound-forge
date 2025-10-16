"""
Guild database operations for the guild service.

This module handles all database operations related to guilds,
including CRUD operations, membership management, and guild discovery.
"""

import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from ..models.guild import GuildResponse, GuildListResponse, GuildType, GuildSettings
from ..models.join_request import GuildJoinRequestResponse, JoinRequestStatus
from ..models.comment import GuildCommentResponse

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table_name = os.getenv('GUILD_TABLE_NAME', 'gg_guild')
table = dynamodb.Table(table_name)

class GuildDBError(Exception):
    """Base exception for guild database operations."""
    pass

class GuildNotFoundError(GuildDBError):
    """Raised when a guild is not found."""
    pass

class GuildPermissionError(GuildDBError):
    """Raised when user lacks permission for guild operation."""
    pass

class GuildValidationError(GuildDBError):
    """Raised when guild data validation fails."""
    pass

class GuildConflictError(GuildDBError):
    """Raised when guild operation conflicts with existing data."""
    pass

async def create_guild(
    name: str,
    description: Optional[str],
    guild_type: GuildType,
    tags: List[str],
    created_by: str,
    settings: Optional[GuildSettings] = None
) -> GuildResponse:
    """Create a new guild."""
    try:
        guild_id = f"guild_{uuid4()}"
        now = datetime.utcnow()
        
        # Default settings
        if settings is None:
            settings = GuildSettings()
        
        # Create guild metadata item
        guild_item = {
            'PK': f'GUILD#{guild_id}',
            'SK': 'METADATA',
            'GSI1PK': f'GUILD#{guild_type}',
            'GSI1SK': f'CREATED#{now.isoformat()}',
            'GSI2PK': f'USER#{created_by}',
            'GSI2SK': f'GUILD#{guild_id}',
            'guild_id': guild_id,
            'name': name,
            'description': description,
            'guild_type': guild_type.value,
            'tags': tags,
            'created_by': created_by,
            'created_at': now.isoformat(),
            'updated_at': now.isoformat(),
            'member_count': 1,
            'goal_count': 0,
            'quest_count': 0,
            'moderators': [],
            'pending_requests': 0,
            'settings': settings.dict(),
            'TTL': int((now.timestamp() + (365 * 24 * 60 * 60)))  # 1 year TTL for inactive guilds
        }
        
        # Create owner member item
        owner_member_item = {
            'PK': f'GUILD#{guild_id}',
            'SK': f'MEMBER#{created_by}',
            'GSI3PK': f'USER#{created_by}',
            'GSI3SK': f'GUILD#{guild_id}',
            'guild_id': guild_id,
            'user_id': created_by,
            'role': 'owner',
            'joined_at': now.isoformat(),
            'is_blocked': False,
            'can_comment': True,
            'TTL': int((now.timestamp() + (365 * 24 * 60 * 60)))
        }
        
        # Use batch write for atomic operation
        with table.batch_writer() as batch:
            batch.put_item(Item=guild_item)
            batch.put_item(Item=owner_member_item)
        
        # Return guild response
        return GuildResponse(
            guild_id=guild_id,
            name=name,
            description=description,
            created_by=created_by,
            created_at=now,
            updated_at=now,
            member_count=1,
            goal_count=0,
            quest_count=0,
            guild_type=guild_type,
            tags=tags,
            moderators=[],
            pending_requests=0,
            settings=settings
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to create guild: {str(e)}")

async def get_guild(
    guild_id: str,
    include_members: bool = False,
    include_goals: bool = False,
    include_quests: bool = False
) -> Optional[GuildResponse]:
    """Get guild details."""
    try:
        # Get guild metadata
        response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in response:
            return None
        
        guild_item = response['Item']
        
        # Get members if requested
        members = None
        if include_members:
            members_response = table.query(
                KeyConditionExpression=Key('PK').eq(f'GUILD#{guild_id}') & Key('SK').begins_with('MEMBER#'),
                ProjectionExpression='user_id, username, email, avatar_url, role, joined_at, last_seen_at, invited_by, is_blocked, blocked_at, blocked_by, can_comment'
            )
            members = [
                GuildMemberResponse(
                    user_id=item['user_id'],
                    username=item.get('username', 'Unknown'),
                    email=item.get('email'),
                    avatar_url=item.get('avatar_url'),
                    role=item['role'],
                    joined_at=datetime.fromisoformat(item['joined_at']),
                    last_seen_at=datetime.fromisoformat(item['last_seen_at']) if item.get('last_seen_at') else None,
                    invited_by=item.get('invited_by'),
                    is_blocked=item.get('is_blocked', False),
                    blocked_at=datetime.fromisoformat(item['blocked_at']) if item.get('blocked_at') else None,
                    blocked_by=item.get('blocked_by'),
                    can_comment=item.get('can_comment', True)
                )
                for item in members_response['Items']
            ]
        
        # Get goals if requested (placeholder - would need integration with goals service)
        goals = None
        if include_goals:
            goals = []  # TODO: Implement goals integration
        
        # Get quests if requested (placeholder - would need integration with quests service)
        quests = None
        if include_quests:
            quests = []  # TODO: Implement quests integration
        
        return GuildResponse(
            guild_id=guild_item['guild_id'],
            name=guild_item['name'],
            description=guild_item.get('description'),
            created_by=guild_item['created_by'],
            created_at=datetime.fromisoformat(guild_item['created_at']),
            updated_at=datetime.fromisoformat(guild_item['updated_at']) if guild_item.get('updated_at') else None,
            member_count=guild_item['member_count'],
            goal_count=guild_item.get('goal_count', 0),
            quest_count=guild_item.get('quest_count', 0),
            guild_type=GuildType(guild_item['guild_type']),
            tags=guild_item.get('tags', []),
            members=members,
            goals=goals,
            quests=quests,
            position=guild_item.get('position'),
            previous_position=guild_item.get('previous_position'),
            total_score=guild_item.get('total_score'),
            activity_score=guild_item.get('activity_score'),
            growth_rate=guild_item.get('growth_rate'),
            badges=guild_item.get('badges', []),
            avatar_url=guild_item.get('avatar_url'),
            avatar_key=guild_item.get('avatar_key'),
            moderators=guild_item.get('moderators', []),
            pending_requests=guild_item.get('pending_requests', 0),
            settings=GuildSettings(**guild_item.get('settings', {}))
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to get guild: {str(e)}")

async def update_guild(
    guild_id: str,
    updated_by: str,
    **kwargs
) -> GuildResponse:
    """Update guild details."""
    try:
        # Check if user has permission to update guild
        member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{updated_by}'
            }
        )
        
        if 'Item' not in member_response:
            raise GuildPermissionError("User is not a member of this guild")
        
        member_role = member_response['Item']['role']
        if member_role not in ['owner', 'moderator']:
            raise GuildPermissionError("Insufficient permissions to update guild")
        
        # Build update expression
        update_expression = "SET updated_at = :updated_at"
        expression_values = {
            ':updated_at': datetime.utcnow().isoformat()
        }
        
        # Add fields to update
        for key, value in kwargs.items():
            if value is not None:
                update_expression += f", {key} = :{key}"
                expression_values[f':{key}'] = value
        
        # Update guild
        response = table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )
        
        updated_item = response['Attributes']
        
        return GuildResponse(
            guild_id=updated_item['guild_id'],
            name=updated_item['name'],
            description=updated_item.get('description'),
            created_by=updated_item['created_by'],
            created_at=datetime.fromisoformat(updated_item['created_at']),
            updated_at=datetime.fromisoformat(updated_item['updated_at']),
            member_count=updated_item['member_count'],
            goal_count=updated_item.get('goal_count', 0),
            quest_count=updated_item.get('quest_count', 0),
            guild_type=GuildType(updated_item['guild_type']),
            tags=updated_item.get('tags', []),
            position=updated_item.get('position'),
            previous_position=updated_item.get('previous_position'),
            total_score=updated_item.get('total_score'),
            activity_score=updated_item.get('activity_score'),
            growth_rate=updated_item.get('growth_rate'),
            badges=updated_item.get('badges', []),
            avatar_url=updated_item.get('avatar_url'),
            avatar_key=updated_item.get('avatar_key'),
            moderators=updated_item.get('moderators', []),
            pending_requests=updated_item.get('pending_requests', 0),
            settings=GuildSettings(**updated_item.get('settings', {}))
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to update guild: {str(e)}")

async def delete_guild(guild_id: str, deleted_by: str) -> None:
    """Delete a guild."""
    try:
        # Check if user has permission to delete guild
        member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{deleted_by}'
            }
        )
        
        if 'Item' not in member_response:
            raise GuildPermissionError("User is not a member of this guild")
        
        member_role = member_response['Item']['role']
        if member_role != 'owner':
            raise GuildPermissionError("Only guild owner can delete the guild")
        
        # Get all items for this guild
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f'GUILD#{guild_id}')
        )
        
        # Delete all items
        with table.batch_writer() as batch:
            for item in response['Items']:
                batch.delete_item(
                    Key={
                        'PK': item['PK'],
                        'SK': item['SK']
                    }
                )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to delete guild: {str(e)}")

async def list_guilds(
    search: Optional[str] = None,
    guild_type: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 20,
    offset: int = 0
) -> GuildListResponse:
    """List guilds with optional filtering."""
    try:
        # Build query parameters
        if guild_type:
            # Query by guild type
            response = table.query(
                IndexName='GSI1',
                KeyConditionExpression=Key('GSI1PK').eq(f'GUILD#{guild_type}'),
                Limit=limit,
                ScanIndexForward=False  # Sort by creation date descending
            )
        else:
            # Scan all guilds (less efficient, but needed for search)
            filter_expression = Attr('SK').eq('METADATA')
            
            if search:
                filter_expression = filter_expression & (
                    Attr('name').contains(search) | 
                    Attr('description').contains(search)
                )
            
            if tags:
                for tag in tags:
                    filter_expression = filter_expression & Attr('tags').contains(tag)
            
            response = table.scan(
                FilterExpression=filter_expression,
                Limit=limit
            )
        
        guilds = []
        for item in response['Items']:
            guilds.append(GuildResponse(
                guild_id=item['guild_id'],
                name=item['name'],
                description=item.get('description'),
                created_by=item['created_by'],
                created_at=datetime.fromisoformat(item['created_at']),
                updated_at=datetime.fromisoformat(item['updated_at']) if item.get('updated_at') else None,
                member_count=item['member_count'],
                goal_count=item.get('goal_count', 0),
                quest_count=item.get('quest_count', 0),
                guild_type=GuildType(item['guild_type']),
                tags=item.get('tags', []),
                position=item.get('position'),
                previous_position=item.get('previous_position'),
                total_score=item.get('total_score'),
                activity_score=item.get('activity_score'),
                growth_rate=item.get('growth_rate'),
                badges=item.get('badges', []),
                avatar_url=item.get('avatar_url'),
                avatar_key=item.get('avatar_key'),
                moderators=item.get('moderators', []),
                pending_requests=item.get('pending_requests', 0),
                settings=GuildSettings(**item.get('settings', {}))
            ))
        
        return GuildListResponse(
            guilds=guilds,
            total=len(guilds),
            limit=limit,
            offset=offset,
            has_more=len(guilds) == limit
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to list guilds: {str(e)}")

async def list_user_guilds(user_id: str) -> GuildListResponse:
    """List guilds for a specific user."""
    try:
        response = table.query(
            IndexName='GSI3',
            KeyConditionExpression=Key('GSI3PK').eq(f'USER#{user_id}'),
            ProjectionExpression='guild_id'
        )
        
        guild_ids = [item['guild_id'] for item in response['Items']]
        
        if not guild_ids:
            return GuildListResponse(
                guilds=[],
                total=0,
                limit=0,
                offset=0,
                has_more=False
            )
        
        # Get guild details for each guild
        guilds = []
        for guild_id in guild_ids:
            guild = await get_guild(guild_id)
            if guild:
                guilds.append(guild)
        
        return GuildListResponse(
            guilds=guilds,
            total=len(guilds),
            limit=len(guilds),
            offset=0,
            has_more=False
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to list user guilds: {str(e)}")

async def join_guild(guild_id: str, user_id: str) -> None:
    """Join a guild."""
    try:
        # Get guild details
        guild_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in guild_response:
            raise GuildNotFoundError("Guild not found")
        
        guild_item = guild_response['Item']
        guild_type = guild_item['guild_type']
        
        # Check if user is already a member
        member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        if 'Item' in member_response:
            raise GuildConflictError("User is already a member of this guild")
        
        # Check guild type and permissions
        if guild_type == 'private':
            raise GuildPermissionError("Cannot join private guild directly")
        elif guild_type == 'approval':
            raise GuildPermissionError("This guild requires approval to join")
        
        # Add user as member
        now = datetime.utcnow()
        member_item = {
            'PK': f'GUILD#{guild_id}',
            'SK': f'MEMBER#{user_id}',
            'GSI3PK': f'USER#{user_id}',
            'GSI3SK': f'GUILD#{guild_id}',
            'guild_id': guild_id,
            'user_id': user_id,
            'role': 'member',
            'joined_at': now.isoformat(),
            'is_blocked': False,
            'can_comment': True,
            'TTL': int((now.timestamp() + (365 * 24 * 60 * 60)))
        }
        
        # Update member count
        table.put_item(Item=member_item)
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression='SET member_count = member_count + :inc',
            ExpressionAttributeValues={':inc': 1}
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to join guild: {str(e)}")

async def leave_guild(guild_id: str, user_id: str) -> None:
    """Leave a guild."""
    try:
        # Check if user is a member
        member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        if 'Item' not in member_response:
            raise GuildPermissionError("User is not a member of this guild")
        
        member_role = member_response['Item']['role']
        if member_role == 'owner':
            raise GuildPermissionError("Guild owner cannot leave the guild")
        
        # Remove member
        table.delete_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        # Update member count
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression='SET member_count = member_count - :dec',
            ExpressionAttributeValues={':dec': 1}
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to leave guild: {str(e)}")

async def remove_user_from_guild(guild_id: str, user_id: str, removed_by: str) -> None:
    """Remove a user from a guild."""
    try:
        # Check if remover has permission
        remover_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{removed_by}'
            }
        )
        
        if 'Item' not in remover_response:
            raise GuildPermissionError("User is not a member of this guild")
        
        remover_role = remover_response['Item']['role']
        if remover_role not in ['owner', 'moderator']:
            raise GuildPermissionError("Insufficient permissions to remove users")
        
        # Check if target user is a member
        target_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        if 'Item' not in target_response:
            raise GuildNotFoundError("User is not a member of this guild")
        
        target_role = target_response['Item']['role']
        if target_role == 'owner':
            raise GuildPermissionError("Cannot remove guild owner")
        
        if remover_role == 'moderator' and target_role == 'moderator':
            raise GuildPermissionError("Moderators cannot remove other moderators")
        
        # Remove member
        table.delete_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        # Update member count
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression='SET member_count = member_count - :dec',
            ExpressionAttributeValues={':dec': 1}
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to remove user from guild: {str(e)}")

