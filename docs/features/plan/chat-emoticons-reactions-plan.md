# Chat Emoticons and Reactions - Implementation Plan

## Brief Description

Add inline emoji support with picker and message reactions to the chat system. Users can insert emojis into messages and react to messages with emoji. Implementation uses Lambdas for writes and AppSync for reads, following the DynamoDB single-table pattern.

## Recommended Architecture (For 10k reactions/day scale)

**Strategic approach:** Start simple with unsharded counters, add sharding later if hotspots appear (feature-flagged).

### Data Model (Simple Counter Approach - Initial)

**Reaction Record (Idempotent):**
- `PK=MSG#<messageId>`
- `SK=REACT#<shortcode>#<userId>`
- Attributes: `{ emojiUnicode, emojiShortcode, userId, createdAt }`

**Summary Counter (One per message+emoji):**
- `PK=MSG#<messageId>`
- `SK=SUMMARY#REACT#<shortcode>`
- Attributes: `{ count, updatedAt, version? }`

**Message Emoji Metadata:**
- Extracted on message creation and stored in message item
- `emojiMetadata: { shortcodes: string[], unicodeCount: number }`

### Write Path (Lambda Resolver)

**Add Reaction:**
1. Put reaction record with `ConditionExpression attribute_not_exists(PK,SK)` (idempotent)
2. If successful, UpdateItem summary counter with `ADD count :one`
3. Conditional write ensures message exists (can add check if needed)
4. Exponential backoff with full jitter on conditional failures (max 3 retries)

**Remove Reaction:**
1. Delete reaction record with `ConditionExpression attribute_exists(PK,SK)`
2. If successful, UpdateItem summary counter with `ADD count :negOne`
3. Guard to ensure count >= 0
4. Idempotent (safe if already removed)

### Read Path (AppSync VTL Resolver)

**List Reactions:**
1. Query `PK=MSG#<id>`, `SK begins_with SUMMARY#REACT#` to get all emoji summaries
2. For each emoji, point GetItem to check `REACT#<shortcode>#<viewerId>` for `viewerHasReacted`
3. Return: `[{ shortcode, unicode, count, viewerHasReacted }]`
4. Cache results for 5-10 seconds in AppSync resolver response mapping

### Future Scaling (When Needed)

**Sharded Counters (Feature Flag: `chatReactionsSharded`):**
- Split summary to: `SK=SUMMARY#REACT#<shortcode>#SHARD#<0..N-1>`
- Shard selection: `hash(userId, shortcode) % N` (start with N=8)
- Read path aggregates all shards per emoji and sums counts
- Monitor hot partitions via CloudWatch metrics
- Enable only when contention appears

**Stream-Based Aggregation (Optional, Feature Flag: `chat affiliatesStreamAgg`):**
- Write only reaction records
- DynamoDB Streams + Lambda updates summary counters asynchronously
- Eventual consistency for counts (acceptable for reactions)
- Reduces write contention but adds latency

### Cost Estimate (10k reactions/day = ~300k/month)

- **DynamoDB writes:** ~600k WCUs → ~$0.75/month
- **DynamoDB reads:** ~$0.05-0.10/month
- **Lambda invocations:** ~$0.06-0.10/month
- **AppSync requests:** <$1/month
- **Total:** ~$2-3/month

### Table Assignment

- **General rooms:** Use `gg_core` table
- **Guild rooms:** Use `gg_guild` table
- Reaction items follow message's PK pattern (ROOM#<id> or GUILD#<id>)

## Implementation Phases

### Phase 1: Backend Data Layer

#### 1.1 GraphQL Schema Updates
**Files to modify:**
- `backend/infra/terraform2/graphql/schema.graphql`

**Changes:**
- Add `Reaction` type: `{ shortcode: String!, unicode: String!, count: Int!, viewerHasReacted: Boolean! }`
- Add `emojiMetadata` field to `Message` type: `{ shortcodes: [String!]!, unicodeCount: Int! }`
- Add mutations: `addReaction(messageId: ID!, shortcode: String!, unicode: String!): ReactionResponse`
- Add mutations: `removeReaction(messageId: ID!, shortcode: String!): ReactionResponse`
- Add queries: `reactions(messageId: ID!): [Reaction!]!`

#### 1.2 AppSync Resolvers
**Files to create:**
- `backend/infra/terraform2/resolvers/addReaction.js`
- `backend/infra/terraform2/resolvers/removeReaction.js`
- `backend/infra/terraform2/resolvers/reactions.js`

**Algorithm (addReaction.js):**
1. Extract `messageId`, `shortcode`, `unicode` from args
2. Get `userId` from identity context
3. Determine table (gg_core or gg_guild) based on messageId pattern
4. Put item: `PK=MSG#<messageId>`, `SK=REACT#<shortcode>#<userId>` with condition `attribute_not_exists(PK,SK)`
5. On success, UpdateItem summary: `PK=MSG#<messageId>`, `SK=SUMMARY#REACT#<shortcode>` with `ADD count :one`
6. Return current count and status

