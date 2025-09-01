import json
import time
from botocore.exceptions import ClientError
import boto3
import os
from .models import UserItem, SignUpRequest

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
PASSWORD_KEY_PARAM = "/goalsguild/dev/crypto/password_key"  # Keep for backward compatibility if needed

ssm_client = boto3.client("ssm", region_name=AWS_REGION)
ses_client = boto3.client("ses", region_name=AWS_REGION)

class UserService:
  """
  Service class encapsulating business logic for user operations.
  """

  def __init__(self, user_repository):
    self.user_repository = user_repository
    self.config_cache = {}
    self.config_cache_expiry = 0
    self.config_cache_ttl = 300  # Cache TTL in seconds (5 minutes)
    self.load_cognito_config()

  def get_parameter(self, name: str, with_decryption: bool = False) -> str:
    """
    Retrieve a parameter value from AWS Parameter Store.
    """
    try:
      response = ssm_client.get_parameter(Name=name, WithDecryption=with_decryption)
      return response["Parameter"]["Value"]
    except ClientError as e:
      print(f"Error retrieving parameter {name}: {e}")
      raise RuntimeError(f"Failed to retrieve parameter {name}")

  def load_cognito_config(self) -> None:
    """
    Load Cognito and crypto config parameters from centralized SSM JSON parameter.
    Cache the config with TTL to reduce calls.
    """
    now = time.time()
    if now < self.config_cache_expiry and self.config_cache:
      return  # Use cached config

    # Fetch JSON env vars parameter
    param_name = f"/goalsguild/{os.getenv('ENVIRONMENT', 'dev')}/user-service/env_vars"
    try:
      param_value = self.get_parameter(param_name, with_decryption=True)
      env_vars = json.loads(param_value)
    except Exception as e:
      raise RuntimeError(f"Failed to load environment variables from SSM: {e}")

    # Validate required keys
    required_keys = [
      "COGNITO_USER_POOL_ID",
      "COGNITO_CLIENT_ID",
      "EMAIL_SENDER",
      "FRONTEND_BASE_URL",
      "PASSWORD_KEY"
    ]
    for key in required_keys:
      if key not in env_vars or not env_vars[key]:
        raise RuntimeError(f"Missing required environment variable '{key}' in SSM parameter")

    self.config_cache = env_vars
    self.config_cache_expiry = now + self.config_cache_ttl

  def get_secret_hash(self, username: str) -> str | None:
    """
    Calculate secret hash for Cognito client secret if configured.
    """
    client_secret = self.config_cache.get("COGNITO_CLIENT_SECRET")
    client_id = self.config_cache.get("COGNITO_CLIENT_ID")
    if not client_secret or not client_id:
      return None
    import hmac
    import hashlib
    import base64
    message = username + client_id
    dig = hmac.new(str(client_secret).encode('utf-8'), msg=message.encode('utf-8'), digestmod=hashlib.sha256).digest()
    return base64.b64encode(dig).decode()

  def generate_salt(self, length: int = 16) -> str:
    import secrets
    return secrets.token_hex(length)

  def hash_password(self, password: str, salt: str) -> str:
    import hmac
    import hashlib
    key = self.config_cache["PASSWORD_KEY"].encode("utf-8")
    pwd_salt = password + salt
    hashed = hmac.new(key, pwd_salt.encode("utf-8"), hashlib.sha256).hexdigest()
    return hashed

  def generate_verification_token(self) -> str:
    import secrets
    return secrets.token_urlsafe(32)

  def send_verification_email(self, email: str, token: str) -> None:
    from urllib.parse import urlencode
    verification_link = f"{self.config_cache['FRONTEND_BASE_URL']}/confirm-email?{urlencode({'token': token, 'email': email})}"
    email_subject = "Please verify your email address"
    email_body = f"""
    Hello,

    Thank you for registering. Please verify your email address by clicking the link below:

    {verification_link}

    If you did not register, please ignore this email.

    Regards,
    Your Team
    """
    try:
      ses_client.send_email(
        Source=self.config_cache["EMAIL_SENDER"],
        Destination={"ToAddresses": [email]},
        Message={
          "Subject": {"Data": email_subject},
          "Body": {"Text": {"Data": email_body}}
        }
      )
    except ClientError as e:
      print(f"Error sending verification email: {e}")
      raise RuntimeError("Failed to send verification email.")

  # ... other methods unchanged, using self.config_cache for env vars ...
