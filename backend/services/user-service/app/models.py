from pydantic import BaseModel, EmailStr
from typing import Optional

class UserItem(BaseModel):
  """
  Represents a user item stored in DynamoDB.
  """
  email: EmailStr
  password_hash: Optional[str] = None
  salt: Optional[str] = None
  login_type: str = "social"  # 'native' or 'social'
  email_verified: bool = False
  verification_token: Optional[str] = None

class SignUpRequest(BaseModel):
  """
  Request model for native user sign-up.
  """
  email: EmailStr
  password: str

class EmailVerificationRequest(BaseModel):
  """
  Request model for email verification.
  """
  token: str

class LoginResponse(BaseModel):
  """
  Response model for login tokens.
  """
  access_token: str
  id_token: str
  refresh_token: str
  token_type: str
  expires_in: int
