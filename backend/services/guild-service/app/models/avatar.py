from typing import Optional
from pydantic import BaseModel, Field

class AvatarUploadRequest(BaseModel):
    file_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., description="Size of the file in bytes")

class AvatarUploadResponse(BaseModel):
    uploadUrl: str = Field(..., description="Presigned URL for uploading")
    avatarUrl: str = Field(..., description="Public URL of the uploaded avatar")
    avatarKey: str = Field(..., description="S3 key of the uploaded avatar")

class AvatarGetResponse(BaseModel):
    avatar_url: Optional[str] = Field(None, description="Public URL of the avatar")
    avatar_key: Optional[str] = Field(None, description="S3 key of the avatar")


class AvatarConfirmRequest(BaseModel):
    avatar_key: str = Field(..., description="S3 key to confirm")

