"""
Test quest database access directly.
"""
import sys
import os
from pathlib import Path

# Add the quest service to the path
quest_service_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(quest_service_dir))

def test_quest_db_access():
    """Test direct access to quest database functions."""
    try:
        from app.db.quest_db import _get_dynamodb_table
        print("Successfully imported quest_db module")
        
        table = _get_dynamodb_table()
        print(f"Successfully got DynamoDB table: {table.table_name}")
        
        # Try a simple scan
        response = table.scan(Limit=1)
        print(f"Successfully scanned table. Item count: {response.get('Count', 0)}")
        
        return True
    except Exception as e:
        print(f"Error accessing quest database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_quest_db_access()
