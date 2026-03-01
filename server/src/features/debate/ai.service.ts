import { config } from "../../config/env";
import { logger } from "../../utils/logger";

// Using a fast, free sentiment analysis model from Hugging Face
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";

interface HFResponse {
    label: string; // e.g., "POSITIVE" or "NEGATIVE"
    score: number; // e.g., 0.99
}

/**
 * Evaluates the "quality" or sentiment of an argument using Hugging Face Inference API.
 * Returns a score from 1 to 100.
 * Falls back gracefully to null if the API fails or rate limits.
 */
export async function evaluateArgument(content: string): Promise<number | null> {
    if (!config.huggingFaceToken) {
        logger.warn("Hugging Face token is missing; skipping AI scoring.");
        return null;
    }

    try {
        const response = await fetch(HUGGING_FACE_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.huggingFaceToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: content })
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.warn("Hugging Face API error", { status: response.status, error: errorText });
            return null;
        }

        const data = (await response.json()) as HFResponse[][];

        // HF typically returns an array of arrays for this model: [[{ label: "POSITIVE", score: 0.9 }, { label: "NEGATIVE", score: 0.1 }]]
        if (!data || !data[0] || data[0].length === 0) {
            return null;
        }

        const predictions = data[0];

        // Find the POSITIVE probability and normalize it to 1-100.
        // If it's pure negative, it gets a low score.
        let positiveScore = 0;
        const positivePrediction = predictions.find(p => p.label === "POSITIVE");

        if (positivePrediction) {
            positiveScore = positivePrediction.score;
        } else {
            // Fallback if structure is weird but 'NEGATIVE' exists
            const negativePrediction = predictions.find(p => p.label === "NEGATIVE");
            if (negativePrediction) {
                positiveScore = 1 - negativePrediction.score;
            }
        }

        // Convert [0, 1] to [1, 100] integer
        const finalScore = Math.max(1, Math.min(100, Math.round(positiveScore * 100)));
        return finalScore;

    } catch (error) {
        logger.error("Failed to evaluate argument via Hugging Face", { error: (error as Error).message });
        return null;
    }
}
