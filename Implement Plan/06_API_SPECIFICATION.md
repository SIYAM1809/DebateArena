# 06 — API Specification

**Base URL:** `https://api.debatearena.app/api/v1`
**Auth:** Bearer token in `Authorization` header for protected routes
**Content-Type:** `application/json` for all requests/responses

---

## Legend
- 🔓 Public (no auth)
- 🔐 Authenticated user required
- 👑 Admin role required

---

## 1. Auth Endpoints

### POST /auth/register 🔓
Register a new user.

**Request Body:**
```json
{
  "username": "debater42",
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response 201:**
```json
{
  "user": {
    "_id": "64abc...",
    "username": "debater42",
    "email": "user@example.com",
    "avatar": null,
    "role": "user",
    "stats": { "debatesPlayed": 0, "wins": 0, "losses": 0, "draws": 0, "avgScore": 0 },
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "accessToken": "eyJhbGc..."
}
```
Sets httpOnly cookie: `refreshToken`

**Errors:** 400 (validation), 409 (duplicate username/email)

---

### POST /auth/login 🔓
**Request Body:**
```json
{ "email": "user@example.com", "password": "SecurePass123" }
```
**Response 200:** Same structure as register
**Errors:** 401 (invalid credentials), 403 (account banned)

---

### POST /auth/refresh 🔓
Uses httpOnly cookie automatically. No request body needed.

**Response 200:**
```json
{ "accessToken": "eyJhbGc..." }
```
**Errors:** 401 (invalid/expired/blacklisted refresh token)

---

### POST /auth/logout 🔐
**Response 200:**
```json
{ "message": "Logged out successfully" }
```
Clears cookie, blacklists refresh token.

---

### POST /auth/forgot-password 🔓
**Request Body:** `{ "email": "user@example.com" }`
**Response 200:** `{ "message": "OTP sent if account exists" }` (always 200 to prevent email enumeration)

---

### POST /auth/reset-password 🔓
**Request Body:**
```json
{ "email": "user@example.com", "otp": "123456", "newPassword": "NewPass456" }
```
**Response 200:** `{ "message": "Password updated" }`
**Errors:** 400 (invalid/expired OTP)

---

## 2. Topic Endpoints

### GET /topics 🔓
**Query Params:** `category` (optional), `sort` (debateCount|createdAt, default: debateCount), `page` (default: 1)

**Response 200:**
```json
{
  "topics": [
    {
      "_id": "64abc...",
      "title": "Universal Basic Income should be implemented globally",
      "description": "UBI proposes...",
      "category": "Politics",
      "debateCount": 142,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

### GET /topics/:id 🔓
**Response 200:** Single topic object (same fields as above)
**Errors:** 404 (not found)

---

### POST /topics 👑
**Request Body:**
```json
{
  "title": "Artificial Intelligence poses an existential threat to humanity",
  "description": "Context about the debate topic...",
  "category": "Technology"
}
```
**Response 201:** Created topic object
**Errors:** 400 (validation), 409 (duplicate title)

---

### PATCH /topics/:id 👑
**Request Body:** Any subset of: `{ "title", "description", "category", "isActive" }`
**Response 200:** Updated topic object

---

## 3. Matchmaking Endpoints

### POST /matchmaking/join 🔐
Join the queue for a topic.

**Request Body:** `{ "topicId": "64abc..." }`

**Response 200 — Added to queue (no match yet):**
```json
{
  "status": "queued",
  "topicId": "64abc...",
  "message": "Looking for an opponent..."
}
```

**Response 200 — Immediate match found:**
```json
{
  "status": "matched",
  "debateId": "64def...",
  "opponentUsername": "challenger99",
  "assignedPosition": "FOR",
  "preparationEndsAt": "2024-01-01T00:01:00Z"
}
```
**Errors:** 409 (already in queue or active debate)

---

### DELETE /matchmaking/leave 🔐
**Response 200:** `{ "message": "Left queue" }`

---

### GET /matchmaking/status 🔐
Check current queue status.

**Response 200:**
```json
{
  "inQueue": true,
  "topicId": "64abc...",
  "queuedAt": "2024-01-01T00:00:00Z",
  "playersAhead": 0
}
```

---

## 4. Debate Endpoints

### GET /debates/:id 🔓
Get full debate data (transcript or live state).

**Response 200:**
```json
{
  "_id": "64def...",
  "topicId": "64abc...",
  "topicTitle": "UBI should be implemented globally",
  "status": "in_progress",
  "participants": [
    {
      "userId": "64aaa...",
      "username": "debater42",
      "position": "FOR",
      "totalScore": 7.3,
      "isConnected": true
    },
    {
      "userId": "64bbb...",
      "username": "challenger99",
      "position": "AGAINST",
      "totalScore": 6.1,
      "isConnected": true
    }
  ],
  "rounds": [
    {
      "roundNumber": 1,
      "roundType": "opening",
      "durationSeconds": 90,
      "startedAt": "2024-01-01T00:01:00Z",
      "endedAt": "2024-01-01T00:02:30Z",
      "arguments": [
        {
          "userId": "64aaa...",
          "position": "FOR",
          "text": "UBI would eliminate poverty by...",
          "submittedAt": "2024-01-01T00:01:45Z",
          "timedOut": false,
          "score": {
            "logicalCoherence": 7.5,
            "relevance": 8.0,
            "persuasiveness": 6.5,
            "total": 7.33
          }
        }
      ]
    }
  ],
  "spectatorCount": 3,
  "verdict": null,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Errors:** 404

---

### POST /debates/:id/arguments 🔐
Submit an argument for the current round.

**Request Body:**
```json
{
  "roundNumber": 1,
  "text": "Universal Basic Income would fundamentally..."
}
```
**Validations:** min 50 chars, max 1000 chars, roundNumber must match current active round, user must not have submitted this round already, user must be a participant.

**Response 201:**
```json
{
  "message": "Argument submitted",
  "argument": {
    "position": "FOR",
    "text": "Universal Basic Income would fundamentally...",
    "submittedAt": "2024-01-01T00:01:45Z",
    "score": null
  }
}
```
Score is null until both arguments are submitted and AI processes them.

**Errors:** 400 (validation), 403 (not a participant), 409 (already submitted this round), 422 (round not active)

---

### POST /debates/:id/spectate 🔐
Register as a spectator for a live debate.

**Response 200:** `{ "message": "Joined as spectator", "spectatorCount": 4 }`

---

### POST /debates/:id/flag 🔐
Report a debate.

**Request Body:**
```json
{
  "reason": "harassment",
  "description": "Optional details..."
}
```
**Response 201:** `{ "message": "Report submitted" }`
**Errors:** 409 (already flagged by this user)

---

## 5. Search & Archive Endpoints

### GET /debates 🔓
Browse and search completed debates.

**Query Params:**
- `search` — full text search across topic title and argument text
- `topicId` — filter by topic
- `outcome` — `FOR_won | AGAINST_won | draw | forfeited`
- `dateFrom` — ISO date string
- `dateTo` — ISO date string
- `sort` — `date` (default) | `score`
- `page` — default 1, 20 results per page

**Response 200:**
```json
{
  "debates": [
    {
      "_id": "64def...",
      "topicTitle": "UBI should be implemented globally",
      "participants": [
        { "username": "debater42", "position": "FOR", "totalScore": 7.3 },
        { "username": "challenger99", "position": "AGAINST", "totalScore": 6.1 }
      ],
      "verdict": {
        "winnerUsername": "debater42",
        "decidedBy": "score"
      },
      "completedAt": "2024-01-01T00:08:00Z"
    }
  ],
  "total": 234,
  "page": 1,
  "totalPages": 12
}
```

---

## 6. Leaderboard Endpoints

### GET /leaderboard 🔓
**Query Params:** `topicId` (optional — if provided, returns topic-specific leaderboard)

**Response 200:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "64aaa...",
      "username": "debater42",
      "avatar": "https://res.cloudinary.com/...",
      "stats": {
        "debatesPlayed": 47,
        "wins": 38,
        "losses": 7,
        "draws": 2,
        "winRate": 80.85,
        "avgScore": 8.2
      }
    }
  ],
  "cachedAt": "2024-01-01T00:00:00Z",
  "nextUpdateAt": "2024-01-01T00:10:00Z"
}
```

---

## 7. User Profile Endpoints

### GET /users/:username 🔓
**Response 200:**
```json
{
  "_id": "64aaa...",
  "username": "debater42",
  "avatar": "https://res.cloudinary.com/...",
  "createdAt": "2024-01-01T00:00:00Z",
  "stats": {
    "debatesPlayed": 47,
    "wins": 38,
    "losses": 7,
    "draws": 2,
    "winRate": 80.85,
    "avgScore": 8.2
  },
  "recentDebates": [ /* last 5, same structure as /debates list items */ ]
}
```
**Errors:** 404

---

### GET /users/:username/debates 🔓
Paginated debate history for a user.
**Query Params:** `page` (default 1), `position` (FOR|AGAINST), `outcome` (won|lost|draw)
**Response 200:** Paginated list of debate summaries.

---

### PATCH /users/me 🔐
Update own profile.

**Request Body (multipart/form-data if uploading avatar, otherwise JSON):**
```json
{ "username": "newUsername" }
```
OR with avatar: form-data with `avatar` file field + optional `username` field.

**Validations:** Username cooldown (30 days since last change), avatar max 2MB jpg/png.

**Response 200:** Updated user object (without passwordHash)
**Errors:** 400 (validation), 409 (username taken), 429 (username change cooldown)

---

### DELETE /users/me 🔐
Delete own account (GDPR compliance).

**Request Body:** `{ "password": "confirm_password" }`
**Process:** Verify password, anonymize user data (username → [deleted], email → [deleted]@deleted.com, passwordHash → empty), set isActive=false.
**Response 200:** `{ "message": "Account deleted" }`

---

## 8. Admin Endpoints

### GET /admin/flags 👑
**Query Params:** `status` (pending|dismissed|actioned), `page`
**Response 200:** Paginated flag list with embedded debate summary

---

### PATCH /admin/flags/:id 👑
**Request Body:**
```json
{ "status": "actioned", "actionTaken": "User warned via email" }
```

---

### PATCH /admin/users/:id/ban 👑
**Request Body:** `{ "ban": true }` or `{ "ban": false }` (unban)

---

### GET /admin/metrics 👑
**Response 200:**
```json
{
  "totalUsers": 1204,
  "totalDebates": 8932,
  "activeUsersLast7Days": 342,
  "debatesLast30Days": [
    { "date": "2024-01-01", "count": 45 },
    { "date": "2024-01-02", "count": 52 }
  ]
}
```

---

## 9. Socket.io Events

**Connection:** Client connects to Socket.io server with auth token in handshake.
```javascript
const socket = io('https://api.debatearena.app', {
  auth: { token: accessToken }
});
```

### Events Emitted BY CLIENT

| Event | Payload | Description |
|-------|---------|-------------|
| `join_debate` | `{ debateId }` | Join a debate room as participant or spectator |
| `leave_debate` | `{ debateId }` | Leave a debate room |
| `heartbeat` | `{ debateId }` | Keep-alive every 30 seconds to prevent forfeit |

### Events Emitted BY SERVER to client

| Event | Payload | Description |
|-------|---------|-------------|
| `match_found` | `{ debateId, opponentUsername, assignedPosition, preparationEndsAt }` | Match found, prep phase starts |
| `queue_timeout` | `{ topicId }` | No match found in 3 minutes |
| `debate_started` | `{ debateId, currentRound, roundEndsAt }` | Prep over, round 1 begins |
| `argument_submitted` | `{ roundNumber, position, text, submittedAt }` | New argument posted |
| `round_scored` | `{ roundNumber, scores: { FOR: ScoreObj, AGAINST: ScoreObj } }` | AI scores returned |
| `round_ended` | `{ roundNumber, nextRound?, nextRoundStartsAt? }` | Round timer expired |
| `timer_warning` | `{ secondsLeft: 30 }` | 30 seconds remaining in round |
| `debate_concluded` | `{ verdict, finalScores, completedAt }` | Debate over, full results |
| `opponent_disconnected` | `{ reconnectWindowSeconds: 60 }` | Opponent lost connection |
| `opponent_reconnected` | `{}` | Opponent back online |
| `debate_forfeited` | `{ forfeitedUserId, winnerId }` | Forfeit declared |
| `spectator_count` | `{ count }` | Live spectator count update |
| `error` | `{ code, message }` | Server-side error |

### Score Object Structure (in `round_scored`)
```json
{
  "logicalCoherence": 7.5,
  "relevance": 8.0,
  "persuasiveness": 6.5,
  "total": 7.33
}
```

---

## 10. Standard Error Response Format

All errors follow this structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [ "Field-level error messages if applicable" ]
  }
}
```

| HTTP Status | Code | When |
|------------|------|------|
| 400 | VALIDATION_ERROR | Input fails validation |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Valid token but insufficient permissions |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Duplicate resource or state conflict |
| 422 | UNPROCESSABLE | Valid format but invalid for current state |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
