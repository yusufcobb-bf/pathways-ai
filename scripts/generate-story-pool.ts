/**
 * Story Pool Generation Script
 *
 * Generates exactly 3 AI-powered stories with unique IDs and saves them
 * to the story pool directory for round-robin selection.
 *
 * Run with: npm run generate-story-pool
 *
 * Flow:
 * 1. Generate story 1, validate, ensure unique ID, save
 * 2. Generate story 2, validate, ensure unique ID, save
 * 3. Generate story 3, validate, ensure unique ID, save
 * 4. If any story fails after retries, script exits with error
 *
 * Reuses ALL validation logic from generate-story.ts:
 * - Zod schema validation
 * - Quality heuristics
 * - Content safety filters
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Import shared logic from generate-story.ts
import {
  callAI,
  saveStory,
  generatedStorySchema,
  validateGeneratedContent,
  MAX_RETRIES,
  GeneratedStory,
} from "./generate-story";

// ============================================================
// CONSTANTS
// ============================================================

const POOL_SIZE = 3;
const MAX_ID_COLLISION_RETRIES = 5;
const STORIES_DIR = path.join(__dirname, "..", "src", "data", "stories");

// ============================================================
// SINGLE STORY GENERATION WITH UNIQUE ID ENFORCEMENT
// ============================================================

/**
 * Generate a single story, ensuring its ID is not in the existingIds set.
 * Retries up to MAX_RETRIES for validation failures, and additional retries
 * for ID collisions.
 *
 * Returns the validated story, or null if all retries exhausted.
 */
async function generateSingleStory(
  anthropic: Anthropic,
  existingIds: Set<string>,
  storyNumber: number
): Promise<GeneratedStory | null> {
  let idCollisionRetries = 0;

  while (idCollisionRetries < MAX_ID_COLLISION_RETRIES) {
    // Standard retry loop for generation/validation
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`  Attempt ${attempt} of ${MAX_RETRIES}...`);

      try {
        // Step 1: Generate story via AI
        console.log("    Calling Claude API...");
        const rawJson = await callAI(anthropic);

        // Step 2: Parse JSON
        let parsedData: unknown;
        try {
          parsedData = JSON.parse(rawJson);
        } catch (parseError) {
          console.warn(`    JSON parse error: ${parseError}`);
          continue; // Retry
        }

        // Step 3: Validate with Zod schema
        let validatedStory: GeneratedStory;
        try {
          validatedStory = generatedStorySchema.parse(parsedData);
        } catch (zodError) {
          if (zodError instanceof z.ZodError) {
            console.warn("    Schema validation failed:");
            zodError.issues.forEach((e) =>
              console.warn(`      - ${e.path.join(".")}: ${e.message}`)
            );
          }
          continue; // Retry
        }

        // Step 4: Validate quality and content safety
        const validationResult = validateGeneratedContent(validatedStory);
        if (!validationResult.valid) {
          console.warn("    Content validation failed:");
          validationResult.errors.forEach((e) => console.warn(`      - ${e}`));
          continue; // Retry
        }

        // Step 5: Check for ID collision
        if (existingIds.has(validatedStory.id)) {
          console.warn(
            `    ID collision detected: "${validatedStory.id}" already exists in pool`
          );
          idCollisionRetries++;
          break; // Break inner loop, retry with collision counter
        }

        // Success!
        console.log("    All validations passed!");
        return validatedStory;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(`    Unexpected error: ${errorMsg}`);
        continue; // Retry
      }
    }

    // If we broke out of inner loop due to ID collision, continue outer loop
    if (idCollisionRetries > 0 && idCollisionRetries < MAX_ID_COLLISION_RETRIES) {
      console.log(
        `  Retrying story ${storyNumber} generation due to ID collision (${idCollisionRetries}/${MAX_ID_COLLISION_RETRIES})...`
      );
    }
  }

  // All retries exhausted
  return null;
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

async function main() {
  console.log("=== Story Pool Generation Script ===\n");
  console.log(`Generating ${POOL_SIZE} stories with unique IDs...\n`);

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: ANTHROPIC_API_KEY environment variable is not set.\n" +
        "Please set it in your .env.local file or export it in your shell."
    );
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  // Track generated story IDs to ensure uniqueness
  const generatedIds = new Set<string>();

  // Store generated stories temporarily (in case we need to roll back)
  const generatedStories: { story: GeneratedStory; path: string }[] = [];

  // ---- GENERATE POOL ----
  for (let i = 1; i <= POOL_SIZE; i++) {
    console.log(`\n--- Generating story ${i} of ${POOL_SIZE} ---`);

    const story = await generateSingleStory(anthropic, generatedIds, i);

    if (!story) {
      console.error(`\nFailed to generate story ${i} after all retries.`);
      console.error("Pool generation aborted. No files were saved.");
      process.exit(1);
    }

    // Track the ID
    generatedIds.add(story.id);

    // Queue for saving
    const outputPath = path.join(STORIES_DIR, `story-${i}.json`);
    generatedStories.push({ story, path: outputPath });

    console.log(`  Story ${i} ready: "${story.title}" (id: ${story.id})`);
  }

  // ---- SAVE ALL STORIES ----
  console.log("\n--- Saving stories to pool ---");

  for (const { story, path: outputPath } of generatedStories) {
    saveStory(story, outputPath);
    const filename = path.basename(outputPath);
    console.log(`  Saved ${filename} (id: ${story.id})`);
  }

  // ---- SUCCESS ----
  console.log("\n=== Story Pool Generation Complete ===\n");
  console.log("Generated stories:");
  for (let i = 0; i < generatedStories.length; i++) {
    const { story } = generatedStories[i];
    console.log(`  ${i + 1}. "${story.title}" (id: ${story.id})`);
  }
  console.log(`\nStories saved to: ${STORIES_DIR}`);
}

main();
