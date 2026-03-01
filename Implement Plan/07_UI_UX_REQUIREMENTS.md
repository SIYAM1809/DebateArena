# 07 — UI/UX Requirements Document

## 1. Design System

### Color Palette
```css
/* Primary */
--color-primary: #6366F1;        /* Indigo — main actions, buttons */
--color-primary-hover: #4F46E5;
--color-primary-light: #EEF2FF;

/* Positions */
--color-for: #10B981;            /* Green — FOR position */
--color-for-light: #ECFDF5;
--color-against: #EF4444;        /* Red — AGAINST position */
--color-against-light: #FEF2F2;

/* Neutrals */
--color-bg: #0F172A;             /* Dark navy background */
--color-surface: #1E293B;        /* Card surfaces */
--color-surface-hover: #334155;
--color-border: #334155;
--color-text-primary: #F1F5F9;
--color-text-secondary: #94A3B8;
--color-text-muted: #64748B;

/* Status */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;

/* Scoring — gradient from low to high */
--score-low: #EF4444;            /* 0–4 */
--score-mid: #F59E0B;            /* 4–7 */
--score-high: #10B981;           /* 7–10 */
```

### Typography
```css
Font: 'Inter' (Google Fonts — free)
Monospace: 'JetBrains Mono' (code, scores, timers)

--text-xs: 12px
--text-sm: 14px
--text-base: 16px
--text-lg: 18px
--text-xl: 20px
--text-2xl: 24px
--text-3xl: 30px
--text-4xl: 36px
```

### Spacing Scale (Tailwind standard)
Use Tailwind CSS utility classes throughout.

---

## 2. Page Specifications

---

### PAGE: Home / Landing (`/`)
**Rendering:** Static (Next.js SSG)

**Sections (top to bottom):**
1. **Hero:** Bold headline "Argue better. Think sharper." + subheadline + two CTAs: "Start Debating" (→ /topics) and "Browse Debates" (→ /debates)
2. **Live Activity Strip:** Horizontal scrolling banner showing recent debates (topic + outcome) — fetched client-side, non-blocking
3. **How It Works:** 3-step graphic: Pick Topic → Get Matched → AI Judges
4. **Featured Topics:** Grid of 6 popular topics (debateCount > 50)
5. **Leaderboard Snapshot:** Top 5 users
6. **Footer:** Links, GitHub repo link

**Components:** Navbar, HeroSection, ActivityStrip, HowItWorksSteps, TopicGrid, LeaderboardSnippet, Footer

---

### PAGE: Topics Browser (`/topics`)
**Rendering:** ISR (revalidate: 60 seconds)

**Layout:** 
- Left sidebar: category filter buttons (All, Politics, Science, Philosophy, Technology, Society, Ethics)
- Main area: grid of TopicCard components (2 columns desktop, 1 column mobile)
- Sort dropdown: "Most Debated" | "Newest"

**TopicCard contains:**
- Topic title (max 2 lines, truncate)
- Category badge (colored by category)
- Debate count ("142 debates")
- "Join Queue" button (disabled + tooltip if user not logged in)

**State:**
- Selected category stored in URL param (`?category=Technology`) for sharability
- Loading skeleton shown during client navigation

---

### PAGE: Debate Room (`/debate/[id]`)
**Rendering:** Client-side only (dynamic, real-time)
**Auth:** Required (redirect to /login if not authenticated)