**Algorithm (removeReaction.js):**
1. Extract `messageId`, `shortcode` from args
2. Get `userId` from identity context
3. Determine table based on messageId pattern
4. Delete item: `PK=MSG#<messageId>`, `SK=REACT#<shortcode>#<userId>` with condition `attribute_exists(PK,SK)`
5. On success, UpdateItem summary with `ADD count :negOne` (ensure count >= 0)
6. Return current count and status

**Algorithm (reactions.js):**
1. Extract `messageId` from args
2. Get `userId` from identity context (for viewerHasReacted)
3. Determine table based on messageId pattern
4. Query `PK=MSG#<messageId>`, `SK begins_with SUMMARY#REACT#` to get all summaries
5. For each summary, GetItem `REACT#<shortcode>#<userId>` to check viewerHasReacted
6. Return array of reactions with counts and viewerHasReacted flags

#### 1.3 Message Emoji Metadata Extraction
**Files to modify:**
- `backend/infra/terraform2/resolvers/sendMessage.js`

**Changes:**
- Extract emojis from message text using emoji detection
- Store `emojiMetadata: { shortcodes: [...], unicodeCount: N }` in message item
- Use unicode-to-shortcode mapping function

### Phase 2: Backend Service Updates

#### 2.1 Emoji Parsing Service
**Files to create:**
- `backend/services/messaging-service/emoji_parser.py`

**Functions:**
- `extract_emojis(text: str) -> List[str]`: Extract Unicode emoji characters
- `unicode_to_shortcode(emoji: str) -> str`: Convert Unicode to canonical shortcode
- `normalize_skin_tone(emoji: str) -> str`: Normalize skin tone variants to base emoji

**Dependencies:**
- Use `emoji` Python library for proper parsing
- Fallback to range-based detection if library unavailable

#### 2.2 FastAPI Reactions Endpoints (Optional, for REST API)
**Files to modify:**
- `backend/services/messaging-service/main.py`

**Endpoints:**
- `POST /messaging/messages/{message_id}/reactions` → Add reaction
- `DELETE /messaging/messages/{message_id}/reactions/{shortcode}` → Remove reaction
- `GET /messaging/messages/{message_id}/reactions` → List reactions

**Note:** These can delegate to AppSync or implement directly with boto3 DynamoDB client.

### Phase 3: Frontend Implementation

#### 3.1 TypeScript Types
**Files to modify:**
- `frontend/src/types/messaging.ts`

**Add:**
- `Reaction` interface: `{ shortcode: string; unicode: string; count: number; viewerHasReacted: boolean }`
- `EmojiMetadata` interface: `{ shortcodes: string[]; unicodeCount: number }`
- Update `Message` interface to include `emojiMetadata?` and `reactions?`

#### 3.2 Emoji Picker Component
**Files to create:**
- `frontend/src/components/chat/EmojiPicker.tsx`

**Features:**
- Lightweight emoji picker (use `emoji-mart` or similar)
- Categories: Recently used, Smileys, People, Animals, Food, Activities, Travel, Objects, Symbols, Flags
- Search functionality
- Keyboard navigation (arrow keys, Enter to select)
- Accessible: ARIA labels, roving tabindex

#### 3.3 MessageInput Integration
**Files to modify:**
- `frontend/src/components/messaging/MessageInput.tsx`

**Changes:**
- Add emoji picker button next to attachment button
- On emoji select, insert at cursor position
- Handle emoji rendering in text (display as Unicode)
- Debounce emoji insertion for analytics

#### 3.4 Reactions Bar Component
**Files to create:**
- `frontend/src/components/chat/ReactionsBar.tsx`

**Features:**
- Display reaction counts with emoji
- Click emoji to toggle reaction (optimistic update)
- Show "Add reaction" button (+ icon) that opens emoji picker
- Visual feedback: highlight if viewerHasReacted
- Accessible: announce reactions to screen readers

#### 3.5 MessageItem Integration
**Files to modify:**
- `frontend/src/components/messaging/MessageItem.tsx`

**Changes:**
- Add ReactionsBar below message bubble
- Position reactions based on message alignment (own vs others)
- Hover interactions for reactions

#### 3.6 API Client Functions
**Files to modify:**
- `frontend/src/lib/api/messaging.ts`

**Add:**
- `addReaction(messageId: string, shortcode: string, unicode: string): Promise<Reaction>`
- `removeReaction(messageId: string, shortcode: string): Promise<void>`
- `getReactions(messageId: string): Promise<Reaction[]>`

**Headers:** Always include `Authorization: Bearer ${token}` and `x-api-key: ${API_GATEWAY_KEY}`

#### 3.7 Custom Hook for Reactions
**Files to create:**
- `frontend/src/hooks/useReactions.ts`

**Features:**
- Optimistic updates with rollback on error
- Cache reaction summaries per message
- Debounce rapid toggles (200-500ms)
- Merge server response with local state

