# 02 — Functional Requirements Document (FRD)

## 1. Authentication Module

### FR-AUTH-001: User Registration
- **Input:** username (unique, 3–20 chars, alphanumeric + underscore), email (valid format), password (min 8 chars, 1 uppercase, 1 number)
- **Process:** Hash password with bcrypt (saltRounds=12), store user document in MongoDB, generate JWT (access token: 15min, refresh token: 7 days)
- **Output:** Return user profile object + tokens, set httpOnly cookie for refresh token
- **Error Cases:** Duplicate email → 409, duplicate username → 409, validation failure → 400

### FR-AUTH-002: User Login
- **Input:** email, password
- **Process:** Find user by email, compare password with bcrypt, generate new JWT pair
- **Output:** Return user profile + tokens
- **Error Cases:** User not found → 401 (generic message), wrong password → 401 (same generic message — do not distinguish)

### FR-AUTH-003: Token Refresh
- **Input:** Refresh token (from httpOnly cookie)
- **Process:** Verify refresh token signature, check it's not in blacklist (Redis), issue new access token
- **Output:** New access token in response body
- **Error Cases:** Invalid/expired → 401, blacklisted → 401

### FR-AUTH-004: Logout
- **Process:** Add refresh token to Redis blacklist with TTL matching remaining token lifetime
- **Output:** Clear httpOnly cookie, 200 OK

### FR-AUTH-005: Password Reset
- **Process:** Generate 6-digit OTP, store in Redis with 10-minute TTL, send via Nodemailer (Gmail SMTP free)
- **Verify OTP:** Check Redis, if valid allow password reset, delete OTP from Redis

---

## 2. Topic Management Module

### FR-TOPIC-001: List Topics
- Return all active debate topics with fields: id, title, description, category, debateCount, isActive
- Support filtering by category, sort by debateCount or createdAt
- Publicly accessible (no auth required)

### FR-TOPIC-002: Create Topic (Admin only)
- **Input:** title (max 100 chars), description (max 500 chars), category (enum: Politics, Science, Philosophy, Technology, Society, Ethics)
- **Process:** Create topic document, set isActive=true
- **Validation:** Title must be a debatable proposition (not a question), no duplicate titles

### FR-TOPIC-003: Archive Topic (Admin only)
- Set isActive=false, no new queues can be created for archived topics
- Existing debate transcripts remain accessible

---

## 3. Matchmaking Module

### FR-MATCH-001: Join Queue
- **Input:** userId, topicId
- **Validation:** User must not already be in a queue or active debate
- **Process:**
  1. Add userId to Redis sorted set for that topic (score = timestamp)
  2. Check if another user is waiting in same topic queue
  3. If match found: remove both from queue, create Debate document, emit `match_found` event to both users via Socket.io
  4. If no match: user waits, poll every 5 seconds (server-side), timeout after 3 minutes

### FR-MATCH-002: Match Assignment
- When two users are matched:
  - Randomly assign one user as FOR, other as AGAINST
  - Create debate document with status: `preparation`
  - Emit `debate_ready` event with debateId, opponentUsername, assignedPosition, preparationEndTime

### FR-MATCH-003: Leave Queue
- Remove userId from all Redis topic queues
- Return 200 OK

### FR-MATCH-004: Queue Timeout
- After 3 minutes with no match, remove user from queue
- Emit `queue_timeout` event to user

---

## 4. Debate Session Module

### FR-DEBATE-001: Debate Structure
Each debate follows this fixed structure:
- **Preparation Phase:** 60 seconds (both users can read topic, prepare opening)
- **Round 1 (Opening):** Each user has 90 seconds to write their opening argument
- **Round 2 (Rebuttal):** Each user has 120 seconds to respond to opponent's opening
- **Round 3 (Closing):** Each user has 60 seconds to write a closing statement
- **Scoring Phase:** AI judge scores all arguments, 10–15 seconds
- **Verdict:** Final scores displayed, winner declared, debate saved to archive

### FR-DEBATE-002: Argument Submission
- **Input:** userId, debateId, roundNumber, argumentText (min 50 chars, max 1000 chars)
- **Validation:** Must be within active round, user must not have submitted in this round already
- **Process:** Save argument to debate document, emit `argument_submitted` event to both users + spectators
- **If opponent already submitted:** Immediately trigger AI scoring for the round
- **If opponent has not submitted:** Wait for opponent or trigger when timer expires

### FR-DEBATE-003: Argument Timeout
- If a user doesn't submit before their round timer expires:
  - Submit an empty placeholder argument
  - System scores it as 0 for all criteria
  - Do not penalize opponent — continue debate

