import mongoose, { Schema, Document, Types } from "mongoose";

export enum DebateStatus {
    WAITING = "WAITING", // Clients received match:found, waiting for both to join debate room
    ONGOING = "ONGOING", // Both joined, debate is live
    VOTING = "VOTING",   // (Optional) spectators vote
    COMPLETED = "COMPLETED", // Finished normally
    FORFEITED = "FORFEITED" // Someone disconnected/abandoned
}

export interface IMessage {
    _id?: Types.ObjectId;
    sender: Types.ObjectId;
    side: "FOR" | "AGAINST";
    content: string;
    createdAt: Date;
    flagged?: boolean;
    aiScore?: number;
}

export interface IDebate extends Document<string> {
    _id: string; // We use the UUID from matchmaking as the document ID
    topicId: Types.ObjectId;
    participants: {
        FOR: Types.ObjectId;
        AGAINST: Types.ObjectId;
    };
    status: DebateStatus;
    currentTurn: "FOR" | "AGAINST" | null;
    turnEndsAt: Date | null;
    round: number;
    messages: IMessage[];
    winner: "FOR" | "AGAINST" | "TIE" | null;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    side: { type: String, enum: ["FOR", "AGAINST"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    flagged: { type: Boolean, default: false },
    aiScore: { type: Number }
});

const DebateSchema = new Schema<IDebate>(
    {
        _id: { type: String, required: true }, // Override default ObjectId with UUID string
        topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
        participants: {
            FOR: { type: Schema.Types.ObjectId, ref: "User", required: true },
            AGAINST: { type: Schema.Types.ObjectId, ref: "User", required: true }
        },
        status: {
            type: String,
            enum: Object.values(DebateStatus),
            default: DebateStatus.WAITING
        },
        currentTurn: { type: String, enum: ["FOR", "AGAINST", null], default: null },
        turnEndsAt: { type: Date, default: null },
        round: { type: Number, default: 1 },
        messages: [MessageSchema],
        winner: { type: String, enum: ["FOR", "AGAINST", "TIE", null], default: null }
    },
    { timestamps: true }
);

// Indexes
DebateSchema.index({ "participants.FOR": 1 });
DebateSchema.index({ "participants.AGAINST": 1 });
DebateSchema.index({ status: 1 });
DebateSchema.index({ topicId: 1 });

export const Debate = mongoose.model<IDebate>("Debate", DebateSchema);
