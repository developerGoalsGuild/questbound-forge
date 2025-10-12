"""
DynamoDB helper functions for Quest Analytics operations.

This module provides comprehensive database operations for Quest Analytics caching
following the single-table design pattern and existing quest-service conventions.
"""

import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import BotoCoreError, ClientError

import sys
from pathlib import Path

# Add common module to path - works both locally and in containers
def _add_common_to_path():
    """Add common module to Python path, supporting both local and container environments."""
    # Try container path first (common is copied to /app/common)
    container_common = Path("/app/common")
    if container_common.exists():
        if str(container_common.parent) not in sys.path:
            sys.path.append(str(container_common.parent))
        return
    
    # Try local development path
    services_dir = Path(__file__).resolve().parents[3]
    if (services_dir / "common").exists():
        if str(services_dir) not in sys.path:
            sys.path.append(str(services_dir))
        return
    
    # Fallback: try relative to current file
    current_dir = Path(__file__).resolve().parent
    for _ in range(5):  # Go up max 5 levels
        common_dir = current_dir / "common"
        if common_dir.exists():
            if str(current_dir) not in sys.path:
                sys.path.append(str(current_dir))
            return
        current_dir = current_dir.parent

_add_common_to_path()

from common.logging import get_structured_logger

from ..models.analytics import QuestAnalytics, AnalyticsPeriod, is_analytics_expired
from ..settings import Settings

# Initialize logger
logger = get_structured_logger("analytics-db", env_flag="QUEST_LOG_ENABLED", default_enabled=True)

# Settings will be initialized lazily to avoid AWS SSM calls during testing
_settings = None

def _get_settings():
    """Get settings instance (lazy initialization)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


class AnalyticsDBError(Exception):
    """Custom exception for Analytics database operations."""
    pass


class AnalyticsNotFoundError(AnalyticsDBError):
    """Raised when analytics data is not found."""
    pass


class AnalyticsExpiredError(AnalyticsDBError):
    """Raised when analytics data has expired."""
    pass


def _get_dynamodb_table():
    """Get DynamoDB table resource."""
    import boto3
    settings = _get_settings()
    dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
    return dynamodb.Table(settings.core_table_name)


def _convert_floats_to_decimal(obj):
    """Recursively convert float values to Decimal for DynamoDB compatibility."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {key: _convert_floats_to_decimal(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [_convert_floats_to_decimal(item) for item in obj]
    else:
        return obj


def _build_analytics_item(user_id: str, analytics: QuestAnalytics) -> Dict[str, Any]:
    """
    Build DynamoDB item for analytics caching.
    
    Args:
        user_id: User ID
        analytics: Analytics data to cache
        
    Returns:
        DynamoDB item dictionary
    """
    now = int(time.time())
    date_str = datetime.now().strftime('%Y-%m-%d')
    
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"ANALYTICS#{analytics.period}#{date_str}",
        "GSI1PK": f"USER#{user_id}",
        "GSI1SK": f"ANALYTICS#{analytics.period}#{now}",
        "type": "QuestAnalytics",
        "userId": analytics.userId,
        "period": analytics.period,
        "totalQuests": analytics.totalQuests,
        "completedQuests": analytics.completedQuests,
        "successRate": analytics.successRate,
        "averageCompletionTime": analytics.averageCompletionTime,
        "bestStreak": analytics.bestStreak,
        "currentStreak": analytics.currentStreak,
        "xpEarned": analytics.xpEarned,
        "trends": {
            "completionRate": [point.dict() for point in analytics.trends.get("completionRate", [])],
            "xpEarned": [point.dict() for point in analytics.trends.get("xpEarned", [])],
            "questsCreated": [point.dict() for point in analytics.trends.get("questsCreated", [])]
        },
        "categoryPerformance": [cat.dict() for cat in analytics.categoryPerformance],
        "productivityByHour": [prod.dict() for prod in analytics.productivityByHour],
        "calculatedAt": analytics.calculatedAt,
        "ttl": analytics.ttl,
        "expiresAt": now + analytics.ttl,
        "createdAt": now,
        "updatedAt": now
    }
    
    # Convert all float values to Decimal for DynamoDB compatibility
    return _convert_floats_to_decimal(item)


def _ddb_call(operation, op: str, **kwargs):
    """Wrapper for DynamoDB operations with error handling and logging."""
    try:
        logger.debug(f"Executing DynamoDB operation: {op}", extra={"operation": op, "kwargs": kwargs})
        result = operation(**kwargs)
        logger.debug(f"DynamoDB operation successful: {op}", extra={"operation": op})
        return result
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error(f"DynamoDB operation failed: {op}", extra={
            "operation": op,
            "error_code": error_code,
            "error_message": error_message,
            "kwargs": kwargs
        }, exc_info=True)
        raise AnalyticsDBError(f"DynamoDB operation failed: {error_message}")
    except Exception as e:
        logger.error(f"Unexpected error in DynamoDB operation: {op}", extra={
            "operation": op,
            "error": str(e),
            "kwargs": kwargs
        }, exc_info=True)
        raise AnalyticsDBError(f"Unexpected error: {str(e)}")


