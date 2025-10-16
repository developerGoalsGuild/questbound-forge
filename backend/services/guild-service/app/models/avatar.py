from pydantic import BaseModel, Field

class AvatarUploadResponse(BaseModel):
    avatar_url: str = Field(..., description="Public URL of the uploaded avatar")
    avatar_key: str = Field(..., description="S3 key of the uploaded avatar")
    message: str = Field(..., description="Success message")

class AvatarGetResponse(BaseModel):
    avatar_url: Optional[str] = Field(None, description="Public URL of the avatar")
    avatar_key: Optional[str] = Field(None, description="S3 key of the avatar")

