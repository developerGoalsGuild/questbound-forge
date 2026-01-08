"""
Performance Tests for Quest Operations.

This module tests Quest functionality under load including:
- Concurrent quest creation
- Database query performance
- Memory usage during bulk operations
- Response time benchmarks
- Stress testing
"""

import pytest
import time
import psutil
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from unittest.mock import patch, Mock, MagicMock

# Add the quest-service directory to Python path
import sys
from pathlib import Path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from test_helpers import (
    TestDataHelpers,
    DatabaseHelpers,
    TestClientHelpers
)
from test_data_manager import test_data_manager
from app.db.quest_db import create_quest, list_user_quests
from app.models.quest import QuestCreatePayload

# Import the FastAPI app
import app.main as main_module
app = main_module.app


class TestQuestCreationPerformance:
    """Test performance of quest creation operations."""
    
    def test_concurrent_quest_creation(self, test_user_id):
        """Test concurrent quest creation performance."""
        def create_quest_worker(worker_id):
            """Worker function for concurrent quest creation."""
            try:
                payload = QuestCreatePayload(
                    title=f"Concurrent Quest {worker_id}",
                    category="Health",
                    difficulty="medium"
                )
                
                quest = create_quest(test_user_id, payload)
                
                # Track for cleanup
                test_data_manager.track_test_item(
                    "quest", quest.id, test_user_id,
                    f"USER#{test_user_id}", f"QUEST#{quest.id}"
                )
                
                return {
                    "success": True,
                    "quest_id": quest.id,
                    "worker_id": worker_id
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "worker_id": worker_id
                }
        
        # Test with 10 concurrent workers
        num_workers = 10
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [
                executor.submit(create_quest_worker, i) 
                for i in range(num_workers)
            ]
            
            results = []
            for future in as_completed(futures):
                results.append(future.result())
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Verify results
        successful_results = [r for r in results if r["success"]]
        failed_results = [r for r in results if not r["success"]]
        
        print(f"Concurrent quest creation: {len(successful_results)}/{num_workers} successful")
        print(f"Execution time: {execution_time:.2f} seconds")
        print(f"Average time per quest: {execution_time/num_workers:.2f} seconds")
        
        # Assertions
        assert len(successful_results) >= num_workers * 0.8  # At least 80% success rate
        assert execution_time < 30  # Should complete within 30 seconds
        assert len(failed_results) == 0  # No failures expected in normal conditions
    
    def test_quest_creation_response_time(self, test_user_id):
        """Test quest creation response time benchmarks."""
        response_times = []
        num_tests = 20
        
        for i in range(num_tests):
            start_time = time.time()
            
            payload = QuestCreatePayload(
                title=f"Response Time Test Quest {i}",
                category="Health",
                difficulty="medium"
            )
            
            quest = create_quest(test_user_id, payload)
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest.id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest.id}"
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            response_times.append(response_time)
        
        # Calculate statistics
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        
        print(f"Quest creation response times:")
        print(f"  Average: {avg_response_time:.3f} seconds")
        print(f"  Maximum: {max_response_time:.3f} seconds")
        print(f"  Minimum: {min_response_time:.3f} seconds")
        
        # Assertions
        assert avg_response_time < 2.0  # Average should be under 2 seconds
        assert max_response_time < 5.0  # Maximum should be under 5 seconds
        assert min_response_time > 0.0  # Should be positive
    
    def test_quest_creation_memory_usage(self, test_user_id):
        """Test memory usage during quest creation."""
        initial_memory = psutil.Process().memory_info().rss
        memory_samples = [initial_memory]
        
        num_quests = 50
        
        for i in range(num_quests):
            payload = QuestCreatePayload(
                title=f"Memory Test Quest {i}",
                category="Health",
                difficulty="medium"
            )
            
            quest = create_quest(test_user_id, payload)
            
            # Track for cleanup
            test_data_manager.track_test_item(
                "quest", quest.id, test_user_id,
                f"USER#{test_user_id}", f"QUEST#{quest.id}"
            )
            
            # Sample memory every 10 quests
            if i % 10 == 0:
                current_memory = psutil.Process().memory_info().rss
                memory_samples.append(current_memory)
        
        final_memory = psutil.Process().memory_info().rss
        memory_increase = final_memory - initial_memory
        
        print(f"Memory usage during quest creation:")
        print(f"  Initial memory: {initial_memory / 1024 / 1024:.2f} MB")
        print(f"  Final memory: {final_memory / 1024 / 1024:.2f} MB")
        print(f"  Memory increase: {memory_increase / 1024 / 1024:.2f} MB")
        print(f"  Memory per quest: {memory_increase / num_quests / 1024:.2f} KB")
        
        # Assertions
        assert memory_increase < 100 * 1024 * 1024  # Less than 100MB increase
        assert memory_increase / num_quests < 1024 * 1024  # Less than 1MB per quest


