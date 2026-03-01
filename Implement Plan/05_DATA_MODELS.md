# 05 — Data Models (MongoDB Schemas)

All schemas written in Mongoose. TypeScript interfaces included.

---

## 1. User Model

**Collection:** `users`

```typescript
// types/user.ts
interface IUser {
  _id: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  avatar?: string;            // Cloudinary URL
  isActive: boolean;          // false = banned
  usernameChangedAt?: Date;   // For 30-day cooldown enforcement

  stats: {
    debatesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    forfeits: number;         // debates forfeited by this user
    totalScore: number;       // sum of all AI scores received
    avgScore: number;         // totalScore / debatesPlayed (computed field)
  };

  createdAt: Date;
  updatedAt: Date;
}
```

```javascript
// models/User.ts
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  usernameChangedAt: { type: Date, default: null },
  stats: {
    debatesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    forfeits: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'stats.avgScore': -1 });   // Leaderboard sort
UserSchema.index({ 'stats.wins': -1 });        // Leaderboard sort
```

---

## 2. Topic Model

**Collection:** `topics`

```typescript
interface ITopic {
  _id: ObjectId;
  title: string;              // The debate proposition e.g. "Universal Basic Income should be implemented globally"
  description: string;        // Context and background for the topic
  category: TopicCategory;
  isActive: boolean;
  debateCount: number;        // Total debates on this topic (cached counter)
  createdBy: ObjectId;        // Admin user who created it
  createdAt: Date;
  updatedAt: Date;
}

type TopicCategory =
  | 'Politics'
  | 'Science'
  | 'Philosophy'
  | 'Technology'
  | 'Society'
  | 'Ethics';
```

```javascript
// models/Topic.ts
const TopicSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['Politics', 'Science', 'Philosophy', 'Technology', 'Society', 'Ethics'],
    required: true
  },
  isActive: { type: Boolean, default: true },
  debateCount: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

TopicSchema.index({ category: 1, isActive: 1 });
TopicSchema.index({ debateCount: -1 });
```

---

## 3. Debate Model

**Collection:** `debates`

This is the core model. Stores the entire debate lifecycle.

```typescript
interface IArgument {
  userId: ObjectId;
  position: 'FOR' | 'AGAINST';
  text: string;               // Empty string if user timed out
  submittedAt: Date;
  timedOut: boolean;
  score: {
    logicalCoherence: number; // 0–10
    relevance: number;        // 0–10
    persuasiveness: number;   // 0–10
    total: number;            // average of three (0–10)
  } | null;                   // null until AI scores it
}

interface IDebateRound {
  roundNumber: 1 | 2 | 3;
  roundType: 'opening' | 'rebuttal' | 'closing';
  durationSeconds: number;
  startedAt: Date;
  endedAt?: Date;
  arguments: IArgument[];     // Always max 2 (one per participant)
}

interface IParticipant {
  userId: ObjectId;
  username: string;           // Denormalized for quick display without joins
  position: 'FOR' | 'AGAINST';
  totalScore: number;         // Sum of all round scores (computed at debate end)
  isConnected: boolean;       // Live connection status
  disconnectedAt?: Date;
}

interface IDebate {
  _id: ObjectId;
  topicId: ObjectId;
  topicTitle: string;         // Denormalized for archive display
  status: DebateStatus;
  participants: IParticipant[];
  rounds: IDebateRound[];
  spectatorCount: number;
  verdict?: {
    winnerId: ObjectId | null; // null = draw
    winnerUsername: string | null;
    forTotalScore: number;
    againstTotalScore: number;
    decidedBy: 'score' | 'forfeit' | 'draw';
  };
  flags: ObjectId[];           // References to Flag documents
  createdAt: Date;
  completedAt?: Date;
}

type DebateStatus =
  | 'preparation'   // Matched, 60-sec prep phase
  | 'in_progress'   // Rounds are active
  | 'scoring'       // AI scoring final round
  | 'completed'     // Verdict declared
  | 'forfeited'     // One user abandoned
  | 'cancelled';    // Both users disconnected before debate started
```

