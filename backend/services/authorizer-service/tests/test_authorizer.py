import json
import os
import pytest
import time
from unittest.mock import Mock, patch, MagicMock
import jwt

# Set up environment variables for testing
os.environ.setdefault("AUTH_LOG_ENABLED", "false")
os.environ.setdefault("ENABLE_LOCAL_JWT", "true")
os.environ.setdefault("LOG_LEVEL", "INFO")

# Mock boto3 before any imports that use it
mock_ssm_client = Mock()
mock_ssm_client.get_parameter.return_value = {"Parameter": {"Value": '{"test": "value"}'}}

mock_boto3 = Mock()
mock_boto3.client.return_value = mock_ssm_client

# Mock the settings object
mock_settings = Mock()
mock_settings.cognito_region = "us-east-1"
mock_settings.cognito_user_pool_id = "test-pool"
mock_settings.cognito_client_id = "test-client"
mock_settings.cognito_client_secret = "test-secret"
mock_settings.cognito_domain = "test-domain"
mock_settings.jwt_secret = "test-jwt-secret"
mock_settings.jwt_audience = "test-audience"
mock_settings.jwt_issuer = "test-issuer"

# Apply patches before importing modules
with patch('boto3.client', mock_boto3.client), \
     patch('ssm.settings', mock_settings), \
     patch('security.settings', mock_settings), \
     patch('cognito.verify_cognito_jwt', side_effect=Exception("Cognito should not be called")):
    import authorizer


def test_to_bool():
    from authorizer import _to_bool

    assert _to_bool("1") is True
    assert _to_bool("true") is True
    assert _to_bool("TRUE") is True
    assert _to_bool("yes") is True
    assert _to_bool("YES") is True
    assert _to_bool("on") is True
    assert _to_bool("ON") is True
    assert _to_bool("false") is False
    assert _to_bool("FALSE") is False
    assert _to_bool("0") is False
    assert _to_bool("no") is False
    assert _to_bool("off") is False
    assert _to_bool("") is False
    assert _to_bool(None) is False
    assert _to_bool("random") is False
    assert _to_bool(None, True) is True


def test_peek_jwt_header_valid_token():
    from authorizer import _peek_jwt_header

    # Create a test JWT token
    payload = {"sub": "test-user", "exp": int(time.time()) + 3600}
    token = jwt.encode(payload, "secret", algorithm="HS256", headers={"kid": "test-kid", "alg": "HS256"})

    result = _peek_jwt_header(token)
    assert result["kid"] == "test-kid"
    assert result["alg"] == "HS256"


def test_peek_jwt_header_invalid_token():
    from authorizer import _peek_jwt_header

    result = _peek_jwt_header("invalid.token.here")
    assert result == {}


def test_extract_token_from_authorization_token():
    from authorizer import _extract_token

    # REST API Gateway event
    event = {"authorizationToken": "Bearer test-token-123"}
    token = _extract_token(event)
    assert token == "test-token-123"


def test_extract_token_from_authorization_header():
    from authorizer import _extract_token

    # HTTP API v2 event
    event = {"headers": {"authorization": "Bearer test-token-456"}}
    token = _extract_token(event)
    assert token == "test-token-456"


def test_extract_token_from_authorization_header_case_insensitive():
    from authorizer import _extract_token

    # HTTP API v2 event with mixed case header
    event = {"headers": {"Authorization": "Bearer test-token-789"}}
    token = _extract_token(event)
    assert token == "test-token-789"


def test_extract_token_no_token_provided():
    from authorizer import _extract_token

    # Event with no token
    event = {"headers": {}}
    with pytest.raises(Exception) as exc_info:
        _extract_token(event)
    assert "No token provided" in str(exc_info.value)


def test_allow_policy_generation():
    from authorizer import _allow_policy

    principal = "user-123"
    resource = "arn:aws:execute-api:us-east-1:123456789012:abc123/*"
    context = {"provider": "local", "sub": "user-123", "email": "user@example.com"}

    policy = _allow_policy(principal, resource, context)

    assert policy["principalId"] == principal
    assert policy["policyDocument"]["Version"] == "2012-10-17"
    assert policy["policyDocument"]["Statement"][0]["Effect"] == "Allow"
    assert policy["policyDocument"]["Statement"][0]["Action"] == "execute-api:Invoke"
    assert policy["policyDocument"]["Statement"][0]["Resource"] == resource
    assert policy["context"] == context


