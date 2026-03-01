// Topic Model — represents a debate proposition users can argue about.
// Topics are created by admins and can be toggled active/inactive.
// The debateCount is a denormalized cache — incremented by a Debate post-save hook later.

import mongoose, { Document, Schema } from "mongoose";

export type TopicCategory =
    | "Politics"
    | "Science"
    | "Philosophy"
    | "Technology"
    | "Society"
    | "Ethics";

export interface ITopic extends Document {
    title: string;         // e.g. "Universal Basic Income should be implemented globally"
    description: string;  // Context / background for debaters
    category: TopicCategory;
    isActive: boolean;     // Inactive = hidden from matchmaking queue
    debateCount: number;   // Total completed debates on this topic (cached for fast sort)
    createdBy: mongoose.Types.ObjectId; // Admin who created it
    createdAt: Date;
    updatedAt: Date;
}

const CATEGORIES = ["Politics", "Science", "Philosophy", "Technology", "Society", "Ethics"] as const;

const TopicSchema = new Schema<ITopic>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            unique: true,
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
            minlength: [10, "Title must be at least 10 characters"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: [600, "Description cannot exceed 600 characters"],
        },
        category: {
            type: String,
            enum: CATEGORIES,
            required: [true, "Category is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        debateCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// ─── INDEXES ──────────────────────────────────────────────────────────────────
// Filter by category and visibility together (most common query pattern)
TopicSchema.index({ category: 1, isActive: 1 });
// Sort by popularity on the topics list
TopicSchema.index({ debateCount: -1 });
// Text search index — allows MongoDB full-text search on title + description
TopicSchema.index({ title: "text", description: "text" });

const Topic = mongoose.models.Topic || mongoose.model<ITopic>("Topic", TopicSchema);
export default Topic;
