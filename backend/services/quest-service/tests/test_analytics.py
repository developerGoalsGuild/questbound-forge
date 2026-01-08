"""
Unit tests for Quest Analytics functionality.

This module tests all analytics calculation functions, data models,
and database operations with comprehensive test coverage.
"""

import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from typing import List, Dict, Any, Optional

# Import the modules to test
from app.models.analytics import (
    QuestAnalytics, TrendDataPoint, CategoryPerformance, 
    HourlyProductivity, AnalyticsPeriod, calculate_ttl,
    is_analytics_expired, get_analytics_period_days,
    format_completion_time, format_success_rate, format_xp
)
from app.analytics.quest_analytics import (
    QuestAnalyticsCalculator, calculate_quest_analytics,
    calculate_analytics_insights
)
from app.db.analytics_db import (
    cache_analytics, get_cached_analytics, invalidate_analytics_cache,
    cleanup_expired_analytics, get_analytics_cache_stats,
    AnalyticsDBError, AnalyticsNotFoundError, AnalyticsExpiredError
)
from app.models.quest import Quest, QuestStatus, QuestDifficulty, QuestKind


class TestAnalyticsModels:
    """Test analytics data models and validation"""
    
    def test_trend_data_point_validation(self):
        """Test TrendDataPoint model validation"""
        # Valid data point
        point = TrendDataPoint(date="2024-01-15", value=0.75)
        assert point.date == "2024-01-15"
        assert point.value == 0.75
        
        # Invalid date format
        with pytest.raises(ValueError, match="Date must be in YYYY-MM-DD format"):
            TrendDataPoint(date="15-01-2024", value=0.75)
        
        # Negative value
        with pytest.raises(ValueError, match="Input should be greater than or equal to 0"):
            TrendDataPoint(date="2024-01-15", value=-0.5)
    
    def test_category_performance_validation(self):
        """Test CategoryPerformance model validation"""
        # Valid category performance
        perf = CategoryPerformance(
            category="Health",
            totalQuests=10,
            completedQuests=8,
            successRate=0.8,
            averageCompletionTime=3600.0,
            xpEarned=400
        )
        assert perf.category == "Health"
        assert perf.successRate == 0.8
        
        # Completed quests exceed total
        with pytest.raises(ValueError, match="Completed quests cannot exceed total quests"):
            CategoryPerformance(
                category="Health",
                totalQuests=5,
                completedQuests=8,
                successRate=0.8,
                averageCompletionTime=3600.0,
                xpEarned=400
            )
        
        # Success rate doesn't match completion rate
        with pytest.raises(ValueError, match="Success rate must match actual completion rate"):
            CategoryPerformance(
                category="Health",
                totalQuests=10,
                completedQuests=8,
                successRate=0.5,  # Should be 0.8
                averageCompletionTime=3600.0,
                xpEarned=400
            )
    
    def test_quest_analytics_validation(self):
        """Test QuestAnalytics model validation"""
        # Valid analytics
        analytics = QuestAnalytics(
            userId="user123",
            period="weekly",
            totalQuests=10,
            completedQuests=8,
            successRate=0.8,
            averageCompletionTime=3600.0,
            bestStreak=5,
            currentStreak=3,
            xpEarned=400,
            trends={
                "completionRate": [TrendDataPoint(date="2024-01-15", value=0.8)]
            },
            categoryPerformance=[],
            productivityByHour=[],
            calculatedAt=int(time.time()),
            ttl=604800
        )
        assert analytics.userId == "user123"
        assert analytics.period == "weekly"
        
        # Current streak exceeds best streak
        with pytest.raises(ValueError, match="Current streak cannot exceed best streak"):
            QuestAnalytics(
                userId="user123",
                period="weekly",
                totalQuests=10,
                completedQuests=8,
                successRate=0.8,
                averageCompletionTime=3600.0,
                bestStreak=3,
                currentStreak=5,  # Exceeds best streak
                xpEarned=400,
                trends={},
                categoryPerformance=[],
                productivityByHour=[],
                calculatedAt=int(time.time()),
                ttl=604800
            )
    
    def test_utility_functions(self):
        """Test utility functions"""
        # TTL calculation
        assert calculate_ttl("daily") == 86400  # 24 hours
        assert calculate_ttl("weekly") == 604800  # 7 days
        assert calculate_ttl("monthly") == 2592000  # 30 days
        assert calculate_ttl("allTime") == 31536000  # 365 days
        
        # Period days
        assert get_analytics_period_days("daily") == 1
        assert get_analytics_period_days("weekly") == 7
        assert get_analytics_period_days("monthly") == 30
        assert get_analytics_period_days("allTime") == 365
        
        # Formatting functions
        assert format_completion_time(30) == "30s"
        assert format_completion_time(90) == "1m"
        assert format_completion_time(3660) == "1h 1m"
        assert format_completion_time(90000) == "1d 1h"
        
        assert format_success_rate(0.75) == "75.0%"
        assert format_success_rate(0.0) == "0.0%"
        
        assert format_xp(500) == "500"
        assert format_xp(1500) == "1.5K"
        assert format_xp(1500000) == "1.5M"
    
    def test_analytics_expiration(self):
        """Test analytics expiration logic"""
        current_time = int(time.time())
        
        # Fresh analytics (not expired)
        fresh_analytics = QuestAnalytics(
            userId="user123",
            period="weekly",
            totalQuests=10,
            completedQuests=8,
            successRate=0.8,
            averageCompletionTime=3600.0,
            bestStreak=5,
            currentStreak=3,
            xpEarned=400,
            trends={},
            categoryPerformance=[],
            productivityByHour=[],
            calculatedAt=current_time - 3600,  # 1 hour ago
            ttl=86400  # 24 hours TTL
        )
        assert not is_analytics_expired(fresh_analytics)
        
        # Expired analytics
        expired_analytics = QuestAnalytics(
            userId="user123",
            period="weekly",
            totalQuests=10,
            completedQuests=8,
            successRate=0.8,
            averageCompletionTime=3600.0,
            bestStreak=5,
            currentStreak=3,
            xpEarned=400,
            trends={},
            categoryPerformance=[],
            productivityByHour=[],
            calculatedAt=current_time - 86400,  # 24 hours ago
            ttl=3600  # 1 hour TTL
        )
        assert is_analytics_expired(expired_analytics)