**Layout — Two-column split (desktop), single column (mobile):**

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPIC BANNER: "Universal Basic Income should be implemented..." │
│  Status: Round 1 of 3 — Opening Arguments    🔴 LIVE  👁 3      │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────────────┐  ┌──────────────────────────────────┐
│ FOR SIDE (Green header)  │  │ AGAINST SIDE (Red header)        │
│ Username: debater42      │  │ Username: challenger99           │
│ Score: 7.3               │  │ Score: 6.1                       │
│                          │  │                                  │
│ Round 1 Argument:        │  │ Round 1 Argument:                │
│ "UBI would eliminate..." │  │ Waiting for argument...          │
│                          │  │                                  │
│ AI Score: 7.3/10         │  │ AI Score: —                      │
│ Logic: 7.5               │  │                                  │
│ Relevance: 8.0           │  │                                  │
│ Persuasion: 6.5          │  │                                  │
└──────────────────────────┘  └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ YOUR ARGUMENT INPUT (only shown to active participant)           │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Type your opening argument...                           │    │
│ └─────────────────────────────────────────────────────────┘    │
│ 423/1000 characters    ⏱ 1:23 remaining    [Submit Argument]   │
└─────────────────────────────────────────────────────────────────┘
```

**Preparation Phase (60 seconds):**
- Both columns show topic description
- Large countdown timer: "Debate begins in 0:45"
- Your assigned position shown prominently (FOR badge or AGAINST badge)

**During Rounds:**
- Countdown timer ticks every second
- Timer turns amber at 30 seconds, red at 10 seconds
- If opponent submitted: their argument appears in their column immediately
- Submit button disabled after submission

**After Round (AI Scoring):**
- Brief "AI is scoring arguments..." loading state (spinner, max 10 seconds)
- Scores animate in with number counter effect

**Verdict Screen (overlay modal, not new page):**
- Winner announced with confetti animation (winner) or neutral (loser)
- Full score breakdown per round
- CTAs: "View Full Transcript" | "Debate Again" | "Share"

**Spectator Differences:**
- Input area replaced with: "You are watching this debate"
- Spectator count shown
- All content visible in real-time

---

### PAGE: Debate Transcript (`/debate/[id]/transcript`)
**Rendering:** SSR (full content for Google indexing)

**Layout:**
- Debate header: topic, date, participants, outcome
- Round-by-round display (accordion or flat list)
  - Each round: type label + both arguments side by side + AI scores
- Verdict summary at bottom
- Share button (copies URL)
- "Challenge to a debate on this topic" CTA

**Open Graph Tags (for social sharing):**
```html
<meta property="og:title" content="debater42 (FOR) vs challenger99 (AGAINST) — UBI should be implemented globally" />
<meta property="og:description" content="FOR wins 7.3–6.1 across 3 rounds" />
```

---

### PAGE: Matchmaking Queue (`/queue/[topicId]`)
**Rendering:** Client-side only

**States:**
1. **Queued:** Animated pulsing circle + "Looking for an opponent..." text + estimated wait time + "Leave Queue" button
2. **Matched:** Success animation + opponent username + your position (FOR/AGAINST badge) + "Entering debate room in 3..." countdown auto-redirect

---

### PAGE: Leaderboard (`/leaderboard`)
**Rendering:** SSR (revalidate: 10 minutes)

**Layout:**
- Topic filter dropdown at top ("Global" selected by default)
- Table: Rank | Avatar | Username | Debates | Win Rate | Avg Score
- Top 3 highlighted with gold/silver/bronze styling
- Pagination (100 users, 20 per page)

---

### PAGE: User Profile (`/profile/[username]`)
**Rendering:** SSR

**Sections:**
1. **Profile Header:** Avatar, username, join date, FOR/AGAINST win rates
2. **Stats Row:** Debates | Wins | Losses | Draws | Avg Score
3. **Recent Debates List:** Last 10, with outcome badges
4. **Edit button** (only visible to profile owner)

---

### PAGE: Auth Pages (`/login`, `/register`)
**Rendering:** Static

**Login Form Fields:** Email, Password, "Remember me" checkbox
**Register Form Fields:** Username, Email, Password, Password Confirm

**Validation:** Client-side (react-hook-form + zod) with real-time feedback
**Post-login redirect:** Return to originally requested page (stored in URL param)

---

### PAGE: Admin Dashboard (`/admin`)
**Rendering:** Client-side (protected by role check)

**Tabs:**
1. **Metrics:** Charts — debates/day (last 30 days line chart), active users, totals
2. **Topics:** Table with create/edit/archive actions
3. **Flags:** Table of pending reports with action buttons (Dismiss / Warn User / Ban User)

---

## 3. Component Specifications

### CountdownTimer
- Props: `endsAt: Date`, `onWarning: () => void` (fires at 30s), `onExpiry: () => void`
- Display: `MM:SS` format using JetBrains Mono font
- Color: normal → amber at 30s → red at 10s (CSS transition)
- Updates via `setInterval(1000)`, cleared on unmount

### ScoreDisplay
- Props: `scores: { logicalCoherence, relevance, persuasiveness, total } | null`
- If null: show three gray dashes
- If scoring in progress: show spinner
- If scored: show animated number count-up from 0 to final value (0.5s animation)
- Color: red (<4), amber (4–7), green (>7)

### ArgumentPanel
- Props: `position: 'FOR'|'AGAINST'`, `username: string`, `argument: string | null`, `score`, `isCurrentUser: boolean`
- Header color: green for FOR, red for AGAINST
- If argument is null: "Waiting for argument..." placeholder with subtle pulse animation
- If isCurrentUser: add "(You)" suffix to username

### QueueStatus
- Shows position in queue (if available), time waiting, animated searching indicator
- Accessible: ARIA live region announces status changes to screen readers

---

## 4. User Flows

### Flow 1: New User Debate (Happy Path)
```
Landing page
  → Click "Start Debating"
  → Register page (form submit)
  → Topics page (auto-redirected after register)
  → Click "Join Queue" on a topic
  → Queue page (waiting state)
  → Match found (matched state, auto-redirect after 3s)
  → Debate room (preparation phase)
  → Debate room (round 1: submit argument)
  → Debate room (round 2: submit rebuttal)
  → Debate room (round 3: submit closing)
  → Verdict modal
  → Click "View Full Transcript" → Transcript page
```

### Flow 2: Anonymous Visitor Browsing
```
Landing page
  → Click "Browse Debates"
  → Debates search page (filter by topic)
  → Click a debate → Transcript page (SEO-indexed, no auth needed)
  → Click "Challenge someone on this topic" → Login redirect → Queue
```

### Flow 3: Returning User with Forfeit
```
Debate room (opponent disconnects)
  → "Opponent disconnected. They have 60 seconds to reconnect."
  → Timer counts down
  → If no reconnect: "You win by forfeit" verdict auto-shown
  → Stats updated
```

---

## 5. Mobile Responsiveness

Debate room on mobile (< 768px): Stacked vertically instead of side-by-side. Both argument panels shown, input area at bottom with fixed positioning. Timer shown in sticky header.

All touch targets minimum 44×44px per WCAG guidelines.
