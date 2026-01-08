import pytest
from unittest.mock import Mock, patch


def _fake_settings():
    s = Mock()
    s.jwt_secret = "secret"
    s.jwt_audience = "aud"
    s.jwt_issuer = "iss"
    s.cognito_region = "us-east-1"
    s.cognito_user_pool_id = "pool"
    s.cognito_client_id = "client"
    return s


def test_verify_local_success():
    from app.auth import TokenVerifier
    settings = _fake_settings()
    tv = TokenVerifier(settings)
    with patch("app.auth.jwt.decode") as dec:
        dec.return_value = {"sub": "user-123"}
        claims, provider = tv.verify("tok")
        assert claims["sub"] == "user-123"
        assert provider == "local"


def test_verify_local_fallback_to_cognito_success():
    from app.auth import TokenVerifier
    settings = _fake_settings()
    tv = TokenVerifier(settings)
    with patch("app.auth.jwt.decode") as dec, \
         patch("app.auth.PyJWKClient") as jwks_cls:
        # First call (local) raises, second call (cognito) returns
        dec.side_effect = [Exception("bad"), {"token_use": "access", "client_id": "client"}]
        jwk = Mock()
        jwk.get_signing_key_from_jwt.return_value.key = "pubkey"
        jwks_cls.return_value = jwk
        claims, provider = tv.verify("tok")
        assert provider == "cognito"


def test_verify_cognito_invalid_audience_raises():
    from app.auth import TokenVerifier, TokenVerificationError
    settings = _fake_settings()
    tv = TokenVerifier(settings)
    with patch("app.auth.PyJWKClient") as jwks_cls, \
         patch("app.auth.jwt.decode") as dec:
        jwk = Mock()
        jwk.get_signing_key_from_jwt.return_value.key = "pubkey"
        jwks_cls.return_value = jwk
        dec.return_value = {"token_use": "id", "aud": "other", "iss": tv.cognito_issuer}
        with pytest.raises(TokenVerificationError):
            tv._verify_cognito("tok")


def test_verify_cognito_invalid_client_id_raises():
    from app.auth import TokenVerifier, TokenVerificationError
    settings = _fake_settings()
    tv = TokenVerifier(settings)
    with patch("app.auth.PyJWKClient") as jwks_cls, \
         patch("app.auth.jwt.decode") as dec:
        jwk = Mock()
        jwk.get_signing_key_from_jwt.return_value.key = "pubkey"
        jwks_cls.return_value = jwk
        dec.return_value = {"token_use": "access", "client_id": "wrong", "iss": tv.cognito_issuer}
        with pytest.raises(TokenVerificationError):
            tv._verify_cognito("tok")


def test_verify_cognito_unsupported_token_use():
    from app.auth import TokenVerifier, TokenVerificationError
    settings = _fake_settings()
    tv = TokenVerifier(settings)
    with patch("app.auth.PyJWKClient") as jwks_cls, \
         patch("app.auth.jwt.decode") as dec:
        jwk = Mock()
        jwk.get_signing_key_from_jwt.return_value.key = "pubkey"
        jwks_cls.return_value = jwk
        dec.return_value = {"token_use": "refresh", "iss": tv.cognito_issuer}
        with pytest.raises(TokenVerificationError):
            tv._verify_cognito("tok")


def test_verify_local_logs_pyjwt_error_and_raises_on_cognito_failure():
    from app.auth import TokenVerifier, TokenVerificationError, PyJWTError
    settings = _fake_settings()
    tv = TokenVerifier(settings)
    with patch("app.auth.jwt.decode", side_effect=PyJWTError("bad")), \
         patch.object(TokenVerifier, "_verify_cognito", side_effect=Exception("no jwks")):
        with pytest.raises(TokenVerificationError):
            tv.verify("tok")


def test_verify_cognito_id_token_audience_list_ok():
    from app.auth import TokenVerifier
    settings = _fake_settings()
    tv = TokenVerifier(settings)
    with patch("app.auth.PyJWKClient") as jwks_cls, \
         patch("app.auth.jwt.decode") as dec:
        jwk = Mock()
        jwk.get_signing_key_from_jwt.return_value.key = "pubkey"
        jwks_cls.return_value = jwk
        dec.return_value = {"token_use": "id", "aud": ["foo", "client"], "iss": tv.cognito_issuer}
        claims = tv._verify_cognito("tok")
        assert claims["token_use"] == "id"


