from __future__ import annotations
import json
import logging
import os, time, uuid
from typing import Any
import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.requests import Request
from .models import ConfirmEmailResponse, PasswordChangeRequest, SendTempPassword, SignupLocal, SignupGoogle, LoginLocal, TokenResponse, PublicUser
from .ssm import settings
from .security import generate_secure_password, hash_password, verify_local_jwt, verify_password, issue_local_jwt, validate_password_strength
from .cognito import exchange_auth_code_for_tokens, verify_cognito_jwt
from .attempts import record_attempt, failed_count_last_month
from .ses_email import send_email
from .tokens import TokenPurpose,decode_link_token, issue_link_token



CONFIRM_TTL = 60 * 60 * 24   # 24h
CHANGE_CHALLENGE_TTL = 60 * 10  # 10m

logger = logging.getLogger("auth")
if not logger.handlers:
  logger.setLevel(logging.INFO)
  _h = logging.StreamHandler()
  _h.setFormatter(logging.Formatter('%(message)s'))
  logger.addHandler(_h)


BLOCK_THRESHOLD = 3

app = FastAPI(title="Goals Guild Serverless Auth API", version="1.0.0")

# CORS (allow frontend origin or all in dev)
allowed_origins = [
    settings.app_base_url.rstrip("/") if settings.app_base_url else "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
ddb = boto3.resource("dynamodb")
users = ddb.Table(settings.ddb_users_table)
core = ddb.Table(settings.core_table_name)

@app.get("/health")
def healthz():
    return {"ok": True, "time": int(time.time())}

# --- SIGNUP (LOCAL) — send confirmation email ---
@app.post("/signup", response_model=None)
def signup(payload: dict, request: Request):
    provider = payload.get("provider")
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    ua = request.headers.get("user-agent", "")

    if provider == "local":
        try:
            body = SignupLocal(**payload)
            validate_password_strength(body.password)
        except ValidationError as ve:
            raise HTTPException(status_code=400, detail=ve.errors())
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

        email = body.email.lower()
        user_id = str(uuid.uuid4())
        password_hash = hash_password(body.password)
        ts = int(time.time())
        # Extended profile fields (optional)
        nickname = (payload.get("nickname") or "").strip()
        full_name = (payload.get("fullName") or payload.get("name") or "").strip()
        country = (payload.get("country") or "").strip().upper()
        birth_date = (payload.get("birthDate") or "").strip()
        language = payload.get("language") or "en"
        gender = payload.get("gender") or ""
        pronouns = payload.get("pronouns") or ""
        bio = payload.get("bio") or ""
        tags = payload.get("tags") or []
        status = payload.get("status") or "email confirmation pending"

        # Country allow-list
        if country:
            allowed_countries = {"US","CA","MX","BR","AR","CL","CO","PE","VE","UY","PY","BO","EC","GT","CR","PA","DO","CU","HN","NI","SV","JM","TT",
                "GB","IE","FR","DE","ES","PT","IT","NL","BE","LU","CH","AT","DK","SE","NO","FI","IS","PL","CZ","SK","HU","RO","BG","GR","HR","SI","RS","BA","MK","AL","ME","UA","BY","LT","LV","EE","MD","TR","CY","MT","RU",
                "CN","JP","KR","IN","PK","BD","LK","NP","BT","MV","TH","MY","SG","ID","PH","VN","KH","LA","MM","BN","TL",
                "AE","SA","QA","BH","KW","OM","YE","IR","IQ","JO","LB","SY","IL","PS","AF","KZ","KG","UZ","TM","TJ","MN",
                "AU","NZ","PG","FJ","SB","VU","WS","TO","TV","KI","FM","MH","NR","PW",
                "EG","MA","DZ","TN","LY","SD","SS","ET","ER","DJ","SO","KE","UG","TZ","RW","BI","CD","CG","GA","GQ","CM","NG","GH","CI","SN","ML","BF","NE","BJ","TG","GM","GN","GW","SL","LR","MR","EH","AO","ZM","ZW","MW","MZ","NA","BW","SZ","LS","MG","MU","SC","CV","ST","KM"}
            if country not in allowed_countries:
                raise HTTPException(status_code=400, detail="invalid country")
        # Birthdate must be <= today - 1 year
        if birth_date:
            try:
                y, m, d = map(int, birth_date.split("-"))
            except Exception:
                raise HTTPException(status_code=400, detail="invalid birthDate format, expected YYYY-MM-DD")
            if not (1 <= m <= 12 and 1 <= d <= 31 and y > 1900):
                raise HTTPException(status_code=400, detail="invalid birthDate")
            now_iso = time.strftime("%Y-%m-%d", time.gmtime())
            cy, cm, cd = map(int, now_iso.split("-"))
            cutoff_y = cy - 1
            if y > cutoff_y or (y == cutoff_y and (m > cm or (m == cm and d > cd))):
                raise HTTPException(status_code=400, detail="birthDate too recent")
        try:
            users.put_item(
                Item={
                    "pk": f"USER#{email}",
                    "sk": "PROFILE",
                    "user_id": user_id,
                    "email": email,
                    "name": body.name or "",
                    "provider": "local",
                    "password_hash": password_hash,
                    "created_at": ts,
                    "status": "ACTIVE",
                    "email_confirmed": False,
                },
                ConditionExpression="attribute_not_exists(pk)",
            )
        except ClientError as e:
            if e.response["Error"].get("Code") == "ConditionalCheckFailedException":
                raise HTTPException(status_code=409, detail="User already exists")
            raise

        # Mirror AppSync createUser write into gg_core (email lock + profile)
        try:
            core.put_item(
                Item={
                    "PK": f"EMAIL#{email}",
                    "SK": "UNIQUE#USER",
                    "type": "EmailUnique",
                    "email": email,
                    "userId": user_id,
                    "createdAt": ts,
                },
                ConditionExpression="attribute_not_exists(#pk)",
                ExpressionAttributeNames={"#pk": "PK"},
            )
        except ClientError as e:
            if e.response["Error"].get("Code") == "ConditionalCheckFailedException":
                raise HTTPException(status_code=409, detail="Email already in use")
            raise
        core.put_item(
            Item={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}",
                "type": "User",
                "id": user_id,
                "nickname": nickname,
                "email": email,
                "fullName": full_name,
                "birthDate": birth_date or None,
                "status": status,
                "country": country,
                "language": language,
                "gender": gender,
                "pronouns": pronouns,
                "bio": bio,
                "tags": tags if isinstance(tags, list) else [],
                "tier": "free",
                "GSI2PK": f"NICK#{nickname}",
                "GSI2SK": f"PROFILE#{user_id}",
                "GSI3PK": f"EMAIL#{email}",
                "GSI3SK": f"PROFILE#{user_id}",
                "createdAt": ts,
                "updatedAt": ts,
                "GSI1PK": f"USER#{user_id}",
                "GSI1SK": f"ENTITY#User#{ts}",
            }
        )

        # email confirmation token (subject carries email|user_id)
        tok = issue_link_token(f"{email}|{user_id}", TokenPurpose.EMAIL_CONFIRM, CONFIRM_TTL)
        users.update_item(
            Key={"pk": f"USER#{email}", "sk": "PROFILE"},
            UpdateExpression="SET email_confirm_jti=:j, email_confirm_expires_at=:e",
            ExpressionAttributeValues={":j": tok["jti"], ":e": tok["exp"]},
        )
        confirm_link = f"{settings.app_base_url}/confirm-email?token={tok['token']}"
        try:
            send_email(
                to=email,
                subject="Confirm your email",
                html=f"<p>Welcome!</p><p>Confirm your email by clicking <a href='{confirm_link}'>this link</a> (valid 24h).</p>",
                text=f"Confirm your email: {confirm_link}",
            )
            logger.info(json.dumps({"event":"email_confirmation_sent","email":email}))
        except Exception as e:
            logger.error(json.dumps({"event":"email_send_error","email":email,"error":str(e)}))
        return {"message": "Signup successful. Please confirm your email to log in."}

    elif provider == "google":
      try:
          body = SignupGoogle(**payload)
      except ValidationError as ve:
          raise HTTPException(status_code=400, detail=ve.errors())
      tokens = exchange_auth_code_for_tokens(body.authorization_code, body.redirect_uri)
      id_token = tokens.get("id_token")
      if not id_token:
          raise HTTPException(status_code=400, detail="Token exchange did not return id_token")
      claims = verify_cognito_jwt(id_token)
      email = (claims.get("email") or "").lower()
      sub = claims.get("sub")
      # Upsert shadow user
      users.update_item(
          Key={"pk": f"USER#{email or sub}", "sk": "PROFILE"},
          UpdateExpression="SET user_id=:u, email=:e, name=if_not_exists(name, :n), provider=:p, cognito_sub=:s, updated_at=:t, status=if_not_exists(status, :active)",
          ExpressionAttributeValues={
              ":u": sub,
              ":e": email or f"unknown+{sub}@example.com",
              ":n": claims.get("name", ""),
              ":p": "cognito-google",
              ":s": sub,
              ":t": int(time.time()),
              ":active": "ACTIVE",
          },
      )
      return {
          "user": PublicUser(user_id=sub, email=email or f"unknown+{sub}@example.com", name=claims.get("name"), provider="cognito-google").model_dump(),
          "tokens": {
              "token_type": "Bearer",
              "access_token": tokens.get("access_token"),
              "id_token": id_token,
              "refresh_token": tokens.get("refresh_token"),
              "expires_in": tokens.get("expires_in", 3600),
          },
      }
    else:
      raise HTTPException(status_code=400, detail="provider must be 'local' or 'google'")

