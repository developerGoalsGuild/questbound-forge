"""
Quest Analytics models for the GoalsGuild Quest feature.

This module contains Pydantic models for Quest Analytics operations including
data structures for trend analysis, performance metrics, and caching.
All models include comprehensive validation and follow existing patterns.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import time

# Analytics period types
AnalyticsPeriod = Literal["daily", "weekly", "monthly", "allTime"]

# Validation constants
MAX_TREND_POINTS = 365  # Maximum number of trend data points
MIN_SUCCESS_RATE = 0.0
MAX_SUCCESS_RATE = 1.0
MIN_COMPLETION_TIME = 0.0
MAX_COMPLETION_TIME = 365 * 24 * 60 * 60  # 1 year in seconds
MIN_STREAK = 0
MAX_STREAK = 365  # Maximum streak of 1 year
MIN_XP = 0
MAX_XP = 1000000  # Maximum XP earned


class TrendDataPoint(BaseModel):
    """Single data point in a trend analysis"""
    
    date: str = Field(
        description="Date in YYYY-MM-DD format"
    )
    value: float = Field(
        ge=0.0,
        description="Numeric value for this date"
    )
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        """Validate date format"""
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
    
    @field_validator('value')
    @classmethod
    def validate_value(cls, v: float) -> float:
        """Validate value is non-negative"""
        if v < 0:
            raise ValueError("Value must be non-negative")
        return v


class CategoryPerformance(BaseModel):
    """Performance metrics for a specific category"""
    
    category: str = Field(
        min_length=1,
        max_length=50,
        description="Category name"
    )
    totalQuests: int = Field(
        ge=0,
        description="Total number of quests in this category"
    )
    completedQuests: int = Field(
        ge=0,
        description="Number of completed quests in this category"
    )
    successRate: float = Field(
        ge=MIN_SUCCESS_RATE,
        le=MAX_SUCCESS_RATE,
        description="Success rate for this category (0.0 to 1.0)"
    )
    averageCompletionTime: float = Field(
        ge=MIN_COMPLETION_TIME,
        le=MAX_COMPLETION_TIME,
        description="Average completion time in seconds"
    )
    xpEarned: int = Field(
        ge=MIN_XP,
        le=MAX_XP,
        description="Total XP earned from this category"
    )
    
    @field_validator('completedQuests')
    @classmethod
    def validate_completed_quests(cls, v: int, info) -> int:
        """Validate completed quests doesn't exceed total"""
        total = info.data.get('totalQuests', 0)
        if v > total:
            raise ValueError("Completed quests cannot exceed total quests")
        return v
    
    @field_validator('successRate')
    @classmethod
    def validate_success_rate(cls, v: float, info) -> float:
        """Validate success rate matches actual completion rate"""
        total = info.data.get('totalQuests', 0)
        completed = info.data.get('completedQuests', 0)
        if total > 0:
            expected_rate = completed / total
            if abs(v - expected_rate) > 0.001:  # Allow small floating point differences
                raise ValueError("Success rate must match actual completion rate")
        return v


class HourlyProductivity(BaseModel):
    """Productivity metrics for a specific hour of the day"""
    
    hour: int = Field(
        ge=0,
        le=23,
        description="Hour of the day (0-23)"
    )
    questsCompleted: int = Field(
        ge=0,
        description="Number of quests completed in this hour"
    )
    xpEarned: int = Field(
        ge=MIN_XP,
        le=MAX_XP,
        description="XP earned in this hour"
    )
    averageCompletionTime: float = Field(
        ge=MIN_COMPLETION_TIME,
        le=MAX_COMPLETION_TIME,
        description="Average completion time for quests in this hour"
    )


