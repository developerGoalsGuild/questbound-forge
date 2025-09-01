import unittest
from unittest.mock import MagicMock, patch
from app.service import UserService
from app.models import SignUpRequest, UserItem

class TestUserService(unittest.TestCase):

  def setUp(self):
    self.mock_repo = MagicMock()
    self.user_service = UserService(self.mock_repo)
    # Patch load_cognito_config to avoid SSM calls during tests
    self.user_service.load_cognito_config = MagicMock()
    self.user_service.config_cache = {
      "PASSWORD_KEY": b"testkey",
      "COGNITO_CLIENT_ID": "clientid",
      "COGNITO_CLIENT_SECRET": "secret"
    }

  def test_signup_native_success(self):
    signup_data = SignUpRequest(email="test@example.com", password="password123")
    self.mock_repo.get_user_by_email.return_value = None
    self.mock_repo.create_user.return_value = None
    self.user_service.send_verification_email = MagicMock()

    self.user_service.signup_native(signup_data)

    self.mock_repo.get_user_by_email.assert_called_once_with("test@example.com")
    self.mock_repo.create_user.assert_called_once()
    self.user_service.send_verification_email.assert_called_once()

  def test_signup_native_user_exists(self):
    signup_data = SignUpRequest(email="test@example.com", password="password123")
    self.mock_repo.get_user_by_email.return_value = UserItem(email="test@example.com")

    with self.assertRaises(ValueError) as context:
      self.user_service.signup_native(signup_data)
    self.assertEqual(str(context.exception), "User already exists.")

  def test_confirm_email_success(self):
    user = UserItem(email="test@example.com", email_verified=False)
    self.mock_repo.get_user_by_verification_token.return_value = user
    self.mock_repo.update_email_verified.return_value = None

    self.user_service.confirm_email("validtoken")

    self.mock_repo.get_user_by_verification_token.assert_called_once_with("validtoken")
    self.mock_repo.update_email_verified.assert_called_once_with("test@example.com")

  def test_confirm_email_invalid_token(self):
    self.mock_repo.get_user_by_verification_token.return_value = None

    with self.assertRaises(ValueError) as context:
      self.user_service.confirm_email("invalidtoken")
    self.assertEqual(str(context.exception), "Invalid or expired verification token.")

  def test_confirm_email_already_verified(self):
    user = UserItem(email="test@example.com", email_verified=True)
    self.mock_repo.get_user_by_verification_token.return_value = user

    with self.assertRaises(ValueError) as context:
      self.user_service.confirm_email("token")
    self.assertEqual(str(context.exception), "Email already verified.")
