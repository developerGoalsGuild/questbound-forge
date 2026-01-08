# Cloud‑Agnostic, Serverless, and Cost‑Efficient Architecture (AWS‑first)

**Target:** up to **1,000,000 users** in Year 1; **5% concurrency ≈ 50,000 active users** at peaks. Each user ≤ **5 goals × ~10 tasks** (≈ **50M tasks worst‑case**). Features: user matchmaking by goals, user‑to‑user assistance, AI/user goal tracking, **real‑time chat**, company offers, **gamification**, **paid subscriptions**, due‑date notifications, motivational messaging. Design must be **portable to other clouds** with minimal re‑work.

---

## 1) High‑Level Architecture

**Client:** Web (React) / Mobile → **GraphQL** (+ a small set of REST webhooks)

**Identity:** Cognito (OIDC/JWT) with social SSO. Custom **Lambda Authorizer** for API Gateway and AppSync Lambda auth for portability of validation logic.

**API Layer (Primary):** **AWS AppSync (GraphQL)** for core domain (Users, Goals, Tasks, Assistance, Chat, Gamification, Offers). **Subscriptions** for real‑time chat/updates.

**API Layer (Aux):** **API Gateway HTTP API** for REST endpoints (payments webhooks, presigned uploads, admin jobs) with the same Lambda authorizer.

**Compute:** AWS Lambda (Python/Node) with cold‑start‑friendly packaging (arm64, small deps). Step Functions for longer orchestrations.

**Primary DB (OLTP):** **DynamoDB single‑table** (pay‑per‑request initially; later switch to provisioned with autoscaling/RCU/WCU if predictable). DynamoDB Streams for CDC.

**Search & Discovery:** **OpenSearch Serverless** (optional, turn on when needed). Indexed from DynamoDB Streams via Lambda.

**Async/Event Bus:** **EventBridge** (domain events), **SQS** (work queues, retries, buffering), **SNS** (fan‑out notifications).

**Notifications:** **SES** (email), **SNS Mobile Push** (APNS/FCM), **SMS (SNS)** (optional). Motivational content via an AI microservice.

**Real‑time Chat:** AppSync GraphQL subscriptions + DynamoDB (Messages). Optionally API Gateway WebSocket if you prefer pure WebSocket control.

**Payments:** **Stripe** (subscriptions & webhooks) → API Gateway → Lambda → DynamoDB (Subscription state).

**Data Lake & Analytics:** **S3** (raw events via Firehose), **Athena** or **Glue/Athena** for BI. Optional feature store for AI.

**Cache/Leaderboards (Optional):** **ElastiCache Serverless (Redis)** for hot leaderboards; otherwise **DynamoDB atomic counters** + Streams to precompute aggregates.

**Observability:** CloudWatch Logs/metrics/alarms + X‑Ray traces; structured JSON logs; Synthetics for key flows.

**IaC:** Terraform modules; per‑env stacks; least‑privilege IAM; parameterization via SSM/Secrets Manager.

---

## 2) Cloud‑Agnostic Mapping (minimize re‑work)

| Concern | AWS (this build) | GCP equivalent | Azure equivalent | Portability Tactic |
|---|---|---|---|---|
| Identity & JWT | Cognito | Firebase Auth / Cloud Identity | Entra ID B2C | Keep **OIDC/JWT**; authorizer code portable; abstract user claims mapping. |
| GraphQL | **AppSync** | GraphQL on Cloud Run/Functions + Pub/Sub | GraphQL on Functions/AKS + Event Grid | Keep **GraphQL schema/resolvers** in code; swap hosting layer. |
| Realtime | AppSync subscriptions / API GW WS | Pub/Sub + WebSockets (Cloud Run) | Web PubSub / SignalR | Use Apollo protocol; event topics named consistently. |
| OLTP DB | **DynamoDB** | Firestore (Native) / Cloud Bigtable | Cosmos DB (Core/Cassandra) | Single‑table, key/value + JSON; repo pattern; avoid DynamoDB‑only operators. |
| Search | OpenSearch Serverless | Elastic Cloud / OpenSearch on GKE | Elastic Cloud / Azure Cognitive Search | CDC into search is the same (streams→indexer). |
| Events | EventBridge | Pub/Sub | Event Grid/Service Bus | Cloud‑neutral **event types** and payload contracts. |
| Queues | SQS | Pub/Sub (pull) | Service Bus | Use a thin queue adapter. |
| Email | SES | SendGrid/Mailjet | SendGrid | Notify adapter with multiple providers. |
| Payments | Stripe | Stripe | Stripe | Same webhook shapes across clouds. |
| Cache | ElastiCache (Redis) | Memorystore (Redis) | Azure Cache for Redis | Use Redis‑protocol patterns only. |

