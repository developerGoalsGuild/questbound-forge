#!/usr/bin/env python3
"""
Debug script to query DynamoDB directly and see what's in the tables
"""
import boto3
import json
from boto3.dynamodb.conditions import Key
from decimal import Decimal
import os

def query_dynamodb_table():
    """Query DynamoDB table directly to see data"""

    # Initialize DynamoDB client
    # Note: You'll need to set your AWS credentials or use a local DynamoDB instance
    try:
        # Try to use local DynamoDB first (for development)
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1',
                                endpoint_url='http://localhost:8000')
        table_name = 'GoalsGuild-QuestService-Table'
        print("[DEBUG] Connected to local DynamoDB")
    except Exception as e:
        print(f"[ERROR] Local DynamoDB not available: {e}")
        try:
            # Try to use AWS DynamoDB (you'll need AWS credentials configured)
            dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            table_name = 'GoalsGuild-QuestService-Table'  # Update with your actual table name
            print("[DEBUG] Connected to AWS DynamoDB")
        except Exception as e2:
            print(f"[ERROR] AWS DynamoDB connection failed: {e2}")
            print("[INFO] Make sure your AWS credentials are configured using: aws configure")
            return

    try:
        table = dynamodb.Table(table_name)
        print(f"[INFO] Querying table: {table_name}")

        # Query for the specific user
        user_id = "9434dc4f-389b-40ee-8384-e76ccbbe6104"

        # 1. Query all items for the user using GSI1
        print(f"\n[DEBUG] Querying all items for user {user_id}...")

        # Query GSI1 for all user items
        response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}"),
            ConsistentRead=True
        )

        print(f"Found {response['Count']} items for user {user_id}")
        print("\n[INFO] ALL USER ITEMS:")
        for item in response.get('Items', []):
            print(f"  PK: {item.get('PK')}")
            print(f"  SK: {item.get('SK')}")
            print(f"  Type: {item.get('SK', '').split('#')[1] if '#' in item.get('SK', '') else 'Unknown'}")
            if 'status' in item:
                print(f"  Status: {item.get('status')}")
            if 'startedAt' in item:
                print(f"  Started At: {item.get('startedAt')}")
            if 'targetCount' in item:
                print(f"  Target Count: {item.get('targetCount')}")
            print("  ---")

        # 2. Specifically look for tasks
        print(f"\n[DEBUG] Querying tasks for user {user_id}...")

        task_response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").begins_with("TASK#")
        )

        print(f"Found {task_response['Count']} tasks for user {user_id}")
        print("\n[INFO] TASKS:")
        for item in task_response.get('Items', []):
            print(f"  Task ID: {item.get('SK').replace('TASK#', '')}")
            print(f"  Status: {item.get('status')}")
            print(f"  Completed At: {item.get('completedAt')}")
            print(f"  Updated At: {item.get('updatedAt')}")
            print("  ---")

        # 3. Specifically look for quests (SK starts with "QUEST#")
        print(f"\n[DEBUG] Querying quests for user {user_id}...")

        quest_response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").begins_with("QUEST#")
        )

        print(f"Found {quest_response['Count']} quests for user {user_id}")
        print("\n[INFO] QUESTS:")
        for item in quest_response.get('Items', []):
            quest_id = item.get('SK').replace('QUEST#', '')
            print(f"  Quest ID: {quest_id}")
            print(f"  Kind: {item.get('kind')}")
            print(f"  Status: {item.get('status')}")
            print(f"  Started At: {item.get('startedAt')}")
            print(f"  Target Count: {item.get('targetCount')}")
            print(f"  Count Scope: {item.get('countScope')}")
            print(f"  Linked Task IDs: {item.get('linkedTaskIds', [])}")
            print("  ---")

        # 4. Check for the specific quest that's not completing
        specific_quest_id = "34303ecf-b56b-466d-af0c-765fb7c40955"
        print(f"\n[DEBUG] Checking specific quest {specific_quest_id}...")

        specific_response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").eq(f"QUEST#{specific_quest_id}")
        )

        if specific_response.get('Items'):
            quest = specific_response['Items'][0]
            print(f"[SUCCESS] Found quest {specific_quest_id}")
            print(f"  Kind: {quest.get('kind')}")
            print(f"  Status: {quest.get('status')}")
            print(f"  Started At: {quest.get('startedAt')}")
            print(f"  Target Count: {quest.get('targetCount')}")
            print(f"  Count Scope: {quest.get('countScope')}")
            print(f"  Period Days: {quest.get('periodDays')}")

            # Calculate when quest should end
            if quest.get('startedAt') and quest.get('periodDays'):
                started_at = quest.get('startedAt')
                period_days = quest.get('periodDays')
                quest_end_time = started_at + (period_days * 24 * 60 * 60 * 1000)
                current_time = int(__import__('time').time() * 1000)
                print(f"  Quest End Time: {quest_end_time}")
                print(f"  Current Time: {current_time}")
                print(f"  Quest Expired: {current_time > quest_end_time}")
        else:
            print(f"[ERROR] Quest {specific_quest_id} not found")

        # 5. Check task completion times vs quest start time
        if task_response.get('Items') and specific_response.get('Items'):
            quest_start_time = specific_response['Items'][0].get('startedAt')
            print(f"\n[DEBUG] Analyzing task completion times vs quest start time ({quest_start_time})...")

            for task in task_response.get('Items', []):
                task_id = task.get('SK').replace('TASK#', '')
                completed_at = task.get('completedAt') or task.get('updatedAt')
                status = task.get('status')

                if completed_at:
                    completed_after_quest_start = completed_at > quest_start_time
                    print(f"  Task {task_id}: Status={status}, Completed={completed_at}, After Quest Start={completed_after_quest_start}")
                else:
                    print(f"  Task {task_id}: Status={status}, No completion time")

    except Exception as e:
        print(f"[ERROR] Error querying DynamoDB: {e}")
        print("[INFO] Make sure your AWS credentials are configured or local DynamoDB is running")

if __name__ == "__main__":
    query_dynamodb_table()
