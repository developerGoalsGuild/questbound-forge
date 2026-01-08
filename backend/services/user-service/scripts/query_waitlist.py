#!/usr/bin/env python3
"""
Query Waitlist Emails from DynamoDB

This script queries all waitlist subscribers from the gg_core DynamoDB table.
It uses GSI1 to query all waitlist subscriptions.

Usage:
    python query_waitlist.py [--table-name gg_core] [--region us-east-2] [--output json|csv]
"""

import argparse
import json
import sys
from datetime import datetime
from typing import List, Dict, Any

import boto3
from boto3.dynamodb.conditions import Key


def query_waitlist_subscribers(
    table_name: str = "gg_core",
    region: str = "us-east-2",
    limit: int = None
) -> List[Dict[str, Any]]:
    """
    Query all waitlist subscribers from DynamoDB using GSI1.
    
    Args:
        table_name: Name of the DynamoDB table
        region: AWS region
        limit: Maximum number of items to return (None for all)
    
    Returns:
        List of waitlist subscriber records
    """
    dynamodb = boto3.resource("dynamodb", region_name=region)
    table = dynamodb.Table(table_name)
    
    subscribers = []
    last_evaluated_key = None
    
    try:
        while True:
            query_params = {
                "IndexName": "GSI1",
                "KeyConditionExpression": Key("GSI1PK").eq("WAITLIST#ALL"),
                "ScanIndexForward": False  # Sort by date descending (newest first)
            }
            
            if last_evaluated_key:
                query_params["ExclusiveStartKey"] = last_evaluated_key
            
            if limit:
                remaining = limit - len(subscribers)
                if remaining <= 0:
                    break
                query_params["Limit"] = remaining
            
            response = table.query(**query_params)
            
            items = response.get("Items", [])
            subscribers.extend(items)
            
            last_evaluated_key = response.get("LastEvaluatedKey")
            
            if not last_evaluated_key or (limit and len(subscribers) >= limit):
                break
        
        return subscribers
    
    except Exception as e:
        print(f"Error querying DynamoDB: {e}", file=sys.stderr)
        sys.exit(1)


def format_subscribers(subscribers: List[Dict[str, Any]], output_format: str = "json") -> str:
    """
    Format subscribers list in the requested format.
    
    Args:
        subscribers: List of subscriber records
        output_format: Output format ('json' or 'csv')
    
    Returns:
        Formatted string
    """
    if output_format == "json":
        return json.dumps(subscribers, indent=2, default=str)
    
    elif output_format == "csv":
        if not subscribers:
            return "email,status,source,createdAt,ipAddress\n"
        
        lines = ["email,status,source,createdAt,ipAddress"]
        for sub in subscribers:
            email = sub.get("email", "")
            status = sub.get("status", "")
            source = sub.get("source", "")
            created_at = sub.get("createdAt", "")
            ip_address = sub.get("ipAddress", "")
            lines.append(f"{email},{status},{source},{created_at},{ip_address}")
        
        return "\n".join(lines)
    
    else:
        raise ValueError(f"Unknown output format: {output_format}")


def main():
    parser = argparse.ArgumentParser(
        description="Query waitlist subscribers from DynamoDB"
    )
    parser.add_argument(
        "--table-name",
        default="gg_core",
        help="DynamoDB table name (default: gg_core)"
    )
    parser.add_argument(
        "--region",
        default="us-east-2",
        help="AWS region (default: us-east-2)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of subscribers to return (default: all)"
    )
    parser.add_argument(
        "--output",
        choices=["json", "csv"],
        default="json",
        help="Output format (default: json)"
    )
    parser.add_argument(
        "--count-only",
        action="store_true",
        help="Only output the count of subscribers"
    )
    
    args = parser.parse_args()
    
    print(f"Querying waitlist subscribers from {args.table_name}...", file=sys.stderr)
    
    subscribers = query_waitlist_subscribers(
        table_name=args.table_name,
        region=args.region,
        limit=args.limit
    )
    
    if args.count_only:
        print(len(subscribers))
    else:
        output = format_subscribers(subscribers, args.output)
        print(output)


if __name__ == "__main__":
    main()