class QuestAnalytics(BaseModel):
    """Comprehensive quest analytics for a user"""
    
    userId: str = Field(
        min_length=1,
        description="User ID"
    )
    period: AnalyticsPeriod = Field(
        description="Analytics period"
    )
    totalQuests: int = Field(
        ge=0,
        description="Total number of quests"
    )
    completedQuests: int = Field(
        ge=0,
        description="Number of completed quests"
    )
    successRate: float = Field(
        ge=MIN_SUCCESS_RATE,
        le=MAX_SUCCESS_RATE,
        description="Overall success rate (0.0 to 1.0)"
    )
    averageCompletionTime: float = Field(
        ge=MIN_COMPLETION_TIME,
        le=MAX_COMPLETION_TIME,
        description="Average completion time in seconds"
    )
    bestStreak: int = Field(
        ge=MIN_STREAK,
        le=MAX_STREAK,
        description="Best quest completion streak"
    )
    currentStreak: int = Field(
        ge=MIN_STREAK,
        le=MAX_STREAK,
        description="Current quest completion streak"
    )
    xpEarned: int = Field(
        ge=MIN_XP,
        le=MAX_XP,
        description="Total XP earned"
    )
    trends: Dict[str, List[TrendDataPoint]] = Field(
        description="Trend data for various metrics"
    )
    categoryPerformance: List[CategoryPerformance] = Field(
        description="Performance breakdown by category"
    )
    productivityByHour: List[HourlyProductivity] = Field(
        description="Productivity patterns by hour of day"
    )
    calculatedAt: int = Field(
        description="Timestamp when analytics were calculated"
    )
    ttl: int = Field(
        ge=0,
        description="Time to live in seconds for caching"
    )
    
    @field_validator('completedQuests')
    @classmethod
    def validate_completed_quests(cls, v: int, info) -> int:
        """Validate completed quests doesn't exceed total"""
        total = info.data.get('totalQuests', 0)
        if v > total:
            raise ValueError("Completed quests cannot exceed total quests")
        return v
    
    @field_validator('successRate')
    @classmethod
    def validate_success_rate(cls, v: float, info) -> float:
        """Validate success rate matches actual completion rate"""
        total = info.data.get('totalQuests', 0)
        completed = info.data.get('completedQuests', 0)
        if total > 0:
            expected_rate = completed / total
            if abs(v - expected_rate) > 0.001:  # Allow small floating point differences
                raise ValueError("Success rate must match actual completion rate")
        return v
    
    @field_validator('currentStreak')
    @classmethod
    def validate_current_streak(cls, v: int, info) -> int:
        """Validate current streak doesn't exceed best streak"""
        best = info.data.get('bestStreak', 0)
        if v > best:
            raise ValueError("Current streak cannot exceed best streak")
        return v
    
    @field_validator('trends')
    @classmethod
    def validate_trends(cls, v: Dict[str, List[TrendDataPoint]]) -> Dict[str, List[TrendDataPoint]]:
        """Validate trends data"""
        for trend_name, data_points in v.items():
            if len(data_points) > MAX_TREND_POINTS:
                raise ValueError(f"Trend '{trend_name}' has too many data points (max {MAX_TREND_POINTS})")
            
            # Validate data points are sorted by date
            dates = [point.date for point in data_points]
            if dates != sorted(dates):
                raise ValueError(f"Trend '{trend_name}' data points must be sorted by date")
        
        return v
    
    @field_validator('categoryPerformance')
    @classmethod
    def validate_category_performance(cls, v: List[CategoryPerformance]) -> List[CategoryPerformance]:
        """Validate category performance data"""
        if len(v) > 50:  # Reasonable limit for categories
            raise ValueError("Too many categories (max 50)")
        
        # Check for duplicate categories
        categories = [cat.category for cat in v]
        if len(categories) != len(set(categories)):
            raise ValueError("Duplicate categories found")
        
        return v
    
    @field_validator('productivityByHour')
    @classmethod
    def validate_productivity_by_hour(cls, v: List[HourlyProductivity]) -> List[HourlyProductivity]:
        """Validate productivity by hour data"""
        if len(v) > 24:
            raise ValueError("Too many hourly productivity entries (max 24)")
        
        # Check for duplicate hours
        hours = [prod.hour for prod in v]
        if len(hours) != len(set(hours)):
            raise ValueError("Duplicate hours found")
        
        return v


class AnalyticsCacheKey(BaseModel):
    """Key for analytics cache lookup"""
    
    userId: str = Field(description="User ID")
    period: AnalyticsPeriod = Field(description="Analytics period")
    date: str = Field(description="Date for the analytics (YYYY-MM-DD)")


class AnalyticsCacheItem(BaseModel):
    """Cached analytics item with metadata"""
    
    key: AnalyticsCacheKey = Field(description="Cache key")
    analytics: QuestAnalytics = Field(description="Cached analytics data")
    createdAt: int = Field(description="When this item was cached")
    expiresAt: int = Field(description="When this item expires")
    
    @field_validator('expiresAt')
    @classmethod
    def validate_expires_at(cls, v: int, info) -> int:
        """Validate expiration time is after creation time"""
        created = info.data.get('createdAt', 0)
        if v <= created:
            raise ValueError("Expiration time must be after creation time")
        return v


class AnalyticsRequest(BaseModel):
    """Request model for analytics endpoint"""
    
    period: AnalyticsPeriod = Field(
        default="weekly",
        description="Analytics period"
    )
    forceRefresh: bool = Field(
        default=False,
        description="Force refresh of analytics data"
    )


class AnalyticsResponse(BaseModel):
    """Response model for analytics endpoint"""
    
    analytics: QuestAnalytics = Field(description="Analytics data")
    fromCache: bool = Field(description="Whether data was loaded from cache")
    cacheAge: Optional[int] = Field(description="Age of cached data in seconds")
    calculatedAt: int = Field(description="When analytics were calculated")


# Utility functions for analytics calculations
def calculate_ttl(period: AnalyticsPeriod) -> int:
    """Calculate TTL in seconds based on period"""
    ttl_map = {
        "daily": 24 * 60 * 60,      # 24 hours
        "weekly": 7 * 24 * 60 * 60,  # 7 days
        "monthly": 30 * 24 * 60 * 60, # 30 days
        "allTime": 365 * 24 * 60 * 60 # 1 year
    }
    return ttl_map.get(period, 24 * 60 * 60)


def is_analytics_expired(analytics: QuestAnalytics) -> bool:
    """Check if analytics data has expired"""
    current_time = int(time.time())
    return current_time >= analytics.calculatedAt + analytics.ttl


def get_analytics_period_days(period: AnalyticsPeriod) -> int:
    """Get number of days for analytics period"""
    period_days = {
        "daily": 1,
        "weekly": 7,
        "monthly": 30,
        "allTime": 365
    }
    return period_days.get(period, 7)


def format_completion_time(seconds: float) -> str:
    """Format completion time in human-readable format"""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes}m"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}h {minutes}m"
    else:
        days = int(seconds / 86400)
        hours = int((seconds % 86400) / 3600)
        return f"{days}d {hours}h"


def format_success_rate(rate: float) -> str:
    """Format success rate as percentage"""
    return f"{rate * 100:.1f}%"


def format_xp(xp: int) -> str:
    """Format XP with appropriate units"""
    if xp < 1000:
        return str(xp)
    elif xp < 1000000:
        return f"{xp / 1000:.1f}K"
    else:
        return f"{xp / 1000000:.1f}M"
