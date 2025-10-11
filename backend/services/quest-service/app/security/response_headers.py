"""
Security response headers middleware for API Gateway.
This Lambda function adds security headers to all API responses.
"""

import json
from typing import Dict, Any


def add_security_headers(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Add security headers to API Gateway responses.
    This function should be used as a Lambda@Edge function or response transformer.
    """
    
    # Security headers to add
    security_headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY", 
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https:;"
        ),
        "Permissions-Policy": (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )
    }
    
    # Get existing headers
    headers = event.get("headers", {})
    
    # Add security headers (don't override existing ones)
    for header_name, header_value in security_headers.items():
        if header_name not in headers:
            headers[header_name] = header_value
    
    # Update the event with new headers
    event["headers"] = headers
    
    return event


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for adding security headers.
    """
    try:
        return add_security_headers(event, context)
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error adding security headers: {str(e)}")
        return event