class TestQuestQueryPerformance:
    """Test performance of quest query operations."""
    
    def test_quest_listing_performance(self, test_user_id):
        """Test quest listing performance with large datasets."""
        # Create many quests first
        num_quests = 100
        quest_ids = []
        
        print(f"Creating {num_quests} quests for performance testing...")
        
        for i in range(num_quests):
            quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                "title": f"Performance Test Quest {i}",
                "category": "Health",
                "difficulty": "medium"
            })
            quest_ids.append(quest_id)
        
        # Test quest listing performance
        start_time = time.time()
        quests = list_user_quests(test_user_id)
        end_time = time.time()
        
        query_time = end_time - start_time
        
        print(f"Quest listing performance:")
        print(f"  Quests found: {len(quests)}")
        print(f"  Query time: {query_time:.3f} seconds")
        print(f"  Time per quest: {query_time/len(quests):.6f} seconds")
        
        # Assertions
        assert len(quests) >= num_quests  # Should find all quests
        assert query_time < 5.0  # Should complete within 5 seconds
        assert query_time / len(quests) < 0.1  # Less than 0.1 seconds per quest
    
    def test_quest_filtering_performance(self, test_user_id):
        """Test quest filtering performance."""
        # Create quests with different categories
        categories = ["Health", "Work", "Personal", "Learning"]
        quests_per_category = 25
        
        for category in categories:
            for i in range(quests_per_category):
                DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                    "title": f"{category} Quest {i}",
                    "category": category,
                    "difficulty": "medium"
                })
        
        # Test filtering by category
        start_time = time.time()
        health_quests = list_user_quests(test_user_id, status="draft")  # All should be draft
        end_time = time.time()
        
        filter_time = end_time - start_time
        
        print(f"Quest filtering performance:")
        print(f"  Total quests: {len(health_quests)}")
        print(f"  Filter time: {filter_time:.3f} seconds")
        
        # Assertions
        assert len(health_quests) >= quests_per_category * len(categories)
        assert filter_time < 3.0  # Should complete within 3 seconds
    
    def test_concurrent_quest_queries(self, test_user_id):
        """Test concurrent quest query performance."""
        # Create some quests first
        for i in range(20):
            DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                "title": f"Concurrent Query Test Quest {i}",
                "category": "Health",
                "difficulty": "medium"
            })
        
        def query_quests_worker(worker_id):
            """Worker function for concurrent quest queries."""
            start_time = time.time()
            quests = list_user_quests(test_user_id)
            end_time = time.time()
            
            return {
                "worker_id": worker_id,
                "quest_count": len(quests),
                "query_time": end_time - start_time
            }
        
        # Test with 10 concurrent queries
        num_workers = 10
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [
                executor.submit(query_quests_worker, i) 
                for i in range(num_workers)
            ]
            
            results = []
            for future in as_completed(futures):
                results.append(future.result())
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Calculate statistics
        query_times = [r["query_time"] for r in results]
        avg_query_time = sum(query_times) / len(query_times)
        max_query_time = max(query_times)
        
        print(f"Concurrent quest queries:")
        print(f"  Workers: {num_workers}")
        print(f"  Total time: {total_time:.3f} seconds")
        print(f"  Average query time: {avg_query_time:.3f} seconds")
        print(f"  Maximum query time: {max_query_time:.3f} seconds")
        
        # Assertions
        assert all(r["quest_count"] >= 20 for r in results)  # All should find quests
        assert avg_query_time < 2.0  # Average should be under 2 seconds
        assert max_query_time < 5.0  # Maximum should be under 5 seconds
        assert total_time < 10.0  # Total should be under 10 seconds


