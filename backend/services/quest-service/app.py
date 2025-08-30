import os
import logging
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import boto3
from boto3.dynamodb.conditions import Key
import jwt
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import uuid4

# In Lambda on AWS, these env vars are already set — no need to override.
def aws_region() -> str | None:
    # Prefer AWS_REGION, then AWS_DEFAULT_REGION; return None to let boto3 decide.
    return os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")


# Configure logging
logging.basicConfig(level=logging.INFO)    
logger = logging.getLogger("quest-service")
# Environment variables
QUESTS_TABLE = os.getenv("QUESTS_TABLE", "goalsguild_quests")

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb",aws_region())
quests_table = dynamodb.Table(QUESTS_TABLE)


ROOT_PATH =f"/DEV"
print(f'ROOTPATH: {ROOT_PATH}')
app = FastAPI(root_path=ROOT_PATH,title="Sign Service", version="1.0.0")


# CORS middleware (adjust origins as needed)
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Pydantic models
class QuestCreate(BaseModel):
  title: str
  description: Optional[str] = ""

class QuestResponse(BaseModel):
  quest_id: str
  title: str
  description: Optional[str] = ""
  created_at: Optional[str] = None

# JWT token verification dependency
def verify_token(request: Request):
  auth_header = request.headers.get("authorization")
  if not auth_header:
    logger.warning("Missing Authorization header")
    raise HTTPException(status_code=401, detail="Missing Authorization header")
  parts = auth_header.split(" ")
  if len(parts) != 2 or parts[0].lower() != "bearer":
    logger.warning("Invalid Authorization header format")
    raise HTTPException(status_code=401, detail="Invalid Authorization header format")
  token = parts[1]
  try:
    # Decode without verification (as per original)
    decoded = jwt.decode(token, options={"verify_signature": False})
    user_id = decoded.get("sub")
    if not user_id:
      logger.warning("Token missing sub claim")
      raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id
  except Exception as e:
    logger.error(f"Token verification failed: {e}")
    raise HTTPException(status_code=401, detail="Token verification failed")

@app.get("/quests", response_model=List[QuestResponse])
async def list_quests(user_id: str = Depends(verify_token)):
  try:
    response = quests_table.scan()
    items = response.get("Items", [])
    return [QuestResponse(**item) for item in items]
  except Exception as e:
    logger.error(f"Error retrieving quests: {e}")
    raise HTTPException(status_code=500, detail="Could not retrieve quests")

@app.post("/quests", response_model=QuestResponse, status_code=201)
async def create_quest(quest: QuestCreate, user_id: str = Depends(verify_token)):
  quest_id = str(uuid4())
  new_quest = {
    "quest_id": quest_id,
    "title": quest.title,
    "description": quest.description or "",
    "created_at":  None,
  }
  from datetime import datetime
  new_quest["created_at"] = datetime.utcnow().isoformat() + "Z"

  try:
    quests_table.put_item(Item=new_quest)
    return QuestResponse(**new_quest)
  except Exception as e:
    logger.error(f"Error creating quest: {e}")
    raise HTTPException(status_code=500, detail="Could not create quest")