class TestQuestAnalyticsCalculator:
    """Test analytics calculation logic"""
    
    def create_test_quest(self, quest_id: str, status: str, created_at: int, 
                         completed_at: Optional[int] = None, category: str = "Health",
                         reward_xp: int = 50) -> Quest:
        """Helper to create test quest objects"""
        return Quest(
            id=quest_id,
            userId="user123",
            title=f"Test Quest {quest_id}",
            description="Test quest description",
            category=category,
            difficulty="medium",
            rewardXp=reward_xp,
            tags=[],
            status=status,
            kind="linked",
            privacy="private",
            version=1,
            createdAt=created_at,
            updatedAt=created_at,
            completedAt=completed_at,
            linkedTasks=[],
            quantitativeTasks=[]
        )
    
    def test_empty_analytics(self):
        """Test analytics calculation with no quests"""
        calculator = QuestAnalyticsCalculator("user123", "weekly")
        analytics = calculator.calculate_analytics([])
        
        assert analytics.userId == "user123"
        assert analytics.period == "weekly"
        assert analytics.totalQuests == 0
        assert analytics.completedQuests == 0
        assert analytics.successRate == 0.0
        assert analytics.bestStreak == 0
        assert analytics.currentStreak == 0
        assert analytics.xpEarned == 0
    
    def test_basic_metrics_calculation(self):
        """Test basic metrics calculation"""
        current_time = int(time.time() * 1000)
        # Use timestamps within the last 6 days to ensure they pass the weekly filter
        recent_time = current_time - (6 * 24 * 60 * 60 * 1000)
        
        quests = [
            self.create_test_quest("1", "completed", recent_time + 1000, 
                                 recent_time + 2000, "Health", 50),
            self.create_test_quest("2", "completed", recent_time + 2000, 
                                 recent_time + 3000, "Work", 75),
            self.create_test_quest("3", "active", recent_time + 3000, 
                                 None, "Health", 100),
            self.create_test_quest("4", "failed", recent_time + 4000, 
                                 None, "Work", 25)
        ]
        
        calculator = QuestAnalyticsCalculator("user123", "weekly")
        analytics = calculator.calculate_analytics(quests)
        
        assert analytics.totalQuests == 4
        assert analytics.completedQuests == 2
        assert analytics.successRate == 0.5
        assert analytics.xpEarned == 125  # 50 + 75
        assert analytics.averageCompletionTime == 1.0  # (1000 + 1000) / 2 / 1000 (converted to seconds)
    
    def test_streak_calculation(self):
        """Test streak calculation logic"""
        current_time = int(time.time() * 1000)
        # Use more recent timestamps to ensure current streak calculation works
        base_time = current_time - (5 * 24 * 60 * 60 * 1000)  # 5 days ago
        
        # Create quests with daily completion pattern
        quests = []
        for i in range(5):  # 5 consecutive days of completed quests
            day_time = base_time + (i * 24 * 60 * 60 * 1000)
            quests.append(self.create_test_quest(
                f"day_{i}", "completed", day_time, day_time + 1000
            ))
        
        # Add a gap day (no quests)
        # Then 3 more consecutive days
        for i in range(5, 8):
            day_time = base_time + ((i + 1) * 24 * 60 * 60 * 1000)  # Skip day 5
            quests.append(self.create_test_quest(
                f"day_{i}", "completed", day_time, day_time + 1000
            ))
        
        calculator = QuestAnalyticsCalculator("user123", "allTime")
        analytics = calculator.calculate_analytics(quests)
        
        assert analytics.bestStreak == 5  # First streak of 5 days
        assert analytics.currentStreak == 0  # Current streak is 0 because no quests completed today
    
    def test_category_performance_calculation(self):
        """Test category performance calculation"""
        current_time = int(time.time() * 1000)
        # Use timestamps within the last 6 days to ensure they pass the weekly filter
        recent_time = current_time - (6 * 24 * 60 * 60 * 1000)
        
        quests = [
            # Health category: 2 completed out of 3 total
            self.create_test_quest("h1", "completed", recent_time, 
                                 recent_time + 1000, "Health", 50),
            self.create_test_quest("h2", "completed", recent_time + 1000, 
                                 recent_time + 2000, "Health", 75),
            self.create_test_quest("h3", "active", recent_time + 2000, 
                                 None, "Health", 100),
            
            # Work category: 1 completed out of 2 total
            self.create_test_quest("w1", "completed", recent_time + 3000, 
                                 recent_time + 4000, "Work", 60),
            self.create_test_quest("w2", "failed", recent_time + 4000, 
                                 None, "Work", 40)
        ]
        
        calculator = QuestAnalyticsCalculator("user123", "weekly")
        analytics = calculator.calculate_analytics(quests)
        
        assert len(analytics.categoryPerformance) == 2
        
        # Find Health category
        health_perf = next(cat for cat in analytics.categoryPerformance if cat.category == "Health")
        assert health_perf.totalQuests == 3
        assert health_perf.completedQuests == 2
        assert health_perf.successRate == 2/3
        assert health_perf.xpEarned == 125  # 50 + 75
        
        # Find Work category
        work_perf = next(cat for cat in analytics.categoryPerformance if cat.category == "Work")
        assert work_perf.totalQuests == 2
        assert work_perf.completedQuests == 1
        assert work_perf.successRate == 0.5
        assert work_perf.xpEarned == 60
    
    def test_productivity_by_hour_calculation(self):
        """Test productivity by hour calculation"""
        current_time = int(time.time() * 1000)
        # Use timestamps within the last 6 days to ensure they pass the weekly filter
        base_time = current_time - (6 * 24 * 60 * 60 * 1000)  # 6 days ago
        
        # Create quests completed at different hours
        quests = [
            # Quest completed at 9 AM
            self.create_test_quest("morning", "completed",
                                 base_time, base_time + 1000, "Health", 50),
            # Quest completed at 2 PM
            self.create_test_quest("afternoon", "completed",
                                 base_time + 1000, base_time + 2000, "Work", 75),
            # Quest completed at 9 AM again
            self.create_test_quest("morning2", "completed",
                                 base_time + 2000, base_time + 3000, "Health", 60)
        ]
        
        # Mock datetime to control the hour
        with patch('app.analytics.quest_analytics.datetime') as mock_datetime:
            # Set up mock to return specific hours
            mock_datetime.now.return_value = datetime(2024, 1, 15, 12, 0, 0)  # 12 PM
            mock_datetime.fromtimestamp.side_effect = [
                datetime(2024, 1, 13, 9, 0, 0),   # 9 AM
                datetime(2024, 1, 13, 14, 0, 0),  # 2 PM
                datetime(2024, 1, 13, 9, 0, 0),   # 9 AM
                datetime(2024, 1, 13, 9, 0, 0),   # 9 AM (for streak calculation)
                datetime(2024, 1, 13, 14, 0, 0),  # 2 PM (for streak calculation)
                datetime(2024, 1, 13, 9, 0, 0),   # 9 AM (for streak calculation)
                datetime(2024, 1, 13, 9, 0, 0),   # 9 AM (for trend calculation)
                datetime(2024, 1, 13, 14, 0, 0),  # 2 PM (for trend calculation)
                datetime(2024, 1, 13, 9, 0, 0),   # 9 AM (for trend calculation)
                datetime(2024, 1, 13, 9, 0, 0),   # 9 AM (for productivity calculation)
                datetime(2024, 1, 13, 14, 0, 0),  # 2 PM (for productivity calculation)
                datetime(2024, 1, 13, 9, 0, 0)    # 9 AM (for productivity calculation)
            ]
            
            calculator = QuestAnalyticsCalculator("user123", "weekly")
            analytics = calculator.calculate_analytics(quests)
        
        # Check productivity by hour
        assert len(analytics.productivityByHour) == 24
        
        # Find 9 AM hour (index 9)
        morning_hour = next(h for h in analytics.productivityByHour if h.hour == 9)
        assert morning_hour.questsCompleted == 2
        assert morning_hour.xpEarned == 110  # 50 + 60
        
        # Find 2 PM hour (index 14)
        afternoon_hour = next(h for h in analytics.productivityByHour if h.hour == 14)
        assert afternoon_hour.questsCompleted == 1
        assert afternoon_hour.xpEarned == 75
    
    def test_trend_calculation(self):
        """Test trend data calculation"""
        current_time = int(time.time() * 1000)
        # Use timestamps within the last 6 days to ensure they pass the weekly filter
        base_time = current_time - (6 * 24 * 60 * 60 * 1000)  # 6 days ago
        
        # Create quests over multiple days
        quests = []
        for i in range(5):  # 5 days of quests
            day_time = base_time + (i * 24 * 60 * 60 * 1000)
            # Create 2 quests per day, 1 completed
            quests.append(self.create_test_quest(
                f"day_{i}_1", "completed", day_time, day_time + 1000
            ))
            quests.append(self.create_test_quest(
                f"day_{i}_2", "active", day_time + 1000, None
            ))
        
        calculator = QuestAnalyticsCalculator("user123", "weekly")
        analytics = calculator.calculate_analytics(quests)
        
        # Check trends
        assert "completionRate" in analytics.trends
        assert "xpEarned" in analytics.trends
        assert "questsCreated" in analytics.trends
        
        # Should have 7 days of trend data (including today)
        assert len(analytics.trends["completionRate"]) == 8
        assert len(analytics.trends["xpEarned"]) == 8
        assert len(analytics.trends["questsCreated"]) == 8
        
        # Check that completion rate trends upward
        completion_rates = [point.value for point in analytics.trends["completionRate"]]
        assert completion_rates[0] == 0.0  # First day: 0/0
        assert completion_rates[1] == 0.5  # Second day: 1/2
        assert completion_rates[2] == 0.5  # Third day: 2/4
        assert completion_rates[3] == 0.5  # Fourth day: 3/6
        assert completion_rates[4] == 0.5  # Fifth day: 4/8