class TestQuestUpdatePerformance:
    """Test performance of quest update operations."""
    
    def test_bulk_quest_updates(self, test_user_id):
        """Test performance of bulk quest updates."""
        # Create quests first
        num_quests = 50
        quest_ids = []
        
        for i in range(num_quests):
            quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                "title": f"Bulk Update Test Quest {i}",
                "category": "Health",
                "difficulty": "medium"
            })
            quest_ids.append(quest_id)
        
        # Test bulk updates
        start_time = time.time()
        
        for i, quest_id in enumerate(quest_ids):
            from app.db.quest_db import update_quest
            from app.models.quest import QuestUpdatePayload
            
            update_payload = QuestUpdatePayload(
                title=f"Updated Quest {i}",
                difficulty="hard",
                rewardXp=100
            )
            
            update_quest(test_user_id, quest_id, update_payload, 1)
        
        end_time = time.time()
        update_time = end_time - start_time
        
        print(f"Bulk quest updates:")
        print(f"  Quests updated: {num_quests}")
        print(f"  Total time: {update_time:.3f} seconds")
        print(f"  Time per update: {update_time/num_quests:.3f} seconds")
        
        # Assertions
        assert update_time < 30  # Should complete within 30 seconds
        assert update_time / num_quests < 1.0  # Less than 1 second per update
    
    def test_concurrent_quest_updates(self, test_user_id):
        """Test concurrent quest update performance."""
        # Create quests first
        num_quests = 20
        quest_ids = []
        
        for i in range(num_quests):
            quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                "title": f"Concurrent Update Test Quest {i}",
                "category": "Health",
                "difficulty": "medium"
            })
            quest_ids.append(quest_id)
        
        def update_quest_worker(quest_id, worker_id):
            """Worker function for concurrent quest updates."""
            try:
                from app.db.quest_db import update_quest
                from app.models.quest import QuestUpdatePayload
                
                update_payload = QuestUpdatePayload(
                    title=f"Concurrent Update {worker_id}",
                    difficulty="hard"
                )
                
                start_time = time.time()
                quest = update_quest(test_user_id, quest_id, update_payload, 1)
                end_time = time.time()
                
                return {
                    "success": True,
                    "quest_id": quest_id,
                    "worker_id": worker_id,
                    "update_time": end_time - start_time
                }
            except Exception as e:
                return {
                    "success": False,
                    "quest_id": quest_id,
                    "worker_id": worker_id,
                    "error": str(e)
                }
        
        # Test with 10 concurrent workers
        num_workers = 10
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [
                executor.submit(update_quest_worker, quest_ids[i % len(quest_ids)], i) 
                for i in range(num_workers)
            ]
            
            results = []
            for future in as_completed(futures):
                results.append(future.result())
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Calculate statistics
        successful_results = [r for r in results if r["success"]]
        failed_results = [r for r in results if not r["success"]]
        
        if successful_results:
            update_times = [r["update_time"] for r in successful_results]
            avg_update_time = sum(update_times) / len(update_times)
            max_update_time = max(update_times)
        else:
            avg_update_time = 0
            max_update_time = 0
        
        print(f"Concurrent quest updates:")
        print(f"  Workers: {num_workers}")
        print(f"  Successful: {len(successful_results)}")
        print(f"  Failed: {len(failed_results)}")
        print(f"  Total time: {total_time:.3f} seconds")
        print(f"  Average update time: {avg_update_time:.3f} seconds")
        print(f"  Maximum update time: {max_update_time:.3f} seconds")
        
        # Assertions
        assert len(successful_results) >= num_workers * 0.5  # At least 50% success rate
        assert total_time < 20  # Should complete within 20 seconds
        if successful_results:
            assert avg_update_time < 2.0  # Average should be under 2 seconds


