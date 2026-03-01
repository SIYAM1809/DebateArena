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

## Running Tests
```bash
cd server
npm test          # run all tests once
npm run test:coverage   # run with coverage report
```

## Deployment

### Backend → Railway

1. Create a new Railway project and connect your GitHub repo.
2. Set **Root Directory** to `server/`.
3. Railway will auto-detect `nixpacks.toml` and run `npm install && npm run build`, then `node dist/index.js`.
4. Add the following environment variables in the Railway dashboard:

| Variable | Description |
|----------|-------------|
| `PORT` | Set to `8080` (Railway exposes this automatically) |
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Upstash Redis REST URL |
| `JWT_ACCESS_SECRET` | Random 64-char secret |
| `JWT_REFRESH_SECRET` | Random 64-char secret (different from access) |
| `CLIENT_URL` | Your Vercel frontend URL (e.g. `https://debatearena.vercel.app`) |
| `HUGGINGFACE_API_KEY` | Hugging Face API key for AI scoring |

---

### Frontend → Vercel

1. Create a new Vercel project and connect your GitHub repo.
2. Set **Root Directory** to `client/`.
3. Vercel auto-detects Next.js and uses `npm run build`.
4. Add the following environment variables in the Vercel dashboard:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Railway backend URL + `/api/v1` (e.g. `https://your-app.up.railway.app/api/v1`) |
| `NEXT_PUBLIC_SOCKET_URL` | Railway backend root URL (e.g. `https://your-app.up.railway.app`) |