### FR-DEBATE-004: AI Scoring (Per Round)
- After both arguments are submitted (or one times out):
  - Send both arguments to Hugging Face Inference API
  - Use zero-shot classification model: `facebook/bart-large-mnli`
  - Score each argument on three criteria (0–10 each):
    - **Logical Coherence:** Does the argument follow a logical structure?
    - **Relevance:** Is the argument on-topic?
    - **Persuasiveness:** Is the argument convincing?
  - Total round score = average of three criteria (max 10 per round)
  - Store scores in debate document
  - Emit `round_scored` event with scores for both users

### FR-DEBATE-005: Final Verdict
- Sum all round scores per user
- Winner = user with higher total score
- If scores equal: declare draw
- Calculate score breakdown: which rounds each user won
- Update both users' stats: wins, losses, draws, avgScore
- Set debate status to `completed`
- Emit `debate_concluded` event with full results

### FR-DEBATE-006: Spectator Mode
- Any authenticated user can join a debate room as spectator via GET /debates/:id/spectate
- Spectators receive all Socket.io events (argument_submitted, round_scored, debate_concluded) in real-time
- Spectators cannot submit arguments or interact
- Spectator count visible to all participants

### FR-DEBATE-007: Debate Abandonment
- If a user disconnects and does not reconnect within 60 seconds:
  - System auto-forfeits that user
  - Opponent declared winner by default
  - Debate saved with status `forfeited`
  - Forfeit counts as a loss in user stats

---

## 5. Archive Module

### FR-ARCHIVE-001: Debate Transcript
- Return full debate document including:
  - Topic title and description
  - Both usernames and their assigned positions
  - All arguments per round with timestamps
  - AI scores per round per user
  - Final verdict and total scores
- Publicly accessible without auth (for SEO)

### FR-ARCHIVE-002: Search Debates
- Full-text search using MongoDB Atlas Search (free tier) on topic title + argument text
- Filter by: topicId, outcome (FOR_won / AGAINST_won / draw / forfeited), dateRange
- Sort by: date (default), totalScore (highest quality debates first)
- Pagination: 20 results per page

### FR-ARCHIVE-003: Browse by Topic
- Return all completed debates for a given topicId
- Sort by date descending
- Include participant usernames and final scores in list view (not full transcript)

---

## 6. Leaderboard Module

### FR-LEADER-001: Global Leaderboard
- Rank users by: win rate (min 5 debates played), then by avgArgumentScore
- Display: rank, username, wins, losses, draws, win rate %, avg score
- Update every 10 minutes (cached in Redis)
- Top 100 users displayed

### FR-LEADER-002: Topic Leaderboard
- Same as global but filtered to debates on a specific topic

---

## 7. User Profile Module

### FR-PROFILE-001: View Profile
- Public profile page: username, avatar, join date, total debates, wins, losses, draws, win rate, avg AI score, recent debates list
- No email or private data exposed publicly

### FR-PROFILE-002: Edit Profile
- Authenticated user can update: username (once per 30 days), avatar (Cloudinary upload, max 2MB, jpg/png only)
- Cannot change email after registration (simplification for MVP)

### FR-PROFILE-003: Debate History
- List of all debates the user participated in, paginated 10 per page
- Each entry: topic, date, position, opponent username, outcome, user's total score

---

## 8. Admin Module

### FR-ADMIN-001: Admin Auth
- Admin role stored in user document (role: 'admin')
- Admin routes protected by role-checking middleware
- No separate admin login — use same auth system

### FR-ADMIN-002: Topic Management
- CRUD operations on topics (Create, Read, Update status, soft-delete)

### FR-ADMIN-003: Content Moderation
- View flagged debates
- Actions: dismiss flag, warn user (logged), ban user (isActive=false)
- Banned users cannot log in

### FR-ADMIN-004: Platform Metrics
- Total users, debates per day (last 30 days), active users (last 7 days)
- Served from MongoDB aggregation pipelines

---

## 9. Notification Module

### FR-NOTIFY-001: In-App Notifications (Socket.io)
Events emitted to connected clients:

| Event Name | Trigger | Data |
|-----------|---------|------|
| `match_found` | Matched with opponent | debateId, opponentUsername, position, prepEndTime |
| `queue_timeout` | 3-min queue timeout | topicId |
| `debate_ready` | Prep phase starts | debateId, roundDuration |
| `argument_submitted` | Any argument posted | roundNumber, position, argumentText, timestamp |
| `round_scored` | AI scoring complete | roundNumber, forScore, againstScore, breakdown |
| `timer_warning` | 30 seconds remaining | secondsLeft |
| `round_ended` | Round timer expired | roundNumber |
| `debate_concluded` | Debate finished | verdict, scores, winnerId |
| `opponent_disconnected` | Opponent disconnects | reconnectWindowSeconds |
| `debate_forfeited` | Forfeit triggered | forfeitedUserId, winnerId |
