from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class OptInPayload(BaseModel):
    isOptedIn: bool = Field(..., description="Whether the user is eligible for AI matching")
    languages: list[str] = Field(default_factory=list)
    timezone: str | None = None
    tags: list[str] = Field(default_factory=list)
    bio: str | None = None


class OptInResponse(BaseModel):
    userId: str
    isOptedIn: bool
    updatedAt: str


class CreateSessionResponse(BaseModel):
    sessionId: str
    questions: list[dict[str, Any]]
    expiresAt: str


class SessionAnswerPayload(BaseModel):
    coreAnswers: dict[str, Any] | None = None
    followupAnswers: list[dict[str, Any]] | None = None


class SessionAnswerResponse(BaseModel):
    sessionId: str
    status: Literal["OPEN", "READY_TO_MATCH", "EXPIRED"]
    nextQuestions: list[dict[str, Any]] = Field(default_factory=list)


class CandidateRecommendation(BaseModel):
    userId: str
    score: float = Field(..., ge=0.0, le=1.0)
    reason: str
    suggestedFirstMessage: str


class MatchResponse(BaseModel):
    matchBatchId: str
    candidates: list[CandidateRecommendation]
    expiresAt: str


class ChooseCandidatePayload(BaseModel):
    chosenUserId: str


class ChooseCandidateResponse(BaseModel):
    requestId: str
    status: Literal["PENDING"]
    toUserId: str
    createdAt: str


class ConnectRequestItem(BaseModel):
    requestId: str
    fromUserId: str
    status: Literal["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]
    createdAt: str
    expiresAt: str | None = None


class ListRequestsResponse(BaseModel):
    requests: list[ConnectRequestItem]


class AcceptRequestResponse(BaseModel):
    requestId: str
    status: Literal["ACCEPTED"]
    dmRoomId: str
    prefill: str | None = None


class DeclineRequestResponse(BaseModel):
    requestId: str
    status: Literal["DECLINED"]


class WebPushSubscribePayload(BaseModel):
    subscription: dict[str, Any]


class WebPushSubscribeResponse(BaseModel):
    status: Literal["subscribed"]
    updatedAt: str