class TestAnalyticsInsights:
    """Test analytics insights calculation"""
    
    def test_insights_calculation(self):
        """Test insights calculation from analytics data"""
        # Create mock analytics data
        analytics = QuestAnalytics(
            userId="user123",
            period="weekly",
            totalQuests=10,
            completedQuests=8,
            successRate=0.8,
            averageCompletionTime=3600.0,
            bestStreak=5,
            currentStreak=3,
            xpEarned=400,
            trends={
                "completionRate": [
                    TrendDataPoint(date="2024-01-01", value=0.5),
                    TrendDataPoint(date="2024-01-02", value=0.5),
                    TrendDataPoint(date="2024-01-03", value=0.5),
                    TrendDataPoint(date="2024-01-04", value=0.5),
                    TrendDataPoint(date="2024-01-05", value=0.5),
                    TrendDataPoint(date="2024-01-06", value=0.5),
                    TrendDataPoint(date="2024-01-07", value=0.5),
                    TrendDataPoint(date="2024-01-08", value=0.6),
                    TrendDataPoint(date="2024-01-09", value=0.7),
                    TrendDataPoint(date="2024-01-10", value=0.8),
                    TrendDataPoint(date="2024-01-11", value=0.9),
                    TrendDataPoint(date="2024-01-12", value=0.9),
                    TrendDataPoint(date="2024-01-13", value=0.95),
                    TrendDataPoint(date="2024-01-14", value=0.95)
                ]
            },
            categoryPerformance=[
                CategoryPerformance(
                    category="Health",
                    totalQuests=5,
                    completedQuests=4,
                    successRate=0.8,
                    averageCompletionTime=3000.0,
                    xpEarned=200
                ),
                CategoryPerformance(
                    category="Work",
                    totalQuests=3,
                    completedQuests=3,
                    successRate=1.0,
                    averageCompletionTime=2000.0,
                    xpEarned=150
                )
            ],
            productivityByHour=[
                HourlyProductivity(hour=9, questsCompleted=2, xpEarned=100, averageCompletionTime=3000.0),
                HourlyProductivity(hour=14, questsCompleted=1, xpEarned=50, averageCompletionTime=2000.0)
            ],
            calculatedAt=int(time.time()),
            ttl=604800
        )
        
        insights = calculate_analytics_insights(analytics)
        
        # Check most productive category
        assert "mostProductiveCategory" in insights
        assert insights["mostProductiveCategory"]["category"] == "Work"
        assert insights["mostProductiveCategory"]["successRate"] == 1.0
        
        # Check most productive hour
        assert "mostProductiveHour" in insights
        assert insights["mostProductiveHour"]["hour"] == 9
        assert insights["mostProductiveHour"]["questsCompleted"] == 2
        
        # Check trend analysis
        assert "trend" in insights
        assert insights["trend"] == "improving"  # Recent average > older average
        
        # Check consistency score
        assert "consistencyScore" in insights
        assert insights["consistencyScore"] == 0.5  # bestStreak / totalQuests


