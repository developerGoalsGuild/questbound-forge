"""
Guild database operations for the guild service.

This module handles all database operations related to guilds,
including CRUD operations, membership management, and guild discovery.
"""

import os
import boto3
import logging
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import uuid4

from ..models.guild import GuildResponse, GuildListResponse, GuildType, GuildSettings, GuildMemberResponse
from ..models.analytics import GuildAnalyticsResponse, MemberLeaderboardItem
from ..models.join_request import GuildJoinRequestResponse, JoinRequestStatus
from ..models.join_request import GuildJoinRequestResponse, JoinRequestStatus
from ..models.comment import GuildCommentResponse

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table_name = os.getenv('GUILD_TABLE_NAME', 'gg_guild')
table = dynamodb.Table(table_name)

# Initialize S3 client for avatar URLs
s3_client = boto3.client('s3')
AVATAR_BUCKET = os.getenv('AVATAR_BUCKET', 'goalsguild-guild-avatars-dev')

# Set up logger
logger = logging.getLogger(__name__)

def generate_avatar_signed_url(avatar_key: Optional[str]) -> Optional[str]:
    """Generate a signed S3 URL for the guild avatar if it exists."""
    if not avatar_key:
        return None
    
    try:
        signed_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': AVATAR_BUCKET, 'Key': avatar_key},
            ExpiresIn=3600  # 1 hour
        )
        return signed_url
    except ClientError:
        # If S3 operation fails, return None
        return None

def build_guild_response(item: Dict[str, Any], members: Optional[List[GuildMemberResponse]] = None, 
                        goals: Optional[List[Dict[str, Any]]] = None, 
                        quests: Optional[List[Dict[str, Any]]] = None,
                        current_user_id: Optional[str] = None) -> GuildResponse:
    """Build a GuildResponse object from a DynamoDB item with signed avatar URL."""
    # Generate signed URL for avatar if it exists
    avatar_key = item.get('avatar_key')
    avatar_url = generate_avatar_signed_url(avatar_key)
    
    # Compute user permissions if current_user_id is provided
    user_permissions = None
    if current_user_id and members:
        from ..models.guild import GuildUserPermissions
        
        # Find user's role in the guild
        user_member = next((member for member in members if member.user_id == current_user_id), None)
        user_role = user_member.role if user_member else None
        
        # Determine permissions
        is_member = user_role in ['member', 'moderator', 'owner']
        is_owner = user_role == 'owner'
        is_moderator = user_role == 'moderator'
        
        guild_type = GuildType(item['guild_type'])
        can_join = not is_member and guild_type == GuildType.PUBLIC
        can_request_join = not is_member and guild_type == GuildType.APPROVAL
        can_leave = is_member and not is_owner
        can_manage = is_owner or is_moderator
        
        # Note: has_pending_request would need to be checked separately if needed
        # For now, we'll set it to False and let the frontend handle it
        has_pending_request = False
        
        user_permissions = GuildUserPermissions(
            is_member=is_member,
            is_owner=is_owner,
            is_moderator=is_moderator,
            can_join=can_join,
            can_request_join=can_request_join,
            has_pending_request=has_pending_request,
            can_leave=can_leave,
            can_manage=can_manage
        )
    
    return GuildResponse(
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
        members=members,
        goals=goals,
        quests=quests,
        position=item.get('position'),
        previous_position=item.get('previous_position'),
        total_score=item.get('total_score'),
        activity_score=item.get('activity_score'),
        growth_rate=item.get('growth_rate'),
        badges=item.get('badges', []),
        avatar_url=avatar_url,
        avatar_key=avatar_key,
        owner_username=item.get('owner_username'),
        owner_nickname=item.get('owner_nickname'),
        moderators=item.get('moderators', []),
        pending_requests=item.get('pending_requests', 0),
        settings=GuildSettings(**item.get('settings', {})),
        user_permissions=user_permissions
    )

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
    created_by_username: Optional[str] = None,
    settings: Optional[GuildSettings] = None
) -> GuildResponse:
    """Create a new guild."""
    try:
        guild_id = f"guild_{uuid4()}"
        now = datetime.utcnow()
        
        # Default settings
        if settings is None:
            settings = GuildSettings()
        
        # Business rule validation: If guild type is "approval", require_approval must be true
        if guild_type == GuildType.APPROVAL:
            settings.require_approval = True
        
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
            'owner_username': created_by_username or 'Unknown',
            'owner_nickname': created_by_username or 'Unknown',
            'created_at': now.isoformat(),
            'updated_at': now.isoformat(),
            'member_count': 1,
            'goal_count': 0,
            'quest_count': 0,
            # Note: Do not initialize 'moderators' here. DynamoDB doesn't allow empty sets.
            # We'll create the attribute when the first moderator is assigned.
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
            'username': created_by_username or 'Unknown',
            'nickname': created_by_username or 'Unknown',
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
            settings=settings,
            owner_username=created_by_username or 'Unknown',
            owner_nickname=created_by_username or 'Unknown'
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to create guild: {str(e)}")

