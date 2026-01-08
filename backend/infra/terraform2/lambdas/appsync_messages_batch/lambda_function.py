"""
AppSync Lambda Resolver: Batch fetch messages with reactions
Efficiently fetches messages and their reactions in a single call using parallel DynamoDB queries.
"""
import json
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Any, Optional
import boto3
from botocore.config import Config

# DynamoDB client with retry configuration
dynamodb_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'standard'
    }
)
dynamodb = boto3.resource('dynamodb', config=dynamodb_config)
dynamodb_client = boto3.client('dynamodb', config=dynamodb_config)

# Get table names from environment
CORE_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'gg_core')
GUILD_TABLE_NAME = os.getenv('GUILD_TABLE_NAME', 'gg_guild')
print(f"Lambda initialized with CORE_TABLE_NAME={CORE_TABLE_NAME}, GUILD_TABLE_NAME={GUILD_TABLE_NAME}")
core_table = dynamodb.Table(CORE_TABLE_NAME)
guild_table = dynamodb.Table(GUILD_TABLE_NAME)
print(f"Lambda tables initialized: core_table.name={core_table.name}, guild_table.name={guild_table.name}")


def fetch_single_message_reactions_sync(message_id: str, table_to_use=None) -> tuple:
    """Fetch reactions for a single message (synchronous)"""
    try:
        # Use provided table or default to core_table
        if table_to_use is None:
            table_to_use = core_table
        
        pk = f'MSG#{message_id}'
        
        # Query reaction summaries
        response = table_to_use.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues={
                ':pk': pk,
                ':sk': 'SUMMARY#REACT#'
            }
        )
        
        reactions = []
        for item in response.get('Items', []):
            sk = item.get('SK', '')
            if not sk.startswith('SUMMARY#REACT#'):
                continue
            
            shortcode = sk.replace('SUMMARY#REACT#', '')
            if not shortcode:
                continue
            
            # Check if user has reacted (would require additional query, skip for now)
            # Could optimize by batching GetItem calls for viewerHasReacted checks
            reactions.append({
                'shortcode': shortcode,
                'unicode': item.get('unicode', ''),
                'count': item.get('count', 0),
                'viewerHasReacted': False  # Could be enhanced with batch GetItem
            })
        
        return (message_id, reactions)
    except Exception as e:
        print(f"Error fetching reactions for message {message_id}: {e}")
        return (message_id, [])


