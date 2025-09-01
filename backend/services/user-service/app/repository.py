from typing import Optional, List
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from .models import UserItem
import boto3
import os

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
USER_TABLE_NAME = os.getenv("USER_TABLE_NAME", "users")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
user_table = dynamodb.Table(USER_TABLE_NAME)

class UserRepository:
  """
  Repository class for user data access operations.
  Encapsulates all DynamoDB interactions.
  """

  def get_user_by_email(self, email: str) -> Optional[UserItem]:
    """
    Retrieve a user by email.
    """
    try:
      response = user_table.get_item(Key={"email": email})
      item = response.get("Item")
      if item:
        return UserItem(**item)
      return None
    except ClientError as e:
      raise RuntimeError(f"Failed to get user by email: {e}")

  def get_user_by_verification_token(self, token: str) -> Optional[UserItem]:
    """
    Retrieve a user by email verification token.
    """
    try:
      response = user_table.scan(
        FilterExpression=Attr("verification_token").eq(token)
      )
      items = response.get("Items", [])
      if items:
        return UserItem(**items[0])
      return None
    except ClientError as e:
      raise RuntimeError(f"Failed to get user by verification token: {e}")

  def create_user(self, user: UserItem) -> None:
    """
    Create a new user in the table.
    """
    try:
      user_table.put_item(
        Item=user.dict(),
        ConditionExpression="attribute_not_exists(email)"
      )
    except ClientError as e:
      if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
        raise ValueError("User already exists.")
      raise RuntimeError(f"Failed to create user: {e}")

  def update_email_verified(self, email: str) -> None:
    """
    Update user's email_verified to True and remove verification_token.
    """
    try:
      user_table.update_item(
        Key={"email": email},
        UpdateExpression="SET email_verified = :true REMOVE verification_token",
        ExpressionAttributeValues={":true": True},
        ConditionExpression="email_verified = :false",
        ExpressionAttributeValuesUpdate={":false": False}
      )
    except ClientError as e:
      raise RuntimeError(f"Failed to update email verification status: {e}")