async def get_guild(
    guild_id: str,
    include_members: bool = False,
    include_goals: bool = False,
    include_quests: bool = False,
    current_user_id: Optional[str] = None
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
                ProjectionExpression='user_id, username, nickname, email, avatar_url, #r, joined_at, last_seen_at, invited_by, is_blocked, blocked_at, blocked_by, can_comment',
                ExpressionAttributeNames={'#r': 'role'}
            )
            members = [
                GuildMemberResponse(
                    user_id=item['user_id'],
                    username=item.get('username', item.get('nickname', 'Unknown')),
                    nickname=item.get('nickname'),
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
        
        return build_guild_response(guild_item, members, goals, quests, current_user_id)
        
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
        
        # Get current guild data for validation
        current_guild_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in current_guild_response:
            raise GuildNotFoundError("Guild not found")
        
        current_guild = current_guild_response['Item']
        
        # Business rule validation: If guild type is "approval", require_approval must be true
        new_guild_type = kwargs.get('guild_type', current_guild.get('guild_type'))
        new_settings = kwargs.get('settings', current_guild.get('settings', {}))
        
        if new_guild_type == 'approval':
            if not new_settings.get('require_approval', False):
                raise GuildValidationError("Guilds with type 'Approval Required' must have 'require_approval' set to true. Change the guild type to modify this setting.")
        
        # Build update expression with proper handling of reserved keywords
        update_expression = "SET updated_at = :updated_at"
        expression_values = {
            ':updated_at': datetime.utcnow().isoformat()
        }
        expression_names = {}
        remove_attributes = []
        
        # Add fields to update
        for key, value in kwargs.items():
            if value is not None:
                # Handle reserved keywords
                if key in ['name', 'description', 'tags', 'guild_type', 'settings']:
                    # Use expression attribute names for reserved keywords
                    attr_name = f"#{key}"
                    expression_names[attr_name] = key
                    update_expression += f", {attr_name} = :{key}"
                else:
                    update_expression += f", {key} = :{key}"
                expression_values[f':{key}'] = value
            else:
                # Add to remove list for None values
                if key in ['name', 'description', 'tags', 'guild_type', 'settings']:
                    # Use expression attribute names for reserved keywords
                    attr_name = f"#{key}"
                    expression_names[attr_name] = key
                    remove_attributes.append(attr_name)
                else:
                    remove_attributes.append(key)
        
        # Add REMOVE clause if there are attributes to remove
        if remove_attributes:
            update_expression += f" REMOVE {', '.join(remove_attributes)}"
        
        # Build update parameters
        update_params = {
            'Key': {
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        # Only include ExpressionAttributeNames if it's not empty
        if expression_names:
            update_params['ExpressionAttributeNames'] = expression_names
        
        response = table.update_item(**update_params)
        updated_item = response['Attributes']
        
        return build_guild_response(updated_item)
        
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

# ------------------------------------------------------------
# Comment operations (stubs for initial wiring)
# ------------------------------------------------------------

async def check_user_comment_permissions(guild_id: str, user_id: str) -> tuple[bool, bool]:
    """
    Check if a user can comment in a guild.
    Returns (is_blocked, can_comment)
    """
    try:
        # Get the user's member record
        response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        if 'Item' not in response:
            # User is not a member
            return False, False
            
        member = response['Item']
        is_blocked = member.get('is_blocked', False)
        can_comment = member.get('can_comment', True)  # Default to True if not specified
        
        return is_blocked, can_comment
        
    except ClientError as e:
        raise GuildDBError(f"Failed to check user comment permissions: {str(e)}")

async def create_guild_comment(
    guild_id: str,
    user_id: str,
    username: str,
    content: str,
    user_role: str,
    parent_comment_id: Optional[str] = None,
) -> GuildCommentResponse:
    """Create a guild comment in DynamoDB."""
    try:
        # Check if user is blocked or has commenting disabled
        is_blocked, can_comment = await check_user_comment_permissions(guild_id, user_id)
        
        if is_blocked:
            raise GuildPermissionError("You have been blocked from commenting in this guild")
        
        if not can_comment:
            raise GuildPermissionError("You are not allowed to comment in this guild")
        
        now = datetime.utcnow()
        comment_id = f"comment_{uuid4()}"
        
        # Create comment item
        comment_item = {
            'PK': f"GUILD#{guild_id}",
            'SK': f"COMMENT#{comment_id}",
            'guild_id': guild_id,
            'comment_id': comment_id,
            'user_id': user_id,
            'username': username,
            'content': content,
            'created_at': now.isoformat(),
            'updated_at': None,
            'parent_comment_id': parent_comment_id,
            'likes': 0,
            'is_edited': False,
            'user_role': user_role,
            'TTL': int((now + timedelta(days=365)).timestamp())  # 1 year TTL
        }
        
        # Put item in DynamoDB
        table.put_item(Item=comment_item)
        
        return GuildCommentResponse(
            comment_id=comment_id,
            guild_id=guild_id,
            user_id=user_id,
            username=username,
            avatar_url=None,
            content=content,
            created_at=now,
            updated_at=None,
            parent_comment_id=parent_comment_id,
            replies=[],
            likes=0,
            is_liked=False,
            is_edited=False,
            user_role=user_role,
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to create comment: {str(e)}")


async def get_guild_comments(guild_id: str, current_user_id: str = None) -> List[GuildCommentResponse]:
    """Get all comments for a guild from DynamoDB."""
    try:
        # Check if user is blocked (only if current_user_id is provided and user is a member)
        if current_user_id:
            # First check if user is a member
            member_response = table.get_item(
                Key={
                    'PK': f'GUILD#{guild_id}',
                    'SK': f'MEMBER#{current_user_id}'
                }
            )
            
            # Only check blocking if user is a member
            if 'Item' in member_response:
                member = member_response['Item']
                is_blocked = member.get('is_blocked', False)
                
                if is_blocked:
                    raise GuildPermissionError("You have been blocked from viewing comments in this guild")
        
        # Query comments for the guild
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f"GUILD#{guild_id}") & Key('SK').begins_with("COMMENT#"),
            ScanIndexForward=False  # Sort by creation time descending (newest first)
        )
        print(f"DEBUG: Query response: {response}")
        print(f"DEBUG: Number of items: {len(response.get('Items', []))}")
        
        comments = []
        for item in response['Items']:
            print(f"DEBUG: Processing item: {item}")
            print(f"DEBUG: Item keys: {list(item.keys())}")
            if 'comment_id' not in item:
                print(f"DEBUG: Skipping item without comment_id: {item}")
                continue
            try:
                # Check if current user liked this comment
                liked_users = set(item.get('liked_users', []))
                is_liked = current_user_id in liked_users if current_user_id else False
                
                comment = GuildCommentResponse(
                    comment_id=item['comment_id'],
                    guild_id=item['guild_id'],
                    user_id=item['user_id'],
                    username=item['username'],
                    avatar_url=None,  # TODO: Fetch user avatar
                    content=item['content'],
                    created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00')) if item.get('updated_at') else None,
                    parent_comment_id=item.get('parent_comment_id'),
                    replies=[],  # TODO: Implement replies
                    likes=item.get('likes', 0),
                    is_liked=is_liked,
                    is_edited=item.get('is_edited', False),
                    user_role=item.get('user_role', 'member'),
                )
                comments.append(comment)
            except KeyError as e:
                print(f"DEBUG: Missing field {e} in item: {item}")
                continue
            except Exception as e:
                print(f"DEBUG: Error processing item {item}: {e}")
                continue
        
        return comments
        
    except ClientError as e:
        raise GuildDBError(f"Failed to get comments: {str(e)}")


async def update_guild_comment(
    guild_id: str,
    comment_id: str,
    content: str,
    user_id: str,
) -> GuildCommentResponse:
    """Update a guild comment in DynamoDB."""
    try:
        # Check if user is blocked or has commenting disabled
        is_blocked, can_comment = await check_user_comment_permissions(guild_id, user_id)
        
        if is_blocked:
            raise GuildPermissionError("You have been blocked from commenting in this guild")
        
        if not can_comment:
            raise GuildPermissionError("You are not allowed to comment in this guild")
        
        now = datetime.utcnow()
        
        # Update the comment
        response = table.update_item(
            Key={
                'PK': f"GUILD#{guild_id}",
                'SK': f"COMMENT#{comment_id}"
            },
            UpdateExpression="SET content = :content, updated_at = :updated_at, is_edited = :is_edited",
            ExpressionAttributeValues={
                ':content': content,
                ':updated_at': now.isoformat(),
                ':is_edited': True
            },
            ReturnValues="ALL_NEW"
        )
        
        item = response['Attributes']
        
        return GuildCommentResponse(
            comment_id=item['comment_id'],
            guild_id=item['guild_id'],
            user_id=item['user_id'],
            username=item['username'],
            avatar_url=None,  # TODO: Fetch user avatar
            content=item['content'],
            created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00')) if item.get('updated_at') else None,
            parent_comment_id=item.get('parent_comment_id'),
            replies=[],  # TODO: Implement replies
            likes=item.get('likes', 0),
            is_liked=False,  # TODO: Check if current user liked
            is_edited=item.get('is_edited', False),
            user_role=item['user_role'],
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to update comment: {str(e)}")


async def delete_guild_comment(guild_id: str, comment_id: str) -> None:
    """Delete a guild comment from DynamoDB."""
    try:
        table.delete_item(
            Key={
                'PK': f"GUILD#{guild_id}",
                'SK': f"COMMENT#{comment_id}"
            }
        )
    except ClientError as e:
        raise GuildDBError(f"Failed to delete comment: {str(e)}")


async def like_guild_comment(guild_id: str, comment_id: str, user_id: str) -> dict:
    """Like or unlike a guild comment in DynamoDB."""
    try:
        # Check if user is blocked (blocked users can't like comments)
        is_blocked, can_comment = await check_user_comment_permissions(guild_id, user_id)
        
        if is_blocked:
            raise GuildPermissionError("You have been blocked from interacting with comments in this guild")
        
        # First, check if the comment exists
        response = table.get_item(
            Key={
                'PK': f"GUILD#{guild_id}",
                'SK': f"COMMENT#{comment_id}"
            }
        )
        
        if 'Item' not in response:
            raise GuildDBError("Comment not found")
        
        comment = response['Item']
        current_likes = comment.get('likes', 0)
        liked_users = set(comment.get('liked_users', []))
        
        # Toggle like status
        if user_id in liked_users:
            # Unlike: remove user from liked_users and decrement likes
            liked_users.remove(user_id)
            new_likes = max(0, current_likes - 1)
            is_liked = False
        else:
            # Like: add user to liked_users and increment likes
            liked_users.add(user_id)
            new_likes = current_likes + 1
            is_liked = True
        
        # Update the comment with new like status
        table.update_item(
            Key={
                'PK': f"GUILD#{guild_id}",
                'SK': f"COMMENT#{comment_id}"
            },
            UpdateExpression="SET likes = :likes, liked_users = :liked_users",
            ExpressionAttributeValues={
                ':likes': new_likes,
                ':liked_users': list(liked_users)
            }
        )
        
        return {
            'likes': new_likes,
            'is_liked': is_liked
        }
        
    except ClientError as e:
        raise GuildDBError(f"Failed to like comment: {str(e)}")

async def list_guilds(
    search: Optional[str] = None,
    guild_type: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 50,
    offset: int = 0,
    current_user_id: Optional[str] = None
) -> GuildListResponse:
    """List guilds with optional filtering, search, and pagination."""
    try:
        # Validate parameters
        if limit <= 0:
            limit = 50  # Default limit
        if offset < 0:
            offset = 0  # Default offset
            
        # Build filter expression
        filter_expression = Attr('SK').eq('METADATA')
        
        # Add search filter
        if search:
            search_lower = search.lower()
            filter_expression = filter_expression & (
                Attr('#name').contains(search_lower) | 
                Attr('description').contains(search_lower)
            )
        
        # Add guild type filter
        if guild_type:
            filter_expression = filter_expression & Attr('guild_type').eq(guild_type)
        
        # Add tags filter
        if tags:
            for tag in tags:
                filter_expression = filter_expression & Attr('tags').contains(tag)
        
        # Build expression attribute names
        expr_names = {'#name': 'name'} if search else {}
        
        # Calculate pagination - we need to scan enough items to cover offset + limit
        scan_limit = limit + offset  # We need to scan more to account for offset
        
        # Perform scan with pagination
        all_guilds = []
        last_evaluated_key = None
        scanned_count = 0
        
        # Only scan if we need to get items
        if scan_limit > 0:
            while len(all_guilds) < scan_limit:
                remaining_needed = scan_limit - len(all_guilds)
                if remaining_needed <= 0:
                    break
                    
                # DynamoDB requires limit to be at least 1 and at most 100
                scan_limit_value = min(100, max(1, remaining_needed))
                
                scan_kwargs = {
                    'FilterExpression': filter_expression,
                    'ExpressionAttributeNames': expr_names,
                    'Limit': scan_limit_value
                }
                
                if last_evaluated_key:
                    scan_kwargs['ExclusiveStartKey'] = last_evaluated_key
                
                response = table.scan(**scan_kwargs)
                
                all_guilds.extend(response['Items'])
                scanned_count += response.get('ScannedCount', 0)
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
        
        # Apply offset and limit
        paginated_guilds = all_guilds[offset:offset + limit]
        
        # Build guild responses with user permissions
        guilds = []
        for item in paginated_guilds:
            # Get members if we need to compute permissions
            members = None
            if current_user_id:
                try:
                    members_response = table.query(
                        KeyConditionExpression=Key('PK').eq(f'GUILD#{item["guild_id"]}') & Key('SK').begins_with('MEMBER#'),
                        ProjectionExpression='user_id, username, nickname, email, avatar_url, #r, joined_at, last_seen_at, invited_by, is_blocked, blocked_at, blocked_by, can_comment',
                        ExpressionAttributeNames={'#r': 'role'}
                    )
                    members = [
                        GuildMemberResponse(
                            user_id=member_item['user_id'],
                            username=member_item.get('username', member_item.get('nickname', 'Unknown')),
                            nickname=member_item.get('nickname'),
                            email=member_item.get('email'),
                            avatar_url=member_item.get('avatar_url'),
                            role=member_item['role'],
                            joined_at=datetime.fromisoformat(member_item['joined_at']),
                            last_seen_at=datetime.fromisoformat(member_item['last_seen_at']) if member_item.get('last_seen_at') else None,
                            invited_by=member_item.get('invited_by'),
                            is_blocked=member_item.get('is_blocked', False),
                            blocked_at=datetime.fromisoformat(member_item['blocked_at']) if member_item.get('blocked_at') else None,
                            blocked_by=member_item.get('blocked_by'),
                            can_comment=member_item.get('can_comment', True)
                        )
                        for member_item in members_response['Items']
                    ]
                except Exception:
                    # If we can't get members, continue without permissions
                    members = None
            
            guild = build_guild_response(item, members=members, current_user_id=current_user_id)
            guilds.append(guild)
        
        # Calculate total count (approximate for performance)
        total_count = len(all_guilds)
        has_more = len(all_guilds) > offset + limit
        
        return GuildListResponse(
            guilds=guilds,
            total=total_count,
            limit=limit,
            offset=offset,
            has_more=has_more
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
        
        # Get guild details for each guild with member information
        guilds = []
        for guild_id in guild_ids:
            guild = await get_guild(guild_id, include_members=True, current_user_id=user_id)
            if guild:
                # Verify the user is actually a member by checking the members list
                is_member = any(member.user_id == user_id for member in (guild.members or []))
                if is_member:
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

async def join_guild(guild_id: str, user_id: str, username: Optional[str] = None) -> None:
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
            'username': username or 'Unknown',
            'nickname': username or 'Unknown',
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

# ------------------------------------------------------------
# Join request operations (stubs for initial wiring)
# ------------------------------------------------------------

async def create_join_request(guild_id: str, user_id: str, username: str, message: Optional[str]) -> GuildJoinRequestResponse:
    """Create a join request for an approval-required guild."""
    try:
        # Check if guild exists and requires approval
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
        
        # Only allow join requests for approval-required guilds
        if guild_type != 'approval':
            raise GuildPermissionError("This guild does not require approval to join")
        
        # Check if user already has a pending request
        existing_request = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'JOIN_REQUEST#{user_id}'
            }
        )
        
        if 'Item' in existing_request:
            existing_item = existing_request['Item']
            if existing_item.get('status') == 'pending':
                raise GuildConflictError("You already have a pending join request for this guild")
        
        # Check if user is already a member
        member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        if 'Item' in member_response:
            raise GuildConflictError("You are already a member of this guild")
        
        # Create join request
        now = datetime.utcnow()
        join_request_item = {
            'PK': f'GUILD#{guild_id}',
            'SK': f'JOIN_REQUEST#{user_id}',
            'guild_id': guild_id,
            'user_id': user_id,
            'username': username,
            'message': message,
            'status': 'pending',
            'requested_at': now.isoformat(),
            'TTL': int((now.timestamp() + (30 * 24 * 60 * 60)))  # 30 days TTL
        }

        table.put_item(Item=join_request_item)

        return GuildJoinRequestResponse(
            guild_id=guild_id,
            user_id=user_id,
            username=username,
            email=None,
            avatar_url=None,
            requested_at=now,
            status=JoinRequestStatus.PENDING,
            reviewed_by=None,
            reviewed_at=None,
            review_reason=None,
        )

    except ClientError as e:
        raise GuildDBError(f"Failed to create join request: {str(e)}")


async def get_guild_join_requests(guild_id: str) -> List[GuildJoinRequestResponse]:
    """Get all pending join requests for a guild."""
    try:
        # Query for all join requests for this guild
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f'GUILD#{guild_id}') & Key('SK').begins_with('JOIN_REQUEST#'),
            FilterExpression=Attr('status').eq('pending')
        )
        
        join_requests = []
        for item in response['Items']:
            join_requests.append(GuildJoinRequestResponse(
                guild_id=item['guild_id'],
                user_id=item['user_id'],
                username=item['username'],
                email=None,  # Not stored in join request
                avatar_url=None,  # Not stored in join request
                requested_at=datetime.fromisoformat(item['requested_at']),
                status=JoinRequestStatus.PENDING,
                reviewed_by=None,
                reviewed_at=None,
                review_reason=None,
            ))
        
        return join_requests
        
    except ClientError as e:
        raise GuildDBError(f"Failed to get join requests: {str(e)}")


async def update_join_request_status(
    guild_id: str,
    user_id: str,
    status: str,
    reviewed_by: str,
    review_reason: Optional[str] = None,
) -> None:
    """Update the status of a join request."""
    try:
        now = datetime.utcnow()
        
        update_expression = "SET #status = :status, reviewed_by = :reviewed_by, reviewed_at = :reviewed_at"
        expression_values = {
            ":status": status,
            ":reviewed_by": reviewed_by,
            ":reviewed_at": now.isoformat()
        }
        expression_names = {
            "#status": "status"
        }
        
        if review_reason:
            update_expression += ", review_reason = :review_reason"
            expression_values[":review_reason"] = review_reason
        
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'JOIN_REQUEST#{user_id}'
            },
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to update join request status: {str(e)}")


