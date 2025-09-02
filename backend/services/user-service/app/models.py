from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SignupLocal(BaseModel):
  provider: str = Field("local", const=True)
  email: EmailStr
  password: str
  name: Optional[str] = None


class SignupGoogle(BaseModel):
  provider: str = Field("google", const=True)
  authorization_code: str
  redirect_uri: str


class LoginLocal(BaseModel):
  email: EmailStr
  password: str


class TokenResponse(BaseModel):
  token_type: str = "Bearer"
  access_token: str
  expires_in: int
  id_token: Optional[str] = None
  refresh_token: Optional[str] = None


class PublicUser(BaseModel):
  user_id: str
  email: EmailStr
  name: Optional[str] = None
  provider: str


class SendTempPassword(BaseModel):
  email: EmailStr


class PasswordChangeRequest(BaseModel):
  current_password: str | None = None # required for both flows
  new_password: str
  challenge_token: str | None = None # when must-change flow is triggered


class ConfirmEmailResponse(BaseModel):
  message: str