# --- CONFIRM EMAIL ---
@app.get("/confirm-email", response_model=ConfirmEmailResponse)
def confirm_email(token: str = Query(..., min_length=20)):
    try:
        claims = decode_link_token(token, TokenPurpose.EMAIL_CONFIRM)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    try:
        subject = claims.get("sub", "")
        email, user_id = subject.split("|", 1)
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed token")

    resp = users.get_item(Key={"pk": f"USER#{email}", "sk": "PROFILE"})
    item = resp.get("Item")
    if not item or item.get("user_id") != user_id:
        raise HTTPException(status_code=400, detail="Invalid token subject")

    if item.get("email_confirmed", False):
        return {"message": "Email already confirmed."}

    if item.get("email_confirm_jti") != claims.get("jti"):
        raise HTTPException(status_code=400, detail="Token no longer valid")
    if int(time.time()) > int(item.get("email_confirm_expires_at", 0)):
        raise HTTPException(status_code=400, detail="Token expired")

    users.update_item(
        Key={"pk": f"USER#{email}", "sk": "PROFILE"},
        UpdateExpression="SET email_confirmed=:t REMOVE email_confirm_jti, email_confirm_expires_at",
        ExpressionAttributeValues={":t": True},
    )
    logger.info(json.dumps({"event":"email_confirmed","email":email}))
    return {"message": "Email confirmed. You may now log in."}