class TestQuestMemoryPerformance:
    """Test memory usage during Quest operations."""
    
    def test_memory_usage_during_bulk_operations(self, test_user_id):
        """Test memory usage during bulk operations."""
        initial_memory = psutil.Process().memory_info().rss
        memory_samples = []
        
        # Create many quests
        num_quests = 100
        quest_ids = []
        
        for i in range(num_quests):
            quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                "title": f"Memory Test Quest {i}",
                "category": "Health",
                "difficulty": "medium"
            })
            quest_ids.append(quest_id)
            
            # Sample memory every 20 quests
            if i % 20 == 0:
                current_memory = psutil.Process().memory_info().rss
                memory_samples.append(current_memory)
        
        # Query all quests
        quests = list_user_quests(test_user_id)
        query_memory = psutil.Process().memory_info().rss
        
        # Update all quests
        for quest_id in quest_ids[:50]:  # Update first 50
            from app.db.quest_db import update_quest
            from app.models.quest import QuestUpdatePayload
            
            update_payload = QuestUpdatePayload(title=f"Updated {quest_id}")
            update_quest(test_user_id, quest_id, update_payload, 1)
        
        final_memory = psutil.Process().memory_info().rss
        
        # Calculate memory usage
        creation_memory_increase = memory_samples[-1] - initial_memory
        query_memory_increase = query_memory - memory_samples[-1]
        total_memory_increase = final_memory - initial_memory
        
        print(f"Memory usage during bulk operations:")
        print(f"  Initial memory: {initial_memory / 1024 / 1024:.2f} MB")
        print(f"  After creation: {memory_samples[-1] / 1024 / 1024:.2f} MB")
        print(f"  After query: {query_memory / 1024 / 1024:.2f} MB")
        print(f"  Final memory: {final_memory / 1024 / 1024:.2f} MB")
        print(f"  Creation increase: {creation_memory_increase / 1024 / 1024:.2f} MB")
        print(f"  Query increase: {query_memory_increase / 1024 / 1024:.2f} MB")
        print(f"  Total increase: {total_memory_increase / 1024 / 1024:.2f} MB")
        
        # Assertions
        assert total_memory_increase < 200 * 1024 * 1024  # Less than 200MB total increase
        assert creation_memory_increase < 100 * 1024 * 1024  # Less than 100MB for creation
        assert query_memory_increase < 50 * 1024 * 1024  # Less than 50MB for query
    
    def test_memory_cleanup_after_operations(self, test_user_id):
        """Test that memory is properly cleaned up after operations."""
        initial_memory = psutil.Process().memory_info().rss
        
        # Perform operations
        quest_ids = []
        for i in range(50):
            quest_id = DatabaseHelpers.create_test_quest_in_db(test_user_id, {
                "title": f"Cleanup Test Quest {i}",
                "category": "Health",
                "difficulty": "medium"
            })
            quest_ids.append(quest_id)
        
        # Query quests
        quests = list_user_quests(test_user_id)
        
        # Update some quests
        for quest_id in quest_ids[:25]:
            from app.db.quest_db import update_quest
            from app.models.quest import QuestUpdatePayload
            
            update_payload = QuestUpdatePayload(title=f"Updated {quest_id}")
            update_quest(test_user_id, quest_id, update_payload, 1)
        
        peak_memory = psutil.Process().memory_info().rss
        
        # Force garbage collection
        import gc
        gc.collect()
        
        # Wait a bit for cleanup
        time.sleep(1)
        
        final_memory = psutil.Process().memory_info().rss
        
        memory_increase = final_memory - initial_memory
        peak_increase = peak_memory - initial_memory
        
        print(f"Memory cleanup test:")
        print(f"  Initial memory: {initial_memory / 1024 / 1024:.2f} MB")
        print(f"  Peak memory: {peak_memory / 1024 / 1024:.2f} MB")
        print(f"  Final memory: {final_memory / 1024 / 1024:.2f} MB")
        print(f"  Peak increase: {peak_increase / 1024 / 1024:.2f} MB")
        print(f"  Final increase: {memory_increase / 1024 / 1024:.2f} MB")
        print(f"  Cleanup efficiency: {((peak_increase - memory_increase) / peak_increase * 100):.1f}%")
        
        # Assertions
        assert memory_increase < 100 * 1024 * 1024  # Less than 100MB final increase
        assert memory_increase < peak_increase * 0.8  # At least 20% cleanup