**Key abstraction:** Hexagonal/Ports‑and‑Adapters. Repositories hide the DB, a `Notifier` hides SES/SNS, an `EventBus` hides EventBridge, a `SearchIndex` hides OpenSearch.

---

## 3) Data Model — Single‑Table (DynamoDB)

**Table name:** `gg_core`

**Primary Key:** `PK` (partition), `SK` (sort)

**Entity Types & Keys (examples)**

- **User**: `PK=USER#<userId>`, `SK=PROFILE#<userId>`
- **Goal**: `PK=USER#<userId>`, `SK=GOAL#<goalId>`
- **Task**: `PK=GOAL#<goalId>`, `SK=TASK#<taskId>`
- **Task by owner** (dup index item): `PK=USER#<userId>`, `SK=TASK#<dueAt>#<taskId>` (for quick due lists)
- **Connection** (friend/help): `PK=USER#<userId>`, `SK=CONN#<otherUserId>`
- **Assistance Thread**: `PK=ASSIST#<threadId>`, `SK=MSG#<timestamp>`
- **Chat Room**: `PK=ROOM#<roomId>`, `SK=MSG#<timestamp>#<messageId>`
- **Offer** (company product): `PK=OFFER#<offerId>`, `SK=OFFER#<offerId>`;
  - **Targeting edge:** `PK=TAG#<tag>`, `SK=OFFER#<offerId>`
- **Gamification Event**: `PK=USER#<userId>`, `SK=GAME#EVT#<ts>#<eventId>`
- **Gamification Aggregate**: `PK=USER#<userId>`, `SK=GAME#AGG#<season>` (score, streaks)
- **Subscription**: `PK=USER#<userId>`, `SK=SUB#<planId>` (state, renewAt)
- **Due Wheel** (scheduler buckets): `PK=DUE#YYYYMMDDHHmm`, `SK=TASK#<taskId>`

**Common Attributes**
- `type` (entity type), `createdAt`, `updatedAt`, `ownerId`, JSON payloads (`profile`, `nlpPlan`, `status`, `visibility`, `tags`, etc.)

**Global Secondary Indexes (minimum set)**
- **GSI1 (user‑owned list):** `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#<type>#<createdAt>` → list user’s goals, tasks, connections, events.
- **GSI2 (due tasks):** `GSI2PK=DUE#YYYYMMDD`, `GSI2SK=<dueAt>#TASK#<taskId>` → sweep daily; or minute buckets for precise notifications.
- **GSI3 (search tags):** `GSI3PK=TAG#<tag>`, `GSI3SK=<entity>#<id>` → discover goals/offers by tag.
- **GSI4 (rooms):** `GSI4PK=ROOM#<roomId>`, `GSI4SK=MSG#<timestamp>#<id>` → fetch chat history/pagination.
- **GSI5 (offers by company):** `GSI5PK=COMPANY#<companyId>`, `GSI5SK=OFFER#<offerId>`
- **GSI6 (subscriptions expiring):** `GSI6PK=SUB#RENEW#YYYYMMDD`, `GSI6SK=<userId>#<planId>`

**TTL:**
- Messages (older than N days), ephemeral events, expired offers, temporary assistance drafts → `ttl` attribute for auto‑cleanup.

**Access Patterns (examples)**
- Get user profile, update profile, list my goals, tasks by goal, tasks due today, find users with tag “marathon”, chat room scroll, offers for my tags, my subscription state, my gamification stats.

