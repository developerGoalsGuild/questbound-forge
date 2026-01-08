"""
Test Data Management System for Quest Tests.

This module provides comprehensive test data tracking and cleanup functionality
to ensure test data doesn't pollute the database and is properly cleaned up.
"""

import pytest
from datetime import datetime
from typing import List, Dict, Set, Optional
from unittest.mock import patch
import os
import sys
from pathlib import Path

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from app.db.quest_db import _get_dynamodb_table
from botocore.exceptions import ClientError


class TestDataManager:
    """Manages test data tracking and cleanup for Quest tests."""
    
    def __init__(self):
        self.test_data_items: List[Dict] = []
        self.test_user_prefix = "test_user_"
        self.test_quest_prefix = "test_quest_"
        self.test_goal_prefix = "test_goal_"
        self.test_task_prefix = "test_task_"
        self._table = None
    
    @property
    def table(self):
        """Lazy load DynamoDB table."""
        if self._table is None:
            self._table = _get_dynamodb_table()
        return self._table
    
    def track_test_item(self, item_type: str, item_id: str, user_id: str = None, pk: str = None, sk: str = None):
        """Track test data items for cleanup."""
        self.test_data_items.append({
            "type": item_type,
            "id": item_id,
            "user_id": user_id,
            "pk": pk,
            "sk": sk,
            "created_at": datetime.now(),
            "cleaned": False
        })
    
    def cleanup_all_test_data(self):
        """Clean up all tracked test data."""
        cleanup_count = 0
        for item in self.test_data_items:
            if not item["cleaned"]:
                try:
                    self._cleanup_item(item)
                    item["cleaned"] = True
                    cleanup_count += 1
                except Exception as e:
                    print(f"Warning: Failed to cleanup item {item['id']}: {e}")
        
        print(f"Cleaned up {cleanup_count} test items")
    
    def _cleanup_item(self, item: Dict):
        """Clean up a specific test item."""
        if item["pk"] and item["sk"]:
            # Direct cleanup using PK/SK
            try:
                self.table.delete_item(
                    Key={
                        "PK": item["pk"],
                        "SK": item["sk"]
                    }
                )
            except ClientError as e:
                if e.response['Error']['Code'] != 'ResourceNotFoundException':
                    raise
        else:
            # Fallback to scanning and deleting by ID
            self._cleanup_by_id(item["id"], item["type"])
    
    def _cleanup_by_id(self, item_id: str, item_type: str):
        """Clean up item by scanning for ID."""
        try:
            if item_type == "quest":
                response = self.table.scan(
                    FilterExpression="id = :item_id",
                    ExpressionAttributeValues={":item_id": item_id}
                )
            elif item_type == "goal":
                response = self.table.scan(
                    FilterExpression="id = :item_id AND begins_with(SK, :sk_prefix)",
                    ExpressionAttributeValues={
                        ":item_id": item_id,
                        ":sk_prefix": "GOAL#"
                    }
                )
            elif item_type == "task":
                response = self.table.scan(
                    FilterExpression="id = :item_id AND begins_with(SK, :sk_prefix)",
                    ExpressionAttributeValues={
                        ":item_id": item_id,
                        ":sk_prefix": "TASK#"
                    }
                )
            else:
                return
            
            for item in response.get("Items", []):
                self.table.delete_item(
                    Key={
                        "PK": item["PK"],
                        "SK": item["SK"]
                    }
                )
        except ClientError as e:
            if e.response['Error']['Code'] != 'ResourceNotFoundException':
                raise
    
    def cleanup_all_quest_test_data(self):
        """Clean up all quest test data by scanning."""
        try:
            response = self.table.scan(
                FilterExpression="begins_with(id, :test_prefix)",
                ExpressionAttributeValues={":test_prefix": self.test_quest_prefix}
            )
            
            for item in response.get("Items", []):
                self.table.delete_item(
                    Key={
                        "PK": item["PK"],
                        "SK": item["SK"]
                    }
                )
                print(f"Cleaned up quest: {item.get('id')}")
                
        except ClientError as e:
            print(f"Error cleaning up quest test data: {e}")
    
    def cleanup_all_goal_test_data(self):
        """Clean up all goal test data by scanning."""
        try:
            response = self.table.scan(
                FilterExpression="begins_with(id, :test_prefix)",
                ExpressionAttributeValues={":test_prefix": self.test_goal_prefix}
            )
            
            for item in response.get("Items", []):
                self.table.delete_item(
                    Key={
                        "PK": item["PK"],
                        "SK": item["SK"]
                    }
                )
                print(f"Cleaned up goal: {item.get('id')}")
                
        except ClientError as e:
            print(f"Error cleaning up goal test data: {e}")
    
    def cleanup_all_task_test_data(self):
        """Clean up all task test data by scanning."""
        try:
            response = self.table.scan(
                FilterExpression="begins_with(id, :test_prefix)",
                ExpressionAttributeValues={":test_prefix": self.test_task_prefix}
            )
            
            for item in response.get("Items", []):
                self.table.delete_item(
                    Key={
                        "PK": item["PK"],
                        "SK": item["SK"]
                    }
                )
                print(f"Cleaned up task: {item.get('id')}")
                
        except ClientError as e:
            print(f"Error cleaning up task test data: {e}")
    
    def cleanup_all_user_test_data(self, user_id: str):
        """Clean up all test data for a specific user."""
        try:
            # Clean up quests
            response = self.table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
                ExpressionAttributeValues={
                    ":pk": f"USER#{user_id}",
                    ":sk_prefix": "QUEST#"
                }
            )
            
            for item in response.get("Items", []):
                if item.get("id", "").startswith(self.test_quest_prefix):
                    self.table.delete_item(
                        Key={
                            "PK": item["PK"],
                            "SK": item["SK"]
                        }
                    )
                    print(f"Cleaned up quest: {item.get('id')}")
            
            # Clean up goals
            response = self.table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
                ExpressionAttributeValues={
                    ":pk": f"USER#{user_id}",
                    ":sk_prefix": "GOAL#"
                }
            )
            
            for item in response.get("Items", []):
                if item.get("id", "").startswith(self.test_goal_prefix):
                    self.table.delete_item(
                        Key={
                            "PK": item["PK"],
                            "SK": item["SK"]
                        }
                    )
                    print(f"Cleaned up goal: {item.get('id')}")
            
            # Clean up tasks
            response = self.table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
                ExpressionAttributeValues={
                    ":pk": f"USER#{user_id}",
                    ":sk_prefix": "TASK#"
                }
            )
            
            for item in response.get("Items", []):
                if item.get("id", "").startswith(self.test_task_prefix):
                    self.table.delete_item(
                        Key={
                            "PK": item["PK"],
                            "SK": item["SK"]
                        }
                    )
                    print(f"Cleaned up task: {item.get('id')}")
                    
        except ClientError as e:
            print(f"Error cleaning up user test data: {e}")
    
    def verify_cleanup(self) -> bool:
        """Verify that all test data has been cleaned up."""
        try:
            # Check for remaining quest test data
            response = self.table.scan(
                FilterExpression="begins_with(id, :test_prefix)",
                ExpressionAttributeValues={":test_prefix": self.test_quest_prefix}
            )
            quest_remaining = len(response.get("Items", []))
            
            # Check for remaining goal test data
            response = self.table.scan(
                FilterExpression="begins_with(id, :test_prefix)",
                ExpressionAttributeValues={":test_prefix": self.test_goal_prefix}
            )
            goal_remaining = len(response.get("Items", []))
            
            # Check for remaining task test data
            response = self.table.scan(
                FilterExpression="begins_with(id, :test_prefix)",
                ExpressionAttributeValues={":test_prefix": self.test_task_prefix}
            )
            task_remaining = len(response.get("Items", []))
            
            total_remaining = quest_remaining + goal_remaining + task_remaining
            
            if total_remaining > 0:
                print(f"Warning: {total_remaining} test items still remain in database")
                print(f"  - Quests: {quest_remaining}")
                print(f"  - Goals: {goal_remaining}")
                print(f"  - Tasks: {task_remaining}")
                return False
            
            return True
            
        except ClientError as e:
            print(f"Error verifying cleanup: {e}")
            return False


# Global test data manager instance
test_data_manager = TestDataManager()


@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Automatically clean up test data after each test."""
    yield
    test_data_manager.cleanup_all_test_data()


@pytest.fixture(scope="session", autouse=True)
def final_cleanup():
    """Final cleanup at the end of all tests."""
    yield
    print("Performing final cleanup of all test data...")
    test_data_manager.cleanup_all_quest_test_data()
    test_data_manager.cleanup_all_goal_test_data()
    test_data_manager.cleanup_all_task_test_data()
    
    # Verify cleanup
    if test_data_manager.verify_cleanup():
        print("✅ All test data successfully cleaned up")
    else:
        print("⚠️  Some test data may still remain in database")