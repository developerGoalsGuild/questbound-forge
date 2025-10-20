"""
Avatar API endpoints for the guild service.

This module handles all HTTP endpoints related to guild avatar operations,
including upload URL generation and avatar retrieval.
"""

import os
import boto3
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer
from botocore.exceptions import ClientError

from ..models.avatar import AvatarUploadRequest, AvatarUploadResponse, AvatarGetResponse, AvatarConfirmRequest
from ..security.authentication import authenticate
from ..security.auth_models import AuthContext
from ..security.rate_limiter import rate_limit
from ..db.guild_db import get_guild, update_guild, GuildNotFoundError, GuildPermissionError

router = APIRouter(prefix="/guilds", tags=["guild-avatars"])
security = HTTPBearer()

# Initialize S3 client
s3_client = boto3.client('s3')
AVATAR_BUCKET = os.getenv('AVATAR_BUCKET', 'goalsguild-guild-avatars-dev')
AVATAR_MAX_SIZE = int(os.getenv('AVATAR_MAX_SIZE_MB', '1')) * 1024 * 1024  # Convert MB to bytes (1MB max after frontend compression)
AVATAR_ALLOWED_TYPES = os.getenv('AVATAR_ALLOWED_TYPES', 'image/jpeg,image/png,image/webp').split(',')

@router.post("/{guild_id}/avatar/upload-url", response_model=AvatarUploadResponse)
@rate_limit(requests_per_hour=10)
async def generate_avatar_upload_url(
    guild_id: str,
    request: AvatarUploadRequest,
    auth: AuthContext = Depends(authenticate)
):
    """Generate a presigned URL for uploading a guild avatar."""
    try:
        # Check if user has permission to upload avatar (owner only)
        guild = await get_guild(guild_id=guild_id, include_members=True)
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        
        # Check if user is the guild owner
        if guild.created_by != auth.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only guild owner can upload avatar"
            )
        
        # Validate file type
        if request.file_type not in AVATAR_ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(AVATAR_ALLOWED_TYPES)}"
            )
        
        # Validate file size
        if request.file_size > AVATAR_MAX_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size too large. Maximum size: {AVATAR_MAX_SIZE // (1024 * 1024)}MB"
            )
        
        # Generate unique key for the avatar
        file_extension = request.file_type.split('/')[-1]
        avatar_key = f"guilds/{guild_id}/avatar.{file_extension}"
        
        # Generate presigned URL for upload
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': AVATAR_BUCKET,
                'Key': avatar_key,
                'ContentType': request.file_type,
                'ContentLength': request.file_size
            },
            ExpiresIn=3600  # 1 hour
        )
        
        # Return API-served path (bucket is private)
        api_avatar_path = f"/v1/guilds/{guild_id}/avatar"
        return AvatarUploadResponse(
            uploadUrl=presigned_url,
            avatarUrl=api_avatar_path,
            avatarKey=avatar_key
        )
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{guild_id}/avatar/confirm", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=20)
async def confirm_avatar_upload(
    guild_id: str,
    payload: AvatarConfirmRequest,
    auth: AuthContext = Depends(authenticate)
):
    """Confirm avatar upload and update guild record."""
    try:
        # Check if user has permission to update avatar (owner only)
        guild = await get_guild(guild_id=guild_id)
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        
        if guild.created_by != auth.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only guild owner can update avatar"
            )
        
        # Verify the file exists in S3
        try:
            s3_client.head_object(Bucket=AVATAR_BUCKET, Key=payload.avatar_key)
        except ClientError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar file not found in storage"
            )
        
        # Update guild with new avatar key
        await update_guild(
            guild_id=guild_id,
            updated_by=auth.user_id,
            avatar_key=payload.avatar_key
        )
        
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to confirm avatar upload"
        )

@router.get("/{guild_id}/avatar")
async def get_guild_avatar(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Generate a signed S3 URL for the avatar (bypasses API Gateway size limits)."""
    try:
        guild = await get_guild(guild_id=guild_id)
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )

        if not guild.avatar_key:
            # Return a response indicating no avatar instead of an error
            return {"avatar_url": None, "has_avatar": False}

        # Generate a signed URL that expires in 1 hour
        signed_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': AVATAR_BUCKET, 'Key': guild.avatar_key},
            ExpiresIn=3600  # 1 hour
        )
        
        # Return the signed URL as JSON
        return {"avatar_url": signed_url}

    except ClientError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar file not found")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve guild avatar")

@router.delete("/{guild_id}/avatar", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(requests_per_hour=5)
async def delete_guild_avatar(
    guild_id: str,
    auth: AuthContext = Depends(authenticate)
):
    """Delete guild avatar."""
    try:
        # Check if user has permission to delete avatar (owner only)
        guild = await get_guild(guild_id=guild_id)
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        
        if guild.created_by != auth.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only guild owner can delete avatar"
            )
        
        if not guild.avatar_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild has no avatar"
            )
        
        # Delete from S3
        try:
            s3_client.delete_object(Bucket=AVATAR_BUCKET, Key=guild.avatar_key)
        except ClientError as e:
            # Log error but don't fail the request
            print(f"Failed to delete avatar from S3: {e}")
        
        # Update guild to remove avatar
        await update_guild(
            guild_id=guild_id,
            updated_by=auth.user_id,
            avatar_url=None,
            avatar_key=None
        )
        
    except GuildNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guild not found"
        )
    except GuildPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete guild avatar"
        )