**Why single‑table?**
- Fewer round trips, predictable hot‑key avoidance, flexible GSIs, and easy CDC to search/analytics.

---

## 4) Sizing & Cost Levers

- Start with **On‑Demand** (PAYG) to absorb launch variability; switch to **provisioned + autoscaling** once usage stabilizes.
- Design **hot‑key resistant** partitions: avoid `PK=USER#popularUser` for chat rooms; use `ROOM#<roomId>` with time‑sliced SK.
- Keep items ≤ **8KB** where possible (store large blobs in **S3**, referenced by URL).
- Use **conditional writes** (optimistic concurrency) and **atomic counters** for gamification.
- Enable **DAX** or **edge caching** (AppSync + CloudFront) only if p99 shows read pressure on repeated queries.

---

## 5) Eventing, Notifications & Motivational Messaging

1. **Due‑date scheduling:** When a task is created/updated, also **upsert a shadow item** into `PK=DUE#YYYYMMDDHHmm` with the earliest notify minute (user timezone aware).
2. A **minute cron** (EventBridge rule every minute) **queries one bucket** (`DUE#now`) via a `Query` on GSI2 or base PK and sends enriched reminders through the **Notifier** (SES/SNS/Push/Email). Mark delivered or reschedule.
3. **Motivational nudges:** An **AI microservice** consumes **user activity events** (EventBridge → Lambda → Notifier) to send context‑aware messages, respecting quiet hours and user prefs.

---

## 6) Real‑time Chat

- **AppSync Subscriptions** on `Message { roomId, text, senderId, ts }`.
- **Write path:** Mutation → Lambda → write to `PK=ROOM#...` + **publish** subscription → client receives instantly.
- **History:** Query GSI4 with pagination `SK` < cursor.
- **Moderation:** Async AI moderation Lambda via EventBridge; redact or flag.
- **TTL:** auto delete after N days to control cost.

---

## 7) Gamification Layer

- **Event stream:** Every relevant action emits `GameEvent { userId, kind, points, ts }` to EventBridge.
- **Aggregation:** Stream processor updates `GAME#AGG` records (per season) using **atomic counters**. Optional Redis sorted set for public leaderboards.
- **Streaks:** Store last day stamp; increment/reset streak atomically.

---

## 8) Offers / Company Products

- Offer items with targeting `tags[]`, `goalKinds[]`, `audienceTier` (free/premium), `validFrom/To`.
- Ingestion to **search index** with analyzers on title/keywords.
- Client query: user context (tags/goals) → search service → sorted by relevance.

---

## 9) Subscriptions & Billing

- Stripe checkout session creates/updates a `SUB#<planId>` row with `state=active`, `renewAt`, `entitlements`.
- Webhooks (via API Gateway + Lambda) **verify signature**, update DB, emit `SubscriptionChanged` event.
- Authorizer injects `tier`/`entitlements` into request context for resolvers.

---

## 10) Security & Compliance

- **Auth:** OIDC/JWT; custom Lambda authorizer validates `iss/aud/exp`, rotates JWKS with caching.
- **Row‑level security:** Resolvers filter by `ownerId` or membership; never trust client‑sent IDs.
- **Secrets:** SSM/Secrets Manager (KMS).
- **PII minimization:** Split profile vs auth claims; encrypt optional sensitive fields client‑side if required.
- **Network:** Public serverless endpoints with WAF; private subnets only if needed.
- **Audit:** All writes include `actorId`, `traceId`. Immutable audit log stream to S3.

---

## 11) Migration Strategy (Min. Re‑work)

- Keep **domain model + GraphQL schema** stable. Only swap adapters:
  - `RepoDynamo` ⇄ `RepoFirestore/Cosmos`
  - `EventBridgeBus` ⇄ `PubSub/EventGrid`
  - `SesNotifier` ⇄ `SendGridNotifier`
  - `OpenSearchIndex` ⇄ `Elastic/CognitiveSearch`
- Store **query logic in resolvers/Lambdas**, not in DB‑specific operators.
- Use **CDC** (Streams/PubSub triggers) consistently named across clouds.

---

## 12) Sample GraphQL Schema (Core)

