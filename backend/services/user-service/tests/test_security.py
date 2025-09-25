import pytest
from app.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    generate_secure_password,
    issue_local_jwt,
    verify_local_jwt,
)
from app.tokens import TokenPurpose


def test_hash_password():
    plain = "test_password"
    hashed = hash_password(plain)

    assert hashed != plain
    assert verify_password(plain, hashed)
    assert not verify_password("wrong_password", hashed)


def test_verify_password():
    plain = "correct_password"
    hashed = hash_password(plain)

    assert verify_password(plain, hashed)
    assert not verify_password("wrong_password", hashed)
    assert not verify_password("", hashed)


def test_validate_password_strength():
    # Valid passwords
    validate_password_strength("Aa1!aaaa")
    validate_password_strength("StrongP@ssw0rd123")

    # Invalid passwords
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_strength("Aa1!")

    with pytest.raises(ValueError, match="lowercase letter"):
        validate_password_strength("A1!AAAAA")

    with pytest.raises(ValueError, match="uppercase letter"):
        validate_password_strength("a1!aaaaa")

    with pytest.raises(ValueError, match="digit"):
        validate_password_strength("Aa!aaaaa")

    with pytest.raises(ValueError, match="special character"):
        validate_password_strength("Aa1aaaaa")


def test_generate_secure_password():
    pwd = generate_secure_password()
    assert len(pwd) >= 12

    # Should meet all complexity requirements
    validate_password_strength(pwd)

    # Should be different each time
    pwd2 = generate_secure_password()
    assert pwd != pwd2


def test_generate_secure_password_minimum_length():
    pwd = generate_secure_password(8)  # Below minimum
    assert len(pwd) >= 12  # Should be enforced to minimum


def test_issue_local_jwt():
    sub = "user-123"
    email = "test@example.com"
    scopes = ["user:read", "goal:write"]

    token_data = issue_local_jwt(sub, email, scopes)

    assert "access_token" in token_data
    assert "expires_in" in token_data
    assert token_data["expires_in"] == 1200  # default TTL

    # Verify the token
    payload = verify_local_jwt(token_data["access_token"])
    assert payload["sub"] == sub
    assert payload["email"] == email
    assert payload["scope"] == "user:read goal:write"
    assert payload["token_use"] == "access"
    assert payload["provider"] == "local"


def test_issue_local_jwt_with_role():
    sub = "user-123"
    email = "test@example.com"

    token_data = issue_local_jwt(sub, email, role="admin")

    payload = verify_local_jwt(token_data["access_token"])
    assert payload["role"] == "admin"


def test_verify_local_jwt_invalid_token():
    with pytest.raises(Exception):
        verify_local_jwt("invalid.token.here")


def test_verify_local_jwt_expired_token():
    import time
    import jwt
    from unittest.mock import patch

    # Create an expired token
    with patch('app.security.settings') as mock_settings:
        mock_settings.jwt_secret = "test-secret"
        mock_settings.jwt_audience = "test-audience"
        mock_settings.jwt_issuer = "test-issuer"

        payload = {
            "iss": "test-issuer",
            "aud": "test-audience",
            "sub": "user-123",
            "email": "test@example.com",
            "scope": "user:read",
            "iat": int(time.time()) - 3600,
            "nbf": int(time.time()) - 3600,
            "exp": int(time.time()) - 1800,  # Expired 30 minutes ago
            "token_use": "access",
            "provider": "local",
        }
        token = jwt.encode(payload, "test-secret", algorithm="HS256")

        with pytest.raises(Exception):
            verify_local_jwt(token)
