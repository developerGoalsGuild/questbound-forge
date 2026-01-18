from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional

# Subscription tier types (matching subscription service)
SubscriptionTier = Literal["INITIATE", "JOURNEYMAN", "SAGE", "GUILDMASTER"]


class SignupLocal(BaseModel):
  provider: Literal['local'] = 'local'
  email: EmailStr
  password: str
  role: Literal['user','partner','patron'] = 'user'
  name: Optional[str] = None
  # Extended profile fields (to mirror AppSync createUser)
  nickname: Optional[str] = None
  birthDate: Optional[str] = None  # YYYY-MM-DD
  country: Optional[str] = None
  language: Optional[str] = 'en'
  gender: Optional[str] = None
  pronouns: Optional[str] = None
  bio: Optional[str] = None
  tags: Optional[list[str]] = None
  subscriptionTier: Optional[SubscriptionTier] = None


class SignupGoogle(BaseModel):
  provider: Literal['google'] = 'google'
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


class TokenRenewRequest(BaseModel):
  access_token: Optional[str] = None
  refresh_token: Optional[str] = None


class PublicUser(BaseModel):
  user_id: str
  email: EmailStr
  name: Optional[str] = None
  provider: str


class SendTempPassword(BaseModel):
  email: EmailStr


class PasswordResetRequest(BaseModel):
  email: EmailStr


class PasswordChangeRequest(BaseModel):
  current_password: str | None = None # required for both flows
  new_password: str
  challenge_token: str | None = None # when must-change flow is triggered
  reset_token: str | None = None # when password reset flow is triggered


class ConfirmEmailResponse(BaseModel):
  message: str


class ResendConfirmationRequest(BaseModel):
  email: EmailStr


class NotificationPreferences(BaseModel):
  """User notification preferences for quest-related events"""
  questStarted: bool = True
  questCompleted: bool = True
  questFailed: bool = True
  progressMilestones: bool = True
  deadlineWarnings: bool = True
  streakAchievements: bool = True
  challengeUpdates: bool = True
  channels: dict = Field(default_factory=lambda: {"inApp": True, "email": False, "push": False})


class UserProfile(BaseModel):
  id: str
  email: EmailStr
  role: Literal['user','partner','patron'] = 'user'
  fullName: Optional[str] = None
  nickname: Optional[str] = None
  birthDate: Optional[str] = None  # YYYY-MM-DD
  status: str = 'ACTIVE'
  country: Optional[str] = None
  language: str = 'en'
  gender: Optional[str] = None
  pronouns: Optional[str] = None
  bio: Optional[str] = None
  tags: list[str] = []
  tier: str = 'free'
  provider: str
  email_confirmed: bool = False
  notificationPreferences: Optional[NotificationPreferences] = None
  createdAt: int
  updatedAt: int


class ProfileUpdate(BaseModel):
  fullName: Optional[str] = None
  nickname: Optional[str] = None
  birthDate: Optional[str] = None  # YYYY-MM-DD
  country: Optional[str] = None
  language: Optional[str] = None
  gender: Optional[str] = None
  pronouns: Optional[str] = None
  bio: Optional[str] = None
  tags: Optional[list[str]] = None
  notificationPreferences: Optional[dict] = None


class AppSyncKeyResponse(BaseModel):
  apiKey: str
  issuedAt: str
  expiresAt: str


class AvailabilityKeyResponse(BaseModel):
  apiKey: str
  expiresAt: str


class WaitlistSubscribe(BaseModel):
  email: EmailStr


class WaitlistResponse(BaseModel):
  message: str
  email: str
  subscribed: bool


class NewsletterSubscribe(BaseModel):
  email: EmailStr
  source: Optional[str] = "footer"  # "footer", "modal", "landing_page", etc.


class NewsletterResponse(BaseModel):
  message: str
  email: str
  subscribed: bool


class ContactSubmit(BaseModel):
  name: str
  email: EmailStr
  subject: str
  message: str
  honeypot: Optional[str] = None  # Honeypot field for bot detection


class ContactResponse(BaseModel):
  message: str
  submitted: bool
