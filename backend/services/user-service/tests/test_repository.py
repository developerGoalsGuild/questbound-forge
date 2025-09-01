import unittest
from unittest.mock import patch, MagicMock
from app.repository import UserRepository
from app.models import UserItem

class TestUserRepository(unittest.TestCase):

  @patch("app.repository.user_table")
  def test_get_user_by_email_found(self, mock_table):
    mock_table.get_item.return_value = {"Item": {"email": "test@example.com"}}
    repo = UserRepository()
    user = repo.get_user_by_email("test@example.com")
    self.assertIsNotNone(user)
    self.assertEqual(user.email, "test@example.com")

  @patch("app.repository.user_table")
  def test_get_user_by_email_not_found(self, mock_table):
    mock_table.get_item.return_value = {}
    repo = UserRepository()
    user = repo.get_user_by_email("missing@example.com")
    self.assertIsNone(user)

  @patch("app.repository.user_table")
  def test_create_user_success(self, mock_table):
    mock_table.put_item.return_value = {}
    repo = UserRepository()
    user = UserItem(email="new@example.com")
    repo.create_user(user)
    mock_table.put_item.assert_called_once()

  @patch("app.repository.user_table")
  def test_create_user_already_exists(self, mock_table):
    from botocore.exceptions import ClientError
    error_response = {"Error": {"Code": "ConditionalCheckFailedException"}}
    mock_table.put_item.side_effect = ClientError(error_response, "PutItem")
    repo = UserRepository()
    user = UserItem(email="exists@example.com")
    with self.assertRaises(ValueError):
      repo.create_user(user)

  @patch("app.repository.user_table")
  def test_update_email_verified(self, mock_table):
    mock_table.update_item.return_value = {}
    repo = UserRepository()
    repo.update_email_verified("test@example.com")
    mock_table.update_item.assert_called_once()