async def approve_join_request(guild_id: str, user_id: str, approved_by: str, reason: Optional[str] = None) -> None:
    """Approve a join request and add user to guild."""
    try:
        # First, get the join request to verify it exists and is pending
        join_request_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'JOIN_REQUEST#{user_id}'
            }
        )
        
        if 'Item' not in join_request_response:
            raise GuildNotFoundError("Join request not found")
        
        join_request_item = join_request_response['Item']
        if join_request_item.get('status') != 'pending':
            raise GuildConflictError("Join request is not pending")
        
        # Get user info from the join request
        username = join_request_item.get('username', 'Unknown')
        
        # Add user to guild as member
        now = datetime.utcnow()
        member_item = {
            'PK': f'GUILD#{guild_id}',
            'SK': f'MEMBER#{user_id}',
            'GSI3PK': f'USER#{user_id}',
            'GSI3SK': f'GUILD#{guild_id}',
            'guild_id': guild_id,
            'user_id': user_id,
            'username': username,
            'nickname': username,
            'role': 'member',
            'joined_at': now.isoformat(),
            'is_blocked': False,
            'can_comment': True,
            'TTL': int((now.timestamp() + (365 * 24 * 60 * 60)))
        }
        
        # Update join request status to approved
        await update_join_request_status(
            guild_id=guild_id,
            user_id=user_id,
            status='approved',
            reviewed_by=approved_by,
            review_reason=reason
        )
        
        # Add user as member
        table.put_item(Item=member_item)
        
        # Update member count
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression="SET member_count = member_count + :inc",
            ExpressionAttributeValues={':inc': 1}
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to approve join request: {str(e)}")


