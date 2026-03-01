// Seed script — populates the database with sample debate topics.
// Run with: npx ts-node src/scripts/seed-topics.ts
//
// Safe to re-run: will skip topics that already exist (unique title index).

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import Topic from "../models/Topic";

const topics = [
    // ── Technology ──────────────────────────────────────────────────────────
    {
        title: "Artificial Intelligence will replace most human jobs within 20 years",
        description: "Advances in AI and automation are rapidly changing the job market. Will AI create more jobs than it destroys, or lead to mass unemployment?",
        category: "Technology",
        difficulty: "intermediate",
    },
    {
        title: "Social media does more harm than good to society",
        description: "Social media connects billions yet drives polarisation, mental health crises, and misinformation. On balance, is it a net negative?",
        category: "Technology",
        difficulty: "beginner",
    },
    {
        title: "Governments should regulate AI development",
        description: "Should global governments impose strict regulations on AI research and deployment, or would regulation stifle innovation?",
        category: "Technology",
        difficulty: "advanced",
    },
    {
        title: "Cryptocurrency will replace traditional currency",
        description: "Digital currencies like Bitcoin promise decentralisation and freedom. Will they displace fiat currency, or remain niche?",
        category: "Technology",
        difficulty: "intermediate",
    },

    // ── Politics ────────────────────────────────────────────────────────────
    {
        title: "Democracy is the best system of government",
        description: "Winston Churchill called democracy 'the worst form of government, except for all the others'. Is this still true in 2024?",
        category: "Politics",
        difficulty: "advanced",
    },
    {
        title: "Universal Basic Income should be implemented globally",
        description: "Should every adult citizen receive a regular government payment regardless of employment status?",
        category: "Politics",
        difficulty: "intermediate",
    },
    {
        title: "Voting should be mandatory for all citizens",
        description: "Some countries already mandate voting. Is compulsory voting good for democracy or does it infringe individual freedom?",
        category: "Politics",
        difficulty: "beginner",
    },

    // ── Philosophy ──────────────────────────────────────────────────────────
    {
        title: "Free will is an illusion",
        description: "If our decisions are determined by physics and prior causes, do we truly have free will, or is the feeling of choice a cognitive trick?",
        category: "Philosophy",
        difficulty: "advanced",
    },
    {
        title: "The ends justify the means",
        description: "Is it morally acceptable to do something wrong if the outcome produces a greater good? Explore utilitarian vs. deontological ethics.",
        category: "Philosophy",
        difficulty: "intermediate",
    },
    {
        title: "Animals have the same moral rights as humans",
        description: "If animals feel pain and have interests, should they have legal rights equivalent to humans?",
        category: "Philosophy",
        difficulty: "beginner",
    },

    // ── Science ─────────────────────────────────────────────────────────────
    {
        title: "Space colonisation should be humanity's top priority",
        description: "Elon Musk argues we must become multi-planetary to survive. Should space colonisation take precedence over solving Earth's problems?",
        category: "Science",
        difficulty: "intermediate",
    },
    {
        title: "Nuclear energy is essential for a sustainable future",
        description: "Nuclear power produces no carbon emissions and is highly reliable. Should it be central to global clean energy strategy?",
        category: "Science",
        difficulty: "intermediate",
    },
    {
        title: "Gene editing in humans should be permitted for disease prevention",
        description: "CRISPR technology can eliminate hereditary diseases. Should parents be allowed to edit their children's genomes before birth?",
        category: "Science",
        difficulty: "advanced",
    },

    // ── Society ─────────────────────────────────────────────────────────────
    {
        title: "Celebrity culture has a negative impact on society",
        description: "Celebrities wield enormous influence over values, politics, and body image. Is this influence on balance harmful to society?",
        category: "Society",
        difficulty: "beginner",
    },
    {
        title: "Higher education should be free for all",
        description: "Should universities be publicly funded, or does charging tuition fees make higher education more accountable and sustainable?",
        category: "Society",
        difficulty: "beginner",
    },
    {
        title: "Affirmative action policies do more harm than good",
        description: "Do diversity quotas in hiring and university admissions help historically disadvantaged groups, or create new forms of discrimination?",
        category: "Society",
        difficulty: "advanced",
    },

    // ── Ethics ──────────────────────────────────────────────────────────────
    {
        title: "Capital punishment is morally justifiable",
        description: "Is it ever right for the state to take a human life as punishment? Arguments on justice, deterrence and human rights.",
        category: "Ethics",
        difficulty: "advanced",
    },
    {
        title: "Euthanasia should be legal worldwide",
        description: "Is the right to a dignified death a fundamental human right? Should assisted dying be legal for terminally ill patients?",
        category: "Ethics",
        difficulty: "advanced",
    },
    {
        title: "Eating meat is ethically wrong",
        description: "Given that animal farming causes suffering and environmental damage, is choosing to eat meat an ethical choice in 2024?",
        category: "Ethics",
        difficulty: "beginner",
    },
];

async function seed() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("❌  MONGODB_URI not set. Check your .env file.");
        process.exit(1);
    }

    console.log("🌱  Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅  Connected");

    // Find any existing admin or user to use as createdBy
    const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
        role: String,
    }));
    const adminUser = await User.findOne({ role: "admin" }) || await User.findOne();
    // Use their _id if found, otherwise create a dummy ObjectId (seed data only)
    const createdBy = adminUser?._id ?? new mongoose.Types.ObjectId();

    if (adminUser) {
        console.log(`👤  Using user "${(adminUser as { username?: string }).username ?? adminUser._id}" as topic creator`);
    } else {
        console.log("⚠️  No users found — using placeholder ObjectId for createdBy (seed data only)");
    }

    let created = 0;
    let skipped = 0;

    for (const t of topics) {
        const exists = await Topic.findOne({ title: t.title });
        if (exists) {
            skipped++;
            continue;
        }
        await Topic.create({ ...t, isActive: true, createdBy });
        created++;
        console.log(`  ✓ Created: "${t.title}"`);
    }

    console.log(`\n🎉  Done! Created ${created} topics, skipped ${skipped} duplicates.`);
    await mongoose.disconnect();
    process.exit(0);
}


seed().catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
});
