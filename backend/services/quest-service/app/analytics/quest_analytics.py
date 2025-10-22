"""
Quest Analytics calculation functions for GoalsGuild.

This module provides comprehensive analytics calculations for quest data
including completion rates, trends, category performance, and productivity patterns.
All calculations are optimized for performance and accuracy.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import time
import math

from ..models.quest import Quest, QuestStatus, QuestDifficulty
from ..models.analytics import (
    QuestAnalytics, TrendDataPoint, CategoryPerformance, 
    HourlyProductivity, AnalyticsPeriod, calculate_ttl
)

# Constants for calculations
SECONDS_PER_HOUR = 3600
SECONDS_PER_DAY = 86400
HOURS_PER_DAY = 24
DAYS_PER_WEEK = 7
DAYS_PER_MONTH = 30

# Minimum data points for meaningful analytics
MIN_QUESTS_FOR_ANALYTICS = 1
MIN_QUESTS_FOR_TRENDS = 3
MIN_QUESTS_FOR_CATEGORY_ANALYSIS = 2


class QuestAnalyticsCalculator:
    """Calculator for quest analytics with comprehensive metrics"""
    
    def __init__(self, user_id: str, period: AnalyticsPeriod):
        self.user_id = user_id
        self.period = period
        self.period_days = self._get_period_days(period)
        self.cutoff_date = self._get_cutoff_date()
    
    def _get_period_days(self, period: AnalyticsPeriod) -> int:
        """Get number of days for the analytics period"""
        period_map = {
            "daily": 1,
            "weekly": 7,
            "monthly": 30,
            "allTime": 365
        }
        return period_map.get(period, 7)
    
    def _get_cutoff_date(self) -> datetime:
        """Get cutoff date for filtering quests"""
        if self.period == "allTime":
            return datetime(2020, 1, 1)  # Far back date for all-time analytics
        else:
            return datetime.now() - timedelta(days=self.period_days)
    
    def calculate_analytics(self, quests: List[Quest]) -> QuestAnalytics:
        """
        Calculate comprehensive analytics for the given quests.
        
        Args:
            quests: List of quest objects to analyze
            
        Returns:
            QuestAnalytics object with all calculated metrics
        """
        # Filter quests by period
        filtered_quests = self._filter_quests_by_period(quests)
        
        if not filtered_quests:
            return self._create_empty_analytics()
        
        # Calculate basic metrics
        total_quests = len(filtered_quests)
        completed_quests = self._count_completed_quests(filtered_quests)
        success_rate = completed_quests / total_quests if total_quests > 0 else 0.0
        
        # Calculate advanced metrics
        average_completion_time = self._calculate_average_completion_time(filtered_quests)
        best_streak, current_streak = self._calculate_streaks(filtered_quests)
        xp_earned = self._calculate_xp_earned(filtered_quests)
        
        # Calculate trend data
        trends = self._calculate_trends(filtered_quests)
        
        # Calculate category performance
        category_performance = self._calculate_category_performance(filtered_quests)
        
        # Calculate productivity by hour
        productivity_by_hour = self._calculate_productivity_by_hour(filtered_quests)
        
        # Create analytics object
        return QuestAnalytics(
            userId=self.user_id,
            period=self.period,
            totalQuests=total_quests,
            completedQuests=completed_quests,
            successRate=success_rate,
            averageCompletionTime=average_completion_time,
            bestStreak=best_streak,
            currentStreak=current_streak,
            xpEarned=xp_earned,
            trends=trends,
            categoryPerformance=category_performance,
            productivityByHour=productivity_by_hour,
            calculatedAt=int(time.time()),
            ttl=calculate_ttl(self.period)
        )
    
    def _filter_quests_by_period(self, quests: List[Quest]) -> List[Quest]:
        """Filter quests based on the analytics period"""
        if self.period == "allTime":
            return quests
        
        filtered = []
        for quest in quests:
            # For analytics, we should include quests that were either:
            # 1. Created within the period, OR
            # 2. Started within the period (if they have a startedAt timestamp)
            
            quest_created_date = self._timestamp_to_datetime(quest.createdAt)
            quest_started_date = self._timestamp_to_datetime(quest.startedAt) if quest.startedAt else None
            
            # Include if created within period OR started within period
            created_within_period = quest_created_date >= self.cutoff_date
            started_within_period = quest_started_date and quest_started_date >= self.cutoff_date
            
            if created_within_period or started_within_period:
                filtered.append(quest)
        
        return filtered
    
    def _timestamp_to_datetime(self, timestamp: int) -> datetime:
        """Convert timestamp to datetime object"""
        return datetime.fromtimestamp(timestamp / 1000)
    
    def _count_completed_quests(self, quests: List[Quest]) -> int:
        """Count completed quests"""
        return sum(1 for quest in quests if quest.status == "completed")
    
    def _calculate_average_completion_time(self, quests: List[Quest]) -> float:
        """Calculate average completion time for completed quests"""
        completed_quests = [q for q in quests if q.status == "completed" and q.completedAt]
        
        if not completed_quests:
            return 0.0
        
        total_time = 0.0
        for quest in completed_quests:
            if quest.completedAt and quest.createdAt:
                completion_time = quest.completedAt - quest.createdAt
                total_time += completion_time / 1000  # Convert to seconds
        
        return total_time / len(completed_quests)
    
    def _calculate_streaks(self, quests: List[Quest]) -> Tuple[int, int]:
        """Calculate best and current streaks"""
        # Sort quests by creation date
        sorted_quests = sorted(quests, key=lambda q: q.createdAt)
        
        if not sorted_quests:
            return 0, 0
        
        # Group quests by day
        quests_by_day = defaultdict(list)
        for quest in sorted_quests:
            quest_date = self._timestamp_to_datetime(quest.createdAt).date()
            quests_by_day[quest_date].append(quest)
        
        # Calculate streaks
        best_streak = 0
        current_streak = 0
        temp_streak = 0
        
        # Get all dates in the period
        start_date = self.cutoff_date.date() if self.period != "allTime" else min(quests_by_day.keys())
        end_date = datetime.now().date()
        
        current_date = start_date
        while current_date <= end_date:
            day_quests = quests_by_day.get(current_date, [])
            has_completed_quest = any(q.status == "completed" for q in day_quests)
            
            if has_completed_quest:
                temp_streak += 1
                best_streak = max(best_streak, temp_streak)
            else:
                temp_streak = 0
            
            current_date += timedelta(days=1)
        
        # Current streak is the streak ending today
        current_streak = temp_streak
        
        return best_streak, current_streak
    
    def _calculate_xp_earned(self, quests: List[Quest]) -> int:
        """Calculate total XP earned from completed quests"""
        total_xp = 0
        for quest in quests:
            if quest.status == "completed":
                total_xp += quest.rewardXp or 0
        return total_xp
    
    def _calculate_trends(self, quests: List[Quest]) -> Dict[str, List[TrendDataPoint]]:
        """Calculate trend data for various metrics"""
        trends = {
            "completionRate": [],
            "xpEarned": [],
            "questsCreated": []
        }
        
        if len(quests) < MIN_QUESTS_FOR_TRENDS:
            return trends
        
        # Group quests by date
        quests_by_date = defaultdict(list)
        for quest in quests:
            quest_date = self._timestamp_to_datetime(quest.createdAt).date()
            quests_by_date[quest_date].append(quest)
        
        # Calculate trends for each date
        start_date = self.cutoff_date.date() if self.period != "allTime" else min(quests_by_date.keys())
        end_date = datetime.now().date()
        
        current_date = start_date
        cumulative_completed = 0
        cumulative_xp = 0
        cumulative_created = 0
        
        while current_date <= end_date:
            day_quests = quests_by_date.get(current_date, [])
            day_completed = sum(1 for q in day_quests if q.status == "completed")
            day_xp = sum(q.rewardXp or 0 for q in day_quests if q.status == "completed")
            day_created = len(day_quests)
            
            cumulative_completed += day_completed
            cumulative_xp += day_xp
            cumulative_created += day_created
            
            # Calculate completion rate
            completion_rate = cumulative_completed / cumulative_created if cumulative_created > 0 else 0.0
            
            # Add data points
            date_str = current_date.strftime('%Y-%m-%d')
            trends["completionRate"].append(TrendDataPoint(date=date_str, value=completion_rate))
            trends["xpEarned"].append(TrendDataPoint(date=date_str, value=float(cumulative_xp)))
            trends["questsCreated"].append(TrendDataPoint(date=date_str, value=float(cumulative_created)))
            
            current_date += timedelta(days=1)
        
        return trends
    
    def _calculate_category_performance(self, quests: List[Quest]) -> List[CategoryPerformance]:
        """Calculate performance metrics by category"""
        category_stats = defaultdict(lambda: {
            'total': 0,
            'completed': 0,
            'xp_earned': 0,
            'completion_times': []
        })
        
        # Collect stats for each category
        for quest in quests:
            category = quest.category or "Uncategorized"
            category_stats[category]['total'] += 1
            
            if quest.status == "completed":
                category_stats[category]['completed'] += 1
                category_stats[category]['xp_earned'] += quest.rewardXp or 0
                
                if quest.completedAt and quest.createdAt:
                    completion_time = (quest.completedAt - quest.createdAt) / 1000
                    category_stats[category]['completion_times'].append(completion_time)
        
        # Convert to CategoryPerformance objects
        performance_list = []
        for category, stats in category_stats.items():
            total = stats['total']
            completed = stats['completed']
            success_rate = completed / total if total > 0 else 0.0
            
            completion_times = stats['completion_times']
            avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0.0
            
            performance_list.append(CategoryPerformance(
                category=category,
                totalQuests=total,
                completedQuests=completed,
                successRate=success_rate,
                averageCompletionTime=avg_completion_time,
                xpEarned=stats['xp_earned']
            ))
        
        # Sort by total quests descending
        performance_list.sort(key=lambda x: x.totalQuests, reverse=True)
        
        return performance_list
    
    def _calculate_productivity_by_hour(self, quests: List[Quest]) -> List[HourlyProductivity]:
        """Calculate productivity patterns by hour of day"""
        hourly_stats = defaultdict(lambda: {
            'quests_completed': 0,
            'xp_earned': 0,
            'completion_times': []
        })
        
        # Collect stats for each hour
        for quest in quests:
            if quest.status == "completed" and quest.completedAt:
                # Get completion hour
                completion_time = self._timestamp_to_datetime(quest.completedAt)
                hour = completion_time.hour
                
                hourly_stats[hour]['quests_completed'] += 1
                hourly_stats[hour]['xp_earned'] += quest.rewardXp or 0
                
                if quest.createdAt:
                    completion_time_seconds = (quest.completedAt - quest.createdAt) / 1000
                    hourly_stats[hour]['completion_times'].append(completion_time_seconds)
        
        # Convert to HourlyProductivity objects
        productivity_list = []
        for hour in range(24):
            stats = hourly_stats[hour]
            quests_completed = stats['quests_completed']
            xp_earned = stats['xp_earned']
            
            completion_times = stats['completion_times']
            avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0.0
            
            productivity_list.append(HourlyProductivity(
                hour=hour,
                questsCompleted=quests_completed,
                xpEarned=xp_earned,
                averageCompletionTime=avg_completion_time
            ))
        
        return productivity_list
    
    def _create_empty_analytics(self) -> QuestAnalytics:
        """Create empty analytics for users with no quests"""
        return QuestAnalytics(
            userId=self.user_id,
            period=self.period,
            totalQuests=0,
            completedQuests=0,
            successRate=0.0,
            averageCompletionTime=0.0,
            bestStreak=0,
            currentStreak=0,
            xpEarned=0,
            trends={
                "completionRate": [],
                "xpEarned": [],
                "questsCreated": []
            },
            categoryPerformance=[],
            productivityByHour=[],
            calculatedAt=int(time.time()),
            ttl=calculate_ttl(self.period)
        )


def calculate_quest_analytics(user_id: str, period: AnalyticsPeriod, quests: List[Quest]) -> QuestAnalytics:
    """
    Calculate comprehensive quest analytics for a user.
    
    Args:
        user_id: User ID
        period: Analytics period (daily, weekly, monthly, allTime)
        quests: List of quest objects to analyze
        
    Returns:
        QuestAnalytics object with all calculated metrics
    """
    calculator = QuestAnalyticsCalculator(user_id, period)
    return calculator.calculate_analytics(quests)


def calculate_analytics_insights(analytics: QuestAnalytics) -> Dict[str, Any]:
    """
    Calculate additional insights from analytics data.
    
    Args:
        analytics: QuestAnalytics object
        
    Returns:
        Dictionary of insights
    """
    insights = {}
    
    # Most productive category
    if analytics.categoryPerformance:
        best_category = max(analytics.categoryPerformance, key=lambda x: x.successRate)
        insights['mostProductiveCategory'] = {
            'category': best_category.category,
            'successRate': best_category.successRate
        }
    
    # Most productive hour
    if analytics.productivityByHour:
        best_hour = max(analytics.productivityByHour, key=lambda x: x.questsCompleted)
        insights['mostProductiveHour'] = {
            'hour': best_hour.hour,
            'questsCompleted': best_hour.questsCompleted
        }
    
    # Trend analysis
    if analytics.trends.get('completionRate'):
        completion_trend = analytics.trends['completionRate']
        if len(completion_trend) >= 7:  # At least a week of data
            recent_avg = sum(point.value for point in completion_trend[-7:]) / 7
            older_avg = sum(point.value for point in completion_trend[:-7]) / len(completion_trend[:-7]) if len(completion_trend) > 7 else recent_avg
            
            if recent_avg > older_avg * 1.1:  # 10% improvement
                insights['trend'] = 'improving'
            elif recent_avg < older_avg * 0.9:  # 10% decline
                insights['trend'] = 'declining'
            else:
                insights['trend'] = 'stable'
    
    # Consistency score (based on streak vs total quests)
    if analytics.totalQuests > 0:
        consistency_score = analytics.bestStreak / analytics.totalQuests
        insights['consistencyScore'] = min(consistency_score, 1.0)
    
    return insights
