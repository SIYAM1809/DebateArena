// User Model — the core identity object in DebateArena.
//
// HOW MONGOOSE WORKS (quick primer):
// Mongoose is an "ODM" (Object Document Mapper) for MongoDB.
// You define a "Schema" (the shape of the document), then create a "Model"
// from that schema. The model gives you methods like User.create(), User.findOne(),
// User.findById() etc. MongoDB stores documents as BSON (binary JSON) and
// Mongoose translates between that and JavaScript objects.
//
// WHY define a schema if MongoDB is "schemaless"?
// MongoDB itself doesn't enforce structure — you could save ANY shape of data.
// The Mongoose schema adds validation, type coercion, default values, and
// pre-save hooks on the application side, so bugs are caught before they
// reach the database.

import mongoose, { Document, Schema } from "mongoose";

// ─── TYPESCRIPT INTERFACE ─────────────────────────────────────────────────────
// This interface describes the shape of a User document in TypeScript.
// "Document" from Mongoose adds the MongoDB methods (_id, save(), etc.)

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string; // bcrypt hash — NEVER store plain-text passwords
    role: "user" | "admin";
    avatar: string | null; // Cloudinary URL
    isActive: boolean; // false = banned, cannot log in
    usernameChangedAt: Date | null; // tracks 30-day cooldown on username changes

    stats: {
        debatesPlayed: number;
        wins: number;
        losses: number;
        draws: number;
        forfeits: number; // debates this user abandoned
        totalScore: number; // cumulative AI score across all debates
        avgScore: number; // computed: totalScore / debatesPlayed
    };

    createdAt: Date; // auto-set by { timestamps: true }
    updatedAt: Date; // auto-set by { timestamps: true }
}

// ─── MONGOOSE SCHEMA ──────────────────────────────────────────────────────────
// Each field in the schema gets:
//   type        → what data type MongoDB should store
//   required    → throw validation error if missing
//   unique      → creates a unique index in MongoDB (enforced at DB level)
//   trim        → strips leading/trailing whitespace before saving
//   match       → regex validation
//   default     → value used if field is not provided

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true, // Creates a MongoDB unique index automatically
            trim: true,
            minlength: [3, "Username must be at least 3 characters"],
            maxlength: [20, "Username cannot exceed 20 characters"],
            // Only alphanumeric + underscore — no spaces or special chars
            match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true, // Always store email in lowercase (makes lookup consistent)
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },

        // We NEVER store the actual password — only the bcrypt hash.
        // Even if someone steals the database, they can't recover the password.
        passwordHash: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ["user", "admin"], // Only these two values are valid
            default: "user",
        },

        avatar: {
            type: String,
            default: null, // null means no avatar set yet
        },

        isActive: {
            type: Boolean,
            default: true, // Accounts start active; admins set to false to ban
        },

        usernameChangedAt: {
            type: Date,
            default: null,
        },

        // Nested "stats" object — stored as a single embedded sub-document.
        // This is better than a separate collection because we always read
        // stats with the user (no JOIN / populate needed).
        stats: {
            debatesPlayed: { type: Number, default: 0, min: 0 },
            wins: { type: Number, default: 0, min: 0 },
            losses: { type: Number, default: 0, min: 0 },
            draws: { type: Number, default: 0, min: 0 },
            forfeits: { type: Number, default: 0, min: 0 },
            totalScore: { type: Number, default: 0, min: 0 },
            // avgScore is computed in the pre-save hook below — never set directly
            avgScore: { type: Number, default: 0, min: 0 },
        },
    },
    {
        // { timestamps: true } tells Mongoose to automatically:
        // - add "createdAt" field (set once at document creation)
        // - add "updatedAt" field (updated every time the document is saved)
        timestamps: true,
    }
);

// ─── INDEXES ──────────────────────────────────────────────────────────────────
// Indexes make queries fast. Without an index, MongoDB scans EVERY document
// to find matches (called a "collection scan"). With an index, it uses a
// B-tree structure to find matches instantly.
//
// username and email already have indexes from { unique: true } above.
// We add these additional ones for leaderboard sorting:

UserSchema.index({ "stats.avgScore": -1 }); // -1 = descending (highest first)
UserSchema.index({ "stats.wins": -1 }); // For sorting leaderboard by wins
UserSchema.index({ role: 1, isActive: 1 }); // For admin queries

// ─── PRE-SAVE HOOK — Auto-compute avgScore ────────────────────────────────────
// A "pre-save hook" is middleware that runs BEFORE every .save() call.
// Here we automatically recompute avgScore whenever stats change.
// This way you never have to manually calculate it — the model does it for you.
//
// "this" refers to the user document being saved.

UserSchema.pre("save", async function () {
    // Only recalculate if the stats field was actually modified
    // (avoids unnecessary computation on unrelated saves)
    if (this.isModified("stats")) {
        if (this.stats.debatesPlayed > 0) {
            // Round to 2 decimal places using Math.round trick
            this.stats.avgScore =
                Math.round((this.stats.totalScore / this.stats.debatesPlayed) * 100) / 100;
        } else {
            this.stats.avgScore = 0; // No debates played yet
        }
    }
});

// ─── VIRTUAL: winRate ─────────────────────────────────────────────────────────
// A "virtual" is a computed property that is NOT stored in MongoDB —
// it's calculated on the fly when you access it on the document.
// Used in the leaderboard to show win percentage.

UserSchema.virtual("winRate").get(function () {
    if (this.stats.debatesPlayed === 0) return 0;
    return Math.round((this.stats.wins / this.stats.debatesPlayed) * 1000) / 10; // e.g. 73.5
});

// ─── MODEL EXPORT ─────────────────────────────────────────────────────────────
// mongoose.model() creates the Model class if it doesn't already exist,
// or returns the existing one. The 'User' string maps to the 'users' collection
// in MongoDB (Mongoose auto-pluralizes and lowercases it).

// This guard prevents "Cannot overwrite `User` model once compiled" error
// in development when nodemon hot-reloads the file.
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