### Phase 4: Internationalization & Accessibility

#### 4.1 Translation Files
**Files to create:**
- `frontend/src/i18n/chat.emojis.en.ts`
- `frontend/src/i18n/chat.emojis.es.ts`
- `frontend/src/i18n/chat.emojis.fr.ts`

**Content:**
- Emoji picker category labels
- Reaction action labels ("Add reaction", "Remove reaction")
- Error messages
- Screen reader announcements

#### 4.2 Accessibility Enhancements
**Files to modify:**
- All reaction-related components

**Features:**
- ARIA live regions for reaction changes
- Keyboard shortcuts for emoji picker
- Focus management when picker opens/closes
- Proper labeling for screen readers

### Phase 5: Testing

#### 5.1 Backend Unit Tests
**Files to create:**
- `backend/infra/terraform2/resolvers/__tests__/addReaction.test.js`
- `backend/infra/terraform2/resolvers/__tests__/removeReaction.test.js`
- `backend/infra/terraform2/resolvers/__tests__/reactions.test.js`
- `backend/services/messaging-service/tests/test_emoji_parser.py`

**Coverage:**
- Idempotent add/remove operations
- Counter increments/decrements correctly
- Table selection (gg_core vs gg_guild)
- Error handling (missing message, invalid shortcode)
- Skin tone normalization

#### 5.2 Frontend Unit Tests
**Files to create:**
- `frontend/src/components/chat/__tests__/EmojiPicker.test.tsx`
- `frontend/src/components/chat/__tests__/ReactionsBar.test.tsx`
- `frontend/src/hooks/__tests__/useReactions.test.ts`

**Coverage:**
- Emoji insertion at cursor
- Optimistic updates and rollback
- Keyboard navigation
- Accessibility features

#### 5.3 E2E Tests (Selenium)
**Files to create:**
- `tests/chat-emoticons-reactions.spec.js`
- `scripts/run-chat-emoticons-reactions-tests.ps1`

**Scenarios:**
- Insert emoji in message and send
- Add reaction to message
- Remove reaction from message
- View reaction counts
- Emoji picker keyboard navigation
- Screen reader announcements

### Phase 6: Monitoring & Rollout

#### 6.1 Metrics
**CloudWatch Metrics:**
- `chat.reaction.add` (count)
- `chat.reaction.remove` (count)
- `chat.reaction.retry` (count)
- `chat.emoji.inline` (count)
- DynamoDB throttling metrics per table

#### 6.2 Feature Flags
**SSM Parameters:**
- `chatReactionsEnabled` (boolean, default: true)
- `chatReactionsSharded` (boolean, default: false) - for future sharding
- `chatEmojiPickerEnabled` (boolean, default: true)

#### 6.3 Rollout Strategy
- Deploy backend resolvers first
- Enable feature flag for 10% of users
- Monitor metrics for errors/throttling
- Gradually increase to 100%
- Monitor hot partitions, enable sharding if needed

## Risk Mitigation

- **Large emoji payload →** lazy-load emoji picker, code-split emoji data
- **Dynamo write contention →** start with simple counters, add sharding behind feature flag when needed
- **Skin tone/variant duplicates →** normalize to canonical shortcode on write
- **API shape drift →** version GraphQL schema properly, maintain backward compatibility

## Files Summary

### Backend (GraphQL/AppSync)
- `backend/infra/terraform2/graphql/schema.graphql` - Add Reaction types and mutations
- `backend/infra/terraform2/resolvers/addReaction.js` - New resolver
- `backend/infra/terraform2/resolvers/removeReaction.js` - New resolver
- `backend/infra/terraform2/resolvers/reactions.js` - New resolver
- `backend/infra/terraform2/resolvers/sendMessage.js` - Add emoji metadata extraction

### Backend (Python Services)
- `backend/services/messaging-service/emoji_parser.py` - New emoji parsing module
- `backend/services/messaging-service/main.py` - Optional REST endpoints

### Frontend
- `frontend/src/components/chat/EmojiPicker.tsx` - New component
- `frontend/src/components/chat/ReactionsBar.tsx` - New component
- `frontend/src/components/messaging/MessageInput.tsx` - Integrate picker
- `frontend/src/components/messaging/MessageItem.tsx` - Add reactions bar
- `frontend/src/lib/api/messaging.ts` - Add reaction API functions
- `frontend/src/hooks/useReactions.ts` - New hook
- `frontend/src/types/messaging.ts` - Add reaction types
- `frontend/src/i18n/chat.emojis.*.ts` - Translation files

### Tests
- `backend/infra/terraform2/resolvers/__tests__/*reaction*.test.js` - Backend tests
- `backend/services/messaging-service/tests/test_emoji_parser.py` - Parser tests
- `frontend/src/components/chat/__tests__/*.test.tsx` - Frontend component tests
- `tests/chat-emoticons-reactions.spec.js` - E2E tests
- `scripts/run-chat-emoticons-reactions-tests.ps1` - E2E test runner



