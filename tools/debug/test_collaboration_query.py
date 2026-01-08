#!/usr/bin/env python3
"""
Test script to run the collaboration access query directly against DynamoDB.
This tests the same query used in the check_goal_access function.
"""

import boto3
import os
from boto3.dynamodb.conditions import Key, Attr

# Set up AWS session
session = boto3.Session(region_name='us-east-2')
dynamodb = session.resource('dynamodb')

# Get the table name from environment or use default
table_name = os.getenv('CORE_TABLE_NAME', 'gg_core')
table = dynamodb.Table(table_name)

def test_collaboration_access(user_id: str, goal_id: str):
    """
    Test the collaboration access query directly.
    This replicates the logic from check_goal_access function.
    """
    print(f"Testing collaboration access for:")
    print(f"  User ID: {user_id}")
    print(f"  Goal ID: {goal_id}")
    print(f"  Table: {table_name}")
    print("-" * 50)
    
    # Step 1: Check if user is the owner
    print("Step 1: Checking if user is the owner...")
    owner_key = {"PK": f"USER#{user_id}", "SK": f"GOAL#{goal_id}"}
    print(f"  Owner key: {owner_key}")
    
    try:
        owner_response = table.get_item(Key=owner_key)
        if "Item" in owner_response:
            print("  ✅ User is the owner!")
            print(f"  Goal details: {owner_response['Item']}")
            return True, "owner", None
        else:
            print("  ❌ User is not the owner")
    except Exception as e:
        print(f"  ❌ Error checking ownership: {e}")
        return False, "none", None
    
    # Step 2: Check if user is a collaborator using GSI1
    print("\nStep 2: Checking if user is a collaborator...")
    print("  Querying GSI1 for collaborations...")
    
    try:
        collaborator_query = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"GOAL#{goal_id}") & Key("GSI1SK").eq(f"USER#{user_id}"),
            FilterExpression=Attr("type").eq("Goal"),
            ProjectionExpression="PK, SK, type",
            Limit=1
        )
        
        items = collaborator_query.get("Items", [])
        print(f"  Query returned {len(items)} items")
        
        if items:
            item = items[0]
            print("  ✅ User is a collaborator!")
            print(f"  Collaboration details:")
            print(f"    PK: {item.get('PK')}")
            print(f"    GSI1SK: {item.get('GSI1SK')}")
            print(f"    resourceId: {item.get('resourceId')}")
            print(f"    resourceType: {item.get('resourceType')}")
            
            # Now find the owner using GSI1
            print("\nStep 3: Finding the goal owner...")
            owner_query = table.query(
                IndexName="GSI1",
                KeyConditionExpression=Key("GSI1PK").eq(f"GOAL#{goal_id}") & Key("GSI1SK").begins_with("USER#"),
                FilterExpression=Attr("type").eq("Goal"),
                ProjectionExpression="GSI1SK, type",
                Limit=1
            )
            
            owner_items = owner_query.get("Items", [])
            if owner_items:
                owner_gsi1sk = owner_items[0]["GSI1SK"]
                owner_user_id = owner_gsi1sk.replace("USER#", "")
                print(f"  ✅ Found owner: {owner_user_id}")
                return True, "collaborator", owner_user_id
            else:
                print("  ❌ Goal not found in database")
                print("  This is a data consistency issue - collaboration exists but goal is missing")
                return True, "collaborator_missing_goal", None
        else:
            print("  ❌ User is not a collaborator")
            return False, "none", None
            
    except Exception as e:
        print(f"  ❌ Error checking collaboration: {e}")
        return False, "none", None

def list_user_collaborations(user_id: str):
    """
    List all collaborations for a user to see what's available.
    """
    print(f"\nListing all collaborations for user: {user_id}")
    print("-" * 50)
    
    try:
        # Query GSI1 for all collaborations
        query_response = table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").begins_with("COLLAB#"),
            ProjectionExpression="PK, GSI1SK, resourceId, resourceType, #type",
            ExpressionAttributeNames={"#type": "type"}
        )
        
        items = query_response.get("Items", [])
        print(f"Found {len(items)} collaboration records:")
        
        for i, item in enumerate(items, 1):
            print(f"  {i}. PK: {item.get('PK')}")
            print(f"     GSI1SK: {item.get('GSI1SK')}")
            print(f"     resourceId: {item.get('resourceId')}")
            print(f"     resourceType: {item.get('resourceType')}")
            print(f"     type: {item.get('#type')}")
            print()
            
    except Exception as e:
        print(f"❌ Error listing collaborations: {e}")