async def reject_join_request(guild_id: str, user_id: str, rejected_by: str, reason: Optional[str] = None) -> None:
    """Reject a join request."""
    try:
        # First, get the join request to verify it exists and is pending
        join_request_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'JOIN_REQUEST#{user_id}'
            }
        )
        
        if 'Item' not in join_request_response:
            raise GuildNotFoundError("Join request not found")
        
        join_request_item = join_request_response['Item']
        if join_request_item.get('status') != 'pending':
            raise GuildConflictError("Join request is not pending")
        
        # Update join request status to rejected
        await update_join_request_status(
            guild_id=guild_id,
            user_id=user_id,
            status='rejected',
            reviewed_by=rejected_by,
            review_reason=reason
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to reject join request: {str(e)}")


async def perform_moderation_action(
    guild_id: str,
    action: str,
    target_user_id: Optional[str],
    comment_id: Optional[str],
    reason: Optional[str],
    performed_by: str,
) -> None:
    """Perform a moderation action on a guild."""
    try:
        # Verify guild exists
        guild_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in guild_response:
            raise GuildNotFoundError("Guild not found")
        
        # Verify user has moderation permissions
        # Check if user is owner or moderator
        member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{performed_by}'
            }
        )
        
        if 'Item' not in member_response:
            raise GuildPermissionError("User is not a member of this guild")
        
        member_item = member_response['Item']
        user_role = member_item.get('role', 'member')
        
        if user_role not in ['owner', 'moderator']:
            raise GuildPermissionError("Insufficient permissions to perform moderation actions")
        
        # Perform the specific action
        if action == 'block_user':
            if not target_user_id:
                raise ValueError("target_user_id is required for block_user action")
            
            # Block the user
            table.update_item(
                Key={
                    'PK': f'GUILD#{guild_id}',
                    'SK': f'MEMBER#{target_user_id}'
                },
                UpdateExpression='SET is_blocked = :blocked, blocked_at = :blocked_at, blocked_by = :blocked_by, block_reason = :reason',
                ExpressionAttributeValues={
                    ':blocked': True,
                    ':blocked_at': datetime.utcnow().isoformat(),
                    ':blocked_by': performed_by,
                    ':reason': reason or 'No reason provided'
                }
            )
            
        elif action == 'unblock_user':
            if not target_user_id:
                raise ValueError("target_user_id is required for unblock_user action")
            
            # Unblock the user
            table.update_item(
                Key={
                    'PK': f'GUILD#{guild_id}',
                    'SK': f'MEMBER#{target_user_id}'
                },
                UpdateExpression='REMOVE is_blocked, blocked_at, blocked_by, block_reason'
            )
            
        elif action == 'toggle_comment_permission':
            if not target_user_id:
                raise ValueError("target_user_id is required for toggle_comment_permission action")
            
            # Toggle comment permission
            table.update_item(
                Key={
                    'PK': f'GUILD#{guild_id}',
                    'SK': f'MEMBER#{target_user_id}'
                },
                UpdateExpression='SET can_comment = :can_comment',
                ExpressionAttributeValues={
                    ':can_comment': False  # Toggle to False (can be made more sophisticated)
                }
            )
            
        elif action == 'remove_comment':
            # This would typically involve calling a comments service
            # For now, just log the action
            logger.info(f"Comment removal requested for comment {comment_id} in guild {guild_id}")
            
        # Log the moderation action
        logger.info(f"Moderation action performed: {action} on guild {guild_id} by user {performed_by}")
        
    except ClientError as e:
        raise GuildDBError(f"Failed to perform moderation action: {str(e)}")