```javascript
// models/Debate.ts
const ArgumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  position: { type: String, enum: ['FOR', 'AGAINST'], required: true },
  text: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  timedOut: { type: Boolean, default: false },
  score: {
    logicalCoherence: Number,
    relevance: Number,
    persuasiveness: Number,
    total: Number
  }
}, { _id: false });

const RoundSchema = new Schema({
  roundNumber: { type: Number, enum: [1, 2, 3], required: true },
  roundType: { type: String, enum: ['opening', 'rebuttal', 'closing'], required: true },
  durationSeconds: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  endedAt: Date,
  arguments: [ArgumentSchema]
}, { _id: false });

const ParticipantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  position: { type: String, enum: ['FOR', 'AGAINST'], required: true },
  totalScore: { type: Number, default: 0 },
  isConnected: { type: Boolean, default: true },
  disconnectedAt: Date
}, { _id: false });

const DebateSchema = new Schema({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  topicTitle: { type: String, required: true },
  status: {
    type: String,
    enum: ['preparation', 'in_progress', 'scoring', 'completed', 'forfeited', 'cancelled'],
    default: 'preparation'
  },
  participants: [ParticipantSchema],
  rounds: [RoundSchema],
  spectatorCount: { type: Number, default: 0 },
  verdict: {
    winnerId: Schema.Types.ObjectId,
    winnerUsername: String,
    forTotalScore: Number,
    againstTotalScore: Number,
    decidedBy: { type: String, enum: ['score', 'forfeit', 'draw'] }
  },
  flags: [{ type: Schema.Types.ObjectId, ref: 'Flag' }],
  completedAt: Date
}, { timestamps: true });

// Indexes
DebateSchema.index({ topicId: 1, status: 1 });
DebateSchema.index({ 'participants.userId': 1 });
DebateSchema.index({ status: 1, createdAt: -1 });
DebateSchema.index({ topicTitle: 'text' });    // MongoDB text index for search

// After debate completes, increment topic.debateCount
DebateSchema.post('save', async function(doc) {
  if (doc.status === 'completed' && doc.isModified('status')) {
    await Topic.findByIdAndUpdate(doc.topicId, { $inc: { debateCount: 1 } });
  }
});
```

---

## 4. Flag Model

**Collection:** `flags`

```typescript
interface IFlag {
  _id: ObjectId;
  debateId: ObjectId;
  reportedBy: ObjectId;       // userId who filed the report
  reason: FlagReason;
  description?: string;       // Optional detail from reporter
  status: 'pending' | 'dismissed' | 'actioned';
  actionTaken?: string;       // Admin note on what was done
  reviewedBy?: ObjectId;      // Admin userId
  createdAt: Date;
}

type FlagReason =
  | 'harassment'
  | 'hate_speech'
  | 'spam'
  | 'off_topic'
  | 'other';
```

```javascript
// models/Flag.ts
const FlagSchema = new Schema({
  debateId: { type: Schema.Types.ObjectId, ref: 'Debate', required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: {
    type: String,
    enum: ['harassment', 'hate_speech', 'spam', 'off_topic', 'other'],
    required: true
  },
  description: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending', 'dismissed', 'actioned'], default: 'pending' },
  actionTaken: String,
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

FlagSchema.index({ status: 1, createdAt: -1 });
```

---

## 5. Redis Key Schemas

All Redis keys used in the system with their data type and TTL:

| Key Pattern | Type | TTL | Purpose |
|------------|------|-----|---------|
| `queue:topic:{topicId}` | Sorted Set | None (managed manually) | Matchmaking queue per topic (score = timestamp) |
| `debate:room:{debateId}:timer` | String (seconds remaining) | Round duration | Active round countdown |
| `debate:room:{debateId}:state` | Hash | 4 hours | Active debate state cache |
| `token:blacklist:{jti}` | String ("1") | JWT remaining lifetime | Revoked refresh tokens |
| `otp:{email}` | String (6-digit code) | 10 minutes | Password reset OTPs |
| `leaderboard:global` | String (JSON) | 10 minutes | Cached leaderboard |
| `leaderboard:topic:{topicId}` | String (JSON) | 10 minutes | Per-topic leaderboard cache |
| `rate:auth:{ip}` | Counter | 15 minutes | Auth endpoint rate limiting |
| `user:queue:{userId}` | String (topicId) | 3 minutes | Track which queue a user is in |
