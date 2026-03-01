# 04 — System Architecture Document

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Next.js 14 (App Router)  ─── Vercel (free hosting)           │
│   React Components, SSR pages, Static pages                    │
└───────────────────┬───────────────────┬─────────────────────────┘
                    │ HTTP/REST          │ WebSocket
                    ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER                                  │
│   Node.js + Express.js ─── Railway (free hosting)               │
│   REST API (/api/v1/*)  +  Socket.io server                     │
└──────┬──────────────┬──────────────────┬────────────────────────┘
       │              │                  │
       ▼              ▼                  ▼
┌──────────┐  ┌──────────────┐  ┌────────────────────┐
│ MongoDB  │  │ Upstash Redis│  │ Hugging Face API   │
│ Atlas M0 │  │ (free tier)  │  │ (free inference)   │
│ (free)   │  │ Queue+Cache  │  │ AI scoring         │
└──────────┘  └──────────────┘  └────────────────────┘
                                         │
                              ┌──────────────────────┐
                              │ Cloudinary (free 25GB)│
                              │ Avatar storage        │
                              └──────────────────────┘
```

---

## 2. Repository Structure

Use a **monorepo** with two packages managed by npm workspaces.

```
debatearena/
├── package.json                    # Root workspace config
├── .env.example                    # Template for all env vars
├── .gitignore
├── README.md
│
├── client/                         # Next.js frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── app/                    # Next.js App Router
│       │   ├── layout.tsx          # Root layout (fonts, providers)
│       │   ├── page.tsx            # Home/landing page
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── topics/
│       │   │   └── page.tsx        # Browse topics (SSG)
│       │   ├── debate/
│       │   │   ├── [id]/page.tsx   # Debate room (CSR)
│       │   │   └── [id]/transcript/page.tsx  # Archived debate (SSR)
│       │   ├── profile/
│       │   │   └── [username]/page.tsx  # Public profile (SSR)
│       │   ├── leaderboard/
│       │   │   └── page.tsx        # Leaderboard (SSR)
│       │   └── admin/
│       │       └── page.tsx        # Admin dashboard (CSR, protected)
│       │
│       ├── components/
│       │   ├── ui/                 # Generic reusable components
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Avatar.tsx
│       │   │   ├── Badge.tsx
│       │   │   └── Spinner.tsx
│       │   ├── debate/             # Debate-specific components
│       │   │   ├── ArgumentPanel.tsx
│       │   │   ├── CountdownTimer.tsx
│       │   │   ├── ScoreDisplay.tsx
│       │   │   ├── RoundIndicator.tsx
│       │   │   ├── DebateRoom.tsx
│       │   │   ├── SpectatorBanner.tsx
│       │   │   └── VerdictCard.tsx
│       │   ├── matchmaking/
│       │   │   ├── TopicCard.tsx
│       │   │   ├── QueueStatus.tsx
│       │   │   └── MatchFoundModal.tsx
│       │   ├── profile/
│       │   │   ├── StatsCard.tsx
│       │   │   └── DebateHistoryList.tsx
│       │   └── layout/
│       │       ├── Navbar.tsx
│       │       └── Footer.tsx
│       │
│       ├── hooks/
│       │   ├── useSocket.ts        # Socket.io connection management
│       │   ├── useAuth.ts          # Auth state and token management
│       │   ├── useDebate.ts        # Live debate state machine
│       │   ├── useQueue.ts         # Matchmaking queue state
│       │   └── useCountdown.ts     # Timer logic
│       │
│       ├── store/
│       │   └── authStore.ts        # Zustand store for auth state
│       │
│       ├── lib/
│       │   ├── api.ts              # Axios instance with interceptors
│       │   ├── socket.ts           # Socket.io client singleton
│       │   └── constants.ts        # App-wide constants
│       │
│       └── types/
│           ├── debate.ts           # TypeScript interfaces
│           ├── user.ts
│           └── api.ts
│
└── server/                         # Node.js + Express backend
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts                # Entry point, server startup
        ├── app.ts                  # Express app setup, middleware
        ├── socket.ts               # Socket.io server setup
        │
        ├── config/
        │   ├── database.ts         # MongoDB connection
        │   ├── redis.ts            # Upstash Redis connection
        │   └── env.ts              # Env var validation
        │
        ├── features/
        │   ├── auth/
        │   │   ├── auth.routes.ts
        │   │   ├── auth.controller.ts
        │   │   ├── auth.service.ts
        │   │   └── auth.middleware.ts
        │   ├── topics/
        │   │   ├── topic.routes.ts
        │   │   ├── topic.controller.ts
        │   │   └── topic.service.ts
        │   ├── matchmaking/
        │   │   ├── matchmaking.routes.ts
        │   │   ├── matchmaking.controller.ts
        │   │   ├── matchmaking.service.ts
        │   │   └── matchmaking.socket.ts  # Socket event handlers
        │   ├── debate/
        │   │   ├── debate.routes.ts
        │   │   ├── debate.controller.ts
        │   │   ├── debate.service.ts
        │   │   ├── debate.socket.ts
        │   │   └── debate.timer.ts        # Round timer logic
        │   ├── ai/
        │   │   ├── scoring.service.ts     # Hugging Face integration
        │   │   └── scoring.utils.ts       # Score normalization
        │   ├── users/
        │   │   ├── user.routes.ts
        │   │   ├── user.controller.ts
        │   │   └── user.service.ts
        │   ├── leaderboard/
        │   │   ├── leaderboard.routes.ts
        │   │   └── leaderboard.service.ts
        │   └── admin/
        │       ├── admin.routes.ts
        │       ├── admin.controller.ts
        │       └── admin.middleware.ts
        │
        ├── models/
        │   ├── User.ts
        │   ├── Topic.ts
        │   ├── Debate.ts
        │   └── Flag.ts
        │
        └── utils/
            ├── logger.ts           # Winston logger
            ├── errors.ts           # Custom error classes
            ├── validate.ts         # express-validator chains
            └── rateLimiter.ts      # express-rate-limit configs
```

---

## 3. Key Technical Decisions

### 3.1 Why Next.js App Router for Frontend
- Debate transcript pages (`/debate/:id/transcript`) use SSR so they're crawled by Google with full content
- Topic listing pages use Static Site Generation (revalidate every 60 seconds)
- Debate room (`/debate/:id`) is fully client-side — no SSR needed for real-time UI
- Profile pages use SSR for social sharing (Open Graph meta tags)

### 3.2 Why Separate Express Server (Not Next.js API Routes)
- Socket.io requires a persistent WebSocket connection — Next.js serverless functions on Vercel don't support this
- Express + Railway gives a long-running server where Socket.io can maintain connections
- Separation of concerns keeps frontend deployment independent of backend changes

### 3.3 State Management
- **Server state:** React Query (`@tanstack/react-query`) — all API data, caching, refetching
- **Client/UI state:** Zustand — auth state, debate room state
- **Real-time state:** Local React state updated via Socket.io events in `useDebate` hook

### 3.4 AI Scoring Pipeline

```
Both arguments submitted
        │
        ▼
scoring.service.ts builds prompt:
  "Classify the quality of this argument as:
   [highly logical, somewhat logical, not logical]"
        │
        ▼
POST https://api-inference.huggingface.co/models/facebook/bart-large-mnli
  Headers: Authorization: Bearer {HF_TOKEN}
  Body: { inputs: argumentText, candidate_labels: [...] }
        │
        ▼
Parse confidence scores → normalize to 0–10
        │
        ▼
Store in debate document, emit round_scored event
```

### 3.5 Matchmaking Algorithm

```
User joins queue for Topic X
        │
        ▼
ZADD topic:{topicId}:queue {timestamp} {userId}  (Redis)
        │
        ▼
Check ZCARD topic:{topicId}:queue >= 2?
        │
  YES ──┤
        ▼
ZPOPMIN topic:{topicId}:queue 2  (atomic pop)
        │
        ▼
Create Debate document, assign positions randomly
Emit match_found to both users' socket rooms
        │
  NO ───┤
        ▼
Set 3-min expiry check via Bull job
If still unmatched after 3 min → emit queue_timeout
```

---

## 4. Environment Variables

### client/.env.local
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
```

### server/.env
```
# Server
PORT=8080
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/debatearena

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# JWT
JWT_ACCESS_SECRET=your_64_char_random_string
JWT_REFRESH_SECRET=your_other_64_char_random_string

# Hugging Face
HUGGING_FACE_TOKEN=hf_xxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Email (Gmail SMTP)
EMAIL_USER=youremail@gmail.com
EMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx

# Frontend URL (for CORS)
CLIENT_URL=https://your-app.vercel.app
```

---

## 5. Deployment Pipeline

```
Developer pushes to main branch
        │
        ├──► Vercel auto-deploys client/ (Next.js)
        │
        └──► Railway auto-deploys server/ (Node.js)
                    │
                    └── Both connected to same MongoDB Atlas cluster
```

No CI/CD configuration required — Vercel and Railway detect changes automatically on push to main.
