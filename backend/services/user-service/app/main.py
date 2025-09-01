from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import boto3
from botocore.exceptions import ClientError
from typing import Optional
import os

app = FastAPI(title="User Service with AWS Cognito Authentication")

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Initialize boto3 clients
ssm_client = boto3.client("ssm", region_name=AWS_REGION)
cognito_client = boto3.client("cognito-idp", region_name=AWS_REGION)

# Parameter Store keys for Cognito config
PARAM_COGNITO_USER_POOL_ID = "/goalsguild/dev/cognito/user_pool_id"
PARAM_COGNITO_CLIENT_ID = "/goalsguild/dev/cognito/client_id"
PARAM_COGNITO_CLIENT_SECRET = "/goalsguild/dev/cognito/client_secret"  # Optional



# Cache for parameters
config_cache = {}

def get_parameter(name: str, with_decryption: bool = False) -> Optional[str]:
  """
  Retrieve a parameter value from AWS Parameter Store.
  """
  try:
    print(f'Getting cognito parameter:{name}')
    response = ssm_client.get_parameter(Name=name, WithDecryption=with_decryption)
    print(f'Getting cognito response:{response["Parameter"]["Value"]}')
    
    return response["Parameter"]["Value"]
  except ClientError as e:
    # Log or handle error as needed
    print(f'erro ao obter dados do cognito{e}')
    return None

def load_cognito_config():
  """
  Load Cognito configuration parameters from Parameter Store into cache.
  Raises RuntimeError if required parameters are missing.
  """
  user_pool_id = get_parameter(PARAM_COGNITO_USER_POOL_ID)
  client_id = get_parameter(PARAM_COGNITO_CLIENT_ID)
  client_secret = get_parameter(PARAM_COGNITO_CLIENT_SECRET, with_decryption=True)

  if not user_pool_id or not client_id:
    raise RuntimeError("Missing required Cognito parameters in Parameter Store.")

  config_cache["COGNITO_USER_POOL_ID"] = user_pool_id
  config_cache["COGNITO_CLIENT_ID"] = client_id
  config_cache["COGNITO_CLIENT_SECRET"] = client_secret

load_cognito_config()

def get_secret_hash(username: str) -> Optional[str]:
  """
  Calculate secret hash for Cognito client secret if configured.
  """

  client_secret = config_cache.get("COGNITO_CLIENT_SECRET")
  client_id = config_cache.get("COGNITO_CLIENT_ID")
  if not client_secret or not client_id:
    return None
  import hmac
  import hashlib
  import base64
  message = username + client_id
  dig = hmac.new(str(client_secret).encode('utf-8'), msg=message.encode('utf-8'), digestmod=hashlib.sha256).digest()
  return base64.b64encode(dig).decode()

class SignUpRequest(BaseModel):
  email: EmailStr
  password: str

class LoginResponse(BaseModel):
  access_token: str
  id_token: str
  refresh_token: str
  token_type: str
  expires_in: int

class GoogleLoginRequest(BaseModel):
  id_token: str  # Google ID token from client

@app.post("/signup", status_code=status.HTTP_201_CREATED, summary="User Sign-Up")
async def signup(data: SignUpRequest):
  """
  Register a new user with email and password.
  """
  try:
    params = {
      "ClientId": config_cache["COGNITO_CLIENT_ID"],
      "Username": data.email,
      "Password": data.password,
      "UserAttributes": [
        {"Name": "email", "Value": data.email}
      ],
      "ValidationData": []
    }
    secret_hash = get_secret_hash(data.email)
    if secret_hash:
      params["SecretHash"] = secret_hash

    response = cognito_client.sign_up(**params)
    # Auto-confirm user (disable email confirmation)
    cognito_client.admin_confirm_sign_up(
      UserPoolId=config_cache["COGNITO_USER_POOL_ID"],
      Username=data.email
    )
    return {"message": "User signed up successfully."}
  except ClientError as e:
    error_code = e.response["Error"]["Code"]
    if error_code == "UsernameExistsException":
      raise HTTPException(status_code=400, detail="User already exists.")
    elif error_code == "InvalidPasswordException":
      raise HTTPException(status_code=400, detail="Password does not meet complexity requirements.")
    else:
      raise HTTPException(status_code=500, detail=f"Sign-up failed: {e.response['Error']['Message']}")

