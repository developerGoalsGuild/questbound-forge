# DynamoDB Subscription Schema

This document describes the DynamoDB schema extensions for subscription management in the `gg_core` table.

## Table Structure

**Table Name**: `gg_core`  
**Primary Key**: `PK` (Partition Key), `SK` (Sort Key)  
**Design**: Single-table design following existing patterns

## Entity Patterns

### 1. Subscription Record

**Purpose**: Stores active subscription information for users.

**Key Pattern**:
```
PK: USER#<userId>
SK: SUBSCRIPTION#<subscriptionId>
```

**Attributes**:
- `subscriptionId` (String, required): Stripe subscription ID (e.g., "sub_1ABC...")
- `planTier` (String, required): Subscription tier - one of: `INITIATE`, `JOURNEYMAN`, `SAGE`, `GUILDMASTER`
- `status` (String, required): Subscription status - one of: `active`, `canceled`, `past_due`, `trialing`, `incomplete`, `incomplete_expired`
- `stripeCustomerId` (String, required): Stripe customer ID (e.g., "cus_1ABC...")
- `currentPeriodStart` (String, ISO 8601 timestamp): Start of current billing period
- `currentPeriodEnd` (String, ISO 8601 timestamp): End of current billing period (used for grace period)
- `cancelAtPeriodEnd` (Boolean): Whether subscription will cancel at period end
- `provider` (String): User authentication provider - `local` or `cognito`
- `type` (String): Entity type identifier - `Subscription`
- `createdAt` (String, ISO 8601 timestamp): When subscription was created
- `updatedAt` (String, ISO 8601 timestamp): Last update timestamp

**Example Item**:
```json
{
  "PK": "USER#abc123",
  "SK": "SUBSCRIPTION#sub_1ABCxyz",
  "type": "Subscription",
  "subscriptionId": "sub_1ABCxyz",
  "planTier": "JOURNEYMAN",
  "status": "active",
  "stripeCustomerId": "cus_1ABCxyz",
  "currentPeriodStart": "2025-01-01T00:00:00Z",
  "currentPeriodEnd": "2025-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "provider": "cognito",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Access Patterns**:
- Get active subscription: Query `PK=USER#<userId>`, Filter `SK begins_with "SUBSCRIPTION#"` and `status=active`
- Get subscription by ID: GetItem `PK=USER#<userId>`, `SK=SUBSCRIPTION#<subscriptionId>`

### 2. Credits Balance Record

**Purpose**: Tracks user credit balance for premium features (Veo-3 video, AI feedback, etc.).

**Key Pattern**:
```
PK: USER#<userId>
SK: CREDITS#BALANCE
```

**Attributes**:
- `balance` (Number, required): Current credit balance (integer, default 0)
- `lastTopUp` (String, ISO 8601 timestamp): When credits were last topped up
- `lastReset` (String, ISO 8601 timestamp): When monthly credits were last granted/reset
- `expiresAt` (Number, Unix timestamp): TTL for credit expiration (optional, for monthly reset)
- `type` (String): Entity type identifier - `Credits`
- `createdAt` (String, ISO 8601 timestamp): When credits record was created
- `updatedAt` (String, ISO 8601 timestamp): Last update timestamp

**Example Item**:
```json
{
  "PK": "USER#abc123",
  "SK": "CREDITS#BALANCE",
  "type": "Credits",
  "balance": 12,
  "lastTopUp": "2025-01-15T10:00:00Z",
  "lastReset": "2025-01-01T00:00:00Z",
  "expiresAt": 1735689600,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Access Patterns**:
- Get credit balance: GetItem `PK=USER#<userId>`, `SK=CREDITS#BALANCE`
- Update credits atomically: UpdateItem with conditional expressions

**Credit Operations**:
- **Grant credits**: Atomic increment of `balance`
- **Consume credits**: Atomic decrement with `balance >= amount` condition
- **Top-up**: Atomic increment from purchase
- **Monthly grant**: Increment based on tier quota on `invoice.payment_succeeded`

### 3. Founder Pass Record

**Purpose**: Stores lifetime access passes (Founding Member, Guild Builder).

**Key Pattern**:
```
PK: USER#<userId>
SK: FOUNDER#<passType>
```