# ------------------------------------------------------------
# Ownership and moderator operations (stubs)
# ------------------------------------------------------------

async def transfer_guild_ownership(
    guild_id: str,
    new_owner_id: str,
    current_owner_id: str,
    reason: Optional[str] = None,
) -> None:
    """Transfer guild ownership (stub - no-op)."""
    return None


async def assign_moderator(
    guild_id: str,
    user_id: str,
    assigned_by: str,
) -> None:
    """Assign moderator role to a user."""
    logger.info(f"DEBUG: assign_moderator called with guild_id={guild_id}, user_id={user_id}, assigned_by={assigned_by}")
    
    try:
        # Verify guild exists
        logger.info(f"DEBUG: Checking if guild {guild_id} exists")
        guild_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in guild_response:
            logger.error(f"DEBUG: Guild {guild_id} not found")
            raise GuildNotFoundError("Guild not found")
        
        logger.info(f"DEBUG: Guild {guild_id} found")
        
        # Verify the assigner has permission (must be owner)
        logger.info(f"DEBUG: Checking assigner {assigned_by} permissions")
        assigner_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{assigned_by}'
            }
        )
        
        if 'Item' not in assigner_response:
            logger.error(f"DEBUG: Assigner {assigned_by} is not a member of guild {guild_id}")
            raise GuildPermissionError("User is not a member of this guild")
        
        assigner_item = assigner_response['Item']
        assigner_role = assigner_item.get('role', 'member')
        logger.info(f"DEBUG: Assigner {assigned_by} has role: {assigner_role}")
        
        if assigner_role != 'owner':
            logger.error(f"DEBUG: Assigner {assigned_by} is not owner (role: {assigner_role})")
            raise GuildPermissionError("Only guild owners can assign moderators")
        
        # Verify target user is a member of the guild
        logger.info(f"DEBUG: Checking if target user {user_id} is a member of guild {guild_id}")
        target_member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        if 'Item' not in target_member_response:
            logger.error(f"DEBUG: Target user {user_id} is not a member of guild {guild_id}")
            raise GuildNotFoundError("Target user is not a member of this guild")
        
        target_member_item = target_member_response['Item']
        current_role = target_member_item.get('role', 'member')
        logger.info(f"DEBUG: Target user {user_id} current role: {current_role}")
        
        # Check if user is already a moderator or owner
        if current_role in ['moderator', 'owner']:
            logger.error(f"DEBUG: User {user_id} is already a {current_role}")
            raise GuildConflictError(f"User is already a {current_role}")
        
        # Update user's role to moderator
        logger.info(f"DEBUG: Updating user {user_id} role to moderator")
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            },
            UpdateExpression='SET #role = :role, moderator_assigned_at = :assigned_at, moderator_assigned_by = :assigned_by',
            ExpressionAttributeNames={
                '#role': 'role'
            },
            ExpressionAttributeValues={
                ':role': 'moderator',
                ':assigned_at': datetime.utcnow().isoformat(),
                ':assigned_by': assigned_by
            }
        )
        
        # Add user to moderators list in guild metadata
        logger.info(f"DEBUG: Adding user {user_id} to moderators list in guild metadata")
        # Add to a String Set; when attribute doesn't exist, DynamoDB will create it
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression='ADD moderators :moderator_id',
            ExpressionAttributeValues={
                ':moderator_id': set([user_id])
            }
        )
        
        # Log the action
        logger.info(f"DEBUG: Successfully assigned user {user_id} as moderator for guild {guild_id} by {assigned_by}")
        
    except ClientError as e:
        logger.error(f"DEBUG: ClientError in assign_moderator - {str(e)}")
        raise GuildDBError(f"Failed to assign moderator: {str(e)}")
    except Exception as e:
        logger.error(f"DEBUG: Unexpected error in assign_moderator - {type(e).__name__}: {str(e)}")
        raise