def cache_analytics(analytics: QuestAnalytics) -> None:
    """
    Cache analytics data in DynamoDB.
    
    Args:
        analytics: Analytics data to cache
        
    Raises:
        AnalyticsDBError: If caching fails
    """
    logger.info("Caching quest analytics", extra={
        "user_id": analytics.userId, 
        "period": analytics.period,
        "total_quests": analytics.totalQuests
    })
    
    try:
        table = _get_dynamodb_table()
        item = _build_analytics_item(analytics.userId, analytics)
        
        # Store analytics with TTL
        _ddb_call(
            table.put_item,
            op="analytics.cache",
            Item=item
        )
        
        logger.info("Quest analytics cached successfully", extra={
            "user_id": analytics.userId,
            "period": analytics.period,
            "expires_at": item["expiresAt"]
        })
        
    except Exception as e:
        logger.error("Failed to cache quest analytics", extra={
            "user_id": analytics.userId,
            "period": analytics.period,
            "error": str(e)
        }, exc_info=True)
        raise AnalyticsDBError(f"Failed to cache analytics: {str(e)}")


def get_cached_analytics(user_id: str, period: AnalyticsPeriod) -> Optional[QuestAnalytics]:
    """
    Get cached analytics data from DynamoDB.
    
    Args:
        user_id: User ID
        period: Analytics period
        
    Returns:
        Cached analytics data or None if not found/expired
        
    Raises:
        AnalyticsDBError: If retrieval fails
    """
    logger.info("Getting cached quest analytics", extra={"user_id": user_id, "period": period})
    
    try:
        table = _get_dynamodb_table()
        date_str = datetime.now().strftime('%Y-%m-%d')
        
        response = _ddb_call(
            table.get_item,
            op="analytics.get_cached",
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"ANALYTICS#{period}#{date_str}"
            }
        )
        
        item = response.get("Item")
        if not item:
            logger.info("No cached analytics found", extra={"user_id": user_id, "period": period})
            return None
        
        # Check if analytics have expired
        current_time = int(time.time())
        expires_at = item.get("expiresAt", 0)
        
        if current_time >= expires_at:
            logger.info("Cached analytics expired", extra={
                "user_id": user_id, 
                "period": period,
                "expires_at": expires_at,
                "current_time": current_time
            })
            return None
        
        # Convert DynamoDB item back to QuestAnalytics
        analytics = _item_to_analytics(item)
        
        logger.info("Cached analytics retrieved successfully", extra={
            "user_id": user_id,
            "period": period,
            "total_quests": analytics.totalQuests,
            "cache_age": current_time - item.get("createdAt", 0)
        })
        
        return analytics
        
    except Exception as e:
        logger.error("Failed to get cached analytics", extra={
            "user_id": user_id,
            "period": period,
            "error": str(e)
        }, exc_info=True)
        raise AnalyticsDBError(f"Failed to get cached analytics: {str(e)}")


def _item_to_analytics(item: Dict[str, Any]) -> QuestAnalytics:
    """Convert DynamoDB item to QuestAnalytics object"""
    from ..models.analytics import TrendDataPoint, CategoryPerformance, HourlyProductivity
    
    # Convert trends data
    trends = {}
    trends_data = item.get("trends", {})
    for trend_name, trend_points in trends_data.items():
        trends[trend_name] = [TrendDataPoint(**point) for point in trend_points]
    
    # Convert category performance
    category_performance = [
        CategoryPerformance(**cat) for cat in item.get("categoryPerformance", [])
    ]
    
    # Convert productivity by hour
    productivity_by_hour = [
        HourlyProductivity(**prod) for prod in item.get("productivityByHour", [])
    ]
    
    return QuestAnalytics(
        userId=item["userId"],
        period=item["period"],
        totalQuests=item["totalQuests"],
        completedQuests=item["completedQuests"],
        successRate=item["successRate"],
        averageCompletionTime=item["averageCompletionTime"],
        bestStreak=item["bestStreak"],
        currentStreak=item["currentStreak"],
        xpEarned=item["xpEarned"],
        trends=trends,
        categoryPerformance=category_performance,
        productivityByHour=productivity_by_hour,
        calculatedAt=item["calculatedAt"],
        ttl=item["ttl"]
    )


