# DebateArena

A real-time, AI-judged debate platform where users are matched with opponents to argue structured positions on selected topics.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | Node.js + Express.js + TypeScript |
| Database | MongoDB Atlas (free M0) |
| Real-time | Socket.io |
| AI Judge | Hugging Face Inference API |
| Auth | JWT + bcrypt (self-built) |
| Cache/Queue | Upstash Redis |
| Hosting | Vercel (frontend) + Railway (backend) |
| Media | Cloudinary |

## Local Setup

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Clone and install
```bash
git clone https://github.com/your-username/debatearena.git
cd debatearena
npm install  # installs all workspaces
```

### 2. Configure environment variables
```bash
cp .env.example server/.env
cp .env.example client/.env.local
# Fill in the values in both files
```

### 3. Run development servers
```bash
# Terminal 1 — Frontend (http://localhost:3000)
npm run dev:client

# Terminal 2 — Backend (http://localhost:8080)
npm run dev:server
```

## Project Structure
```
debatearena/
├── client/    # Next.js 14 frontend
├── server/    # Express.js + Socket.io backend
└── package.json  # npm workspaces root
```

## Cost: $0
All services used (MongoDB Atlas M0, Upstash Redis, Hugging Face, Cloudinary, Vercel, Railway) have permanently free tiers.