async def remove_moderator(
    guild_id: str,
    user_id: str,
    removed_by: str,
) -> None:
    """Remove moderator role from a user."""
    logger.info(f"DEBUG: remove_moderator called with guild_id={guild_id}, user_id={user_id}, removed_by={removed_by}")
    
    try:
        # Verify guild exists
        logger.info(f"DEBUG: Checking if guild {guild_id} exists")
        guild_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in guild_response:
            logger.error(f"DEBUG: Guild {guild_id} not found")
            raise GuildNotFoundError("Guild not found")
        
        logger.info(f"DEBUG: Guild {guild_id} found")
        
        # Verify the remover has permission (must be owner)
        logger.info(f"DEBUG: Checking remover {removed_by} permissions")
        remover_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{removed_by}'
            }
        )
        
        if 'Item' not in remover_response:
            logger.error(f"DEBUG: Remover {removed_by} is not a member of guild {guild_id}")
            raise GuildPermissionError("User is not a member of this guild")
        
        remover_item = remover_response['Item']
        remover_role = remover_item.get('role', 'member')
        logger.info(f"DEBUG: Remover {removed_by} has role: {remover_role}")
        
        if remover_role != 'owner':
            logger.error(f"DEBUG: Remover {removed_by} is not owner (role: {remover_role})")
            raise GuildPermissionError("Only guild owners can remove moderators")
        
        # Verify target user is a member of the guild
        logger.info(f"DEBUG: Checking if target user {user_id} is a member of guild {guild_id}")
        target_member_response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            }
        )
        
        if 'Item' not in target_member_response:
            logger.error(f"DEBUG: Target user {user_id} is not a member of guild {guild_id}")
            raise GuildNotFoundError("Target user is not a member of this guild")
        
        target_member_item = target_member_response['Item']
        current_role = target_member_item.get('role', 'member')
        logger.info(f"DEBUG: Target user {user_id} current role: {current_role}")
        
        # Check if user is actually a moderator
        if current_role != 'moderator':
            logger.error(f"DEBUG: User {user_id} is not a moderator (current role: {current_role})")
            raise GuildConflictError(f"User is not a moderator (current role: {current_role})")
        
        # Update user's role back to member
        logger.info(f"DEBUG: Updating user {user_id} role back to member")
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'MEMBER#{user_id}'
            },
            UpdateExpression='SET #role = :role REMOVE moderator_assigned_at, moderator_assigned_by',
            ExpressionAttributeNames={
                '#role': 'role'
            },
            ExpressionAttributeValues={
                ':role': 'member'
            }
        )
        
        # Remove user from moderators list in guild metadata
        logger.info(f"DEBUG: Removing user {user_id} from moderators list in guild metadata")
        # Remove from a String Set; must pass a String Set type
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression='DELETE moderators :moderator_id',
            ExpressionAttributeValues={
                ':moderator_id': set([user_id])
            }
        )
        
        # Log the action
        logger.info(f"DEBUG: Successfully removed user {user_id} as moderator for guild {guild_id} by {removed_by}")
        
    except ClientError as e:
        logger.error(f"DEBUG: ClientError in remove_moderator - {str(e)}")
        raise GuildDBError(f"Failed to remove moderator: {str(e)}")
    except Exception as e:
        logger.error(f"DEBUG: Unexpected error in remove_moderator - {type(e).__name__}: {str(e)}")
        raise


async def _get_guild_goals_completed_score(guild_id: str, since_date: datetime) -> int:
    """Get the number of goals completed by guild members in the last 30 days."""
    try:
        # Get all guild members
        members_response = table.query(
            KeyConditionExpression=Key('PK').eq(f'GUILD#{guild_id}') & Key('SK').begins_with('MEMBER#'),
            ProjectionExpression='user_id'
        )
        
        if not members_response.get('Items'):
            return 0
        
        member_user_ids = [member['user_id'] for member in members_response['Items']]
        
        # Access the core table to query for completed goals
        from .settings import Settings
        settings = Settings()
        core_table = dynamodb.Table(settings.core_table_name)
        
        # Convert since_date to timestamp for comparison
        since_timestamp = int(since_date.timestamp() * 1000)
        
        goals_completed_count = 0
        
        # Query each member's completed goals
        for user_id in member_user_ids:
            try:
                # Query for completed goals by this user since the cutoff date
                response = core_table.query(
                    KeyConditionExpression=Key('PK').eq(f'USER#{user_id}') & Key('SK').begins_with('GOAL#'),
                    FilterExpression=Attr('status').eq('completed') & Attr('updatedAt').gte(since_timestamp),
                    ProjectionExpression='id, status, updatedAt'
                )
                
                goals_completed_count += len(response.get('Items', []))
                
            except ClientError as e:
                logger.warning(f"Failed to query goals for user {user_id}: {str(e)}")
                continue
        
        # Return score: 10 points per completed goal
        return goals_completed_count * 10
        
    except Exception as e:
        logger.error(f"Failed to get guild goals completed score: {str(e)}")
        return 0