def invalidate_analytics_cache(user_id: str, period: Optional[AnalyticsPeriod] = None) -> None:
    """
    Invalidate analytics cache for a user.
    
    Args:
        user_id: User ID
        period: Specific period to invalidate, or None for all periods
        
    Raises:
        AnalyticsDBError: If invalidation fails
    """
    logger.info("Invalidating analytics cache", extra={"user_id": user_id, "period": period})
    
    try:
        table = _get_dynamodb_table()
        
        if period:
            # Invalidate specific period
            date_str = datetime.now().strftime('%Y-%m-%d')
            _ddb_call(
                table.delete_item,
                op="analytics.invalidate_specific",
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": f"ANALYTICS#{period}#{date_str}"
                }
            )
        else:
            # Invalidate all periods for user
            response = _ddb_call(
                table.query,
                op="analytics.invalidate_all",
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("ANALYTICS#"),
                ProjectionExpression="PK, SK"
            )
            
            # Delete all analytics items
            for item in response.get("Items", []):
                _ddb_call(
                    table.delete_item,
                    op="analytics.invalidate_item",
                    Key={
                        "PK": item["PK"],
                        "SK": item["SK"]
                    }
                )
        
        logger.info("Analytics cache invalidated successfully", extra={"user_id": user_id, "period": period})
        
    except Exception as e:
        logger.error("Failed to invalidate analytics cache", extra={
            "user_id": user_id,
            "period": period,
            "error": str(e)
        }, exc_info=True)
        raise AnalyticsDBError(f"Failed to invalidate cache: {str(e)}")


def cleanup_expired_analytics() -> int:
    """
    Clean up expired analytics data from DynamoDB.
    
    Returns:
        Number of items cleaned up
        
    Raises:
        AnalyticsDBError: If cleanup fails
    """
    logger.info("Starting analytics cleanup")
    
    try:
        table = _get_dynamodb_table()
        current_time = int(time.time())
        cleaned_count = 0
        
        # Scan for expired analytics items
        response = _ddb_call(
            table.scan,
            op="analytics.cleanup_scan",
            FilterExpression=Attr("type").eq("QuestAnalytics") & Attr("expiresAt").lt(current_time),
            ProjectionExpression="PK, SK, expiresAt"
        )
        
        # Delete expired items
        for item in response.get("Items", []):
            _ddb_call(
                table.delete_item,
                op="analytics.cleanup_delete",
                Key={
                    "PK": item["PK"],
                    "SK": item["SK"]
                }
            )
            cleaned_count += 1
        
        logger.info("Analytics cleanup completed", extra={"cleaned_count": cleaned_count})
        return cleaned_count
        
    except Exception as e:
        logger.error("Failed to cleanup expired analytics", extra={"error": str(e)}, exc_info=True)
        raise AnalyticsDBError(f"Failed to cleanup expired analytics: {str(e)}")


def get_analytics_cache_stats() -> Dict[str, Any]:
    """
    Get statistics about analytics cache usage.
    
    Returns:
        Dictionary with cache statistics
        
    Raises:
        AnalyticsDBError: If retrieval fails
    """
    logger.info("Getting analytics cache stats")
    
    try:
        table = _get_dynamodb_table()
        current_time = int(time.time())
        
        # Count total analytics items
        total_response = _ddb_call(
            table.scan,
            op="analytics.stats_total",
            FilterExpression=Attr("type").eq("QuestAnalytics"),
            Select="COUNT"
        )
        total_items = total_response.get("Count", 0)
        
        # Count expired items
        expired_response = _ddb_call(
            table.scan,
            op="analytics.stats_expired",
            FilterExpression=Attr("type").eq("QuestAnalytics") & Attr("expiresAt").lt(current_time),
            Select="COUNT"
        )
        expired_items = expired_response.get("Count", 0)
        
        # Count by period
        period_counts = {}
        for period in ["daily", "weekly", "monthly", "allTime"]:
            period_response = _ddb_call(
                table.scan,
                op="analytics.stats_period",
                FilterExpression=Attr("type").eq("QuestAnalytics") & Attr("period").eq(period),
                Select="COUNT"
            )
            period_counts[period] = period_response.get("Count", 0)
        
        stats = {
            "total_items": total_items,
            "expired_items": expired_items,
            "active_items": total_items - expired_items,
            "period_counts": period_counts,
            "cleanup_needed": expired_items > 0
        }
        
        logger.info("Analytics cache stats retrieved", extra=stats)
        return stats
        
    except Exception as e:
        logger.error("Failed to get analytics cache stats", extra={"error": str(e)}, exc_info=True)
        raise AnalyticsDBError(f"Failed to get cache stats: {str(e)}")
