"""
Test cleanup process to identify the credential issue.
"""
import sys
from pathlib import Path

# Add the quest service to the path
quest_service_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(quest_service_dir))

def test_cleanup_process():
    """Test the cleanup process to see if it causes credential issues."""
    try:
        from .test_data_manager import test_data_manager
        print("Successfully imported test_data_manager")
        
        # Track some test data
        test_data_manager.track_test_item("quest", "test_quest_123", "test_user_123")
        print("Successfully tracked test item")
        
        # Try cleanup
        print("Attempting cleanup...")
        test_data_manager.cleanup_all_quest_test_data()
        print("Cleanup completed successfully")
        
        return True
    except Exception as e:
        print(f"Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_cleanup_process()