async def _get_guild_social_engagement_score(guild_id: str, since_date: datetime) -> int:
    """Get social engagement score from comments and likes in the last 30 days."""
    try:
        # Convert since_date to timestamp for comparison
        since_timestamp = int(since_date.timestamp() * 1000)
        
        # Query for comments created since the cutoff date
        comments_response = table.query(
            KeyConditionExpression=Key('PK').eq(f'GUILD#{guild_id}') & Key('SK').begins_with('COMMENT#'),
            FilterExpression=Attr('createdAt').gte(since_timestamp),
            ProjectionExpression='id, createdAt, likes'
        )
        
        comments_count = len(comments_response.get('Items', []))
        
        # Count total likes on all comments (including older ones)
        total_likes = 0
        for comment in comments_response.get('Items', []):
            likes = comment.get('likes', 0)
            if isinstance(likes, int):
                total_likes += likes
            elif isinstance(likes, list):
                total_likes += len(likes)
        
        # Return score: 1 point per comment + 1 point per like
        return comments_count + total_likes
        
    except Exception as e:
        logger.error(f"Failed to get guild social engagement score: {str(e)}")
        return 0


async def get_guild_rankings(limit: int = 50) -> List[Dict[str, Any]]:
    """Get guild rankings based on member count, activity, and goals completed in last 30 days."""
    try:
        # Get all guilds with their metadata
        response = table.scan(
            FilterExpression=Attr('SK').eq('METADATA'),
            ProjectionExpression='guild_id, #name, member_count, created_at, avatar_key, guild_type',
            ExpressionAttributeNames={
                '#name': 'name'
            }
        )
        
        guilds = response['Items']
        
        # Calculate ranking scores based on member count, age, and goals completed
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        rankings = []
        
        for guild in guilds:
            # Calculate activity score based on member count and guild age
            member_count = guild.get('member_count', 0)
            created_at = datetime.fromisoformat(guild['created_at'].replace('Z', '+00:00'))
            days_old = (now - created_at.replace(tzinfo=None)).days
            
            # Base score from member count
            activity_score = member_count * 10
            
            # Growth bonus for newer guilds
            if days_old < 30:
                growth_bonus = (30 - days_old) * 2
            else:
                growth_bonus = 0
            
            # Get goals completed in the last 30 days for this guild
            goals_completed_score = await _get_guild_goals_completed_score(guild['guild_id'], thirty_days_ago)
            
            # Get social engagement score from comments and likes
            social_engagement_score = await _get_guild_social_engagement_score(guild['guild_id'], thirty_days_ago)
            
            # Total score
            total_score = activity_score + growth_bonus + goals_completed_score + social_engagement_score
            
            # Generate signed S3 URL for avatar if it exists
            avatar_key = guild.get('avatar_key')
            avatar_url = generate_avatar_signed_url(avatar_key)
            
            rankings.append({
                'guild_id': guild['guild_id'],
                'name': guild['name'],
                'avatar_url': avatar_url,
                'position': 0,  # Will be set after sorting
                'total_score': total_score,
                'activity_score': activity_score,
                'growth_rate': growth_bonus,
                'goals_completed_score': goals_completed_score,
                'social_engagement_score': social_engagement_score,
                'member_count': member_count,
                'badges': [],
                'trend': 'stable'
            })
        
        # Sort by total score (descending)
        rankings.sort(key=lambda x: x['total_score'], reverse=True)
        
        # Set positions and limit results
        for i, ranking in enumerate(rankings[:limit]):
            ranking['position'] = i + 1
        
        return rankings[:limit]
        
    except ClientError as e:
        raise GuildDBError(f"Failed to get guild rankings: {str(e)}")


async def get_guild_analytics(guild_id: str) -> GuildAnalyticsResponse:
    """Return basic analytics for a guild."""
    guild = await get_guild(guild_id)
    if not guild:
        raise GuildNotFoundError("Guild not found")

    now = datetime.utcnow()
    
    # Get member count and calculate active members (simplified: 70-90% of total)
    total_members = guild.member_count or 0
    active_members = max(0, int(total_members * (0.7 + (0.2 * (total_members / 50)))))
    
    # Get goals and quests counts
    total_goals = guild.goal_count or 0
    total_quests = guild.quest_count or 0
    
    # Calculate completion rates (simplified: 60-85% completion rate)
    goal_completion_rate = min(85.0, max(60.0, (total_goals * 0.75))) if total_goals > 0 else 0.0
    quest_completion_rate = min(85.0, max(60.0, (total_quests * 0.8))) if total_quests > 0 else 0.0
    
    completed_goals = int(total_goals * (goal_completion_rate / 100))
    completed_quests = int(total_quests * (quest_completion_rate / 100))
    
    # Calculate member growth rate (simplified: 5-25% growth)
    member_growth_rate = min(25.0, max(5.0, (total_members * 0.15))) if total_members > 0 else 0.0
    
    # Calculate activity score (0-100 based on member count and engagement)
    activity_score = min(100.0, max(0.0, (total_members * 2.5) + (completed_goals * 1.5) + (completed_quests * 2.0)))
    
    # Get comments count (simplified: 2-5 comments per member)
    total_comments = int(total_members * (2 + (3 * (total_members / 50))))
    
    # Generate mock leaderboard data
    leaderboard: List[MemberLeaderboardItem] = []
    if total_members > 0:
        # Get actual members if available
        try:
            members_response = table.query(
                KeyConditionExpression=Key('PK').eq(f'GUILD#{guild_id}') & Key('SK').begins_with('MEMBER#'),
                ProjectionExpression='user_id, username, nickname, joined_at, last_seen_at',
                Limit=10
            )
            
            for i, member in enumerate(members_response['Items']):
                # Calculate mock scores based on member data
                joined_at = datetime.fromisoformat(member['joined_at'].replace('Z', '+00:00'))
                days_since_joined = (now - joined_at.replace(tzinfo=None)).days
                
                # Mock activity score based on join date and member index
                base_score = max(0, 100 - (days_since_joined * 0.5) - (i * 5))
                goals_completed = max(0, int(base_score / 10))
                quests_completed = max(0, int(base_score / 8))
                comments_count = max(0, int(base_score / 15))
                
                leaderboard.append(MemberLeaderboardItem(
                    user_id=member['user_id'],
                    username=member.get('username', member.get('nickname', 'Unknown')),
                    avatar_url=None,
                    score=base_score,
                    rank=i + 1,
                    goals_completed=goals_completed,
                    quests_completed=quests_completed,
                    comments_count=comments_count,
                    last_activity=datetime.fromisoformat(member.get('last_seen_at', member['joined_at']).replace('Z', '+00:00')) if member.get('last_seen_at') else None
                ))
        except Exception as e:
            # If we can't get real members, create mock data
            for i in range(min(5, total_members)):
                base_score = max(0, 100 - (i * 15))
                leaderboard.append(MemberLeaderboardItem(
                    user_id=f"user_{i+1}",
                    username=f"Member {i+1}",
                    avatar_url=None,
                    score=base_score,
                    rank=i + 1,
                    goals_completed=max(0, int(base_score / 10)),
                    quests_completed=max(0, int(base_score / 8)),
                    comments_count=max(0, int(base_score / 15)),
                    last_activity=now
                ))
    
    return GuildAnalyticsResponse(
        guild_id=guild_id,
        total_members=total_members,
        active_members=active_members,
        total_goals=total_goals,
        completed_goals=completed_goals,
        total_quests=total_quests,
        completed_quests=completed_quests,
        total_comments=total_comments,
        member_growth_rate=member_growth_rate,
        goal_completion_rate=goal_completion_rate,
        quest_completion_rate=quest_completion_rate,
        activity_score=activity_score,
        last_updated=now,
        guild_name=guild.name,
        guild_type=guild.guild_type.value if guild.guild_type else 'public',
        created_at=guild.created_at,
        last_activity_at=now,
        memberLeaderboard=leaderboard,
    )

