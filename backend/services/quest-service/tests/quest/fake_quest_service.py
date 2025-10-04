"""
Fake Quest Service for Local Performance Testing.

This module provides a simplified quest service that uses local DynamoDB
for performance testing without AWS SSO dependencies.
"""

import time
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import boto3
from botocore.exceptions import ClientError
import sys
from pathlib import Path

# Add the quest service to the path
quest_service_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(quest_service_dir))

from app.models.quest import QuestCreatePayload, QuestResponse, QuestStatus

class FakeQuestService:
    """Fake quest service for local performance testing."""
    
    def __init__(self, table_name: str = "gg_core_temp"):
        self.table_name = table_name
        self.region = "us-east-2"
        
        # Initialize DynamoDB with real AWS credentials
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=self.region
        )
        
        self.table = self.dynamodb.Table(table_name)
    
    def create_quest(self, user_id: str, payload: QuestCreatePayload) -> Dict[str, Any]:
        """Create a quest in the local DynamoDB."""
        start_time = time.time()
        
        try:
            quest_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            
            # Create quest item
            item = {
                'PK': f"USER#{user_id}",
                'SK': f"QUEST#{quest_id}",
                'GSI1PK': f"QUEST#{quest_id}",
                'GSI1SK': f"USER#{user_id}",
                'EntityType': 'Quest',
                'QuestId': quest_id,
                'UserId': user_id,
                'Title': payload.title,
                'Description': payload.description or "",
                'Category': payload.category,
                'Difficulty': payload.difficulty,
                'Status': 'draft',
                'RewardXp': payload.rewardXp or 0,
                'Tags': payload.tags or [],
                'Privacy': payload.privacy or "private",
                'IsQuantitative': payload.kind == "quantitative",
                'TargetCount': payload.targetCount or 0,
                'CreatedAt': now,
                'UpdatedAt': now,
                'Version': 1
            }
            
            # Add optional fields
            if payload.deadline:
                item['Deadline'] = payload.deadline
            if payload.startAt:
                item['StartAt'] = payload.startAt
            if payload.periodSeconds:
                item['PeriodSeconds'] = payload.periodSeconds
            
            # Put item in DynamoDB
            self.table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)"
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quest_id': quest_id,
                'duration': duration,
                'status': 'success',
                'item': item
            }
            
        except ClientError as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quest_id': None,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quest_id': None,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }
    
    def get_quest(self, user_id: str, quest_id: str) -> Dict[str, Any]:
        """Get a quest from the local DynamoDB."""
        start_time = time.time()
        
        try:
            response = self.table.get_item(
                Key={
                    'PK': f"USER#{user_id}",
                    'SK': f"QUEST#{quest_id}"
                }
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            if 'Item' in response:
                return {
                    'quest': response['Item'],
                    'duration': duration,
                    'status': 'success'
                }
            else:
                return {
                    'quest': None,
                    'duration': duration,
                    'status': 'not_found'
                }
                
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quest': None,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }
    
    def list_user_quests(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """List quests for a user from the local DynamoDB."""
        start_time = time.time()
        
        try:
            response = self.table.query(
                KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
                ExpressionAttributeValues={
                    ':pk': f"USER#{user_id}",
                    ':sk_prefix': "QUEST#"
                },
                Limit=limit,
                ScanIndexForward=False
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quests': response.get('Items', []),
                'count': response.get('Count', 0),
                'duration': duration,
                'status': 'success'
            }
            
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quests': [],
                'count': 0,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }
    
    def update_quest_status(self, user_id: str, quest_id: str, status: str) -> Dict[str, Any]:
        """Update quest status in the local DynamoDB."""
        start_time = time.time()
        
        try:
            now = datetime.now(timezone.utc).isoformat()
            
            response = self.table.update_item(
                Key={
                    'PK': f"USER#{user_id}",
                    'SK': f"QUEST#{quest_id}"
                },
                UpdateExpression='SET #status = :status, UpdatedAt = :updated_at, Version = Version + :inc',
                ConditionExpression='attribute_exists(PK) AND attribute_exists(SK)',
                ExpressionAttributeNames={
                    '#status': 'Status'
                },
                ExpressionAttributeValues={
                    ':status': status,
                    ':updated_at': now,
                    ':inc': 1
                },
                ReturnValues='ALL_NEW'
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quest': response.get('Attributes'),
                'duration': duration,
                'status': 'success'
            }
            
        except ClientError as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quest': None,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'quest': None,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }
    
    def delete_quest(self, user_id: str, quest_id: str) -> Dict[str, Any]:
        """Delete a quest from the local DynamoDB."""
        start_time = time.time()
        
        try:
            response = self.table.delete_item(
                Key={
                    'PK': f"USER#{user_id}",
                    'SK': f"QUEST#{quest_id}"
                },
                ConditionExpression='attribute_exists(PK) AND attribute_exists(SK)',
                ReturnValues='ALL_OLD'
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'deleted_item': response.get('Attributes'),
                'duration': duration,
                'status': 'success'
            }
            
        except ClientError as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'deleted_item': None,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'deleted_item': None,
                'duration': duration,
                'status': 'error',
                'error': str(e)
            }

def main():
    """Test the fake quest service."""
    print("Testing Fake Quest Service...")
    
    # Initialize service
    service = FakeQuestService()
    
    # Test data
    user_id = "test_user_123"
    payload = QuestCreatePayload(
        title="Test Quest",
        category="Health",
        difficulty="medium",
        description="Test quest for performance testing"
    )
    
    # Test create quest
    print("Creating quest...")
    result = service.create_quest(user_id, payload)
    print(f"Create result: {result}")
    
    if result['status'] == 'success':
        quest_id = result['quest_id']
        
        # Test get quest
        print("Getting quest...")
        result = service.get_quest(user_id, quest_id)
        print(f"Get result: {result}")
        
        # Test update status
        print("Updating quest status...")
        result = service.update_quest_status(user_id, quest_id, "active")
        print(f"Update result: {result}")
        
        # Test list quests
        print("Listing quests...")
        result = service.list_user_quests(user_id)
        print(f"List result: {result}")
        
        # Test delete quest
        print("Deleting quest...")
        result = service.delete_quest(user_id, quest_id)
        print(f"Delete result: {result}")

if __name__ == "__main__":
    main()
