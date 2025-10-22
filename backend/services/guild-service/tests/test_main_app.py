"""
Comprehensive tests for the main FastAPI application.
Tests application startup, middleware, error handling, and routing.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import json
from datetime import datetime

# Import the FastAPI app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app


class TestMainApplication:
    """Comprehensive test cases for the main FastAPI application."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        return TestClient(app)
    
    def test_app_startup(self):
        """Test that the FastAPI app starts up correctly."""
        assert app is not None
        assert app.title == "Guild Service API"
        assert app.version == "1.0.0"
    
    def test_health_check_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_docs_endpoint(self, client):
        """Test that API documentation is available."""
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_openapi_endpoint(self, client):
        """Test that OpenAPI schema is available."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data
    
    def test_cors_headers(self, client):
        """Test that CORS headers are properly set."""
        response = client.options("/guilds", headers={"Origin": "http://localhost:3000"})
        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
    
    def test_guild_routes_exist(self, client):
        """Test that all guild routes are properly registered."""
        # Test that routes exist by checking for 401 (unauthorized) instead of 404 (not found)
        response = client.get("/guilds")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.post("/guilds")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.get("/guilds/test_guild")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.put("/guilds/test_guild")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.delete("/guilds/test_guild")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
    
    def test_comment_routes_exist(self, client):
        """Test that all comment routes are properly registered."""
        response = client.get("/guilds/test_guild/comments")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.post("/guilds/test_guild/comments")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.put("/guilds/test_guild/comments/test_comment")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.delete("/guilds/test_guild/comments/test_comment")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
    
    def test_analytics_routes_exist(self, client):
        """Test that all analytics routes are properly registered."""
        response = client.get("/guilds/test_guild/analytics")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.get("/guilds/test_guild/leaderboard")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.get("/guilds/rankings")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
    
    def test_member_routes_exist(self, client):
        """Test that all member routes are properly registered."""
        response = client.get("/guilds/test_guild/members")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.post("/guilds/test_guild/join")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.post("/guilds/test_guild/leave")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.delete("/guilds/test_guild/members/test_user")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
    
    def test_moderation_routes_exist(self, client):
        """Test that all moderation routes are properly registered."""
        response = client.get("/guilds/test_guild/join-requests")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.post("/guilds/test_guild/join-requests/test_user/approve")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.post("/guilds/test_guild/join-requests/test_user/reject")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.post("/guilds/test_guild/moderators/test_user")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.delete("/guilds/test_guild/moderators/test_user")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
    
    def test_avatar_routes_exist(self, client):
        """Test that all avatar routes are properly registered."""
        response = client.post("/guilds/test_guild/avatar/upload-url")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
        
        response = client.delete("/guilds/test_guild/avatar")
        assert response.status_code == 401  # Unauthorized, not 404 (not found)
    
    def test_error_handling_404(self, client):
        """Test 404 error handling for non-existent routes."""
        response = client.get("/nonexistent-route")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
    
    def test_error_handling_405(self, client):
        """Test 405 error handling for unsupported methods."""
        response = client.patch("/guilds")  # PATCH not supported
        assert response.status_code == 405
        data = response.json()
        assert "detail" in data
    
    def test_error_handling_422(self, client):
        """Test 422 error handling for validation errors."""
        response = client.post("/guilds", json={"invalid": "data"})
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_error_handling_500(self, client):
        """Test 500 error handling for internal server errors."""
        with patch('app.api.guild.create_guild') as mock_create:
            mock_create.side_effect = Exception("Internal server error")
            
            response = client.post(
                "/guilds",
                json={"name": "Test Guild", "guild_type": "public"},
                headers={"Authorization": "Bearer token", "x-api-key": "api_key"}
            )
            
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
    
    def test_middleware_cors(self, client):
        """Test CORS middleware functionality."""
        response = client.options(
            "/guilds",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Methods" in response.headers
        assert "Access-Control-Allow-Headers" in response.headers
    
    def test_middleware_request_id(self, client):
        """Test that request ID middleware is working."""
        response = client.get("/health")
        assert response.status_code == 200
        # Request ID should be in response headers
        assert "X-Request-ID" in response.headers
    
    def test_middleware_timing(self, client):
        """Test that timing middleware is working."""
        response = client.get("/health")
        assert response.status_code == 200
        # Timing should be in response headers
        assert "X-Response-Time" in response.headers
    
    def test_authentication_middleware(self, client):
        """Test authentication middleware."""
        # Request without auth should return 401
        response = client.get("/guilds")
        assert response.status_code == 401
        
        # Request with invalid auth should return 401
        response = client.get("/guilds", headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401
    
    def test_rate_limiting_middleware(self, client):
        """Test rate limiting middleware."""
        # This would require multiple requests to test rate limiting
        # For now, just test that the middleware doesn't break normal requests
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_logging_middleware(self, client):
        """Test logging middleware."""
        with patch('app.main.logger') as mock_logger:
            response = client.get("/health")
            assert response.status_code == 200
            # Logger should have been called
            mock_logger.info.assert_called()
    
    def test_application_metadata(self, client):
        """Test application metadata endpoints."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "service" in data
    
    def test_application_info(self, client):
        """Test application info endpoint."""
        response = client.get("/info")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "description" in data
    
    def test_metrics_endpoint(self, client):
        """Test metrics endpoint."""
        response = client.get("/metrics")
        assert response.status_code == 200
        # Metrics should be in a specific format
        assert "requests_total" in response.text or "guild_requests_total" in response.text


if __name__ == '__main__':
    pytest.main([__file__])