def test_httpapi_simple_response():
    from authorizer import _httpapi_simple_response

    context = {"error": "test error"}
    response = _httpapi_simple_response(False, context)

    assert response["isAuthorized"] is False
    assert response["context"] == context

    response = _httpapi_simple_response(True, context)
    assert response["isAuthorized"] is True
    assert response["context"] == context


def test_is_appsync_event():
    from authorizer import _is_appsync_event

    # AppSync event with apiId
    appsync_event = {"requestContext": {"apiId": "test-api"}}
    assert _is_appsync_event(appsync_event) is True

    # AppSync event with resolverArn
    appsync_event2 = {"requestContext": {"resolverArn": "arn:aws:appsync:us-east-1:123456789012:apis/test-api/types/Query/fields/test"}}
    assert _is_appsync_event(appsync_event2) is True

    # AppSync event with graphqlSchemaVersion
    appsync_event3 = {"requestContext": {"graphqlSchemaVersion": "2022-02-01"}}
    assert _is_appsync_event(appsync_event3) is True

    # AppSync event with typeName/fieldName
    appsync_event4 = {"requestContext": {"typeName": "Query", "fieldName": "test"}}
    assert _is_appsync_event(appsync_event4) is True

    # AppSync event with header
    appsync_event5 = {"headers": {"x-amzn-appsync-is-vpce-request": "true"}}
    assert _is_appsync_event(appsync_event5) is True

    # REST API Gateway event (has methodArn)
    rest_event = {"methodArn": "arn:aws:execute-api:us-east-1:123456789012:abc123/GET/test"}
    assert _is_appsync_event(rest_event) is False

    # Regular event
    regular_event = {"headers": {"content-type": "application/json"}}
    assert _is_appsync_event(regular_event) is False


def test_appsync_response_authorized():
    from authorizer import _appsync_response

    context = {"provider": "local", "sub": "user-123", "scope": "goal:write"}
    response = _appsync_response(True, context)

    assert response["isAuthorized"] is True
    assert response["resolverContext"] == context
    assert response["deniedFields"] == []
    assert response["ttlOverride"] == 300


def test_appsync_response_authorized_no_write_scope():
    from authorizer import _appsync_response

    context = {"provider": "local", "sub": "user-123", "scope": "goal:read"}
    response = _appsync_response(True, context)

    assert response["isAuthorized"] is True
    assert response["resolverContext"] == context
    assert response["deniedFields"] == ["Mutation.*"]
    assert response["ttlOverride"] == 300


def test_appsync_response_unauthorized():
    from authorizer import _appsync_response

    context = {"error": "Unauthorized"}
    response = _appsync_response(False, context)

    assert response["isAuthorized"] is False
    assert response["resolverContext"] == context
    assert response["deniedFields"] == []
    assert response["ttlOverride"] == 300


def test_handler_success_local_jwt():
    from authorizer import handler
    import authorizer

    # Mock successful local JWT verification
    with patch.object(authorizer, 'verify_local_jwt', return_value={
        "sub": "user-123",
        "email": "user@example.com",
        "scope": "goal:write"
    }):
        # REST API Gateway event
        event = {
            "authorizationToken": "Bearer test-token",
            "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abc123/GET/test",
            "requestContext": {"stage": "prod"}
        }
        context = Mock()
        context.aws_request_id = "test-request-id"

        response = handler(event, context)

        assert "principalId" in response
        assert "policyDocument" in response
        assert response["principalId"] == "user-123"
        assert response["context"]["provider"] == "local"
        assert response["context"]["sub"] == "user-123"
        assert response["context"]["email"] == "user@example.com"


def test_handler_success_cognito_jwt():
    from authorizer import handler
    import authorizer

    # Mock failed local JWT and successful Cognito JWT
    with patch.object(authorizer, 'verify_local_jwt', side_effect=Exception("Invalid local token")), \
         patch.object(authorizer, 'verify_cognito_jwt', return_value={
             "sub": "user-456",
             "email": "user@cognito.com",
             "token_use": "id",
             "scope": "goal:read"
         }):
        # HTTP API v2 event
        event = {
            "version": "2.0",
            "routeKey": "GET /test",
            "headers": {"authorization": "Bearer cognito-token"},
            "requestContext": {"stage": "prod"}
        }
        context = Mock()
        context.aws_request_id = "test-request-id"

        response = handler(event, context)

        assert response["isAuthorized"] is True
        assert response["context"]["provider"] == "cognito"
        assert response["context"]["sub"] == "user-456"