```graphql
scalar DateTime

type User { id: ID!, nickname: String, avatarUrl: String, language: String, pronouns: String, bio: String, tags: [String!]!, tier: String! }

type Goal { id: ID!, userId: ID!, title: String!, description: String, tags: [String!], createdAt: DateTime!, status: String! }

type Task { id: ID!, goalId: ID!, title: String!, nlpPlan: JSON, dueAt: DateTime, status: String!, assignees: [ID!] }

type Message { id: ID!, roomId: ID!, senderId: ID!, text: String!, ts: DateTime! }

type Offer { id: ID!, title: String!, url: String!, tags: [String!], validTo: DateTime }

type Query { me: User! goals(userId: ID!): [Goal!]! tasks(goalId: ID!): [Task!]! messages(roomId: ID!, after: String): [Message!]! offers(tags: [String!]): [Offer!]! }

type Mutation { upsertProfile(input: ProfileInput!): User! createGoal(input: GoalInput!): Goal! addTask(input: TaskInput!): Task! sendMessage(roomId: ID!, text: String!): Message! markTaskDone(taskId: ID!): Task! }

type Subscription { onMessage(roomId: ID!): Message! }

input ProfileInput { nickname: String, avatarUrl: String, language: String, pronouns: String, bio: String, tags: [String!] }
input GoalInput { title: String!, description: String, tags: [String!] }
input TaskInput { goalId: ID!, title: String!, dueAt: DateTime, nlpPlan: JSON }
```

> Resolvers perform key‑based access only; search routes through the Search microservice.

---

## 13) Terraform — DynamoDB Core (skeleton)

```hcl
resource "aws_dynamodb_table" "gg_core" {
  name           = "gg_core"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

  attribute { name = "PK"     type = "S" }
  attribute { name = "SK"     type = "S" }
  attribute { name = "GSI1PK" type = "S" }
  attribute { name = "GSI1SK" type = "S" }
  attribute { name = "GSI2PK" type = "S" }
  attribute { name = "GSI2SK" type = "S" }
  attribute { name = "GSI3PK" type = "S" }
  attribute { name = "GSI3SK" type = "S" }
  attribute { name = "GSI4PK" type = "S" }
  attribute { name = "GSI4SK" type = "S" }
  attribute { name = "GSI5PK" type = "S" }
  attribute { name = "GSI5SK" type = "S" }
  attribute { name = "GSI6PK" type = "S" }
  attribute { name = "GSI6SK" type = "S" }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }
  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    projection_type = "ALL"
  }
  global_secondary_index {
    name            = "GSI4"
    hash_key        = "GSI4PK"
    range_key       = "GSI4SK"
    projection_type = "ALL"
  }
  global_secondary_index {
    name            = "GSI5"
    hash_key        = "GSI5PK"
    range_key       = "GSI5SK"
    projection_type = "ALL"
  }
  global_secondary_index {
    name            = "GSI6"
    hash_key        = "GSI6PK"
    range_key       = "GSI6SK"
    projection_type = "ALL"
  }

  ttl { attribute_name = "ttl" enabled = true }
}
```

---

## 14) Lambda Authorizer (Python, JWT validation, reusable)

> Works for API Gateway (REQUEST/TOKEN type) and AppSync Lambda authorizer. Supply `ISSUER`, `AUDIENCE` env vars. Cache JWKS on cold start.