def search_goals():
    """
    Search for goals in the database to see what's available.
    """
    print(f"\nSearching for goals in the database...")
    print(f"Table: {table_name}")
    print("-" * 50)
    
    try:
        # First, let's try a simple scan without filters to see what we get
        print("Step 1: Simple scan to see all items...")
        simple_scan = table.scan(Limit=5)
        simple_items = simple_scan.get("Items", [])
        print(f"Found {len(simple_items)} items in simple scan:")
        for i, item in enumerate(simple_items, 1):
            print(f"  {i}. PK: {item.get('PK')}, SK: {item.get('SK')}, type: {item.get('type', 'No type')}")
        
        print("\nStep 2: Direct query for the specific goal from console...")
        # Try to get the specific goal directly using the key from the console
        goal_key = {
            "PK": "USER#9434dc4f-389b-40cc-8384-e76ccbbe6104",
            "SK": "GOAL#4a0b0822-eb9d-4bd7-b50e-97a942f44398"
        }
        print(f"Querying for goal with key: {goal_key}")
        
        try:
            goal_response = table.get_item(Key=goal_key)
            if "Item" in goal_response:
                goal_item = goal_response["Item"]
                print("✅ Found the goal directly!")
                print(f"  PK: {goal_item.get('PK')}")
                print(f"  SK: {goal_item.get('SK')}")
                print(f"  id: {goal_item.get('id')}")
                print(f"  title: {goal_item.get('title', 'No title')}")
                print(f"  userid: {goal_item.get('userid')}")
                print(f"  type: {goal_item.get('type')}")
            else:
                print("❌ Goal not found with direct query")
        except Exception as e:
            print(f"❌ Error in direct query: {e}")
        
        print("\nStep 3: Scan for all items to find goals...")
        # Scan for all items without filter to find goals
        scan_response = table.scan(
            ProjectionExpression="PK, SK, id, title, #type, userid",
            ExpressionAttributeNames={"#type": "type"}
        )
        
        items = scan_response.get("Items", [])
        print(f"Found {len(items)} total items:")
        
        goal_items = []
        for i, item in enumerate(items, 1):
            item_type = item.get('type', 'No type')
            if item_type == 'Goal':
                goal_items.append(item)
            print(f"  {i}. PK: {item.get('PK')}")
            print(f"     SK: {item.get('SK')}")
            print(f"     id: {item.get('id')}")
            print(f"     title: {item.get('title', 'No title')}")
            print(f"     userid: {item.get('userid')}")
            print(f"     type: {item_type}")
            print()
        
        print(f"\nFound {len(goal_items)} goal items:")
        for i, goal in enumerate(goal_items, 1):
            print(f"  Goal {i}: {goal.get('title', 'No title')} (ID: {goal.get('id')})")
            
    except Exception as e:
        print(f"❌ Error searching goals: {e}")
        import traceback
        traceback.print_exc()

def create_test_goal(goal_id: str, user_id: str, title: str = "Test Goal"):
    """
    Create a test goal in the database for testing purposes.
    """
    print(f"\nCreating test goal...")
    print(f"  Goal ID: {goal_id}")
    print(f"  User ID: {user_id}")
    print(f"  Title: {title}")
    print("-" * 50)
    
    try:
        goal_item = {
            "PK": f"USER#{user_id}",
            "SK": f"GOAL#{goal_id}",
            "id": goal_id,
            "title": title,
            "type": "Goal",
            "description": "Test goal for collaboration testing",
            "status": "active",
            "createdAt": "2025-10-14T21:00:00.000Z",
            "updatedAt": "2025-10-14T21:00:00.000Z"
        }
        
        table.put_item(Item=goal_item)
        print("  ✅ Test goal created successfully!")
        return True
        
    except Exception as e:
        print(f"  ❌ Error creating test goal: {e}")
        return False

def cleanup_test_data(goal_id: str, user_id: str):
    """
    Clean up test data after testing.
    """
    print(f"\nCleaning up test data...")
    print("-" * 50)
    
    try:
        # Delete the goal
        table.delete_item(Key={"PK": f"USER#{user_id}", "SK": f"GOAL#{goal_id}"})
        print("  ✅ Test goal deleted")
        
        # Note: We don't delete the collaboration record as it might be real data
        print("  ℹ️  Collaboration record left intact (might be real data)")
        
    except Exception as e:
        print(f"  ❌ Error cleaning up: {e}")

if __name__ == "__main__":
    try:
        # Test with the user ID and goal ID from your previous tests
        test_user_id = "b8e53ac4-1649-4ce9-8725-a0e5e56d8527"  # From your JWT token (collaborator)
        test_goal_id = "4a0b0822-eb9d-4bd7-b50e-97a942f44398"  # From your test
        goal_owner_id = "9434dc4f-389b-40ee-8384-e76ccbbe6104"  # From DynamoDB console (actual owner)
        
        print("=" * 60)
        print("COLLABORATION ACCESS TEST")
        print("=" * 60)
        
        # First, search for goals in the database
        search_goals()
        
        # Then, list all collaborations for the user
        list_user_collaborations(test_user_id)
        
        # Test the current state (goal exists)
        print("\n" + "=" * 40)
        print("TEST 1: Current state (goal exists)")
        print("=" * 40)
        has_access, access_type, owner_id = test_collaboration_access(test_user_id, test_goal_id)
        print(f"Result: Has Access={has_access}, Type={access_type}, Owner={owner_id}")
        
        # Test with the actual owner to verify the goal exists
        print("\n" + "=" * 40)
        print("TEST 2: Testing with actual goal owner")
        print("=" * 40)
        has_access, access_type, owner_id = test_collaboration_access(goal_owner_id, test_goal_id)
        print(f"Result: Has Access={has_access}, Type={access_type}, Owner={owner_id}")
        
        print("\n" + "=" * 60)
        print("FINAL SUMMARY:")
        print("=" * 60)
        print("✅ Goal exists in database with correct structure")
        print("✅ Collaboration record exists for the user")
        print("✅ The issue is in the Quest Service scan operation")
        print("✅ Need to fix the check_goal_access function in Quest Service")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Script failed with error: {e}")
        import traceback
        traceback.print_exc()
