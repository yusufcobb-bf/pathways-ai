/**
 * Story Generation Script
 *
 * This script generates an AI-powered story using the Claude API.
 * Run with: npm run generate-story
 *
 * Requires ANTHROPIC_API_KEY environment variable to be set.
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import { z } from "zod";

// Import the prompt and schema directly (not using path aliases)
const STORY_GENERATION_SYSTEM_PROMPT = `You are a story generator for an educational app designed to help students reflect on their choices and behaviors. Generate a short, age-appropriate story for upper elementary and middle school students (ages 10-14).

The story should present realistic social situations where students face meaningful choices about how to interact with others. The situations should be relatable to school-age children and involve themes like:
- Inclusion and belonging
- Friendship and kindness
- Honesty and integrity
- Helping others
- Standing up for what's right

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure (no markdown, no explanation, just JSON):
{
  "id": "unique-story-id-using-kebab-case",
  "title": "Story Title (3-6 words)",
  "intro": "Opening narrative that sets up the situation (2-3 paragraphs, written in second person 'you')",
  "checkpoints": [
    {
      "id": "c1",
      "prompt": "First decision point - describe the situation (1-2 paragraphs)",
      "choices": [
        { "id": "c1-a", "text": "First choice option (the most helpful/kind action)" },
        { "id": "c1-b", "text": "Second choice option (a moderate response)" },
        { "id": "c1-c", "text": "Third choice option (the least engaged response)" }
      ]
    },
    {
      "id": "c2",
      "prompt": "Second decision point - a new situation builds on the story",
      "choices": [
        { "id": "c2-a", "text": "First choice option" },
        { "id": "c2-b", "text": "Second choice option" }
      ]
    },
    {
      "id": "c3",
      "prompt": "Third decision point - the culminating moment",
      "choices": [
        { "id": "c3-a", "text": "First choice option" },
        { "id": "c3-b", "text": "Second choice option" },
        { "id": "c3-c", "text": "Third choice option" }
      ]
    }
  ],
  "ending": "Concluding narrative that wraps up the story without judging choices (1-2 paragraphs)"
}

STRICT RULES:
1. Exactly 3 checkpoints (c1, c2, c3)
2. Each checkpoint has 2-3 choices
3. Choice IDs MUST follow pattern: c1-a, c1-b, c1-c, c2-a, c2-b, etc.
4. First choice (a) should represent the most empathetic/courageous action
5. Last choice should represent a more passive or disengaged response
6. Content must be age-appropriate for 10-14 year olds
7. Write in second person ("you walk into...", "you notice...")
8. NO moral judgments or lectures in the narrative
9. NO virtue labels, scores, or educational terminology
10. NO feedback on which choices are "right" or "wrong"
11. NO violence, bullying descriptions, or mature themes
12. Keep language simple and accessible
13. Story should feel natural, not preachy
14. Ending should be reflective without being judgmental

Generate a unique, engaging story that feels different from typical school scenarios. Be creative with settings and situations while keeping them relatable.`;

// Inline schema for the script (to avoid module resolution issues)
const choiceSchema = z.object({
  id: z
    .string()
    .regex(/^c[1-3]-[abc]$/, "Choice ID must follow pattern: c1-a, c2-b, etc."),
  text: z.string().min(10, "Choice text must be at least 10 characters"),
});

const checkpointSchema = z.object({
  id: z.string().regex(/^c[1-3]$/, "Checkpoint ID must be c1, c2, or c3"),
  prompt: z.string().min(50, "Checkpoint prompt must be at least 50 characters"),
  choices: z
    .array(choiceSchema)
    .min(2, "Each checkpoint must have at least 2 choices")
    .max(3, "Each checkpoint must have at most 3 choices"),
});

const generatedStorySchema = z.object({
  id: z.string().min(1, "Story must have an ID"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  intro: z.string().min(100, "Intro must be at least 100 characters"),
  checkpoints: z
    .array(checkpointSchema)
    .length(3, "Story must have exactly 3 checkpoints"),
  ending: z.string().min(50, "Ending must be at least 50 characters"),
});

type GeneratedStory = z.infer<typeof generatedStorySchema>;

async function generateStory(): Promise<GeneratedStory> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set.\n" +
        "Please set it in your .env.local file or export it in your shell."
    );
  }

  console.log("Initializing Anthropic client...");
  const anthropic = new Anthropic({ apiKey });

  console.log("Generating story with Claude...");
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: STORY_GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content:
          "Generate a new interactive story for students. Remember to return ONLY valid JSON with no additional text or formatting.",
      },
    ],
  });

  // Extract the text content from the response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in API response");
  }

  const rawJson = textContent.text.trim();
  console.log("Received response, parsing JSON...");

  // Parse the JSON
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(rawJson);
  } catch (parseError) {
    console.error("Failed to parse JSON response:");
    console.error(rawJson.substring(0, 500) + "...");
    throw new Error(`Invalid JSON in API response: ${parseError}`);
  }

  // Validate against schema
  console.log("Validating story structure...");
  const validated = generatedStorySchema.parse(parsedData);

  console.log("Story validated successfully!");
  return validated;
}

async function main() {
  console.log("=== Story Generation Script ===\n");

  try {
    const story = await generateStory();

    // Determine output path
    const outputPath = path.join(
      __dirname,
      "..",
      "src",
      "data",
      "generated-story.json"
    );

    // Write to file
    console.log(`\nWriting story to ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify(story, null, 2), "utf-8");

    console.log("\n=== Story Generated Successfully ===");
    console.log(`Title: ${story.title}`);
    console.log(`ID: ${story.id}`);
    console.log(`Checkpoints: ${story.checkpoints.length}`);
    console.log(
      `Choices: ${story.checkpoints.map((c) => c.choices.length).join(", ")}`
    );
    console.log(`\nStory saved to: ${outputPath}`);
  } catch (error) {
    console.error("\n=== Story Generation Failed ===");
    if (error instanceof z.ZodError) {
      console.error("Validation errors:");
      error.issues.forEach((e) => {
        console.error(`  - ${e.path.join(".")}: ${e.message}`);
      });
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main();
