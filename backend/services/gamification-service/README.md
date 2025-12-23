# Gamification Service

Service for managing XP, levels, badges, challenges, and leaderboards.

## Features

- XP system with transaction history
- Level progression with exponential curve
- Badge system (coming soon)
- Challenge system (coming soon)
- Leaderboard system (coming soon)

## API Endpoints

### XP Endpoints
- `GET /xp/current` - Get current XP summary
- `GET /xp/history` - Get XP transaction history
- `POST /xp/award` - Award XP (internal use)

## Environment Variables

- `CORE_TABLE` - DynamoDB table name (default: gg_core)
- `JWT_SECRET` - JWT secret for token verification
- `JWT_AUDIENCE` - JWT audience
- `JWT_ISSUER` - JWT issuer
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_REGION` - AWS region for Cognito
- `BASE_XP_FOR_LEVEL` - Configurable XP progression base (default 100)
- `GAMIFICATION_INTERNAL_KEY` - Shared secret used for internal API Gateway calls

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload --port 8000
```