```python
# file: authorizer/handler.py
import json, os, time
from urllib.request import urlopen
from jose import jwt

ISSUER = os.environ["ISSUER"]  # e.g., https://cognito-idp.<region>.amazonaws.com/<poolId>
AUD = os.environ["AUDIENCE"]  # app client id or your aud claim
_JWKS = None
_JWKS_TS = 0

def _get_jwks():
    global _JWKS, _JWKS_TS
    if _JWKS and time.time() - _JWKS_TS < 3600:
        return _JWKS
    with urlopen(f"{ISSUER}/.well-known/jwks.json") as r:
        _JWKS = json.loads(r.read())
        _JWKS_TS = time.time()
        return _JWKS

def _policy(principal_id, effect, resource, context=None):
    return {
        "principalId": principal_id,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [{"Action": "execute-api:Invoke", "Effect": effect, "Resource": resource}],
        },
        "context": context or {},
    }

def _verify(token: str):
    jwks = _get_jwks()
    header = jwt.get_unverified_header(token)
    key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
    if not key:
        raise Exception("Unknown key")
    claims = jwt.decode(token, key, algorithms=[header["alg"]], audience=AUD, issuer=ISSUER)
    return claims

def handler(event, context):
    # API GW TOKEN authorizer: token in event["authorizationToken"]
    # API GW REQUEST / AppSync: token in headers
    token = (
        event.get("authorizationToken")
        or event.get("headers", {}).get("Authorization")
        or event.get("headers", {}).get("authorization")
    )
    if not token:
        raise Exception("Unauthorized")
    if token.startswith("Bearer "):
        token = token.split(" ", 1)[1]
    try:
        claims = _verify(token)
        principal = claims.get("sub", "user")
        # inject entitlements so resolvers can enforce
        ctx = {
            "sub": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "tier": claims.get("custom:tier", "free"),
            "scope": " ".join(claims.get("scope", [])) if isinstance(claims.get("scope"), list) else claims.get("scope", "")
        }
        resource = event.get("methodArn") or "*"
        return _policy(principal, "Allow", resource, ctx)
    except Exception:
        resource = event.get("methodArn") or "*"
        return _policy("anonymous", "Deny", resource)
```

**Dockerfile (optional, Lambda container)**
```dockerfile
FROM public.ecr.aws/lambda/python:3.12
COPY authorizer/requirements.txt ./
RUN pip install -r requirements.txt
COPY authorizer/ ./
CMD ["handler.handler"]
```

**requirements.txt**
```
python-jose[cryptography]==3.3.0
```

---

## 15) React — Secure User Profile Page (JWT in Authorization header)

> Uses Tailwind + fetch. The API is behind API Gateway/AppSync with the custom Lambda authorizer above. For production, prefer short‑lived access tokens and store them in memory; avoid long‑lived tokens in localStorage to reduce XSS risk.

```tsx
// file: src/pages/Profile.tsx
import React, { useEffect, useState } from "react";

type Profile = {
  id: string; nickname?: string; avatarUrl?: string; language?: string;
  pronouns?: string; bio?: string; tags: string[]; tier: string;
};

const API_BASE = import.meta.env.VITE_API_BASE as string; // e.g. https://xyz.execute-api.../prod

function getToken(): string | null {
  // Example: token passed by your login flow; prefer in-memory or httpOnly cookie + token exchange endpoint
  return sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
}

export default function Profile() {
  const [me, setMe] = useState<Profile | null>(null);
  const [form, setForm] = useState({ nickname: "", language: "en", pronouns: "", bio: "", tags: "" });
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    async function load() {
      if (!token) { setLoading(false); return; }
      const r = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setMe(data);
        setForm({
          nickname: data.nickname || "",
          language: data.language || "en",
          pronouns: data.pronouns || "",
          bio: data.bio || "",
          tags: (data.tags || []).join(", "),
        });
      }
      setLoading(false);
    }
    load();
  }, [token]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return alert("Not authenticated");
    const body = {
      nickname: form.nickname,
      language: form.language,
      pronouns: form.pronouns,
      bio: form.bio,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    const r = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const updated = await r.json();
      setMe(updated);
      alert("Profile saved");
    } else {
      const err = await r.text();
      alert(`Save failed: ${err}`);
    }
  }

  if (!token) return <div className="p-6 max-w-2xl mx-auto">Please log in to view your profile.</div>;
  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile {me?.tier === "premium" && <span className="text-sm ml-2 px-2 py-1 bg-yellow-100 rounded">Premium</span>}</h1>
      <form onSubmit={save} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium">Nickname</label>
          <input value={form.nickname} onChange={e=>setForm({...form, nickname:e.target.value})} className="mt-1 w-full border rounded p-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Language</label>
            <select value={form.language} onChange={e=>setForm({...form, language:e.target.value})} className="mt-1 w-full border rounded p-2">
              <option value="en">English</option>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Pronouns</label>
            <input value={form.pronouns} onChange={e=>setForm({...form, pronouns:e.target.value})} className="mt-1 w-full border rounded p-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} className="mt-1 w-full border rounded p-2" rows={4} />
        </div>
        <div>
          <label className="block text-sm font-medium">Tags (comma‑separated)</label>
          <input value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})} className="mt-1 w-full border rounded p-2" placeholder="marathon, mindfulness" />
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 w-max">Save</button>
      </form>
    </div>
  );
}
```