class TestAnalyticsDatabase:
    """Test analytics database operations"""
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_cache_analytics_success(self, mock_get_table):
        """Test successful analytics caching"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Create test analytics
        analytics = QuestAnalytics(
            userId="user123",
            period="weekly",
            totalQuests=10,
            completedQuests=8,
            successRate=0.8,
            averageCompletionTime=3600.0,
            bestStreak=5,
            currentStreak=3,
            xpEarned=400,
            trends={},
            categoryPerformance=[],
            productivityByHour=[],
            calculatedAt=int(time.time()),
            ttl=604800
        )
        
        # Test caching
        cache_analytics(analytics)
        
        # Verify put_item was called
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        item = call_args[1]['Item']
        
        assert item['PK'] == 'USER#user123'
        assert item['SK'].startswith('ANALYTICS#weekly#')
        assert item['type'] == 'QuestAnalytics'
        assert item['userId'] == 'user123'
        assert item['totalQuests'] == 10
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_get_cached_analytics_success(self, mock_get_table):
        """Test successful retrieval of cached analytics"""
        # Mock DynamoDB table and response
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        current_time = int(time.time())
        mock_item = {
            'PK': 'USER#user123',
            'SK': 'ANALYTICS#weekly#2024-01-15',
            'userId': 'user123',
            'period': 'weekly',
            'totalQuests': 10,
            'completedQuests': 8,
            'successRate': 0.8,
            'averageCompletionTime': 3600.0,
            'bestStreak': 5,
            'currentStreak': 3,
            'xpEarned': 400,
            'trends': {
                'completionRate': [{'date': '2024-01-15', 'value': 0.8}]
            },
            'categoryPerformance': [],
            'productivityByHour': [],
            'calculatedAt': current_time - 3600,  # 1 hour ago
            'ttl': 604800,
            'expiresAt': current_time + 3600  # Expires in 1 hour
        }
        
        mock_table.get_item.return_value = {'Item': mock_item}
        
        # Test retrieval
        result = get_cached_analytics("user123", "weekly")
        
        # Verify result
        assert result is not None
        assert result.userId == "user123"
        assert result.period == "weekly"
        assert result.totalQuests == 10
        assert result.completedQuests == 8
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_get_cached_analytics_not_found(self, mock_get_table):
        """Test retrieval when analytics not found"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        # Test retrieval
        result = get_cached_analytics("user123", "weekly")
        
        # Verify result
        assert result is None
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_get_cached_analytics_expired(self, mock_get_table):
        """Test retrieval when analytics have expired"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        current_time = int(time.time())
        mock_item = {
            'PK': 'USER#user123',
            'SK': 'ANALYTICS#weekly#2024-01-15',
            'userId': 'user123',
            'period': 'weekly',
            'totalQuests': 10,
            'completedQuests': 8,
            'successRate': 0.8,
            'averageCompletionTime': 3600.0,
            'bestStreak': 5,
            'currentStreak': 3,
            'xpEarned': 400,
            'trends': {},
            'categoryPerformance': [],
            'productivityByHour': [],
            'calculatedAt': current_time - 86400,  # 24 hours ago
            'ttl': 3600,  # 1 hour TTL
            'expiresAt': current_time - 3600  # Expired 1 hour ago
        }
        
        mock_table.get_item.return_value = {'Item': mock_item}
        
        # Test retrieval
        result = get_cached_analytics("user123", "weekly")
        
        # Verify result is None due to expiration
        assert result is None
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_invalidate_analytics_cache_specific_period(self, mock_get_table):
        """Test invalidation of specific period analytics"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Test invalidation
        invalidate_analytics_cache("user123", "weekly")
        
        # Verify delete_item was called with correct key
        mock_table.delete_item.assert_called_once()
        call_args = mock_table.delete_item.call_args
        key = call_args[1]['Key']
        
        assert key['PK'] == 'USER#user123'
        assert key['SK'].startswith('ANALYTICS#weekly#')
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_invalidate_analytics_cache_all_periods(self, mock_get_table):
        """Test invalidation of all periods analytics"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock query response
        mock_table.query.return_value = {
            'Items': [
                {'PK': 'USER#user123', 'SK': 'ANALYTICS#daily#2024-01-15'},
                {'PK': 'USER#user123', 'SK': 'ANALYTICS#weekly#2024-01-15'},
                {'PK': 'USER#user123', 'SK': 'ANALYTICS#monthly#2024-01-15'}
            ]
        }
        
        # Test invalidation
        invalidate_analytics_cache("user123", None)
        
        # Verify query was called
        mock_table.query.assert_called_once()
        
        # Verify delete_item was called for each item
        assert mock_table.delete_item.call_count == 3
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_cleanup_expired_analytics(self, mock_get_table):
        """Test cleanup of expired analytics"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        current_time = int(time.time())
        mock_table.scan.return_value = {
            'Items': [
                {'PK': 'USER#user123', 'SK': 'ANALYTICS#daily#2024-01-15', 'expiresAt': current_time - 3600},
                {'PK': 'USER#user456', 'SK': 'ANALYTICS#weekly#2024-01-15', 'expiresAt': current_time - 7200}
            ]
        }
        
        # Test cleanup
        cleaned_count = cleanup_expired_analytics()
        
        # Verify scan was called
        mock_table.scan.assert_called_once()
        
        # Verify delete_item was called for each expired item
        assert mock_table.delete_item.call_count == 2
        
        # Verify return value
        assert cleaned_count == 2
    
    @patch('app.db.analytics_db._get_dynamodb_table')
    def test_get_analytics_cache_stats(self, mock_get_table):
        """Test analytics cache statistics retrieval"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_get_table.return_value = mock_table
        
        # Mock scan responses
        mock_table.scan.side_effect = [
            {'Count': 100},  # Total items
            {'Count': 20},   # Expired items
            {'Count': 30},   # Daily period
            {'Count': 40},   # Weekly period
            {'Count': 20},   # Monthly period
            {'Count': 10}    # AllTime period
        ]
        
        # Test stats retrieval
        stats = get_analytics_cache_stats()
        
        # Verify scan was called multiple times
        assert mock_table.scan.call_count == 6
        
        # Verify stats
        assert stats['total_items'] == 100
        assert stats['expired_items'] == 20
        assert stats['active_items'] == 80
        assert stats['period_counts']['daily'] == 30
        assert stats['period_counts']['weekly'] == 40
        assert stats['period_counts']['monthly'] == 20
        assert stats['period_counts']['allTime'] == 10
        assert stats['cleanup_needed'] == True


class TestIntegration:
    """Integration tests for analytics functionality"""
    
    def test_full_analytics_workflow(self):
        """Test complete analytics workflow from calculation to caching"""
        # Create test quests
        current_time = int(time.time() * 1000)
        # Use timestamps within the last 6 days to ensure they pass the weekly filter
        recent_time = current_time - (6 * 24 * 60 * 60 * 1000)
        
        quests = [
            Quest(
                id="1",
                userId="user123",
                title="Health Quest",
                description="Exercise daily",
                category="Health",
                difficulty="medium",
                rewardXp=50,
                tags=["fitness"],
                status="completed",
                kind="linked",
                privacy="private",
                version=1,
                createdAt=recent_time,
                updatedAt=recent_time,
                completedAt=recent_time + 3600000,  # 1 hour later
                linkedTasks=[],
                quantitativeTasks=[]
            ),
            Quest(
                id="2",
                userId="user123",
                title="Work Quest",
                description="Complete project",
                category="Work",
                difficulty="hard",
                rewardXp=100,
                tags=["project"],
                status="completed",
                kind="linked",
                privacy="private",
                version=1,
                createdAt=recent_time + 86400000,  # 1 day later
                updatedAt=recent_time + 86400000,
                completedAt=recent_time + 90000000,  # 1 hour later
                linkedTasks=[],
                quantitativeTasks=[]
            ),
            Quest(
                id="3",
                userId="user123",
                title="Learning Quest",
                description="Study new skill",
                category="Learning",
                difficulty="easy",
                rewardXp=25,
                tags=["education"],
                status="active",
                kind="linked",
                privacy="private",
                version=1,
                createdAt=recent_time + 172800000,  # 2 days later
                updatedAt=recent_time + 172800000,
                completedAt=None,
                linkedTasks=[],
                quantitativeTasks=[]
            )
        ]
        
        # Calculate analytics
        analytics = calculate_quest_analytics("user123", "weekly", quests)
        
        # Verify basic metrics
        assert analytics.userId == "user123"
        assert analytics.period == "weekly"
        assert analytics.totalQuests == 3
        assert analytics.completedQuests == 2
        assert analytics.successRate == 2/3
        assert analytics.xpEarned == 150  # 50 + 100
        assert analytics.averageCompletionTime == 3600.0  # 1 hour average
        
        # Verify category performance
        assert len(analytics.categoryPerformance) == 3
        
        health_cat = next(cat for cat in analytics.categoryPerformance if cat.category == "Health")
        assert health_cat.totalQuests == 1
        assert health_cat.completedQuests == 1
        assert health_cat.successRate == 1.0
        assert health_cat.xpEarned == 50
        
        work_cat = next(cat for cat in analytics.categoryPerformance if cat.category == "Work")
        assert work_cat.totalQuests == 1
        assert work_cat.completedQuests == 1
        assert work_cat.successRate == 1.0
        assert work_cat.xpEarned == 100
        
        learning_cat = next(cat for cat in analytics.categoryPerformance if cat.category == "Learning")
        assert learning_cat.totalQuests == 1
        assert learning_cat.completedQuests == 0
        assert learning_cat.successRate == 0.0
        assert learning_cat.xpEarned == 0
        
        # Verify trends
        assert "completionRate" in analytics.trends
        assert "xpEarned" in analytics.trends
        assert "questsCreated" in analytics.trends
        
        # Verify productivity by hour
        assert len(analytics.productivityByHour) == 24
        
        # Verify TTL
        assert analytics.ttl == 604800  # 7 days for weekly period


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
