// App-wide constants — single source of truth for values used in multiple places.
// Import from here instead of hardcoding numbers throughout the codebase.

// Debate round time limits (in seconds), as specified in FR-DEBATE-001
export const ROUND_DURATIONS = {
    preparation: 60,  // 60s to read topic and think
    round1: 90,       // Opening argument
    round2: 120,      // Rebuttal
    round3: 60,       // Closing statement
} as const;

// Argument length limits, as specified in FR-DEBATE-002
export const ARGUMENT_LENGTH = {
    min: 50,
    max: 1000,
} as const;

// Matchmaking queue timeout (in seconds), as specified in FR-MATCH-004
export const QUEUE_TIMEOUT_SECONDS = 180; // 3 minutes

// Reconnect window after disconnect before forfeit (in seconds), FR-DEBATE-007
export const RECONNECT_WINDOW_SECONDS = 60;

// Debate topic categories, as specified in FR-TOPIC-002
export const TOPIC_CATEGORIES = [
    "Politics",
    "Science",
    "Philosophy",
    "Technology",
    "Society",
    "Ethics",
] as const;

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

export interface Topic {
    _id: string;
    title: string;
    description: string;
    category: TopicCategory;
    isActive: boolean;
    debateCount: number;
}

export enum DebateStatus {
    WAITING = "WAITING",
    ONGOING = "ONGOING",
    VOTING = "VOTING",
    COMPLETED = "COMPLETED",
    FORFEITED = "FORFEITED"
}

export interface IMessage {
    _id?: string;
    sender: {
        _id: string;
        username: string;
    };
    side: "FOR" | "AGAINST";
    content: string;
    createdAt: string;
    flagged?: boolean;
    aiScore?: number;
}

export interface IDebate {
    _id: string;
    topicId: Topic; // Populated
    participants: {
        FOR: { _id: string; username: string; rating: number };
        AGAINST: { _id: string; username: string; rating: number };
    };
    status: DebateStatus;
    currentTurn: "FOR" | "AGAINST" | null;
    turnEndsAt: string | null; // ISO string from backend
    round: number;
    messages: IMessage[];
    winner: "FOR" | "AGAINST" | "TIE" | null;
    createdAt: string;
}

// Leaderboard page size
export const LEADERBOARD_SIZE = 100;

// Archive pagination
export const ARCHIVE_PAGE_SIZE = 20;

// Profile debate history pagination
export const HISTORY_PAGE_SIZE = 10;