**Backend endpoints** (`/me`, `/profile`) sit behind API Gateway/AppSync and rely on the **Lambda authorizer**; handler reads `event.requestContext.authorizer.claims` (API GW) or `event.identity.resolverContext` (AppSync) to get `sub/tier`.

---

## 16) Minimal Handlers (Examples)

```python
# file: api/profile.py (API Gateway Lambda)
import json, os, boto3
from boto3.dynamodb.conditions import Key

ddb = boto3.resource("dynamodb")
tbl = ddb.Table(os.environ["TABLE"])  # gg_core

def me(event, ctx):
    claims = event.get("requestContext", {}).get("authorizer", {})
    sub = claims.get("sub") or claims.get("principalId")
    if not sub:
        return {"statusCode": 401, "body": "Unauthorized"}
    pk = f"USER#{sub}"
    sk = f"PROFILE#{sub}"
    res = tbl.get_item(Key={"PK": pk, "SK": sk})
    item = res.get("Item") or {"id": sub, "tags": [], "tier": claims.get("tier", "free")}
    return {"statusCode": 200, "body": json.dumps(item)}

def upsert_profile(event, ctx):
    claims = event.get("requestContext", {}).get("authorizer", {})
    sub = claims.get("sub")
    body = json.loads(event.get("body") or "{}")
    item = {
        "PK": f"USER#{sub}",
        "SK": f"PROFILE#{sub}",
        "type": "User",
        "id": sub,
        "nickname": body.get("nickname"),
        "language": body.get("language"),
        "pronouns": body.get("pronouns"),
        "bio": body.get("bio"),
        "tags": body.get("tags", []),
        "updatedAt": int(__import__("time").time()),
    }
    tbl.put_item(Item=item)
    return {"statusCode": 200, "body": json.dumps(item)}
```

---

## 17) Integration Notes & Best Practices

- **AppSync + Lambda authorizer:** centralize JWT validation in one place; attach `tier` to context for field‑level authorization (e.g., premium‑only `offers` field).
- **Search fan‑out:** DynamoDB Streams → Lambda → OpenSearch index (bulk). Maintain an `indexVersion` on items for idempotency.
- **Idempotency:** use `Idempotency-Key` header for mutations; handlers store processed keys.
- **Multi‑tenancy:** include `tenantId` for enterprise/company contexts in PKs (e.g., `PK=TENANT#<id>#USER#<userId>`).
- **Testing:** local emulation via LocalStack (DynamoDB, SQS, S3) and a lightweight Apollo GraphQL server for unit tests; keep repo adapters swappable.

---

## 18) Feature Entitlements (Subscription)

- Free tier: up to N chat rooms/day, limited offers, basic analytics.
- Premium: unlimited chat, advanced AI coaching, priority notifications, exclusive offers; enforce in resolvers via `context.tier` and server‑side checks.

---

## 19) Rollout Plan

1. MVP with Users/Goals/Tasks, due notifications daily bucket, simple chat.
2. Add targeting + offers, basic gamification events.
3. Introduce AI coaching + motivational messages.
4. Turn on search and leaderboards as traffic grows.
5. Switch DynamoDB to provisioned+autoscaling once steady, tune GSIs.

---

## 20) What Keeps Costs Low

- Single table and key‑centric queries; avoid cross‑partition scans.
- TTL for chat/history; tiered retention.
- Event‑driven processing; no idle servers.
- Only enable OpenSearch/Redis when a clear need emerges.
- Caching popular reads (AppSync cache, CloudFront) when it’s cheaper than reads.

---

*This blueprint balances performance, cost, and portability. Swap adapters to move clouds without rewriting your domain or UI.*

