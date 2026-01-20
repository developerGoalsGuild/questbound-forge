#!/usr/bin/env python3
"""
AWS script to delete all data for a user from DynamoDB.
Takes email as a parameter and deletes all associated user data.

Usage:
    python delete_user_data.py <email> [--table-name gg_core] [--region us-east-1] [--dry-run]

Example:
    python delete_user_data.py user@example.com
    python delete_user_data.py user@example.com --dry-run  # Preview without deleting
    python delete_user_data.py user@example.com --table-name gg_core --region us-east-1
"""

import boto3
import sys
import argparse
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError, MissingDependencyException
from typing import List, Dict, Optional, Set
import time


class UserDataDeleter:
    """Handles deletion of all user data from DynamoDB."""
    
    def __init__(self, table_name: str = "gg_core", region: str = "us-east-1", dry_run: bool = False):
        self.table_name = table_name
        self.region = region
        self.dry_run = dry_run
        self.dynamodb = None
        self.table = None
        self.deleted_count = 0
        self.errors = []
        
    def _ensure_connection(self):
        """Lazy initialization of DynamoDB connection."""
        if self.dynamodb is None:
            try:
                # Try to create resource - this might fail if credentials are missing or CRT is required
                self.dynamodb = boto3.resource('dynamodb', region_name=self.region)
                self.table = self.dynamodb.Table(self.table_name)
            except MissingDependencyException as e:
                error_msg = str(e)
                print(f"❌ Missing AWS dependency: {error_msg}")
                if 'botocore[crt]' in error_msg or 'crt' in error_msg.lower():
                    print("\n💡 Solution options:")
                    print("   1. Install the required dependency:")
                    print("      pip install 'botocore[crt]'")
                    print("\n   2. OR use standard AWS credentials instead of SSO/login:")
                    print("      aws configure")
                    print("      # Enter your AWS Access Key ID and Secret Access Key")
                    print("\n   3. OR set environment variables:")
                    print("      export AWS_ACCESS_KEY_ID=your_access_key")
                    print("      export AWS_SECRET_ACCESS_KEY=your_secret_key")
                    print("      export AWS_DEFAULT_REGION=us-east-1")
                else:
                    print(f"\n   Please install the required dependency: {error_msg}")
                raise
            except ImportError as e:
                print(f"❌ Missing required dependency: {e}")
                print("   Please install boto3: pip install boto3")
                raise
            except Exception as e:
                error_str = str(e)
                # Check if it's a credential-related error
                if 'credentials' in error_str.lower() or 'authentication' in error_str.lower():
                    print(f"❌ AWS credentials error: {e}")
                    print("\n💡 Please configure AWS credentials:")
                    print("   Option 1: Run 'aws configure' and enter your credentials")
                    print("   Option 2: Set environment variables:")
                    print("     export AWS_ACCESS_KEY_ID=your_access_key")
                    print("     export AWS_SECRET_ACCESS_KEY=your_secret_key")
                    print("     export AWS_DEFAULT_REGION=us-east-1")
                else:
                    print(f"❌ Error connecting to DynamoDB: {e}")
                    print("   Make sure AWS credentials are configured (aws configure)")
                raise
            
            # Test connection by describing table (this will fail if credentials are wrong)
            try:
                self.table.meta.client.describe_table(TableName=self.table_name)
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                if error_code == 'ResourceNotFoundException':
                    print(f"❌ Table '{self.table_name}' not found in region '{self.region}'")
                    print(f"   Please verify the table name and region are correct")
                    raise
                elif error_code in ('UnrecognizedClientException', 'InvalidClientTokenId', 'NotAuthorized', 'AccessDeniedException'):
                    print(f"❌ AWS credentials not configured or invalid")
                    print("   Please run: aws configure")
                    print("   Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables")
                    raise
                else:
                    # Don't raise for other errors during connection test - might be permissions
                    pass
        
    def find_user_by_email(self, email: str) -> Optional[str]:
        """
        Find user ID by email using GSI3.
        
        Returns:
            User ID if found, None otherwise
        """
        self._ensure_connection()
        try:
            print(f"🔍 Looking up user by email: {email}")
            response = self.table.query(
                IndexName="GSI3",
                KeyConditionExpression=Key("GSI3PK").eq(f"EMAIL#{email}"),
                ConsistentRead=False
            )
            
            items = response.get('Items', [])
            if not items:
                print(f"❌ No user found with email: {email}")
                return None
            
            # Get the user ID from the profile item
            for item in items:
                if item.get('SK', '').startswith('PROFILE#'):
                    user_id = item.get('id') or item.get('SK', '').replace('PROFILE#', '')
                    print(f"✅ Found user ID: {user_id}")
                    return user_id
            
            # Fallback: extract from SK
            if items:
                user_id = items[0].get('SK', '').replace('PROFILE#', '')
                print(f"✅ Found user ID (from SK): {user_id}")
                return user_id
                
            return None
            
        except ClientError as e:
            print(f"❌ Error looking up user: {e}")
            self.errors.append(f"Lookup error: {e}")
            return None
    
    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile to extract nickname and other info."""
        self._ensure_connection()
        try:
            response = self.table.get_item(
                Key={
                    'PK': f'USER#{user_id}',
                    'SK': f'PROFILE#{user_id}'
                }
            )
            return response.get('Item')
        except ClientError as e:
            print(f"⚠️  Warning: Could not fetch profile: {e}")
            return None
    
    def query_all_user_items(self, user_id: str) -> List[Dict]:
        """
        Query all items for a user using GSI1.
        This includes profile, goals, tasks, quests, follows, counters, etc.
        """
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'IndexName': 'GSI1',
                    'KeyConditionExpression': Key('GSI1PK').eq(f'USER#{user_id}'),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
        except ClientError as e:
            print(f"❌ Error querying user items: {e}")
            self.errors.append(f"Query error: {e}")
        
        return items
    
    def query_direct_user_items(self, user_id: str) -> List[Dict]:
        """
        Query items directly with PK=USER#<userId>.
        This catches items that might not be in GSI1.
        """
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'KeyConditionExpression': Key('PK').eq(f'USER#{user_id}'),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
        except ClientError as e:
            print(f"❌ Error querying direct user items: {e}")
            self.errors.append(f"Direct query error: {e}")
        
        return items
    
    def query_email_items(self, email: str) -> List[Dict]:
        """Query all items related to the email."""
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'KeyConditionExpression': Key('PK').eq(f'EMAIL#{email}'),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
        except ClientError as e:
            print(f"⚠️  Warning querying email items: {e}")
        
        return items
    
    def query_nickname_items(self, nickname: str) -> List[Dict]:
        """Query all items related to the nickname.
        
        This includes:
        1. Items with GSI2PK=NICK#<nickname> (user profiles with this nickname)
        2. Items with PK=NICK#<nickname> (nickname uniqueness lock)
        """
        self._ensure_connection()
        items = []
        
        # Query GSI2 for items with this nickname
        last_evaluated_key = None
        try:
            while True:
                query_params = {
                    'IndexName': 'GSI2',
                    'KeyConditionExpression': Key("GSI2PK").eq(f"NICK#{nickname}"),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
        except ClientError as e:
            print(f"⚠️  Warning querying nickname items via GSI2: {e}")
        
        # Also query directly for nickname uniqueness lock (PK=NICK#<nickname>)
        try:
            direct_query_params = {
                'KeyConditionExpression': Key('PK').eq(f'NICK#{nickname}'),
                'ConsistentRead': False
            }
            direct_response = self.table.query(**direct_query_params)
            direct_items = direct_response.get('Items', [])
            
            # Add items that aren't already in the list (avoid duplicates)
            existing_pks = {(item.get('PK'), item.get('SK')) for item in items}
            for item in direct_items:
                pk = item.get('PK')
                sk = item.get('SK')
                if pk and sk and (pk, sk) not in existing_pks:
                    items.append(item)
        except ClientError as e:
            print(f"⚠️  Warning querying nickname items directly: {e}")
        
        return items
    
    def query_follower_items(self, user_id: str) -> List[Dict]:
        """
        Query items where this user is followed by others.
        These are stored with GSI1PK=USER#<userId> and GSI1SK=FOLLOWER#<followerId>
        Note: These items have PK=USER#<followerId> and SK=FOLLOWING#<userId>
        """
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'IndexName': 'GSI1',
                    'KeyConditionExpression': (
                        Key('GSI1PK').eq(f'USER#{user_id}') & 
                        Key('GSI1SK').begins_with('FOLLOWER#')
                    ),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
        except ClientError as e:
            print(f"⚠️  Warning querying follower items: {e}")
        
        return items
    
    def query_group_memberships(self, user_id: str) -> List[Dict]:
        """
        Query group memberships for this user.
        These are stored with GSI1PK=USER#<userId> and GSI1SK=ENTITY#Group#
        Note: These items have PK=GROUP#<groupId> and SK=MEMBER#<userId>
        """
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'IndexName': 'GSI1',
                    'KeyConditionExpression': (
                        Key('GSI1PK').eq(f'USER#{user_id}') & 
                        Key('GSI1SK').begins_with('ENTITY#Group#')
                    ),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
        except ClientError as e:
            print(f"⚠️  Warning querying group memberships: {e}")
        
        return items
    
    def query_activity_items(self, user_id: str) -> List[Dict]:
        """
        Query activity items created by this user.
        These are stored with PK=ACTIVITY#<userId>
        """
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'KeyConditionExpression': Key('PK').eq(f'ACTIVITY#{user_id}'),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
        except ClientError as e:
            print(f"⚠️  Warning querying activity items: {e}")
        
        return items
    
    def query_feed_items(self, user_id: str) -> List[Dict]:
        """
        Query feed items for this user.
        These are stored with PK=FEED#<userId>
        """
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'KeyConditionExpression': Key('PK').eq(f'FEED#{user_id}'),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
        except ClientError as e:
            print(f"⚠️  Warning querying feed items: {e}")
        
        return items
    
    def query_promo_items(self, user_id: str) -> List[Dict]:
        """
        Query promotion items for this user.
        These are stored with PK=PROMO#<userId>
        """
        self._ensure_connection()
        items = []
        last_evaluated_key = None
        
        try:
            while True:
                query_params = {
                    'KeyConditionExpression': Key('PK').eq(f'PROMO#{user_id}'),
                    'ConsistentRead': False
                }
                
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                
                response = self.table.query(**query_params)
                items.extend(response.get('Items', []))
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
        except ClientError as e:
            print(f"⚠️  Warning querying promo items: {e}")
        
        return items
    
    def collect_all_items_to_delete(self, email: str, user_id: str, nickname: Optional[str] = None) -> Set[tuple]:
        """
        Collect all items that need to be deleted.
        Returns a set of (PK, SK) tuples.
        """
        items_to_delete = set()
        
        print(f"\n📋 Collecting all items to delete for user {user_id}...")
        
        # 1. All items with PK=USER#<userId>
        print("  • Querying direct user items (PK=USER#<userId>)...")
        direct_items = self.query_direct_user_items(user_id)
        for item in direct_items:
            pk = item.get('PK')
            sk = item.get('SK')
            if pk and sk:
                items_to_delete.add((pk, sk))
        print(f"    Found {len(direct_items)} direct user items")
        
        # 2. All items from GSI1 (user-owned listings)
        # Note: Only include items where PK actually starts with USER#<userId>
        # Some GSI1 items might be references (like GROUP memberships) with different PKs
        print("  • Querying user-owned items via GSI1...")
        gsi1_items = self.query_all_user_items(user_id)
        user_pk_prefix = f'USER#{user_id}'
        gsi1_user_items = 0
        for item in gsi1_items:
            pk = item.get('PK')
            sk = item.get('SK')
            # Only delete items that actually belong to this user
            if pk and sk and pk.startswith(user_pk_prefix):
                items_to_delete.add((pk, sk))
                gsi1_user_items += 1
        print(f"    Found {gsi1_user_items} user-owned GSI1 items")
        
        # 3. Email-related items
        print(f"  • Querying email-related items (EMAIL#{email})...")
        email_items = self.query_email_items(email)
        for item in email_items:
            pk = item.get('PK')
            sk = item.get('SK')
            if pk and sk:
                items_to_delete.add((pk, sk))
        print(f"    Found {len(email_items)} email-related items")
        
        # 4. Nickname-related items (if nickname exists)
        if nickname:
            print(f"  • Querying nickname-related items (NICK#{nickname})...")
            nick_items = self.query_nickname_items(nickname)
            for item in nick_items:
                pk = item.get('PK')
                sk = item.get('SK')
                if pk and sk:
                    items_to_delete.add((pk, sk))
            print(f"    Found {len(nick_items)} nickname-related items")
        
        # 5. Activity items
        print("  • Querying activity items...")
        activity_items = self.query_activity_items(user_id)
        for item in activity_items:
            pk = item.get('PK')
            sk = item.get('SK')
            if pk and sk:
                items_to_delete.add((pk, sk))
        print(f"    Found {len(activity_items)} activity items")
        
        # 6. Feed items
        print("  • Querying feed items...")
        feed_items = self.query_feed_items(user_id)
        for item in feed_items:
            pk = item.get('PK')
            sk = item.get('SK')
            if pk and sk:
                items_to_delete.add((pk, sk))
        print(f"    Found {len(feed_items)} feed items")
        
        # 7. Promotion items
        print("  • Querying promotion items...")
        promo_items = self.query_promo_items(user_id)
        for item in promo_items:
            pk = item.get('PK')
            sk = item.get('SK')
            if pk and sk:
                items_to_delete.add((pk, sk))
        print(f"    Found {len(promo_items)} promotion items")
        
        # Note: Follower items where user is followed by others are already in GSI1
        # But we need to handle items where user follows others (PK=USER#<userId>, SK=FOLLOWING#<otherId>)
        # These are already included in query_direct_user_items above, so we don't need a separate query
        
        # Group memberships: Items where PK=GROUP#<groupId> and SK=MEMBER#<userId>
        # These should be deleted, but we need to query them separately
        print("  • Querying group memberships...")
        group_items = self.query_group_memberships(user_id)
        group_member_count = 0
        for item in group_items:
            pk = item.get('PK')
            sk = item.get('SK')
            # Group membership items have PK=GROUP#<groupId>, SK=MEMBER#<userId>
            if pk and sk and sk.startswith(f'MEMBER#{user_id}'):
                items_to_delete.add((pk, sk))
                group_member_count += 1
        print(f"    Found {group_member_count} group membership items")
        
        print(f"\n✅ Total unique items to delete: {len(items_to_delete)}")
        return items_to_delete
    
    def batch_delete_items(self, items_to_delete: Set[tuple]) -> int:
        """
        Delete items in batches of 25 (DynamoDB batch_write limit).
        Returns the number of successfully deleted items.
        """
        if self.dry_run:
            print(f"\n🔍 DRY RUN MODE - Would delete {len(items_to_delete)} items:")
            # Show first 50 items, then summarize
            sorted_items = sorted(items_to_delete)
            for pk, sk in sorted_items[:50]:
                print(f"  • PK={pk}, SK={sk}")
            if len(sorted_items) > 50:
                print(f"  ... and {len(sorted_items) - 50} more items")
            return len(items_to_delete)
        
        self._ensure_connection()
        items_list = list(items_to_delete)
        deleted = 0
        batch_size = 25
        
        print(f"\n🗑️  Deleting {len(items_list)} items in batches of {batch_size}...")
        
        for i in range(0, len(items_list), batch_size):
            batch = items_list[i:i + batch_size]
            
            # Prepare batch write request
            with self.table.batch_writer() as batch_writer:
                for pk, sk in batch:
                    try:
                        batch_writer.delete_item(
                            Key={
                                'PK': pk,
                                'SK': sk
                            }
                        )
                        deleted += 1
                        if deleted % 50 == 0:
                            print(f"  Deleted {deleted}/{len(items_list)} items...")
                    except ClientError as e:
                        error_msg = f"Error deleting PK={pk}, SK={sk}: {e}"
                        print(f"  ❌ {error_msg}")
                        self.errors.append(error_msg)
            
            # Small delay to avoid throttling
            if i + batch_size < len(items_list):
                time.sleep(0.1)
        
        print(f"\n✅ Successfully deleted {deleted} items")
        return deleted
    
    def delete_user_data(self, email: str) -> bool:
        """
        Main method to delete all user data.
        
        Returns:
            True if successful, False otherwise
        """
        print(f"\n{'='*60}")
        print(f"🚀 Starting user data deletion")
        print(f"{'='*60}")
        print(f"Email: {email}")
        print(f"Table: {self.table_name}")
        print(f"Region: {self.region}")
        print(f"Dry Run: {self.dry_run}")
        print(f"{'='*60}\n")
        
        # Step 1: Find user ID
        user_id = self.find_user_by_email(email)
        if not user_id:
            print("\n❌ Cannot proceed without user ID")
            return False
        
        # Step 2: Get user profile to extract nickname
        profile = self.get_user_profile(user_id)
        nickname = None
        if profile:
            nickname = profile.get('nickname')
            print(f"📝 User nickname: {nickname if nickname else 'None'}")
        
        # Step 3: Collect all items to delete
        items_to_delete = self.collect_all_items_to_delete(email, user_id, nickname)
        
        if not items_to_delete:
            print("\n✅ No items found to delete")
            return True
        
        # Step 4: Confirm deletion (unless dry run)
        if not self.dry_run:
            print(f"\n⚠️  WARNING: About to delete {len(items_to_delete)} items!")
            response = input("Type 'DELETE' to confirm: ")
            if response != 'DELETE':
                print("❌ Deletion cancelled")
                return False
        
        # Step 5: Delete items
        deleted_count = self.batch_delete_items(items_to_delete)
        
        # Step 6: Summary
        print(f"\n{'='*60}")
        print(f"📊 Deletion Summary")
        print(f"{'='*60}")
        print(f"Items deleted: {deleted_count}")
        if self.errors:
            print(f"Errors encountered: {len(self.errors)}")
            for error in self.errors[:10]:  # Show first 10 errors
                print(f"  • {error}")
            if len(self.errors) > 10:
                print(f"  ... and {len(self.errors) - 10} more errors")
        print(f"{'='*60}\n")
        
        return len(self.errors) == 0


def main():
    parser = argparse.ArgumentParser(
        description='Delete all user data from DynamoDB by email',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview deletion (dry run)
  python delete_user_data.py user@example.com --dry-run
  
  # Delete user data
  python delete_user_data.py user@example.com
  
  # Delete with custom table and region
  python delete_user_data.py user@example.com --table-name gg_core --region us-east-1
        """
    )
    
    parser.add_argument(
        'email',
        type=str,
        help='Email address of the user to delete'
    )
    
    parser.add_argument(
        '--table-name',
        type=str,
        default='gg_core',
        help='DynamoDB table name (default: gg_core)'
    )
    
    parser.add_argument(
        '--region',
        type=str,
        default='us-east-1',
        help='AWS region (default: us-east-1)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview what would be deleted without actually deleting'
    )
    
    args = parser.parse_args()
    
    # Validate email format
    if '@' not in args.email:
        print(f"❌ Invalid email format: {args.email}")
        sys.exit(1)
    
    # Create deleter and execute
    deleter = UserDataDeleter(
        table_name=args.table_name,
        region=args.region,
        dry_run=args.dry_run
    )
    
    success = deleter.delete_user_data(args.email)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
