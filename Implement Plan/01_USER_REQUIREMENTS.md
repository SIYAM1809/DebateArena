# 01 — User Requirements Document (URD)

## 1. Stakeholders

| Stakeholder | Role | Interest |
|-------------|------|----------|
| Debater | Primary user | Participate in debates, improve argumentative skills |
| Spectator | Secondary user | Watch live debates, read archived debates |
| Leaderboard Visitor | Anonymous | Browse top debaters, trending topics |
| Admin | System operator | Moderate content, manage topics |

---

## 2. User Personas

### Persona A — The Competitive Student
- **Name:** Arjun, 21, undergraduate
- **Goal:** Sharpen debate skills for university competitions
- **Pain Point:** No structured platform to practice with strangers; Discord debates have no rules or accountability
- **Needs:** Quick matchmaking, clear rules, objective feedback on argument quality

### Persona B — The Critical Thinker
- **Name:** Sarah, 29, journalist
- **Goal:** Stress-test her arguments before publishing opinion pieces
- **Pain Point:** Existing platforms reward emotion over logic; no way to get structured pushback
- **Needs:** Topic variety, AI scoring based on logic (not votes), ability to share debate transcripts

### Persona C — The Passive Learner
- **Name:** Rahim, 35, engineer
- **Goal:** Learn how strong arguments are structured by reading debates
- **Pain Point:** Reddit threads and YouTube comment sections are noise with no signal
- **Needs:** Searchable, readable debate archive; spectator mode for live debates

### Persona D — The Admin/Moderator
- **Name:** System operator
- **Goal:** Keep platform healthy and free of abuse
- **Needs:** Topic management, user flagging, debate transcript review

---

## 3. User Stories

### Authentication

| ID | User Story | Priority |
|----|-----------|----------|
| US-001 | As a new user, I want to register with email and password so I can access the platform | Must |
| US-002 | As a returning user, I want to log in securely so I can access my profile and history | Must |
| US-003 | As a user, I want to log out from any device so my account stays secure | Must |
| US-004 | As a user, I want to reset my password via email so I can recover my account | Should |
| US-005 | As a user, I want to update my username and avatar so my profile reflects my identity | Should |

### Matchmaking

| ID | User Story | Priority |
|----|-----------|----------|
| US-010 | As a debater, I want to browse available debate topics so I can pick one that interests me | Must |
| US-011 | As a debater, I want to be automatically matched with an opponent after joining a topic queue so I don't have to manually find someone | Must |
| US-012 | As a debater, I want to know my assigned position (FOR or AGAINST) before the debate starts so I can prepare | Must |
| US-013 | As a debater, I want a 60-second preparation phase before arguments begin so I'm not caught off-guard | Should |
| US-014 | As a debater, I want to see my opponent's username and win record before accepting a match so I have context | Could |
| US-015 | As a debater, I want to cancel my queue request at any time so I'm not locked in | Must |

### Live Debate

| ID | User Story | Priority |
|----|-----------|----------|
| US-020 | As a debater, I want to submit text arguments within a time limit so debates stay structured | Must |
| US-021 | As a debater, I want to see a countdown timer so I know how much time I have per round | Must |
| US-022 | As a debater, I want to see my opponent's argument appear in real-time as they submit it | Must |
| US-023 | As a debater, I want to receive an AI score for each of my arguments after I submit it | Must |
| US-024 | As a debater, I want to see which round we are in (Round 1 of 3) so I can pace my arguments | Must |
| US-025 | As a debater, I want a final verdict at the end of the debate showing who won and why | Must |
| US-026 | As a spectator, I want to watch a live debate in read-only mode so I can learn from it | Should |
| US-027 | As a spectator, I want to see the AI scores update live as arguments are submitted | Should |
| US-028 | As a debater, I want to flag inappropriate content during a debate so abuse can be reported | Should |

### Archive & Discovery

| ID | User Story | Priority |
|----|-----------|----------|
| US-030 | As any user, I want to search past debates by topic keyword so I can find relevant discussions | Must |
| US-031 | As any user, I want to view a full debate transcript after it ends so I can read the arguments | Must |
| US-032 | As any user, I want to share a debate link so others can read it | Must |
| US-033 | As any user, I want to browse debates filtered by topic, date, or outcome | Should |
| US-034 | As any user, I want to see a leaderboard of top-rated debaters | Should |

### Profile & Stats

| ID | User Story | Priority |
|----|-----------|----------|
| US-040 | As a debater, I want to see my win/loss record so I can track my progress | Must |
| US-041 | As a debater, I want to see my average AI argument score over time | Should |
| US-042 | As a debater, I want to see a list of all debates I've participated in | Should |
| US-043 | As a debater, I want to see which topics I perform best in | Could |

### Admin

| ID | User Story | Priority |
|----|-----------|----------|
| US-050 | As an admin, I want to create, edit, and archive debate topics | Must |
| US-051 | As an admin, I want to view flagged debates and take action (warn/ban) | Must |
| US-052 | As an admin, I want to see platform usage metrics (debates per day, active users) | Should |

---

## 4. Acceptance Criteria Summary

Every Must-priority user story must pass before MVP is considered complete. Should and Could stories are targeted for post-MVP iterations.

| Priority | Count | Target |
|----------|-------|--------|
| Must | 19 | MVP Release |
| Should | 14 | Version 1.1 |
| Could | 3 | Version 1.2+ |
