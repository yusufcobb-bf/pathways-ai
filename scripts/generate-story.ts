/**
 * Story Generation Script with Validation & Retry Loop
 *
 * This script generates an AI-powered story using the Claude API,
 * validates it for quality and safety, and retries on failure.
 *
 * Run with: npm run generate-story
 *
 * Flow:
 * 1. Generate story via Claude API
 * 2. Validate JSON structure (Zod schema)
 * 3. Validate quality (intro length, unique situations, distinct choices)
 * 4. Validate content safety (no forbidden terms)
 * 5. If any validation fails, retry (up to MAX_RETRIES)
 * 6. On success, save with metadata
 * 7. On total failure, throw error (runtime fallback handles it)
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

// ============================================================
// CONSTANTS
// ============================================================

export const MAX_RETRIES = 3;
export const MODEL = "claude-sonnet-4-20250514";
export const GENERATION_VERSION = "1.0.0";

// ============================================================
// SYSTEM PROMPT
// ============================================================

const STORY_GENERATION_SYSTEM_PROMPT = `You are a story generator for an interactive app. Generate a short story for students ages 10-14.

SETTING REQUIREMENTS:
- Use a concrete, specific setting: a school classroom, cafeteria, playground, neighborhood park, community center, or local event
- Include 2-3 named characters with realistic, diverse names (e.g., Marcus, Priya, Sofia, James, Mei)
- Do NOT use stereotypical character descriptions or roles

NARRATIVE REQUIREMENTS:
- Write in second person ("you notice...", "you hear...")
- Create natural tension or uncertainty in the situation — something unresolved or unclear
- Describe what characters do and say; do not describe their feelings or intentions
- Keep language simple, direct, and age-appropriate
- Tone must be calm, neutral, and descriptive throughout

CHOICE REQUIREMENTS:
- Each choice must describe a distinct action the reader could take
- Choices must NOT be paraphrases of each other
- Choices must NOT suggest which option is better or worse
- Order choices from most active/direct action to most passive/indirect action
- All choices should feel reasonable — no obviously "bad" options

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure. No markdown, no explanation, no text before or after the JSON:

{
  "id": "unique-story-id-in-kebab-case",
  "title": "Story Title (3-6 words)",
  "intro": "Opening narrative (2-3 paragraphs)",
  "checkpoints": [
    {
      "id": "c1",
      "prompt": "First decision point (1-2 paragraphs)",
      "choices": [
        { "id": "c1-a", "text": "First choice - most direct action" },
        { "id": "c1-b", "text": "Second choice - moderate action" },
        { "id": "c1-c", "text": "Third choice - most passive action" }
      ]
    },
    {
      "id": "c2",
      "prompt": "Second decision point (1-2 paragraphs)",
      "choices": [
        { "id": "c2-a", "text": "First choice" },
        { "id": "c2-b", "text": "Second choice" }
      ]
    },
    {
      "id": "c3",
      "prompt": "Third decision point (1-2 paragraphs)",
      "choices": [
        { "id": "c3-a", "text": "First choice" },
        { "id": "c3-b", "text": "Second choice" },
        { "id": "c3-c", "text": "Third choice" }
      ]
    }
  ],
  "ending": "Concluding narrative (1-2 paragraphs)"
}

STRICT RULES:
1. Exactly 3 checkpoints with IDs: c1, c2, c3
2. Choice IDs MUST follow pattern: c1-a, c1-b, c1-c, c2-a, c2-b, etc.
3. Checkpoint 1 and 3 have exactly 3 choices; checkpoint 2 has exactly 2 choices

FORBIDDEN — Do NOT include any of these:
- Words: right, wrong, good, bad, best, worst, correct, incorrect
- Words: empathy, courage, respect, responsibility, kindness, honesty, integrity
- Words: selfish, mean, rude, lazy, cowardly
- Phrases: "the right thing", "the wrong thing", "should have", "ought to"
- Any praise, criticism, or judgment of choices
- Any feedback, evaluation, or moral commentary
- Violence, bullying descriptions, or mature themes
- Preachy or lecturing tone

The ending must simply describe what happens next — no reflection, no lessons, no judgment.`;

// ============================================================
// ZOD SCHEMA (with passthrough for _meta)
// ============================================================

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

export const generatedStorySchema = z
  .object({
    id: z.string().min(1, "Story must have an ID"),
    title: z.string().min(5, "Title must be at least 5 characters"),
    intro: z.string().min(100, "Intro must be at least 100 characters"),
    checkpoints: z
      .array(checkpointSchema)
      .length(3, "Story must have exactly 3 checkpoints"),
    ending: z.string().min(50, "Ending must be at least 50 characters"),
  })
  .passthrough(); // Allow _meta and other fields

export type GeneratedStory = z.infer<typeof generatedStorySchema>;

// ============================================================
// INLINED: STORY QUALITY VALIDATION
// (Copied from src/lib/ai/story-quality.ts for CLI script compatibility)
// ============================================================

const QUALITY_FORBIDDEN_WORDS = [
  "right",
  "wrong",
  "should",
  "better choice",
  "best choice",
  "worst",
  "correct",
  "incorrect",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  const normalized = normalizeText(text);
  if (normalized.length === 0) return 0;
  return normalized.split(" ").length;
}

function getSentences(text: string): string[] {
  const raw = text.split(/[.!?]+/).map((s) => normalizeText(s));
  return raw.filter((s) => s.length > 0);
}

function getWordSet(text: string): Set<string> {
  const normalized = normalizeText(text);
  if (normalized.length === 0) return new Set();
  return new Set(normalized.split(" "));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

function validateStoryQuality(story: GeneratedStory): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check 1: Intro word count (80-300)
  const introWordCount = countWords(story.intro);
  if (introWordCount < 80) {
    errors.push(`Intro too short: ${introWordCount} words (minimum 80)`);
  }
  if (introWordCount > 300) {
    errors.push(`Intro too long: ${introWordCount} words (maximum 300)`);
  }

  // Check 2: Exactly 3 checkpoints
  if (story.checkpoints.length !== 3) {
    errors.push(
      `Invalid checkpoint count: ${story.checkpoints.length} (must be exactly 3)`
    );
  }

  // Check 3: Checkpoints introduce NEW situations (not too similar)
  const CHECKPOINT_SIMILARITY_THRESHOLD = 0.6;
  for (let i = 0; i < story.checkpoints.length; i++) {
    for (let j = i + 1; j < story.checkpoints.length; j++) {
      const setA = getWordSet(story.checkpoints[i].prompt);
      const setB = getWordSet(story.checkpoints[j].prompt);
      const similarity = jaccardSimilarity(setA, setB);
      if (similarity > CHECKPOINT_SIMILARITY_THRESHOLD) {
        errors.push(
          `Checkpoints ${story.checkpoints[i].id} and ${story.checkpoints[j].id} are too similar (${(similarity * 100).toFixed(0)}% overlap)`
        );
      }
    }
  }

  // Check 4: Choices within checkpoint are not paraphrases
  const CHOICE_SIMILARITY_THRESHOLD = 0.5;
  for (const checkpoint of story.checkpoints) {
    const choices = checkpoint.choices;
    for (let i = 0; i < choices.length; i++) {
      for (let j = i + 1; j < choices.length; j++) {
        const setA = getWordSet(choices[i].text);
        const setB = getWordSet(choices[j].text);
        const similarity = jaccardSimilarity(setA, setB);
        if (similarity > CHOICE_SIMILARITY_THRESHOLD) {
          errors.push(
            `Choices ${choices[i].id} and ${choices[j].id} appear to be paraphrases (${(similarity * 100).toFixed(0)}% similar)`
          );
        }
      }
    }
  }

  // Check 5: No repeated sentences across story
  const allSentences: { sentence: string; source: string }[] = [];
  for (const sentence of getSentences(story.intro)) {
    allSentences.push({ sentence, source: "intro" });
  }
  for (const checkpoint of story.checkpoints) {
    for (const sentence of getSentences(checkpoint.prompt)) {
      allSentences.push({ sentence, source: `checkpoint ${checkpoint.id}` });
    }
  }
  for (const sentence of getSentences(story.ending)) {
    allSentences.push({ sentence, source: "ending" });
  }
  const seenSentences = new Map<string, string>();
  for (const { sentence, source } of allSentences) {
    if (sentence.length < 10) continue;
    if (seenSentences.has(sentence)) {
      errors.push(
        `Repeated sentence found in ${seenSentences.get(sentence)} and ${source}: "${sentence.substring(0, 50)}..."`
      );
    } else {
      seenSentences.set(sentence, source);
    }
  }

  // Check 6: No forbidden quality words
  const textsToCheck = [
    { text: story.intro, source: "intro" },
    { text: story.ending, source: "ending" },
    ...story.checkpoints.map((cp) => ({
      text: cp.prompt,
      source: `checkpoint ${cp.id}`,
    })),
    ...story.checkpoints.flatMap((cp) =>
      cp.choices.map((choice) => ({
        text: choice.text,
        source: `choice ${choice.id}`,
      }))
    ),
  ];
  for (const { text, source } of textsToCheck) {
    for (const forbidden of QUALITY_FORBIDDEN_WORDS) {
      if (forbidden.includes(" ")) {
        if (text.toLowerCase().includes(forbidden)) {
          errors.push(`Forbidden phrase "${forbidden}" found in ${source}`);
        }
      } else {
        const regex = new RegExp(`\\b${forbidden}\\b`, "i");
        if (regex.test(text)) {
          errors.push(`Forbidden word "${forbidden}" found in ${source}`);
        }
      }
    }
  }

  // Check 7: Minimum choice length (5 words)
  const MIN_CHOICE_WORDS = 5;
  for (const checkpoint of story.checkpoints) {
    for (const choice of checkpoint.choices) {
      const wordCount = countWords(choice.text);
      if (wordCount < MIN_CHOICE_WORDS) {
        errors.push(
          `Choice ${choice.id} has only ${wordCount} words (minimum ${MIN_CHOICE_WORDS})`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// INLINED: CONTENT SAFETY FILTERS
// (Copied from src/lib/ai/content-filters.ts for CLI script compatibility)
// ============================================================

const VIOLENCE_TERMS = [
  "fight", "hit", "punch", "kick", "hurt", "attack", "weapon", "gun", "knife",
  "blood", "kill", "dead", "death", "murder", "beat", "slap", "stab", "shoot",
  "strangle", "choke",
];

const TRAUMA_TERMS = [
  "abuse", "neglect", "abandon", "suicide", "self-harm", "cutting", "overdose",
  "trauma", "ptsd",
];

const ADULT_TERMS = [
  "drugs", "alcohol", "drunk", "beer", "wine", "cigarette", "smoking", "vape",
  "sex", "sexual", "naked", "dating", "weed", "marijuana", "cocaine", "heroin",
];

const DIAGNOSIS_TERMS = [
  "adhd", "autism", "bipolar", "depression", "anxiety disorder", "ocd",
  "mentally ill", "crazy", "insane", "psycho", "schizophrenia", "anorexia",
  "bulimia",
];

const CONTENT_FORBIDDEN_TERMS: { term: string; category: string }[] = [
  ...VIOLENCE_TERMS.map((term) => ({ term, category: "violence" })),
  ...TRAUMA_TERMS.map((term) => ({ term, category: "trauma" })),
  ...ADULT_TERMS.map((term) => ({ term, category: "adult content" })),
  ...DIAGNOSIS_TERMS.map((term) => ({ term, category: "diagnosis language" })),
];

function isPhrase(term: string): boolean {
  return term.includes(" ") || term.includes("-");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkContentSafety(text: string): string[] {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();

  for (const { term, category } of CONTENT_FORBIDDEN_TERMS) {
    const lowerTerm = term.toLowerCase();

    if (isPhrase(lowerTerm)) {
      const normalizedTerm = lowerTerm.replace(/-/g, " ");
      const normalizedText = lowerText.replace(/-/g, " ");
      if (normalizedText.includes(normalizedTerm)) {
        violations.push(`Forbidden ${category} term found: "${term}"`);
      }
    } else {
      const regex = new RegExp(`\\b${escapeRegex(lowerTerm)}\\b`, "i");
      if (regex.test(text)) {
        violations.push(`Forbidden ${category} term found: "${term}"`);
      }
    }
  }

  return violations;
}

// ============================================================
// COMBINED VALIDATION
// ============================================================

/**
 * Validate generated story for both quality and content safety.
 * Returns all errors found across all checks.
 */
