from __future__ import annotations

import logging
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import boto3
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

_SERVICES_DIR = Path(__file__).resolve().parents[2]
if str(_SERVICES_DIR) not in sys.path:
    sys.path.append(str(_SERVICES_DIR))

from common.logging import get_structured_logger, log_event

from .auth import authenticate
from . import db
from . import bedrock
from .models import (
    AcceptRequestResponse,
    ChooseCandidatePayload,
    ChooseCandidateResponse,
    CreateSessionResponse,
    DeclineRequestResponse,
    ListRequestsResponse,
    MatchResponse,
    OptInPayload,
    OptInResponse,
    SessionAnswerPayload,
    SessionAnswerResponse,
    WebPushSubscribePayload,
    WebPushSubscribeResponse,
)
from .settings import get_settings

settings = get_settings()
logger = get_structured_logger("connect-service", env_flag="CONNECT_LOG_ENABLED", default_enabled=True)

app = FastAPI(title="Connect Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_sns = boto3.client("sns", region_name=settings.aws_region) if settings.sns_topic_arn else None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "connect-service"}


@app.post("/connect/opt-in", response_model=OptInResponse)
async def opt_in(payload: OptInPayload, current_user: dict = Depends(authenticate)):
    user_id = current_user["sub"]
    item = db.put_connect_profile(
        user_id,
        {
            "isOptedIn": payload.isOptedIn,
            "languages": payload.languages,
            "timezone": payload.timezone,
            "tags": payload.tags,
            "bio": payload.bio,
        },
    )
    log_event(logger, "connect.opt_in.updated", userId=user_id, isOptedIn=payload.isOptedIn)
    return OptInResponse(userId=user_id, isOptedIn=bool(item.get("isOptedIn")), updatedAt=item["updatedAt"])


@app.post("/connect/session", response_model=CreateSessionResponse)
async def create_session(current_user: dict = Depends(authenticate)):
    user_id = current_user["sub"]
    session_id = str(uuid.uuid4())
    item = db.create_session(user_id, session_id)

    # Fixed MVP questions; frontend can render by id/type
    questions = [
        {"id": "goal", "label": "What goal are you focusing on right now?", "type": "text", "required": True},
        {"id": "style", "label": "Preferred accountability style?", "type": "select", "options": ["gentle", "direct", "mixed"], "required": True},
        {"id": "availability", "label": "How often do you want to check in?", "type": "select", "options": ["daily", "few_times_week", "weekly"], "required": True},
    ]

    return CreateSessionResponse(sessionId=session_id, questions=questions, expiresAt=str(item["expiresAt"]))


@app.post("/connect/session/{session_id}/answer", response_model=SessionAnswerResponse)
async def answer_session(session_id: str, payload: SessionAnswerPayload, current_user: dict = Depends(authenticate)):
    user_id = current_user["sub"]
    session = db.get_session(session_id)
    if not session or session.get("userId") != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    core = payload.coreAnswers or None
    followups = payload.followupAnswers or None

    updated = db.update_session_answers(session_id, core_answers=core, followup_qas=followups, status=None)

    # If core answers present and we don't have followups yet, generate 1-3 followups.
    next_questions: list[dict] = []
    status = str(updated.get("status") or "OPEN")

    if core and not updated.get("followupQAs"):
        try:
            qs = bedrock.generate_followups(core_answers=updated.get("coreAnswers") or {})
            next_questions = [{"id": f"followup_{i}", "label": q, "type": "text", "required": True} for i, q in enumerate(qs)]
            status = "OPEN"
        except Exception as exc:
            log_event(logger, "connect.followups.error", level=logging.ERROR, error=str(exc))
            # Non-fatal: allow matching without followups
            status = "READY_TO_MATCH"
            db.update_session_answers(session_id, core_answers=None, followup_qas=None, status=status)

    # If followups provided, mark ready.
    if payload.followupAnswers:
        status = "READY_TO_MATCH"
        db.update_session_answers(session_id, core_answers=None, followup_qas=None, status=status)

    return SessionAnswerResponse(sessionId=session_id, status=status, nextQuestions=next_questions)


@app.post("/connect/session/{session_id}/match", response_model=MatchResponse)
async def match(session_id: str, current_user: dict = Depends(authenticate)):
    user_id = current_user["sub"]
    session = db.get_session(session_id)
    if not session or session.get("userId") != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Require opt-in for matching
    profile = db.get_connect_profile(user_id)
    if not profile or not bool(profile.get("isOptedIn")):
        raise HTTPException(status_code=400, detail="User must opt in before matching")

    # Candidate pool (MVP: scan)
    candidates_raw = db.scan_opted_in_profiles(exclude_user_id=user_id, limit=100)
    if len(candidates_raw) < 3:
        raise HTTPException(status_code=409, detail="Not enough opted-in users to match right now")

    user_a_payload = {
        "userId": user_id,
        "languages": profile.get("languages") or [],
        "timezone": profile.get("timezone"),
        "tags": profile.get("tags") or [],
        "bio": profile.get("bio"),
        "coreAnswers": session.get("coreAnswers") or {},
        "followupQAs": session.get("followupQAs") or [],
    }
    candidates_payload = [
        {
            "userId": c.get("userId"),
            "languages": c.get("languages") or [],
            "timezone": c.get("timezone"),
            "tags": c.get("tags") or [],
            "bio": c.get("bio"),
        }
        for c in candidates_raw
        if c.get("userId")
    ]

    try:
        top3 = bedrock.rank_candidates(user_a=user_a_payload, candidates=candidates_payload)
    except Exception as exc:
        log_event(logger, "connect.match.bedrock_error", level=logging.ERROR, error=str(exc))
        raise HTTPException(status_code=502, detail="AI matching temporarily unavailable")

    if len(top3) < 3:
        raise HTTPException(status_code=502, detail="AI matching returned insufficient candidates")

    match_batch_id = str(uuid.uuid4())
    batch = db.put_match_batch(user_id, match_batch_id, top3, expires_in_minutes=10)

    return MatchResponse(matchBatchId=match_batch_id, candidates=top3, expiresAt=str(batch["expiresAt"]))


@app.post("/connect/match-batches/{match_batch_id}/choose", response_model=ChooseCandidateResponse)
async def choose(match_batch_id: str, payload: ChooseCandidatePayload, current_user: dict = Depends(authenticate)):
    user_id = current_user["sub"]
    batch = db.get_match_batch(match_batch_id)
    if not batch or batch.get("ownerUserId") != user_id:
        raise HTTPException(status_code=404, detail="Match batch not found")

    chosen = payload.chosenUserId
    # Find suggested message for chosen user
    suggested = None
    for c in batch.get("candidates") or []:
        if c.get("userId") == chosen:
            suggested = c.get("suggestedFirstMessage")
            break
    if not suggested:
        raise HTTPException(status_code=400, detail="Chosen user is not in match batch")

    request_id = str(uuid.uuid4())
    item = db.put_connect_request(
        request_id=request_id,
        to_user_id=chosen,
        from_user_id=user_id,
        match_batch_id=match_batch_id,
        suggested_first_message=str(suggested),
    )

    # Publish SNS event (event bus)
    if _sns and settings.sns_topic_arn:
        try:
            _sns.publish(
                TopicArn=settings.sns_topic_arn,
                Message=json.dumps(
                    {
                        "eventType": "connect_request_created",
                        "toUserId": chosen,
                        "fromUserId": user_id,
                        "requestId": request_id,
                        "createdAt": item.get("createdAt"),
                        "deepLink": "/chat?tab=requests",
                    },
                    separators=(",", ":"),
                ),
            )
        except Exception as exc:
            log_event(logger, "connect.sns.publish_failed", level=logging.ERROR, error=str(exc))

    return ChooseCandidateResponse(requestId=request_id, status="PENDING", toUserId=chosen, createdAt=item["createdAt"])


@app.get("/connect/requests", response_model=ListRequestsResponse)
async def list_requests(limit: int = Query(50, ge=1, le=200), current_user: dict = Depends(authenticate)):
    user_id = current_user["sub"]
    items = db.list_connect_requests(user_id, limit=limit)
    # Minimal shape for frontend; filter to relevant fields
    requests = []
    for it in items:
        requests.append(
            {
                "requestId": it.get("requestId"),
                "fromUserId": it.get("fromUserId"),
                "status": it.get("status"),
                "createdAt": it.get("createdAt"),
                "expiresAt": str(it.get("expiresAt")) if it.get("expiresAt") is not None else None,
            }
        )
    return ListRequestsResponse(requests=requests)  # type: ignore[arg-type]


@app.post("/connect/requests/{request_id}/accept", response_model=AcceptRequestResponse)
async def accept_request(request_id: str, current_user: dict = Depends(authenticate)):
    user_b = current_user["sub"]
    req = db.get_connect_request(user_b, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.get("status") != "PENDING":
        raise HTTPException(status_code=400, detail="Request is not pending")

    user_a = str(req.get("fromUserId"))
    dm_room_id = db.stable_dm_room_id(user_a, user_b)

    req["status"] = "ACCEPTED"
    req["dmRoomId"] = dm_room_id
    db.update_connect_request(user_b, req)

    return AcceptRequestResponse(
        requestId=request_id,
        status="ACCEPTED",
        dmRoomId=dm_room_id,
        prefill=str(req.get("suggestedFirstMessage") or ""),
    )


@app.post("/connect/requests/{request_id}/decline", response_model=DeclineRequestResponse)
async def decline_request(request_id: str, current_user: dict = Depends(authenticate)):
    user_b = current_user["sub"]
    req = db.get_connect_request(user_b, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.get("status") != "PENDING":
        raise HTTPException(status_code=400, detail="Request is not pending")

    req["status"] = "DECLINED"
    db.update_connect_request(user_b, req)
    return DeclineRequestResponse(requestId=request_id, status="DECLINED")


@app.post("/notifications/webpush/subscribe", response_model=WebPushSubscribeResponse)
async def webpush_subscribe(payload: WebPushSubscribePayload, current_user: dict = Depends(authenticate)):
    user_id = current_user["sub"]
    db.upsert_webpush_subscription(user_id, payload.subscription)
    return WebPushSubscribeResponse(status="subscribed", updatedAt=_now_iso())



