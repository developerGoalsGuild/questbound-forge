"""
Performance Tests for Goal Progress Calculation
Tests the performance characteristics of progress calculation under various load conditions.
"""

import json
import os
import sys
import pytest
import time
import statistics
import asyncio
import concurrent.futures
from datetime import datetime, timedelta
from typing import List, Dict, Any
from unittest.mock import Mock, patch
from pathlib import Path

# Add the quest-service directory to Python path so we can import app.main
quest_service_dir = Path(__file__).resolve().parent.parent
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

# Set up environment variables before importing app.main
os.environ.setdefault(
    "QUEST_SERVICE_ENV_VARS",
    json.dumps(
        {
            "CORE_TABLE": "gg_core",
            "JWT_AUDIENCE": "api://default",
            "JWT_ISSUER": "https://auth.local",
            "COGNITO_REGION": "us-east-2",
            "COGNITO_USER_POOL_ID": "local-pool",
            "COGNITO_CLIENT_ID": "local-client",
            "ALLOWED_ORIGINS": ["http://localhost:8080"],
        }
    ),
)
os.environ.setdefault("QUEST_SERVICE_JWT_SECRET", "test-secret")

from app.main import compute_goal_progress, get_goal_tasks, calculate_time_progress
from app.models import GoalProgressResponse


class FakeTable:
    """Fake DynamoDB table for performance testing"""
    def __init__(self) -> None:
        self.items: Dict[tuple, Dict] = {}
        self._query_call_count = 0  # Track query calls to help with filtering

    def put_item(self, Item, ConditionExpression=None):  # noqa: N802 - boto interface
        key = (Item["PK"], Item["SK"])
        self.items[key] = Item

    def get_item(self, Key):  # noqa: N802 - boto interface
        key = (Key["PK"], Key["SK"])
        return {"Item": self.items.get(key)}

    def query(self, KeyConditionExpression, FilterExpression=None):  # noqa: N802 - boto interface
        # Simple mock implementation for testing - same as test_progress.py
        results = []
        
        for (pk, sk), item in self.items.items():
            # For our test cases, we expect queries like:
            # 1. USER#test-user with SK starting with TASK# and goalId filter
            # 2. USER#test-user with SK starting with GOAL#
            
            if pk == "USER#test-user":  # Hardcoded for test simplicity
                if sk.startswith("TASK#") and FilterExpression:
                    # Apply goalId filter for tasks - hardcoded goal IDs for performance tests
                    goal_ids = ["perf-test-goal", "goal-1", "goal-2", "goal-3", "goal-4", "goal-5"]
                    if item.get("goalId") in goal_ids:
                        results.append(item)
                elif sk.startswith("GOAL#") and not FilterExpression:
                    # Return goals without filter
                    results.append(item)
        
        return {"Items": results}


