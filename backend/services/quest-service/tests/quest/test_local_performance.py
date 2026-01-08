"""
Local Performance Tests for Quest Database Operations.

This module tests quest database performance using local DynamoDB
without AWS SSO dependencies.
"""

import time
import threading
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any
import sys
from pathlib import Path

# Add the quest service to the path
quest_service_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(quest_service_dir))

from fake_quest_service import FakeQuestService
from app.models.quest import QuestCreatePayload

class QuestPerformanceTester:
    """Test quest database performance with local DynamoDB."""
    
    def __init__(self):
        self.service = FakeQuestService()
        self.results = []
    
    def test_single_quest_creation(self, iterations: int = 10) -> Dict[str, Any]:
        """Test single quest creation performance."""
        print(f"Testing single quest creation ({iterations} iterations)...")
        
        durations = []
        successes = 0
        errors = 0
        
        for i in range(iterations):
            user_id = f"perf_user_{i}"
            payload = QuestCreatePayload(
                title=f"Performance Test Quest {i}",
                category="Health",
                difficulty="medium",
                description=f"Test quest {i} for performance testing"
            )
            
            result = self.service.create_quest(user_id, payload)
            
            if result['status'] == 'success':
                durations.append(result['duration'])
                successes += 1
            else:
                errors += 1
                print(f"Error in iteration {i}: {result.get('error', 'Unknown error')}")
        
        return {
            'operation': 'single_quest_creation',
            'iterations': iterations,
            'successes': successes,
            'errors': errors,
            'success_rate': (successes / iterations) * 100,
            'durations': durations,
            'avg_duration': statistics.mean(durations) if durations else 0,
            'min_duration': min(durations) if durations else 0,
            'max_duration': max(durations) if durations else 0,
            'median_duration': statistics.median(durations) if durations else 0,
            'std_deviation': statistics.stdev(durations) if len(durations) > 1 else 0
        }
    
    def test_concurrent_quest_creation(self, concurrent_users: int = 5, quests_per_user: int = 10) -> Dict[str, Any]:
        """Test concurrent quest creation performance."""
        print(f"Testing concurrent quest creation ({concurrent_users} users, {quests_per_user} quests each)...")
        
        def create_quests_for_user(user_id: str, quest_count: int) -> List[Dict[str, Any]]:
            """Create multiple quests for a single user."""
            results = []
            for i in range(quest_count):
                payload = QuestCreatePayload(
                    title=f"Concurrent Quest {i} for {user_id}",
                    category="Work",
                    difficulty="hard",
                    description=f"Concurrent test quest {i}"
                )
                
                result = self.service.create_quest(user_id, payload)
                results.append(result)
            
            return results
        
        start_time = time.time()
        all_results = []
        
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            # Submit tasks for each user
            futures = []
            for user_id in range(concurrent_users):
                future = executor.submit(
                    create_quests_for_user, 
                    f"concurrent_user_{user_id}", 
                    quests_per_user
                )
                futures.append(future)
            
            # Collect results
            for future in as_completed(futures):
                user_results = future.result()
                all_results.extend(user_results)
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Analyze results
        durations = [r['duration'] for r in all_results if r['status'] == 'success']
        successes = sum(1 for r in all_results if r['status'] == 'success')
        errors = sum(1 for r in all_results if r['status'] == 'error')
        total_operations = len(all_results)
        
        return {
            'operation': 'concurrent_quest_creation',
            'concurrent_users': concurrent_users,
            'quests_per_user': quests_per_user,
            'total_operations': total_operations,
            'successes': successes,
            'errors': errors,
            'success_rate': (successes / total_operations) * 100,
            'total_duration': total_duration,
            'operations_per_second': total_operations / total_duration if total_duration > 0 else 0,
            'durations': durations,
            'avg_duration': statistics.mean(durations) if durations else 0,
            'min_duration': min(durations) if durations else 0,
            'max_duration': max(durations) if durations else 0,
            'median_duration': statistics.median(durations) if durations else 0,
            'std_deviation': statistics.stdev(durations) if len(durations) > 1 else 0
        }
    
    def test_quest_read_operations(self, quest_count: int = 50) -> Dict[str, Any]:
        """Test quest read operations performance."""
        print(f"Testing quest read operations ({quest_count} quests)...")
        
        # First, create some quests to read
        user_id = "read_test_user"
        quest_ids = []
        
        for i in range(quest_count):
            payload = QuestCreatePayload(
                title=f"Read Test Quest {i}",
                category="Fitness",
                difficulty="easy",
                description=f"Quest for read testing {i}"
            )
            
            result = self.service.create_quest(user_id, payload)
            if result['status'] == 'success':
                quest_ids.append(result['quest_id'])
        
        print(f"Created {len(quest_ids)} quests for read testing")
        
        # Test individual quest reads
        read_durations = []
        read_successes = 0
        
        for quest_id in quest_ids:
            result = self.service.get_quest(user_id, quest_id)
            if result['status'] == 'success':
                read_durations.append(result['duration'])
                read_successes += 1
        
        # Test list quests
        list_result = self.service.list_user_quests(user_id, limit=quest_count)
        
        return {
            'operation': 'quest_read_operations',
            'quest_count': quest_count,
            'individual_reads': {
                'successes': read_successes,
                'errors': len(quest_ids) - read_successes,
                'success_rate': (read_successes / len(quest_ids)) * 100 if quest_ids else 0,
                'durations': read_durations,
                'avg_duration': statistics.mean(read_durations) if read_durations else 0,
                'min_duration': min(read_durations) if read_durations else 0,
                'max_duration': max(read_durations) if read_durations else 0,
                'median_duration': statistics.median(read_durations) if read_durations else 0
            },
            'list_operation': {
                'duration': list_result['duration'],
                'status': list_result['status'],
                'quests_returned': list_result['count']
            }
        }
    
    def test_quest_update_operations(self, quest_count: int = 20) -> Dict[str, Any]:
        """Test quest update operations performance."""
        print(f"Testing quest update operations ({quest_count} quests)...")
        
        # First, create some quests to update
        user_id = "update_test_user"
        quest_ids = []
        
        for i in range(quest_count):
            payload = QuestCreatePayload(
                title=f"Update Test Quest {i}",
                category="Learning",
                difficulty="medium",
                description=f"Quest for update testing {i}"
            )
            
            result = self.service.create_quest(user_id, payload)
            if result['status'] == 'success':
                quest_ids.append(result['quest_id'])
        
        print(f"Created {len(quest_ids)} quests for update testing")
        
        # Test status updates
        update_durations = []
        update_successes = 0
        statuses = ['active', 'completed', 'cancelled', 'failed']
        
        for i, quest_id in enumerate(quest_ids):
            status = statuses[i % len(statuses)]
            result = self.service.update_quest_status(user_id, quest_id, status)
            
            if result['status'] == 'success':
                update_durations.append(result['duration'])
                update_successes += 1
        
        return {
            'operation': 'quest_update_operations',
            'quest_count': quest_count,
            'successes': update_successes,
            'errors': len(quest_ids) - update_successes,
            'success_rate': (update_successes / len(quest_ids)) * 100 if quest_ids else 0,
            'durations': update_durations,
            'avg_duration': statistics.mean(update_durations) if update_durations else 0,
            'min_duration': min(update_durations) if update_durations else 0,
            'max_duration': max(update_durations) if update_durations else 0,
            'median_duration': statistics.median(update_durations) if update_durations else 0
        }
    
    def test_quest_delete_operations(self, quest_count: int = 20) -> Dict[str, Any]:
        """Test quest delete operations performance."""
        print(f"Testing quest delete operations ({quest_count} quests)...")
        
        # First, create some quests to delete
        user_id = "delete_test_user"
        quest_ids = []
        
        for i in range(quest_count):
            payload = QuestCreatePayload(
                title=f"Delete Test Quest {i}",
                category="Personal",
                difficulty="hard",
                description=f"Quest for delete testing {i}"
            )
            
            result = self.service.create_quest(user_id, payload)
            if result['status'] == 'success':
                quest_ids.append(result['quest_id'])
        
        print(f"Created {len(quest_ids)} quests for delete testing")
        
        # Test deletions
        delete_durations = []
        delete_successes = 0
        
        for quest_id in quest_ids:
            result = self.service.delete_quest(user_id, quest_id)
            
            if result['status'] == 'success':
                delete_durations.append(result['duration'])
                delete_successes += 1
        
        return {
            'operation': 'quest_delete_operations',
            'quest_count': quest_count,
            'successes': delete_successes,
            'errors': len(quest_ids) - delete_successes,
            'success_rate': (delete_successes / len(quest_ids)) * 100 if quest_ids else 0,
            'durations': delete_durations,
            'avg_duration': statistics.mean(delete_durations) if delete_durations else 0,
            'min_duration': min(delete_durations) if delete_durations else 0,
            'max_duration': max(delete_durations) if delete_durations else 0,
            'median_duration': statistics.median(delete_durations) if delete_durations else 0
        }
    
    def run_all_performance_tests(self) -> Dict[str, Any]:
        """Run all performance tests."""
        print("Starting Quest Database Performance Tests...")
        print("=" * 60)
        
        all_results = {}
        
        # Test 1: Single quest creation
        all_results['single_creation'] = self.test_single_quest_creation(iterations=20)
        
        # Test 2: Concurrent quest creation
        all_results['concurrent_creation'] = self.test_concurrent_quest_creation(
            concurrent_users=5, 
            quests_per_user=10
        )
        
        # Test 3: Read operations
        all_results['read_operations'] = self.test_quest_read_operations(quest_count=30)
        
        # Test 4: Update operations
        all_results['update_operations'] = self.test_quest_update_operations(quest_count=15)
        
        # Test 5: Delete operations
        all_results['delete_operations'] = self.test_quest_delete_operations(quest_count=15)
        
        return all_results
    
    def print_performance_report(self, results: Dict[str, Any]):
        """Print a comprehensive performance report."""
        print("\n" + "=" * 60)
        print("QUEST DATABASE PERFORMANCE REPORT")
        print("=" * 60)
        
        for test_name, result in results.items():
            print(f"\n{test_name.upper().replace('_', ' ')}")
            print("-" * 40)
            
            if 'success_rate' in result:
                print(f"Success Rate: {result['success_rate']:.1f}%")
                print(f"Successes: {result['successes']}")
                print(f"Errors: {result['errors']}")
            
            if 'avg_duration' in result:
                print(f"Average Duration: {result['avg_duration']:.3f}s")
                print(f"Min Duration: {result['min_duration']:.3f}s")
                print(f"Max Duration: {result['max_duration']:.3f}s")
                print(f"Median Duration: {result['median_duration']:.3f}s")
                if 'std_deviation' in result:
                    print(f"Std Deviation: {result['std_deviation']:.3f}s")
            
            if 'operations_per_second' in result:
                print(f"Operations/Second: {result['operations_per_second']:.2f}")
            
            if 'total_duration' in result:
                print(f"Total Duration: {result['total_duration']:.3f}s")
        
        print("\n" + "=" * 60)
        print("PERFORMANCE SUMMARY")
        print("=" * 60)
        
        # Calculate overall metrics
        all_durations = []
        total_operations = 0
        total_successes = 0
        
        for result in results.values():
            if 'durations' in result:
                all_durations.extend(result['durations'])
            if 'successes' in result:
                total_successes += result['successes']
            if 'total_operations' in result:
                total_operations += result['total_operations']
            elif 'iterations' in result:
                total_operations += result['iterations']
        
        if all_durations:
            print(f"Overall Average Duration: {statistics.mean(all_durations):.3f}s")
            print(f"Overall Min Duration: {min(all_durations):.3f}s")
            print(f"Overall Max Duration: {max(all_durations):.3f}s")
            print(f"Overall Median Duration: {statistics.median(all_durations):.3f}s")
        
        if total_operations > 0:
            print(f"Total Operations: {total_operations}")
            print(f"Total Successes: {total_successes}")
            print(f"Overall Success Rate: {(total_successes / total_operations) * 100:.1f}%")

def main():
    """Main function to run performance tests."""
    tester = QuestPerformanceTester()
    
    try:
        results = tester.run_all_performance_tests()
        tester.print_performance_report(results)
        
        # Save results to file
        import json
        with open('quest_performance_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"\nDetailed results saved to: quest_performance_results.json")
        
    except Exception as e:
        print(f"Performance testing failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
