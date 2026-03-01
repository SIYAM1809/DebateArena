// TypeScript interfaces for debate-related data.
// These mirror the Debate MongoDB schema from 05_DATA_MODELS.md.

export type DebatePosition = "FOR" | "AGAINST";
export type DebateStatus =
    | "preparation"
    | "round_active"
    | "scoring"
    | "completed"
    | "forfeited";
export type DebateOutcome = "FOR_won" | "AGAINST_won" | "draw" | "forfeited";

export interface RoundScore {
    logicalCoherence: number;
    relevance: number;
    persuasiveness: number;
    total: number;
}

export interface Argument {
    userId: string;
    username: string;
    position: DebatePosition;
    text: string;
    submittedAt: string;
    isTimedOut: boolean;
    scores?: RoundScore;
}

export interface Round {
    roundNumber: 1 | 2 | 3;
    forArgument?: Argument;
    againstArgument?: Argument;
    forScore?: number;
    againstScore?: number;
    startedAt?: string;
    endedAt?: string;
}

export interface DebateParticipant {
    userId: string;
    username: string;
    position: DebatePosition;
    totalScore: number;
    isConnected: boolean;
}

export interface Debate {
    _id: string;
    topicId: string;
    topicTitle: string;
    topicDescription: string;
    participants: [DebateParticipant, DebateParticipant];
    status: DebateStatus;
    currentRound: 1 | 2 | 3;
    rounds: Round[];
    outcome?: DebateOutcome;
    winnerId?: string;
    spectatorCount: number;
    createdAt: string;
    completedAt?: string;
}

// ─── SOCKET.IO EVENT PAYLOADS ─────────────────────────────────────────────────
// These are the shapes of data that come through Socket.io events.

export interface MatchFoundPayload {
    debateId: string;
    opponentUsername: string;
    position: DebatePosition;
    prepEndTime: string; // ISO date
}

export interface ArgumentSubmittedPayload {
    roundNumber: number;
    position: DebatePosition;
    argumentText: string;
    timestamp: string;
}

export interface RoundScoredPayload {
    roundNumber: number;
    forScore: number;
    againstScore: number;
    breakdown: {
        for: RoundScore;
        against: RoundScore;
    };
}

export interface DebateConcludedPayload {
    outcome: DebateOutcome;
    winnerId?: string;
    winnerUsername?: string;
    finalScores: {
        for: number;
        against: number;
    };
}

// ─── DEBATE ROOM STATE MACHINE ────────────────────────────────────────────────
// States the DebateRoom UI can be in (drives what's rendered)

export type DebatePhase =
    | "idle"
    | "preparation"
    | "round_active"
    | "scoring"
    | "round_complete"
    | "verdict";
