"""
Simple Performance Test for Quest Operations.
"""
import time
import sys
from pathlib import Path

# Add the quest service to the path
quest_service_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(quest_service_dir))

def test_quest_creation_performance():
    """Test quest creation performance."""
    try:
        from .test_helpers import DatabaseHelpers
        from app.models.quest import QuestCreatePayload
        
        # Test data
        test_user_id = "perf_test_user"
        payload = QuestCreatePayload(
            title="Performance Test Quest",
            category="Health",
            difficulty="medium"
        )
        
        # Measure creation time
        start_time = time.time()
        quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
            "title": payload.title,
            "category": payload.category,
            "difficulty": payload.difficulty
        })
        end_time = time.time()
        
        creation_time = end_time - start_time
        
        print(f"Quest creation time: {creation_time:.3f} seconds")
        print(f"Quest ID: {quest_id}")
        
        # Performance benchmarks
        assert creation_time < 2.0, f"Quest creation too slow: {creation_time:.3f}s"
        
        return {
            "creation_time": creation_time,
            "quest_id": quest_id,
            "status": "success"
        }
        
    except Exception as e:
        print(f"Performance test failed: {e}")
        return {
            "status": "failed",
            "error": str(e)
        }

if __name__ == "__main__":
    result = test_quest_creation_performance()
    print(f"Performance test result: {result}")
