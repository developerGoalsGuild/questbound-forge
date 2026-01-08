
# ⚔️ Goals Guild Subscription Plans

The Guild offers four main tiers — each representing a deeper level of mastery, connection, and creative power.  
Below are the full details, including core features for each path.

---

## 🧭 INITIATE — $1 / month
**For:** New explorers joining the Guild  
**Goal:** Build consistency and awaken purpose

**Core Features**
- Access to Guild feed (read, react, and comment)
- Daily motivational prompts + weekly “Guild Summon” rituals
- Personal Notion tracker (import template provided)
- 1 AI-generated reflection question per day
- Earn XP for daily streaks and participation
- Basic profile & progress visualization
- Limited Veo-3 video credits (up to 2 per month)

**Why it matters:** Helps new users begin their Quest journey with structure and gentle accountability.

---

## 🪶 JOURNEYMAN — $15 / month
**For:** Active creators building discipline and momentum  
**Goal:** Transform goals into consistent daily rituals

**Core Features**
- All Initiate benefits
- Full “Epic Quest Setup” (AI-guided NLP-based goal creation)
- Daily accountability feed + habit tracking
- Veo-3 video integration (5 renders / month)
- Guild discussion threads and DM circles
- Custom tags and milestone tracking
- Access to “Guild Sparks” — short wisdom drops from mentors

**Why it matters:** Ideal for creators who want structure, accountability, and aesthetic motivation.

---

## 🔮 RADIANT SAGE — $49 / month
**For:** Mentors, community builders, or those seeking mastery  
**Goal:** Refine craft, lead others, and document your legacy

**Core Features**
- All Journeyman benefits
- Create and host your own micro-Guilds (up to 20 members)
- Weekly AI summary report (“Guild Chronicle”)
- Advanced analytics and personal growth metrics
- Exportable storybook mode (auto-turns posts into a narrative)
- Integrations: Notion, YouTube, X, Calendar, Google Sheets
- Extended Veo-3 rendering quota (15 per month)
- Private feedback from Guild Curators

**Why it matters:** You don’t just pursue goals — you shape worlds for others.

---

## 🏰 GUILDMASTER (Enterprise) — Custom Pricing
**For:** Teams, organizations, and accelerators  
**Goal:** Build scalable ecosystems of creators

**Core Features**
- All Radiant Sage benefits
- White-label Guild experience + custom branding
- Team management dashboard with analytics
- Shared “Quest Boards” (OKRs, projects, or sprints)
- Member analytics, streak tracking, and engagement insights
- API + SSO integration
- Dedicated success manager and support

**Why it matters:** The Guildmaster plan transforms communities into living ecosystems of purpose and collaboration.

---

## 💎 ADD-ONS (Credits System)

| Feature | Cost | Description |
|----------|------|-------------|
| 🎥 Veo-3 Video Generation | 3 credits per render | Generate cinematic visualization of your daily quest |
| 🧙‍♂️ AI Mentor Feedback | 1 credit per reflection | Receive narrative-style feedback on your entries |
| 🪞 Guild Mirror Report | 5 credits per month | AI-driven overview of tone, focus, and consistency |

Credits roll over monthly and can be topped up ($5 = 10 credits).

---

## 🏅 FOUNDER PASSES

| Pass | Price | Benefits |
|------|--------|-----------|
| **Founding Member** | $99 one-time | Lifetime “Radiant Sage” access + golden badge |
| **Guild Builder** | $199 one-time | Lifetime Guildmaster workspace + Discord access + beta tools |

---

### ⚙️ Implementation Notes

- **Billing:** Stripe Billing + Customer Portal  
- **Access Control:** Cognito user groups (`INITIATE`, `JOURNEYMAN`, `SAGE`, `GUILDMASTER`)  
- **Automation:** Lambda webhook → updates DynamoDB (`USER#id` → `plan_tier`, `credits`, `renewal_date`)  
- **AppSync Resolvers:** Guard access by tier for AI and community features  

---

*"Choose your path, Initiate. The higher you climb, the brighter your light becomes."*