class TestProgressPerformance:
    """Test performance characteristics of progress calculation functions"""

    @pytest.fixture
    def large_goal_dataset(self):
        """Create a large dataset for performance testing"""
        now = int(time.time() * 1000)
        deadline = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Create goal with many tasks
        goal = {
            "id": "perf-test-goal",
            "title": "Performance Test Goal",
            "deadline": deadline,
            "createdAt": now - (7 * 24 * 60 * 60 * 1000),  # 7 days ago
            "status": "active"
        }
        
        # Create 1000 tasks with mixed statuses
        tasks = []
        for i in range(1000):
            status = "completed" if i < 300 else "active"  # 30% completion rate
            tasks.append({
                "id": f"task-{i}",
                "goalId": "perf-test-goal",
                "title": f"Performance Test Task {i}",
                "status": status,
                "createdAt": now - (i * 1000),  # Staggered creation times
                "updatedAt": now - (i * 500)
            })
        
        return goal, tasks

    @pytest.fixture
    def mock_table_with_large_dataset(self, large_goal_dataset):
        """Mock DynamoDB table with large dataset"""
        goal, tasks = large_goal_dataset
        
        fake_table = FakeTable()
        
        # Add goal to fake table
        fake_table.put_item({
            "PK": "USER#test-user",
            "SK": f"GOAL#{goal['id']}",
            **goal
        })
        
        # Add tasks to fake table
        for task in tasks:
            fake_table.put_item({
                "PK": "USER#test-user",
                "SK": f"TASK#{task['id']}",
                **task
            })
        
        return fake_table

    def test_single_goal_progress_calculation_performance(self, mock_table_with_large_dataset):
        """Test performance of calculating progress for a single goal with many tasks"""
        
        # Warm up
        compute_goal_progress("perf-test-goal", "test-user", mock_table_with_large_dataset)
        
        # Performance test
        times = []
        iterations = 100
        
        for _ in range(iterations):
            start_time = time.perf_counter()
            result = compute_goal_progress("perf-test-goal", "test-user", mock_table_with_large_dataset)
            end_time = time.perf_counter()
            
            times.append((end_time - start_time) * 1000)  # Convert to milliseconds
            
            # Verify result is correct
            assert isinstance(result, GoalProgressResponse)
            assert result.goalId == "perf-test-goal"
            assert result.completedTasks == 300
            assert result.totalTasks == 1000
            assert result.taskProgress == 30.0
        
        # Analyze performance
        avg_time = statistics.mean(times)
        median_time = statistics.median(times)
        p95_time = sorted(times)[int(len(times) * 0.95)]
        p99_time = sorted(times)[int(len(times) * 0.99)]
        
        print(f"\n📊 Single Goal Progress Calculation Performance (1000 tasks):")
        print(f"   Average: {avg_time:.2f}ms")
        print(f"   Median: {median_time:.2f}ms")
        print(f"   95th percentile: {p95_time:.2f}ms")
        print(f"   99th percentile: {p99_time:.2f}ms")
        
        # Performance requirements
        assert avg_time < 100, f"Average calculation time {avg_time:.2f}ms exceeds 100ms requirement"
        assert p95_time < 200, f"95th percentile {p95_time:.2f}ms exceeds 200ms requirement"

    def test_multiple_goals_progress_calculation_performance(self, mock_table_with_large_dataset):
        """Test performance of calculating progress for multiple goals"""
        
        # Create multiple goals with varying task counts
        goal_configs = [
            ("goal-1", 10),    # Small goal
            ("goal-2", 50),    # Medium goal
            ("goal-3", 200),   # Large goal
            ("goal-4", 500),   # Very large goal
            ("goal-5", 1000),  # Huge goal
        ]
        
        # Create task data for each goal
        goal_tasks = {}
        now = int(time.time() * 1000)
        
        for goal_id, task_count in goal_configs:
            tasks = []
            completed_count = task_count // 3  # 33% completion rate
            for i in range(task_count):
                status = "completed" if i < completed_count else "active"
                tasks.append({
                    "id": f"task-{goal_id}-{i}",
                    "goalId": goal_id,
                    "status": status,
                    "createdAt": now - (i * 1000),
                    "updatedAt": now - (i * 500)
                })
            goal_tasks[goal_id] = tasks
        
        # Mock get_goal_tasks to return the correct tasks for each goal
        def mock_get_goal_tasks(goal_id, user_id, table):
            return goal_tasks.get(goal_id, [])
        
        # Mock table for goal data
        fake_table = FakeTable()
        for goal_id, task_count in goal_configs:
            fake_table.put_item({
                "PK": "USER#test-user",
                "SK": f"GOAL#{goal_id}",
                "id": goal_id,
                "title": f"Test Goal {goal_id}",
                "deadline": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                "createdAt": now - (7 * 24 * 60 * 60 * 1000),
                "status": "active"
            })
        
        # Performance test for multiple goals
        times = []
        iterations = 50
        
        with patch('app.main.get_goal_tasks', side_effect=mock_get_goal_tasks):
            for _ in range(iterations):
                start_time = time.perf_counter()
                
                results = []
                for goal_id, _ in goal_configs:
                    result = compute_goal_progress(goal_id, "test-user", fake_table)
                    results.append(result)
                
                end_time = time.perf_counter()
                times.append((end_time - start_time) * 1000)  # Convert to milliseconds
                
                # Verify results
                assert len(results) == len(goal_configs)
                for i, result in enumerate(results):
                    expected_tasks = goal_configs[i][1]
                    expected_completed = expected_tasks // 3
                    assert result.totalTasks == expected_tasks
                    assert result.completedTasks == expected_completed
        
        # Analyze performance
        avg_time = statistics.mean(times)
        median_time = statistics.median(times)
        p95_time = sorted(times)[int(len(times) * 0.95)]
        
        total_tasks = sum(task_count for _, task_count in goal_configs)
        
        print(f"\n📊 Multiple Goals Progress Calculation Performance:")
        print(f"   Goals: {len(goal_configs)}")
        print(f"   Total tasks: {total_tasks}")
        print(f"   Average: {avg_time:.2f}ms")
        print(f"   Median: {median_time:.2f}ms")
        print(f"   95th percentile: {p95_time:.2f}ms")
        
        # Performance requirements for multiple goals
        assert avg_time < 500, f"Average calculation time {avg_time:.2f}ms exceeds 500ms requirement"
        assert p95_time < 1000, f"95th percentile {p95_time:.2f}ms exceeds 1000ms requirement"

    def test_concurrent_progress_calculations(self, mock_table_with_large_dataset):
        """Test performance under concurrent load"""
        
        def calculate_progress():
            return compute_goal_progress("perf-test-goal", "test-user", mock_table_with_large_dataset)
        
        # Test with different concurrency levels
        concurrency_levels = [1, 5, 10, 20]
        
        for concurrency in concurrency_levels:
            times = []
            iterations = 10
            
            for _ in range(iterations):
                start_time = time.perf_counter()
                
                # Run concurrent calculations
                with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
                    futures = [executor.submit(calculate_progress) for _ in range(concurrency)]
                    results = [future.result() for future in concurrent.futures.as_completed(futures)]
                
                end_time = time.perf_counter()
                times.append((end_time - start_time) * 1000)  # Convert to milliseconds
                
                # Verify all results are correct
                assert len(results) == concurrency
                for result in results:
                    assert isinstance(result, GoalProgressResponse)
                    assert result.goalId == "perf-test-goal"
            
            avg_time = statistics.mean(times)
            throughput = (concurrency * 1000) / avg_time  # Calculations per second
            
            print(f"\n📊 Concurrent Performance (Concurrency: {concurrency}):")
            print(f"   Average time: {avg_time:.2f}ms")
            print(f"   Throughput: {throughput:.1f} calculations/second")
            
            # Performance requirements should scale reasonably
            expected_max_time = 200 * (concurrency / 5)  # Allow some degradation with higher concurrency
            assert avg_time < expected_max_time, f"Concurrent performance degraded too much: {avg_time:.2f}ms"

    def test_memory_usage_during_calculation(self, mock_table_with_large_dataset):
        """Test memory usage patterns during progress calculation"""
        try:
            import psutil
            import os
        except ImportError:
            pytest.skip("psutil not available - skipping memory usage test")
        
        process = psutil.Process(os.getpid())
        
        # Baseline memory
        baseline_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Run calculations and monitor memory
        memory_samples = []
        iterations = 100
        
        for i in range(iterations):
            result = compute_goal_progress("perf-test-goal", "test-user", mock_table_with_large_dataset)
            
            if i % 10 == 0:  # Sample every 10 iterations
                current_memory = process.memory_info().rss / 1024 / 1024  # MB
                memory_samples.append(current_memory - baseline_memory)
        
        max_memory_increase = max(memory_samples)
        avg_memory_increase = statistics.mean(memory_samples)
        
        print(f"\n📊 Memory Usage Analysis:")
        print(f"   Baseline memory: {baseline_memory:.1f}MB")
        print(f"   Average increase: {avg_memory_increase:.1f}MB")
        print(f"   Maximum increase: {max_memory_increase:.1f}MB")
        
        # Memory requirements
        assert max_memory_increase < 50, f"Memory usage increased by {max_memory_increase:.1f}MB, exceeds 50MB limit"
        assert avg_memory_increase < 20, f"Average memory increase {avg_memory_increase:.1f}MB exceeds 20MB limit"

    def test_time_calculation_performance(self):
        """Test performance of time-based progress calculation"""
        
        # Create goals with different time ranges
        now = int(time.time() * 1000)
        goals = []
        
        for days_ago in [1, 7, 30, 90, 365]:  # Different goal ages
            for days_remaining in [1, 7, 30, 90, 365]:  # Different remaining times
                goal = {
                    "createdAt": now - (days_ago * 24 * 60 * 60 * 1000),
                    "deadline": (datetime.now() + timedelta(days=days_remaining)).strftime('%Y-%m-%d')
                }
                goals.append(goal)
        
        # Performance test
        times = []
        iterations = 1000
        
        for _ in range(iterations):
            start_time = time.perf_counter()
            
            for goal in goals:
                time_progress = calculate_time_progress(goal)
                assert 0 <= time_progress <= 100
            
            end_time = time.perf_counter()
            times.append((end_time - start_time) * 1000)  # Convert to milliseconds
        
        avg_time = statistics.mean(times)
        calculations_per_iteration = len(goals)
        avg_time_per_calculation = avg_time / calculations_per_iteration
        
        print(f"\n📊 Time Calculation Performance:")
        print(f"   Goals per iteration: {calculations_per_iteration}")
        print(f"   Average time per iteration: {avg_time:.3f}ms")
        print(f"   Average time per calculation: {avg_time_per_calculation:.3f}ms")
        
        # Performance requirements
        assert avg_time_per_calculation < 0.1, f"Time calculation too slow: {avg_time_per_calculation:.3f}ms per calculation"

    def test_database_query_performance_simulation(self):
        """Simulate database query performance under different data sizes"""
        
        # Simulate different query response times
        query_scenarios = [
            ("Small dataset (< 100 items)", 10, 0.005),    # 5ms
            ("Medium dataset (100-500 items)", 50, 0.015),  # 15ms
            ("Large dataset (500-1000 items)", 100, 0.030), # 30ms
            ("Very large dataset (1000+ items)", 200, 0.050) # 50ms
        ]
        
        for scenario_name, iterations, simulated_delay in query_scenarios:
            times = []
            
            for _ in range(iterations):
                start_time = time.perf_counter()
                
                # Simulate database query delay
                time.sleep(simulated_delay)
                
                # Simulate progress calculation after query
                # (This would be the actual calculation time)
                dummy_calculation = sum(range(1000))  # Simulate some CPU work
                
                end_time = time.perf_counter()
                times.append((end_time - start_time) * 1000)  # Convert to milliseconds
            
            avg_time = statistics.mean(times)
            expected_time = simulated_delay * 1000  # Convert to milliseconds
            
            print(f"\n📊 {scenario_name}:")
            print(f"   Simulated query delay: {expected_time:.1f}ms")
            print(f"   Average total time: {avg_time:.1f}ms")
            print(f"   Calculation overhead: {avg_time - expected_time:.1f}ms")
            
            # Verify calculation overhead is minimal
            calculation_overhead = avg_time - expected_time
            assert calculation_overhead < 5, f"Calculation overhead {calculation_overhead:.1f}ms too high"

    @pytest.mark.parametrize("task_count", [10, 50, 100, 500, 1000, 5000])
    def test_scalability_with_task_count(self, task_count):
        """Test how performance scales with different task counts"""
        
        # Create mock table with specified task count
        mock_table = Mock()
        
        goal = {
            "id": f"scale-test-goal-{task_count}",
            "title": f"Scale Test Goal {task_count}",
            "deadline": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            "createdAt": int(time.time() * 1000) - (7 * 24 * 60 * 60 * 1000),
            "status": "active"
        }
        
        tasks = []
        completed_count = task_count // 2  # 50% completion rate
        for i in range(task_count):
            status = "completed" if i < completed_count else "active"
            tasks.append({
                "id": f"task-{i}",
                "goalId": goal["id"],
                "status": status
            })
        
        mock_table.get_item.return_value = {"Item": goal}
        mock_table.query.return_value = {"Items": tasks}
        
        # Performance measurement
        times = []
        iterations = max(10, 100 // (task_count // 100 + 1))  # Fewer iterations for larger datasets
        
        for _ in range(iterations):
            start_time = time.perf_counter()
            result = compute_goal_progress(goal["id"], "test-user", mock_table)
            end_time = time.perf_counter()
            
            times.append((end_time - start_time) * 1000)  # Convert to milliseconds
            
            # Verify correctness
            assert result.totalTasks == task_count
            assert result.completedTasks == completed_count
            assert result.taskProgress == 50.0
        
        avg_time = statistics.mean(times)
        time_per_task = avg_time / task_count if task_count > 0 else 0
        
        print(f"\n📊 Scalability Test (Tasks: {task_count}):")
        print(f"   Average time: {avg_time:.2f}ms")
        print(f"   Time per task: {time_per_task:.4f}ms")
        
        # Performance should scale reasonably (not exponentially)
        if task_count <= 1000:
            assert avg_time < 100, f"Performance degraded too much with {task_count} tasks: {avg_time:.2f}ms"
        else:
            # Allow more time for very large datasets
            assert avg_time < 500, f"Performance degraded too much with {task_count} tasks: {avg_time:.2f}ms"
        
        # Time per task should remain relatively constant (linear scaling)
        assert time_per_task < 0.1, f"Time per task too high: {time_per_task:.4f}ms"


class TestProgressPerformanceIntegration:
    """Integration performance tests that simulate real-world scenarios"""

    def test_dashboard_load_performance(self):
        """Test performance of loading dashboard with multiple goals"""
        
        # Simulate dashboard scenario: 10 goals with varying task counts
        goals_data = [
            ("goal-1", 5, 2),    # 5 tasks, 2 completed
            ("goal-2", 10, 7),   # 10 tasks, 7 completed
            ("goal-3", 3, 3),    # 3 tasks, 3 completed
            ("goal-4", 15, 5),   # 15 tasks, 5 completed
            ("goal-5", 8, 4),    # 8 tasks, 4 completed
            ("goal-6", 20, 12),  # 20 tasks, 12 completed
            ("goal-7", 2, 0),    # 2 tasks, 0 completed
            ("goal-8", 12, 8),   # 12 tasks, 8 completed
            ("goal-9", 6, 6),    # 6 tasks, 6 completed
            ("goal-10", 25, 10), # 25 tasks, 10 completed
        ]
        
        # Setup mock table
        mock_table = Mock()
        
        def mock_get_item(Key):
            goal_id = Key["SK"].replace("GOAL#", "")
            for gid, total_tasks, completed_tasks in goals_data:
                if gid == goal_id:
                    return {
                        "Item": {
                            "id": goal_id,
                            "title": f"Dashboard Goal {goal_id}",
                            "deadline": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                            "createdAt": int(time.time() * 1000) - (7 * 24 * 60 * 60 * 1000),
                            "status": "active"
                        }
                    }
            return {}
        
        def mock_query(**kwargs):
            filter_expr = str(kwargs.get("FilterExpression", ""))
            for goal_id, total_tasks, completed_tasks in goals_data:
                if goal_id in filter_expr:
                    tasks = []
                    for i in range(total_tasks):
                        status = "completed" if i < completed_tasks else "active"
                        tasks.append({
                            "id": f"task-{goal_id}-{i}",
                            "goalId": goal_id,
                            "status": status
                        })
                    return {"Items": tasks}
            return {"Items": []}
        
        mock_table.get_item.side_effect = mock_get_item
        mock_table.query.side_effect = mock_query
        
        # Simulate dashboard load
        times = []
        iterations = 20
        
        for _ in range(iterations):
            start_time = time.perf_counter()
            
            # Calculate progress for all goals (simulating dashboard load)
            results = []
            for goal_id, _, _ in goals_data:
                result = compute_goal_progress(goal_id, "test-user", mock_table)
                results.append(result)
            
            end_time = time.perf_counter()
            times.append((end_time - start_time) * 1000)  # Convert to milliseconds
            
            # Verify results
            assert len(results) == len(goals_data)
        
        avg_time = statistics.mean(times)
        total_goals = len(goals_data)
        total_tasks = sum(total for _, total, _ in goals_data)
        
        print(f"\n📊 Dashboard Load Performance:")
        print(f"   Goals: {total_goals}")
        print(f"   Total tasks: {total_tasks}")
        print(f"   Average load time: {avg_time:.2f}ms")
        print(f"   Time per goal: {avg_time / total_goals:.2f}ms")
        
        # Dashboard should load quickly
        assert avg_time < 200, f"Dashboard load too slow: {avg_time:.2f}ms"

    def test_real_time_update_performance(self):
        """Test performance of progress updates when tasks are completed"""
        
        # Simulate real-time scenario: user completes tasks and progress updates
        mock_table = Mock()
        
        goal = {
            "id": "realtime-goal",
            "title": "Real-time Test Goal",
            "deadline": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            "createdAt": int(time.time() * 1000) - (7 * 24 * 60 * 60 * 1000),
            "status": "active"
        }
        
        # Start with 10 tasks, none completed
        tasks = []
        for i in range(10):
            tasks.append({
                "id": f"realtime-task-{i}",
                "goalId": "realtime-goal",
                "status": "active"
            })
        
        mock_table.get_item.return_value = {"Item": goal}
        
        # Simulate completing tasks one by one
        update_times = []
        
        for completed_count in range(11):  # 0 to 10 completed tasks
            # Update task statuses
            for i in range(completed_count):
                tasks[i]["status"] = "completed"
            
            mock_table.query.return_value = {"Items": tasks.copy()}
            
            # Measure progress calculation time
            start_time = time.perf_counter()
            result = compute_goal_progress("realtime-goal", "test-user", mock_table)
            end_time = time.perf_counter()
            
            update_times.append((end_time - start_time) * 1000)  # Convert to milliseconds
            
            # Verify progress is correct
            expected_progress = (completed_count / 10) * 100 if completed_count > 0 else 0
            assert result.completedTasks == completed_count
            assert result.totalTasks == 10
            assert abs(result.taskProgress - expected_progress) < 0.01
        
        avg_update_time = statistics.mean(update_times)
        max_update_time = max(update_times)
        
        print(f"\n📊 Real-time Update Performance:")
        print(f"   Average update time: {avg_update_time:.2f}ms")
        print(f"   Maximum update time: {max_update_time:.2f}ms")
        print(f"   Updates tested: {len(update_times)}")
        
        # Real-time updates should be very fast
        assert avg_update_time < 50, f"Real-time updates too slow: {avg_update_time:.2f}ms"
        assert max_update_time < 100, f"Slowest update too slow: {max_update_time:.2f}ms"


if __name__ == "__main__":
    # Run performance tests with detailed output
    pytest.main([__file__, "-v", "-s", "--tb=short"])