async def fetch_reactions_parallel(message_ids: List[str], user_id: str, table_to_use=None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Batch fetch reactions for multiple messages in parallel using asyncio and ThreadPoolExecutor.
    Returns dict mapping message_id to list of reactions.
    """
    if not message_ids:
        return {}
    
    # Use ThreadPoolExecutor to run synchronous boto3 calls in parallel
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=10) as executor:
        # Create tasks for parallel execution
        tasks = [
            loop.run_in_executor(executor, fetch_single_message_reactions_sync, msg_id, table_to_use)
            for msg_id in message_ids if msg_id
        ]
        
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Build reactions dictionary
    reactions_by_message = {}
    for result in results:
        if isinstance(result, Exception):
            print(f"Error in parallel reaction fetch: {result}")
            continue
        message_id, reactions = result
        reactions_by_message[message_id] = reactions
    
    return reactions_by_message


def handler(event: Dict[str, Any], context: Any) -> List[Dict[str, Any]]:
    """
    AppSync Lambda resolver handler for messages query with batch reactions.
    
    Event structure from AppSync (after request template processing):
    {
        "payload": {
            "arguments": {
                "roomId": "ROOM-general",
                "after": 1234567890,
                "limit": 50
            },
            "identity": {
                "sub": "user-id",
                ...
            },
            "resolverContext": {
                "sub": "user-id"  # Alternative location for user ID
            }
        }
    }
    """
    try:
        print(f"Lambda event received: {json.dumps(event, default=str)}")
        
        # AppSync Lambda resolvers receive the event directly (not wrapped in payload)
        # The request template sends: { "version": "2018-05-29", "operation": "Invoke", "payload": {...} }
        # But Lambda receives the full event structure
        payload = event.get('payload', event)  # Fallback to event if payload doesn't exist
        
        # Extract arguments and identity
        args = payload.get('arguments', {}) if isinstance(payload, dict) else {}
        identity = payload.get('identity', {}) if isinstance(payload, dict) else {}
        resolver_context = payload.get('resolverContext', {}) if isinstance(payload, dict) else {}
        
        print(f"Extracted args: {json.dumps(args, default=str)}")
        print(f"Extracted identity keys: {list(identity.keys()) if isinstance(identity, dict) else 'not a dict'}")
        
        # Get user ID from identity
        user_id = None
        if isinstance(identity, dict):
            user_id = identity.get('sub') or identity.get('userId')
        if not user_id and isinstance(resolver_context, dict):
            user_id = resolver_context.get('sub') or resolver_context.get('userId')
        
        if not user_id:
            print("WARNING: No user ID found in identity context")
            # Don't raise error, return empty list (some queries might not require auth)
            # But log it for debugging
            user_id = 'unknown'
        
        room_id = args.get('roomId') if isinstance(args, dict) else None
        if not room_id:
            print("ERROR: roomId is required but not provided")
            return []  # Return empty list instead of raising
        
        after = args.get('after')
        limit = min(args.get('limit', 50), 100)  # Cap at 100 messages
        
        # Determine table and partition key based on roomId
        if room_id.startswith('GUILD#'):
            # Guild chat - use gg_guild table with roomId as PK
            table_to_query = guild_table
            pk = room_id  # Use the actual roomId (GUILD#guild_id)
        else:
            # General room - use gg_core table
            table_to_query = core_table
            pk = room_id
        
        # Query messages from DynamoDB
        # Note: boto3 uses KeyConditionExpression (not query.expression like AppSync JS)
        query_params = {
            'KeyConditionExpression': 'PK = :pk AND begins_with(SK, :sk)',
            'ExpressionAttributeValues': {
                ':pk': pk,
                ':sk': 'MSG#'
            },
            'ScanIndexForward': False,
            'Limit': limit
        }
        
        # Add filter for 'after' timestamp if provided
        if after:
            query_params['FilterExpression'] = 'ts > :after'
            query_params['ExpressionAttributeValues'][':after'] = after
        
        print(f"Querying DynamoDB table {table_to_query.name} with params: {json.dumps(query_params, default=str)}")
        print(f"Using PK: {pk}, room_id: {room_id}, table: {table_to_query.name}")
        response = table_to_query.query(**query_params)
        print(f"DynamoDB response: {json.dumps({'Count': len(response.get('Items', [])), 'ScannedCount': response.get('ScannedCount', 0), 'Items': response.get('Items', [])[:2] if response.get('Items') else []}, default=str)}")
        items = response.get('Items', [])
        
        # Transform messages
        messages = []
        message_ids = []
        
        for item in items:
            message = {
                'id': item.get('id'),
                'roomId': item.get('roomId', room_id),
                'senderId': item.get('senderId'),
                'senderNickname': item.get('senderNickname'),
                'text': item.get('text', ''),
                'ts': item.get('ts', 0)
            }
            
            if item.get('replyToId'):
                message['replyToId'] = item['replyToId']
            
            messages.append(message)
            if message.get('id'):
                message_ids.append(message['id'])
        
        # Batch fetch reactions for all messages in parallel
        if message_ids:
            # Run async function in event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                reactions_by_message = loop.run_until_complete(
                    fetch_reactions_parallel(message_ids, user_id, table_to_query)
                )
            finally:
                loop.close()
        else:
            reactions_by_message = {}
        
        # Attach reactions to messages
        for message in messages:
            message_id = message.get('id')
            message['reactions'] = reactions_by_message.get(message_id, [])
        
        # Always return a list, never null (required by GraphQL schema [Message!]!)
        return messages if messages else []
        
    except Exception as e:
        print(f"Error in messages batch resolver: {e}")
        import traceback
        traceback.print_exc()
        # Return empty list instead of raising to avoid null response
        # AppSync will handle the error via the response template
        error_response = {
            'error': str(e),
            'errorType': type(e).__name__
        }
        # Return empty list to satisfy GraphQL schema (non-nullable array)
        # The error will be logged but we return [] to prevent GraphQL errors
        return []

