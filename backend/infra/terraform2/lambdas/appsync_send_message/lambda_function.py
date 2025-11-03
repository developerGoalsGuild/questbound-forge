"""
AppSync Lambda Resolver: Send message
Handles sending messages to both gg_core and gg_guild tables based on roomId
"""
import json
import os
from typing import Dict, Any
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

# Get table names from environment
CORE_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'gg_core')
GUILD_TABLE_NAME = os.getenv('GUILD_TABLE_NAME', 'gg_guild')
core_table = dynamodb.Table(CORE_TABLE_NAME)
guild_table = dynamodb.Table(GUILD_TABLE_NAME)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AppSync Lambda resolver handler for sendMessage mutation
    AppSync Lambda resolvers receive events in this format:
    {
        "version": "2018-05-29",
        "operation": "Invoke",
        "payload": {
            "arguments": {...},
            "identity": {...},
            "resolverContext": {...}
        }
    }
    """
    try:
        print(f"Lambda event received: {json.dumps(event, default=str)}")
        
        # AppSync Lambda resolvers receive the event directly (not wrapped in payload)
        # The request template sends: { "version": "2018-05-29", "operation": "Invoke", "payload": {...} }
        # But Lambda receives the full event structure
        payload = event.get('payload', event)  # Fallback to event if payload doesn't exist
        
        print(f"Using payload: {json.dumps(payload, default=str)}")
        
        # Extract arguments
        args = payload.get('arguments', {}) if isinstance(payload, dict) else {}
        identity = payload.get('identity', {}) if isinstance(payload, dict) else {}
        resolver_context = payload.get('resolverContext', {}) if isinstance(payload, dict) else {}
        
        # Get user ID from identity
        user_id = None
        if isinstance(identity, dict):
            user_id = identity.get('sub')
            if not user_id and isinstance(identity.get('resolverContext'), dict):
                user_id = identity['resolverContext'].get('sub')
        
        if not user_id and isinstance(resolver_context, dict):
            user_id = resolver_context.get('sub') or resolver_context.get('userId')
        
        if not user_id:
            print("ERROR: No user ID found in identity context")
            raise Exception('Unauthorized')
        
        # Extract message fields
        room_id = args.get('roomId')
        text = args.get('text', '')
        sender_nickname = args.get('senderNickname', '')
        reply_to_id = args.get('replyToId')
        
        if not room_id:
            raise Exception('roomId is required')
        if not text:
            raise Exception('text is required')
        
        # Validate message length
        MAX_MESSAGE_LENGTH = 10000
        if len(text) > MAX_MESSAGE_LENGTH:
            raise Exception(f'Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters')
        
        # Determine table based on roomId
        if room_id.startswith('GUILD#'):
            table_to_use = guild_table
            pk = room_id  # Already in GUILD# format
            room_type = 'guild'
        else:
            table_to_use = core_table
            pk = room_id
            room_type = 'general'
        
        # Generate message ID and timestamp
        import time
        import uuid
        ts = int(time.time() * 1000)  # Milliseconds
        message_id = str(uuid.uuid4())
        
        # Build message item
        item = {
            'PK': pk,
            'SK': f'MSG#{ts}#{message_id}',
            'type': 'Message',
            'id': message_id,
            'roomId': room_id,
            'senderId': user_id,
            'senderNickname': sender_nickname,
            'text': text,
            'ts': ts,
            'roomType': room_type,
            'emojiMetadata': {'shortcodes': [], 'unicodeCount': 0}
        }
        
        if reply_to_id:
            item['replyToId'] = reply_to_id
        
        print(f"Writing message to table {table_to_use.name} with PK: {pk}, SK: MSG#{ts}#{message_id}")
        
        # Write to DynamoDB
        table_to_use.put_item(Item=item)
        
        print(f"Message saved successfully: {message_id}")
        
        # Return message for GraphQL response
        # Include all required fields to match GraphQL schema
        result = {
            'id': message_id,
            'roomId': room_id,
            'senderId': user_id,
            'senderNickname': sender_nickname,
            'text': text,
            'ts': ts,
            # Required field: reactions (empty array since no reactions yet)
            'reactions': [],
            # Optional field: emojiMetadata (from item)
            'emojiMetadata': item.get('emojiMetadata', {'shortcodes': [], 'unicodeCount': 0})
        }
        
        if reply_to_id:
            result['replyToId'] = reply_to_id
        
        return result
        
    except Exception as e:
        print(f"Error in sendMessage Lambda: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise

