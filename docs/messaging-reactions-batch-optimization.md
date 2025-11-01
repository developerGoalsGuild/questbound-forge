# Messages + Reactions Batch Loading: Cost & Performance Analysis

## Current Approach: JavaScript Resolver + Field Resolver (N+1 Problem)

### Architecture
- `query_messages`: JavaScript resolver queries DynamoDB for messages
- `Message.reactions`: Field resolver called **once per message** when reactions are requested

### Cost Analysis (per request for 50 messages)

#### AWS AppSync Costs
- **Messages query**: 1 request invocation
- **Reactions field resolvers**: 50 separate invocations (one per message)
- **Total AppSync invocations**: **51**
- Cost: $4.00 per million requests = **$0.000204 per request** (51 × $0.000004)

#### DynamoDB Costs
- **Messages query**: 1 Query operation
- **Reactions queries**: 50 Query operations (sequential, with AppSync overhead)
- **Total DynamoDB operations**: **51**
- Cost: 
  - On-Demand: ~$1.25 per million reads = **$0.00006375** (51 × $0.00000125)
  - Provisioned: 51 RCU (1 RCU = 1 strongly consistent read)

#### Network & Latency
- **Round trips**: 1 for messages + up to 50 for reactions (AppSync may batch some, but still multiple)
- **Latency**: Sequential execution adds up
  - Messages: ~50-100ms
  - Reactions (50 sequential): ~500-2000ms (10-40ms each)
  - **Total latency**: ~550-2100ms

#### Performance Bottlenecks
- Sequential field resolver execution (even if AppSync batches, network overhead remains)
- Each field resolver = separate AppSync → DynamoDB round trip
- Cold starts for field resolvers (minimal but adds latency)

---

## Proposed Approach: Lambda Resolver (Batch)

### Architecture
- `query_messages`: Lambda resolver that:
  1. Queries DynamoDB for messages
  2. **Batch queries** reactions for all messages in **parallel** using asyncio
  3. Returns messages with reactions attached

### Cost Analysis (per request for 50 messages)

#### AWS Lambda Costs
- **Messages query**: 1 Lambda invocation
- **Execution time**: ~200-500ms (parallel queries are faster)
- **Memory**: 128MB (typical)
- Cost calculation:
  - First 1M requests free (if within free tier)
  - Then: $0.20 per million requests
  - Compute: $0.0000166667 per GB-second
  - For 128MB × 0.5s: **$0.00000104** per request
- **Total Lambda cost**: **~$0.000002** per request (after free tier)

#### AWS AppSync Costs
- **Messages query**: 1 request (Lambda invocation)
- **Total AppSync invocations**: **1**
- Cost: **$0.000004** per request

#### DynamoDB Costs
- **Messages query**: 1 Query operation
- **Reactions queries**: 50 Query operations (**executed in parallel**)
- **Total DynamoDB operations**: **51** (same number, but faster)
- Cost: Same as current approach: **$0.00006375** (on-demand)

#### Network & Latency
- **Round trips**: 
  - 1 AppSync → Lambda
  - 1 Lambda → DynamoDB (messages)
  - 50 Lambda → DynamoDB (reactions, **all parallel**)
- **Latency**: 
  - Messages: ~50-100ms
  - Reactions (50 parallel): ~50-100ms (all execute simultaneously)
  - Lambda overhead: ~10-50ms
  - **Total latency**: **~110-250ms** (5-10x faster!)

#### Performance Benefits
- ✅ **Parallel execution**: All reaction queries run simultaneously
- ✅ **Single round trip**: Client makes one request, gets everything back
- ✅ **Lower latency**: 5-10x faster than sequential approach
- ✅ **Better DynamoDB utilization**: Parallel queries don't block each other

---

## Cost Comparison Summary (50 messages)

| Metric | Current (JS + Field) | Lambda Batch | Winner |
|--------|---------------------|--------------|--------|
| **AppSync Invocations** | 51 | 1 | 🏆 Lambda |
| **AppSync Cost** | $0.000204 | $0.000004 | 🏆 Lambda (51x cheaper) |
| **Lambda Cost** | $0 | ~$0.000002 | 🏆 Current (but negligible) |
| **DynamoDB Operations** | 51 | 51 | 🤝 Tie (same) |
| **DynamoDB Cost** | $0.00006375 | $0.00006375 | 🤝 Tie (same) |
| **Total Cost per Request** | **$0.00026775** | **$0.00006975** | 🏆 Lambda (**3.8x cheaper**) |
| **Latency** | 550-2100ms | 110-250ms | 🏆 Lambda (**5-10x faster**) |

### At Scale (1 million requests/month)

| Approach | Monthly Cost | Latency Impact |
|----------|--------------|----------------|
| Current (JS + Field) | ~$268 | High (sequential) |
| Lambda Batch | ~$70 | Low (parallel) |
| **Savings** | **~$198/month** | **5-10x faster** |

---

## Performance Comparison

### Current Approach Timeline
```
Client Request
  ↓ (50ms)
AppSync: Query Messages
  ↓ (100ms)
Return 50 Messages
  ↓ (20ms each × 50 = 1000ms)
AppSync: Field Resolver #1 → DynamoDB → Response
AppSync: Field Resolver #2 → DynamoDB → Response
...
AppSync: Field Resolver #50 → DynamoDB → Response
  ↓
Client Receives Complete Response
Total: ~1150ms
```

### Lambda Batch Approach Timeline
```
Client Request
  ↓ (50ms)
AppSync: Invoke Lambda
  ↓ (10ms)
Lambda: Query Messages (50-100ms)
Lambda: Start 50 Parallel Reaction Queries (50-100ms) ← ALL AT ONCE
  ↓
Lambda: Merge Results
  ↓ (50ms)
Return Complete Response to Client
Total: ~160-200ms
```

**Performance Improvement: ~5-7x faster**

---

## Recommendations

### ✅ Use Lambda Resolver If:
- You care about **latency** (user experience)
- You have **high message volumes** (cost savings compound)
- You want **predictable performance** (parallel execution is consistent)
- You're already using Lambda for other resolvers

### ⚠️ Consider Current Approach If:
- Message volume is **very low** (< 1000 requests/month)
- Latency is **not critical** (internal/admin tools)
- You want to **minimize infrastructure complexity**
- You're constrained by Lambda function limits

### 💡 Hybrid Approach (Recommended):
For **opt-in reactions** (frontend doesn't always need them):
- Use current approach but make reactions **optional**
- Frontend can batch-fetch reactions separately when needed
- Or use Lambda resolver only when reactions are requested

---

## Implementation Complexity

### Current Approach
- ✅ Already implemented
- ✅ No additional infrastructure
- ❌ N+1 performance problem

### Lambda Approach
- ⚠️ Requires creating Lambda function
- ⚠️ Requires Lambda data source in AppSync
- ⚠️ Requires updating Terraform config
- ✅ Better performance and cost at scale

**Effort**: ~2-3 hours to implement Lambda resolver
**Payoff**: 5-10x faster + 3.8x cheaper at scale

---

## Conclusion

**Lambda resolver is more cost AND performance efficient** for:
- ✅ **Cost**: 3.8x cheaper at scale (fewer AppSync invocations)
- ✅ **Performance**: 5-10x faster (parallel execution)
- ✅ **Scalability**: Better as message volume increases

The only downside is infrastructure complexity, but the benefits far outweigh this for production workloads.