class TestQuestStressTesting:
    """Stress testing for Quest operations."""
    
    def test_quest_creation_stress_test(self, test_user_id):
        """Stress test quest creation with high load."""
        def create_quest_stress_worker(worker_id, num_quests):
            """Worker function for stress testing quest creation."""
            results = []
            
            for i in range(num_quests):
                try:
                    start_time = time.time()
                    
                    payload = QuestCreatePayload(
                        title=f"Stress Test Quest {worker_id}-{i}",
                        category="Health",
                        difficulty="medium"
                    )
                    
                    quest = create_quest(test_user_id, payload)
                    
                    # Track for cleanup
                    test_data_manager.track_test_item(
                        "quest", quest.id, test_user_id,
                        f"USER#{test_user_id}", f"QUEST#{quest.id}"
                    )
                    
                    end_time = time.time()
                    results.append({
                        "success": True,
                        "quest_id": quest.id,
                        "creation_time": end_time - start_time
                    })
                    
                except Exception as e:
                    results.append({
                        "success": False,
                        "error": str(e),
                        "worker_id": worker_id,
                        "quest_index": i
                    })
            
            return results
        
        # Stress test with 5 workers, 20 quests each
        num_workers = 5
        quests_per_worker = 20
        total_quests = num_workers * quests_per_worker
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [
                executor.submit(create_quest_stress_worker, i, quests_per_worker) 
                for i in range(num_workers)
            ]
            
            all_results = []
            for future in as_completed(futures):
                all_results.extend(future.result())
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Calculate statistics
        successful_results = [r for r in all_results if r["success"]]
        failed_results = [r for r in all_results if not r["success"]]
        
        if successful_results:
            creation_times = [r["creation_time"] for r in successful_results]
            avg_creation_time = sum(creation_times) / len(creation_times)
            max_creation_time = max(creation_times)
        else:
            avg_creation_time = 0
            max_creation_time = 0
        
        print(f"Quest creation stress test:")
        print(f"  Workers: {num_workers}")
        print(f"  Quests per worker: {quests_per_worker}")
        print(f"  Total quests: {total_quests}")
        print(f"  Successful: {len(successful_results)}")
        print(f"  Failed: {len(failed_results)}")
        print(f"  Total time: {total_time:.3f} seconds")
        print(f"  Quests per second: {len(successful_results)/total_time:.2f}")
        print(f"  Average creation time: {avg_creation_time:.3f} seconds")
        print(f"  Maximum creation time: {max_creation_time:.3f} seconds")
        
        # Assertions
        assert len(successful_results) >= total_quests * 0.8  # At least 80% success rate
        assert total_time < 60  # Should complete within 60 seconds
        assert len(successful_results) / total_time > 1.0  # At least 1 quest per second
