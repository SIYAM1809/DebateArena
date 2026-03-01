# DebateArena — Project Overview

## Document Index

| File | Purpose |
|------|---------|
| `00_PROJECT_OVERVIEW.md` | This file. Master reference. |
| `01_USER_REQUIREMENTS.md` | Who uses the system and what they need |
| `02_FUNCTIONAL_REQUIREMENTS.md` | What the system must do (features, logic) |
| `03_NON_FUNCTIONAL_REQUIREMENTS.md` | Performance, security, scalability constraints |
| `04_SYSTEM_ARCHITECTURE.md` | Tech stack, folder structure, component map |
| `05_DATA_MODELS.md` | MongoDB schemas with field-level detail |
| `06_API_SPECIFICATION.md` | All REST endpoints + Socket.io events |
| `07_UI_UX_REQUIREMENTS.md` | All pages, components, and user flows |
| `08_TASK_BREAKDOWN.md` | Sprint-ready, LLM-executable task list |

---

## Project Summary

**DebateArena** is a real-time, AI-judged debate platform where users are matched with opponents to argue structured positions on selected topics. An AI judge scores each argument on logic, evidence quality, and persuasion. Debates are public and indexed, creating a searchable knowledge base of structured human arguments.

## Core Value Proposition

- Structured debate with rules and time limits (no Twitter-style chaos)
- AI judgment on argument quality — not popularity votes
- Public debate archive indexed for SEO
- Zero cost to run using only free tiers

## Stack Decision

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router) | SSR for SEO on public debate pages |
| Backend API | Node.js + Express.js | REST + Socket.io on same server |
| Database | MongoDB Atlas (free M0) | Flexible schema for debates/arguments |
| Real-time | Socket.io | Bidirectional events for live rounds |
| AI Judge | Hugging Face Inference API (free) | Zero-shot classification for argument scoring |
| Auth | JWT + bcrypt (self-built) | No third-party auth cost |
| Cache/Queue | Upstash Redis (free tier) | Matchmaking queue, rate limiting |
| Hosting | Vercel (free) + Railway (free) | Frontend + backend separately |
| Media | Cloudinary (free 25GB) | Avatar uploads |

## Cost: $0

Every service used has a permanently free tier. No credit card required for initial deployment.

## Target Launch Scope (MVP)

- User registration and profiles
- Topic selection and matchmaking
- Live debate room (2 participants + spectators)
- AI scoring after each round
- Public debate archive
- User leaderboard

---

## Constraints

- No paid APIs
- No self-hosted servers (use free cloud tiers)
- Must be deployable by a solo developer
- Mobile-responsive but not a native mobile app
