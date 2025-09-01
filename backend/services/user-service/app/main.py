from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from .models import SignUpRequest, EmailVerificationRequest, LoginResponse
from .repository import UserRepository
from .service import UserService
from botocore.exceptions import ClientError

app = FastAPI(title="User Service with Repository and Service Pattern")

user_repository = UserRepository()
user_service = UserService(user_repository)

@app.post("/signup", status_code=status.HTTP_201_CREATED, summary="User Sign-Up (Native)")
async def signup(data: SignUpRequest):
  """
  Endpoint for native user sign-up.
  """
  try:
    user_service.signup_native(data)
    return {"message": "User registered successfully. Please check your email to verify your account."}
  except ValueError as ve:
    raise HTTPException(status_code=400, detail=str(ve))
  except RuntimeError as re:
    raise HTTPException(status_code=500, detail=str(re))

@app.post("/confirm-email", summary="Confirm Email Verification")
async def confirm_email(data: EmailVerificationRequest):
  """
  Endpoint to confirm email verification.
  """
  try:
    user_service.confirm_email(data.token)
    return {"message": "Email verified successfully."}
  except ValueError as ve:
    raise HTTPException(status_code=400, detail=str(ve))
  except RuntimeError as re:
    raise HTTPException(status_code=500, detail=str(re))

@app.post("/login", response_model=LoginResponse, summary="User Login (Cognito)")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
  """
  Authenticate user with email and password via Cognito, return tokens.
  """
  try:
    secret_hash = user_service.get_secret_hash(form_data.username)
    auth_params = {
      "USERNAME": form_data.username,
      "PASSWORD": form_data.password,
    }
    if secret_hash:
      auth_params["SECRET_HASH"] = secret_hash

    response = user_service.cognito_client.initiate_auth(
      ClientId=user_service.config_cache["COGNITO_CLIENT_ID"],
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