# --- LOGIN ENFORCEMENTS ---
@app.post("/login", response_model=None)
def login(body: LoginLocal, request: Request):
    email = body.email.lower()
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    ua = request.headers.get("user-agent", "")

    resp = users.get_item(Key={"pk": f"USER#{email}", "sk": "PROFILE"})
    item = resp.get("Item")
    if not item or item.get("provider") != "local":
        record_attempt(email, success=False, ip=client_ip, ua=ua, reason="NOT_FOUND_OR_NOT_LOCAL")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Restrict login to confirmed emails
    if not item.get("email_confirmed", False):
        record_attempt(email, success=False, ip=client_ip, ua=ua, reason="EMAIL_NOT_CONFIRMED")
        raise HTTPException(status_code=403, detail="Email not confirmed.")

    # Blocked window handled earlier; here show must-change enforcement before issuing tokens
    # ... existing failed_count_last_month checks and BLOCKED logic above this point ...

    
    if not verify_password(body.password, item.get("password_hash", "")):
      record_attempt(email, success=False, ip=client_ip, ua=ua, reason="BAD_PASSWORD")
      raise HTTPException(status_code=401, detail="Invalid credentials")

    # Must-change-password enforcement (no access token yet)
    if item.get("must_change_password", False):
        tok = issue_link_token(f"{email}|{item['user_id']}", TokenPurpose.CHANGE_PASSWORD, CHANGE_CHALLENGE_TTL)
        logger.info(json.dumps({"event":"password_change_required","email":email}))
        return JSONResponse(status_code=403, content={
            "detail": "Password change required.",
            "challenge_token": tok["token"],
            "expires_in": CHANGE_CHALLENGE_TTL,
        })

    # On success issue local JWT
    token = issue_local_jwt(item["user_id"], email)
    record_attempt(email, success=True, ip=client_ip, ua=ua, reason="OK")
    return TokenResponse(**token).model_dump()

