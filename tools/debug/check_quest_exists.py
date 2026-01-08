#!/usr/bin/env python3
"""
Script to check if a quest exists in DynamoDB
"""

import boto3
import os
from botocore.exceptions import ClientError

def check_quest_exists(quest_id: str):
    """Check if a quest exists in DynamoDB"""
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table_name = 'gg_core'  # Based on the terraform configuration
    table = dynamodb.Table(table_name)
    
    print(f"Checking if quest {quest_id} exists in table {table_name}...")
    
    try:
        # Scan for quest by ID
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("type").eq("Quest") & 
                           boto3.dynamodb.conditions.Attr("id").eq(quest_id)
        )
        
        items = response.get("Items", [])
        print(f"Found {len(items)} items matching quest ID {quest_id}")
        
        if items:
            quest = items[0]
            print(f"Quest found:")
            print(f"  - ID: {quest.get('id')}")
            print(f"  - Title: {quest.get('title')}")
            print(f"  - Status: {quest.get('status')}")
            print(f"  - User ID: {quest.get('userId')}")
            print(f"  - PK: {quest.get('PK')}")
            print(f"  - SK: {quest.get('SK')}")
            print(f"  - Created At: {quest.get('createdAt')}")
            return True
        else:
            print("Quest not found in database")
            return False
            
    except ClientError as e:
        print(f"Error querying database: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def list_all_quests():
    """List all quests in the database"""
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table_name = 'gg_core'
    table = dynamodb.Table(table_name)
    
    print(f"Listing all quests in table {table_name}...")
    
    try:
        # Scan for all quests
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("type").eq("Quest")
        )
        
        items = response.get("Items", [])
        print(f"Found {len(items)} quests total")
        
        for i, quest in enumerate(items[:10]):  # Show first 10
            print(f"Quest {i+1}:")
            print(f"  - ID: {quest.get('id')}")
            print(f"  - Title: {quest.get('title')}")
            print(f"  - Status: {quest.get('status')}")
            print(f"  - User ID: {quest.get('userId')}")
            print(f"  - Created At: {quest.get('createdAt')}")
            print()
            
        if len(items) > 10:
            print(f"... and {len(items) - 10} more quests")
            
    except ClientError as e:
        print(f"Error querying database: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    quest_id = "b702955c-3b46-45ca-84e0-60b15a53b951"
    
    print("=" * 60)
    print("QUEST DATABASE CHECK")
    print("=" * 60)
    
    # Check specific quest
    exists = check_quest_exists(quest_id)
    
    print("\n" + "=" * 60)
    print("ALL QUESTS IN DATABASE")
    print("=" * 60)
    
    # List all quests
    list_all_quests()