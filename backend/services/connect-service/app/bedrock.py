from __future__ import annotations

import json
from typing import Any

import boto3

from .settings import get_settings

_settings = get_settings()
_bedrock = boto3.client("bedrock-runtime", region_name=_settings.aws_region)


def _extract_json(text: str) -> Any:
    """Best-effort JSON extraction (MVP)."""
    text = text.strip()
    # Allow model to wrap JSON in text; find first/last braces.
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])
    return json.loads(text)


def generate_followups(*, core_answers: dict[str, Any]) -> list[str]:
    prompt = {
        "task": "generate_followup_questions",
        "rules": [
            "Return JSON only.",
            "Return 1 to 3 short questions.",
            "Do not ask for email, phone, address, or other sensitive personal data.",
        ],
        "input": {"coreAnswers": core_answers},
        "output_schema": {"questions": ["string"]},
    }

    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 400,
            "temperature": 0.4,
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": json.dumps(prompt)}],
                }
            ],
        }
    )

    resp = _bedrock.invoke_model(modelId=_settings.bedrock_model_id, body=body)
    raw = resp["body"].read().decode("utf-8")
    payload = json.loads(raw)
    # Claude on Bedrock: content[0].text
    text = ((payload.get("content") or [{}])[0]).get("text") or ""
    data = _extract_json(text)
    questions = data.get("questions") or []
    return [str(q) for q in questions][:3]


def rank_candidates(*, user_a: dict[str, Any], candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return top 3 with score/reason/suggestedFirstMessage."""
    prompt = {
        "task": "rank_connection_candidates",
        "rules": [
            "Return JSON only.",
            "Choose exactly 3 candidates.",
            "Score between 0 and 1.",
            "Reasons must be 1-2 sentences.",
            "Suggested message must be short and friendly.",
            "Do not include sensitive information.",
        ],
        "input": {"userA": user_a, "candidates": candidates},
        "output_schema": {
            "top": [
                {
                    "userId": "string",
                    "score": 0.0,
                    "reason": "string",
                    "suggestedFirstMessage": "string",
                }
            ]
        },
    }

    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 800,
            "temperature": 0.3,
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": json.dumps(prompt)}],
                }
            ],
        }
    )

    resp = _bedrock.invoke_model(modelId=_settings.bedrock_model_id, body=body)
    raw = resp["body"].read().decode("utf-8")
    payload = json.loads(raw)
    text = ((payload.get("content") or [{}])[0]).get("text") or ""
    data = _extract_json(text)
    top = data.get("top") or []
    # Normalize and clamp
    normalized: list[dict[str, Any]] = []
    for item in top:
        try:
            uid = str(item.get("userId"))
            score = float(item.get("score"))
            score = max(0.0, min(1.0, score))
            normalized.append(
                {
                    "userId": uid,
                    "score": score,
                    "reason": str(item.get("reason") or ""),
                    "suggestedFirstMessage": str(item.get("suggestedFirstMessage") or ""),
                }
            )
        except Exception:
            continue
    return normalized[:3]



