"""
Test database helpers directly.
"""
import sys
import os
from pathlib import Path

# Add the quest service to the path
quest_service_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(quest_service_dir))

def test_database_helpers():
    """Test database helpers directly."""
    try:
        from test_helpers import DatabaseHelpers
        print("Successfully imported DatabaseHelpers")
        
        # Try to create a test quest
        test_user_id = "test_user_12345"
        quest_data = {
            "title": "Test Quest",
            "category": "Health",
            "difficulty": "medium"
        }
        
        print(f"Attempting to create test quest for user: {test_user_id}")
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, quest_data)
        print(f"Successfully created quest with ID: {quest_id}")
        
        return True
    except Exception as e:
        print(f"Error with database helpers: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_database_helpers()