export function validateGeneratedContent(story: GeneratedStory): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Quality validation
  const qualityResult = validateStoryQuality(story);
  errors.push(...qualityResult.errors);

  // 2. Content safety on all text fields
  const textsToCheck = [
    { text: story.intro, source: "intro" },
    { text: story.ending, source: "ending" },
    ...story.checkpoints.map((cp) => ({
      text: cp.prompt,
      source: `checkpoint ${cp.id}`,
    })),
    ...story.checkpoints.flatMap((cp) =>
      cp.choices.map((choice) => ({
        text: choice.text,
        source: `choice ${choice.id}`,
      }))
    ),
  ];

  for (const { text, source } of textsToCheck) {
    const violations = checkContentSafety(text);
    for (const violation of violations) {
      errors.push(`[${source}] ${violation}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// AI GENERATION
// ============================================================

export async function callAI(anthropic: Anthropic): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
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

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in API response");
  }

  return textContent.text.trim();
}

// ============================================================
// PERSISTENCE
// ============================================================

interface StoryWithMeta extends GeneratedStory {
  _meta: {
    generatedAt: string;
    model: string;
    generationVersion: string;
  };
}

export function saveStory(story: GeneratedStory, outputPath: string): void {
  const storyWithMeta: StoryWithMeta = {
    ...story,
    _meta: {
      generatedAt: new Date().toISOString(),
      model: MODEL,
      generationVersion: GENERATION_VERSION,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(storyWithMeta, null, 2), "utf-8");
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

async function main() {
  console.log("=== Story Generation Script ===\n");

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
  const outputPath = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "generated-story.json"
  );

  // Track errors across all attempts for final reporting
  const allAttemptErrors: { attempt: number; errors: string[] }[] = [];

  // ---- RETRY LOOP ----
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n--- Attempt ${attempt} of ${MAX_RETRIES} ---`);

    try {
      // Step 1: Generate story via AI
      console.log("Calling Claude API...");
      const rawJson = await callAI(anthropic);

      // Step 2: Parse JSON
      console.log("Parsing JSON response...");
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(rawJson);
      } catch (parseError) {
        const errorMsg = `JSON parse error: ${parseError}`;
        console.warn(`  ✗ ${errorMsg}`);
        allAttemptErrors.push({ attempt, errors: [errorMsg] });
        continue; // Retry
      }

      // Step 3: Validate with Zod schema
      console.log("Validating schema...");
      let validatedStory: GeneratedStory;
      try {
        validatedStory = generatedStorySchema.parse(parsedData);
      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          const zodErrors = zodError.issues.map(
            (e) => `${e.path.join(".")}: ${e.message}`
          );
          console.warn("  ✗ Schema validation failed:");
          zodErrors.forEach((e) => console.warn(`    - ${e}`));
          allAttemptErrors.push({ attempt, errors: zodErrors });
        } else {
          throw zodError;
        }
        continue; // Retry
      }

      // Step 4: Validate quality and content safety
      console.log("Validating quality and content safety...");
      const validationResult = validateGeneratedContent(validatedStory);

      if (!validationResult.valid) {
        console.warn("  ✗ Content validation failed:");
        validationResult.errors.forEach((e) => console.warn(`    - ${e}`));
        allAttemptErrors.push({ attempt, errors: validationResult.errors });
        continue; // Retry
      }

      // ---- SUCCESS ----
      console.log("  ✓ All validations passed!");
      console.log(`\nSaving story to ${outputPath}...`);
      saveStory(validatedStory, outputPath);

      console.log("\n=== Story Generated Successfully ===");
      console.log(`Title: ${validatedStory.title}`);
      console.log(`ID: ${validatedStory.id}`);
      console.log(`Checkpoints: ${validatedStory.checkpoints.length}`);
      console.log(
        `Choices: ${validatedStory.checkpoints.map((c) => c.choices.length).join(", ")}`
      );
      console.log(`\nStory saved to: ${outputPath}`);
      return; // Exit successfully

    } catch (error) {
      // Unexpected error (API failure, network error, etc.)
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(`  ✗ Unexpected error: ${errorMsg}`);
      allAttemptErrors.push({ attempt, errors: [errorMsg] });
      continue; // Retry
    }
  }

  // ---- ALL RETRIES FAILED ----
  console.error("\n=== Story Generation Failed ===");
  console.error(`All ${MAX_RETRIES} attempts failed.\n`);

  // Log summary of all attempt errors
  for (const { attempt, errors } of allAttemptErrors) {
    console.error(`Attempt ${attempt}:`);
    errors.forEach((e) => console.error(`  - ${e}`));
  }

  console.error(
    "\nThe app will fall back to the hardcoded story at runtime."
  );
  process.exit(1);
}

// Only run main when executed directly (not when imported)
if (require.main === module) {
  main();
}