# --- TEMP PASSWORD FOR BLOCKED USERS ---
@app.post("/password/temp", response_model=None)
def send_temp_password(body: SendTempPassword):
    email = body.email.lower()
    resp = users.get_item(Key={"pk": f"USER#{email}", "sk": "PROFILE"})
    item = resp.get("Item")
    # Do not reveal account existence or state
    if not item or item.get("provider") != "local":
        return {"message": "If the account exists, an email will be sent."}
    if item.get("status") != "BLOCKED":
        return {"message": "If the account is eligible, an email will be sent."}

    temp_pwd = generate_secure_password()
    pwd_hash = hash_password(temp_pwd)
    users.update_item(
        Key={"pk": f"USER#{email}", "sk": "PROFILE"},
        UpdateExpression="SET password_hash=:ph, must_change_password=:m, #s=:a, blocked_reason=:r",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":ph": pwd_hash, ":m": True, ":a": "ACTIVE", ":r": "RESET_TEMP_PASSWORD"},
    )

    html = f"""
        <p>We've set a temporary password for your account.</p>
        <p><strong>Temporary password:</strong> {temp_pwd}</p>
        <p>For your security, you must change it after signing in. Do not share this password.</p>
    """
    try:
        send_email(email, "Your temporary password", html, text=f"Temporary password: {temp_pwd}")
        logger.info(json.dumps({"event":"temp_password_sent","email":email}))
    except Exception as e:
        logger.error(json.dumps({"event":"email_send_error","email":email,"error":str(e)}))
        raise HTTPException(status_code=500, detail="Unable to send email at this time")

    return {"message": "If the account exists and is eligible, an email will be sent."}

# --- CHANGE PASSWORD (local users) ---
@app.post("/password/change", response_model=None)
def change_password(body: PasswordChangeRequest, request: Request, authorization: str | None = Header(default=None)):
    email = None
    item = None

    def _load_user_by_email(_email: str):
        r = users.get_item(Key={"pk": f"USER#{_email}", "sk": "PROFILE"})
        return r.get("Item")

    # Must-change flow via challenge token (no access token yet)
    if body.challenge_token:
        try:
            claims = decode_link_token(body.challenge_token, TokenPurpose.CHANGE_PASSWORD)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or expired challenge token")
        try:
            email_token, user_id = claims["sub"].split("|", 1)
        except Exception:
            raise HTTPException(status_code=400, detail="Malformed challenge token")
        email = email_token
        item = _load_user_by_email(email)
        if not item or item.get("user_id") != user_id:
            raise HTTPException(status_code=400, detail="Challenge token subject mismatch")
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password required")
        if not verify_password(body.current_password, item.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

    # Authenticated local user flow (Authorization: Bearer local JWT)
    elif authorization:
        token = authorization.split(" ")[-1]
        try:
            claims = verify_local_jwt(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        if claims.get("provider") != "local":
            raise HTTPException(status_code=400, detail="Password change only valid for local accounts")
        email = claims.get("email")
        item = _load_user_by_email(email)
        if not item:
            raise HTTPException(status_code=404, detail="User not found")
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password required")
        if not verify_password(body.current_password, item.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

    else:
        raise HTTPException(status_code=400, detail="Provide Authorization header or challenge_token")

    # Validate and rotate
    try:
        validate_password_strength(body.new_password)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    new_hash = hash_password(body.new_password)
    users.update_item(
        Key={"pk": f"USER#{email}", "sk": "PROFILE"},
        UpdateExpression="SET password_hash=:ph, must_change_password=:f, #s=:a REMOVE blocked_at, blocked_reason",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":ph": new_hash, ":f": False, ":a": "ACTIVE"},
    )
    logger.info(json.dumps({"event":"password_changed","email":email}))

    token = issue_local_jwt(item["user_id"], email)
    return TokenResponse(**token).model_dump()



# For local testing only (API Gateway should rely on Lambda Authorizer instead)

#@app.get("/me")
#def me(authorization: str | None = None):
#    if not authorization:
#        return JSONResponse(status_code=401, content={"detail": "Missing Authorization"})
#    token = authorization.split(" ")[-1]
#    try:
#        import jwt
#        from .security import verify_local_jwt
#        return {"claims": verify_local_jwt(token)}
#    except Exception:
#        from .cognito import verify_cognito_jwt
#        return {"claims": verify_cognito_jwt(token)}

#handler = Mangum(app)