@app.post("/login", response_model=LoginResponse, summary="User Login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
  """
  Authenticate user with email and password, return tokens.
  """
  try:
    secret_hash = get_secret_hash(form_data.username)
    auth_params = {
      "USERNAME": form_data.username,
      "PASSWORD": form_data.password,
    }
    if secret_hash:
      auth_params["SECRET_HASH"] = secret_hash

    response = cognito_client.initiate_auth(
      ClientId=config_cache["COGNITO_CLIENT_ID"],
      AuthFlow="USER_PASSWORD_AUTH",
      AuthParameters=auth_params
    )
    auth_result = response["AuthenticationResult"]
    return LoginResponse(
      access_token=auth_result["AccessToken"],
      id_token=auth_result["IdToken"],
      refresh_token=auth_result.get("RefreshToken", ""),
      token_type=auth_result["TokenType"],
      expires_in=auth_result["ExpiresIn"]
    )
  except ClientError as e:
    error_code = e.response["Error"]["Code"]
    if error_code in ["NotAuthorizedException", "UserNotFoundException"]:
      raise HTTPException(status_code=401, detail="Invalid username or password.")
    elif error_code == "UserNotConfirmedException":
      raise HTTPException(status_code=403, detail="User is not confirmed.")
    else:
      raise HTTPException(status_code=500, detail=f"Login failed: {e.response['Error']['Message']}")

@app.post("/logout", summary="User Logout")
async def logout(request: Request):
  """
  Logout user by revoking tokens.
  Requires Authorization header with Bearer access token.
  """
  auth_header = request.headers.get("Authorization")
  if not auth_header or not auth_header.startswith("Bearer "):
    raise HTTPException(status_code=401, detail="Authorization header missing or invalid.")

  access_token = auth_header.split(" ")[1]
  try:
    cognito_client.global_sign_out(
      AccessToken=access_token
    )
    return {"message": "User logged out successfully."}
  except ClientError as e:
    error_code = e.response["Error"]["Code"]
    if error_code == "NotAuthorizedException":
      raise HTTPException(status_code=401, detail="Invalid or expired token.")
    else:
      raise HTTPException(status_code=500, detail=f"Logout failed: {e.response['Error']['Message']}")

@app.post("/login/google", response_model=LoginResponse, summary="Google Login Integration")
async def google_login(data: GoogleLoginRequest):
  """
  Authenticate user using Google ID token via AWS Cognito.
  This requires Cognito User Pool to be configured with Google as an identity provider.
  The client sends Google ID token, which is exchanged for Cognito tokens.
  """
  try:
    response = cognito_client.admin_initiate_auth(
      UserPoolId=config_cache["COGNITO_USER_POOL_ID"],
      ClientId=config_cache["COGNITO_CLIENT_ID"],
      AuthFlow="ADMIN_NO_SRP_AUTH",
      AuthParameters={
        "USERNAME": "google_" + data.id_token[:10],  # Dummy username based on token snippet
        "PASSWORD": data.id_token
      }
    )
    auth_result = response["AuthenticationResult"]
    return LoginResponse(
      access_token=auth_result["AccessToken"],
      id_token=auth_result["IdToken"],
      refresh_token=auth_result.get("RefreshToken", ""),
      token_type=auth_result["TokenType"],
      expires_in=auth_result["ExpiresIn"]
    )
  except ClientError as e:
    error_code = e.response["Error"]["Code"]
    if error_code == "NotAuthorizedException":
      raise HTTPException(status_code=401, detail="Invalid Google token or user not registered.")
    else:
      raise HTTPException(status_code=500, detail=f"Google login failed: {e.response['Error']['Message']}")

@app.get("/health", summary="Health Check")
async def health_check():
  return {"status": "ok"}
