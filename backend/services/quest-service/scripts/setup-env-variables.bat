@echo off
REM Quest Service Environment Variables Setup Script
REM This script sets up permanent environment variables for local development

echo 🚀 Setting up Quest Service Environment Variables...

REM Set permanent environment variables
REM AWS credentials should be set via AWS credentials file (~/.aws/credentials)
setx AWS_DEFAULT_REGION "us-east-2" /M
setx AWS_REGION "us-east-2" /M
setx CORE_TABLE "gg_core_test" /M
setx JWT_AUDIENCE "api://test" /M
setx JWT_ISSUER "https://auth.test" /M
setx COGNITO_REGION "us-east-2" /M
setx COGNITO_USER_POOL_ID "test-pool" /M
setx COGNITO_CLIENT_ID "test-client" /M
setx ALLOWED_ORIGINS "http://localhost:3000" /M
setx QUEST_SERVICE_JWT_SECRET "test-secret-key-for-development-only" /M
setx QUEST_SERVICE_ROOT_PATH "/DEV" /M
setx QUEST_LOG_ENABLED "true" /M
setx SETTINGS_SSM_PREFIX "/goalsguild/quest-service/" /M
setx AWS_ENDPOINT_URL "http://localhost:8000" /M

REM QUEST_SERVICE_ENV_VARS - Set manually in environment

REM Authentication configuration for tests (set manually in environment)
REM GOALSGUILD_USER - Test user email/username for login
REM GOALSGUILD_PASSWORD - Test user password for login
REM VITE_API_GATEWAY_URL - API Gateway URL for testing
REM VITE_API_GATEWAY_KEY - API Gateway key for testing

REM Set temporary variables for current session
REM AWS credentials should be set via AWS credentials file (~/.aws/credentials)
set AWS_DEFAULT_REGION=us-east-2
set AWS_REGION=us-east-2
set CORE_TABLE=gg_core_test
REM QUEST_SERVICE_ENV_VARS - Set manually in environment
REM Authentication variables are set manually in environment
REM GOALSGUILD_USER, GOALSGUILD_PASSWORD, VITE_API_GATEWAY_URL, VITE_API_GATEWAY_KEY

echo ✅ Environment variables set successfully!

echo.
echo 📝 Next steps:
echo 1. Restart your command prompt
echo 2. Run: cd backend/services/quest-service
echo 3. Run: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo 4. Test with: python tests/quest/run_tests.py

echo.
echo ⚠️  Important Notes:
echo - AWS credentials should be set via AWS credentials file (~/.aws/credentials)
echo - Use 'aws configure' to set up your AWS credentials
echo - For local testing, consider using DynamoDB Local

echo.
echo ✨ Setup complete! Happy coding! 🚀
pause