def test_handler_appsync_success():
    from authorizer import handler
    import authorizer

    # Mock failed local JWT and successful Cognito JWT
    with patch.object(authorizer, 'verify_local_jwt', side_effect=Exception("Invalid local token")), \
         patch.object(authorizer, 'verify_cognito_jwt', return_value={
             "sub": "user-789",
             "email": "user@appsync.com",
             "token_use": "access",
             "scope": "goal:write"
         }):
        # AppSync event
        event = {
            "requestContext": {
                "apiId": "test-api",
                "operationName": "TestQuery",
                "typeName": "Query",
                "fieldName": "testField"
            },
            "headers": {"authorization": "Bearer appsync-token"}
        }
        context = Mock()
        context.aws_request_id = "test-request-id"

        response = handler(event, context)

        assert response["isAuthorized"] is True
        assert response["resolverContext"]["provider"] == "cognito"
        assert response["deniedFields"] == []  # Should allow mutations with goal:write scope


def test_handler_verification_failure():
    from authorizer import handler
    import authorizer

    # Mock both local and Cognito JWT verification failures
    with patch.object(authorizer, 'verify_local_jwt', side_effect=Exception("Invalid local token")):
        # REST API Gateway event
        event = {
            "authorizationToken": "Bearer invalid-token",
            "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abc123/GET/test"
        }
        context = Mock()
        context.aws_request_id = "test-request-id"

        with pytest.raises(Exception) as exc_info:
            handler(event, context)
        assert "Unauthorized" in str(exc_info.value)


def test_handler_httpapi_verification_failure():
    from authorizer import handler
    import authorizer

    # Mock both local and Cognito JWT verification failures
    with patch.object(authorizer, 'verify_local_jwt', side_effect=Exception("Invalid local token")):
        # HTTP API v2 event
        event = {
            "version": "2.0",
            "routeKey": "GET /test",
            "headers": {"authorization": "Bearer invalid-token"}
        }
        context = Mock()
        context.aws_request_id = "test-request-id"

        response = handler(event, context)

        assert response["isAuthorized"] is False
        assert response["context"]["error"] == "Unauthorized"


def test_handler_appsync_verification_failure():
    from authorizer import handler
    import authorizer

    # Mock both local and Cognito JWT verification failures
    with patch.object(authorizer, 'verify_local_jwt', side_effect=Exception("Invalid local token")):
        # AppSync event
        event = {
            "requestContext": {"apiId": "test-api"},
            "headers": {"authorization": "Bearer invalid-token"}
        }
        context = Mock()
        context.aws_request_id = "test-request-id"

        response = handler(event, context)

        assert response["isAuthorized"] is False
        assert response["resolverContext"]["error"] == "Unauthorized"


def test_debug_logging_enabled():
    from authorizer import _dbg
    import authorizer

    # Enable debug logging by patching the module variable
    with patch.object(authorizer, 'AUTH_LOG_ENABLED', True), \
         patch.object(authorizer, 'logger') as mock_logger:
        _dbg("test_event", field1="value1", field2="value2")

        # Verify logger was called with structured JSON
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args[0][0]
        logged_data = json.loads(call_args)
        assert logged_data["event"] == "test_event"
        assert logged_data["field1"] == "value1"
        assert logged_data["field2"] == "value2"


def test_debug_logging_disabled():
    from authorizer import _dbg
    import authorizer

    # Ensure debug logging is disabled by patching the module variable
    with patch.object(authorizer, 'AUTH_LOG_ENABLED', False), \
         patch.object(authorizer, 'logger') as mock_logger:
        _dbg("test_event", field1="value1")

        # Verify logger was not called
        mock_logger.info.assert_not_called()


def test_debug_logging_with_token_peek():
    from authorizer import _dbg
    import authorizer

    # Enable debug logging by patching the module variable
    with patch.object(authorizer, 'AUTH_LOG_ENABLED', True), \
         patch.object(authorizer, 'logger') as mock_logger:
        # Create a test token
        payload = {"sub": "test-user", "exp": int(time.time()) + 3600}
        token = jwt.encode(payload, "secret", algorithm="HS256", headers={"kid": "test-kid"})

        _dbg("test_event", token=token)

        # Verify logger was called and token was peeked
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args[0][0]
        logged_data = json.loads(call_args)
        assert logged_data["event"] == "test_event"
        assert "token_hint" in logged_data
        assert logged_data["token_hint"]["kid"] == "test-kid"
        assert logged_data["token_hint"]["len"] == len(token)