async def update_guild_ranking(guild_id: str) -> None:
    """Update ranking data for a specific guild."""
    try:
        # Get guild metadata
        response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in response:
            raise GuildNotFoundError("Guild not found")
        
        guild = response['Item']
        
        # Calculate new ranking data
        member_count = guild.get('member_count', 0)
        created_at = datetime.fromisoformat(guild['created_at'].replace('Z', '+00:00'))
        now = datetime.utcnow()
        days_old = (now - created_at.replace(tzinfo=None)).days
        
        # Calculate scores
        activity_score = member_count * 10
        if days_old < 30:
            growth_bonus = (30 - days_old) * 2
        else:
            growth_bonus = 0
        
        total_score = activity_score + growth_bonus
        
        # Update guild with ranking data
        table.update_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': 'METADATA'
            },
            UpdateExpression='SET total_score = :score, activity_score = :activity, growth_rate = :growth, ranking_updated_at = :updated',
            ExpressionAttributeValues={
                ':score': total_score,
                ':activity': activity_score,
                ':growth': growth_bonus,
                ':updated': now.isoformat()
            }
        )
        
    except ClientError as e:
        raise GuildDBError(f"Failed to update guild ranking: {str(e)}")

async def calculate_guild_rankings() -> None:
    """Calculate rankings for all guilds."""
    try:
        # Get all guilds
        response = table.scan(
            FilterExpression=Attr('SK').eq('METADATA'),
            ProjectionExpression='guild_id'
        )
        
        # Update rankings for each guild
        for guild in response['Items']:
            await update_guild_ranking(guild['guild_id'])
        
    except ClientError as e:
        raise GuildDBError(f"Failed to calculate guild rankings: {str(e)}")

async def check_guild_name_availability(name: str) -> bool:
    """Check if a guild name is available for use.

    Args:
        name: The guild name to check

    Returns:
        bool: True if name is available, False if already taken
    """
    try:
        print(f"DEBUG: check_guild_name_availability called with name: '{name}'")
        print(f"DEBUG: name type: {type(name)}, length: {len(name) if name else 'None'}")
        
        # Query for any guild with the exact name (case insensitive)
        # 'name' is a reserved keyword, so we need to use ExpressionAttributeNames
        # Use the placeholder in the expression string
        filter_expr = Attr('#name').eq(':name')
        expr_names = {'#name': 'name'}
        expr_values = {':name': name}
        
        print(f"DEBUG: FilterExpression: {filter_expr}")
        print(f"DEBUG: ExpressionAttributeNames: {expr_names}")
        print(f"DEBUG: ExpressionAttributeValues: {expr_values}")
        
        # Test if the FilterExpression is properly formed
        print(f"DEBUG: FilterExpression type: {type(filter_expr)}")
        print(f"DEBUG: FilterExpression dir: {dir(filter_expr)}")
        
        # Try using the expression string directly
        response = table.scan(
            FilterExpression='#name = :name',
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values
        )
        
        print(f"DEBUG: Scan response: {response}")
        print(f"DEBUG: Items count: {len(response.get('Items', []))}")
        print(f"DEBUG: Items: {response.get('Items', [])}")

        # If any items are returned, the name is taken
        is_available = len(response.get('Items', [])) == 0
        print(f"DEBUG: Name '{name}' is available: {is_available}")
        return is_available

    except ClientError as e:
        print(f"DEBUG: ClientError in check_guild_name_availability: {e}")
        print(f"DEBUG: Error type: {type(e)}")
        print(f"DEBUG: Error args: {e.args}")
        raise GuildDBError(f"Failed to check guild name availability: {e}")
    except Exception as e:
        print(f"DEBUG: Unexpected error in check_guild_name_availability: {e}")
        print(f"DEBUG: Error type: {type(e)}")
        print(f"DEBUG: Error args: {e.args}")
        raise GuildDBError(f"Failed to check guild name availability: {e}")


async def has_pending_join_request(guild_id: str, user_id: str) -> bool:
    """Check if a user has a pending join request for a guild."""
    try:
        response = table.get_item(
            Key={
                'PK': f'GUILD#{guild_id}',
                'SK': f'JOIN_REQUEST#{user_id}'
            }
        )
        
        if 'Item' not in response:
            return False
            
        # Check if the request is still pending
        return response['Item'].get('status') == 'pending'
        
    except ClientError as e:
        raise GuildDBError(f"Failed to check pending join request: {str(e)}")
    except Exception as e:
        raise GuildDBError(f"Failed to check pending join request: {str(e)}")