**Attributes**:
- `passType` (String, required): Type of founder pass - `FOUNDING_MEMBER` or `GUILD_BUILDER`
- `stripePaymentIntentId` (String, required): Stripe Payment Intent ID for the purchase
- `purchasedAt` (String, ISO 8601 timestamp): When founder pass was purchased
- `lifetimeAccess` (Boolean, required): Always `true` for founder passes
- `grantedTier` (String, required): Tier granted by pass - `SAGE` for FOUNDING_MEMBER, `GUILDMASTER` for GUILD_BUILDER
- `type` (String): Entity type identifier - `FounderPass`
- `createdAt` (String, ISO 8601 timestamp): When record was created
- `updatedAt` (String, ISO 8601 timestamp): Last update timestamp

**Example Items**:

**Founding Member**:
```json
{
  "PK": "USER#abc123",
  "SK": "FOUNDER#FOUNDING_MEMBER",
  "type": "FounderPass",
  "passType": "FOUNDING_MEMBER",
  "stripePaymentIntentId": "pi_1ABCxyz",
  "purchasedAt": "2025-01-01T00:00:00Z",
  "lifetimeAccess": true,
  "grantedTier": "SAGE",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Guild Builder**:
```json
{
  "PK": "USER#abc123",
  "SK": "FOUNDER#GUILD_BUILDER",
  "type": "FounderPass",
  "passType": "GUILD_BUILDER",
  "stripePaymentIntentId": "pi_1DEFxyz",
  "purchasedAt": "2025-01-01T00:00:00Z",
  "lifetimeAccess": true,
  "grantedTier": "GUILDMASTER",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Access Patterns**:
- Check for founder pass: GetItem `PK=USER#<userId>`, `SK=FOUNDER#FOUNDING_MEMBER` or `FOUNDER#GUILD_BUILDER`
- List all founder passes for user: Query `PK=USER#<userId>`, Filter `SK begins_with "FOUNDER#"`

### 4. User Profile Tier Update

**Note**: The user profile record (`USER#<userId>`, `SK=PROFILE#<userId>`) should be updated with the `tier` field to reflect the current subscription tier.

**Tier Values**:
- `free`: Default tier, limited read-only access
- `INITIATE`: $1/month tier
- `JOURNEYMAN`: $15/month tier
- `SAGE`: $49/month tier (also granted by FOUNDING_MEMBER founder pass)
- `GUILDMASTER`: Enterprise tier (also granted by GUILD_BUILDER founder pass)

**Access Control Priority**:
1. Check for founder pass (highest priority - lifetime access)
2. Check active subscription (`status=active` and `currentPeriodEnd > now`)
3. Fallback to profile `tier` field
4. Default to `free`

## Credit Quotas by Tier

Monthly credit grants on successful payment:

- **FREE**: 0 credits/month
- **INITIATE**: 2 Veo-3 credits/month
- **JOURNEYMAN**: 5 Veo-3 credits/month
- **SAGE**: 15 Veo-3 credits/month (also for FOUNDING_MEMBER founder pass)
- **GUILDMASTER**: 15 Veo-3 credits/month (also for GUILD_BUILDER founder pass)

**Credit Usage**:
- Veo-3 Video Generation: 3 credits per render
- AI Mentor Feedback: 1 credit per reflection
- Guild Mirror Report: 5 credits per month

**Credit Top-Up**:
- $5 = 10 credits
- Credits roll over monthly
- Credits expire based on TTL if not consumed

## Data Consistency

### Subscription Updates
When subscription events occur:
1. Update subscription record in DynamoDB
2. Update user profile `tier` field
3. For Cognito users: Update Cognito group membership
4. For local users: Skip Cognito group update

### Grace Period
After subscription cancellation:
- User retains access until `currentPeriodEnd` timestamp
- Access control checks: `status=active OR (status=canceled AND currentPeriodEnd > now)`

### Founder Pass Override
If user has founder pass:
- Override subscription tier checks
- Founder pass tier takes precedence
- Active subscription can coexist but doesn't affect access (founder pass wins)

## Migration Notes

For existing users:
- Default `tier: "free"` in profile (already set)
- No subscription record = free tier
- No credits record = 0 balance (create on first access)

