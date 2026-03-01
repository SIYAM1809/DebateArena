# 03 — Non-Functional Requirements Document (NFRD)

## 1. Performance

| ID | Requirement | Target | Measurement |
|----|------------|--------|-------------|
| NFR-PERF-001 | API response time (non-AI endpoints) | < 200ms p95 | Server-side timing logs |
| NFR-PERF-002 | API response time (AI scoring endpoint) | < 5 seconds p95 | Hugging Face inference latency |
| NFR-PERF-003 | Socket.io message delivery latency | < 100ms | Client-side timestamp comparison |
| NFR-PERF-004 | Page load time (First Contentful Paint) | < 2 seconds on 4G | Lighthouse score |
| NFR-PERF-005 | MongoDB query time (indexed queries) | < 50ms | MongoDB Atlas monitoring |
| NFR-PERF-006 | Leaderboard cache TTL | 10 minutes | Redis TTL config |
| NFR-PERF-007 | Max concurrent debate rooms supported | 50 simultaneous | Load test with Artillery.js (free) |

---

## 2. Scalability

| ID | Requirement | Notes |
|----|------------|-------|
| NFR-SCALE-001 | Database: MongoDB Atlas M0 free tier | 512MB storage, shared cluster. Sufficient for MVP (avg debate ~5KB) → ~100,000 debates before upgrade |
| NFR-SCALE-002 | Redis: Upstash free tier | 10,000 commands/day. Sufficient for matchmaking + token blacklist at MVP scale |
| NFR-SCALE-003 | Stateless API design | No in-memory session state; all state in MongoDB/Redis. Allows horizontal scaling later |
| NFR-SCALE-004 | Socket.io adapter | Use Redis adapter for Socket.io to support multiple server instances when needed |
| NFR-SCALE-005 | Frontend: Vercel free tier | 100GB bandwidth/month, serverless functions. Sufficient for MVP |

---

## 3. Security

| ID | Requirement | Implementation |
|----|------------|----------------|
| NFR-SEC-001 | Password storage | bcrypt with saltRounds=12, never stored in plain text |
| NFR-SEC-002 | JWT storage | Access token in memory (JS variable), refresh token in httpOnly, SameSite=Strict cookie |
| NFR-SEC-003 | JWT expiry | Access token: 15 minutes, Refresh token: 7 days |
| NFR-SEC-004 | Token blacklisting | Revoked refresh tokens stored in Redis until expiry |
| NFR-SEC-005 | Rate limiting | Express rate-limiter: 100 requests/15min per IP on auth routes, 30/min on debate submission |
| NFR-SEC-006 | Input sanitization | All user text inputs sanitized with DOMPurify (frontend) and express-validator (backend) |
| NFR-SEC-007 | XSS prevention | React's built-in escaping + CSP headers via Next.js |
| NFR-SEC-008 | CORS policy | Restrict CORS to frontend domain only |
| NFR-SEC-009 | NoSQL injection prevention | Use Mongoose ODM (parameterized queries), reject `$` and `.` in user input fields |
| NFR-SEC-010 | File upload security | Cloudinary validates file type server-side; frontend only accepts jpg/png MIME types |
| NFR-SEC-011 | Admin route protection | Middleware checks role === 'admin' on every admin endpoint |
| NFR-SEC-012 | Environment variables | All secrets in `.env`, never committed to git, use `.env.example` as template |
| NFR-SEC-013 | HTTPS only | Enforced by Vercel (frontend) and Railway (backend) automatically |

---

## 4. Reliability

| ID | Requirement | Target |
|----|------------|--------|
| NFR-REL-001 | API uptime | 99% (Railway free tier SLA) |
| NFR-REL-002 | Debate state persistence | On disconnect, debate state saved to MongoDB immediately so reconnect can resume |
| NFR-REL-003 | AI scoring fallback | If Hugging Face API times out after 10 seconds, assign neutral score (5/10) to both users and log error |
| NFR-REL-004 | Queue persistence | Redis queue survives server restart (Redis persistence enabled on Upstash) |
| NFR-REL-005 | Error boundary | Frontend uses React error boundaries so debate UI failures don't crash entire app |
| NFR-REL-006 | Graceful Socket.io reconnect | Client auto-reconnects with exponential backoff (max 5 attempts, 30-second max delay) |

---

## 5. Usability

| ID | Requirement | Notes |
|----|------------|-------|
| NFR-USE-001 | Responsive design | Fully functional on mobile (375px), tablet (768px), desktop (1440px) |
| NFR-USE-002 | Accessibility | WCAG 2.1 AA compliance — semantic HTML, ARIA labels on interactive elements, keyboard navigability |
| NFR-USE-003 | Color contrast | Minimum 4.5:1 ratio for text (WCAG AA) |
| NFR-USE-004 | Loading states | All async operations show loading indicator within 200ms |
| NFR-USE-005 | Error messages | All error states show human-readable message (no raw error codes exposed to user) |
| NFR-USE-006 | Timer visibility | Round countdown timer always visible and updates every second without page interaction |
| NFR-USE-007 | Debate character counter | Live character count shown (e.g., "423/1000") as user types argument |

---

## 6. Maintainability

| ID | Requirement | Standard |
|----|------------|---------|
| NFR-MAINT-001 | Code style | ESLint + Prettier enforced via pre-commit hooks (Husky) |
| NFR-MAINT-002 | Folder structure | Feature-based structure (not layer-based) — each feature has its own folder |
| NFR-MAINT-003 | Environment config | Single `.env` file per service, validated at startup with `dotenv-safe` |
| NFR-MAINT-004 | API versioning | All routes prefixed with `/api/v1/` |
| NFR-MAINT-005 | Logging | Winston logger on backend — structured JSON logs, log levels: error/warn/info/debug |
| NFR-MAINT-006 | Test coverage | Unit tests for all utility functions and AI scoring logic (Jest); min 60% coverage |
| NFR-MAINT-007 | Git conventions | Conventional commits format: `feat:`, `fix:`, `docs:`, `refactor:` |

---

## 7. Browser & Device Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari (iOS) | 14+ |
| Chrome for Android | 90+ |

**Socket.io** requires WebSocket support — all targets above support it.
**File System Access API** (used only optionally for export) — not required for core functionality.

---

## 8. Compliance

| ID | Requirement |
|----|------------|
| NFR-COMP-001 | GDPR basics: User can request account deletion via profile settings (hard delete of personal data) |
| NFR-COMP-002 | No tracking scripts or third-party analytics (keeps costs $0 and avoids privacy concerns) |
| NFR-COMP-003 | Public debate content: Users consent to debates being publicly indexed at registration |
| NFR-COMP-004 | Minimum age: Registration page states 13+ (COPPA baseline), no enforcement mechanism at MVP |
