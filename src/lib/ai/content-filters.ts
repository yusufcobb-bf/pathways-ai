/**
 * Content Safety Filters
 *
 * Static content filtering for generated stories.
 * No AI - deterministic string matching only.
 *
 * Conservative defaults: better to flag false positives than miss unsafe content.
 */

// ----- Forbidden Terms -----
// Organized by category for clarity. Each term is either:
// - Single word: uses word-boundary regex (\b) to avoid partial matches
// - Phrase: uses substring matching

/**
 * Violence-related terms
 * Blocks content depicting physical harm or weapons
 */
const VIOLENCE_TERMS = [
  "fight",
  "hit",
  "punch",
  "kick",
  "hurt",
  "attack",
  "weapon",
  "gun",
  "knife",
  "blood",
  "kill",
  "dead",
  "death",
  "murder",
  "beat",
  "slap",
  "stab",
  "shoot",
  "strangle",
  "choke",
];

/**
 * Trauma-related terms
 * Blocks content depicting abuse, self-harm, or severe distress
 */
const TRAUMA_TERMS = [
  "abuse",
  "neglect",
  "abandon",
  "suicide",
  "self-harm", // phrase
  "cutting",
  "overdose",
  "trauma",
  "ptsd",
];

/**
 * Adult themes
 * Blocks content depicting substances, sexuality, or mature topics
 */
const ADULT_TERMS = [
  "drugs",
  "alcohol",
  "drunk",
  "beer",
  "wine",
  "cigarette",
  "smoking",
  "vape",
  "sex",
  "sexual",
  "naked",
  "dating",
  "weed",
  "marijuana",
  "cocaine",
  "heroin",
];

/**
 * Diagnosis language
 * Blocks clinical mental health terminology to avoid stigmatization
 * Matched as literal strings only - no inference
 */
const DIAGNOSIS_TERMS = [
  "adhd",
  "autism",
  "bipolar",
  "depression",
  "anxiety disorder", // phrase
  "ocd",
  "mentally ill", // phrase
  "crazy",
  "insane",
  "psycho",
  "schizophrenia",
  "anorexia",
  "bulimia",
];

/**
 * Combined forbidden terms list with category labels
 */
export const FORBIDDEN_TERMS: { term: string; category: string }[] = [
  ...VIOLENCE_TERMS.map((term) => ({ term, category: "violence" })),
  ...TRAUMA_TERMS.map((term) => ({ term, category: "trauma" })),
  ...ADULT_TERMS.map((term) => ({ term, category: "adult content" })),
  ...DIAGNOSIS_TERMS.map((term) => ({ term, category: "diagnosis language" })),
];

// ----- Allowed Themes -----
// Informational only - NOT enforced by checkContentSafety()
// Exported for documentation and potential future use

/**
 * Safe themes appropriate for ages 10-14
 * This list is informational only and is NOT used for validation.
 * Stories are NOT rejected for lacking these themes.
 */
export const ALLOWED_THEMES = [
  // School settings
  "school",
  "classroom",
  "cafeteria",
  "playground",
  "library",
  "gym",
  // Collaborative activities
  "teamwork",
  "group project",
  "collaboration",
  "cooperation",
  // Community
  "community",
  "neighborhood",
  "volunteer",
  "helping",
  // Social
  "peers",
  "friends",
  "classmates",
  "family",
  // Responsibility
  "responsibility",
  "chores",
  "homework",
  "practice",
] as const;

// ----- Content Safety Check -----

/**
 * Check if a term is a phrase (contains space or hyphen)
 */
function isPhrase(term: string): boolean {
  return term.includes(" ") || term.includes("-");
}

/**
 * Check text for content safety violations.
 *
 * @param text - Any text string (intro, prompt, choice, ending)
 * @returns Array of violation messages (empty array = safe)
 *
 * Behavior:
 * - Case-insensitive matching
 * - Single words use word-boundary regex to avoid partial matches
 *   (e.g., "hit" won't match "white")
 * - Phrases use substring matching
 * - Returns ALL violations found, not just the first
 * - Deterministic string matching only - no AI or semantic analysis
 */
export function checkContentSafety(text: string): string[] {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();

  for (const { term, category } of FORBIDDEN_TERMS) {
    const lowerTerm = term.toLowerCase();

    if (isPhrase(lowerTerm)) {
      // Phrase matching: use substring search
      // Normalize hyphens to spaces for matching
      const normalizedTerm = lowerTerm.replace(/-/g, " ");
      const normalizedText = lowerText.replace(/-/g, " ");

      if (normalizedText.includes(normalizedTerm)) {
        violations.push(`Forbidden ${category} term found: "${term}"`);
      }
    } else {
      // Single word: use word boundary regex
      // This prevents "hit" from matching "white" or "hitchhike"
      const regex = new RegExp(`\\b${escapeRegex(lowerTerm)}\\b`, "i");
      if (regex.test(text)) {
        violations.push(`Forbidden ${category} term found: "${term}"`);
      }
    }
  }

  return violations;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
