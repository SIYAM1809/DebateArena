# 08 — Task Breakdown (LLM-Executable Sprints)

## How to Use This File

Each task below is written to be handed directly to an LLM coding agent.
Every task specifies:
- **Files to create/modify**
- **Exact dependencies to install**
- **Acceptance criteria** (how to know it's done)
- **Reference docs** (which files in this repo to read first)

Tasks are ordered. Complete them in sequence within each sprint. Do not skip tasks.

---

## SPRINT 0 — Project Scaffolding

---

### TASK-000: Initialize Monorepo
**Read first:** `04_SYSTEM_ARCHITECTURE.md` (Section 2: Repository Structure)

**Do:**
1. Create root `package.json` with npm workspaces: `["client", "server"]`
2. Create `client/` folder and run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
3. Create `server/` folder and run `npm init -y`, then `npm install typescript ts-node @types/node --save-dev` and `npx tsc --init`
4. Create `.gitignore` at root covering `node_modules`, `.env`, `.next`, `dist`
5. Create `.env.example` at root with all variable names from `04_SYSTEM_ARCHITECTURE.md` Section 4 (values as placeholders)
6. Create `README.md` with project name, stack, and setup instructions

**Acceptance Criteria:**
- `npm run dev` in `client/` starts Next.js on port 3000 with no errors
- `ts-node src/index.ts` in `server/` runs without crashing (even if index.ts is just `console.log("Server starting")`)

---

### TASK-001: Server Base Setup
**Read first:** `04_SYSTEM_ARCHITECTURE.md` (Sections 2, 4, 5)

**Install:**
```bash
cd server
npm install express cors helmet morgan express-rate-limit express-validator
npm install mongoose @upstash/redis dotenv winston
npm install socket.io jsonwebtoken bcryptjs nodemailer cloudinary multer
npm install @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs @types/nodemailer @types/multer --save-dev
```

**Create:**
- `server/src/index.ts` — HTTP server startup, binds Express app and Socket.io
- `server/src/app.ts` — Express app with middleware: cors, helmet, morgan, json parser, rate limiter
- `server/src/socket.ts` — Socket.io server initialization with JWT auth middleware on handshake
- `server/src/config/env.ts` — Validates all required env vars on startup, throws if missing
- `server/src/config/database.ts` — Mongoose connection with retry logic (max 5 attempts)
- `server/src/config/redis.ts` — Upstash Redis client initialization
- `server/src/utils/logger.ts` — Winston logger (console transport, JSON format)
- `server/src/utils/errors.ts` — Custom error classes: `AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`

**Acceptance Criteria:**
- Server starts, connects to MongoDB and Redis without errors
- `GET /health` returns `{ "status": "ok", "timestamp": "...", "db": "connected" }`
- All missing env vars cause startup to fail with a clear error message listing which vars are missing

---

### TASK-002: Client Base Setup
**Read first:** `07_UI_UX_REQUIREMENTS.md` (Section 1: Design System)

**Install:**
```bash
cd client
npm install axios @tanstack/react-query zustand socket.io-client
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
```

**Create:**
- `client/src/lib/api.ts` — Axios instance pointing to `NEXT_PUBLIC_API_URL`, with request interceptor adding Bearer token from memory, response interceptor handling 401 (calls refresh endpoint, retries original request)
- `client/src/lib/socket.ts` — Socket.io client singleton, exports `getSocket()` function that creates connection on first call
- `client/src/lib/constants.ts` — App-wide constants: ROUND_DURATIONS, MAX_ARGUMENT_LENGTH, etc.
- `client/src/store/authStore.ts` — Zustand store: `{ user, accessToken, setAuth, clearAuth }`
- `client/src/types/user.ts` — TypeScript interfaces from `05_DATA_MODELS.md`
- `client/src/types/debate.ts` — TypeScript interfaces from `05_DATA_MODELS.md`
- `client/src/app/layout.tsx` — Root layout with Inter font, QueryClientProvider, dark background
- `client/src/components/layout/Navbar.tsx` — Navigation bar with logo, auth state-dependent links

**Create global CSS in `client/src/app/globals.css`:**
Apply CSS variables from `07_UI_UX_REQUIREMENTS.md` Section 1.

**Acceptance Criteria:**
- `http://localhost:3000` loads with Navbar, dark background, no console errors
- Zustand store accessible in browser devtools
- Axios instance correctly attaches Authorization header when accessToken is set

---

## SPRINT 1 — Authentication

---

### TASK-010: User Model
**Read first:** `05_DATA_MODELS.md` (Section 1: User Model)

**Create:** `server/src/models/User.ts`

Implement the full Mongoose schema exactly as specified in the data models doc including all indexes. Add a pre-save hook that recomputes `stats.avgScore` whenever `stats.totalScore` or `stats.debatesPlayed` changes.

**Acceptance Criteria:**
- Model imports without errors
- Creating a user with duplicate email throws MongoDB error code 11000
- `avgScore` automatically updates when `totalScore` changes

---

### TASK-011: Auth Service and Routes (Backend)
**Read first:** `02_FUNCTIONAL_REQUIREMENTS.md` (Section 1), `06_API_SPECIFICATION.md` (Section 1)

**Create:**
- `server/src/features/auth/auth.service.ts` — Business logic: registerUser, loginUser, refreshToken, logout, forgotPassword, resetPassword
- `server/src/features/auth/auth.middleware.ts` — `authenticate` middleware that validates Bearer JWT and attaches `req.user`
- `server/src/features/auth/auth.controller.ts` — Express handlers calling service methods
- `server/src/features/auth/auth.routes.ts` — Route definitions with express-validator validation chains
- `server/src/utils/validate.ts` — Reusable validation chains for username, email, password

**Key implementation details:**
- bcrypt saltRounds=12
- JWT access token secret from `JWT_ACCESS_SECRET` env var, 15m expiry
- JWT refresh token secret from `JWT_REFRESH_SECRET` env var, 7d expiry
- Refresh token set as `httpOnly`, `SameSite=Strict`, `Secure` cookie
- Refresh token blacklist: store in Redis with key `token:blacklist:{jti}`, TTL = remaining token lifetime
- OTP: 6-digit, store in Redis `otp:{email}` with 600s TTL, send via Nodemailer
- Always return 401 (not 404) for login failures — never reveal whether email exists

**Acceptance Criteria:**
- POST /api/v1/auth/register creates user, returns 201 with user object and accessToken, sets cookie
- POST /api/v1/auth/login returns 401 for wrong credentials (same message for wrong email and wrong password)
- POST /api/v1/auth/refresh returns new accessToken using cookie
- POST /api/v1/auth/logout blacklists refresh token
- Protected route returns 401 without token, 200 with valid token

---

### TASK-012: Auth UI (Frontend)
**Read first:** `07_UI_UX_REQUIREMENTS.md` (Section 2: Auth Pages)

**Create:**
- `client/src/app/(auth)/login/page.tsx` — Login form
- `client/src/app/(auth)/register/page.tsx` — Register form
- `client/src/hooks/useAuth.ts` — Custom hook: `{ login, register, logout, refreshToken, user, isLoading }`
- `client/src/components/ui/Input.tsx` — Reusable form input with label, error state
- `client/src/components/ui/Button.tsx` — Reusable button with loading state and variants (primary, ghost, danger)

**Implementation:**
- Use react-hook-form + zod for validation. Show field-level errors in real time.
- On register success: auto-login (store accessToken in memory, call setAuth), redirect to /topics
- On login success: same as above, redirect to previous page (use `?redirect=` URL param)
- Access token stored ONLY in Zustand store (in memory), never localStorage
- On page load: call /api/v1/auth/refresh silently to restore session from cookie

**Acceptance Criteria:**
- Register form shows errors for: short username, invalid email, weak password, password mismatch
- Successful register redirects to /topics and Navbar shows username
- Page refresh restores logged-in state via silent refresh
- Logout clears in-memory token and redirects to /login

---

## SPRINT 2 — Topics and Matchmaking

---

### TASK-020: Topic Model and API (Backend)
**Read first:** `05_DATA_MODELS.md` (Section 2), `06_API_SPECIFICATION.md` (Section 2)

**Create:**
- `server/src/models/Topic.ts`
- `server/src/features/topics/topic.service.ts`
- `server/src/features/topics/topic.controller.ts`
- `server/src/features/topics/topic.routes.ts`

Seed 10 sample topics directly in a `server/src/scripts/seed.ts` script.

**Acceptance Criteria:**
- GET /api/v1/topics returns paginated list
- GET /api/v1/topics?category=Technology filters correctly
- POST /api/v1/topics (admin only) creates topic
- Unauthenticated POST returns 401

---

### TASK-021: Topics UI (Frontend)
**Read first:** `07_UI_UX_REQUIREMENTS.md` (Page: Topics Browser)

**Create:**
- `client/src/app/topics/page.tsx`
- `client/src/components/matchmaking/TopicCard.tsx`
- `client/src/components/ui/Badge.tsx` — Category badge with per-category colors

**Acceptance Criteria:**
- Topics load and display in grid
- Category filter buttons update list without page reload (use URL params)
- "Join Queue" button disabled with tooltip if not logged in

---

### TASK-022: Matchmaking Backend
**Read first:** `02_FUNCTIONAL_REQUIREMENTS.md` (Section 3), `04_SYSTEM_ARCHITECTURE.md` (Section 3.5)

**Create:**
- `server/src/models/Debate.ts` (full schema from `05_DATA_MODELS.md`)
- `server/src/features/matchmaking/matchmaking.service.ts`
- `server/src/features/matchmaking/matchmaking.controller.ts`
- `server/src/features/matchmaking/matchmaking.routes.ts`
- `server/src/features/matchmaking/matchmaking.socket.ts`

**Key implementation:**
- Use Redis ZADD/ZPOPMIN for atomic queue operations
- Track user's current queue in Redis: `user:queue:{userId}` → `topicId`, TTL 3 minutes
- If user already in queue or active debate: return 409
- On match: create Debate document with status `preparation`, emit `match_found` to both users' socket rooms
- Bull queue for 3-minute timeout (or use setTimeout + Redis check if Bull unavailable on free tier)

**Acceptance Criteria:**
- Two users joining same topic queue within 3 minutes get matched
- Single user in queue for 3+ minutes receives queue_timeout event
- User cannot join two queues simultaneously
- Debate document created in MongoDB on match

---

### TASK-023: Queue UI (Frontend)
**Read first:** `07_UI_UX_REQUIREMENTS.md` (Page: Matchmaking Queue)

**Create:**
- `client/src/app/queue/[topicId]/page.tsx`
- `client/src/components/matchmaking/QueueStatus.tsx`
- `client/src/components/matchmaking/MatchFoundModal.tsx`
- `client/src/hooks/useQueue.ts`

**Acceptance Criteria:**
- Joining queue shows animated waiting state
- Socket event `match_found` triggers MatchFoundModal with opponent info
- Modal auto-redirects to `/debate/[debateId]` after 3-second countdown
- "Leave Queue" cancels and redirects to /topics

---

## SPRINT 3 — Live Debate

---

### TASK-030: Debate Backend (Rounds and Timer)
**Read first:** `02_FUNCTIONAL_REQUIREMENTS.md` (Section 4), `06_API_SPECIFICATION.md` (Sections 4, 9)

**Create:**
- `server/src/features/debate/debate.service.ts`
- `server/src/features/debate/debate.controller.ts`
- `server/src/features/debate/debate.routes.ts`
- `server/src/features/debate/debate.socket.ts`
- `server/src/features/debate/debate.timer.ts`

**Timer implementation:**
- On debate start (after prep): store round end time in Redis
- Use `setTimeout` on server for each round transition
- On round end: check if both arguments submitted; if not, create timed-out placeholder
- Emit `round_ended`, then after 3-second pause, start next round or trigger scoring

**Argument submission:**
- Validate: user is participant, correct round, hasn't submitted yet, text length valid
- Save argument, emit `argument_submitted`
- If both arguments received: immediately trigger AI scoring (don't wait for timer)

**Forfeit logic:**
- On Socket disconnect: set `isConnected=false` in debate, start 60s countdown in Redis
- If user reconnects (emits `join_debate`): set `isConnected=true`, cancel countdown
- If timer expires: trigger forfeit, emit `debate_forfeited`, update stats

**Acceptance Criteria:**
- Round timer transitions automatically without client action
- Submitting argument triggers immediate AI scoring if opponent already submitted
- Disconnecting and not reconnecting within 60s causes forfeit
- Debate document fully populated in MongoDB after completion

---

### TASK-031: AI Scoring Service
**Read first:** `04_SYSTEM_ARCHITECTURE.md` (Section 3.4), `02_FUNCTIONAL_REQUIREMENTS.md` (FR-DEBATE-004)

**Create:** `server/src/features/ai/scoring.service.ts`

**Implementation:**
```typescript
// Call Hugging Face API for each criterion
async function scoreArgument(argumentText: string, criterion: string): Promise<number> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: argumentText,
        parameters: {
          candidate_labels: ['excellent', 'good', 'average', 'poor', 'very poor']
        }
      })
    }
  );
  // Map confidence scores to 0-10 range
  // excellent * 10 + good * 7.5 + average * 5 + poor * 2.5 + very_poor * 0
}
```

**Fallback:** If API call fails or times out (10s), return score of 5.0 for that criterion, log error with Winston.

**Create:** `server/src/features/ai/scoring.utils.ts` — Score normalization and rounding utilities.

**Acceptance Criteria:**
- Scoring returns numeric result for any non-empty argument text
- Timeout (>10s) results in 5.0 fallback, not server error
- Empty arguments (timed out) receive score of 0 without calling API

---

### TASK-032: Debate Room UI
**Read first:** `07_UI_UX_REQUIREMENTS.md` (Page: Debate Room), `06_API_SPECIFICATION.md` (Section 9)

**Create:**
- `client/src/app/debate/[id]/page.tsx`
- `client/src/components/debate/DebateRoom.tsx`
- `client/src/components/debate/ArgumentPanel.tsx`
- `client/src/components/debate/CountdownTimer.tsx`
- `client/src/components/debate/ScoreDisplay.tsx`
- `client/src/components/debate/RoundIndicator.tsx`
- `client/src/components/debate/VerdictCard.tsx`
- `client/src/components/debate/SpectatorBanner.tsx`
- `client/src/hooks/useDebate.ts` — Full debate state machine driven by Socket.io events
- `client/src/hooks/useCountdown.ts` — Pure countdown timer hook using `setInterval`

**State machine in useDebate.ts:**
```
States: idle → preparation → round_active → scoring → round_complete → verdict
Transitions driven by Socket.io events
```

**Acceptance Criteria:**
- Both participants see same debate state in sync (test with two browser windows)
- Countdown timer accurate to within 1 second
- Argument submitted by opponent appears immediately in their panel
- AI scores animate in after scoring event
- Verdict modal appears at debate end with correct winner

---

## SPRINT 4 — Archive, Profiles, Leaderboard

---

### TASK-040: Search and Archive
**Read first:** `02_FUNCTIONAL_REQUIREMENTS.md` (Section 5), `06_API_SPECIFICATION.md` (Section 5)

**Backend:** Add search to `debate.routes.ts` using MongoDB text search on `topicTitle` and argument text.

**Create:**
- `client/src/app/debate/[id]/transcript/page.tsx` — SSR transcript page
- `client/src/app/debates/page.tsx` — Search and browse page

**Acceptance Criteria:**
- Transcript page renders full debate content without JavaScript (test with curl)
- Search by keyword returns relevant results
- Filter by topic, outcome, and date range work

---

### TASK-041: User Profiles
**Read first:** `06_API_SPECIFICATION.md` (Section 7)

**Create:**
- `server/src/features/users/user.routes.ts`, `user.controller.ts`, `user.service.ts`
- `client/src/app/profile/[username]/page.tsx`
- `client/src/components/profile/StatsCard.tsx`
- `client/src/components/profile/DebateHistoryList.tsx`

**Acceptance Criteria:**
- Public profile page SSR renders (test with curl)
- Own profile shows edit button; others' profiles do not
- Avatar upload via Cloudinary works (PATCH /users/me with multipart form)

---

### TASK-042: Leaderboard
**Read first:** `02_FUNCTIONAL_REQUIREMENTS.md` (Section 6), `06_API_SPECIFICATION.md` (Section 6)

**Backend:**
- MongoDB aggregation pipeline: filter users with debatesPlayed >= 5, sort by winRate DESC then avgScore DESC, limit 100
- Cache result in Redis for 10 minutes

**Frontend:**
- `client/src/app/leaderboard/page.tsx` — SSR with 10-minute revalidation

**Acceptance Criteria:**
- Leaderboard only shows users with 5+ debates
- Page is server-rendered (visible in curl output)
- Top 3 rows have gold/silver/bronze styling

---

## SPRINT 5 — Admin and Polish

---

### TASK-050: Admin Dashboard
**Read first:** `02_FUNCTIONAL_REQUIREMENTS.md` (Section 8), `06_API_SPECIFICATION.md` (Section 8)

**Backend:** Admin routes with role middleware.
**Frontend:** `client/src/app/admin/page.tsx` — Protected by client-side role check (redirect if not admin).

---

### TASK-051: Flag System
**Read first:** `05_DATA_MODELS.md` (Section 4: Flag Model)

**Create:** `server/src/models/Flag.ts` and flag endpoints.
**Frontend:** Flag button in debate room (only visible during/after debate, not to participants while live).

---

### TASK-052: SEO and Meta Tags
**Read first:** `07_UI_UX_REQUIREMENTS.md` (Transcript page Open Graph section)

**Add to all SSR pages:**
- `generateMetadata()` functions in Next.js App Router
- Open Graph tags for transcript and profile pages
- Canonical URLs
- `robots.txt` allowing indexing of transcripts and topics, blocking /admin and /debate/[id] (room)

---

### TASK-053: Rate Limiting and Security Hardening
**Read first:** `03_NON_FUNCTIONAL_REQUIREMENTS.md` (Section 3)

**Add to server:**
- Route-specific rate limiters per NFR-SEC-005
- Helmet.js CSP headers
- Input sanitization middleware on all POST/PATCH routes

---

### TASK-054: Error Handling and Loading States
**Read first:** `03_NON_FUNCTIONAL_REQUIREMENTS.md` (Sections 4, 5)

**Frontend:**
- Error boundary component wrapping DebateRoom
- Loading skeletons for TopicCard grid, LeaderboardTable, ProfileHeader
- Global error toast for API failures (use a lightweight toast library or build minimal custom one)

**Backend:**
- Global Express error handler as last middleware in `app.ts`
- All unhandled promise rejections caught and logged

---

## SPRINT 6 — Testing and Deployment

---

### TASK-060: Unit Tests
**Install:** `npm install jest ts-jest @types/jest --save-dev`

**Write tests for:**
- `auth.service.ts`: register, login, token refresh logic
- `scoring.service.ts`: score normalization, fallback on API failure
- `matchmaking.service.ts`: queue logic, position assignment
- `useCountdown.ts`: timer accuracy

**Target:** 60% coverage on all service files.

---

### TASK-061: Deploy Backend to Railway
1. Create `Procfile`: `web: node dist/index.js`
2. Add `build` script to server `package.json`: `tsc`
3. Connect Railway to GitHub repo, set environment variables from `.env.example`
4. Verify `/health` endpoint responds on Railway URL

---

### TASK-062: Deploy Frontend to Vercel
1. Connect Vercel to GitHub repo, set `client/` as root directory
2. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to Railway URL
3. Verify home page loads, auth works, Socket.io connects

---

## Task Dependency Graph

```
TASK-000
  └── TASK-001 ── TASK-010 ── TASK-011 ── TASK-022 ── TASK-030 ── TASK-031 ── TASK-040
  └── TASK-002 ── TASK-012 ── TASK-021 ── TASK-023 ── TASK-032 ── TASK-041 ── TASK-042
                                                                    └── TASK-050
                                                                    └── TASK-051
                                                                    └── TASK-052
                                                                    └── TASK-053
                                                                    └── TASK-054
                                                                         └── TASK-060
                                                                              └── TASK-061
                                                                              └── TASK-062
```

Do not start a task until all tasks it depends on have passed their acceptance criteria.
```
