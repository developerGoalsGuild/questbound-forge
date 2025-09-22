from typing import Dict, List, Optional

from fastapi import HTTPException
from .models import AnswerInput

def _digits_only(value: str) -> bool:
    return value.isdigit()

# ---------- Static configuration ----------
NLP_QUESTION_ORDER = [
    "positive",
    "specific",
    "evidence",
    "resources",
    "obstacles",
    "ecology",
    "timeline",
    "firstStep",
]
CANONICAL_MAP = {key.lower(): key for key in NLP_QUESTION_ORDER}


# ---------- Validation helpers ----------

def _normalize_date_only(value: Optional[str]) -> Optional[str]:
    if not value or not isinstance(value, str):
        return None
    trimmed = value.strip()
    if len(trimmed) != 10 or trimmed[4] != '-' or trimmed[7] != '-':
        return None
    y, m, d = trimmed[:4], trimmed[5:7], trimmed[8:10]
    if not (_digits_only(y) and _digits_only(m) and _digits_only(d)):
        return None
    if not ("01" <= m <= "12"):
        return None
    if not ("01" <= d <= "31"):
        return None
    return f"{y}-{m}-{d}"


def _sanitize_string(value: Optional[str]) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _validate_tags(raw_tags: List[str]) -> List[str]:
    tags: List[str] = []
    for idx, tag in enumerate(raw_tags):
        if not isinstance(tag, str):
            raise HTTPException(status_code=400, detail=f"Tag at index {idx} must be a string")
        trimmed = tag.strip()
        if trimmed:
            tags.append(trimmed)
    return tags


def _validate_answers(raw_answers: List[AnswerInput]) -> List[Dict[str, str]]:
    for index, entry in enumerate(raw_answers):
        if entry is None or not isinstance(entry.key, str) or not entry.key.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Answer at index {index} is missing a valid key",
            )
    filled = {key: "" for key in NLP_QUESTION_ORDER}
    for entry in raw_answers:
        canonical = CANONICAL_MAP.get(entry.key.strip().lower())
        if not canonical:
            continue
        filled[canonical] = _sanitize_string(entry.answer)
    return [{"key": key, "answer": filled[key]} for key in NLP_QUESTION_ORDER]


def _serialize_answers(raw_answers: List[Dict]) -> List[Dict[str, str]]:
    sanitized: List[Dict[str, str]] = []
    for entry in raw_answers or []:
        if not isinstance(entry, dict):
            continue
        key = _sanitize_string(entry.get("key"))
        if not key:
            continue
        sanitized.append({"key": key, "answer": _sanitize_string(entry.get("answer"))})
    return sanitized


def _normalize_deadline_output(value) -> Optional[str]:
    if isinstance(value, str) and len(value) == 10:
        return value
    if isinstance(value, (int, float)):
        try:
            from datetime import datetime

            return datetime.utcfromtimestamp(value / 1000).strftime("%Y-%m-%d")
        except Exception:  # pragma: no cover - defensive
            return None
    return None