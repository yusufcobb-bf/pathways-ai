/**
 * Story Quality Heuristics
 *
 * Deterministic validation of generated stories for quality and safety.
 * No AI usage - pure logic checks.
 */

import { GeneratedStory } from "./story-schema";

export interface StoryQualityResult {
  valid: boolean;
  errors: string[];
}

// Forbidden words/phrases that indicate moral judgment
const FORBIDDEN_WORDS = [
  "right",
  "wrong",
  "should",
  "better choice",
  "best choice",
  "worst",
  "correct",
  "incorrect",
];

// ----- Helper Functions -----

/**
 * Normalize text for comparison:
 * - Convert to lowercase
 * - Remove punctuation
 * - Collapse multiple spaces
 * - Trim whitespace
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation, replace with space
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Count words in text (after normalization)
 */
function countWords(text: string): number {
  const normalized = normalizeText(text);
  if (normalized.length === 0) return 0;
  return normalized.split(" ").length;
}

/**
 * Extract sentences from text.
 * Splits on sentence-ending punctuation, normalizes each.
 */
function getSentences(text: string): string[] {
  // Split on . ! ? followed by space or end of string
  const raw = text.split(/[.!?]+/).map((s) => normalizeText(s));
  // Filter out empty sentences
  return raw.filter((s) => s.length > 0);
}

/**
 * Get set of normalized words from text
 */
function getWordSet(text: string): Set<string> {
  const normalized = normalizeText(text);
  if (normalized.length === 0) return new Set();
  return new Set(normalized.split(" "));
}

/**
 * Calculate Jaccard similarity between two sets.
 * Returns |intersection| / |union|
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1; // Both empty = identical

  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);

  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

// ----- Validation Checks -----

/**
 * Check 1: Intro word count must be between 80-300 words
 */
function checkIntroLength(story: GeneratedStory, errors: string[]): void {
  const wordCount = countWords(story.intro);
  if (wordCount < 80) {
    errors.push(`Intro too short: ${wordCount} words (minimum 80)`);
  }
  if (wordCount > 300) {
    errors.push(`Intro too long: ${wordCount} words (maximum 300)`);
  }
}

/**
 * Check 2: Must have exactly 3 checkpoints
 */
function checkCheckpointCount(story: GeneratedStory, errors: string[]): void {
  if (story.checkpoints.length !== 3) {
    errors.push(
      `Invalid checkpoint count: ${story.checkpoints.length} (must be exactly 3)`
    );
  }
}

/**
 * Check 3: Each checkpoint must introduce a NEW situation
 * (checkpoints should not be too similar to each other)
 */
function checkNewSituations(story: GeneratedStory, errors: string[]): void {
  const SIMILARITY_THRESHOLD = 0.6;

  for (let i = 0; i < story.checkpoints.length; i++) {
    for (let j = i + 1; j < story.checkpoints.length; j++) {
      const setA = getWordSet(story.checkpoints[i].prompt);
      const setB = getWordSet(story.checkpoints[j].prompt);
      const similarity = jaccardSimilarity(setA, setB);

      if (similarity > SIMILARITY_THRESHOLD) {
        errors.push(
          `Checkpoints ${story.checkpoints[i].id} and ${story.checkpoints[j].id} are too similar (${(similarity * 100).toFixed(0)}% overlap)`
        );
      }
    }
  }
}

/**
 * Check 4: Choices within each checkpoint must not be paraphrases
 */
function checkChoicesNotParaphrases(
  story: GeneratedStory,
  errors: string[]
): void {
  const SIMILARITY_THRESHOLD = 0.5;

  for (const checkpoint of story.checkpoints) {
    const choices = checkpoint.choices;

    for (let i = 0; i < choices.length; i++) {
      for (let j = i + 1; j < choices.length; j++) {
        const setA = getWordSet(choices[i].text);
        const setB = getWordSet(choices[j].text);
        const similarity = jaccardSimilarity(setA, setB);

        if (similarity > SIMILARITY_THRESHOLD) {
          errors.push(
            `Choices ${choices[i].id} and ${choices[j].id} appear to be paraphrases (${(similarity * 100).toFixed(0)}% similar)`
          );
        }
      }
    }
  }
}

/**
 * Check 5: No repeated sentences across checkpoints
 */
function checkNoRepeatedSentences(
  story: GeneratedStory,
  errors: string[]
): void {
  const allSentences: { sentence: string; source: string }[] = [];

  // Collect sentences from intro
  for (const sentence of getSentences(story.intro)) {
    allSentences.push({ sentence, source: "intro" });
  }

  // Collect sentences from checkpoints
  for (const checkpoint of story.checkpoints) {
    for (const sentence of getSentences(checkpoint.prompt)) {
      allSentences.push({ sentence, source: `checkpoint ${checkpoint.id}` });
    }
  }

  // Collect sentences from ending
  for (const sentence of getSentences(story.ending)) {
    allSentences.push({ sentence, source: "ending" });
  }

  // Check for duplicates
  const seen = new Map<string, string>();
  for (const { sentence, source } of allSentences) {
    if (sentence.length < 10) continue; // Skip very short sentences

    if (seen.has(sentence)) {
      errors.push(
        `Repeated sentence found in ${seen.get(sentence)} and ${source}: "${sentence.substring(0, 50)}..."`
      );
    } else {
      seen.set(sentence, source);
    }
  }
}

/**
 * Check 6: No forbidden words that indicate moral judgment
 */
function checkNoForbiddenWords(story: GeneratedStory, errors: string[]): void {
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
    const lowerText = text.toLowerCase();

    for (const forbidden of FORBIDDEN_WORDS) {
      // Use word boundary check for single words, direct check for phrases
      if (forbidden.includes(" ")) {
        // Phrase check
        if (lowerText.includes(forbidden)) {
          errors.push(`Forbidden phrase "${forbidden}" found in ${source}`);
        }
      } else {
        // Word boundary check using regex
        const regex = new RegExp(`\\b${forbidden}\\b`, "i");
        if (regex.test(text)) {
          errors.push(`Forbidden word "${forbidden}" found in ${source}`);
        }
      }
    }
  }
}

/**
 * Check 8: Each choice must have at least 5 words
 */
function checkMinimumChoiceLength(
  story: GeneratedStory,
  errors: string[]
): void {
  const MIN_WORDS = 5;

  for (const checkpoint of story.checkpoints) {
    for (const choice of checkpoint.choices) {
      const wordCount = countWords(choice.text);
      if (wordCount < MIN_WORDS) {
        errors.push(
          `Choice ${choice.id} has only ${wordCount} words (minimum ${MIN_WORDS})`
        );
      }
    }
  }
}

// ----- Main Validation Function -----

/**
 * Validate a generated story for quality and safety.
 * Returns all errors found, not just the first.
 * Never throws - always returns a result object.
 */
export function validateStoryQuality(story: GeneratedStory): StoryQualityResult {
  const errors: string[] = [];

  // Run all checks
  checkIntroLength(story, errors);
  checkCheckpointCount(story, errors);
  checkNewSituations(story, errors);
  checkChoicesNotParaphrases(story, errors);
  checkNoRepeatedSentences(story, errors);
  checkNoForbiddenWords(story, errors);
  checkMinimumChoiceLength(story, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}
